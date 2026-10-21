import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { resolveCommand } from '../../src/game/engine';
import type { EventTemplate } from '../../src/game/content/eventTypes';
import { careerCatalog } from '../../src/game/content/careers';
import { careerPayQuote } from '../../src/game/systems/careers';
import { servicePayQuote } from '../../src/game/systems/services';
import { endEmployment } from '../../src/game/systems/work';
import { lifeStoryAvailable, lifeStoryContexts } from '../../src/game/systems/lifeStoryContext';
import { drainStorySetup } from './lifeStory';
import actor from '../fixtures/v12-career-archive.json';
import politician from '../fixtures/v14-election-archive.json';
import streamer from '../fixtures/v15-studio-archive.json';
import military from '../fixtures/v16-service-archive.json';
import royalty from '../fixtures/v17-royal-archive.json';
import business from '../fixtures/v11-business-archive.json';
import graduate from '../fixtures/v3-employed-graduate.json';

const cache = new Map<string, string>();
/** Declared domain contexts, never natural encounter/cohort evidence.
 * Six paths use real old recorded contexts. YouTuber starts an actual matching
 * profile/studio at the old Streamer context. Four remaining paths use the
 * recorded graduate, explicit qualifying stats/skills and ONE fixed selection
 * stream (state1); no search, retried application, pay or project manufacture.
 * Pending/annual boundaries are cleared solely to isolate authored scenes. */
export function careerDepthWorld(template: EventTemplate): World {
  const kind = template.specialCareer!;
  if (!cache.has(kind)) {
    const archives = { actor, politician, streamer, military, royalty, business };
    let world: World;
    if (kind in archives || kind === 'youtuber') {
      const archive = decodeSave(JSON.stringify(archives[(kind === 'youtuber' ? 'streamer' : kind) as keyof typeof archives]));
      const predicate = kind === 'youtuber' ? { ...template, specialCareer: 'streamer' as const } : template;
      const found = [archive.world, ...archive.snapshots.map(row => unpackCheckpoint(row.payload))].find(value => lifeStoryAvailable(lifeStoryContexts(value), predicate));
      if (!found) throw new Error('No recorded ' + kind + ' context');
      world = found;
      world.pending = null; world.pendingPriority = 0; world.deferred = []; world.annual = null;
      if (kind === 'youtuber') {
        world = drainStorySetup(resolveCommand(world, { type: 'create-social', platform: 'videowave', handle: 'career_depth_test', bio: '' }));
        const account = world.socialAccounts.find(row => row.ownerId === world.activePersonId && row.platform === 'videowave')!;
        world = drainStorySetup(resolveCommand(world, { type: 'start-creator', kind, accountId: account.id }));
      }
    } else {
      world = decodeWorld(JSON.stringify(graduate)); endEmployment(world);
      const person = world.people[world.activePersonId];
      Object.assign(person.stats, { health: 100, energy: 100, fitness: 100, looks: 100, smarts: 90, discipline: 85 });
      world.random.outcomes = 1;
      if (kind === 'astronaut') {
        person.skills.science = 85; person.born.year -= 5;
        world = drainStorySetup(resolveCommand(validateWorld(world), { type: 'apply-service', kind, branch: 'space-program', quotedAnnualPay: servicePayQuote(world, kind) }));
      } else if (kind === 'model' || kind === 'athlete' || kind === 'musician') {
        person.skills[careerCatalog[kind].skill] = 85;
        world = drainStorySetup(resolveCommand(validateWorld(world), { type: 'select-career', kind, quotedAnnualPay: careerPayQuote(world, kind) }));
      } else throw new Error('Unregistered career depth context');
    }
    if (!lifeStoryAvailable(lifeStoryContexts(world), template)) throw new Error('The one actual application did not produce the required context');
    cache.set(kind, encodeWorld(world));
  }
  return decodeWorld(cache.get(kind)!);
}
