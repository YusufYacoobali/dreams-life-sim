import { vehicleMinimumAge } from './vehicleAgePolicy';
export { roadLicenceAgeV1 } from './vehicleAgePolicy';
import type { CountryCode } from '../countries';
import type { World } from '../model';
import { rules } from '../rules';
import { ageOn } from '../personHelpers';
import type { licenceKinds } from './lifestyleSchemas';
export type LicenceKind = typeof licenceKinds[number];
/** Authored game rules, not a real-world licensing or certification service. */
export const licenceQuiz: Record<LicenceKind, readonly {
    prompt: string;
    answers: readonly [
        string,
        string,
        string
    ];
    correct: number;
}[]> = {
    road: [
        { prompt: 'Rain has made the road slippery. What changes?', answers: ['Follow more closely', 'Leave more stopping space', 'Brake sharply at every bend'], correct: 1 },
        { prompt: 'Your phone rings while you are moving.', answers: ['Read it at the next bend', 'Ask the passenger to steer', 'Stop somewhere safe before using it'], correct: 2 },
        { prompt: 'A person is crossing ahead.', answers: ['Slow down and give them room', 'Compete for the gap', 'Assume they have seen you'], correct: 0 },
    ],
    boat: [
        { prompt: 'Clouds are gathering before departure.', answers: ['Race the storm', 'Check conditions and postpone if unsafe', 'Add more passengers'], correct: 1 },
        { prompt: 'A passenger cannot find a life jacket.', answers: ['Share one between two people', 'Promise to stay near shore', 'Find a suitable jacket before leaving'], correct: 2 },
        { prompt: 'You approach swimmers.', answers: ['Slow down and leave a wide gap', 'Sound impressive', 'Let the wake announce you'], correct: 0 },
    ],
    pilot: [
        { prompt: 'A pre-flight check identifies a fault.', answers: ['Depart and monitor it', 'Resolve it before departure', 'Ask the passengers to vote'], correct: 1 },
        { prompt: 'The forecast worsens along your planned route.', answers: ['Fly low and hope', 'Ignore the forecast', 'Review conditions and delay if necessary'], correct: 2 },
        { prompt: 'You are too tired to concentrate.', answers: ['Rest and postpone the flight', 'Use louder music', 'Let confidence handle it'], correct: 0 },
    ],
};
export const licenceFee = (world: World, kind: LicenceKind) => rules[world.people[world.activePersonId].country].baseWage * BigInt(kind === 'road' ? 2 : kind === 'boat' ? 8 : 35) / 10000n || 1n;
export const hasLicence = (world: World, kind: LicenceKind, personId = world.activePersonId) => !!world.lifestyle?.licences.some(row => row.personId === personId && row.kind === kind && row.passed);
export function licenceReason(world: World, kind: LicenceKind) { const person = world.people[world.activePersonId], min = vehicleMinimumAge(person.country, kind); if (ageOn(person, world.date) < min)
    return 'Game policy: available from age ' + min; if (hasLicence(world, kind))
    return 'You already passed this licence'; const records = world.lifestyle?.licences.filter(row => row.personId === person.id && row.kind === kind && row.date.year === world.date.year) ?? []; if (records.some(row => row.date.month === world.date.month))
    return 'Try again in a later month'; if (records.length >= 3)
    return 'Three attempts per licence each calendar year'; }
