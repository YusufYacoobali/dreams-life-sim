import { createJournalProjection } from '../../src/ui/journalProjection';
import { ageOn, immutableWorld, type World } from '../../src/game/model';
import { createLife, randomCreation } from '../../src/game/createLife';

type Entry = World['journal'][number];
const born = { year: 2000, month: 2, day: 29 };
const scope = { lifeId: 'life_journal', personId: 'person_player', born };
const fact = (id: string, year: number, personId = scope.personId): Entry => ({ id, personId, date: { year, month: 3, day: 1 }, text: 'Recorded ' + id, category: 'life' });
function frozen(entries: Entry[]): readonly Entry[] {
  for (const entry of entries) { Object.freeze(entry.date); Object.freeze(entry); }
  return Object.freeze(entries);
}

test('all facts from birth to old age remain in chronological source order without a display limit', () => {
  const project = createJournalProjection(), entries: Entry[] = [];
  for (let age = 0; age <= 100; age++) for (let index = 0; index < 70; index++) entries.push(fact('fact_' + age + '_' + index, 2000 + age));
  entries.splice(200, 0, fact('another_person', 2003, 'person_parent1'));
  const projection = project(frozen(entries), scope);
  expect(projection.rows).toHaveLength(7070);
  expect(projection.rows[0].entry.id).toBe('fact_0_0'); expect(projection.rows.at(-1)!.entry.id).toBe('fact_100_69');
  expect(projection.rows.map(row => row.entry)).toEqual(entries.filter(entry => entry.personId === scope.personId));
  let previousAge: number | undefined;
  for (const row of projection.rows) {
    expect(row.age).toBe(ageOn({ born, died: null }, row.entry.date));
    expect(row.startsYear).toBe(row.age !== previousAge); previousAge = row.age;
  }
});

test('immutable journal identity and equal cold-loaded facts retain projection and append reuses every older row', () => {
  const project = createJournalProjection(), entries = frozen([fact('first', 2000), fact('second', 2001)]);
  const first = project(entries, scope);
  expect(project(entries, scope)).toBe(first);
  const cold = frozen(JSON.parse(JSON.stringify(entries)));
  expect(project(cold, scope)).toBe(first);
  const appended = project(frozen([...cold, fact('third', 2001), fact('fourth', 2002)]), scope);
  expect(appended.rows).toHaveLength(4); expect(first.rows).toHaveLength(2);
  expect(appended.rows[0]).toBe(first.rows[0]); expect(appended.rows[1]).toBe(first.rows[1]);
  expect(appended.rows[2].startsYear).toBe(false); expect(appended.rows[3].startsYear).toBe(true);
});

test('same-length edits, changed dates and in-place mutable previews invalidate only the affected facts/headings', () => {
  const project = createJournalProjection(), entries = [fact('first', 2000), fact('second', 2001), fact('third', 2001)];
  const first = project(entries, scope);
  entries[0].text = 'Edited saved wording';
  const changed = project(entries, scope);
  expect(changed.rows[0]).not.toBe(first.rows[0]); expect(first.rows[0].entry.text).toBe('Recorded first');
  expect(changed.rows[1]).toBe(first.rows[1]);
  entries[1].date.year = 2000;
  const dated = project(entries, scope);
  expect(dated.rows[1].startsYear).toBe(false); expect(dated.rows[2].startsYear).toBe(true);
  expect(dated.rows[0]).toBe(changed.rows[0]);
  entries[2].personId = 'person_parent1';
  expect(project(entries, scope).rows.map(row => row.entry.id)).toEqual(['first', 'second']);
});

test('a frozen array containing mutable facts cannot hide edited content or dates', () => {
  const project = createJournalProjection(), entry = fact('first', 2000), entries = Object.freeze([entry]);
  const first = project(entries, scope); entry.text = 'Changed'; entry.date.year = 2001;
  const next = project(entries, scope);
  expect(next.rows[0].entry.text).toBe('Changed'); expect(next.rows[0].age).toBe(first.rows[0].age + 1);
});

test('only a model-certified world grants the immutable shortcut; shallow-frozen previews remain editable', () => {
  const project = createJournalProjection();
  const preview = createLife('life_journal_certificate', 42, randomCreation(42), { year: 2000, month: 10, day: 24 });
  const context = { lifeId: preview.id, personId: preview.activePersonId, born: preview.people[preview.activePersonId].born };
  Object.freeze(preview);
  const first = project(preview.journal, context, preview), recorded = first.rows[0].entry.text;
  preview.journal[0].text = 'Changed a mutable preview inside a frozen envelope.';
  const edited = project(preview.journal, context, preview);
  expect(edited.rows[0].entry.text).toBe(preview.journal[0].text);
  expect(first.rows[0].entry.text).toBe(recorded);
  const certified = immutableWorld(preview), current = project(certified.journal, context, certified);
  expect(project(certified.journal, context, certified)).toBe(current);
  expect(Object.isFrozen(current.rows[0].entry.date)).toBe(true);
});

test('scope changes, restored shorter histories, birth records and leap-day birthdays remain exact', () => {
  const project = createJournalProjection();
  const entries = frozen([{ ...fact('journal_birth_identity', 2000), category: 'birth' }, { ...fact('second', 2000), category: 'birth' }]);
  const first = project(entries, scope); expect(first.birthIntroduction).toBe(true);
  const older = project(frozen([...entries, fact('third', 2001)]), scope); expect(older.birthIntroduction).toBe(false);
  expect(project(entries, scope).rows).toHaveLength(2);
  const otherLife = project(entries, { ...scope, lifeId: 'life_restored' }); expect(otherLife.rows[0]).not.toBe(first.rows[0]);
  const otherPerson = project(entries, { ...scope, personId: 'person_parent1' }); expect(otherPerson.rows).toEqual([]);
  const differentBirthday = project(entries, { ...scope, born: { ...born, day: 27 } }); expect(differentBirthday.rows[0].age).toBe(0);
  expect(first.rows[0].age).toBe(0);
  const leap = project(frozen([{ ...fact('leap', 2001), date: { year: 2001, month: 2, day: 28 } }]), scope);
  expect(leap.rows[0].age).toBe(1);
});
