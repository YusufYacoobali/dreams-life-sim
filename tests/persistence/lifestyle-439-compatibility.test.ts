import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
const capture = JSON.parse(gunzipSync(readFileSync(join(__dirname, '../fixtures/lifestyle-439-decisions.json.gz'))).toString()) as { producerCommit: string; worlds: { templateId: string; world: string; outcomes: { choiceId: string; sha256: string }[] }[] };
test('compatibility capture comes from the isolated published implementation', () => {
  expect(capture.producerCommit).toBe('439aa14d80bd03da41d00889adabfb9fb246c0a3'); expect(capture.worlds).toHaveLength(60);
});
test.each(capture.worlds.flatMap(row => row.outcomes.map(outcome => ({ ...row, outcome }))))('$templateId / $outcome.choiceId retains the entire published outcome', ({ world, outcome }) => {
  const saved = decodeWorld(world); expect(encodeWorld(saved)).toBe(world);
  const resolved = resolveCommand(saved, { type: 'choose', eventId: saved.pending!.id, choiceId: outcome.choiceId }, true);
  expect(createHash('sha256').update(encodeWorld(resolved)).digest('hex')).toBe(outcome.sha256);
});
