const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const values = new Int16Array(256).fill(-1);
for (let index = 0; index < alphabet.length; index++) values[alphabet.charCodeAt(index)] = index;

export function encodeBase64(bytes: Uint8Array): string {
  const chunks: string[] = []; let chunk = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index], b = bytes[index + 1] ?? 0, c = bytes[index + 2] ?? 0;
    chunk += alphabet[a >> 2] + alphabet[((a & 3) << 4) | (b >> 4)] + (index + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >> 6)] : '=') + (index + 2 < bytes.length ? alphabet[c & 63] : '=');
    if (chunk.length >= 8192) { chunks.push(chunk); chunk = ''; }
  }
  return chunks.join('') + chunk;
}

/** The checkpoint format requires nonempty input and bounds allocation before decoding. */
export function decodeBase64(text: string): Uint8Array {
  if (!text.length || text.length % 4 || text.length > 28_000_000) throw new Error('Invalid checkpoint encoding');
  const padding = text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0, end = text.length - padding, size = text.length / 4 * 3 - padding;
  const bytes = new Uint8Array(size); let cursor = 0;
  for (let index = 0; index < text.length; index += 4) {
    const a = values[text.charCodeAt(index)] ?? -1, b = values[text.charCodeAt(index + 1)] ?? -1;
    const c = index + 2 >= end ? 0 : values[text.charCodeAt(index + 2)] ?? -1, d = index + 3 >= end ? 0 : values[text.charCodeAt(index + 3)] ?? -1;
    if ((a | b | c | d) < 0) throw new Error('Invalid checkpoint encoding');
    if (cursor < size) bytes[cursor++] = a << 2 | b >> 4;
    if (cursor < size) bytes[cursor++] = (b & 15) << 4 | c >> 2;
    if (cursor < size) bytes[cursor++] = (c & 3) << 6 | d;
  }
  return bytes;
}
