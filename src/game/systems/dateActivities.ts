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
  dinner: { label:'Fancy Dinner', description:'Dress up for a restaurant with a strong opinion about forks.',numerator:4n,denominator:1n,bond:9,happiness:8,energy:-5,title:'The tiny main course',body:'You and {name} enjoyed a dinner that required more cutlery than food.',journal:'I went for a fancy dinner with {name}.',invitation:'a fancy dinner' },
  outing: { label:'Weekend Outing',description:'Explore your own city together for an afternoon.',numerator:2n,denominator:1n,bond:8,happiness:8,energy:-8,title:'Tourists at home',body:'You and {name} found a place nearby neither of you had noticed before.',journal:'I explored the city with {name}.',invitation:'a weekend outing' },
  park: { label:'Amusement Park',description:'Test your romantic compatibility in a very loud queue.',numerator:3n,denominator:1n,bond:8,happiness:10,energy:-10,title:'Screaming together',body:'You and {name} survived the rides and laughed at the photograph neither of you will display.',journal:'I visited an amusement park with {name}.',invitation:'an amusement park date' },
  concert: { label:'Concert',description:'Share live music and discover your partner’s singing voice.',numerator:3n,denominator:1n,bond:7,happiness:9,energy:-7,title:'Your shared encore',body:'You and {name} sang along. The professional on stage remained safely out of earshot.',journal:'I went to a concert with {name}.',invitation:'a concert' },
  cooking: { label:'Cooking Together',description:'Make dinner together and negotiate who reads the recipe.',numerator:1n,denominator:3n,bond:8,happiness:6,energy:-5,title:'Two cooks, one kitchen',body:'You and {name} made dinner together. It tasted better than the argument over the recipe suggested.',journal:'I cooked dinner with {name}.',invitation:'cooking together' },
  surprise: { label:'Surprise Date',description:'Let a small local mystery stand in for an itinerary.',numerator:3n,denominator:2n,bond:9,happiness:9,energy:-6,title:'A good surprise',body:'Your surprise outing with {name} worked. The suspicious look at the start became a shared joke.',journal:'I took {name} on a successful surprise date.',invitation:'a surprise date' },
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
      body: activity.description + (dateActivityIds.indexOf(id)<4?' If accepted: relationship +' + bond + '%, trust +' + trust + '%, happiness +' + happiness + '%, energy ' + energy + '%.':' Even an accepted invitation can go beautifully, awkwardly or badly.'),
      disabledReason: reason ?? (cost > 0n && (!account || account.cash - account.lockedCash < cost) ? 'Your available balance cannot cover this date' : undefined) };
  });
}

/** Actual accepted/declined writing; the resolver alone decides and applies it. */
export function dateActivityOutcome(activity: DateActivity, name: string, accepted: boolean, cost?: Money, quality = 100) {
  const data = activities[activity];
  const mishaps: Partial<Record<DateActivity,{body:string;journal:string}>> = {
    dinner:{body:'The tasting menu leaves you and {name} hungry. You spend the final course discussing where the actual dinner went.',journal:'My fancy dinner with {name} was an expensive disappointment.'},
    outing:{body:'Your local outing with {name} becomes an afternoon of walking in circles. By the end, neither of you wants directions from the other.',journal:'My outing with {name} ended in an argument about directions.'},
    park:{body:'You and {name} spend most of the date queuing. The final ride makes you both regret the snacks.',journal:'My amusement park date with {name} went badly.'},
    concert:{body:'You and {name} cannot hear the stage over the people beside you. You leave with a headache and a shared enemy.',journal:'A noisy crowd spoiled my concert date with {name}.'},
    cooking:{body:'Dinner with {name} is overcooked. You argue about whose job it was to watch it; the recipe does not offer mediation.',journal:'I argued with {name} after our cooking date went wrong.'},
    surprise:{body:'The surprise is how little {name} enjoys the plan. You stop trying to defend it and bring the outing to an awkward end.',journal:'My surprise date with {name} was a disappointment.'},
  };
  if (accepted && mishaps[activity] && quality<=20) { const copy=mishaps[activity]!; return {title:'That was the date',body:copy.body.replaceAll('{name}',name)+(cost&&cost.minor>0n?' You spent '+formatMoney(cost)+'.':''),journal:copy.journal.replaceAll('{name}',name),bond:activity==='concert'?1:-4,happiness:-3,energy:data.energy,trust:activity==='concert'?1:-2,stress:2}; }
  if (accepted && mishaps[activity] && quality<=45) return {title:'An awkward memory',body:'You and '+name+' do not quite find your rhythm on the '+data.invitation+'. You can laugh about parts of it, once the silence ends.'+(cost&&cost.minor>0n?' You spent '+formatMoney(cost)+'.':''),journal:'I had an awkward date with '+name+'.',bond:2,happiness:1,energy:data.energy,trust:1,stress:0};
  return accepted ? { title: data.title, body: data.body.replace('{name}', name)+(cost?(cost.minor>0n?' You spent '+formatMoney(cost)+'.':' No money spent.'):''), journal: data.journal.replace('{name}', name), bond: data.bond, happiness: data.happiness, energy: data.energy, trust:5, stress:0 }
    : { title: 'Not this time', body: name + ' declined your invitation for ' + data.invitation + '. You respected the answer, and no date costs were charged.', journal: name + ' declined my invitation for ' + data.invitation + '.', bond: 0, happiness: -2, energy: 0, trust:0, stress:0 };
}
