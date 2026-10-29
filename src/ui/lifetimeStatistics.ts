import { ageOn, fullName, World } from '../game/model';
import { Currency, formatMoney } from '../game/money';
import { countries } from '../game/countries';
import { progressFacts } from '../progression/facts';

export type StatisticsRow = { id: string; label: string; value: string };
export type StatisticsSection = { id: string; title: string; note?: string; rows: StatisticsRow[] };
const otherEarned = new Set(['creator-income', 'sponsorship', 'media-income', 'clinic-income', 'business-owner-income', 'career-royalties', 'creator-contract-income', 'royal-allowance']);

/** Detail-only projection. Never infers events from age, wealth or journal prose. */
export function lifetimeStatistics(world: World, personId = world.activePersonId) {
  const person = world.people[personId], facts = progressFacts(world, personId);
  if (!person || !facts) return null;
  const row = (id: string, label: string, value: number): StatisticsRow => ({ id, label, value: value.toLocaleString(countries[person.country].locale) });
  const receipts = new Map<Currency, { pay: bigint; other: bigint; investment: bigint; tax: bigint }>();
  for (const entry of world.ledger) {
    if (entry.personId !== personId || entry.debtDelta !== 0n) continue;
    const key = entry.cashDelta > 0n ? entry.category === 'income' || entry.category === 'background-income' ? 'pay' : otherEarned.has(entry.category) ? 'other' : entry.category === 'rent' || entry.category === 'dividend' ? 'investment' : null : entry.category === 'tax' && entry.cashDelta < 0n ? 'tax' : null;
    if (!key) continue;
    const totals = receipts.get(entry.currency) ?? { pay: 0n, other: 0n, investment: 0n, tax: 0n };
    totals[key] += key === 'tax' ? -entry.cashDelta : entry.cashDelta; receipts.set(entry.currency, totals);
  }
  const incomeLabels = { pay: 'Pay and pension receipts', other: 'Other earned receipts', investment: 'Investment and rental receipts', tax: 'Income tax cash paid before refunds' };
  const moneyRows = [...receipts].sort(([a], [b]) => a.localeCompare(b)).flatMap(([currency, totals]) => (Object.keys(incomeLabels) as (keyof typeof incomeLabels)[]).flatMap(key => totals[key] ? [{ id: currency + ':' + key, label: currency + ' · ' + incomeLabels[key], value: formatMoney({ minor: totals[key], currency }, countries[person.country].locale) }] : []));
  const socialPosts = world.socialAccounts.filter(account => account.ownerId === personId).reduce((sum, account) => sum + BigInt(account.totalPosts), 0n);
  const sections: StatisticsSection[] = [
    { id: 'school', title: 'Education', rows: [row('reports', 'School reports recorded', facts.schoolReports), row('high-reports', 'Reports with a grade of 80 or above', facts.highReports), row('club-months', 'Months with a school club', facts.clubMonths), row('secondary', 'Secondary qualifications', facts.secondaryQualifications), row('further', 'Further qualifications', facts.furtherQualifications), row('scholarships', 'Scholarships completed', facts.completedScholarships)] },
    { id: 'work', title: 'Work', note: 'Employment-months add each retained job record; overlapping jobs count separately. A recorded role is not proof of every past pay receipt.', rows: [row('jobs', 'Employment records', world.workHistory.filter(record => record.personId === personId).length), row('months', 'Recorded employment-months', facts.workMonths), row('raises', 'Accepted pay raises', facts.acceptedRaises), row('feedback', 'Accepted workplace feedback', facts.acceptedFeedback), row('pensions', 'Recorded paid pension periods', facts.pensionPeriods), row('businesses', 'Businesses founded', facts.foundedBusinesses)] },
    { id: 'money', title: 'Recorded Personal Receipts', note: 'Retained personal ledger receipts, before fees and taxes. Pay includes pensions and recorded background pay. Other earned receipts include creative work and royalties, freelance and clinical fees, media interviews, sponsorships, company profit distributions and attended public-duty allowances. Loans, gifts, inheritance, transfers and asset sales are excluded. Currencies stay separate; tax cash paid is before refunds.', rows: moneyRows },
    { id: 'family', title: 'Family and Travel', rows: [row('children', 'Recorded biological or adopted children', facts.children), row('marriages', 'Marriages recorded', facts.marriages), row('trips', 'Completed trips participated in', facts.completedTrips), row('countries', 'Destination countries on completed trips', facts.destinationCountries)] },
    { id: 'leisure', title: 'Hobbies and Pets', note: 'A hobby-month is an attended monthly practice, not extra practice. Pet-months count each funded period while this person was the recorded owner; pets can overlap.', rows: [row('hobby-months', 'Most attended months in one hobby', facts.hobbyMonths), row('proficiency', 'Highest recorded hobby proficiency (%)', facts.hobbyProficiency), row('hobby-kinds', 'Hobbies with at least 12 attended months', facts.hobbyKindsPractised), row('pets', 'Pets adopted by this person', world.pets.filter(pet => pet.adoptedById === personId).length), row('pet-months', 'Funded pet-months while owner', world.pets.reduce((sum, pet) => sum + pet.periods.filter(period => period.ownerId === personId && period.paid > 0n).length, 0)), row('outings', 'Paid entertainment outings participated in', world.leisureOutings.filter(outing => outing.consent.accepted && outing.paid > 0n && outing.participants.includes(personId)).length)] },
    { id: 'special', title: 'Creative Work and Service', rows: [row('projects', 'Completed special-career projects', facts.completedProjects), row('awards', 'Awarded completed career projects', facts.awardedProjects), { id: 'posts', label: 'Published social posts, including archives', value: socialPosts.toString() }, row('broadcasts', 'Creator-studio live broadcasts', facts.streamerBroadcasts), row('minutes', 'Creator-studio live minutes', facts.liveMinutes), row('military', 'Completed military assignments', facts.militaryAssignments), row('space', 'Completed space assignments', facts.spaceAssignments), row('royal', 'Attended royal engagements', facts.royalEngagements)] },
  ];
  return { personId, name: fullName(person), age: ageOn(person, world.date), died: !!person.died, sections };
}
