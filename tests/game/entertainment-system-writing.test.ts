import { resolveCommand } from '../../src/game/engine';
import { copyWorld, encodeWorld } from '../../src/game/model';
import * as common from '../../src/game/systems/common';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { arrangedCriticismRoll, criticismPost, criticismProfile } from '../support/criticismFixture';

afterEach(() => jest.restoreAllMocks());

test.each(['apologise', 'clarify', 'ignore'] as const)('a failed %s response at zero public image describes the reception without inventing another image drop', response => {
  // Explicit boundary setup, not evidence of a natural criticism encounter.
  const initial = copyWorld(criticismProfile());
  initial.people[initial.activePersonId].publicLife.image = 0;
  const before = arrangedCriticismRoll(initial), actualDraw = common.draw;
  const draw = jest.spyOn(common, 'draw').mockImplementation((world, stream, min, max) => {
    const value = actualDraw(world, stream, min, max);
    return stream === 'outcomes' && min === 1 && max === 100 ? 100 : value;
  });
  const pending = resolveCommand(before, criticismPost(before), true);
  draw.mockRestore();
  expect(pending.controversies.at(-1)?.responseRoll).toBe(100);
  if (pending.pending?.kind !== 'decision' || pending.pending.templateId !== 'public-controversy') throw new Error('Expected actual criticism decision');
  const selected = { type: 'choose' as const, eventId: pending.pending.id, choiceId: response };
  const next = resolveCommand(pending, selected, true);
  expect(next.people[next.activePersonId].publicLife.image).toBe(0);
  expect(next.pending).toMatchObject({ kind: 'result', effects: [{ id: 'image', label: 'Public image', value: '+0%' }] });
  expect(next.pending!.body).not.toMatch(/image.*(?:slips|falls|takes another hit)/i);
  expect(next.random).toEqual(pending.random);
  expect(next.ledger).toEqual(pending.ledger);
  expect(encodeWorld(resolveCommand(unpackCheckpoint(packCheckpoint(pending), true), selected, true))).toBe(encodeWorld(next));
});
