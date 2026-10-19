import { gunzipSync, strFromU8, strToU8 } from 'fflate';
import { decodeBase64, encodeBase64 } from '../../src/persistence/base64';
import archive from '../fixtures/v23-school-plans-archive.json';

test.each([1, 2, 3, 4, 5, 31, 128, 1024, 1025, 16384, 1000003])('checkpoint encoding preserves all %s bytes, chunk boundaries and each padding form', length => {
  const bytes = Uint8Array.from({ length }, (_, i) => (i * 83 + (i >>> 8) * 17) % 256), expected = Buffer.from(bytes).toString('base64');
  expect(encodeBase64(bytes)).toBe(expected);
  expect(Buffer.from(decodeBase64(expected)).equals(Buffer.from(bytes))).toBe(true);
});
test('UTF-8 world text and the genuine archived compressed bytes retain their exact representation', () => {
  const bytes = strToU8('João · Élise · ₹ · ¥ · 👶 · 日本'), expected = Buffer.from(bytes).toString('base64');
  expect(encodeBase64(bytes)).toBe(expected); expect(strFromU8(decodeBase64(expected))).toBe('João · Élise · ₹ · ¥ · 👶 · 日本');
  const checkpoint = JSON.parse(archive.checkpoint), compressed = decodeBase64(checkpoint.data);
  expect(Buffer.from(compressed)).toEqual(Buffer.from(checkpoint.data, 'base64')); expect(encodeBase64(compressed)).toBe(checkpoint.data);
  const original = JSON.parse(strFromU8(gunzipSync(compressed))); expect(original.contentVersion).toBe(2);
  expect(original.storyThreads.map((item: { status: string }) => item.status)).toEqual(['scheduled', 'resolved']);
});
test.each(['', 'A', '====', 'A===', '=AAA', 'AA=A', 'AAAAéAAA', 'AAAA🙂AA', 'A\nAA', ' AA=', 'AAA\t'])('malformed checkpoint base64 %j is rejected', text => {
  expect(() => decodeBase64(text)).toThrow('Invalid checkpoint encoding');
});
test('oversized checkpoint encoding is rejected and empty encoding preserves the existing encoder contract', () => {
  expect(() => decodeBase64('A'.repeat(28000004))).toThrow('Invalid checkpoint encoding');
  expect(encodeBase64(new Uint8Array())).toBe('');
});
