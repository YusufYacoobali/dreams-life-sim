import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import type { EventTemplate } from '../../src/game/content/eventTypes';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { lifeStoryAvailable, lifeStoryContexts } from '../../src/game/systems/lifeStoryContext';
import { endEmployment } from '../../src/game/systems/work';
import { post } from '../../src/game/systems/common';
import { careerPayQuote } from '../../src/game/systems/careers';
import { careerCatalog } from '../../src/game/content/careers';
import { servicePayQuote } from '../../src/game/systems/services';
import { resolveCommand } from '../../src/game/engine';
import { drainStorySetup } from './lifeStory';
import graduate from '../fixtures/v3-employed-graduate.json';
import actor from '../fixtures/v12-career-archive.json';
import politician from '../fixtures/v14-election-archive.json';
import creator from '../fixtures/v15-studio-archive.json';
import military from '../fixtures/v16-service-archive.json';
import royalty from '../fixtures/v17-royal-archive.json';
const cache = new Map<string, string>();
/** Actual old recorded special-career states, or a fixture-qualified real selection.
 * Pending boundaries are cleared to isolate a story; this is domain setup only. */
export function specialStoryWorld(template: EventTemplate): World {
  const kind = template.specialCareer!;
  if (!cache.has(kind)) {
    const archives = { actor, politician, creator, military, royalty };
    if (kind in archives) {
      const archive = decodeSave(JSON.stringify(archives[kind as keyof typeof archives]));
      const found = [archive.world, ...archive.snapshots.map(item => unpackCheckpoint(item.payload))].find(world => lifeStoryAvailable(lifeStoryContexts(world), template));
      if (!found) throw new Error('No actual archived ' + kind + ' state');
      found.pending = null; found.pendingPriority = 0; found.deferred = []; found.annual = null;
      cache.set(kind, encodeWorld(found));
    } else {
      const input = decodeWorld(JSON.stringify(graduate)); endEmployment(input); post(input, 1_000_000_000n, 0n, 'fixture-funding', 'Special story fixture funding');
      const person = input.people[input.activePersonId]; person.stats.health = 100; person.stats.energy = 100; person.stats.fitness = 100; person.stats.looks = 100; person.stats.smarts = 90; person.stats.discipline = 85;
      if (kind === 'astronaut') { person.skills.science = 85; person.born.year -= 5; }
      else if (kind === 'model' || kind === 'athlete' || kind === 'musician') person.skills[careerCatalog[kind].skill] = 85;
      else throw new Error('Unknown special story fixture');
      for (let seed = 1; seed < 100; seed++) {
        const world = validateWorld(input); world.random.outcomes = seed;
        const selected = drainStorySetup(resolveCommand(world, kind === 'astronaut' ? { type: 'apply-service', kind, branch: 'space-program', quotedAnnualPay: servicePayQuote(world, kind) } : { type: 'select-career', kind: kind as 'model' | 'athlete' | 'musician', quotedAnnualPay: careerPayQuote(world, kind as 'model' | 'athlete' | 'musician') }));
        if (lifeStoryAvailable(lifeStoryContexts(selected), template)) { cache.set(kind, encodeWorld(selected)); break; }
      }
      if (!cache.has(kind)) throw new Error('No accepted special story fixture');
    }
  }
  return decodeWorld(cache.get(kind)!);
}
