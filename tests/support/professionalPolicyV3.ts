import assert from 'node:assert/strict';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { database } from './sqlite';
import { randomCreation } from '../../src/game/createLife';
import { countries, type CountryCode } from '../../src/game/countries';
import { ageOn, encodeWorld, type World, type GameDate } from '../../src/game/model';
import { IneligibleAction, resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { rules } from '../../src/game/rules';
import { jobs } from '../../src/game/content/jobs';
import { assetCatalog } from '../../src/game/content/assets';
import { accountFor, availableCash } from '../../src/game/systems/common';
import { universityApplicationReason, universityPlaceQuote, universityPlaceReason } from '../../src/game/systems/universityAdmissions';
import { activeUniversityApplication } from '../../src/game/systems/universityAdmissionSchemas';
import { currentRecovery } from '../../src/game/systems/educationRecoverySchemas';
import { hasSecondary, recoveryReason } from '../../src/game/systems/educationRecovery';
import { scholarshipReason, scholarshipOfferReason } from '../../src/game/systems/scholarships';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { schoolActionReason, schoolHelpReason } from '../../src/game/systems/school';
import { jobReason } from '../../src/game/systems/work';
import { currentWorkplace } from '../../src/game/systems/workplaceSchemas';
import { workplaceReason, workFeedbackReason, workRaiseReason } from '../../src/game/systems/workplaces';
import { activeHobbyPlan } from '../../src/game/systems/leisureSchemas';
import { hobbyFee, hobbyReason, leisurePayer } from '../../src/game/systems/leisure';
import { activeTrip } from '../../src/game/systems/travelSchemas';
import { hospitalized } from '../../src/game/systems/healthSchemas';
import { isConfined } from '../../src/game/systems/legalSchemas';
import { serviceAway } from '../../src/game/systems/serviceSchemas';
import { otherPerson, partnerRelation, relationFor, romanceReason, socialActionUsed, weddingBudgets, dateBudget } from '../../src/game/systems/relationships';
import { adoptionFee, childrenOf, conceptionReason } from '../../src/game/systems/family';
import { purchaseQuote, purchaseReason } from '../../src/game/systems/assets';
import { investmentQuote } from '../../src/game/systems/markets';
import { portfolioValue } from '../../src/game/valuation';

export const professionalMilestones = ['primarySchool', 'secondarySchool', 'secondaryQualification', 'universityAdmission', 'degree', 'qualifiedJob', 'paidQualifiedJob', 'feedback', 'raise', 'promotion', 'partner', 'marriage', 'child', 'mortgageHome', 'investment', 'dividend', 'retirement', 'pensionPayment', 'death', 'estate'] as const;
export const professionalPolicyVersion = 3;
type Milestone = typeof professionalMilestones[number];
type Proof = { age: number; date: GameDate; revision: number; evidence: Record<string, unknown> };
export type ProfessionalObservation = { stage: string; outcome: string; age: number; date: GameDate; detail: Record<string, unknown> };
export type ProfessionalOptions = { maxYears?: number; onStep?: (world: World, trace: readonly GameCommand[]) => void; onMilestone?: (stage: Milestone, proof: Proof) => void };

/** Exercise the real save codec and its existing compact/canonical bounds. */
export function professionalColdResume(world: World, reason: string): World {
  const encoded = encodeWorld(world), cold = unpackCheckpoint(packCheckpoint(world), true);
  assert.equal(encodeWorld(cold), encoded, 'Cold codec must retain every field: ' + reason);
  return cold;
}

/** Family Planning exposes this permanent conception reason and an adoption
 * review. Partner willingness remains the real command's consent decision. */
export function professionalAdoptionFallback(world: World): { type: 'adopt'; age: 0 } | null {
  const person = world.people[world.activePersonId], relation = partnerRelation(world), partner = relation && otherPerson(world, relation), age = ageOn(person, world.date);
  if (relation?.romance !== 'married' || childrenOf(world).length) return null;
  const reason = conceptionReason(world, person, partner);
  if (!reason || !reason.includes('reproductive capacities') && !reason.includes('current fertility')) return null;
  if (person.died || isConfined(world) || activeTrip(world) || hospitalized(world, person) || serviceAway(world) || age < 21 || age > 65 || person.stats.health < 40 || !person.wantsChildren || !person.householdId || !person.employment && person.finance.pensionAnnual <= 0n || world.actionCounts[person.id + ':adopt:' + world.date.year] || availableCash(accountFor(world)) < adoptionFee(world) + rules[person.country].livingCost * 3n) return null;
  return { type: 'adopt', age: 0 };
}

/** The only setup uses the same creation and birth acknowledgement commands as the app. */
export async function createProfessionalLife(country: CountryCode, seed: number) {
  const { sqlite, driver } = database();
  try {
    const repository = new SaveRepository(driver), date = { year: 2000, month: 1, day: 1 };
    await repository.initialise();
    const store = createGameStore({ repository: async () => repository, date: () => date, id: () => 'life_professional_' + country + '_' + seed });
    const input = { ...randomCreation(seed), country, city: countries[country].cities[0], background: 'ordinary' as const };
    assert.equal(await store.getState().startLife(input, seed), true, 'Actual life creation must commit');
    assert.equal(store.getState().world!.birthAcknowledged, false);
    assert.equal(await store.getState().acknowledgeBirth(), true, 'Actual birth acknowledgement must commit');
    const world = store.getState().world!;
    assert.equal(world.revision, 1); assert.equal(ageOn(world.people[world.activePersonId], world.date), 0);
    return world;
  } finally { sqlite.close(); }
}

/** Deterministic player policy, never a desired-outcome generator. All later
 * gameplay changes go through resolveCommand; rejected actions keep their cause. */
export function runProfessionalPolicy(initial: World, options: ProfessionalOptions = {}) {
  let world = initial; const activeId = initial.activePersonId, country = initial.people[activeId].country, maxYears = options.maxYears ?? 150;
  assert.ok(Number.isInteger(maxYears) && maxYears > 0 && maxYears <= 150);
  assert.ok(initial.birthAcknowledged && Object.isFrozen(initial), 'Begin with a real immutable acknowledged newborn');
  assert.equal(ageOn(initial.people[activeId], initial.date), 0);
  const trace: GameCommand[] = [], observations: ProfessionalObservation[] = [], reached = new Map<Milestone, Proof>(), coldChecks: { reason: string; revision: number }[] = [];
  const blockKeys = new Set<string>(), homeObservations: Record<string, unknown>[] = [], portfolioObservations: Record<string, unknown>[] = []; let socialTarget: string | null = null, years = 0, healthy = false, committedCommands = 0;
  const player = () => world.people[activeId], age = () => ageOn(player(), world.date), spendable = () => availableCash(accountFor(world)), reserve = () => rules[player().country].livingCost * 3n;
  const record = (stage: string, outcome: string, detail: Record<string, unknown> = {}) => observations.push({ stage, outcome, age: age(), date: { ...world.date }, detail });
  const blocked = (stage: string, reason: string) => { const key = stage + ':' + world.date.year + ':' + reason; if (!blockKeys.has(key)) { blockKeys.add(key); record(stage, 'ineligible', { reason }); } };
  const cold = (reason: string) => { world = professionalColdResume(world, reason); coldChecks.push({ reason, revision: world.revision }); };
  const mark = (stage: Milestone, evidence: Record<string, unknown>) => { if (reached.has(stage)) return; const proof = { age: age(), date: { ...world.date }, revision: world.revision, evidence }; reached.set(stage, proof); options.onMilestone?.(stage, proof); cold(stage); };
  const observe = () => {
    assert.equal(world.activePersonId, activeId, 'The policy never continues as or impersonates another person');
    for (const stage of ['primary', 'secondary'] as const) { const school = world.schoolCommunities.find(row => row.personId === activeId && row.stage === stage && row.periods.length); if (school) mark(stage === 'primary' ? 'primarySchool' : 'secondarySchool', { schoolId: school.id, attendedMonths: school.periods.length }); }
    const secondary = player().education.qualifications.find(row => row.level === 'secondary'); if (secondary) mark('secondaryQualification', { qualification: secondary });
    const degree = player().education.qualifications.find(row => row.level === 'degree' && row.field === 'business'); if (degree) mark('degree', { qualification: degree, finalGrades: player().education.grades });
    if (player().employment) {
      const job = player().employment!, role = jobs.find(row => row.id === job.roleId)!;
      if (role.qualification === 'degree') { assert.ok(player().education.qualifications.some(row => row.level === 'degree' && (!role.field || row.field === role.field))); mark('qualifiedJob', { employmentId: job.id, roleId: role.id, annualPay: job.annualPay, currency: job.currency }); }
      if (role.qualification === 'degree' && job.rank > 0) mark('promotion', { employmentId: job.id, roleId: role.id, rank: job.rank });
    }
    const paid = world.workHistory.find(row => row.personId === activeId && jobs.find(job => job.id === row.roleId)?.qualification === 'degree' && row.monthsWorked > 0 && row.grossEarned > 0n); if (paid) mark('paidQualifiedJob', { employmentId: paid.id, roleId: paid.roleId, actualMonths: paid.monthsWorked, actualGross: paid.grossEarned, currency: paid.currency });
    const qualifiedIds = new Set(world.workHistory.filter(row => row.personId === activeId && jobs.find(job => job.id === row.roleId)?.qualification === 'degree').map(row => row.id));
    const feedbackPlace = world.workplaces.find(row => row.personId === activeId && qualifiedIds.has(row.employmentId) && row.feedback.some(item => item.accepted)); if (feedbackPlace) mark('feedback', { employmentId: feedbackPlace.employmentId, feedback: feedbackPlace.feedback.find(row => row.accepted) });
    const raise = world.workRaises.find(row => row.personId === activeId && qualifiedIds.has(row.employmentId) && row.accepted); if (raise) mark('raise', { raise });
    const bond = partnerRelation(world); if (bond) mark('partner', { relationshipId: bond.id, personId: otherPerson(world, bond).id, romance: bond.romance });
    const marriage = world.marriages.find(row => row.a === activeId || row.b === activeId); if (marriage) mark('marriage', { marriage });
    const child = childrenOf(world)[0]; if (child) mark('child', { personId: child.id, born: child.born, parentType: relationFor(world, activeId, child.id)?.parentType, alive: !child.died });
    const dividends = world.ledger.filter(row => row.personId === activeId && row.category === 'dividend' && row.cashDelta > 0n); if (dividends[0]) mark('dividend', { receiptId: dividends[0].id, received: dividends[0].cashDelta, currency: dividends[0].currency });
    if (player().finance.pensionReceipts.some(row => row.gross > 0n)) mark('pensionPayment', { receipts: player().finance.pensionReceipts.length });
    if (player().died) {
      assert.ok(player().causeOfDeath); assert.ok(world.journal.some(row => row.personId === activeId && row.category === 'death')); mark('death', { died: player().died, cause: player().causeOfDeath });
      const estate = world.estates.find(row => row.personId === activeId); assert.ok(estate, 'Actual death must settle exactly one estate'); assert.equal(world.estates.filter(row => row.personId === activeId).length, 1);
      const distributed = estate.distributions.reduce((sum, row) => sum + row.cash.minor + row.assetValue.minor, 0n) + estate.charity.minor + estate.tax.minor + estate.fees.minor;
      assert.equal(distributed, estate.netWorthAtDeath.minor + estate.debtWrittenOff.minor, 'Estate must conserve actual wealth including written-off liabilities');
      mark('estate', { estateId: estate.id, valueAtDeath: estate.netWorthAtDeath, distributedAndCosts: distributed, debtWrittenOff: estate.debtWrittenOff, heirs: estate.distributions.map(row => row.personId), conserved: true });
    }
  };
  const run = (command: GameCommand) => {
    const before = world; trace.push(command); world = resolveCommand(world, command, true); committedCommands++;
    for (const application of world.universityApplications.filter(row => row.personId === activeId && row.review)) {
      const prior = before.universityApplications.find(row => row.id === application.id);
      if (prior?.status === 'waitlisted' && application.status !== 'waitlisted') {
        record('universityWaitlistReview', application.status, { applicationId: application.id, date: application.review!.date });
        cold('saved actual university waitlist review');
      }
    }
    if (command.type === 'choose' && before.pending?.kind === 'decision' && before.pending.templateId === 'job-interview') {
      assert.deepEqual(world.accounts, before.accounts, 'Hiring cannot credit money'); assert.deepEqual(world.ledger, before.ledger);
      const started = world.workHistory.find(row => row.personId === activeId && !before.workHistory.some(previous => previous.id === row.id));
      if (started) { assert.equal(started.monthsWorked, 0); assert.equal(started.grossEarned, 0n); assert.equal(player().employment!.paidMonths, 0); }
    }
    observe(); options.onStep?.(world, trace);
  };
  const attempt = (stage: string, command: GameCommand) => {
    try { run(command); const title = world.pending?.kind === 'result' ? world.pending.title : null; record(stage, title && ['Application declined', 'Scholarship declined', 'Not this time', 'They aren’t ready', 'No pregnancy this year'].includes(title) ? 'declined' : 'committed', { command: command.type, result: title }); return true; }
    catch (error) { if (!(error instanceof IneligibleAction)) throw error; blocked(stage, error.message); return false; }
  };
  const aidReviewedApplications = new Set<string>(), placeReviewedApplications = new Set<string>();
  // Only public saved application status/real eligibility are inspected. Never the roll.
  const nextPlaceCommand = (): { stage: string; command: GameCommand } | null => {
    if (!present()) return null;
    const application = activeUniversityApplication(world);
    if (!application || application.status !== 'accepted' || application.field !== 'business' || placeReviewedApplications.has(application.id)) return null;
    const reason = universityPlaceReason(world, application.id);
    if (reason) { placeReviewedApplications.add(application.id); blocked('universityAdmission', reason); return null; }
    if (!aidReviewedApplications.has(application.id)) {
      aidReviewedApplications.add(application.id);
      for (const kind of ['access', 'merit'] as const) if (!scholarshipReason(world, kind, 'university', 'business')) return { stage: 'scholarship', command: { type: 'apply-scholarship', kind, program: 'university', field: 'business' } };
    }
    const offer = world.scholarships.find(row => !scholarshipOfferReason(world, row, 'university', 'business'));
    const quote = universityPlaceQuote(world, application, offer?.id), funding = spendable() >= quote.billed + reserve() ? 'cash' as const : 'loan' as const;
    const fundingReason = universityPlaceReason(world, application.id, funding, offer?.id);
    placeReviewedApplications.add(application.id);
    if (fundingReason) { blocked('universityAdmission', fundingReason); return null; }
    return { stage: 'universityAdmission', command: { type: 'accept-university-place', applicationId: application.id, funding, ...(offer ? { scholarshipId: offer.id } : {}) } };
  };
  const admissionStep = () => {
    const next = nextPlaceCommand(); if (!next) return false;
    const application = activeUniversityApplication(world)!;
    const committed = attempt(next.stage, next.command);
    if (committed) cold(next.stage + ' result');
    if (committed && next.command.type === 'accept-university-place' && player().education.stage === 'university') mark('universityAdmission', { applicationId: application.id, field: 'business', funding: next.command.funding, scholarshipId: next.command.scholarshipId ?? null, months: player().education.months, firstYearBilled: world.universityApplications.find(row => row.id === application.id)!.enrolment!.billed });
    return committed;
  };
  const drain = () => {
    let guard = 0;
    while ((world.pending || world.annual) && !player().died && guard++ < 200) {
      // Actual accepted waitlist review pauses its year. Inspect before ordinary resume.
      if (!world.pending && world.annual?.pausedForPlanning && admissionStep()) continue;
      if (world.pending?.kind === 'decision') {
        const event = world.pending;
        const choice = event.templateId === 'job-interview' ? event.choices.find(row => row.id === 'careful' && !choiceUnavailable(world, row))
          : event.templateId === 'meet-dating' ? event.choices.find(row => row.id !== 'later' && !choiceUnavailable(world, row) && !romanceReason(world, world.people[row.id]))
          : event.choices.find(row => !choiceUnavailable(world, row));
        const selected = choice ?? event.choices.find(row => row.id === 'later' && !choiceUnavailable(world, row)); assert.ok(selected, 'A bound decision needs an actual available choice');
        if (event.templateId === 'meet-dating' && selected.id !== 'later') socialTarget = selected.id;
        run({ type: 'choose', eventId: event.id, choiceId: selected.id });
        if (event.templateId === 'job-interview') { const pending = world.pending as World['pending']; const title = pending?.kind === 'result' ? pending.title : null; record('interview', title === 'You got the job' ? 'accepted' : 'declined', { roleId: event.choices[0].effects.find(row => row.kind === 'job-interview')?.roleId ?? null, result: title }); }
      } else if (world.pending) run({ type: 'acknowledge', resultId: world.pending.id }); else run({ type: 'resume' });
    }
    assert.ok(guard < 200, 'A real annual cursor must close');
  };
  const act = (stage: string, command: GameCommand, checkCold = false) => { const committed = attempt(stage, command); if (committed && checkCold) cold(stage + ' result'); drain(); return committed; };
  const present = () => !player().died && !player().legal.wanted && !hospitalized(world, player()) && !isConfined(world) && !activeTrip(world) && !serviceAway(world) && player().stats.health >= 25;
  const studying = () => player().education.stage !== 'none';

  observe(); options.onStep?.(world, trace);
  for (; years < maxYears && !player().died; years++) {
    drain(); if (player().died) break;
    const rule = rules[player().country], currentAge = age();
    if (currentAge >= 6 && !healthy && present()) { healthy = act('healthRoutine', { type: 'health-routine', routine: { exercise: 'walking', diet: 'balanced', sleep: 'restful', mindfulness: true, smoking: false, drinking: 'none' } }); }
    if (currentAge >= 6 && player().stats.smarts < 60 && present()) {
      const hobby = world.hobbies.find(row => row.personId === activeId && row.kind === 'reading');
      if (!hobby || !activeHobbyPlan(hobby)) { const reason = hobbyReason(world, 'reading', 'community'), payer = leisurePayer(world); if (!reason && payer) act('reading', { type: 'hobby-plan', kind: 'reading', mode: 'community', reviewedPayerId: payer.id, quotedMonthlyFee: hobbyFee(player().country, 'reading', 'community') }); else if (reason) blocked('reading', reason); }
    }
    if (present() && studying()) {
      if (player().education.effort !== 'focused') act('studyRoutine', { type: 'study-effort', effort: 'focused' });
      if (player().education.paused) act('tuitionResume', { type: 'fund-studies', funding: 'loan' }, true);
      if (!player().education.paused && player().education.lastStudyYear !== world.date.year && player().stats.energy >= 8) act('extraStudy', { type: 'study' });
      const school = currentSchool(world);
      if (school && !schoolActionReason(world, school) && school.conduct !== 'helpful') act('schoolConduct', { type: 'school-conduct', communityId: school.id, conduct: 'helpful' });
      const current = currentSchool(world); if (current && !schoolHelpReason(world, current, current.currentTeacherId)) act('schoolHelp', { type: 'school-help', communityId: current.id, teacherId: current.currentTeacherId });
    }
    if (currentAge >= rule.schoolEnd && !studying() && !reached.has('degree') && present()) {
      const purpose = !hasSecondary(player()) ? 'secondary' : player().education.grades < 55 ? 'grades' : null;
      if (purpose && !currentRecovery(world)) { const reason = recoveryReason(world, purpose); if (!reason) act('recovery', { type: 'enroll-recovery', purpose }); else blocked('recovery', reason); }
      const recovery = currentRecovery(world); if (recovery && recovery.effort !== 'focused') act('recoveryRoutine', { type: 'recovery-effort', courseId: recovery.id, effort: 'focused' });
      const existing = activeUniversityApplication(world);
      if (!existing) {
        const reason = universityApplicationReason(world, 'business');
        if (reason) blocked('universityAdmission', reason);
        else act('universityApplication', { type: 'apply-university', field: 'business' }, true);
      }
      // Immediate offers are separately reviewed; waiting never calls legacy enrol.
      while (!world.pending && admissionStep()) drain();
    }
    if (present() && currentAge < rule.retirementAge && !player().finance.pensionAnnual) {
      const current = jobs.find(row => row.id === player().employment?.roleId);
      const targetRoles = reached.has('degree') ? ['accountant', 'teacher', 'journalist', 'administrator'] : ['cafe-part', 'shop-assistant-part'];
      if (!current || current.partTime && reached.has('degree') || reached.has('degree') && current.qualification !== 'degree') {
        for (const roleId of targetRoles) { const role = jobs.find(row => row.id === roleId)!, reason = jobReason(world, role); if (reason) { blocked('qualifiedJob:' + roleId, reason); continue; } if (act('jobApplication', { type: 'apply-job', roleId }, true) && player().employment?.roleId === roleId) break; }
      }
      if (player().employment) {
        if (player().employment!.effort !== 'hard') act('workRoutine', { type: 'work-effort', effort: 'hard' });
        if (!currentWorkplace(world) && !workplaceReason(world)) act('coworkers', { type: 'meet-coworkers' });
        const place = currentWorkplace(world), supervisor = place?.members.find(row => row.role === 'supervisor' && !row.left);
        if (place && supervisor && !workFeedbackReason(world, place, supervisor.personId)) act('feedback', { type: 'work-feedback', workplaceId: place.id, supervisorId: supervisor.personId });
        const latest = currentWorkplace(world); if (latest && supervisor && !workRaiseReason(world, latest, supervisor.personId)) act('raise', { type: 'request-raise', workplaceId: latest.id, supervisorId: supervisor.personId }, true);
      }
    }
    if (currentAge >= rule.adultAge && present() && !reached.has('marriage')) {
      const existing = partnerRelation(world); if (existing) socialTarget = otherPerson(world, existing).id;
      if (socialTarget && (!world.people[socialTarget] || romanceReason(world, world.people[socialTarget]))) socialTarget = null;
      if (!socialTarget && !world.actionCounts[activeId + ':social:' + world.date.year + ':dating:meet']) act('introduction', { type: 'meet-people', purpose: 'dating', gender: 'any' });
      if (socialTarget) {
        const id = socialTarget;
        for (const action of ['talk', 'compliment', 'spend-time'] as const) if (!socialActionUsed(world, id, action) && (action !== 'spend-time' || spendable() >= reserve() + dateBudget(world) / 2n)) act('courtship:' + action, { type: 'interact', personId: id, action });
        let relation = relationFor(world, activeId, id)!;
        if (relation.romance !== 'engaged' && !socialActionUsed(world, id, 'date') && spendable() >= reserve() + dateBudget(world)) act('date', { type: 'ask-date', personId: id });
        relation = relationFor(world, activeId, id)!;
        const ring = assetCatalog.find(row => row.id === 'engagement-ring')!, ringCost = purchaseQuote(world, ring, 'cash').cashRequired;
        if (relation.romance === 'dating' && relation.strength >= 75 && relation.trust >= 60 && !socialActionUsed(world, id, 'propose') && spendable() >= reserve() + ringCost) act('proposal', { type: 'propose', personId: id }, true);
        relation = relationFor(world, activeId, id)!;
        if (relation.romance === 'engaged' && spendable() >= reserve() + weddingBudgets(world)[0].amount) act('wedding', { type: 'marry', personId: id, budget: weddingBudgets(world)[0].amount }, true);
      }
    }
    const spouse = partnerRelation(world);
    if (present() && spouse?.romance === 'married' && !childrenOf(world).length && !world.actionCounts[activeId + ':try-child:' + world.date.year]) { const reason = conceptionReason(world, player(), otherPerson(world, spouse)); if (!reason) act('parenthood', { type: 'try-child' }, true); else blocked('child', reason); }
    const adoption = present() && professionalAdoptionFallback(world);
    if (adoption) { record('adoptionReview', 'reviewed', { reason: conceptionReason(world, player(), spouse && otherPerson(world, spouse)), age: 0, actualFee: adoptionFee(world), currency: accountFor(world).currency }); act('adoption', adoption, true); }
    if (present() && !studying() && reached.has('paidQualifiedJob')) {
      const debt = world.liabilities.find(row => row.ownerId === activeId && row.kind === 'student' && row.principal > 0n && row.currency === accountFor(world).currency);
      const surplus = spendable() - reserve();
      if (debt && surplus > 0n) act('studentRepayment', { type: 'repay', liabilityId: debt.id, amount: surplus < debt.principal ? surplus : debt.principal }, true);
    }
    if (currentAge >= rule.adultAge && currentAge < rule.retirementAge && present() && !reached.has('mortgageHome') && reached.has('paidQualifiedJob')) {
      const offer = assetCatalog.find(row => row.id === 'studio')!, quote = purchaseQuote(world, offer, 'mortgage', 2000, 360), reason = purchaseReason(world, offer, 'mortgage', 2000, 360);
      if (reason) blocked('mortgageHome', reason); else if (spendable() < quote.cashRequired + reserve()) blocked('mortgageHome', 'Policy keeps three months of local living costs after the deposit and fee');
      else if (act('mortgageHome', { type: 'buy-asset', catalogId: offer.id, financing: 'mortgage', depositBps: 2000, termMonths: 360, quotedPrice: quote.price }, true)) {
        const home = world.assets.find(row => row.ownerId === activeId && row.catalogId === 'studio' && row.ownershipSource === 'purchase')!; assert.ok(home?.mortgageId); const debt = world.liabilities.find(row => row.id === home.mortgageId)!;
        mark('mortgageHome', { assetId: home.id, mortgageId: debt.id, principal: debt.principal, monthlyPayment: debt.monthlyPayment, reviewedQuote: quote });
        if (!home.primaryHome) act('homeOccupancy', { type: 'move-in', assetId: home.id });
      }
    }
    if (currentAge >= rule.adultAge && present() && reached.has('paidQualifiedJob') && !reached.has('investment')) {
      const quote = investmentQuote(world, 'GROVE', 1n); if (spendable() >= quote.buyCost + reserve() && act('investment', { type: 'buy-investment', instrumentId: 'GROVE', quantity: 1n, quotedMinor: quote.value }, true)) mark('investment', { instrumentId: 'GROVE', quantity: 1n, quote, portfolioValue: portfolioValue(world) }); else blocked('investment', 'Policy requires the live purchase price, fee and three months of local living costs');
    }
    if (present() && currentAge >= rule.retirementAge && !player().finance.pensionAnnual) {
      if (player().finance.serviceMonths >= 120) { const service = player().finance.serviceMonths, gross = player().finance.lifetimeGross; if (act('retirement', { type: 'retire' }, true)) mark('retirement', { actualServiceMonths: service, actualLifetimeGross: gross, annualPension: player().finance.pensionAnnual, eligibleAge: rule.retirementAge }); }
      else blocked('retirement', 'Fewer than120 actual recorded work months');
    }
    if (reached.has('mortgageHome')) { const id = reached.get('mortgageHome')!.evidence.assetId, home = world.assets.find(row => row.id === id), debt = world.liabilities.find(row => row.id === home?.mortgageId); if (home) homeObservations.push({ date: { ...world.date }, assetId: home.id, ownerId: home.ownerId, value: home.value, currency: home.currency, primaryHome: home.primaryHome, debtId: debt?.id ?? null, principal: debt?.principal ?? null, equity: home.ownerId === activeId ? home.value - (debt?.principal ?? 0n) : null }); }
    if (reached.has('investment') && !player().died) portfolioObservations.push({ date: { ...world.date }, holdings: world.holdings.filter(row => row.ownerId === activeId), valuation: portfolioValue(world) });
    if (!player().died) { run({ type: 'advance' }); drain(); }
  }
  observe(); cold('final');
  const statuses = Object.fromEntries(professionalMilestones.map(stage => [stage, reached.has(stage) ? { status: 'reached', ...reached.get(stage)! } : { status: player().died ? 'unreached-at-natural-death' : 'unreached-at-policy-bound', lastObservedRestriction: [...observations].reverse().find(row => row.stage === stage && row.outcome === 'ineligible') ?? null }]));
  const ownHistory = world.workHistory.filter(row => row.personId === activeId), ownLedger = world.ledger.filter(row => row.personId === activeId);
  return { world, trace, report: { policyVersion: professionalPolicyVersion, country, universityApplications: world.universityApplications.filter(row => row.personId === activeId), studyCourses: world.studyCourses.filter(row => row.personId === activeId), versions: { world: world.schemaVersion, engine: world.engineVersion, content: world.contentVersion }, birthRevision: initial.revision, finalRevision: world.revision, yearsAdvanced: years, commandsAttempted: trace.length, commandsCommitted: committedCommands, finalDate: world.date, ageAtEnd: age(), naturallyDied: !!player().died, milestones: statuses, everyRequestedMilestoneReached: professionalMilestones.every(stage => reached.has(stage)), observations, coldChecks, qualifications: player().education.qualifications, workHistory: ownHistory, homeObservations, portfolioObservations, parenthood: { children: childrenOf(world).map(child => ({ personId: child.id, born: child.born, parentType: relationFor(world, activeId, child.id)?.parentType })), pregnancies: world.pregnancies.filter(row => row.carrierId === activeId || row.otherParentId === activeId), adoptionReceipts: ownLedger.filter(row => row.category === 'adoption') }, studentLiabilities: world.liabilities.filter(row => row.ownerId === activeId && row.kind === 'student'), educationAndHomeReceipts: ownLedger.filter(row => ['tuition', 'borrowing', 'repayment', 'interest', 'upkeep', 'insurance', 'purchase'].includes(row.category)), investmentReceipts: ownLedger.filter(row => row.category === 'investment' || row.category === 'dividend'), inheritedReceipts: ownLedger.filter(row => row.category.startsWith('inherit')), pensionReceipts: player().finance.pensionReceipts, estate: world.estates.find(row => row.personId === activeId) ?? null } };
}
