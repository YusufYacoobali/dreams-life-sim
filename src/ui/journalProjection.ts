import { isImmutableWorld, type GameDate, type World } from '../game/model';
import { ageOn } from '../game/personHelpers';

type JournalEntry = World['journal'][number];
type DisplayFact = Readonly<Omit<JournalEntry, 'date'>> & { readonly date: Readonly<GameDate> };
export type JournalRow = { readonly entry: DisplayFact; readonly age: number; readonly startsYear: boolean };
export type JournalProjection = { readonly rows: readonly JournalRow[]; readonly birthIntroduction: boolean };
type Scope = { lifeId: string; personId: string; born: GameDate };

function sameEntry(a: JournalEntry, b: DisplayFact): boolean {
  return a === b || a.id === b.id && a.personId === b.personId && a.text === b.text && a.category === b.category &&
    a.date.year === b.date.year && a.date.month === b.date.month && a.date.day === b.date.day;
}

/** One mounted journal keeps one projection, never a saved World. Historical
 * ages depend on the person's birthday and each fact's date, not today's date.
 * Reuse rows on appends so FlatList's mounted facts need not render again. */
export function createJournalProjection() {
  let previous: { scope: string; journal: readonly JournalEntry[]; immutable: boolean; projection: JournalProjection } | undefined;
  return (journal: readonly JournalEntry[], { lifeId, personId, born }: Scope, world?: World): JournalProjection => {
    const scope = [lifeId, personId, born.year, born.month, born.day].join(':');
    if (previous?.scope === scope && previous.journal === journal && previous.immutable) return previous.projection;
    const prior = previous?.scope === scope ? previous.projection : undefined;
    let rows: JournalRow[] | undefined = prior ? undefined : [];
    let ownIndex = 0, previousAge: number | undefined, birthIdentity = false, birthOnly = true;
    // Only model certification grants this shortcut. Object.freeze(array) alone
    // says nothing about mutable facts/dates inside an imported UI preview.
    const immutable = !!world && world.journal === journal && isImmutableWorld(world);
    const person = { born, died: null };
    for (const entry of journal) {
      if (entry.personId !== personId) continue;
      const old = prior?.rows[ownIndex], same = !!old && sameEntry(entry, old.entry);
      const age = same ? old.age : ageOn(person, entry.date), startsYear = previousAge !== age;
      const row = same && old.startsYear === startsYear ? old : Object.freeze({
        // Component previews may use mutable worlds. Snapshot those facts so an
        // in-place edit cannot change the cached comparison or memoised props.
        entry: immutable ? entry : Object.freeze({ ...entry, date: Object.freeze({ ...entry.date }) }), age, startsYear,
      });
      if (!rows && row !== old) rows = prior!.rows.slice(0, ownIndex);
      rows?.push(row);
      previousAge = age; ownIndex++;
      birthIdentity ||= entry.id === 'journal_birth_identity';
      birthOnly &&= entry.category === 'birth';
    }
    const resultRows = rows ? Object.freeze(rows) : ownIndex === prior!.rows.length ? prior!.rows : Object.freeze(prior!.rows.slice(0, ownIndex));
    const birthIntroduction = birthIdentity && birthOnly;
    const projection = prior?.rows === resultRows && prior.birthIntroduction === birthIntroduction ? prior : { rows: resultRows, birthIntroduction };
    previous = { scope, journal, immutable, projection };
    return projection;
  };
}
