import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decodeWorld, encodeWorld, moneyJSON } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
const data = JSON.parse(readFileSync(join(__dirname, '../fixtures/lifestyle-stage1-compatibility.json'), 'utf8'), (_key, value) => value && typeof value === 'object' && Object.keys(value).length === 1 && typeof value.$dreamsBigInt === 'string' ? BigInt(value.$dreamsBigInt) : value) as { producerCommit: string; cases: { name: string; world: string; command: GameCommand; outcomeSha256: string }[] };
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
test.each(data.cases)('$name keeps the exact complete first-stage outcome when future revisions are absent', record => {
  expect(data.producerCommit).toBe('fdfd7a5f'); const world = decodeWorld(record.world);
  expect(encodeWorld(world)).toBe(record.world);
  expect(sha(encodeWorld(resolveCommand(world, record.command)))).toBe(record.outcomeSha256);
});
