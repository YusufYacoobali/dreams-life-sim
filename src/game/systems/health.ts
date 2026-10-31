import { storyPersonPresent } from './storyContext';
import { serviceAway } from './serviceSchemas';
import { z } from 'zod';
import { ageOn, compareDates } from '../personHelpers';
import type { Person, World } from '../model';
import { ConditionId, conditions } from '../content/health';
import { countries } from '../countries';
import { rules } from '../rules';
import { formatMoney } from '../money';
import { fxMoney } from '../valuation';
import { IneligibleAction } from '../errors';
import { accountFor, active, availableCash, bounded, charge, draw, fact, post, result } from './common';
import { routineSchema, hospitalized, newMedicalEpisode } from './healthSchemas';
export { hospitalized } from './healthSchemas';
import { createContact, hireNpc } from './npcs';
import { endEmployment } from './work';
import { isConfined } from './legalSchemas';
import { activeTrip } from './travelSchemas';
import { offerPending } from '../pendingQueue';
import type { Effect, Pending, RuntimeEffectRow } from '../runtime';
export const healthCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('health-routine'), routine: routineSchema }),
  z.object({ type: z.literal('consult'), service: z.enum(['checkup', 'symptoms', 'tests', 'specialist']) }),
  z.object({ type: z.literal('treat'), conditionId: z.string() }),
  z.object({ type: z.literal('stop-treatment'), conditionId: z.string() }),
  z.object({ type: z.literal('vaccinate'), vaccine: z.enum(['routine', 'seasonal']) }),
  z.object({ type: z.literal('exercise'), activity: z.enum(['walk', 'run', 'gym', 'sport', 'class', 'trainer']) }),
  z.object({ type: z.literal('meditate') }),
  z.object({ type: z.literal('self-improvement') }),
  z.object({ type: z.literal('fertility-care') }),
  z.object({ type: z.literal('cosmetic-care') }),
]);
export type HealthCommand = z.infer<typeof healthCommandSchema>;
export type Condition = Person['health']['conditions'][number];
const absolute = (world: World) => world.date.year * 12 + world.date.month - 1;
export const substanceAges = (person: Person) => ({ alcohol: person.country === 'US' ? 21 : person.country === 'JP' ? 20 : person.country === 'IN' ? 25 : 18, smoking: person.country === 'US' ? 21 : person.country === 'JP' ? 20 : 18 });
export function carePayer(world: World, patient: Person): Person {
  if (ageOn(patient, world.date) >= rules[patient.country].adultAge) return patient;
  const guardianIds = world.relationships.filter(item => item.to === patient.id && item.roles.some(role => role === 'parent' || role === 'guardian')).map(item => item.from);
  const guardians = guardianIds.map(id => world.people[id]).filter(person => !person.died && ageOn(person, world.date) >= rules[person.country].adultAge);
  return guardians.find(person => person.householdId === patient.householdId) ?? guardians[0] ?? patient;
}
export function medicalQuote(world: World, cost: bigint, patient = active(world)) {
  const payer = carePayer(world, patient), currency = countries[payer.country].currency;
  return { payer, currency, amount: fxMoney(world, { minor: cost, currency: countries[patient.country].currency }, currency).minor };
}
export const consultationCost = (world: World, service: 'checkup' | 'symptoms' | 'tests' | 'specialist', person = active(world)) => isConfined(world, person) ? 0n : rules[person.country].doctorVisit * BigInt(service === 'specialist' ? 4 : service === 'tests' ? 2 : 1);
export function providerFor(world: World, patient: Person): Person {
  let provider = patient.health.providerId ? world.people[patient.health.providerId] : undefined;
  const payerId = carePayer(world, patient).id;
  const available = (candidate: Person | undefined) => !!candidate && candidate.id !== patient.id && candidate.id !== payerId && candidate.country === patient.country && candidate.city === patient.city && candidate.employment?.roleId === 'doctor' && storyPersonPresent(world, candidate);
  if (!available(provider)) provider = Object.values(world.people).find(available);
  if (!provider) {
    provider = createContact(world, { age: draw(world, 'npcs', 35, 55), country: patient.country, city: patient.city });
    provider.stats.smarts = Math.max(80, provider.stats.smarts); endEmployment(world, provider.id);
    for (const qualification of [{ level: 'secondary' as const, field: 'general', year: provider.born.year + rules[provider.country].schoolEnd }, { level: 'degree' as const, field: 'medicine', year: provider.born.year + rules[provider.country].schoolEnd + 4 }, { level: 'medicine' as const, field: 'medicine', year: provider.born.year + rules[provider.country].schoolEnd + 8 }]) if (!provider.education.qualifications.some(item => item.level === qualification.level && item.field === qualification.field)) provider.education.qualifications.push(qualification);
    hireNpc(world, provider, 'doctor');
  }
  patient.health.providerId = provider.id; return provider;
}
function payMedical(world: World, patient: Person, provider: Person | null, localCost: bigint, kind: string, emergency = false, unavoidable = false) {
  const quote = medicalQuote(world, localCost, patient);
  if (!unavoidable && quote.amount && quote.payer.id === patient.id && ageOn(patient, world.date) < rules[patient.country].adultAge) throw new IneligibleAction('A funded adult caregiver is required for this visit');
  charge(world, quote.amount, 'healthcare', kind + ': ' + patient.firstName, emergency ? 'living' : undefined, quote.currency, quote.payer);
  // A public clinic's zero patient charge is supported by its provider's recorded salary.
  if (provider && localCost) { post(world, localCost, 0n, 'clinic-income', 'Clinical care for ' + patient.firstName, null, provider); provider.finance.cycleGross += localCost; }
  return quote;
}
function record(world: World, person: Person, kind: string, text: string, localCost = 0n, providerId: string | null = null, conditionId: string | null = null) {
  const quote = medicalQuote(world, localCost, person);
  person.health.records.push({ id: 'medical_' + world.revision + '_' + person.id + '_' + person.health.records.length, date: { ...world.date }, kind, text, cost: localCost, currency: countries[person.country].currency, paidMinor: quote.amount, paidCurrency: quote.currency, payerId: quote.payer.id, providerId, conditionId });
}
function limit(world: World, action: string, person = active(world)) {
  const key = person.id + ':health:' + world.date.year + ':' + action;
  if (world.actionCounts[key]) throw new IneligibleAction('You have already tried this this year'); world.actionCounts[key] = 1;
}
export function addCondition(world: World, person: Person, type: ConditionId, severity: number, writeJournal = true): Condition {
  const existing = person.health.conditions.find(item => item.type === type && item.status !== 'recovered');
  if (existing) { existing.severity = bounded(existing.severity + Math.floor(severity / 3)); return existing; }
  const condition: Condition = { id: 'condition_' + person.id + '_' + world.revision + '_' + person.health.conditions.length, type, onset: { ...world.date }, severity: bounded(severity), status: 'active', diagnosed: null, resolved: null, months: 0, treatment: null, lastEmergencyYear: null, episode: newMedicalEpisode() };
  person.health.conditions.push(condition); if (writeJournal) fact(world, 'I developed symptoms: ' + conditions[type].symptoms.toLowerCase() + '.', 'health', '', person.id); return condition;
}
function diagnose(world: World, patient: Person, provider: Person, service: 'checkup' | 'symptoms' | 'tests' | 'specialist') {
  const diagnosed: Condition[] = [], stream = patient.id === world.activePersonId ? 'outcomes' : 'npcs';
  for (const condition of patient.health.conditions.filter(item => item.status !== 'recovered' && !item.diagnosed)) {
    condition.episode.assessed = true;
    const chance = service === 'specialist' ? 96 : service === 'tests' ? 90 : service === 'symptoms' ? 80 : 60;
    if (draw(world, stream, 1, 100) <= chance) { condition.diagnosed = { ...world.date }; diagnosed.push(condition); record(world, patient, 'diagnosis', 'Dr ' + provider.lastName + ' diagnosed ' + conditions[condition.type].name + '.', 0n, provider.id, condition.id); }
  }
  return diagnosed;
}
export const treatmentCost = (world: World, condition: Condition, person = active(world)) => isConfined(world, person) ? 0n : rules[person.country].doctorVisit * BigInt(conditions[condition.type].costFactor);
function startTreatment(world: World, person: Person, condition: Condition, provider: Person, emergency = false, quotedCost?: bigint, unavoidable = false) {
  const method = conditions[condition.type].treatment, cost = quotedCost ?? treatmentCost(world, condition, person), stream = person.id === world.activePersonId ? 'outcomes' : 'npcs';
  payMedical(world, person, provider, cost, emergency ? 'Emergency care' : 'Treatment', emergency, unavoidable);
  condition.episode.notified = true; condition.episode.assessed = true;
  const roll = draw(world, stream, 1, 100), outcome = roll <= (method === 'specialist' ? 70 : 85) ? 'effective' as const : roll <= 95 ? 'limited' as const : 'side-effect' as const;
  condition.treatment = { method, started: { ...world.date }, months: 0, outcome, paid: cost, currency: countries[person.country].currency, lastPaymentMonth: absolute(world) };
  if (emergency) { const assignment=serviceAway(world,person.id);if(assignment){assignment.status='returned';assignment.ended={...world.date};fact(world,'I returned from my assignment for hospital care.','career','',person.id);} person.health.hospitalizedUntil = absolute(world) + 2; person.stats.health = bounded(person.stats.health + (outcome === 'effective' ? 12 : outcome === 'limited' ? 4 : -3)); condition.severity = bounded(condition.severity - (outcome === 'effective' ? 15 : 3)); }
  record(world, person, emergency ? 'hospital' : 'treatment', (emergency ? 'Hospital care and ' : '') + method + ' programme started for ' + conditions[condition.type].name + '.', cost, provider.id, condition.id);
  fact(world, 'I began ' + method + ' care for ' + conditions[condition.type].name + '.', 'health', '', person.id);
}
export function emergencyCare(world: World, personId: string, conditionId: string, accepted: boolean, quotedCost?: bigint, unavoidable = false) {
  const person = world.people[personId], condition = person?.health.conditions.find(item => item.id === conditionId && item.status !== 'recovered');
  if (!person || person.died || !condition) throw new IneligibleAction('This medical emergency is no longer active');
  if (accepted) { condition.diagnosed ??= { ...world.date }; startTreatment(world, person, condition, providerFor(world, person), true, quotedCost, unavoidable); condition.episode = { notified: true, assessed: true, admissionAt: { ...world.date }, stabilized: false }; }
  else { condition.severity = bounded(condition.severity + 5); person.stats.stress = bounded(person.stats.stress + 5); record(world, person, 'declined-care', 'Emergency assessment was declined.', 0n, null, condition.id); }
  return [{ id: 'care', label: 'Medical care', value: accepted ? 'Admitted to hospital' : 'Declined', tone: accepted ? 'positive' as const : 'negative' as const }];
}

type MedicalEpisodeEffect = Extract<Effect, { kind: 'medical-episode' }>;
export type MedicalEpisodeOutcome = { title: string; body: string; journal: string; effects: RuntimeEffectRow[]; decision?: Extract<Pending, { kind: 'decision' }>; additionalDecisions?: Extract<Pending, { kind: 'decision' }>[] };
const careLabels = { support: 'supportive care', rehabilitation: 'rehabilitation', medication: 'medication', therapy: 'therapy', specialist: 'specialist care', rehab: 'recovery support' } as const;
/** These definitions describe genuine crises, not every high symptom score.
 * Brief self-resolving infections, sprains and ordinary anxiety never auto-admit. */
const urgentThresholds: Partial<Record<ConditionId, number>> = { measles: 95, fracture: 95, asthma: 90, hypertension: 95, diabetes: 90, cancer: 90, 'heart-disease': 85, dependence: 95 };

export function medicalEpisodeReason(world: World, effect: MedicalEpisodeEffect): string | undefined {
  const patient = world.people[effect.personId], condition = patient?.health.conditions.find(item => item.id === effect.conditionId && item.status !== 'recovered');
  if (!patient || patient.died || patient.id !== world.activePersonId || !condition) return 'This medical concern is no longer active';
  if (effect.action === 'ignore' || effect.action === 'leave') return;
  if (effect.action === 'assess' && serviceAway(world, patient.id)) return 'Return from your assignment before this in-person activity';
  if (activeTrip(world, patient.id)) return 'Return from your trip before this activity at home';
  if (effect.action === 'treat' && (!condition.diagnosed || condition.treatment)) return condition.treatment ? 'Treatment is already active' : 'An assessment is needed first';
  if (effect.action === 'assess' && condition.episode.assessed) return 'This concern has already been assessed. Further visits are available at the clinic.';
  const quote = medicalQuote(world, effect.quotedCost, patient);
  if (quote.amount && quote.payer.id === patient.id && ageOn(patient, world.date) < rules[patient.country].adultAge) return 'A funded adult caregiver is required for this visit';
  if (availableCash(accountFor(world, quote.payer)) < quote.amount) return 'Not enough available money for this care';
  if (effect.action === 'treat' && world.actionCounts[patient.id + ':health:' + world.date.year + ':treat:' + condition.id]) return 'You have already tried this treatment this year';
}

function diagnosisDecision(world: World, patient: Person, condition: Condition, provider: Person): Extract<Pending, { kind: 'decision' }> {
  condition.episode.notified = true;
  const definition = conditions[condition.type], cost = treatmentCost(world, condition, patient), fee = formatMoney({ minor: cost, currency: countries[patient.country].currency });
  const monthly = isConfined(world, patient) ? 0n : rules[patient.country].doctorVisit / 6n;
  return { kind: 'decision', id: 'diagnosis_' + condition.id + '_' + world.revision, templateId: 'medical-diagnosis', title: 'Bad News', body: 'Dr ' + provider.lastName + ' diagnoses ' + definition.name.toLowerCase() + '. The next step is ' + careLabels[definition.treatment] + '. Initial fee: ' + fee + '; monthly care: ' + formatMoney({ minor: monthly, currency: countries[patient.country].currency }) + '.', illustration: 'doctor', personIds: [patient.id], choices: [
    { id: 'treat', label: 'Start Treatment', effects: [{ kind: 'medical-episode', personId: patient.id, conditionId: condition.id, action: 'treat', quotedCost: cost }], resultTitle: 'Care has begun', resultBody: 'You start the recommended care. Improvement takes time.', journal: 'I started treatment for ' + definition.name + '.' },
    { id: 'leave', label: 'Leave It for Now', effects: [{ kind: 'medical-episode', personId: patient.id, conditionId: condition.id, action: 'leave', quotedCost: 0n }], resultTitle: 'Care can wait. Apparently.', resultBody: 'You leave the treatment for another day. The illness has made no such promise.', journal: 'I put off treatment for ' + definition.name + '.' },
  ] };
}

/** Only prospective episode offers can be superseded by actual clinical care.
 * Existing legacy medical-emergency decisions and all historical records remain
 * byte-for-byte intact. One assessment can cover several currently queued concerns. */
function withdrawEpisodeOffers(world: World, patient: Person, assessed: ReadonlySet<string>, includeDiagnosis = false) {
  const covered = (event: Pending) => event.kind === 'decision' && (event.templateId === 'medical-symptoms' || includeDiagnosis && event.templateId === 'medical-diagnosis') && event.choices.every(choice => choice.effects.length === 1 && choice.effects[0].kind === 'medical-episode' && choice.effects[0].personId === patient.id && assessed.has(choice.effects[0].conditionId));
  if (world.pending && covered(world.pending)) { world.pending = null; world.pendingPriority = 0; }
  world.deferred = world.deferred.filter(row => !covered(row.event));
}

export function resolveMedicalEpisode(world: World, effect: MedicalEpisodeEffect): MedicalEpisodeOutcome {
  const reason = medicalEpisodeReason(world, effect); if (reason) throw new IneligibleAction(reason);
  const patient = world.people[effect.personId], condition = patient.health.conditions.find(item => item.id === effect.conditionId)!;
  const finish = (title: string, body: string, journal: string, effects: RuntimeEffectRow[] = []): MedicalEpisodeOutcome => ({ title, body, journal, effects });
  if (effect.action === 'ignore') {
    record(world, patient, 'symptoms-ignored', 'I put off an assessment of these symptoms.', 0n, null, condition.id);
    return finish('Probably nothing. Hopefully.', 'You decide to wait and see. Your symptoms get no treatment.', 'I ignored symptoms that had been bothering me.');
  }
  if (effect.action === 'leave') {
    record(world, patient, 'treatment-declined', 'I put off treatment for ' + conditions[condition.type].name + '.', 0n, patient.health.providerId, condition.id);
    return finish('Care can wait. Apparently.', 'You leave the treatment for another day. The illness has made no such promise.', 'I put off treatment for ' + conditions[condition.type].name + '.');
  }
  const provider = providerFor(world, patient);
  if (effect.action === 'treat') {
    limit(world, 'treat:' + condition.id, patient);
    startTreatment(world, patient, condition, provider, false, effect.quotedCost);
    const quote = medicalQuote(world, effect.quotedCost, patient);
    return finish('Care has begun', 'You begin ' + careLabels[conditions[condition.type].treatment] + ' with Dr ' + provider.lastName + '. Now comes the part where you stick with it.', 'I began ' + careLabels[conditions[condition.type].treatment] + ' for ' + conditions[condition.type].name + '.', [{ id: 'care', label: 'Treatment', value: 'Programme started', tone: 'positive' }, { id: 'cost', label: 'Patient fee', value: formatMoney({ minor: quote.amount, currency: quote.currency }), tone: 'neutral' }]);
  }
  payMedical(world, patient, provider, effect.quotedCost, 'Consultation');
  const examined = patient.health.conditions.filter(item => item.status !== 'recovered' && !item.diagnosed);
  const found = diagnose(world, patient, provider, 'symptoms'); condition.episode.assessed = true;
  for (const item of examined) if (item.id !== condition.id && !item.diagnosed) record(world, patient, 'assessment', 'Dr ' + provider.lastName + ' could not establish the cause of these symptoms.', 0n, provider.id, item.id);
  withdrawEpisodeOffers(world, patient, new Set(patient.health.conditions.filter(item => item.episode.assessed).map(item => item.id)));
  if (found.length) fact(world, 'Dr ' + provider.lastName + ' diagnosed ' + found.map(item => conditions[item.type].name).join(', ') + '.', 'health', '', patient.id);
  patient.stats.stress = bounded(patient.stats.stress - 3);
  record(world, patient, 'symptoms', found.length ? 'Dr ' + provider.lastName + ' diagnosed ' + found.map(item => conditions[item.type].name).join(', ') + '.' : 'The symptom assessment did not establish a diagnosis.', effect.quotedCost, provider.id, condition.id);
  const chosen = found.find(item => item.id === condition.id) ?? found[0];
  const outcome = finish(chosen ? 'Bad News' : 'No clear answer', chosen ? 'Dr ' + provider.lastName + ' diagnoses ' + conditions[chosen.type].name.toLowerCase() + '.' : 'Dr ' + provider.lastName + ' cannot pin down the cause today. Tests or a specialist may help if the symptoms persist.', 'I visited Dr ' + provider.lastName + ' about my symptoms.');
  if (chosen) {
    outcome.decision = diagnosisDecision(world, patient, chosen, provider);
    outcome.additionalDecisions = found.filter(item => item.id !== chosen.id).map(item => diagnosisDecision(world, patient, item, provider));
  }
  return outcome;
}

function symptomNotice(world: World, patient: Person, condition: Condition) {
  condition.episode.notified = true;
  const cost = consultationCost(world, 'symptoms', patient);
  record(world, patient, 'symptom-notice', 'Persistent symptoms prompted a decision about seeking care.', 0n, null, condition.id);
  offerPending(world, { kind: 'decision', id: 'symptoms_' + condition.id, templateId: 'medical-symptoms', title: 'Feeling Unwell', body: 'You have noticed ' + conditions[condition.type].symptoms.toLowerCase() + '. Something does not feel right. A clinic assessment costs ' + formatMoney({ minor: cost, currency: countries[patient.country].currency }) + '.', illustration: 'care', personIds: [patient.id], choices: [
    { id: 'doctor', label: 'Visit the Doctor', effects: [{ kind: 'medical-episode', personId: patient.id, conditionId: condition.id, action: 'assess', quotedCost: cost }], resultTitle: 'Assessment complete', resultBody: 'Your clinician has assessed the symptoms.', journal: 'I sought an assessment of my symptoms.' },
    { id: 'ignore', label: 'Ignore It', effects: [{ kind: 'medical-episode', personId: patient.id, conditionId: condition.id, action: 'ignore', quotedCost: 0n }], resultTitle: 'Probably nothing. Hopefully.', resultBody: 'You decide to wait and see.', journal: 'I ignored symptoms that had been bothering me.' },
  ] });
}

function urgentAdmission(world: World, patient: Person, condition: Condition) {
  const firstDiagnosis = !condition.diagnosed, provider = providerFor(world, patient), cost = treatmentCost(world, condition, patient);
  if (firstDiagnosis) record(world, patient, 'diagnosis', 'Dr ' + provider.lastName + ' diagnosed ' + conditions[condition.type].name + ' during an urgent assessment.', 0n, provider.id, condition.id);
  const effects = emergencyCare(world, patient.id, condition.id, true, cost, true), quote = medicalQuote(world, cost, patient);
  withdrawEpisodeOffers(world, patient, new Set([condition.id]), true);
  offerPending(world, { kind: 'result', id: 'admission_' + condition.id + '_' + absolute(world), title: 'Rushed to Hospital', body: (firstDiagnosis ? 'Your symptoms have become critical. At hospital, Dr ' + provider.lastName + ' diagnoses ' + conditions[condition.type].name.toLowerCase() + '. ' : 'Your ' + conditions[condition.type].name.toLowerCase() + ' has become critical. ') + 'You are admitted for urgent care. Your body has made the appointment for you.', illustration: 'care', effects: [...effects, { id: 'bill', label: 'Patient bill', value: formatMoney({ minor: quote.amount, currency: quote.currency }), tone: 'neutral' }] }, 140);
  fact(world, 'I was admitted to hospital for ' + conditions[condition.type].name + '.', 'health', '', patient.id);
}
export function resolveHealth(world: World, command: HealthCommand) {
  const person = active(world), age = ageOn(person, world.date), stream = 'outcomes' as const;
  if (command.type === 'health-routine') {
    const ages = substanceAges(person), routine = command.routine;
    if (routine.smoking && age < ages.smoking || routine.drinking !== 'none' && age < ages.alcohol) throw new IneligibleAction('This habit is restricted at your current age in this country');
    if (routine.exercise !== 'none' && age < 6 || routine.exercise === 'gym' && age < 16 || routine.mindfulness && age < 5) throw new IneligibleAction('Choose an age-appropriate routine');
    if (age < 6 && routine.diet !== 'balanced' || age < 18 && routine.diet === 'restrictive' || age < 5 && routine.sleep !== 'regular') throw new IneligibleAction('This diet or sleep choice is unavailable at your current age');
    person.health.routine = routine; result(world, 'Routine saved', 'Your choices affect health, fitness, energy, stress and costs as months pass. Saving a routine does not grant an immediate stat reward.', 'meditation'); return;
  }
  if (command.type === 'consult') {
    limit(world, 'consult:' + command.service); const provider = providerFor(world, person), cost = consultationCost(world, command.service);
    payMedical(world, person, provider, cost, 'Consultation'); const found = diagnose(world, person, provider, command.service);
    person.stats.stress = bounded(person.stats.stress - 3); const text = found.length ? 'Dr ' + provider.lastName + ' diagnosed ' + found.map(item => conditions[item.type].name).join(', ') + '. Treatment options are available in your condition record.' : 'No new diagnosis was made at this visit. A consultation can miss an illness; persistent symptoms can be assessed with tests or a specialist.';
    record(world, person, command.service, text, cost, provider.id); fact(world, 'I visited Dr ' + provider.lastName + ' for ' + command.service + '.', 'health'); result(world, found.length ? 'A clearer picture' : 'Consultation complete', text, 'doctor'); return;
  }
  if (command.type === 'treat' || command.type === 'stop-treatment') {
    const condition = person.health.conditions.find(item => item.id === command.conditionId && item.status !== 'recovered' && item.diagnosed);
    if (!condition) throw new IneligibleAction('Choose an active diagnosed condition');
    if (command.type === 'stop-treatment') { if (!condition.treatment) throw new IneligibleAction('No treatment is active'); condition.treatment = null; condition.status = 'active'; record(world, person, 'treatment-stopped', 'I stopped treatment for ' + conditions[condition.type].name + '.', 0n, null, condition.id); result(world, 'Treatment stopped', 'Further programme costs stop. The underlying condition still needs monitoring.', 'medicine'); return; }
    if (condition.treatment) throw new IneligibleAction('Treatment is already active'); limit(world, 'treat:' + condition.id);
    startTreatment(world, person, condition, providerFor(world, person)); result(world, 'Care has begun', 'Treatment takes time. It may help, have limited benefit or cause side effects. Monthly care pauses if funding runs out; follow progress in your condition record.', 'medicine'); return;
  }
  if (command.type === 'vaccinate') {
    const current = person.health.vaccinations.find(item => item.id === command.vaccine && item.expiresMonth > absolute(world)); if (current) throw new IneligibleAction('This protection is still current');
    limit(world, 'vaccinate:' + command.vaccine); const provider = providerFor(world, person), cost = isConfined(world, person) ? 0n : rules[person.country].doctorVisit / 2n; payMedical(world, person, provider, cost, 'Vaccination');
    person.health.vaccinations = [...person.health.vaccinations.filter(item => item.id !== command.vaccine), { id: command.vaccine, date: { ...world.date }, expiresMonth: absolute(world) + (command.vaccine === 'routine' ? 120 : 12) }];
    record(world, person, 'vaccination', command.vaccine + ' vaccination received.', cost, provider.id); result(world, 'Protection recorded', 'This reduces the game’s infection risk for its recorded period. It does not cure an existing condition or grant a permanent health boost.', 'care'); return;
  }
  if (command.type === 'exercise') {
    const minimum = command.activity === 'trainer' ? 18 : command.activity === 'gym' ? 16 : command.activity === 'run' ? 10 : 6;
    if (age < minimum || hospitalized(world, person) || person.stats.health < 20) throw new IneligibleAction('This activity is unavailable at your current age or health');
    limit(world, 'exercise'); const energy = command.activity === 'walk' ? 5 : command.activity === 'trainer' ? 18 : 12;
    if (person.stats.energy < energy) throw new IneligibleAction('You need more energy for this session');
    const divisor = command.activity === 'trainer' ? 200n : command.activity === 'class' ? 1000n : command.activity === 'gym' ? 2000n : command.activity === 'sport' ? 4000n : 0n;
    const cost = divisor ? rules[person.country].baseWage / divisor : 0n, quote = medicalQuote(world, cost, person); if (quote.amount) charge(world, quote.amount, 'exercise', 'Exercise session', undefined, quote.currency, quote.payer);
    const before = person.stats.fitness, gain = command.activity === 'trainer' ? 8 : command.activity === 'walk' ? 3 : 5; person.stats.fitness = bounded(before + gain); person.stats.energy -= energy; person.stats.stress = bounded(person.stats.stress - 4); person.stats.happiness = bounded(person.stats.happiness + 3);
    const injured = command.activity !== 'walk' && draw(world, stream, 1, 100) <= (person.stats.fitness < 30 ? 8 : 2); if (injured) addCondition(world, person, 'sprain', 35);
    fact(world, 'I took time for ' + command.activity + (injured ? ' and injured my ankle.' : '.'), 'health'); result(world, injured ? 'An awkward landing' : 'You made time to move', injured ? 'You gained some fitness but developed ankle pain. The injury is part of your medical history.' : 'The session helped your fitness and stress. You used real energy and any stated fee.', 'exercise', [{ id: 'fitness', label: 'Fitness', value: '+' + (person.stats.fitness - before) + '%', tone: 'positive' }]); return;
  }
  if (command.type === 'meditate' || command.type === 'self-improvement') {
    if (age < 5) throw new IneligibleAction('This action unlocks from age five'); limit(world, command.type);
    const before = person.stats.stress; person.stats.stress = bounded(before - (command.type === 'meditate' ? 7 : 3)); person.stats.happiness = bounded(person.stats.happiness + 3);
    if (command.type === 'self-improvement') person.stats.discipline = bounded(person.stats.discipline + 3);
    fact(world, command.type === 'meditate' ? 'I set aside a little time to sit quietly.' : 'I worked on a habit I wanted to change.', 'health'); result(world, command.type === 'meditate' ? 'A quieter moment' : 'A little progress', 'The benefit is recorded. This does not replace diagnosis or treatment for a persistent condition.', 'meditation', [{ id: 'stress', label: 'Stress', value: (person.stats.stress - before) + '%', tone: 'positive' }]); return;
  }
  if (age < 18 || hospitalized(world, person)) throw new IneligibleAction('This elective care is available to adults outside hospital');
  if (command.type === 'fertility-care' && person.biology.role === 'neither') throw new IneligibleAction('This care cannot change reproductive capacity');
  limit(world, command.type); const provider = providerFor(world, person), cost = command.type === 'fertility-care' ? rules[person.country].doctorVisit * 5n : rules[person.country].baseWage / 20n;
  payMedical(world, person, provider, cost, command.type); const success = draw(world, stream, 1, 100) <= 70;
  if (command.type === 'fertility-care') { if (person.biology.role === 'neither') throw new IneligibleAction('This care cannot change reproductive capacity'); const before = person.biology.fertility; if (success) person.biology.fertility = bounded(before + 10); else person.stats.stress = bounded(person.stats.stress + 3); record(world, person, 'fertility-care', success ? 'Fertility support helped.' : 'Fertility support had no improvement.', cost, provider.id); result(world, 'Fertility care completed', success ? 'Your fertility improved. Age and reproductive capacity still limit conception.' : 'The treatment did not improve fertility this time.', 'care'); }
  else { const before = person.stats.looks; person.stats.looks = bounded(before + (success ? 5 : -3)); record(world, person, 'cosmetic-care', success ? 'The elective procedure had the intended result.' : 'The elective procedure had a disappointing result.', cost, provider.id); result(world, success ? 'The result you hoped for' : 'A disappointing result', 'The fee and outcome are recorded. Results differ between people.', 'care', [{ id: 'looks', label: 'Looks', value: (person.stats.looks - before >= 0 ? '+' : '') + (person.stats.looks - before) + '%', tone: success ? 'positive' : 'negative' }]); }
}

export function healthRoutineCost(world: World, person: Person): bigint {
  const routine = person.health.routine, rule = rules[person.country];
  return (routine.diet === 'nutritious' ? rule.livingCost / 20n : 0n) + (routine.exercise === 'gym' ? rule.baseWage / 1200n : routine.exercise === 'sport' ? rule.baseWage / 2000n : 0n) + (routine.smoking ? rule.baseWage / 600n : 0n) + (routine.drinking === 'heavy' ? rule.baseWage / 400n : routine.drinking === 'moderate' ? rule.baseWage / 1600n : 0n);
}
function recovered(world: World, person: Person, condition: Condition, remission = false) {
  condition.status = 'recovered'; condition.resolved = { ...world.date }; condition.severity = 0; condition.treatment = null;
  const name = condition.diagnosed ? conditions[condition.type].name : 'My symptoms';
  fact(world, name + (remission ? ' went into remission.' : ' resolved.'), 'health', '', person.id); record(world, person, remission ? 'remission' : 'recovery', name + (remission ? ' entered remission after treatment.' : ' resolved over time.'), 0n, person.health.providerId, condition.id);
}
/** Progress every living person's health once per recorded month, independent of screen reads. */
export function healthMonth(world: World) {
  const month = absolute(world);
  for (const person of Object.values(world.people)) {
    if (person.died || person.health.lastMonth >= month) continue;
    person.health.lastMonth = month; const age = ageOn(person, world.date), routine = isConfined(world, person) ? { ...person.health.routine, diet: 'balanced' as const, exercise: 'none' as const, smoking: false, drinking: 'none' as const } : person.health.routine, stream = person.id === world.activePersonId ? 'outcomes' : 'npcs';
    if (person.health.hospitalizedUntil !== null && person.health.hospitalizedUntil < month) person.health.hospitalizedUntil = null;
    if (month % 3 === 0) {
      const fit = hospitalized(world, person) ? -1 : routine.exercise === 'gym' || routine.exercise === 'sport' ? 2 : routine.exercise === 'walking' ? 1 : age >= 18 ? -1 : 0;
      person.stats.fitness = bounded(person.stats.fitness + fit - (age >= 65 ? 1 : 0));
      person.stats.health = bounded(person.stats.health + (routine.diet === 'nutritious' ? 1 : routine.diet === 'fast-food' || routine.diet === 'restrictive' ? -1 : 0) - (routine.smoking ? 1 : 0) - (routine.drinking === 'heavy' ? 1 : 0));
    }
    person.stats.energy = bounded(person.stats.energy + (routine.sleep === 'restful' ? 3 : routine.sleep === 'short' ? -3 : 1) - (routine.exercise === 'gym' || routine.exercise === 'sport' ? 2 : 0));
    person.stats.stress = bounded(person.stats.stress + (routine.sleep === 'short' ? 1 : routine.sleep === 'restful' ? -1 : 0) - (routine.mindfulness ? 1 : 0) + (routine.drinking === 'heavy' ? 1 : 0));
    const pool: ConditionId[] = ['cold', 'cold', 'flu', 'measles', 'chickenpox', 'sprain', 'asthma', 'hypertension', 'diabetes', 'depression', 'anxiety', ...person.health.familyRisks];
    const eligible = pool.filter(type => age >= conditions[type].minAge && !person.health.conditions.some(item => item.type === type && (item.status !== 'recovered' || type === 'measles' || type === 'chickenpox')));
    const risk = 70 + (routine.smoking ? 25 : 0) + (routine.drinking === 'heavy' ? 30 : 0) + (age >= 70 ? 30 : 0);
    if (eligible.length && draw(world, stream, 1, 10000) <= risk) {
      const type = eligible[draw(world, stream, 0, eligible.length - 1)], protectedNow = person.health.vaccinations.some(item => item.expiresMonth > month && (item.id === 'routine' ? type === 'measles' || type === 'chickenpox' : type === 'flu'));
      if (!(protectedNow && draw(world, stream, 1, 100) <= 80)) addCondition(world, person, type, draw(world, stream, 25, 55));
    }
    if (age >= 30 && !person.health.conditions.some(item => item.type === 'cancer' && item.status !== 'recovered') && draw(world, stream, 1, 10000) <= (routine.smoking ? 4 : 1)) addCondition(world, person, 'cancer', 50);
    if (age >= 40 && !person.health.conditions.some(item => item.type === 'heart-disease' && item.status !== 'recovered') && draw(world, stream, 1, 10000) <= (routine.smoking || routine.diet === 'fast-food' || person.stats.stress > 80 ? 6 : 2)) addCondition(world, person, 'heart-disease', 55);
    if (age >= 18 && (routine.smoking || routine.drinking === 'heavy') && !person.health.conditions.some(item => item.type === 'dependence' && item.status !== 'recovered') && draw(world, stream, 1, 10000) <= 40) addCondition(world, person, 'dependence', 40);
    for (const condition of person.health.conditions.filter(item => item.status !== 'recovered')) {
      if (compareDates(condition.onset, world.date) === 0 && condition.months === 0) continue;
      condition.months++; const definition = conditions[condition.type], treatment = condition.treatment;
      let change = definition.progression;
      if (treatment) { treatment.months++; change = treatment.outcome === 'effective' ? -5 : treatment.outcome === 'limited' ? -1 : 2; if (treatment.outcome === 'side-effect' && treatment.months === 1) { person.stats.health = bounded(person.stats.health - 3); record(world, person, 'side-effect', 'The programme caused a side effect and needs review.', 0n, person.health.providerId, condition.id); } }
      if (condition.type === 'depression' || condition.type === 'anxiety') change += person.stats.stress > 75 ? 2 : routine.mindfulness && routine.sleep !== 'short' ? -1 : 0;
      if (condition.type === 'dependence' && !routine.smoking && routine.drinking === 'none' && !treatment) change = -1;
      condition.severity = bounded(condition.severity + change); condition.status = definition.chronic && treatment && condition.severity < 35 ? 'controlled' : 'active';
      if (condition.episode.admissionAt && condition.severity < 35 && (condition.status === 'controlled' || !definition.chronic)) condition.episode.stabilized = true;
      const recoveryMonths = condition.type === 'fracture' && !treatment ? definition.recoveryMonths * 3 : definition.recoveryMonths;
      if (!definition.chronic && condition.months >= recoveryMonths && condition.severity < 60) { recovered(world, person, condition); continue; }
      if ((condition.type === 'depression' || condition.type === 'anxiety' || condition.type === 'dependence') && treatment && treatment.months >= 6 && condition.severity <= 10) {
        if (condition.type === 'dependence') { routine.smoking = false; routine.drinking = 'none'; }
        recovered(world, person, condition, true); continue;
      }
      if (condition.type === 'dependence' && !treatment && !routine.smoking && routine.drinking === 'none' && condition.months >= 12 && condition.severity <= 10) { recovered(world, person, condition, true); continue; }
      if (condition.type === 'cancer' && treatment?.outcome === 'effective' && treatment.months >= 12 && condition.severity < 15 && draw(world, stream, 1, 100) <= 5) { recovered(world, person, condition, true); continue; }
      if (month % 3 === 0 && condition.status !== 'controlled') {
        const harm = definition.healthDrain * Math.max(1, Math.ceil(condition.severity / 40)); person.stats.health = bounded(person.stats.health - harm); person.stats.stress = bounded(person.stats.stress + (condition.severity >= 60 ? 2 : 1));
        if (condition.type === 'depression' || condition.type === 'anxiety') person.stats.happiness = bounded(person.stats.happiness - Math.ceil(condition.severity / 30));
      }
      if (person.id !== world.activePersonId || hospitalized(world, person)) continue;
      const threshold = urgentThresholds[condition.type];
      if (threshold !== undefined && condition.severity >= threshold && (!condition.episode.admissionAt || condition.episode.stabilized)) urgentAdmission(world, person, condition);
      else if (!condition.diagnosed && !condition.episode.notified && !condition.episode.assessed && (definition.chronic || definition.recoveryMonths >= 4) && condition.severity >= 35 && condition.months >= 1) symptomNotice(world, person, condition);
    }
  }
}
export function healthFinanceMonth(world: World) {
  const month = absolute(world), discharged = new Set<string>();
  for (const person of Object.values(world.people)) {
    if (person.died) continue;
    const extra = isConfined(world, person) ? 0n : healthRoutineCost(world, person), payer = carePayer(world, person);
    if (extra) charge(world, fxMoney(world, { minor: extra, currency: countries[person.country].currency }, countries[payer.country].currency).minor, 'lifestyle', 'Monthly routine costs for ' + person.firstName, 'living', undefined, payer);
    for (const condition of person.health.conditions.filter(item => item.status !== 'recovered')) {
      if (person.id !== world.activePersonId && condition.severity >= 35 && !condition.treatment && draw(world, 'npcs', 1, 100) <= (person.traits.includes('practical') ? 55 : 25)) {
        const quote = medicalQuote(world, treatmentCost(world, condition, person), person);
        if (availableCash(accountFor(world, quote.payer)) >= quote.amount && (quote.payer.id !== person.id || ageOn(person, world.date) >= 18 || !quote.amount)) { const provider = providerFor(world, person); condition.diagnosed ??= { ...world.date }; startTreatment(world, person, condition, provider); }
      }
      const treatment = condition.treatment; if (!treatment || treatment.lastPaymentMonth >= month) continue;
      const cost = isConfined(world, person) ? 0n : rules[person.country].doctorVisit / 6n, quote = medicalQuote(world, cost, person);
      if (availableCash(accountFor(world, quote.payer)) < quote.amount) { condition.treatment = null; condition.status = 'active'; record(world, person, 'funding-pause', 'Ongoing care paused because funding was unavailable.', 0n, person.health.providerId, condition.id); fact(world, 'My ongoing treatment paused because I could not fund it.', 'health', '', person.id); continue; }
      payMedical(world, person, providerFor(world, person), cost, 'Ongoing treatment'); treatment.paid += fxMoney(world, { minor: cost, currency: countries[person.country].currency }, treatment.currency).minor; treatment.lastPaymentMonth = month;
    }
    if (person.health.hospitalizedUntil !== null && person.health.hospitalizedUntil <= month) { if (person.health.hospitalizedUntil === month) discharged.add(person.id); person.health.hospitalizedUntil = null; fact(world, 'I left hospital and continued my recovery.', 'health', '', person.id); }
  }
  // Later systems still need to know this was a hospital period even though its
  // end-of-period discharge is already visible. This is transient, never saved.
  return discharged;
}
export function illnessMortality(person: Person) {
  const serious = person.health.conditions.filter(item => item.status === 'active' && item.severity >= 65).sort((a, b) => conditions[b.type].mortalityBps - conditions[a.type].mortalityBps);
  return { bps: serious.reduce((sum, item) => sum + Math.round(conditions[item.type].mortalityBps * item.severity / 50), 0), cause: serious.find(item => conditions[item.type].mortalityBps > 0)?.type };
}
