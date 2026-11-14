import { decodeWorld, immutableWorld } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { committedCues } from '../../src/feedback/committedCue';
import * as progress from '../../src/progression/progress';
import graduate from '../fixtures/v3-employed-graduate.json';

test('successive committed commands reuse only the immutable previous progress calculation', () => {
  const before = immutableWorld(decodeWorld(JSON.stringify(graduate))), person = before.people[before.activePersonId];
  const command: GameCommand = { type: 'health-routine', routine: { ...person.health.routine, mindfulness: !person.health.routine.mindfulness } };
  const after = resolveCommand(before, command, true);
  const acknowledge: GameCommand = { type: 'acknowledge', resultId: after.pending!.id };
  const next = resolveCommand(after, acknowledge, true);
  const read = jest.spyOn(progress, 'lifeProgress');
  try {
    expect(committedCues(before, after, command)).toEqual([]);
    expect(read).toHaveBeenCalledTimes(2);
    expect(committedCues(after, next, acknowledge)).toEqual([]);
    expect(read).toHaveBeenCalledTimes(3);
    expect(committedCues(after, next, acknowledge)).toEqual([]);
    expect(read).toHaveBeenCalledTimes(3);
  } finally { read.mockRestore(); }
});

test('mutable and externally frozen worlds recompute changed retained achievements', () => {
  const before = decodeWorld(JSON.stringify(graduate)), after = decodeWorld(JSON.stringify(graduate));
  before.workHistory.forEach(row => { row.monthsWorked = 0; });
  after.workHistory.forEach(row => { row.monthsWorked = 0; });
  after.revision = before.revision + 1;
  // Object.freeze alone must never acquire the model's private certificate.
  Object.freeze(after);
  const command: GameCommand = { type: 'resume' }, read = jest.spyOn(progress, 'lifeProgress');
  try {
    expect(committedCues(before, after, command)).toEqual([]);
    after.workHistory[0].monthsWorked = 120;
    expect(committedCues(before, after, command)).toEqual(['big-success']);
    expect(read).toHaveBeenCalledTimes(4);
  } finally { read.mockRestore(); }
});
