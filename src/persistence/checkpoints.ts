import { gzipSync, gunzipSync, strFromU8, strToU8 } from 'fflate';
import { z } from 'zod';
import { decodeWorld, encodeWorld, World } from '../game/model';
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function base64(bytes: Uint8Array): string {
  const chunks: string[] = []; let chunk = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index], b = bytes[index + 1] ?? 0, c = bytes[index + 2] ?? 0;
    chunk += alphabet[a >> 2] + alphabet[((a & 3) << 4) | (b >> 4)] + (index + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >> 6)] : '=') + (index + 2 < bytes.length ? alphabet[c & 63] : '=');
    if (chunk.length >= 8192) { chunks.push(chunk); chunk = ''; }
  }
  return chunks.join('') + chunk;
}
function unbase64(text: string): Uint8Array {
  if (!text.length || text.length % 4 || text.length > 28_000_000) throw new Error('Invalid checkpoint encoding');
  const padding = text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0, size = text.length / 4 * 3 - padding;
  const bytes = new Uint8Array(size); let cursor = 0;
  for (let index = 0; index < text.length; index += 4) {
    const values = [0, 1, 2, 3].map(offset => { const char = text[index + offset]; if (char === '=' && index + offset >= text.length - padding) return 0; const value = alphabet.indexOf(char); if (value < 0) throw new Error('Invalid checkpoint encoding'); return value; });
    if (cursor < size) bytes[cursor++] = values[0] << 2 | values[1] >> 4;
    if (cursor < size) bytes[cursor++] = (values[1] & 15) << 4 | values[2] >> 2;
    if (cursor < size) bytes[cursor++] = (values[2] & 3) << 6 | values[3];
  }
  return bytes;
}
function fingerprint(bytes: Uint8Array) {
  let hash = 2166136261;
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
  return hash.toString(16).padStart(8, '0');
}
const checkpointSchema = z.object({ format: z.literal('dreams-checkpoint-v1'), bytes: z.number().int().positive().max(20_000_000), hash: z.string().regex(/^[a-f0-9]{8}$/), data: z.string().max(28_000_000) });
export function packCheckpoint(world: World): string {
  const bytes = strToU8(encodeWorld(world));
  if (bytes.length > 20_000_000) throw new Error('This checkpoint exceeds the supported world size');
  return JSON.stringify({ format: 'dreams-checkpoint-v1', bytes: bytes.length, hash: fingerprint(bytes), data: base64(gzipSync(bytes, { level: 4, mtime: 0 })) });
}
export function unpackCheckpoint(payload: string): World {
  const parsed = JSON.parse(payload);
  if (parsed?.format !== 'dreams-checkpoint-v1') return decodeWorld(payload);
  const checkpoint = checkpointSchema.parse(parsed), compressed = unbase64(checkpoint.data);
  // Match the gzip trailer before allocating; the declared output buffer caps decompression.
  const length = compressed.length;
  if (length < 18 || (compressed[length - 4] | compressed[length - 3] << 8 | compressed[length - 2] << 16 | compressed[length - 1] << 24) >>> 0 !== checkpoint.bytes) throw new Error('Checkpoint size is inconsistent');
  const bytes = gunzipSync(compressed, { out: new Uint8Array(checkpoint.bytes) });
  if (bytes.length !== checkpoint.bytes || fingerprint(bytes) !== checkpoint.hash) throw new Error('Checkpoint is damaged');
  return decodeWorld(strFromU8(bytes));
}
