import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GameCommand } from '../../src/game/engine';
import type { World } from '../../src/game/model';
import { ageOn } from '../../src/game/personHelpers';

/** Optional evidence from the existing natural lifetime test. Observes the exact
 * commands/results; does not choose a response or consume a random draw. */
export function writingLifeReview(seed: number, initial: World) {
  const directory = process.env.DREAMS_WRITING_REVIEW_DIR;
  if (!directory) return;
  const decisions: unknown[] = [];
  return {
    choice(before: World, command: Extract<GameCommand, { type: 'choose' }>, after: World) {
      const event = before.pending;
      if (event?.kind !== 'decision') throw new Error('A writing review must observe an actual decision');
      const result = [after.pending, ...after.deferred.map(row => row.event)].find(row => row?.id === event.id + '_result');
      const selected = event.choices.find(choice => choice.id === command.choiceId)!;
      decisions.push({ date: before.date, age: ageOn(before.people[before.activePersonId], before.date),
        eventId: event.id, templateId: event.templateId, title: event.title, situation: event.body,
        choices: event.choices.map(choice => ({ id: choice.id, label: choice.label })), selected: selected.id,
        result: result?.kind === 'result' ? { title: result.title, body: result.body, effects: result.effects } : null,
        journal: after.journal.filter(row => row.id === event.id + '_choice'), died: !!after.people[after.activePersonId].died });
    },
    finish(world: World) {
      mkdirSync(directory, { recursive: true });
      const player = world.people[world.activePersonId];
      writeFileSync(join(directory, 'seed-' + seed + '.json'), JSON.stringify({ seed, country: initial.people[initial.activePersonId].country,
        gender: initial.people[initial.activePersonId].gender, ageAtDeath: ageOn(player, world.date), causeOfDeath: player.causeOfDeath,
        completed: !!player.died && !world.pending && !world.annual, ledgerRows: world.ledger.length,
        decisions, journal: world.journal.filter(row => row.personId === player.id) }, null, 2) + '\n');
    },
  };
}
