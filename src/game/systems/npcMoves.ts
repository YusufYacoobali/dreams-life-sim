import { ageOn, fullName, type Person, type World } from '../model';
import { countries } from '../countries';
import { availableCash, draw, fact, post } from './common';
import { settleTax } from './finance';
import { incomeTax, rules } from '../rules';
import { activeRomance } from './relationships';
import { hospitalized } from './healthSchemas';
import { householdLivingCost } from './households';
import { npcMoveAttemptKey, npcMoveDestinationV1, npcMoveRulesV1, type NpcMoveTax } from './npcMoveSchemas';

/** Calls the original settlement once, with exactly its existing effects/order.
 * The transient proof cannot be obtained by an affordability preview. */
export function settleTaxForNpcMove(world: World, person: Person, nativeAccount?: World['accounts'][number] | null): NpcMoveTax | null {
  const gross = person.finance.cycleGross, withheld = person.finance.cycleWithheld;
  const ledgerStart = world.ledger.length, journalStart = world.journal.length, due = incomeTax(gross, rules[person.country]);
  settleTax(world, person);
  // An old zero-income settlement needs no native account. Preserve that
  // successful no-op even when this actor cannot receive a moving quote.
  const account = nativeAccount === undefined ? world.accounts.find(row => row.ownerId === person.id && row.currency === countries[person.country].currency) : nativeAccount;
  if (!account) return null;
  const journal = world.journal.slice(journalStart).find(row => row.personId === person.id && row.category === 'finance');
  return { personId: person.id, accountId: account.id, month: world.date.year * 12 + world.date.month - 1, country: person.country, currency: account.currency,
    gross, withheld, due, ledgerStart, ledgerEnd: world.ledger.length, paymentId: world.ledger.length > ledgerStart ? world.ledger.at(-1)!.id : null,
    journalIndex: journal ? journalStart : null, journalId: journal?.id ?? null, journalText: journal?.text ?? null };
}

export function settleAnnualTaxesForNpcMoves(world: World, people: readonly Person[]) {
  const accounts = new Map(world.accounts.map(row => [JSON.stringify([row.ownerId, row.currency]), row])), settlements = new Map<string, NpcMoveTax>();
  for (const person of people) {
    const proof = settleTaxForNpcMove(world, person, accounts.get(JSON.stringify([person.id, countries[person.country].currency])) ?? null);
    if (proof) settlements.set(person.id, proof);
  }
  return settlements;
}

/** One bounded real retirement decision, after the actual annual tax loop.
 * No catch-up economics, generated people, preview draws or family settlements. */
export function npcMovesYear(world: World, settlements: ReadonlyMap<string, NpcMoveTax>): void {
  const key = npcMoveAttemptKey(world.date.year);
  if (world.actionCounts[key] || !settlements.size) return;
  const observer = world.people[world.activePersonId], month = world.date.year * 12 + world.date.month - 1;
  const known = new Map<string, string>(), blocked = new Set<string>([observer.id]), moved = new Set(world.npcMoves.filter(row => row.outcome === 'moved').map(row => row.personId));
  for (const relation of world.relationships) {
    if (relation.from === observer.id) known.set(relation.to, relation.id); else if (relation.to === observer.id) known.set(relation.from, relation.id);
    if (activeRomance(relation)) { blocked.add(relation.from); blocked.add(relation.to); }
    if (relation.roles.some(role => role === 'parent' || role === 'guardian')) {
      const child = world.people[relation.to];
      if (!child.died && ageOn(child, world.date) < rules[child.country].adultAge) blocked.add(relation.from);
    }
  }
  for (const row of world.marriages) if (!row.ended) { blocked.add(row.a); blocked.add(row.b); }
  for (const row of world.custody) if (!row.ended) { blocked.add(row.a); blocked.add(row.b); }
  for (const row of world.pregnancies) if (row.status === 'pregnant') { blocked.add(row.carrierId); blocked.add(row.otherParentId); }
  for (const row of world.assets) if (row.ownerId) blocked.add(row.ownerId);
  for (const row of world.liabilities) if (row.principal > 0n) { blocked.add(row.ownerId); if (row.creditorId) blocked.add(row.creditorId); }
  const businesses = new Map(world.businesses.map(row => [row.id, row]));
  for (const row of world.businessPayables) if (row.principal > 0n) {
    if (row.creditorId) blocked.add(row.creditorId);
    const ownerId = businesses.get(row.businessId)?.ownerId; if (ownerId) blocked.add(ownerId);
  }
  for (const row of world.businesses) if (row.status === 'active') { if (row.ownerId) blocked.add(row.ownerId); for (const member of row.staff) if (!member.ended) blocked.add(member.personId); }
  for (const row of world.pets) if (row.status === 'active') blocked.add(row.ownerId);
  for (const row of world.hobbies) for (const plan of row.plans) if (plan.status === 'active') { blocked.add(row.personId); blocked.add(plan.payerId); }
  for (const row of world.recoveryCourses) if (row.status === 'active') blocked.add(row.personId);
  for (const row of world.universityApplications) if (row.status === 'accepted' || row.status === 'waitlisted') blocked.add(row.personId);
  for (const row of world.studyCourses) if (row.status === 'active') blocked.add(row.personId);
  for (const row of world.scholarships) if (row.status === 'active' || row.status === 'offered') blocked.add(row.personId);
  for (const row of world.schoolCommunities) if (!row.ended) blocked.add(row.personId);
  for (const row of world.trips) if (row.status === 'active') for (const id of row.participantIds) blocked.add(id);
  for (const row of world.cases) if (row.status === 'awaiting-trial' || row.detained) blocked.add(row.personId);
  for (const row of world.sentences) if (row.state === 'active') blocked.add(row.personId);
  for (const row of world.serviceCareers) if (row.status === 'active' || row.status === 'between') blocked.add(row.personId);
  for (const row of world.careers) if (row.status === 'active' || row.status === 'between') blocked.add(row.personId);
  for (const row of world.royalHouses) for (const member of row.members) if (member.status === 'active') blocked.add(member.personId);
  for (const row of world.creatorStudios) if (row.status === 'active') { blocked.add(row.personId); for (const member of row.crew) if (!member.ended) blocked.add(member.personId); }
  for (const row of world.musicReleases) if (row.status === 'recording' || row.status === 'paused') blocked.add(row.personId);
  for (const row of world.elections) if (row.status === 'campaign') for (const candidate of row.candidates) if (candidate.status === 'active') blocked.add(candidate.personId);
  for (const row of world.sponsorships) if (row.status === 'active' || row.status === 'offered') blocked.add(row.ownerId);
  for (const person of Object.values(world.people)) if (person.health.conditions.some(row => row.status !== 'recovered' && row.treatment)) {
    blocked.add(person.id); if (person.health.providerId) blocked.add(person.health.providerId);
  }
  for (const event of [...(world.pending ? [world.pending] : []), ...world.deferred.map(row => row.event)]) if (event.kind === 'decision') for (const id of event.personIds) blocked.add(id);
  const households = new Map(world.households.map(row => [row.id, row]));
  const accounts = new Map(world.accounts.map(row => [JSON.stringify([row.ownerId, row.currency]), row]));
  const candidates = [...known.keys()].filter(id => {
    const person = world.people[id];
    return !person.died && person.country === observer.country && person.city === observer.city && person.finance.pensionAnnual > 0n;
  }).sort();
  const offset = candidates.length ? ((world.date.year % candidates.length) + candidates.length) % candidates.length : 0;
  for (let index = 0; index < Math.min(candidates.length, 12); index++) {
    const person = world.people[candidates[(offset + index) % candidates.length]], rule = npcMoveRulesV1[person.country], tax = settlements.get(person.id);
    const household = person.householdId ? households.get(person.householdId) : undefined, account = accounts.get(JSON.stringify([person.id, rule.currency]));
    if (blocked.has(person.id) || moved.has(person.id) || ageOn(person, world.date) < rule.retirementAge || person.employment || person.training || person.education.stage !== 'none' || person.legal.wanted || hospitalized(world, person) || person.stats.health < 35 || !rule.cities.includes(person.city) || !household || household.homeAssetId || household.members.filter(id => !world.people[id].died).length !== 1 || !household.members.includes(person.id)) continue;
    if (!account || account.lockedCash !== 0n || person.lastEconomicMonth !== month || person.finance.cycleGross || person.finance.cycleWithheld || !tax || tax.month !== month || tax.country !== person.country || tax.accountId !== account.id || tax.ledgerEnd > world.ledger.length) continue;
    const payments = person.finance.pensionReceipts.filter(row => row.gross > 0n && row.grossTransactionId), receipt = payments.at(-1), recordedPaidPeriods = payments.reduce((sum, row) => sum + row.periods, 0);
    const monthlyLiving = householdLivingCost(world, person), movingCost = rule.fee, reserveRequired = monthlyLiving * 3n;
    if (!receipt?.grossTransactionId || receipt.month !== month || receipt.currency !== rule.currency || recordedPaidPeriods < 12 || !tax.journalId || tax.gross < receipt.gross || tax.withheld < receipt.withheld || world.ledger.find(row => row.id === receipt.grossTransactionId)?.category !== 'income' || monthlyLiving !== rule.living || availableCash(account) < movingCost + reserveRequired) continue;
    const roll = draw(world, 'npcs', 1, 100), outcome = roll <= 20 ? 'moved' as const : 'stayed' as const, originCity = person.city, destinationCity = npcMoveDestinationV1(person.country, originCity, world.date.year);
    const row: World['npcMoves'][number] = { id: 'npc_move_' + world.revision + '_' + world.npcMoves.length, revision: world.revision, ruleVersion: 1, personId: person.id, observerId: observer.id, relationshipId: known.get(person.id)!, date: { ...world.date }, country: person.country, originCity, destinationCity, currency: rule.currency,
      householdId: household.id, householdMembers: [...household.members], pensionTransactionId: receipt.grossTransactionId, recordedPaidPeriods, settledThroughMonth: month, accountId: account.id, ledgerCursor: world.ledger.length, cashBefore: account.cash, lockedCashBefore: 0n, availableBefore: availableCash(account), movingCost, monthlyLiving, reserveMonths: 3, reserveRequired,
      tax: { ...tax }, chance: 20, roll, outcome, paymentId: null };
    if (outcome === 'moved') {
      post(world, -movingCost, 0n, 'npc-moving', 'Domestic retirement move from ' + originCity + ' to ' + destinationCity, null, person, rule.currency);
      row.paymentId = world.ledger.at(-1)!.id; person.city = destinationCity;
      fact(world, fullName(person) + ' moved from ' + originCity + ' to ' + destinationCity + ' and paid their own moving costs.', 'relationships');
    }
    world.npcMoves.push(row); world.actionCounts[key] = 1; return;
  }
}
