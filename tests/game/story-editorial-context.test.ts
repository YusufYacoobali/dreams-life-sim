import { bindEvent, eligibleTemplates, eventTemplates } from '../../src/game/content/events';
import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { decodeSave } from '../../src/persistence/archive';
import { addCondition, emergencyCare, hospitalized } from '../../src/game/systems/health';
import { activeTrip } from '../../src/game/systems/travelSchemas';
import { tripQuote } from '../../src/game/systems/travel';
import { serviceAway, serviceQualified } from '../../src/game/systems/serviceSchemas';
import { pupil } from '../support/pupil';
import { adultSocial } from '../support/adultSocial';
import graduate from '../fixtures/v3-employed-graduate.json';
import serviceArchive from '../fixtures/v16-service-archive.json';
import studying from '../fixtures/v24-university-loan-archive.json';
import { storyOption, type EventTemplate } from '../../src/game/content/eventTypes';
import { studyStoryContext } from '../../src/game/systems/studyStoryContext';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { offerPending } from '../../src/game/pendingQueue';
import { startStudy, pausedStudy } from '../support/studyStory';
import { retiredLife, widowedLife } from '../support/laterLifeStory';
import { laterLifeStoryContext } from '../../src/game/systems/laterLifeStoryContext';
import { fullName } from '../../src/game/personHelpers';
import { otherPerson, partnerRelation } from '../../src/game/systems/relationshipQueries';
import { divorceQuote } from '../../src/game/systems/family';
import marriage from '../fixtures/v5-marriage-result.json';

const publicScenes = ['library-card', 'community-garden', 'local-meeting', 'familiar-street', 'toddler-caterpillar-crossing', 'rest-guilt'];
const template = (id: string) => eventTemplates.find(item => item.id === id)!;
function admit(world: World) {
  const person = world.people[world.activePersonId], condition = addCondition(world, person, 'asthma', 80);
  // Production urgent care creates the bill, provider, treatment and real stay.
  // No hospital/date/funds/RNG flag is substituted for that action.
  emergencyCare(world, person.id, condition.id, true);
  expect(hospitalized(world, person)).toBe(true);
  expect(person.health.records.at(-1)?.kind).toBe('hospital');
  expect(person.health.records.at(-1)?.cost).toBeGreaterThan(0n);
  return validateWorld(world);
}
function checkUnavailable(world: World, id: string) {
  const before = encodeWorld(world);
  expect(eligibleTemplates(world)).not.toContainEqual(template(id));
  expect(() => bindEvent(world, template(id))).toThrow(/existing available life context/);
  expect(encodeWorld(world)).toBe(before);
}
function acknowledge(world: World) {
  if (world.pending?.kind !== 'result') throw new Error('Expected saved result');
  return resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id });
}
function finish(world: World) {
  let guard = 0;
  while (world.pending || world.annual) {
    if (++guard > 30) throw new Error('Year did not finish');
    world = resolveCommand(world, world.pending?.kind === 'decision' ? { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices[0].id } : world.pending ? { type: 'acknowledge', resultId: world.pending.id } : { type: 'resume' });
  }
  return world;
}

test('actual paid adult hospital care excludes public outings while online and reflective scenes remain available', () => {
  const initial = decodeWorld(JSON.stringify(graduate));
  expect(eligibleTemplates(initial)).toContainEqual(template('community-garden'));
  const world = admit(initial);
  for (const id of publicScenes) checkUnavailable(world, id);
  const before = encodeWorld(world);
  for (const id of ['bad-review', 'old-photo']) {
    expect(eligibleTemplates(world)).toContainEqual(template(id));
    expect(bindEvent(world, template(id)).templateId).toBe(id);
  }
  expect(encodeWorld(world)).toBe(before);
});

test.each([
  [3, 'toddler-caterpillar-crossing', 'toddler-shadow-race'],
  [6, 'library-card', 'child-first-loose-tooth'],
] as const)('age%i caregiver-funded hospital care excludes the public scene but keeps a suitable indoor one', (age, outsideId, indoorId) => {
  const initial = pupil('US', age);
  expect(eligibleTemplates(initial)).toContainEqual(template(outsideId));
  const world = admit(initial), person = world.people[world.activePersonId], receipt = person.health.records.at(-1)!;
  expect(receipt.payerId).not.toBe(person.id);
  checkUnavailable(world, outsideId);
  const before = encodeWorld(world);
  expect(eligibleTemplates(world)).toContainEqual(template(indoorId));
  expect(bindEvent(world, template(indoorId)).personIds).toEqual([person.id]);
  expect(encodeWorld(world)).toBe(before);
});

test('a real booked foreign trip cannot bind an old home-city public scene', () => {
  const initial = decodeWorld(JSON.stringify(graduate));
  const world = resolveCommand(initial, { type: 'book-trip', destinationId: 'paris', duration: 1, companionIds: [], focus: 'sightseeing', quotedTotal: tripQuote(initial, 'paris', 1).total });
  expect(activeTrip(world)?.destinationId).toBe('paris');
  checkUnavailable(world, 'community-garden');
  expect(eligibleTemplates(world)).toContainEqual(template('bad-review'));
});

test('a real assignment after the immutable service year excludes home-city public scenes without erasing reflective choices', () => {
  const ready = finish(decodeSave(JSON.stringify(serviceArchive)).world), career = ready.serviceCareers[0];
  expect(serviceQualified(career)).toBe(true);
  const world = resolveCommand(ready, { type: 'start-assignment', serviceId: career.id, kind: 'disaster-relief' });
  expect(serviceAway(world)?.kind).toBe('disaster-relief');
  checkUnavailable(world, 'community-garden');
  checkUnavailable(world, 'local-meeting');
  expect(eligibleTemplates(world)).toContainEqual(template('bad-review'));
});

test('hospital care at the genuine saved month-twelve boundary resumes the same year with a compatible saved scene', () => {
  const original = decodeSave(JSON.stringify(serviceArchive)).world;
  const boundary = acknowledge(original);
  expect(boundary.annual).toMatchObject({ monthsProcessed: 12, stage: 'months', pausedForPlanning: true });
  const admitted = admit(boundary), target = admitted.annual!.targetDate;
  const resumed = resolveCommand(admitted, { type: 'resume' });
  expect(resumed.date).toEqual(target);
  expect(resumed.annual).toMatchObject({ monthsProcessed: 12, stage: 'complete' });
  expect(hospitalized(resumed, resumed.people[resumed.activePersonId])).toBe(true);
  if (resumed.pending?.kind === 'decision') expect(publicScenes).not.toContain(resumed.pending.templateId);
  const restored = decodeWorld(encodeWorld(resumed));
  expect(restored.pending).toEqual(resumed.pending);
  expect(restored.random).toEqual(resumed.random);
  const done = finish(restored);
  expect(done.date).toEqual(target);
  expect(done.annual).toBeNull();
  expect(done.people[done.activePersonId].health.records).toEqual(resumed.people[resumed.activePersonId].health.records);
});

test('a previously bound copy survives decoding and resolution without being replaced by the corrected template', () => {
  const { world } = adultSocial(), event = bindEvent(world, template('friend-different-budget'));
  // Representative already-bound content8 text; this is not a regenerated fixture.
  const oldResult = 'You take a short walk without buying anything. The conversation is not noticeably less expensive.';
  event.choices[0].resultBody = oldResult;
  world.pending = event;
  const before = encodeWorld(world), restored = decodeWorld(before);
  expect(encodeWorld(restored)).toBe(before);
  expect(restored.pending).toEqual(event);
  const result = resolveCommand(restored, { type: 'choose', eventId: event.id, choiceId: 'walk' });
  expect(result.pending).toMatchObject({ kind: 'result', body: oldResult });
  expect(result.accounts).toEqual(world.accounts);
  expect(result.ledger).toEqual(world.ledger);
  expect(result.random).toEqual(world.random);
});

test('an already-bound mixed scene keeps its stored choices after actual hospital admission', () => {
  const initial = decodeWorld(JSON.stringify(graduate)), event = bindEvent(initial, template('rest-guilt'));
  initial.pending = event;
  const admitted = admit(initial);
  // The availability correction changes future selection only. A bound decision
  // remains data, rather than being looked up or restricted by its current template.
  checkUnavailable(admitted, 'rest-guilt');
  const before = encodeWorld(admitted), restored = decodeWorld(before);
  expect(encodeWorld(restored)).toBe(before);
  expect(restored.pending).toEqual(event);
  const choice = event.choices.find(item => item.id === 'walk')!;
  const result = resolveCommand(restored, { type: 'choose', eventId: event.id, choiceId: choice.id });
  expect(result.pending).toMatchObject({ kind: 'result', body: choice.resultBody });
  expect(result.people[result.activePersonId].health).toEqual(admitted.people[admitted.activePersonId].health);
  expect(result.ledger).toEqual(admitted.ledger);
  expect(result.random).toEqual(admitted.random);
});

// Prospective binding probes, not authored catalogue additions or natural encounters.
const studyProbe = (state: 'active' | 'paused'): EventTemplate => ({
  id: 'study-context-probe-' + state, min: 18, max: 120, study: state, illustration: 'education',
  title: '{studySchool}: {studyField}', body: 'Your {studyField} course at {studySchool}.',
  choices: [
    storyOption('plan', 'Think about {studyField}', { stress: -1 }, 'Your course', '{studySchool} remains {studySchool}.', 'I thought about my {studyField} course at {studySchool}.'),
    storyOption('worry', 'Worry about {studyField}', { stress: 1 }, 'Your course', 'You worry about {studyField}.', 'I worried about my {studyField} course.'),
  ],
});

test.each(['trade', 'university', 'graduate'] as const)('a real paid %s enrolment supplies literal course facts before its first attended month, read-only', program => {
  const world = startStudy(program), person = world.people[world.activePersonId], before = encodeWorld(world);
  expect(person.education.months).toBe(0);
  expect(world.studyCourses).toHaveLength(1);
  expect(world.studyCourses[0]).toMatchObject({ origin: 'enrolment', status: 'active', months: 0, tuitionPaidMonths: 12 });
  expect(world.studyCourses[0].firstPayment?.billed).toBeGreaterThan(0n);
  const context = studyStoryContext(world), bound = bindEvent(world, studyProbe('active'));
  expect(context).toEqual({ courseId: world.studyCourses[0].id, school: person.education.school, field: person.education.field, state: 'active' });
  expect(bound.title).toBe(person.education.school + ': ' + person.education.field);
  expect(bound.personIds).toEqual([person.id]);
  expect(bound.choices[0].effects).toEqual([{ kind: 'stat', personId: person.id, stat: 'stress', delta: -1 }]);
  expect(() => bindEvent(world, studyProbe('paused'))).toThrow(/recorded current study context/);
  expect(encodeWorld(world)).toBe(before);
});

test('real unpaid graduate tuition produces only paused context; normal funding resumes the same recorded course', () => {
  const world = pausedStudy(), person = world.people[world.activePersonId], before = encodeWorld(world), courseId = world.studyCourses[0].id;
  expect(person.education).toMatchObject({ stage: 'graduate', field: 'medicine', paused: true, months: 12, tuitionPaidMonths: 12 });
  expect(world.journal.some(item => item.text.includes('paused') && item.text.includes('tuition'))).toBe(true);
  expect(studyStoryContext(world)?.state).toBe('paused');
  expect(bindEvent(world, studyProbe('paused')).body).toBe('Your medicine course at ' + person.education.school + '.');
  expect(() => bindEvent(world, studyProbe('active'))).toThrow(/recorded current study context/);
  expect(encodeWorld(world)).toBe(before);
  const resumed = acknowledge(resolveCommand(world, { type: 'fund-studies', funding: 'loan' }, true));
  expect(studyStoryContext(resumed)).toMatchObject({ courseId, state: 'active' });
  expect(resumed.people[person.id].education.months).toBe(12);
  expect(resumed.studyCourses[0].firstPayment).toEqual(world.studyCourses[0].firstPayment);
  expect(resumed.ledger.slice(0, world.ledger.length)).toEqual(world.ledger);
});

test('prospective study guards reject old unrecorded slots and mismatched predicate inputs without inventing their course evidence', () => {
  expect(studyStoryContext(unpackCheckpoint(studying.checkpoint))).toBeUndefined();
  const original = startStudy(), before = encodeWorld(original);
  // These are isolated unvalidated predicate traps, not complete saves or natural outcomes.
  const corruptions: ((value: World) => void)[] = [
    value => { value.studyCourses = []; },
    value => { value.studyCourses.push({ ...value.studyCourses[0], id: 'duplicate-study' }); },
    value => { value.studyCourses[0].personId = 'someone-else'; },
    value => { value.studyCourses[0].origin = 'legacy-current'; },
    value => { value.studyCourses[0].started = null; },
    value => { value.studyCourses[0].firstPayment = null; },
    value => { value.studyCourses[0].ended = { ...value.date }; },
    value => { value.studyCourses[0].field = 'arts'; },
    value => { value.studyCourses[0].school += ' elsewhere'; },
    value => { value.studyCourses[0].city = 'Boston'; },
    value => { value.studyCourses[0].country = 'CA'; },
    value => { value.studyCourses[0].currency = 'CAD'; },
    value => { value.studyCourses[0].months++; },
    value => { value.studyCourses[0].tuitionPaidMonths += 12; },
    value => { value.studyCourses[0].funding = 'cash'; },
    value => { value.studyCourses[0].grades--; },
    value => { value.studyCourses[0].annualTuition++; },
    value => { value.people[value.activePersonId].education.paused = true; },
    value => { value.people[value.activePersonId].legal.wanted = true; },
  ];
  for (const corrupt of corruptions) {
    const world = copyWorld(original); corrupt(world);
    const bytes = () => JSON.stringify(world, (_key, value) => typeof value === 'bigint' ? value.toString() : value);
    const unchanged = bytes();
    expect(studyStoryContext(world)).toBeUndefined();
    expect(() => bindEvent(world, studyProbe('active'))).toThrow(/recorded current study context/);
    expect(bytes()).toBe(unchanged);
  }
  expect(studyStoryContext(admit(copyWorld(original)))).toBeUndefined();
  expect(encodeWorld(original)).toBe(before);
});

test('all original 270 unflagged scenes keep eligibility and complete binding independent of the new course evidence', () => {
  const world = startStudy(), legacySlot = copyWorld(world), originalIds = new Set(eventTemplates.slice(0, 270).map(item => item.id));
  legacySlot.studyCourses = []; // Same current slot as an older save; no reconstructed enrolment.
  expect(eventTemplates.slice(0, 270).every(item => item.study === undefined)).toBe(true);
  const oldEligible = (value: World) => eligibleTemplates(value).filter(item => originalIds.has(item.id));
  const expected = oldEligible(legacySlot), before = encodeWorld(world);
  expect(oldEligible(world)).toEqual(expected);
  expect(expected.map(item => bindEvent(world, item))).toEqual(expected.map(item => bindEvent(legacySlot, item)));
  const unflagged = { ...studyProbe('active'), study: undefined };
  expect(bindEvent(world, unflagged).title).toBe('{studySchool}: {studyField}');
  expect(encodeWorld(world)).toBe(before);
});

test('already bound study copy survives real withdrawal, exact checkpoint restore and normal choice without prospective revalidation', () => {
  const world = startStudy(), bound = bindEvent(world, studyProbe('active'));
  const left = copyWorld(acknowledge(resolveCommand(world, { type: 'leave-school' }, true)));
  expect(studyStoryContext(left)).toBeUndefined();
  offerPending(left, bound); // Explicitly retain previously bound literal data, not a natural encounter.
  const restored = unpackCheckpoint(packCheckpoint(left), true);
  expect(restored).toEqual(left);
  const result = resolveCommand(restored, { type: 'choose', eventId: bound.id, choiceId: bound.choices[0].id }, true);
  expect(result.pending).toMatchObject({ kind: 'result', body: bound.choices[0].resultBody });
  expect(result.people[result.activePersonId].education).toEqual(left.people[left.activePersonId].education);
  for (const key of ['studyCourses', 'universityApplications', 'accounts', 'liabilities', 'ledger', 'random'] as const) expect(result[key]).toEqual(left[key]);
});

const laterProbe = (kind: 'retired' | 'widowed'): EventTemplate => ({
  id: 'later-context-probe-' + kind, min: 18, max: 120, [kind]: true, illustration: 'journal',
  title: 'Recorded circumstances', body: kind === 'widowed' ? '{lateSpouse}. {lateSpouse}.' : 'An earned pension.',
  choices: [
    storyOption('reflect', 'Take a moment', { stress: -1 }, 'A moment', 'You take a moment.', 'I took a moment.'),
    storyOption('worry', 'Keep worrying', { stress: 1 }, 'A worry', 'You keep worrying.', 'I kept worrying.'),
  ],
});

test('recorded paid work and actual pension receipts supply retirement context without treating age, another person or unpaid rights as evidence', () => {
  const world = retiredLife(), person = world.people[world.activePersonId], before = encodeWorld(world);
  expect(person.finance.serviceMonths).toBe(588);
  expect(person.finance.pensionReceipts).toHaveLength(12);
  expect(world.workHistory.some(item => item.personId === person.id && item.ended && item.grossEarned > 0n)).toBe(true);
  expect(laterLifeStoryContext(world)).toMatchObject({ retired: true });
  expect(bindEvent(world, laterProbe('retired')).personIds).toEqual([person.id]);
  expect(laterLifeStoryContext(decodeSave(JSON.stringify(serviceArchive)).world)?.retired).toBe(false);
  // Isolated predicate inputs, not validated saves or claimed gameplay transitions.
  const traps: ((value: World) => void)[] = [
    value => { value.people[person.id].finance.pensionReceipts = []; },
    value => { value.people[person.id].finance.pensionAnnual = 0n; },
    value => { value.people[person.id].finance.serviceMonths = 119; },
    value => { value.people[person.id].finance.lifetimeGross = 0n; },
    value => { value.workHistory = value.workHistory.filter(item => item.personId !== person.id); },
    value => { for (const item of value.workHistory) if (item.personId === person.id) item.ended = null; },
    value => { value.people[person.id].employment = decodeWorld(JSON.stringify(graduate)).people.person_player.employment; },
    value => { value.people[person.id].education.stage = 'trade'; },
  ];
  for (const corrupt of traps) {
    const invalid = copyWorld(world); corrupt(invalid);
    expect(laterLifeStoryContext(invalid)?.retired).toBe(false);
    expect(() => bindEvent(invalid, laterProbe('retired'))).toThrow(/recorded current later-life context/);
  }
  expect(laterLifeStoryContext(admit(copyWorld(world)))).toBeUndefined();
  expect(encodeWorld(world)).toBe(before);
});

test('a production death on a genuine marriage binds only the actual late spouse, without fabricating a person, scene memory or bond effect', () => {
  const world = widowedLife(), context = laterLifeStoryContext(world), spouse = context!.lateSpouse!, before = encodeWorld(world);
  expect(world.pending).toBeNull(); expect(world.deferred).toEqual([]);
  expect(spouse.died).toEqual(world.date);
  expect(world.marriages.find(item => item.a === spouse.id || item.b === spouse.id)).toMatchObject({ ended: spouse.died, endReason: 'death' });
  const bound = bindEvent(world, laterProbe('widowed'));
  expect(bound.body).toBe(fullName(spouse) + '. ' + fullName(spouse) + '.');
  expect(bound.personIds).toEqual([world.activePersonId, spouse.id]);
  expect(bound.choices.every(choice => choice.effects.every(effect => effect.kind === 'stat' && effect.personId === world.activePersonId))).toBe(true);
  expect(bindEvent(world, { ...laterProbe('widowed'), widowed: undefined }).body).toBe('{lateSpouse}. {lateSpouse}.');
  expect(encodeWorld(world)).toBe(before);
});

test('a real divorce then former-spouse death is not widowhood, and current, ambiguous or mismatched relationships cannot supply a late spouse', () => {
  let divorced = acknowledge(decodeWorld(JSON.stringify(marriage)));
  const spouse = otherPerson(divorced, partnerRelation(divorced)!);
  expect(laterLifeStoryContext(divorced)?.lateSpouse).toBeUndefined();
  divorced = acknowledge(resolveCommand(divorced, { type: 'divorce', personId: spouse.id, custody: 'shared', quotedPayment: divorceQuote(divorced, spouse.id).signed }));
  recordDeath(divorced, spouse.id, 'Explicit divorced-person story mortality boundary');
  validateWorld(divorced);
  expect(laterLifeStoryContext(divorced)?.lateSpouse).toBeUndefined();
  const world = widowedLife(), late = laterLifeStoryContext(world)!.lateSpouse!;
  // Unvalidated association/date ambiguity traps, not invented positive marriages.
  const traps: ((value: World) => void)[] = [
    value => { value.people[late.id].died = null; },
    value => { value.marriages.at(-1)!.endReason = 'divorce'; },
    value => { value.people[late.id].died = { ...value.date, day: value.date.day === 1 ? 2 : 1 }; },
    value => { value.relationships.find(item => item.romance === 'widowed')!.romance = 'dating'; },
    value => { value.marriages.push({ ...value.marriages.at(-1)!, id: 'ambiguous-latest-marriage' }); },
    value => { value.marriages.push({ ...value.marriages.at(-1)!, id: 'later-divorce', started: { ...value.date, day: value.date.day + 1 }, endReason: 'divorce' }); },
  ];
  for (const corrupt of traps) {
    const invalid = copyWorld(world); corrupt(invalid);
    expect(laterLifeStoryContext(invalid)?.lateSpouse).toBeUndefined();
    expect(() => bindEvent(invalid, laterProbe('widowed'))).toThrow(/recorded current later-life context/);
  }
});

test('the original 272 scenes retain eligibility and all available literal bindings without the new retirement or marriage facts', () => {
  const originalIds = new Set(eventTemplates.slice(0, 272).map(item => item.id));
  expect(eventTemplates.slice(0, 272).every(item => !item.retired && !item.widowed)).toBe(true);
  for (const world of [retiredLife(), widowedLife()]) {
    const withoutFacts = copyWorld(world), before = encodeWorld(world);
    withoutFacts.people[world.activePersonId].finance.pensionAnnual = 0n;
    withoutFacts.marriages = [];
    const oldEligible = (value: World) => eligibleTemplates(value).filter(item => originalIds.has(item.id));
    const expected = oldEligible(withoutFacts);
    expect(oldEligible(world)).toEqual(expected);
    expect(expected.map(item => bindEvent(world, item))).toEqual(expected.map(item => bindEvent(withoutFacts, item)));
    expect(encodeWorld(world)).toBe(before);
  }
});

test('previously bound retired copy remains exact through real hospital admission, production checkpoint restore and ordinary choice', () => {
  const world = retiredLife(), bound = bindEvent(world, laterProbe('retired'));
  const admitted = admit(world);
  expect(laterLifeStoryContext(admitted)).toBeUndefined();
  offerPending(admitted, bound); // Explicit retained binding, not a naturally selected encounter.
  const restored = unpackCheckpoint(packCheckpoint(admitted), true);
  expect(restored).toEqual(admitted);
  const result = resolveCommand(restored, { type: 'choose', eventId: bound.id, choiceId: 'reflect' }, true);
  expect(result.pending).toMatchObject({ kind: 'result', body: bound.choices[0].resultBody });
  for (const key of ['people', 'workHistory', 'accounts', 'liabilities', 'ledger', 'random', 'marriages'] as const) {
    if (key === 'people') expect(result.people[result.activePersonId].finance).toEqual(admitted.people[admitted.activePersonId].finance);
    else expect(result[key]).toEqual(admitted[key]);
  }
});
