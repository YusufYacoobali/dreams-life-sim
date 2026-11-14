import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { careerPayQuote } from '../../src/game/systems/careers';
import { servicePayQuote } from '../../src/game/systems/services';
import { endEmployment } from '../../src/game/systems/work';
import graduate from '../fixtures/v3-employed-graduate.json';

export type PremiumCareerFeature = 'athlete' | 'military' | 'astronaut';
type CareerState = 'active' | 'between';
const snapshots = new Map<string, string>();

/** Controlled eligibility only: no existing career, contract, payment or outcome is changed. */
export function premiumEntryFixture(): World {
  const world = decodeWorld(JSON.stringify(graduate)), person = world.people[world.activePersonId];
  endEmployment(world);
  person.born.year -= 5;
  person.stats.health = person.stats.fitness = person.stats.smarts = person.stats.discipline = 100;
  person.skills.sport = person.skills.science = person.skills.service = 100;
  world.random.outcomes = 1;
  return validateWorld(world);
}

function recordedCareer(world: World, feature: PremiumCareerFeature) {
  const rows = feature === 'athlete' ? world.careers : world.serviceCareers;
  const career = rows.find(row => row.personId === world.activePersonId && row.kind === feature);
  if (!career) throw Error('Premium fixture did not create its ' + feature + ' career');
  return career;
}

function settle(input: World): World {
  let world = input;
  for (let guard = 0; guard < 240; guard++) {
    if (!world.pending && !world.annual) return world;
    if (world.people[world.activePersonId].died) throw Error('Premium fixture ended before its contract');
    const pending = world.pending;
    let command: GameCommand;
    if (pending?.kind === 'decision') {
      const choices = pending.choices.filter(choice => !choiceUnavailable(world, choice));
      const choice = choices.find(row => row.id === 'withdraw') ?? choices[0];
      if (!choice) throw Error('No eligible premium fixture choice: ' + pending.templateId);
      command = { type: 'choose', eventId: pending.id, choiceId: choice.id };
    } else command = pending ? { type: 'acknowledge', resultId: pending.id } : { type: 'resume' };
    world = resolveCommand(world, command);
  }
  throw Error('Premium fixture exceeded its annual scene guard');
}

/** Real selections and annual commands produce both states; cached snapshots decode into fresh worlds. */
export function premiumCareerFixture(feature: PremiumCareerFeature, state: CareerState): World {
  const key = feature + ':' + state, cached = snapshots.get(key);
  if (cached) return decodeWorld(cached);
  let world: World;
  if (state === 'active') {
    world = premiumEntryFixture();
    const command: GameCommand = feature === 'athlete'
      ? { type: 'select-career', kind: feature, quotedAnnualPay: careerPayQuote(world, feature) }
      : { type: 'apply-service', kind: feature, branch: feature === 'astronaut' ? 'space-program' : 'army', quotedAnnualPay: servicePayQuote(world, feature) };
    world = settle(resolveCommand(world, command));
  } else {
    world = premiumCareerFixture(feature, 'active');
    const id = recordedCareer(world, feature).id;
    for (let year = 0; year < 8 && recordedCareer(world, feature).status === 'active'; year++) {
      world = settle(resolveCommand(world, { type: 'advance' }));
      if (recordedCareer(world, feature).id !== id) throw Error('Premium fixture replaced its original career');
    }
  }
  if (recordedCareer(world, feature).status !== state) throw Error('Premium fixture did not reach ' + feature + ':' + state);
  const encoded = encodeWorld(world);
  snapshots.set(key, encoded);
  return decodeWorld(encoded);
}
