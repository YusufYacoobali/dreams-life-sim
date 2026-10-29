import { decodeWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import graduate from '../fixtures/v3-employed-graduate.json';

function acknowledge(world: World): World {
  if (world.pending?.kind !== 'result') throw new Error('Expected an actual study setup result');
  return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }, true);
}

/** Fixed existing graduate; ordinary resignation, one application and actual payment.
 * This is a historical continuation, not natural qualification attainment. */
export function startStudy(program: 'trade' | 'university' | 'graduate' = 'graduate', funding: 'cash' | 'loan' = 'loan'): World {
  let world = acknowledge(resolveCommand(decodeWorld(JSON.stringify(graduate)), { type: 'quit-job' }, true));
  if (program === 'university') {
    world = acknowledge(resolveCommand(world, { type: 'apply-university', field: 'arts' }, true));
    const application = world.universityApplications.at(-1)!;
    if (application.status !== 'accepted') throw new Error('The one fixed university application was ' + application.status);
    world = acknowledge(resolveCommand(world, { type: 'accept-university-place', applicationId: application.id, funding }, true));
  } else {
    world = acknowledge(resolveCommand(world, { type: 'enroll', program, field: program === 'trade' ? 'computing' : 'medicine', funding }, true));
  }
  if (world.people[world.activePersonId].education.stage !== program) throw new Error('The one fixed study application did not enrol');
  return world;
}

/** At most two ordinary years; actual first available choices, no substituted funds,
 * dates, pause flags, rolls or future-outcome search. */
export function pausedStudy(): World {
  let world = startStudy('graduate', 'cash');
  for (let year = 0; year < 2 && !world.people[world.activePersonId].education.paused; year++) {
    world = resolveCommand(world, { type: 'advance' }, true);
    let guard = 0;
    while (world.pending || world.annual) {
      if (++guard > 120) throw new Error('Ordinary study year did not finish');
      const event = world.pending;
      if (event?.kind === 'decision') {
        const choice = event.choices.find(item => !choiceUnavailable(world, item));
        if (!choice) throw new Error('No visible available study continuation choice');
        world = resolveCommand(world, { type: 'choose', eventId: event.id, choiceId: choice.id }, true);
      } else world = resolveCommand(world, event ? { type: 'acknowledge', resultId: event.id } : { type: 'resume' }, true);
    }
  }
  if (!world.people[world.activePersonId].education.paused) throw new Error('The bounded cash-funded continuation did not reach a real tuition pause');
  return world;
}
