import { gzipSync, gunzipSync, strFromU8, strToU8 } from 'fflate';
import { z } from 'zod';
import { decodeWorld, encodeWorld, moneyJSON, worldForEncoding, World } from '../game/model';
import { encodeBase64 as base64, decodeBase64 as unbase64 } from './base64';
function fingerprint(bytes: Uint8Array) {
  let hash = 2166136261;
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
}
const maxBytes = 20_000_000;
const partSchema = z.object({ bytes: z.number().int().positive().max(maxBytes), hash: z.string().regex(/^[a-f0-9]{8}$/), data: z.string().max(28_000_000) });
const checkpointSchema = partSchema.extend({ format: z.literal('dreams-checkpoint-v1') });
const chunkedSchema = z.object({ format: z.literal('dreams-checkpoint-v2'), bytes: z.number().int().positive().max(maxBytes), main: partSchema, ledger: z.array(partSchema).min(1).max(512) });
type Part = z.infer<typeof partSchema>;
const chunkSize = 512;
const ledgerCache = new WeakMap<object, { rows: World['ledger']; part: Part }>();
function packText(text: string): Part {
  const bytes = strToU8(text);
  if (bytes.length > maxBytes) throw new Error('This checkpoint exceeds the supported world size');
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
  if (world.ledger.length < chunkSize) return JSON.stringify({ format: 'dreams-checkpoint-v1', ...packText(encodeWorld(world)) });
  const checked = worldForEncoding(world), ledger: Part[] = [];
  const { ledger: _ledger, ...body } = checked;
  const main = packText(JSON.stringify(body, moneyJSON));
  let bytes = main.bytes;
  for (let offset = 0; offset < checked.ledger.length; offset += chunkSize) {
    const rows = checked.ledger.slice(offset, offset + chunkSize), cached = ledgerCache.get(rows[0]);
    if (cached && cached.rows.length === rows.length && rows.every((row, index) => row === cached.rows[index])) ledger.push(cached.part);
    else {
      const part = packText(JSON.stringify(rows, moneyJSON)); ledger.push(part);
      // Mutable input never seeds the cache; certification freezes every ledger row.
      if (rows.every(row => Object.isFrozen(row))) ledgerCache.set(rows[0], { rows, part });
    }
    bytes += ledger[ledger.length - 1].bytes;
    if (bytes + 16 > maxBytes || ledger.length > 512) throw new Error('This checkpoint exceeds the supported world size');
  }
  return JSON.stringify({ format: 'dreams-checkpoint-v2', bytes, main, ledger });
}
export function unpackCheckpoint(payload: string, immutable = false): World {
  if (payload.length > 28_000_000) throw new Error('This checkpoint exceeds the supported world size');
  const parsed = JSON.parse(payload);
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
