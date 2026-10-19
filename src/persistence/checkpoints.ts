import { gzipSync, gunzipSync, strFromU8, strToU8 } from 'fflate';
import { z } from 'zod';
import { decodeWorld, encodeWorld, World } from '../game/model';
import { encodeBase64 as base64, decodeBase64 as unbase64 } from './base64';
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
