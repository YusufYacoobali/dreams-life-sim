import { activeTrip } from './travelSchemas';
import { royalChild,royalDivorce } from './royalty';
import { serviceAway } from './serviceSchemas';
import { z } from 'zod';
import { ageOn, compareDates, fullName } from '../personHelpers';
import type { Person, World } from '../model';
import { monthFrom } from '../calendar';
import { IneligibleAction } from '../errors';
import { rules } from '../rules';
import { formatMoney, roundRatio } from '../money';
import { fxMoney, netWorth } from '../valuation';
import { accountFor, active, availableCash, bounded, charge, draw, fact, post, result } from './common';
import { createContact } from './npcs';
import { moveHousehold, ownHousehold } from './households';
import { otherPerson, partnerRelation, relationFor, romanceReason } from './relationships';
import { hospitalized } from './healthSchemas';
import { offerPending } from '../pendingQueue';
import { isConfined } from './legalSchemas';

export const familyCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('try-child') }),
  z.object({ type: z.literal('adopt'), age: z.number().int().min(0).max(6) }),
  z.object({ type: z.literal('name-child'), childId: z.string(), firstName: z.string().trim().min(1).max(40).refine(name => !/[\u0000-\u001F]/.test(name)) }),
  z.object({ type: z.literal('divorce'), personId: z.string(), custody: z.enum(['shared', 'me', 'them']), quotedPayment: z.bigint() }),
  z.object({ type: z.literal('review-custody'), childId: z.string(), preference: z.enum(['shared', 'me', 'them']) }),
]);
export type FamilyCommand = z.infer<typeof familyCommandSchema>;
export const childrenOf = (world: World, personId = world.activePersonId) => world.relationships.filter(relation => relation.roles.includes('parent') && relation.from === personId).map(relation => world.people[relation.to]);
export const adoptionFee = (world: World) => rules[active(world).country].baseWage / 10n;
const absolute = (world: World) => world.date.year * 12 + world.date.month - 1;
const living = (world: World, id: string) => world.people[id] && !world.people[id].died;
function yearLimit(world: World, action: string) {
  const key = world.activePersonId + ':' + action + ':' + world.date.year;
  if (world.actionCounts[key]) throw new IneligibleAction('You already tried this this year'); world.actionCounts[key] = 1;
}
export function conceptionReason(world: World, first: Person, second?: Person): string | undefined {
  if (activeTrip(world, first.id) || second && activeTrip(world, second.id)) return 'Wait until both partners return from their trip';
  if (!second || first.died || second.died) return 'A living partner is required';
  if(serviceAway(world,first.id)||serviceAway(world,second.id))return 'Wait until both partners return from their assignments';
  if (isConfined(world, first) || isConfined(world, second)) return 'Both partners need to be outside custody';
  if (hospitalized(world, first) || hospitalized(world, second)) return 'Recover from the hospital stay before trying for a child';
  if (ageOn(first, world.date) < rules[first.country].adultAge || ageOn(second, world.date) < rules[second.country].adultAge) return 'Both parents must be adults';
  if (!first.wantsChildren || !second.wantsChildren) return 'Both partners need to want a child';
  if (first.city !== second.city || first.country !== second.country) return 'Both partners must be in the same city';
  const carrier = [first, second].find(person => person.biology.role === 'carry'); const contributor = [first, second].find(person => person.biology.role === 'contribute');
  if (!carrier || !contributor) return 'Your reproductive capacities do not allow conception together; adoption is available';
  if (ageOn(carrier, world.date) >= 50 || ageOn(contributor, world.date) >= 80 || !carrier.biology.fertility || !contributor.biology.fertility) return 'Conception is unavailable with your current fertility';
  if (world.pregnancies.some(item => item.status === 'pregnant' && (item.carrierId === first.id || item.carrierId === second.id))) return 'A pregnancy is already in progress';
}
function startPregnancy(world: World, first: Person, second: Person) {
  const carrier = first.biology.role === 'carry' ? first : second, other = carrier.id === first.id ? second : first;
  world.pregnancies.push({ id: 'pregnancy_' + world.revision + '_' + world.pregnancies.length, carrierId: carrier.id, otherParentId: other.id, conceived: { ...world.date }, due: monthFrom(world.date, 9, world.date.day), status: 'pregnant', childId: null, ended: null });
  fact(world, 'A pregnancy began in my family; ' + carrier.firstName + ' is due in ' + world.pregnancies.at(-1)!.due.year + '-' + world.pregnancies.at(-1)!.due.month + '.', 'family', '', first.id);
}
function linkParent(world: World, parent: Person, child: Person, type: 'biological' | 'adoptive' | 'guardian') {
  const role = type === 'guardian' ? 'guardian' : 'parent';
  const existing = relationFor(world, parent.id, child.id);
  if (existing) { if (!existing.roles.includes(role)) existing.roles.push(role); existing.from = parent.id; existing.to = child.id; existing.kind = role; existing.parentType = type; return; }
  world.relationships.push({ id: 'relation_' + parent.id + '_' + child.id, from: parent.id, to: child.id, kind: role, roles: [role], romance: 'none', parentType: type, since: { ...world.date }, strength: 80, trust: 80, memories: [type === 'biological' ? 'birth' : type === 'adoptive' ? 'adoption' : 'guardianship'], lastInteractionYear: world.date.year });
}
export function addChild(world: World, parents: Person[], type: 'biological' | 'adoptive', age = 0): Person {
  const child = createContact(world, { age, country: parents[0].country, city: parents[0].city });
  if (type === 'biological') {
    child.born = { ...world.date }; child.lastName = parents[0].lastName;
    const pick = <T,>(values: T[]) => values[draw(world, 'npcs', 0, values.length - 1)];
    const first = parents[0], second = parents[1] ?? first;
    child.appearance = { face: pick(parents.map(parent => parent.appearance.face)), skin: Math.round((first.appearance.skin + second.appearance.skin) / 2), hair: pick(parents.map(parent => parent.appearance.hair)), hairColor: pick(parents.map(parent => parent.appearance.hairColor)) };
    child.traits = [pick(parents.flatMap(parent => parent.traits))];
    child.stats.smarts = bounded((first.stats.smarts + second.stats.smarts) / 2 + draw(world, 'npcs', -12, 12)); child.stats.looks = bounded((first.stats.looks + second.stats.looks) / 2 + draw(world, 'npcs', -12, 12));
    child.health.familyRisks = [...new Set(parents.flatMap(parent => [...parent.health.familyRisks, ...parent.health.conditions.filter(item => ['asthma', 'diabetes', 'hypertension', 'heart-disease', 'depression'].includes(item.type)).map(item => item.type)]))];
  }
  for (const parent of parents) {
    for (const sibling of childrenOf(world, parent.id)) if (sibling.id !== child.id && !relationFor(world, sibling.id, child.id)) world.relationships.push({ id: 'relation_sibling_' + sibling.id + '_' + child.id, from: sibling.id, to: child.id, kind: 'sibling', roles: ['sibling'], romance: 'none', parentType: null, since: { ...world.date }, strength: 65, trust: 65, memories: ['new-sibling'], lastInteractionYear: world.date.year });
    linkParent(world, parent, child, type);
    if (!parent.died) { parent.stats.happiness = bounded(parent.stats.happiness + 8); parent.stats.stress = bounded(parent.stats.stress + 4); fact(world, type === 'biological' ? 'My child, ' + fullName(child) + ', was born.' : 'I adopted ' + fullName(child) + ' at age ' + age + '.', 'family', '', parent.id); }
  }
  const guardian = parents.find(parent => !parent.died && !isConfined(world, parent) && !serviceAway(world,parent.id)) ?? parents.find(parent => !parent.died);
  if (guardian) { if (!guardian.householdId) ownHousehold(world, guardian); moveHousehold(world, [child.id], guardian.householdId!); child.country = guardian.country; child.city = guardian.city; }
  if (parents.length === 2 && parents.every(parent => !parent.died) && parents[0].householdId !== parents[1].householdId && parents.some(parent => !isConfined(world, parent))) setCustody(world, child, parents[0], parents[1], 'shared');
  for (const parent of parents) if (isConfined(world, parent)) placeDependentChildren(world, parent.id);
  royalChild(world,child.id,parents.map(parent=>parent.id));
  fact(world, type === 'biological' ? 'I was born into the ' + child.lastName + ' family.' : 'I joined my adoptive family.', type === 'biological' ? 'birth' : 'family', '', child.id);
  return child;
}
export function divorceQuote(world: World, personId: string) {
  const player = active(world), target = world.people[personId]; const marriage = world.marriages.find(item => !item.ended && (item.a === player.id && item.b === personId || item.b === player.id && item.a === personId));
  if (!target || !marriage) throw new IneligibleAction('Choose your current spouse');
  const currency = accountFor(world).currency;
  const first = { ...marriage.baselineA, minor: marriage.baselineA.minor + marriage.excludedA }, second = { ...marriage.baselineB, minor: marriage.baselineB.minor + marriage.excludedB };
  const baselinePlayer = fxMoney(world, marriage.a === player.id ? first : second, currency).minor;
  const baselineTarget = fxMoney(world, marriage.a === player.id ? second : first, currency).minor;
  const playerGain = netWorth(world, player.id).minor - baselinePlayer;
  const targetGain = fxMoney(world, netWorth(world, target.id), currency).minor - baselineTarget;
  const signed = (playerGain - targetGain) / 2n;
  return { signed, amount: signed < 0n ? -signed : signed, payerId: signed >= 0n ? player.id : target.id, receiverId: signed >= 0n ? target.id : player.id, currency };
}
function ensureAccount(world: World, person: Person, currency: World['accounts'][number]['currency']) {
  if (!world.accounts.some(item => item.ownerId === person.id && item.currency === currency)) world.accounts.push({ id: 'account_' + person.id + '_' + currency, ownerId: person.id, currency, cash: 0n, openingCash: 0n, lockedCash: 0n });
}
/** A family obligation creates a receivable, never cash. Collections transfer actual balances. */
export function oweFamily(world: World, payerId: string, receiverId: string, amount: bigint, currency: World['accounts'][number]['currency'], kind: 'settlement' | 'child-support' | 'restitution') {
  if (!amount) return;
  const payer = world.people[payerId], receiver = world.people[receiverId]; ensureAccount(world, payer, currency); ensureAccount(world, receiver, currency);
  const account = accountFor(world, payer, currency), available = availableCash(account), paid = available < amount ? available : amount;
  const label = kind === 'restitution' ? 'Restitution' : 'Family payment';
  if (paid) { post(world, -paid, 0n, kind, label + ' to ' + receiver.firstName, null, payer, currency); post(world, paid, 0n, kind, label + ' from ' + payer.firstName, null, receiver, currency); }
  const remaining = amount - paid;
  if (remaining) {
    const id = 'debt_' + kind + '_' + payerId + '_' + receiverId + '_' + currency;
    let debt = world.liabilities.find(item => item.id === id);
    if (!debt) { debt = { id, ownerId: payerId, creditorId: receiverId, kind, currency, principal: 0n, interestBps: 0, assetId: null, monthlyPayment: 0n, remainingMonths: 0, missedPayments: 0 }; world.liabilities.push(debt); }
    debt.principal += remaining; post(world, 0n, remaining, kind, kind === 'restitution' ? 'Unpaid restitution' : 'Unpaid family obligation', debt.id, payer, currency);
  }
}
function setCustody(world: World, child: Person, a: Person, b: Person, preference: 'shared' | 'me' | 'them') {
  const fitness = (person: Person) => person.died || isConfined(world, person) || serviceAway(world,person.id) ? -1 : person.stats.health + person.stats.discipline + (relationFor(world, person.id, child.id)?.strength ?? 0);
  const requested = preference === 'them' ? b : a, alternative = requested.id === a.id ? b : a;
  const primary = requested.stats.health >= 25 && fitness(requested) >= 100 ? requested : fitness(alternative) > fitness(requested) ? alternative : requested;
  if (fitness(primary) < 0) throw new IneligibleAction('An available caregiver is required');
  const arrangement = preference === 'shared' && !a.died && !b.died && !isConfined(world, a) && !isConfined(world, b) && !serviceAway(world,a.id) && !serviceAway(world,b.id) && a.country === b.country && a.city === b.city ? 'shared' as const : 'sole' as const;
  for (const record of world.custody.filter(item => item.childId === child.id && !item.ended)) record.ended = { ...world.date };
  world.custody.push({ id: 'custody_' + child.id + '_' + world.revision, childId: child.id, a: a.id, b: b.id, primaryId: primary.id, arrangement, started: { ...world.date }, ended: null, lastReviewYear: world.date.year });
  if (!primary.householdId) ownHousehold(world, primary); moveHousehold(world, [child.id], primary.householdId!); child.country = primary.country; child.city = primary.city;
}
export function resolveFamily(world: World, command: FamilyCommand) {
  const player = active(world), age = ageOn(player, world.date); const relation = partnerRelation(world), partner = relation && otherPerson(world, relation);
  if (command.type === 'name-child') {
    const child = childrenOf(world).find(person => person.id === command.childId && !person.died && ageOn(person, world.date) < rules[person.country].adultAge);
    if (!child || child.householdId !== player.householdId) throw new IneligibleAction('Choose a living child in your care');
    child.firstName = command.firstName; fact(world, 'I named my child ' + fullName(child) + '.', 'family'); result(world, 'Name saved', 'Their identity and history remain the same.', 'blanket'); return;
  }
  if (age < rules[player.country].adultAge) throw new IneligibleAction('Family planning is available to adults');
  if (command.type === 'try-child') {
    const reason = conceptionReason(world, player, partner); if (reason) throw new IneligibleAction(reason);
    yearLimit(world, 'try-child');
    const carrier = player.biology.role === 'carry' ? player : partner!; const carrierAge = ageOn(carrier, world.date);
    const ageFactor = carrierAge >= 45 ? 8 : carrierAge >= 40 ? 30 : carrierAge >= 35 ? 60 : 90;
    const chance = Math.max(1, Math.round(ageFactor * Math.min(player.biology.fertility, partner!.biology.fertility) / 100 * Math.min(player.stats.health, partner!.stats.health) / 100));
    if (draw(world, 'outcomes', 1, 100) > chance) { fact(world, 'We tried for a child, but no pregnancy began this year.', 'family'); result(world, 'No pregnancy this year', 'You can try again next year. Age, health and fertility affect the chance.', 'hearts'); return; }
    startPregnancy(world, player, partner!); const due = world.pregnancies.at(-1)!.due;
    result(world, 'A baby on the way', (carrier.id === player.id ? 'You are pregnant.' : 'Your partner, ' + fullName(carrier) + ', is pregnant.') + ' The due date is ' + due.year + '-' + String(due.month).padStart(2, '0') + '. Time, care and health will matter in the coming months.', 'carriage'); return;
  }
  if (command.type === 'adopt') {
    if(serviceAway(world)||partner&&serviceAway(world,partner.id))throw new IneligibleAction('Return from your assignment before adoption placement');
    if (hospitalized(world, player) || partner && hospitalized(world, partner)) throw new IneligibleAction('Recover from hospital before applying for adoption');
    if (age < 21 || age > 65 || player.stats.health < 40 || !player.wantsChildren || !player.householdId || (!player.employment && player.finance.pensionAnnual <= 0n)) throw new IneligibleAction('Adoption requires age 21–65, stable health, a household, income and a wish to parent');
    if (partner && (!partner.wantsChildren || partner.stats.health < 40)) throw new IneligibleAction('Your partner is not ready for adoption');
    yearLimit(world, 'adopt'); charge(world, adoptionFee(world), 'adoption', 'Adoption assessment and placement');
    const parents = partner && (relation!.romance === 'married' || partner.householdId === player.householdId) ? [player, partner] : [player];
    const child = addChild(world, parents, 'adoptive', command.age); result(world, 'Welcome to the family', 'Your adopted child, ' + fullName(child) + ', has joined your family.', 'adoption'); return;
  }
  if (command.type === 'review-custody') {
    const existing = world.custody.find(item => item.childId === command.childId && !item.ended && (item.a === player.id || item.b === player.id));
    if (!existing || existing.lastReviewYear === world.date.year) throw new IneligibleAction('Custody can be reviewed once a year for an existing arrangement');
    const child = world.people[existing.childId], other = world.people[existing.a === player.id ? existing.b : existing.a];
    if (ageOn(child, world.date) >= rules[child.country].adultAge || child.died || other.died) throw new IneligibleAction('This arrangement no longer needs a review');
    setCustody(world, child, player, other, command.preference); fact(world, 'We reviewed the living arrangements for ' + child.firstName + '.', 'family'); result(world, 'Custody reviewed', 'The recorded arrangement follows the child’s care needs and your stated preference.', 'family-tree'); return;
  }
  const quote = divorceQuote(world, command.personId);
  if (quote.signed !== command.quotedPayment) throw new IneligibleAction('The settlement changed; review it again');
  const spouse = world.people[command.personId], marriage = world.marriages.find(item => !item.ended && (item.a === player.id && item.b === spouse.id || item.b === player.id && item.a === spouse.id))!;
  oweFamily(world, quote.payerId, quote.receiverId, quote.amount, quote.currency, 'settlement');
  marriage.ended = { ...world.date }; marriage.endReason = 'divorce';
  royalDivorce(world,player.id,spouse.id);
  const bond = relationFor(world, player.id, spouse.id)!; bond.romance = 'ex'; bond.roles = bond.roles.filter(role => role !== 'spouse' && role !== 'partner'); if (!bond.roles.length) bond.roles.push('acquaintance'); bond.kind = bond.roles[0]; bond.memories.push('divorce:' + world.date.year); bond.strength = bounded(bond.strength - 20); bond.trust = bounded(bond.trust - 10);
  ownHousehold(world, spouse); ownHousehold(world, player);
  const shared = childrenOf(world).filter(child => !child.died && ageOn(child, world.date) < rules[child.country].adultAge && childrenOf(world, spouse.id).some(person => person.id === child.id));
  for (const child of shared) setCustody(world, child, player, spouse, command.custody);
  player.stats.happiness = bounded(player.stats.happiness - 8); spouse.stats.happiness = bounded(spouse.stats.happiness - 8);
  fact(world, 'I divorced ' + fullName(spouse) + '. The marital gain settlement was ' + formatMoney({ minor: quote.amount, currency: quote.currency }) + '.', 'family');
  result(world, 'Separate lives', 'Your marriage has ended. The settlement reflects starting wealth and marital gains. Payments use available funds; any unpaid amount stays owed to your former spouse. Children’s living arrangements and support are set.', 'breakup');
}
export function careAfterDeath(world: World, personId: string) {
  for (const pregnancy of world.pregnancies.filter(item => item.status === 'pregnant' && item.carrierId === personId)) { pregnancy.status = 'ended-death'; pregnancy.ended = { ...world.date }; }
  for (const custody of world.custody.filter(item => !item.ended && (item.a === personId || item.b === personId || item.childId === personId))) custody.ended = { ...world.date };
  placeDependentChildren(world, personId);
}
/** Unavailable parents keep their identities and pregnancy; only actual dependent care moves. */
export function placeDependentChildren(world: World, personId: string) {
  const dependents = world.relationships.filter(item => item.from === personId && item.roles.some(role => role === 'parent' || role === 'guardian')).map(item => world.people[item.to]);
  for (const child of dependents.filter(person => !person.died && !isConfined(world, person) && !serviceAway(world,person.id) && ageOn(person, world.date) < rules[person.country].adultAge)) {
    const parents = world.relationships.filter(item => item.roles.includes('parent') && item.to === child.id).map(item => world.people[item.from]).filter(person => !person.died && !isConfined(world, person) && !serviceAway(world,person.id));
    const current = world.households.find(item => item.id === child.householdId);
    const adult = current?.members.map(id => world.people[id]).find(person => !person.died && !isConfined(world, person) && !serviceAway(world,person.id) && ageOn(person, world.date) >= rules[child.country].adultAge);
    if (adult && world.relationships.some(item => item.from === adult.id && item.to === child.id && item.roles.some(role => role === 'parent' || role === 'guardian'))) {
      for (const record of world.custody.filter(item => item.childId === child.id && !item.ended)) { if ([record.a, record.b].includes(adult.id)) { record.primaryId = adult.id; if (isConfined(world, record.a) || isConfined(world, record.b)) record.arrangement = 'sole'; } else record.ended = { ...world.date }; }
      continue;
    }
    let guardian = parents[0] ?? adult;
    if (!guardian) { const relatives = world.relationships.filter(item => item.roles.includes('parent') && item.to === personId).map(item => world.people[item.from]); guardian = relatives.find(person => !person.died && !isConfined(world, person) && !serviceAway(world,person.id) && ageOn(person, world.date) >= 18)!; }
    if (!guardian) guardian = createContact(world, { age: draw(world, 'npcs', 28, 55), country: child.country, city: child.city });
    if (!parents.some(parent => parent.id === guardian!.id)) linkParent(world, guardian, child, 'guardian');
    if (!guardian.householdId) ownHousehold(world, guardian); moveHousehold(world, [child.id], guardian.householdId!); child.country = guardian.country; child.city = guardian.city;
    for (const record of world.custody.filter(item => item.childId === child.id && !item.ended)) {
      if ([record.a, record.b].includes(guardian.id)) { record.primaryId = guardian.id; record.arrangement = 'sole'; }
      else record.ended = { ...world.date };
    }
    fact(world, 'I moved into the care of ' + fullName(guardian) + '.', 'family', '', child.id);
  }
}
export function familyMonth(world: World) {
  for (const pregnancy of world.pregnancies.filter(item => item.status === 'pregnant')) {
    const carrier = world.people[pregnancy.carrierId];
    if (carrier.died) { pregnancy.status = 'ended-death'; pregnancy.ended = { ...world.date }; continue; }
    const cost = isConfined(world, carrier) ? 0n : rules[carrier.country].doctorVisit / 3n;
    if (cost) charge(world, cost, 'prenatal-care', 'Pregnancy care', 'living', undefined, carrier);
    if (carrier.stats.health < 35 && draw(world, carrier.id === world.activePersonId ? 'outcomes' : 'npcs', 1, 100) <= 2) {
      pregnancy.status = 'lost'; pregnancy.ended = { ...world.date }; carrier.stats.happiness = bounded(carrier.stats.happiness - 15); fact(world, 'The pregnancy ended in a loss. I needed time and support.', 'family', '', carrier.id); continue;
    }
    if (compareDates(world.date, pregnancy.due) >= 0) {
      const child = addChild(world, [carrier, world.people[pregnancy.otherParentId]], 'biological'); pregnancy.status = 'born'; pregnancy.childId = child.id; pregnancy.ended = { ...world.date };
      const activeParent = [pregnancy.carrierId, pregnancy.otherParentId].includes(world.activePersonId);
      if (activeParent) offerPending(world, { kind: 'result', id: 'birth_' + child.id, title: 'Welcome, little one', body: fullName(child) + ' was born on ' + world.date.year + '-' + String(world.date.month).padStart(2, '0') + '-' + String(world.date.day).padStart(2, '0') + '. You can choose a name from their profile in Relationships.', illustration: 'carriage', effects: [] }, 90);
    }
  }
  for (const custody of world.custody.filter(item => !item.ended)) if (!living(world, custody.childId) || ageOn(world.people[custody.childId], world.date) >= rules[world.people[custody.childId].country].adultAge) custody.ended = { ...world.date };
}
export function familyFinanceMonth(world: World) {
  const support = new Map<string, World['custody']>();
  for (const custody of world.custody.filter(item => !item.ended)) {
    if (!living(world, custody.primaryId)) continue;
    const payerId = custody.a === custody.primaryId ? custody.b : custody.a;
    if (living(world, payerId) && world.people[payerId].householdId !== world.people[custody.primaryId].householdId) support.set(payerId, [...(support.get(payerId) ?? []), custody]);
  }
  for (const [payerId, arrangements] of support) {
    const payer = world.people[payerId], gross = payer.finance.supportIncomeDue;
    const total = roundRatio(gross * BigInt(Math.min(3000, arrangements.length * 1000)), 10000n);
    const count = BigInt(arrangements.length);
    arrangements.forEach((custody, index) => oweFamily(world, payerId, custody.primaryId, total / count + (BigInt(index) < total % count ? 1n : 0n), accountFor(world, payer).currency, 'child-support'));
  }
  for (const person of Object.values(world.people)) person.finance.supportIncomeDue = 0n;
  for (const debt of world.liabilities.filter(item => item.creditorId && item.principal > 0n && living(world, item.ownerId) && living(world, item.creditorId))) {
    const payer = world.people[debt.ownerId]; const account = accountFor(world, payer, debt.currency);
    const limit = availableCash(account) / 5n, paid = debt.principal < limit ? debt.principal : limit;
    const category = debt.kind === 'restitution' ? 'restitution-collection' : 'family-collection';
    if (!paid) continue; debt.principal -= paid; post(world, -paid, -paid, category, 'Payment of recorded obligation', debt.id, payer, debt.currency); post(world, paid, 0n, category, 'Recorded obligation received', null, world.people[debt.creditorId!], debt.currency);
  }
}
export function familyYear(world: World) {
  const newUnions = new Set(world.npcCourtships.flatMap(row => row.marriageId ? [row.marriageId] : []));
  const known = new Set<string>(), childCounts = new Map<string, number>();
  for (const row of world.relationships) {
    if (row.from === world.activePersonId) known.add(row.to); else if (row.to === world.activePersonId) known.add(row.from);
    if (row.roles.includes('parent')) childCounts.set(row.from, (childCounts.get(row.from) ?? 0) + 1);
  }
  const relevant = world.marriages.filter(row => newUnions.has(row.id) && !row.ended && row.a !== world.activePersonId && row.b !== world.activePersonId && known.has(row.a) && known.has(row.b) && row.started.year < world.date.year && (childCounts.get(row.a) ?? 0) < 3 && (childCounts.get(row.b) ?? 0) < 3).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const offset = relevant.length ? ((world.date.year % relevant.length) + relevant.length) % relevant.length : 0;
  const window = new Set(Array.from({ length: Math.min(relevant.length, 12) }, (_, index) => relevant[(offset + index) % relevant.length].id));
  const key = 'npc-family:' + world.date.year;
  for (const marriage of world.marriages.filter(item => !item.ended && item.a !== world.activePersonId && item.b !== world.activePersonId)) {
    const a = world.people[marriage.a], b = world.people[marriage.b];
    const autonomous = newUnions.has(marriage.id);
    const attemptKey = 'npc-family:' + marriage.id + ':' + world.date.year;
    if (autonomous && (!window.has(marriage.id) || world.actionCounts[key] || world.actionCounts[attemptKey] || a.legal.wanted || b.legal.wanted || romanceReason(world, b, a.id))) continue;
    if (childrenOf(world, a.id).length >= 3 || conceptionReason(world, a, b)) continue;
    if (autonomous) world.actionCounts[attemptKey] = 1;
    if (draw(world, 'npcs', 1, 100) <= 8) { startPregnancy(world, a, b); if (autonomous) world.actionCounts[key] = 1; }
  }
}
