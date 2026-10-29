import { countries } from '../countries';
import { type World } from '../model';
import { formatMoney, roundRatio, type Currency, type Money } from '../money';
import { hospitalized } from './healthSchemas';
import { dateBudget, relationFor, romanceReason, socialActionUsed } from './relationshipQueries';
import { dateActivityIds, type DateActivity } from './dateActivitySchemas';

export { dateActivityIds, type DateActivity } from './dateActivitySchemas';
export type DateActivityOption = { id: DateActivity; label: string; body: string; cost: bigint; currency: Currency; disabledReason?: string };
const activities = {
  walk: { label: 'Go for a Walk', description: 'Make time for an unhurried walk together.', numerator: 0n, denominator: 1n, bond: 5, happiness: 4, energy: -5,
    title: 'An unhurried walk', body: 'You and {name} took a walk together.', journal: 'I went for a walk with {name}.', invitation: 'a walk' },
  coffee: { label: 'Go for Coffee', description: 'Keep it simple with a coffee and a conversation.', numerator: 1n, denominator: 4n, bond: 6, happiness: 4, energy: -3,
    title: 'More than a coffee break', body: 'You and {name} went for coffee.', journal: 'I went for coffee with {name}.', invitation: 'coffee' },
  meal: { label: 'Share a Meal', description: 'Set aside time to share a meal.', numerator: 1n, denominator: 1n, bond: 7, happiness: 6, energy: -4,
    title: 'A meal together', body: 'You and {name} shared a meal.', journal: 'I shared a meal with {name}.', invitation: 'a meal' },
  movie: { label: 'Watch a Movie', description: 'Watch a film, then compare your reactions.', numerator: 3n, denominator: 4n, bond: 4, happiness: 6, energy: -3,
    title: 'After the credits', body: 'You and {name} watched a movie together.', journal: 'I went to a movie with {name}.', invitation: 'a movie' },
} as const;

/** A quote/availability read only: no counter, payment, consent draw or new person. */
export function dateActivities(world: World, personId: string): DateActivityOption[] {
  const player = world.people[world.activePersonId], target = world.people[personId];
  const relation = target && relationFor(world, player.id, personId), currency = countries[player.country].currency;
  const reason = player.died ? 'This life has ended' : !world.birthAcknowledged ? 'Begin this life first'
    : !target || target.died || !relation ? 'Choose a living person you know'
    : world.pending || world.annual && !world.annual.pausedForPlanning ? 'Finish the current event first'
    : romanceReason(world, target) ?? (hospitalized(world, player) || hospitalized(world, target) ? 'Arrange a date after the hospital stay'
      : socialActionUsed(world, personId, 'date') ? 'You already tried this with this person this year' : undefined);
  const account = world.accounts.find(row => row.ownerId === player.id && row.currency === currency), budget = dateBudget(world);
  return dateActivityIds.map(id => {
    const activity = activities[id], cost = roundRatio(budget * activity.numerator, activity.denominator);
    const bond = Math.min(activity.bond, 100 - (relation?.strength ?? 0)), happiness = Math.min(activity.happiness, 100 - player.stats.happiness), energy = Math.max(activity.energy, -player.stats.energy), trust = Math.min(5, 100 - (relation?.trust ?? 0));
    return { id, label: activity.label, cost, currency,
      body: activity.description + ' If accepted: relationship +' + bond + '%, trust +' + trust + '%, happiness +' + happiness + '%, energy ' + energy + '%.',
      disabledReason: reason ?? (cost > 0n && (!account || account.cash - account.lockedCash < cost) ? 'Your available balance cannot cover this date' : undefined) };
  });
}

/** Actual accepted/declined writing; the resolver alone decides and applies it. */
export function dateActivityOutcome(activity: DateActivity, name: string, accepted: boolean, cost?: Money) {
  const data = activities[activity];
  return accepted ? { title: data.title, body: data.body.replace('{name}', name)+(cost?(cost.minor>0n?' You spent '+formatMoney(cost)+'.':' No money spent.'):''), journal: data.journal.replace('{name}', name), bond: data.bond, happiness: data.happiness, energy: data.energy }
    : { title: 'Not this time', body: name + ' declined your invitation for ' + data.invitation + '. You respected the answer, and no date costs were charged.', journal: name + ' declined my invitation for ' + data.invitation + '.', bond: 0, happiness: -2, energy: 0 };
}
