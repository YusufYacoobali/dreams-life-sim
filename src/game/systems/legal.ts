import { z } from 'zod';
import { ageOn, compareDates, fullName } from '../personHelpers';
import type { Person, World } from '../model';
import { monthFrom } from '../calendar';
import { actionableCrimes, offences, OffenceId } from '../content/crime';
import { countries } from '../countries';
import { legalRules } from '../legalRules';
import { rules } from '../rules';
import { formatMoney, roundRatio } from '../money';
import { IneligibleAction } from '../errors';
import { RuntimeEffectRow } from '../runtime';
import { offerPending } from '../pendingQueue';
import { accountFor, active, availableCash, bounded, charge, draw, fact, post, result } from './common';
import { activeSentence, isConfined, prisonRoutineSchema } from './legalSchemas';
import { endEmployment } from './work';
import { addCondition, hospitalized } from './health';
import { placeDependentChildren, oweFamily } from './family';
import { createContact } from './npcs';
import { connectPerson, relationFor } from './relationships';
import { publicConviction } from './social';
export { activeSentence, isConfined } from './legalSchemas';
import { visibleConvictions } from './legalRecords';
export { visibleConvictions } from './legalRecords';

export const legalCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('crime'), offence: z.enum(actionableCrimes), victimId: z.string().optional() }),
  z.object({ type: z.literal('pay-bail'), caseId: z.string() }),
  z.object({ type: z.literal('retain-counsel'), caseId: z.string(), counsel: z.enum(['public', 'private', 'self']) }),
  z.object({ type: z.literal('prison-routine'), routine: prisonRoutineSchema }),
  z.object({ type: z.literal('prison-interact'), personId: z.string(), action: z.enum(['befriend', 'conflict']) }),
  z.object({ type: z.literal('appeal') }), z.object({ type: z.literal('parole') }),
  z.object({ type: z.literal('escape') }), z.object({ type: z.literal('surrender') }),
  z.object({ type: z.literal('bribe'), caseId: z.string() }),
  z.object({ type: z.literal('join-gang'), kind: z.enum(['street', 'prison']) }), z.object({ type: z.literal('leave-gang') }),
  z.object({ type: z.literal('black-market'), kind: z.enum(['counterfeit-watch', 'false-id', 'illicit-substance']), alias: z.string().trim().min(1).max(60).optional() }),
  z.object({ type: z.literal('contraband-action'), itemId: z.string(), action: z.enum(['sell', 'consume']) }),
]);
export type LegalCommand = z.infer<typeof legalCommandSchema>;
type Case = World['cases'][number];
type Incident = World['incidents'][number];
type Sentence = World['sentences'][number];
type Death = (world: World, personId: string, cause: string) => void;
const absolute = (world: World) => world.date.year * 12 + world.date.month - 1;
const amount = (world: World, bps: number, person = active(world)) => roundRatio(rules[person.country].baseWage * BigInt(bps), 10000n);
export const legalFee = (world: World, kind: 'appeal' | 'bribe' | 'affiliation') => ({ minor: amount(world, kind === 'bribe' ? 400 : kind === 'appeal' ? 200 : 50), currency: countries[active(world).country].currency });
export const prisonContacts = (world: World, sentence = activeSentence(world)) => sentence ? Object.values(world.people).filter(person => {
  if (person.id === sentence.personId || person.died || !isConfined(world, person) || person.country !== sentence.country || person.city !== sentence.city) return false;
  const other = activeSentence(world, person.id); if (other) return other.facility === sentence.facility;
  const juvenile = world.cases.find(item => sentence.caseIds.includes(item.id))?.juvenile;
  return world.cases.some(item => item.personId === person.id && item.status === 'awaiting-trial' && item.detained && item.juvenile === juvenile);
}) : [];
const row = (id: string, label: string, value: string, tone: RuntimeEffectRow['tone'] = 'neutral'): RuntimeEffectRow => ({ id, label, value, tone });
function limit(world: World, name: string, person = active(world)) {
  const key = person.id + ':legal:' + world.date.year + ':' + name;
  if (world.actionCounts[key]) throw new IneligibleAction('You have already tried this this year'); world.actionCounts[key] = 1;
}
export function crimeReason(world: World, offence: typeof actionableCrimes[number]): string | undefined {
  const person = active(world), definition = offences[offence];
  if (isConfined(world, person)) return 'You are in custody';
  if (person.legal.wanted) return 'Resolve your outstanding arrest first';
  if (ageOn(person, world.date) < Math.max(definition.minAge, legalRules[person.country].responsibilityAge)) return 'Available from age ' + Math.max(definition.minAge, legalRules[person.country].responsibilityAge);
  if (person.stats.smarts < definition.smarts) return 'Requires ' + definition.smarts + '% Smarts';
  if (person.legal.crimeSkill < definition.skill) return 'Requires crime experience of ' + definition.skill + '%';
  if (person.stats.energy < 10 || person.stats.health < 20 || person.health.hospitalizedUntil !== null) return 'Recover your health and energy first';
  if (offence === 'organized-job' && !world.gangs.some(item => item.id === person.legal.gangId && item.kind === 'street' && !item.left)) return 'Join an underground group first';
  if (world.actionCounts[person.id + ':legal:' + world.date.year + ':crime:' + offence]) return 'You already attempted this offence this year';
}
function incident(world: World, person: Person, offence: OffenceId, gain = 0n, victimId: string | null = null, restitution = gain): Incident {
  const currency = countries[person.country].currency, definition = offences[offence];
  const item: Incident = { id: 'incident_' + person.id + '_' + world.revision + '_' + world.incidents.length, personId: person.id, offence, date: { ...world.date }, country: person.country, city: person.city, victimId, victimKilled: false, gain: { minor: gain, currency }, restitution: { minor: restitution, currency }, evidence: draw(world, 'outcomes', 25, 95), detectionRoll: draw(world, 'outcomes', 1, 10000), followupRoll: draw(world, 'outcomes', 1, 100), trialRoll: draw(world, 'outcomes', 1, 100), riskBps: Math.max(1000, definition.riskBps - person.legal.crimeSkill * 20), investigateMonth: absolute(world) + draw(world, 'outcomes', 1, 6), stage: 'hidden', caseId: null };
  world.incidents.push(item); return item;
}
function planningPause(world: World, personId = world.activePersonId) { if (personId === world.activePersonId && world.annual?.stage === 'months') world.annual.pausedForPlanning = true; }
function bailReturn(world: World, item: Case) {
  if (item.bailState !== 'held') return;
  post(world, item.bail.minor, 0n, 'bail-return', 'Bail escrow returned', null, world.people[item.personId], item.bail.currency); item.bailState = 'returned';
}
function courtFine(world: World, item: Case) {
  if (!item.fine.minor) return;
  const person = world.people[item.personId], account = accountFor(world, person, item.fine.currency), paid = availableCash(account) < item.fine.minor ? availableCash(account) : item.fine.minor, debt = item.fine.minor - paid;
  if (debt) { item.fineDebtId = 'court_debt_' + item.id; world.liabilities.push({ id: item.fineDebtId, ownerId: person.id, creditorId: null, kind: 'fine', currency: item.fine.currency, principal: debt, interestBps: 0, assetId: null, monthlyPayment: 0n, remainingMonths: 0, missedPayments: 0 }); }
  post(world, -paid, debt, 'court-fine', 'Court fine: ' + offences[item.offence].title, item.fineDebtId, person, item.fine.currency);
}
function refundFine(world: World, item: Case) {
  if (item.fineRefunded) return;
  const person = world.people[item.personId], debt = world.liabilities.find(candidate => candidate.id === item.fineDebtId), unpaid = debt?.principal ?? 0n;
  if (debt && unpaid) { debt.principal = 0n; post(world, 0n, -unpaid, 'fine-reversal', 'Overturned court fine cancelled', debt.id, person, debt.currency); }
  const paid = item.fine.minor - unpaid; if (paid) post(world, paid, 0n, 'fine-refund', 'Overturned court fine refunded', null, person, item.fine.currency); item.fineRefunded = true;
}
export function payBail(world: World, caseId: string): RuntimeEffectRow[] {
  const item = world.cases.find(candidate => candidate.id === caseId && candidate.personId === world.activePersonId && candidate.status === 'awaiting-trial');
  if (!item || !item.detained || item.bailState !== 'unpaid') throw new IneligibleAction('This case has no unpaid bail');
  charge(world, item.bail.minor, 'bail-held', 'Bail placed in escrow', undefined, item.bail.currency); item.bailState = 'held'; item.detained = false; planningPause(world);
  return [row('bail', 'Bail held', formatMoney(item.bail)), row('custody', 'Custody', isConfined(world) ? 'Other custody order still applies' : 'Released pending hearing')];
}
function arrest(world: World, source: Incident): Case {
  const existing = world.cases.find(item => item.incidentId === source.id); if (existing) return existing;
  const person = world.people[source.personId], definition = offences[source.offence], profile = legalRules[source.country], currency = countries[source.country].currency;
  const juvenile = ageOn(person, world.date) < rules[source.country].adultAge;
  const item: Case = { id: 'case_' + source.id, incidentId: source.id, personId: person.id, offence: source.offence, country: source.country, city: source.city, opened: { ...world.date }, hearing: monthFrom(world.date, 1, world.date.day), status: 'awaiting-trial', detained: true, bail: { minor: roundRatio(rules[source.country].baseWage * BigInt(profile.bailBps) * BigInt(definition.violent ? 3 : 1), 10000n), currency }, bailState: 'unpaid', counsel: 'public', counselFee: { minor: roundRatio(rules[source.country].baseWage * 300n, 10000n), currency }, counselPaid: false, evidence: source.evidence, trialRoll: source.trialRoll, baseMonths: Math.max(1, Math.round(definition.months * profile.sentenceBps * (juvenile ? 5000 : 10000) / 100000000)), quotedFine: { minor: roundRatio(rules[source.country].baseWage * BigInt(definition.fineBps), 10000n), currency }, plea: null, resolved: null, fine: { minor: 0n, currency }, fineDebtId: null, fineRefunded: false, sentenceMonths: 0, sentenceId: null, juvenile, cooperation: false };
  world.cases.push(item); source.stage = 'charged'; source.caseId = item.id;
  for (const owned of world.contraband.filter(candidate => candidate.personId === person.id && candidate.status === 'owned')) owned.status = 'seized';
  placeDependentChildren(world, person.id);
  fact(world, 'I was arrested on a charge of ' + definition.title.toLowerCase() + '. A hearing was set for next month.', 'legal', '', person.id);
  if (person.id === world.activePersonId) {
    offerPending(world, { kind: 'decision', id: 'arrest_' + item.id, templateId: 'arrest', title: 'Under arrest', body: 'The police in ' + item.city + ' charge you with ' + definition.title.toLowerCase() + '. Your next appointment is a hearing. Bail is held until the case ends; a public defender is assigned, and you can review counsel before continuing the year.', illustration: 'police', personIds: [person.id], choices: [
      { id: 'bail', label: 'Post bail: ' + formatMoney(item.bail), effects: [{ kind: 'legal-bail', caseId: item.id }], resultTitle: 'Bail recorded', resultBody: 'An expensive way to keep the hearing on your calendar. Bail is held in escrow; any other custody order still applies. Review your case before continuing time.', journal: 'I posted bail for my pending case.' },
      { id: 'remand', label: 'Remain in custody', effects: [{ kind: 'legal-remand', caseId: item.id }], resultTitle: 'Held on remand', resultBody: 'You stay in custody. Ordinary work and outside activities pause; the hearing does not. You can review counsel before continuing time.', journal: 'I remained in custody until my hearing.' },
    ] }); planningPause(world);
  }
  return item;
}
function release(world: World, sentence: Sentence, reason: 'served' | 'parole' | 'appeal') {
  sentence.state = 'released'; sentence.ended = { ...world.date }; sentence.releaseReason = reason;
  const person = world.people[sentence.personId];
  const gang = world.gangs.find(item => item.id === person.legal.gangId && item.kind === 'prison' && !item.left); if (gang) { gang.left = { ...world.date }; person.legal.gangId = null; }
  fact(world, 'I was released from ' + sentence.facility + ' after ' + sentence.servedMonths + ' months served and ' + sentence.creditedMonths + ' months of remand credit.', 'legal', '', person.id);
  if (person.id === world.activePersonId) { offerPending(world, { kind: 'result', id: 'release_' + sentence.id, title: 'Released from custody', body: isConfined(world, person) ? 'This sentence ended. Another custody order still applies.' : 'You are free to rebuild your life. Your qualifications, family, property and actual court history remain yours.', illustration: 'release', effects: [row('release', 'Release', reason), row('record', 'Record', reason === 'appeal' ? 'Conviction overturned' : 'Conviction retained')] }, 85); planningPause(world); }
}
function ensurePrisonContacts(world: World, sentence: Sentence) {
  const juvenile = world.cases.find(item => sentence.caseIds.includes(item.id))!.juvenile;
  for (let count = prisonContacts(world, sentence).length; count < 2; count++) {
    const person = createContact(world, { age: juvenile ? draw(world, 'npcs', 14, 17) : draw(world, 'npcs', 22, 50), country: sentence.country, city: sentence.city });
    const source = incident(world, person, juvenile ? 'vandalism' : 'burglary'); arrest(world, source);
  }
}
const convictionChance = (world: World, item: Case, person: Person) => Math.max(10, Math.min(98, item.evidence + 20 + visibleConvictions(world, person).length * 3 - (item.counsel === 'private' ? 30 : item.counsel === 'public' ? 15 : 0) - (item.cooperation ? 15 : 0)));

export function hearCase(world: World, caseId: string, plea: 'guilty' | 'not-guilty' | 'leniency'): RuntimeEffectRow[] {
  const item = world.cases.find(candidate => candidate.id === caseId && candidate.status === 'awaiting-trial');
  if (!item || world.people[item.personId].legal.wanted) throw new IneligibleAction('This hearing is no longer available');
  const person = world.people[item.personId], source = world.incidents.find(candidate => candidate.id === item.incidentId)!;
  item.plea = plea; item.resolved = { ...world.date }; item.detained = false; source.stage = 'closed'; bailReturn(world, item);
  const chance = convictionChance(world, item, person);
  if (plea === 'not-guilty' && item.trialRoll > chance) {
    item.status = 'acquitted'; fact(world, 'I was acquitted of ' + offences[item.offence].title.toLowerCase() + '.', 'legal', '', person.id); planningPause(world, person.id);
    return [row('verdict', 'Verdict', 'Not guilty', 'positive'), row('bail', 'Bail', item.bailState === 'returned' ? 'Returned in full' : 'No escrow held')];
  }
  item.status = 'convicted'; item.fine.minor = roundRatio(item.quotedFine.minor * BigInt(plea === 'leniency' ? 70 : plea === 'guilty' ? 80 : 100), 100n);
  publicConviction(world, person, offences[item.offence].violent);
  courtFine(world, item);
  if (source.victimId && !world.people[source.victimId].died && source.restitution.minor) oweFamily(world, person.id, source.victimId, source.restitution.minor, source.restitution.currency, 'restitution');
  item.sentenceMonths = Math.max(1, Math.round(item.baseMonths * (plea === 'guilty' ? 0.7 : plea === 'leniency' ? 0.8 : 1)));
  let sentence = activeSentence(world, person.id);
  const creditRows = world.remand.filter(entry => entry.personId === person.id && entry.caseIds.includes(item.id) && !entry.usedBySentenceId);
  const credit = Math.min(item.sentenceMonths, creditRows.length);
  if (sentence) { sentence.caseIds.push(item.id); sentence.totalMonths += item.sentenceMonths; sentence.creditedMonths += credit; }
  else { sentence = { id: 'sentence_' + item.id, personId: person.id, caseIds: [item.id], country: item.country, city: item.city, facility: item.city + (item.juvenile ? ' Youth Centre' : ' Correctional Centre'), started: { ...world.date }, totalMonths: item.sentenceMonths, servedMonths: 0, creditedMonths: credit, lastServedMonth: absolute(world), state: 'active', ended: null, behavior: 50, routine: { work: false, study: false, exercise: false, conduct: 'quiet' }, studyMonths: 0, appealRoll: draw(world, 'outcomes', 1, 100), appealed: false, releaseReason: null }; world.sentences.push(sentence); }
  creditRows.slice(0, credit).forEach(entry => { entry.usedBySentenceId = sentence.id; }); item.sentenceId = sentence.id;
  if (person.employment) endEmployment(world, person.id); placeDependentChildren(world, person.id);
  person.stats.respect = bounded(person.stats.respect - (offences[item.offence].violent ? 15 : 7)); person.stats.stress = bounded(person.stats.stress + 10);
  fact(world, 'I was convicted of ' + offences[item.offence].title.toLowerCase() + ' and sentenced to ' + item.sentenceMonths + ' months, with ' + credit + ' months of remand credit.', 'legal', '', person.id); planningPause(world, person.id);
  if (sentence.servedMonths + sentence.creditedMonths >= sentence.totalMonths) release(world, sentence, 'served');
  else if (person.id === world.activePersonId) ensurePrisonContacts(world, sentence);
  return [row('verdict', 'Verdict', 'Guilty', 'negative'), row('sentence', 'Sentence', item.sentenceMonths + ' months', 'negative'), row('credit', 'Remand credit', credit + ' months'), row('fine', 'Fine', formatMoney(item.fine), 'negative')];
}
function commitCrime(world: World, command: Extract<LegalCommand, { type: 'crime' }>, death: Death) {
  const reason = crimeReason(world, command.offence); if (reason) throw new IneligibleAction(reason);
  const person = active(world), definition = offences[command.offence]; limit(world, 'crime:' + command.offence);
  let victim: Person | null = null;
  if (['pickpocket', 'robbery', 'assault'].includes(command.offence)) {
    victim = command.victimId ? world.people[command.victimId] : Object.values(world.people).find(candidate => candidate.id !== person.id && !candidate.died && !isConfined(world, candidate) && candidate.country === person.country && candidate.city === person.city && ageOn(candidate, world.date) >= 18) ?? createContact(world, { age: draw(world, 'npcs', 20, 60) });
    if (!victim || victim.id === person.id || victim.died || isConfined(world, victim) || victim.country !== person.country || victim.city !== person.city || ageOn(victim, world.date) < 18) throw new IneligibleAction('Choose a living adult in your city');
  }
  let gain = amount(world, definition.gainBps);
  if (victim) { const cash = availableCash(accountFor(world, victim)); gain = gain < cash ? gain : cash; if (gain) post(world, -gain, 0n, 'crime-loss', 'Money lost in a theft', null, victim); }
  if (gain) post(world, gain, 0n, 'crime-proceeds', definition.title + ' proceeds');
  const source = incident(world, person, command.offence, gain, victim?.id ?? null, gain + (definition.violent ? amount(world, 200) : 0n));
  person.stats.energy = bounded(person.stats.energy - 10); person.stats.stress = bounded(person.stats.stress + 7); person.stats.respect = bounded(person.stats.respect - (definition.violent ? 8 : 3)); person.legal.crimeSkill = bounded(person.legal.crimeSkill + 5);
  if (command.offence === 'organized-job') { const gang = world.gangs.find(item => item.id === person.legal.gangId)!; gang.standing = bounded(gang.standing + 10); gang.rank = Math.min(3, Math.floor(gang.standing / 25)); gang.lastIncomeMonth = absolute(world); }
  if (victim && definition.violent) {
    const injury = draw(world, 'outcomes', 8, 30); victim.stats.health = bounded(victim.stats.health - injury); addCondition(world, victim, 'fracture', injury + 20);
    if (victim.stats.health === 0) { source.victimKilled = true; source.offence = 'homicide'; source.riskBps = 10000; death(world, victim.id, 'injuries from an assault'); }
  }
  fact(world, 'I committed ' + definition.title.toLowerCase() + (victim ? ' against ' + fullName(victim) : '') + '. The consequences became part of my history.', 'crime');
  if (source.detectionRoll <= source.riskBps) arrest(world, source);
  else result(world, 'An unresolved risk', 'You leave without handcuffs. That is a head start, not an acquittal: the evidence can still lead to an investigation.', 'handcuffs', [row('gain', 'Proceeds', formatMoney(source.gain), gain ? 'positive' : 'neutral')]);
}
export function resolveLegal(world: World, command: LegalCommand, death: Death) {
  const person = active(world), sentence = activeSentence(world);
  if (command.type === 'crime') { commitCrime(world, command, death); return; }
  if (command.type === 'pay-bail') { const rows = payBail(world, command.caseId); result(world, 'Bail posted', 'Your hearing date is unchanged. Held bail remains part of your wealth until returned or forfeited.', 'justice', rows); return; }
  if (command.type === 'retain-counsel') {
    const item = world.cases.find(candidate => candidate.id === command.caseId && candidate.personId === person.id && candidate.status === 'awaiting-trial');
    if (!item) throw new IneligibleAction('Choose an open case');
    if (command.counsel === 'private' && !item.counselPaid) { charge(world, item.counselFee.minor, 'legal-fee', 'Private counsel', undefined, item.counselFee.currency); item.counselPaid = true; }
    item.counsel = command.counsel; result(world, 'Representation recorded', command.counsel === 'self' ? 'You are now both the client and the person expected to know what they are doing. The evidence has not changed.' : command.counsel === 'private' ? 'You have paid for an advocate, not a verdict. Your private counsel will argue against the existing evidence.' : 'A public defender will argue your case. The evidence still needs answering.', 'court'); return;
  }
  if (command.type === 'prison-routine') {
    if (!sentence) throw new IneligibleAction('An active sentence is required');
    if (command.routine.conduct === 'gang' && !world.gangs.some(item => item.id === person.legal.gangId && item.kind === 'prison' && !item.left)) throw new IneligibleAction('You have no prison group affiliation');
    sentence.routine = command.routine; result(world, 'Prison routine saved', 'Work, study, exercise and conduct take effect over actual months in custody.', 'prison'); return;
  }
  if (command.type === 'prison-interact') {
    const target = prisonContacts(world).find(person => person.id === command.personId); if (!sentence || !target) throw new IneligibleAction('Choose a person currently in the same prison'); limit(world, 'prison:' + command.action + ':' + target.id);
    connectPerson(world, target.id); const relation = relationFor(world, person.id, target.id)!;
    if (command.action === 'befriend') { relation.strength = bounded(relation.strength + 8); relation.trust = bounded(relation.trust + 5); if (!relation.roles.includes('friend')) relation.roles.push('friend'); if (relation.kind === 'acquaintance') relation.kind = 'friend'; relation.memories.push('prison-friendship:' + world.date.year); person.stats.happiness = bounded(person.stats.happiness + 3); fact(world, 'I got to know ' + fullName(target) + ' in prison.', 'relationships'); result(world, 'A familiar face inside', 'You shared a conversation in the yard. Their identity and your connection will remain after release.', 'prison-visit'); }
    else {
      const source = incident(world, person, 'assault', 0n, target.id, amount(world, 200)); target.stats.health = bounded(target.stats.health - draw(world, 'outcomes', 8, 20)); person.stats.health = bounded(person.stats.health - draw(world, 'outcomes', 3, 12)); addCondition(world, target, 'sprain', 40); sentence.behavior = bounded(sentence.behavior - 25); relation.strength = bounded(relation.strength - 20); relation.trust = bounded(relation.trust - 15); relation.memories.push('prison-conflict:' + world.date.year);
      if (!target.stats.health) { source.offence = 'homicide'; source.victimKilled = true; death(world, target.id, 'injuries from a prison conflict'); }
      fact(world, 'I was involved in a prison conflict with ' + fullName(target) + '.', 'crime'); arrest(world, source);
    } return;
  }
  if (command.type === 'appeal') {
    if (!sentence || sentence.appealed) throw new IneligibleAction('One appeal is available per sentence');
    const cost = amount(world, 200); charge(world, cost, 'legal-fee', 'Sentence appeal'); sentence.appealed = true;
    if (sentence.appealRoll <= 15) { for (const id of sentence.caseIds) { const item = world.cases.find(candidate => candidate.id === id)!; item.status = 'dismissed'; refundFine(world, item); } release(world, sentence, 'appeal'); }
    else result(world, 'Appeal dismissed', 'You paid to hear that the original judgment stands. The appeal fee is spent, and this sentence has no second appeal.', 'court'); return;
  }
  if (command.type === 'parole') {
    if (!sentence || sentence.servedMonths + sentence.creditedMonths < Math.ceil(sentence.totalMonths / 2) || sentence.behavior < 65) throw new IneligibleAction('Serve at least half the sentence and build good conduct to request parole');
    limit(world, 'parole:' + sentence.id);
    if (draw(world, 'outcomes', 1, 100) <= sentence.behavior - 20) release(world, sentence, 'parole'); else result(world, 'Parole declined', 'The board has kept your remaining sentence in place. You can apply in a later year.', 'court'); return;
  }
  if (command.type === 'escape') {
    if (!sentence) throw new IneligibleAction('You are not serving a sentence'); limit(world, 'escape');
    const source = incident(world, person, 'escape'); source.riskBps = 10000;
    if (draw(world, 'outcomes', 1, 100) <= Math.max(5, Math.min(45, Math.round((person.stats.smarts + person.stats.fitness) / 5)))) {
      sentence.state = 'escaped'; person.legal.wanted = true;
      for (const item of world.cases.filter(candidate => candidate.personId === person.id && candidate.status === 'awaiting-trial')) { if (item.bailState === 'held') item.bailState = 'forfeited'; item.detained = false; }
      fact(world, 'I escaped from custody. My remaining sentence stopped counting down.', 'legal'); result(world, 'Fugitive', 'You got out. Now you are wanted, and your remaining sentence has stopped counting down. Any held bail is forfeited. You can surrender; freedom currently comes with an arrest risk.', 'handcuffs');
    } else { sentence.behavior = bounded(sentence.behavior - 25); arrest(world, source); }
    return;
  }
  if (command.type === 'surrender') { if (!person.legal.wanted) throw new IneligibleAction('There is no outstanding pursuit'); recapture(world, person); result(world, 'Back in custody', 'Your remaining sentence resumes from the recorded amount. Any unresolved charges still require a hearing.', 'police'); return; }
  if (command.type === 'bribe') {
    const item = world.cases.find(candidate => candidate.id === command.caseId && candidate.personId === person.id && candidate.status === 'awaiting-trial'); if (!item) throw new IneligibleAction('Choose an open case'); limit(world, 'bribe:' + item.id);
    charge(world, amount(world, 400), 'bribery-loss', 'Money lost attempting corruption'); const source = incident(world, person, 'bribery');
    if (draw(world, 'outcomes', 1, 100) <= 15) { item.evidence = Math.max(10, item.evidence - 15); result(world, 'A dangerous bargain', 'The case remains open. Evidence has weakened, but no outcome is guaranteed and the corruption incident remains recorded.', 'justice'); }
    else { source.riskBps = 10000; arrest(world, source); } return;
  }
  resolveUnderground(world, command);
}
function recapture(world: World, person: Person) {
  person.legal.wanted = false;
  const escaped = world.sentences.find(item => item.personId === person.id && item.state === 'escaped'); if (escaped) { escaped.state = 'active'; escaped.lastServedMonth = absolute(world); }
  for (const item of world.cases.filter(candidate => candidate.personId === person.id && candidate.status === 'awaiting-trial')) { item.detained = true; item.hearing = monthFrom(world.date, 1, world.date.day); }
  for (const source of world.incidents.filter(item => item.personId === person.id && item.stage === 'hidden' && item.offence === 'escape')) arrest(world, source);
  placeDependentChildren(world, person.id); fact(world, 'I returned to custody. My outstanding sentence and charges remained attached to my identity.', 'legal', '', person.id); planningPause(world, person.id);
}
function resolveUnderground(world: World, command: Exclude<LegalCommand, { type: 'crime' }>) {
  const person = active(world), sentence = activeSentence(world);
  if (ageOn(person, world.date) < 18) throw new IneligibleAction('Available to adults');
  if (command.type === 'join-gang') {
    if (person.legal.wanted || isConfined(world) && !sentence) throw new IneligibleAction('Resolve your current custody or pursuit first');
    if (person.legal.gangId) throw new IneligibleAction('Leave your current group first');
    if ((command.kind === 'prison') !== !!sentence) throw new IneligibleAction(command.kind === 'prison' ? 'You need an active sentence' : 'Street groups are unavailable in custody');
    limit(world, 'join-group'); charge(world, amount(world, 50), 'group-fee', 'Underground affiliation fee');
    if (command.kind === 'prison' && sentence) ensurePrisonContacts(world, sentence);
    const contacts = command.kind === 'prison' ? prisonContacts(world).slice(0, 2) : [createContact(world, { age: draw(world, 'npcs', 22, 50) }), createContact(world, { age: draw(world, 'npcs', 22, 50) })];
    for (const contact of contacts) connectPerson(world, contact.id);
    const gang: World['gangs'][number] = { id: 'gang_' + person.id + '_' + world.revision, personId: person.id, kind: command.kind, sentenceId: sentence?.id ?? null, name: command.kind === 'prison' ? 'The Yard Circle' : 'The Night Exchange', joined: { ...world.date }, left: null, rank: 0, standing: 40, contactIds: contacts.map(item => item.id), lastIncomeMonth: absolute(world) };
    world.gangs.push(gang); person.legal.gangId = gang.id; fact(world, 'I joined ' + gang.name + '.', 'crime'); result(world, 'An uneasy affiliation', 'Your contacts and standing are now recorded. Membership brings risk; it does not create an automatic salary.', 'handcuffs'); return;
  }
  if (command.type === 'leave-gang') {
    const gang = world.gangs.find(item => item.id === person.legal.gangId && !item.left); if (!gang) throw new IneligibleAction('You have no group affiliation');
    gang.left = { ...world.date }; person.legal.gangId = null; person.stats.stress = bounded(person.stats.stress + 8); fact(world, 'I left ' + gang.name + '.', 'crime'); result(world, 'Walking away', 'Your former affiliation remains in your history. Your contacts keep their identities.', 'release'); return;
  }
  if (command.type === 'black-market') {
    if (isConfined(world) || person.legal.wanted) throw new IneligibleAction('The market is unavailable in custody or during a pursuit'); limit(world, 'market:' + command.kind);
    const cost = amount(world, command.kind === 'counterfeit-watch' ? 100 : command.kind === 'false-id' ? 200 : 50); charge(world, cost, 'illicit-purchase', 'Black market purchase');
    const alias = command.kind === 'false-id' ? command.alias ?? person.firstName + ' Vale' : null;
    if (alias && /[\u0000-\u001F]/.test(alias)) throw new IneligibleAction('Choose a valid alias');
    const value = command.kind === 'counterfeit-watch' ? cost * 4n / 5n : 0n, currency = countries[person.country].currency;
    world.contraband.push({ id: 'contraband_' + world.revision, personId: person.id, kind: command.kind, acquired: { ...world.date }, pricePaid: { minor: cost, currency }, value: { minor: value, currency }, status: 'owned', alias });
    if (alias && !person.legal.aliases.includes(alias)) { if (person.legal.aliases.length === 5) person.legal.aliases.shift(); person.legal.aliases.push(alias); }
    const source = incident(world, person, 'contraband'); if (source.detectionRoll <= 1500) arrest(world, source); else result(world, 'Purchase recorded', alias ? 'The alias is recorded. It cannot erase your real identity, family or legal record.' : 'The item is recorded in your inventory. It may be seized if you are arrested.', 'handcuffs'); return;
  }
  if (command.type === 'contraband-action') {
    const item = world.contraband.find(candidate => candidate.id === command.itemId && candidate.personId === person.id && candidate.status === 'owned'); if (!item) throw new IneligibleAction('This item is no longer available');
    if (isConfined(world) || person.legal.wanted) throw new IneligibleAction('These items are unavailable during custody or pursuit');
    if (command.action === 'consume') { if (item.kind !== 'illicit-substance') throw new IneligibleAction('This item cannot be consumed'); item.status = 'consumed'; person.stats.health = bounded(person.stats.health - 8); person.stats.stress = bounded(person.stats.stress - 4); addCondition(world, person, 'dependence', 35); result(world, 'A harmful choice', 'The substance is gone. Your health and dependence risk are now part of your medical history.', 'medicine'); }
    else { if (!item.value.minor) throw new IneligibleAction('This item has no resale value'); item.status = 'sold'; post(world, item.value.minor, 0n, 'illicit-sale', 'Sale of counterfeit property', null, person, item.value.currency); const source = incident(world, person, 'contraband', item.value.minor); if (source.detectionRoll <= source.riskBps) arrest(world, source); else result(world, 'Item sold', 'The actual resale proceeds reached your account. An investigation remains possible.', 'handcuffs'); }
    return;
  }
  throw new IneligibleAction('This legal action is unavailable');
}
/** Called after the month's ordinary pay and care: a new arrest cannot revoke pay already earned. */
export function legalMonth(world: World, dischargedFromHospital?: ReadonlySet<string>) {
  const month = absolute(world);
  for (const person of Object.values(world.people)) if (!person.died) {
    const remanded = world.cases.filter(item => item.personId === person.id && item.status === 'awaiting-trial' && item.detained && item.opened.year * 12 + item.opened.month - 1 < month);
    if (remanded.length && !world.remand.some(item => item.personId === person.id && item.month === month)) world.remand.push({ personId: person.id, month, caseIds: remanded.map(item => item.id), usedBySentenceId: activeSentence(world, person.id)?.id ?? null });
    const sentence = activeSentence(world, person.id);
    if (sentence && sentence.lastServedMonth < month) {
      sentence.lastServedMonth = month; sentence.servedMonths++;
      const routine = sentence.routine, attending = !hospitalized(world, person) && !dischargedFromHospital?.has(person.id);
      sentence.behavior = bounded(sentence.behavior + (routine.conduct === 'quiet' ? 3 : routine.conduct === 'social' ? 1 : -3));
      if (routine.work && attending) { const pay = rules[sentence.country].baseWage / 2400n; if (pay) { post(world, pay, 0n, 'prison-pay', 'Prison work stipend', null, person, countries[sentence.country].currency); person.finance.cycleGross += pay; } }
      if (routine.study && attending) { sentence.studyMonths++; person.stats.smarts = bounded(person.stats.smarts + (sentence.studyMonths % 3 === 0 ? 1 : 0)); if (sentence.studyMonths >= 12 && !person.education.qualifications.some(item => item.level === 'secondary')) { person.education.qualifications.push({ level: 'secondary', field: 'general', year: world.date.year }); person.education.stage = 'none'; fact(world, 'I earned a secondary equivalency qualification through prison study.', 'education', '', person.id); } }
      if (routine.exercise && attending) person.stats.fitness = bounded(person.stats.fitness + 1);
      person.stats.stress = bounded(person.stats.stress + (routine.conduct === 'gang' ? 2 : -1));
      if (sentence.servedMonths + sentence.creditedMonths >= sentence.totalMonths) release(world, sentence, 'served');
    }
    if (person.legal.wanted && draw(world, 'outcomes', 1, 100) <= 35) recapture(world, person);
  }
  for (const source of world.incidents.filter(item => item.stage === 'hidden' && item.investigateMonth <= month)) {
    const person = world.people[source.personId]; if (person.died) { source.stage = 'closed'; continue; } if (person.legal.wanted) continue;
    if (source.offence === 'escape' || source.followupRoll <= Math.round(source.evidence / 2)) arrest(world, source); else source.stage = 'closed';
  }
  for (const item of world.cases.filter(candidate => candidate.status === 'awaiting-trial' && compareDates(candidate.hearing, world.date) <= 0 && !world.people[candidate.personId].legal.wanted)) {
    if (item.personId !== world.activePersonId) { hearCase(world, item.id, 'not-guilty'); continue; }
    const id = 'hearing_' + item.id;
    if (world.pending?.id === id || world.deferred.some(entry => entry.event.id === id)) continue;
    const person = world.people[item.personId]; offerPending(world, { kind: 'decision', id, templateId: 'court-hearing', title: 'Your day in court', body: 'The court in ' + item.city + ' calls your ' + offences[item.offence].title.toLowerCase() + ' case. This is a bad time to discover that confidence is not evidence. Evidence strength: ' + item.evidence + '%. Counsel: ' + item.counsel + '. Baseline sentence: ' + item.baseMonths + ' months. A guilty plea cuts the term; seeking leniency cuts the fine further. Contesting the charge risks the full penalty.', illustration: 'court', personIds: [person.id], choices: (['not-guilty', 'guilty', 'leniency'] as const).map(plea => ({ id: plea, label: plea === 'not-guilty' ? 'Plead not guilty: fight the charge' : plea === 'guilty' ? 'Plead guilty: take the shorter term' : 'Accept responsibility and seek leniency', effects: [{ kind: 'legal-plea' as const, caseId: item.id, plea }], resultTitle: 'The court has decided', resultBody: plea === 'not-guilty' ? 'You fight the charge. The court gives its verdict below; any fine, remand credit and sentence are real.' : plea === 'guilty' ? 'You plead guilty for a shorter term. The conviction, reduced sentence and fine are below; any unpaid fine becomes debt.' : 'You accept responsibility and ask for mercy. The reduced fine and sentence are below; a lighter penalty still leaves a conviction.', journal: 'I entered a ' + plea + ' plea at my hearing.' })) }); planningPause(world);
  }
}
export function legalDeath(world: World, person: Person) {
  person.legal.wanted = false;
  for (const item of world.cases.filter(candidate => candidate.personId === person.id && candidate.status === 'awaiting-trial')) { item.status = 'abated'; item.detained = false; item.resolved = { ...world.date }; bailReturn(world, item); const source = world.incidents.find(candidate => candidate.id === item.incidentId); if (source) source.stage = 'closed'; }
  for (const sentence of world.sentences.filter(item => item.personId === person.id && (item.state === 'active' || item.state === 'escaped'))) { sentence.state = 'death'; sentence.ended = { ...world.date }; sentence.releaseReason = 'death'; }
  for (const gang of world.gangs.filter(item => item.personId === person.id && !item.left)) gang.left = { ...world.date }; person.legal.gangId = null;
}
/** Shared gate prevents a deep link or direct command from bypassing custody. */
export function custodyReason(world: World, commandType: string): string | undefined {
  if (!isConfined(world)) return;
  const permitted = ['advance', 'resume', 'choose', 'acknowledge', 'leave-recovery', 'recovery-effort', 'stop-career-training', 'royal-duties', 'renounce-title', 'leave-service', 'return-assignment', 'service-focus', 'leave-career', 'career-focus', 'cancel-recording', 'withdraw-campaign', 'campaign-plan', 'pay-bail', 'retain-counsel', 'prison-routine', 'prison-interact', 'appeal', 'parole', 'escape', 'bribe', 'join-gang', 'leave-gang', 'consult', 'treat', 'stop-treatment', 'vaccinate', 'meditate', 'self-improvement', 'repay', 'exchange', 'save-will', 'revoke-will', 'name-child', 'interact', 'relationship-preferences', 'edit-social', 'social-routine', 'delete-social', 'reopen-social', 'cancel-sponsor', 'business-prices', 'business-marketing', 'business-payout-policy', 'hire-business-staff', 'dismiss-business-staff', 'fund-business', 'improve-business', 'expand-business', 'withdraw-business-profit', 'sell-business', 'breakup', 'end-best-friendship', 'end-teen-relationship', 'gift-money', 'sell-asset', 'insure', 'rent-property', 'stop-renting', 'list-property', 'cancel-listing', 'sell-investment', 'buy-investment', 'divorce'];
  return permitted.includes(commandType) ? undefined : 'This activity is unavailable while you are in custody';
}
