import { gzipSync, gunzipSync, strFromU8, strToU8 } from 'fflate';
import { z } from 'zod';
import { decodeWorld, moneyJSON, worldForEncoding, World } from '../game/model';
import { encodeBase64 as base64, decodeBase64 as unbase64 } from './base64';
function fingerprint(bytes: Uint8Array) {
  let hash = 2166136261;
  for (let index = 0, length = bytes.length; index < length; index++) hash = Math.imul(hash ^ bytes[index], 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
}
const maxBytes = 20_000_000;
const maxTupleBytes = 32_000_000;
const maxCanonicalBytes = 80_000_000;
const partSchema = z.object({ bytes: z.number().int().positive().max(maxBytes), hash: z.string().regex(/^[a-f0-9]{8}$/), data: z.string().max(28_000_000) });
const checkpointSchema = partSchema.extend({ format: z.literal('dreams-checkpoint-v1') });
const chunkedSchema = z.object({ format: z.literal('dreams-checkpoint-v2'), bytes: z.number().int().positive().max(maxBytes), main: partSchema, ledger: z.array(partSchema).min(1).max(512) });
const peopleChunkedSchema = z.object({ format: z.literal('dreams-checkpoint-v3'), bytes: z.number().int().positive().max(maxBytes), main: partSchema, people: z.array(partSchema).min(1).max(512), ledger: z.array(partSchema).max(512) });
const tuplePartSchema = partSchema.extend({ bytes: z.number().int().positive().max(maxTupleBytes), data: z.string().max(44_000_000) });
const tupleChunkedSchema = z.object({
  format: z.literal('dreams-checkpoint-v4'), bytes: z.number().int().positive().max(maxTupleBytes), main: tuplePartSchema,
  people: z.array(tuplePartSchema).min(1).max(512), ledger: z.array(tuplePartSchema).max(512),
  columns: z.array(z.string().min(1).max(64).refine(key => !['__proto__', 'constructor', 'prototype'].includes(key))).max(32),
}).refine(frame => new Set(frame.columns).size === frame.columns.length && (frame.ledger.length ? frame.columns.length > 0 : frame.columns.length === 0), 'Invalid checkpoint columns');
type Part = z.infer<typeof partSchema>;
const chunkSize = 512;
const peopleChunkSize = 32;
const ledgerCache = new WeakMap<object, { rows: World['ledger']; part: Part; columns?: string }>();
const ledgerMoney = new Set(['cashDelta', 'debtDelta']);
const integerText = /^-?(?:0|[1-9]\d*)$/;
const moneyWrapperBytes = JSON.stringify({ $dreamsBigInt: '' }).length - 2;
const rowExpansion = (columns: readonly string[]) => columns.reduce((sum, key) => sum + strToU8(JSON.stringify(key)).length + 1 + (ledgerMoney.has(key) ? moneyWrapperBytes : 0), 0);
// Exact content is the key: changing any mutable field invalidates its block.
// Bound both the entry count and the retained text/compressed string weight.
const peopleCache = new Map<string, { part: Part; weight: number }>();
const maxPeopleCacheWeight = 8 * 1024 * 1024;
let peopleCacheWeight = 0;
function cachePeoplePart(text: string, part: Part) {
  const weight = 2 * (text.length + part.data.length);
  if (weight > maxPeopleCacheWeight) return;
  const previous = peopleCache.get(text);
  if (previous) { peopleCache.delete(text); peopleCacheWeight -= previous.weight; }
  while (peopleCache.size >= 64 || peopleCacheWeight + weight > maxPeopleCacheWeight) {
    const oldest = peopleCache.keys().next().value;
    if (oldest === undefined) break;
    peopleCacheWeight -= peopleCache.get(oldest)!.weight; peopleCache.delete(oldest);
  }
  peopleCache.set(text, { part, weight }); peopleCacheWeight += weight;
}
function packPeopleText(text: string, certified: boolean): Part {
  const cached = peopleCache.get(text);
  if (cached) { peopleCache.delete(text); peopleCache.set(text, cached); return cached.part; }
  const part = packText(text, maxTupleBytes);
  if (certified) cachePeoplePart(text, part);
  return part;
}
function packText(text: string, limit = maxBytes): Part {
  const bytes = strToU8(text);
  if (bytes.length > limit) throw new Error('This checkpoint exceeds the supported world size');
  return { bytes: bytes.length, hash: fingerprint(bytes), data: base64(gzipSync(bytes, { level: 4, mtime: 0 })) };
}
function unpackText(checkpoint: Part): string {
  const compressed = unbase64(checkpoint.data), length = compressed.length;
  // Check the trailer before allocating; each output and their combined total are bounded.
  if (length < 18 || (compressed[length - 4] | compressed[length - 3] << 8 | compressed[length - 2] << 16 | compressed[length - 1] << 24) >>> 0 !== checkpoint.bytes) throw new Error('Checkpoint size is inconsistent');
  const bytes = gunzipSync(compressed, { out: new Uint8Array(checkpoint.bytes) });
  if (bytes.length !== checkpoint.bytes || fingerprint(bytes) !== checkpoint.hash) throw new Error('Checkpoint is damaged');
  return strFromU8(bytes);
}
export function packCheckpoint(world: World): string {
  const checked = worldForEncoding(world), entries = Object.entries(checked.people);
  if (checked.ledger.length < chunkSize && entries.length <= peopleChunkSize) {
    const text = JSON.stringify(checked, moneyJSON);
    if (text.length <= maxBytes / 3 || strToU8(text).length <= maxBytes) return JSON.stringify({ format: 'dreams-checkpoint-v1', ...packText(text) });
  }
  const columns = Object.keys(checked.ledger[0] ?? {}) as (keyof World['ledger'][number])[], signature = JSON.stringify(columns), expansion = rowExpansion(columns);
  if (columns.length > 32 || columns.some(key => !key.length || key.length > 64 || ['__proto__', 'constructor', 'prototype'].includes(key))) throw new Error('Unsupported checkpoint transaction fields');
  const ledger: Part[] = [], people: Part[] = [];
  const { ledger: _ledger, people: _people, ...body } = checked;
  const main = packText(JSON.stringify(body, moneyJSON), maxTupleBytes);
  let bytes = main.bytes;
  for (let offset = 0; offset < entries.length; offset += peopleChunkSize) {
    const group: World['people'] = Object.create(null);
    for (const [id, person] of entries.slice(offset, offset + peopleChunkSize)) group[id] = person;
    const part = packPeopleText(JSON.stringify(group, moneyJSON), Object.isFrozen(checked.people));
    people.push(part); bytes += part.bytes;
    if (bytes + 32 > maxTupleBytes || people.length > 512) throw new Error('This checkpoint exceeds the supported world size');
  }
  for (let offset = 0; offset < checked.ledger.length; offset += chunkSize) {
    const rows = checked.ledger.slice(offset, offset + chunkSize), cached = ledgerCache.get(rows[0]);
    if (cached?.columns === signature && cached.rows.length === rows.length && rows.every((row, index) => row === cached.rows[index])) ledger.push(cached.part);
    else {
      const tuples = rows.map(row => {
        if (JSON.stringify(Object.keys(row)) !== signature || columns.some(key => row[key] === undefined)) throw new Error('Unsupported checkpoint transaction fields');
        return columns.map(key => ledgerMoney.has(key) ? String(row[key]) : row[key]);
      });
      const part = packText(JSON.stringify(tuples), maxTupleBytes); ledger.push(part);
      // Mutable input never seeds the cache; certification freezes every ledger row.
      if (rows.every(row => Object.isFrozen(row))) ledgerCache.set(rows[0], { rows, part, columns: signature });
    }
    bytes += ledger[ledger.length - 1].bytes;
    if (bytes + 32 > maxTupleBytes || bytes + checked.ledger.length * expansion + 32 > maxCanonicalBytes || ledger.length > 512) throw new Error('This checkpoint exceeds the supported world size');
  }
  const payload = JSON.stringify({ format: 'dreams-checkpoint-v4', bytes, main, people, columns, ledger });
  if (payload.length > 44_000_000) throw new Error('This checkpoint exceeds the supported world size');
  return payload;
}
export function unpackCheckpoint(payload: string, immutable = false, primePeopleCache = true): World {
  if (payload.length > 44_000_000) throw new Error('This checkpoint exceeds the supported world size');
  const parsed = JSON.parse(payload);
  if (parsed?.format === 'dreams-checkpoint-v4') {
    const checkpoint = tupleChunkedSchema.parse(parsed);
    if (checkpoint.bytes + 32 > maxTupleBytes || checkpoint.main.bytes + [...checkpoint.people, ...checkpoint.ledger].reduce((sum, part) => sum + part.bytes, 0) !== checkpoint.bytes) throw new Error('Checkpoint size is inconsistent');
    const main = unpackText(checkpoint.main), root = JSON.parse(main);
    if (!root || typeof root !== 'object' || Array.isArray(root) || 'people' in root || 'ledger' in root || main.at(-1) !== '}') throw new Error('Invalid checkpoint body');
    const peopleTexts = checkpoint.people.map(part => unpackText(part)), seen = new Set<string>();
    const peopleLengths = peopleTexts.map(text => {
      const group: unknown = JSON.parse(text);
      if (!group || typeof group !== 'object' || Array.isArray(group) || text[0] !== '{' || text.at(-1) !== '}') throw new Error('Invalid checkpoint people');
      const ids = Object.keys(group);
      if (!ids.length || ids.length > peopleChunkSize) throw new Error('Invalid checkpoint people');
      for (const id of ids) { if (seen.has(id)) throw new Error('Duplicate checkpoint person'); seen.add(id); }
      return ids.length;
    });
    if (peopleLengths.slice(0, -1).some(length => length !== peopleChunkSize)) throw new Error('Invalid checkpoint people');
    const expansion = rowExpansion(checkpoint.columns), lengths: number[] = [], chunks: string[] = []; let count = 0;
    for (const part of checkpoint.ledger) {
      const text = unpackText(part), rows: unknown = JSON.parse(text);
      if (!Array.isArray(rows) || !rows.length || rows.length > chunkSize || text[0] !== '[' || text.at(-1) !== ']') throw new Error('Invalid checkpoint ledger');
      lengths.push(rows.length); count += rows.length;
      // Bound canonical expansion before constructing objects or the final JSON.
      if (checkpoint.bytes + count * expansion + 32 > maxCanonicalBytes) throw new Error('This checkpoint exceeds the supported world size');
      chunks.push(JSON.stringify(rows.map((row: unknown) => {
        if (!Array.isArray(row) || row.length !== checkpoint.columns.length) throw new Error('Invalid checkpoint transaction');
        return Object.fromEntries(checkpoint.columns.map((key, index) => {
          const value: unknown = row[index];
          if (ledgerMoney.has(key)) {
            if (typeof value !== 'string' || !integerText.test(value)) throw new Error('Invalid checkpoint transaction money');
            return [key, { $dreamsBigInt: value }];
          }
          return [key, value];
        }));
      })));
    }
    if (lengths.slice(0, -1).some(length => length !== chunkSize)) throw new Error('Invalid checkpoint ledger');
    const text = main.slice(0, -1) + ',"people":{' + peopleTexts.map(chunk => chunk.slice(1, -1)).join(',') + '},"ledger":[' + chunks.map(chunk => chunk.slice(1, -1)).join(',') + ']}';
    const world = decodeWorld(text, immutable, maxCanonicalBytes);
    // No persisted tuple or person part is trusted before full world validation.
    if (immutable) {
      if (primePeopleCache) checkpoint.people.forEach((part, index) => cachePeoplePart(peopleTexts[index], part));
      if (root.schemaVersion === world.schemaVersion && root.engineVersion === world.engineVersion && root.contentVersion === world.contentVersion && count === world.ledger.length) {
        const signature = JSON.stringify(checkpoint.columns);
        checkpoint.ledger.forEach((part, index) => { const rows = world.ledger.slice(index * chunkSize, (index + 1) * chunkSize); if (rows.length) ledgerCache.set(rows[0], { rows, part, columns: signature }); });
      }
    }
    return world;
  }
  if (payload.length > 28_000_000) throw new Error('This checkpoint exceeds the supported world size');
  if (parsed?.format === 'dreams-checkpoint-v3') {
    const checkpoint = peopleChunkedSchema.parse(parsed);
    if (checkpoint.bytes + 32 > maxBytes || checkpoint.main.bytes + [...checkpoint.people, ...checkpoint.ledger].reduce((sum, part) => sum + part.bytes, 0) !== checkpoint.bytes) throw new Error('Checkpoint size is inconsistent');
    const main = unpackText(checkpoint.main), root = JSON.parse(main);
    if (!root || typeof root !== 'object' || Array.isArray(root) || 'people' in root || 'ledger' in root || main.at(-1) !== '}') throw new Error('Invalid checkpoint body');
    const peopleTexts = checkpoint.people.map(part => unpackText(part)), seen = new Set<string>();
    const peopleLengths = peopleTexts.map(text => {
      const group: unknown = JSON.parse(text);
      if (!group || typeof group !== 'object' || Array.isArray(group) || text[0] !== '{' || text.at(-1) !== '}') throw new Error('Invalid checkpoint people');
      const ids = Object.keys(group);
      if (!ids.length || ids.length > peopleChunkSize) throw new Error('Invalid checkpoint people');
      for (const id of ids) { if (seen.has(id)) throw new Error('Duplicate checkpoint person'); seen.add(id); }
      return ids.length;
    });
    if (peopleLengths.slice(0, -1).some(length => length !== peopleChunkSize)) throw new Error('Invalid checkpoint people');
    const ledgerTexts = checkpoint.ledger.map(part => unpackText(part));
    const ledgerLengths = ledgerTexts.map(text => {
      const rows: unknown = JSON.parse(text);
      if (!Array.isArray(rows) || !rows.length || rows.length > chunkSize || text[0] !== '[' || text.at(-1) !== ']') throw new Error('Invalid checkpoint ledger');
      return rows.length;
    });
    if (ledgerLengths.slice(0, -1).some(length => length !== chunkSize)) throw new Error('Invalid checkpoint ledger');
    const text = main.slice(0, -1) + ',"people":{' + peopleTexts.map(chunk => chunk.slice(1, -1)).join(',') + '},"ledger":[' + ledgerTexts.map(chunk => chunk.slice(1, -1)).join(',') + ']}';
    const world = decodeWorld(text, immutable);
    // A persisted block cannot prime either cache until the complete world
    // passes all shape and cross-system integrity checks.
    if (immutable) {
      if (primePeopleCache) checkpoint.people.forEach((part, index) => cachePeoplePart(peopleTexts[index], part));
      if (root.schemaVersion === world.schemaVersion && root.engineVersion === world.engineVersion && root.contentVersion === world.contentVersion && ledgerLengths.reduce((sum, length) => sum + length, 0) === world.ledger.length) {
        checkpoint.ledger.forEach((part, index) => { const rows = world.ledger.slice(index * chunkSize, (index + 1) * chunkSize); if (rows.length) ledgerCache.set(rows[0], { rows, part }); });
      }
    }
    return world;
  }
  if (parsed?.format === 'dreams-checkpoint-v2') {
    const checkpoint = chunkedSchema.parse(parsed);
    if (checkpoint.bytes + 16 > maxBytes || checkpoint.main.bytes + checkpoint.ledger.reduce((sum, part) => sum + part.bytes, 0) !== checkpoint.bytes) throw new Error('Checkpoint size is inconsistent');
    const main = unpackText(checkpoint.main), chunks = checkpoint.ledger.map(part => unpackText(part));
    const root = JSON.parse(main);
    if (!root || typeof root !== 'object' || Array.isArray(root) || 'ledger' in root || main.at(-1) !== '}') throw new Error('Invalid checkpoint ledger');
    // Validate framing before joining; decodeWorld still validates every original row and all cross-system references.
    const lengths = chunks.map(chunk => {
      const rows: unknown = JSON.parse(chunk);
      if (!Array.isArray(rows) || !rows.length || rows.length > chunkSize || chunk[0] !== '[' || chunk.at(-1) !== ']') throw new Error('Invalid checkpoint ledger');
      return rows.length;
    });
    if (lengths.slice(0, -1).some(length => length !== chunkSize)) throw new Error('Invalid checkpoint ledger');
    const text = main.slice(0, -1) + ',"ledger":[' + chunks.map(chunk => chunk.slice(1, -1)).join(',') + ']}';
    const world = decodeWorld(text, immutable);
    // Prime reusable blocks only after the complete persisted world passes validation.
    if (immutable && root.schemaVersion === world.schemaVersion && root.engineVersion === world.engineVersion && root.contentVersion === world.contentVersion && lengths.reduce((sum, length) => sum + length, 0) === world.ledger.length) {
      checkpoint.ledger.forEach((part, index) => { const rows = world.ledger.slice(index * chunkSize, (index + 1) * chunkSize); if (rows.length) ledgerCache.set(rows[0], { rows, part }); });
    }
    return world;
  }
  if (parsed?.format !== 'dreams-checkpoint-v1') return decodeWorld(payload, immutable);
  const checkpoint = checkpointSchema.parse(parsed);
  return decodeWorld(unpackText(checkpoint), immutable);
}
