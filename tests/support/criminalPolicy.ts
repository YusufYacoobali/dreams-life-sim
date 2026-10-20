import assert from 'node:assert/strict';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { database } from './sqlite';
import { randomCreation } from '../../src/game/createLife';
import { countries, countryCodes, type CountryCode } from '../../src/game/countries';
import { ageOn, compareDates, encodeWorld, type World, type GameDate } from '../../src/game/model';
import { IneligibleAction, resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { rules } from '../../src/game/rules';
import { legalRules } from '../../src/game/legalRules';
import { jobs } from '../../src/game/content/jobs';
import { accountFor, availableCash } from '../../src/game/systems/common';
import { activeSentence, crimeReason, isConfined, prisonContacts, visibleConvictions } from '../../src/game/systems/legal';
import { activeTrip, samePhysicalPlace } from '../../src/game/systems/travelSchemas';
import { hospitalized } from '../../src/game/systems/healthSchemas';
import { serviceAway } from '../../src/game/systems/serviceSchemas';
import { closeFamily, relationFor, socialActionUsed } from '../../src/game/systems/relationships';
import { jobReason } from '../../src/game/systems/work';
import { currentWorkplace } from '../../src/game/systems/workplaceSchemas';
import { workplaceReason } from '../../src/game/systems/workplaces';
import { tripQuote, tripReason } from '../../src/game/systems/travel';
import { relocationFee, relocationReason } from '../../src/game/systems/relocation';
import { netWorth } from '../../src/game/valuation';

export const criminalPolicyVersion = 1;
export const criminalMilestones = ['schoolAttendance', 'compulsoryLeaveGuard', 'schoolExit', 'paidJob', 'offence', 'arrest', 'delayedArrest', 'counsel', 'hearing', 'conviction', 'prisonRoutine', 'prisonTime', 'prisonStudy', 'prisonPay', 'prisonConnection', 'custodyGuard', 'release', 'recordWorkGate', 'foreignWorkApplication', 'holiday', 'holidayCompleted', 'recordExpired', 'rehired', 'retirement', 'death', 'estate'] as const;
type Stage = typeof criminalMilestones[number];
type Evidence = Record<string, unknown>;
export type CriminalOptions = { maxYears?: number; onStep?: (world: World, trace: readonly GameCommand[]) => void };

/** Actual creation and saved birth acknowledgement, never an edited world flag. */
export async function createCriminalLife(country: CountryCode, seed: number) {
  const { sqlite, driver } = database();
  try {
    const repository = new SaveRepository(driver); await repository.initialise();
    const date = { year: 2000, month: 1, day: 1 }, store = createGameStore({ repository: async () => repository, date: () => date, id: () => 'life_criminal_' + country + '_' + seed });
    assert.equal(await store.getState().startLife({ ...randomCreation(seed), country, city: countries[country].cities[0], background: 'ordinary' }, seed), true);
    assert.equal(store.getState().world!.birthAcknowledged, false); assert.equal(await store.getState().acknowledgeBirth(), true);
    const world = store.getState().world!; assert.equal(world.revision, 1); return world;
  } finally { sqlite.close(); }
}

/** A preregistered player strategy. Hidden legal rolls never inform a choice. */
export function runCriminalPolicy(initial: World, options: CriminalOptions = {}) {
  let world = initial; const activeId = initial.activePersonId, country = initial.people[activeId].country, maxYears = options.maxYears ?? 150;
  assert.ok(Object.isFrozen(initial) && initial.birthAcknowledged && ageOn(initial.people[activeId], initial.date) === 0);
  assert.ok(Number.isInteger(maxYears) && maxYears >= 1 && maxYears <= 150);
  const trace: GameCommand[] = [], reached = new Map<Stage, { age: number; date: GameDate; revision: number; evidence: Evidence }>(), observations: { stage: string; outcome: string; age: number; date: GameDate; detail: Evidence }[] = [], coldChecks: { reason: string; revision: number; canonicalBytes: number; checkpointBytes: number; format: string }[] = [], custodyWindows: Evidence[] = [];
  const reviewedCounsel = new Set<string>(), configured = new Set<string>(), befriended = new Set<string>(), visits = new Set<string>(), checkedCold = new Set<string>(), foreignApplications = new Set<string>(), blockedKeys = new Set<string>();
  let years = 0, committed = 0, healthy = false, attemptedLeave = false, guardedCustody = false, offenceIndex = 0, lastOffenceYear: number | null = null, sawVisibleRecord = false;
  const player = () => world.people[activeId], age = () => ageOn(player(), world.date), reserve = () => rules[player().country].livingCost * 3n, spendable = () => availableCash(accountFor(world));
  const destinationId = country === 'FR' ? 'london' : 'paris';
  const log = (stage: string, outcome: string, detail: Evidence = {}) => observations.push({ stage, outcome, age: age(), date: { ...world.date }, detail });
  const blocked = (stage: string, reason: string) => { const key = stage + ':' + world.date.year + ':' + reason; if (!blockedKeys.has(key)) { blockedKeys.add(key); log(stage, 'ineligible', { reason }); } };
  const cold = (reason: string) => { const canonical = encodeWorld(world), checkpoint = packCheckpoint(world); world = unpackCheckpoint(checkpoint, true); assert.equal(encodeWorld(world), canonical, 'Exact automatic checkpoint round-trip: ' + reason); coldChecks.push({ reason, revision: world.revision, canonicalBytes: Buffer.byteLength(canonical), checkpointBytes: Buffer.byteLength(checkpoint), format: JSON.parse(checkpoint).format }); };
  const mark = (stage: Stage, evidence: Evidence) => { if (reached.has(stage)) return; reached.set(stage, { age: age(), date: { ...world.date }, revision: world.revision, evidence }); cold(stage); };
  const observe = () => {
    assert.equal(world.activePersonId, activeId);
    const school = world.schoolCommunities.find(row => row.personId === activeId && row.periods.length); if (school) mark('schoolAttendance', { schoolId: school.id, attendedMonths: school.periods.length });
    const completion = world.schoolCompletions.find(row => row.personId === activeId); if (completion) mark('schoolExit', { completion, actualSchoolEnd: rules[completion.country].schoolEnd, exit: 'ordinary country school-end assessment; no compulsory dropout command exists' });
    const paid = world.workHistory.find(row => row.personId === activeId && row.monthsWorked > 0 && row.grossEarned > 0n); if (paid) mark('paidJob', { employmentId: paid.id, roleId: paid.roleId, actualMonths: paid.monthsWorked, actualGross: paid.grossEarned });
    const sources = world.incidents.filter(row => row.personId === activeId); for (const source of sources) { assert.ok(ageOn({ ...player(), died: null }, source.date) >= Math.max(18, rules[source.country].adultAge, rules[source.country].schoolEnd), 'Policy never commits a child offence'); }
    if (sources[0]) mark('offence', { incidentId: sources[0].id, offence: sources[0].offence, date: sources[0].date, actualGain: sources[0].gain });
    const cases = world.cases.filter(row => row.personId === activeId); if (cases[0]) mark('arrest', { caseId: cases[0].id, incidentId: cases[0].incidentId, juvenile: cases[0].juvenile, opened: cases[0].opened });
    const delayed = cases.find(row => { const source = world.incidents.find(item => item.id === row.incidentId)!; return compareDates(row.opened, source.date) > 0; }); if (delayed) mark('delayedArrest', { caseId: delayed.id, opened: delayed.opened, incidentId: delayed.incidentId });
    const conviction = cases.find(row => row.status === 'convicted'); if (conviction) mark('conviction', { caseId: conviction.id, plea: conviction.plea, actualFine: conviction.fine, sentenceMonths: conviction.sentenceMonths });
    const sentences = world.sentences.filter(row => row.personId === activeId);
    const served = sentences.find(row => row.servedMonths > 0); if (served) mark('prisonTime', { sentenceId: served.id, servedMonths: served.servedMonths, creditedMonths: served.creditedMonths });
    const studied = sentences.find(row => row.studyMonths > 0); if (studied) mark('prisonStudy', { sentenceId: studied.id, actualStudyMonths: studied.studyMonths });
    const stipend = world.ledger.find(row => row.personId === activeId && row.category === 'prison-pay' && row.cashDelta > 0n); if (stipend) mark('prisonPay', { receiptId: stipend.id, actualPay: stipend.cashDelta, currency: stipend.currency });
    const released = sentences.find(row => row.state === 'released'); if (released) mark('release', { sentenceId: released.id, reason: released.releaseReason, actualServedMonths: released.servedMonths, creditedMonths: released.creditedMonths, totalMonths: released.totalMonths, ended: released.ended });
    const record = visibleConvictions(world); if (record.length) { sawVisibleRecord = true; const reason = jobReason(world, jobs.find(row => row.id === 'teacher')!); if (reason?.includes('background check')) mark('recordWorkGate', { roleId: 'teacher', reason, visibleCaseIds: record.map(row => row.id), caveat: 'Other qualification requirements are not waived' }); }
    if (sawVisibleRecord && !record.length && cases.some(row => row.status === 'convicted')) mark('recordExpired', { retainedCaseIds: cases.filter(row => row.status === 'convicted').map(row => row.id), countryRecordYears: legalRules[player().country].recordYears, actualVisibleRecords: 0 });
    if (released && player().employment && world.workHistory.some(row => row.id === player().employment!.id && compareDates(row.started, released.ended!) >= 0)) mark('rehired', { employmentId: player().employment!.id, roleId: player().employment!.roleId, visibleCaseIds: record.map(row => row.id) });
    const trip = world.trips.find(row => row.organizerId === activeId); if (trip) mark('holiday', { tripId: trip.id, destinationId: trip.destinationId, actualPaid: trip.paid, quote: trip.quote });
    const completedTrip = world.trips.find(row => row.organizerId === activeId && row.status === 'completed'); if (completedTrip) mark('holidayCompleted', { tripId: completedTrip.id, actualPeriods: completedTrip.periods.length, ended: completedTrip.ended });
    const event = world.pending; if (event?.kind === 'decision' && ['arrest', 'court-hearing'].includes(event.templateId) && !checkedCold.has(event.id)) { checkedCold.add(event.id); cold('bound ' + event.templateId); if (event.templateId === 'court-hearing') mark('hearing', { eventId: event.id, date: world.date }); }
    if (player().died) {
      assert.ok(player().causeOfDeath && world.journal.some(row => row.personId === activeId && row.category === 'death')); mark('death', { died: player().died, cause: player().causeOfDeath });
      const estates = world.estates.filter(row => row.personId === activeId); assert.equal(estates.length, 1); const estate = estates[0];
      const total = estate.distributions.reduce((sum, row) => sum + row.cash.minor + row.assetValue.minor, 0n) + estate.tax.minor + estate.fees.minor + estate.charity.minor;
      assert.equal(total, estate.netWorthAtDeath.minor + estate.debtWrittenOff.minor, 'Actual estate conservation including written-off liabilities'); mark('estate', { estateId: estate.id, conserved: true, distributedAndCosts: total, netWorthAtDeath: estate.netWorthAtDeath, writtenOff: estate.debtWrittenOff });
    }
  };
  const run = (command: GameCommand) => {
    const before = world, confined = isConfined(before), sentence = activeSentence(before), inpatientUntil = before.people[activeId].health.hospitalizedUntil;
    trace.push(command); world = resolveCommand(world, command, true); committed++;
    const added = world.ledger.slice(before.ledger.length).filter(row => row.personId === activeId);
    if (confined) {
      assert.ok(!added.some(row => ['income', 'background-income'].includes(row.category)), 'An interval starting in custody cannot pay ordinary wages before the next legal boundary');
      const after = sentence && world.sentences.find(row => row.id === sentence.id), stipend = added.filter(row => row.category === 'prison-pay');
      if (inpatientUntil !== null) for (const payment of stipend) assert.ok(payment.year * 12 + payment.month - 1 > inpatientUntil, 'Hospital and discharge months cannot earn a prison stipend');
      if (sentence && after && sentence.routine.study) { const months = after.servedMonths - sentence.servedMonths, blockedMonths = inpatientUntil === null ? 0 : Math.max(0, Math.min(after.lastServedMonth, inpatientUntil) - sentence.lastServedMonth); assert.equal(after.studyMonths - sentence.studyMonths, months - blockedMonths, 'Prison study needs actual nonhospital attendance'); }
      if (compareDates(before.date, world.date) !== 0) custodyWindows.push({ from: before.date, to: world.date, sentenceId: sentence?.id ?? null, ordinaryWageReceipts: 0, prisonStipends: stipend.map(row => row.id), inpatientUntil });
    }
    if (command.type === 'choose' && before.pending?.kind === 'decision' && before.pending.templateId === 'job-interview') { assert.deepEqual(world.ledger, before.ledger); assert.deepEqual(world.accounts, before.accounts); const hired = world.workHistory.find(row => row.personId === activeId && !before.workHistory.some(previous => previous.id === row.id)); if (hired) { assert.equal(hired.monthsWorked, 0); assert.equal(hired.grossEarned, 0n); } }
    observe(); options.onStep?.(world, trace);
  };
  const attempt = (stage: string, command: GameCommand) => {
    try { run(command); log(stage, 'committed', { command: command.type, result: world.pending?.kind === 'result' ? world.pending.title : null }); return true; }
    catch (error) { if (!(error instanceof IneligibleAction)) throw error; blocked(stage, error.message); return false; }
  };
  const negative = (stage: string, command: GameCommand, reason: RegExp) => { const payload = encodeWorld(world); trace.push(command); assert.throws(() => resolveCommand(world, command, true), error => error instanceof IneligibleAction && reason.test(error.message)); assert.equal(encodeWorld(world), payload); log(stage, 'rejected-without-state-or-rng-change', { command: command.type }); };
  const managePause = () => {
    if (world.pending || world.annual && !world.annual.pausedForPlanning) return false;
    const item = world.cases.find(row => row.personId === activeId && row.status === 'awaiting-trial' && !reviewedCounsel.has(row.id));
    if (item) { const counsel = spendable() >= item.counselFee.minor + reserve() ? 'private' : 'public', before = accountFor(world).cash; reviewedCounsel.add(item.id); run({ type: 'retain-counsel', caseId: item.id, counsel }); assert.equal(accountFor(world).cash, before - (counsel === 'private' && !item.counselPaid ? item.counselFee.minor : 0n)); mark('counsel', { caseId: item.id, counsel, paid: before - accountFor(world).cash }); log('counsel', 'reviewed-and-committed', { caseId: item.id, counsel }); return true; }
    const sentence = activeSentence(world);
    if (sentence && !configured.has(sentence.id)) { configured.add(sentence.id); run({ type: 'prison-routine', routine: { work: true, study: true, exercise: true, conduct: 'quiet' } }); mark('prisonRoutine', { sentenceId: sentence.id, routine: activeSentence(world)!.routine }); return true; }
    if (sentence && !guardedCustody) { guardedCustody = true; negative('custodyJobGuard', { type: 'apply-job', roleId: 'cleaner' }, /custody/); negative('custodyStudyGuard', { type: 'study' }, /custody/); negative('custodyTravelGuard', { type: 'book-trip', destinationId, duration: 1, companionIds: [], focus: 'rest', quotedTotal: tripQuote(world, destinationId, 1).total }, /custody/); mark('custodyGuard', { unchangedWorldAndRandom: true, actions: ['apply-job', 'study', 'book-trip'] }); }
    if (sentence && !befriended.has(sentence.id) && !hospitalized(world, player())) { const target = prisonContacts(world)[0]; if (target) { befriended.add(sentence.id); run({ type: 'prison-interact', personId: target.id, action: 'befriend' }); mark('prisonConnection', { sentenceId: sentence.id, personId: target.id, relationshipId: relationFor(world, activeId, target.id)!.id }); return true; } }
    if (sentence && !visits.has(sentence.id) && !hospitalized(world, player())) { const parentEdge = world.relationships.find(row => row.to === activeId && row.roles.some(role => role === 'parent' || role === 'guardian') && !world.people[row.from].died && !isConfined(world, row.from) && samePhysicalPlace(world, activeId, row.from)); if (parentEdge && !socialActionUsed(world, parentEdge.from, 'spend-time') && spendable() >= rules[player().country].baseWage / 2000n) { visits.add(sentence.id); if (attempt('prisonVisit', { type: 'interact', personId: parentEdge.from, action: 'spend-time' })) return true; } }
    return false;
  };
  const drain = () => {
    let guard = 0;
    while (!player().died && guard++ < 300) {
      if (world.pending?.kind === 'decision') {
        const event = world.pending;
        const preferred = event.templateId === 'arrest' ? countryCodes.indexOf(country) % 2 === 0 && event.choices.some(row => row.id === 'bail' && !choiceUnavailable(world, row)) ? 'bail' : 'remand' : event.templateId === 'court-hearing' ? 'not-guilty' : event.templateId === 'job-interview' ? 'careful' : null;
        const choice = preferred ? event.choices.find(row => row.id === preferred && !choiceUnavailable(world, row)) : event.choices.find(row => !choiceUnavailable(world, row)); assert.ok(choice, 'Bound event needs an available choice');
        const worth = event.templateId === 'arrest' && choice.id === 'bail' ? netWorth(world).minor : null;
        run({ type: 'choose', eventId: event.id, choiceId: choice.id }); if (worth !== null) assert.equal(netWorth(world).minor, worth, 'Actual bail stays owned in escrow');
        const pending = world.pending as World['pending']; log(event.templateId, choice.id, { eventId: event.id, result: pending?.kind === 'result' ? pending.title : null });
      } else if (world.pending) run({ type: 'acknowledge', resultId: world.pending.id }); else if (managePause()) { /* Actual legal planning can also happen between years. */ } else if (world.annual) run({ type: 'resume' }); else break;
    }
    assert.ok(guard < 300, 'Annual/court pauses must close');
  };
  const act = (stage: string, command: GameCommand) => { const result = attempt(stage, command); drain(); return result; };
  const present = () => !player().died && !isConfined(world) && !player().legal.wanted && !hospitalized(world, player()) && !activeTrip(world) && !serviceAway(world) && player().stats.health >= 25;
  observe(); options.onStep?.(world, trace);
  for (; years < maxYears && !player().died; years++) {
    drain(); if (player().died) break;
    const rule = rules[player().country], currentAge = age();
    if (currentAge >= 6 && present() && !healthy) healthy = act('healthyRoutine', { type: 'health-routine', routine: { exercise: 'walking', diet: 'balanced', sleep: 'restful', mindfulness: true, smoking: false, drinking: 'none' } });
    if (!attemptedLeave && ['primary', 'secondary'].includes(player().education.stage) && currentAge < rule.schoolEnd) { attemptedLeave = true; negative('compulsoryLeaveGuard', { type: 'leave-school' }, /compulsory/); mark('compulsoryLeaveGuard', { actualCountry: player().country, age: currentAge, schoolEnd: rule.schoolEnd, actualStage: player().education.stage, unchangedWorldAndRandom: true }); }
    if (present() && !player().employment && !player().finance.pensionAnnual && currentAge < rule.retirementAge) {
      const roles = currentAge < rule.adultAge || player().education.stage !== 'none' ? ['cafe-part', 'shop-assistant-part'] : ['administrator', 'retail', 'cleaner'];
      for (const roleId of roles) { const reason = jobReason(world, jobs.find(row => row.id === roleId)!); if (reason) { blocked('employment:' + roleId, reason); continue; } act('employment', { type: 'apply-job', roleId }); if (player().employment) break; }
    }
    if (present() && player().employment && !currentWorkplace(world) && !workplaceReason(world)) act('coworkers', { type: 'meet-coworkers' });
    if (present() && currentAge >= Math.max(18, rule.adultAge, rule.schoolEnd) && currentAge <= 35 && offenceIndex < 3 && lastOffenceYear !== world.date.year) {
      const offence = (['shoplift', 'pickpocket', 'burglary'] as const)[offenceIndex], reason = crimeReason(world, offence);
      if (reason) blocked('offence:' + offence, reason);
      else {
        const known = new Set(world.relationships.flatMap(row => row.from === activeId ? [row.to] : row.to === activeId ? [row.from] : []));
        const victim = offence === 'pickpocket' ? [...known].map(id => world.people[id]).find(person => !person.died && !isConfined(world, person) && !hospitalized(world, person) && !activeTrip(world, person.id) && !serviceAway(world, person.id) && samePhysicalPlace(world, activeId, person.id) && ageOn(person, world.date) >= 18 && !closeFamily(world, activeId, person.id)) : undefined;
        if (offence === 'pickpocket' && !victim) blocked('offence:pickpocket', 'No actual known available nonrelative adult victim; no person is generated by this policy');
        else { const ownCash = accountFor(world).cash, victimCash = victim ? accountFor(world, victim).cash : null; run({ type: 'crime', offence, ...(victim ? { victimId: victim.id } : {}) }); const source = world.incidents.filter(row => row.personId === activeId).at(-1)!; assert.equal(accountFor(world).cash - ownCash, source.gain.minor); if (victim) assert.equal(victimCash! - accountFor(world, world.people[victim.id]).cash, source.gain.minor); offenceIndex++; lastOffenceYear = world.date.year; log('offence', 'actual-recorded-attempt', { incidentId: source.id, offence, victimId: victim?.id ?? null, actualGain: source.gain }); cold('actual offence'); drain(); }
      }
    }
    const visible = visibleConvictions(world);
    if (present() && reached.has('release')) {
      const period = visible.length ? 'visible-record' : sawVisibleRecord ? 'expired-record' : 'no-conviction';
      const choice = { destinationId, route: 'work', roleId: 'cleaner', program: null, field: null } as const, reason = relocationReason(world, choice);
      if (!foreignApplications.has(period)) { if (reason) blocked('foreignWorkApplication', reason); else if (spendable() >= relocationFee(world) + reserve()) { foreignApplications.add(period); const employment = player().employment, before = accountFor(world).cash; if (act('foreignWorkApplication', { type: 'apply-relocation', ...choice, quotedFee: relocationFee(world) })) { const offer = world.relocations.at(-1)!; assert.equal(accountFor(world).cash, before - offer.applicationFee); assert.deepEqual(player().employment, employment, 'Foreign application creates no wages or job'); mark('foreignWorkApplication', { applicationId: offer.id, status: offer.status, actualSavedChance: offer.chance, visibleCaseIds: visible.map(row => row.id), caveat: 'Application only; no country move or unearned foreign contract' }); cold('foreign work application'); } } }
      if (!reached.has('holiday')) { const reason = tripReason(world, destinationId, 1), quote = tripQuote(world, destinationId, 1); if (reason) blocked('holiday', reason); else if (spendable() >= quote.total + reserve()) act('holiday', { type: 'book-trip', destinationId, duration: 1, companionIds: [], focus: 'rest', quotedTotal: quote.total }); }
    }
    if (present() && currentAge >= rule.retirementAge && !player().finance.pensionAnnual && player().finance.serviceMonths >= 120) { const service = player().finance.serviceMonths; if (act('retirement', { type: 'retire' })) mark('retirement', { actualServiceMonths: service, annualPension: player().finance.pensionAnnual }); }
    if (!player().died) { run({ type: 'advance' }); drain(); }
  }
  observe(); cold('final');
  const milestones = Object.fromEntries(criminalMilestones.map(stage => [stage, reached.has(stage) ? { status: 'reached', ...reached.get(stage)! } : { status: player().died ? 'unreached-at-natural-death' : 'unreached-at-policy-bound' }]));
  const ownLedger = world.ledger.filter(row => row.personId === activeId);
  return { world, trace, report: { policyVersion: criminalPolicyVersion, country, versions: { world: world.schemaVersion, engine: world.engineVersion, content: world.contentVersion }, birthRevision: initial.revision, finalRevision: world.revision, commandsAttempted: trace.length, commandsCommitted: committed, yearsAdvanced: years, ageAtEnd: age(), finalDate: world.date, naturallyDied: !!player().died, milestones, scenarioBComplete: false, explicitGaps: ['No compulsory-school dropout command exists; only its rejection and normal country-specific school exit are exercised.', 'Holiday travel has current custody/pursuit/court restrictions, not a blanket conviction ban. Work-abroad applications use actual record rules.', 'Only actual observed arrest/trial/prison/release outcomes are credited. No required verdict or life stage is forced.', 'Only birth uses SQLite/store; later cold checks pack and unpack actual automatic-save checkpoints in memory. Native, full-journey SQLite, seizure/contraband, Scenario A/C and multigeneration acceptance are unrun.'], observations, coldChecks, custodyWindows, schoolCompletions: world.schoolCompletions.filter(row => row.personId === activeId), qualifications: player().education.qualifications, incidents: world.incidents.filter(row => row.personId === activeId), cases: world.cases.filter(row => row.personId === activeId), sentences: world.sentences.filter(row => row.personId === activeId), remand: world.remand.filter(row => row.personId === activeId), workHistory: world.workHistory.filter(row => row.personId === activeId), legalAndCrimeReceipts: ownLedger.filter(row => ['crime-proceeds', 'bail-held', 'bail-return', 'legal-fee', 'court-fine', 'fine-reversal', 'fine-refund', 'prison-pay', 'restitution', 'family-collection'].includes(row.category)), foreignApplications: world.relocations.filter(row => row.personId === activeId), trips: world.trips.filter(row => row.organizerId === activeId), prisonConnections: world.relationships.filter(row => (row.from === activeId || row.to === activeId) && row.memories.some(memory => memory.startsWith('prison-friendship:'))), estate: world.estates.find(row => row.personId === activeId) ?? null } };
}
