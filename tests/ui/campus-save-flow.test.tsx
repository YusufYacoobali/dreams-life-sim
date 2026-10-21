import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { router } from 'expo-router';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld, fullName } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { currentCampus } from '../../src/game/systems/campus';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { EventModal } from '../../src/ui/EventModal';
import { startStudy } from '../support/studyStory';
import oldArchive from '../fixtures/v30-native-workplace-story-archive.json';

let mockStore: ReturnType<typeof createGameStore>, mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, useLocalSearchParams: () => mockParams }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Campus from '../../app/(game)/campus';
import Person from '../../app/(game)/person/[id]';

const world = () => mockStore.getState().world!;
const frame = (child: React.ReactNode = <Campus />) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
async function command(value: GameCommand) { await act(async () => { expect(await mockStore.getState().dispatch(value)).toBe(true); }); }
async function finishYear() {
  let guard = 0;
  while (world().pending || world().annual) {
    if (++guard > 150) throw new Error('The ordinary paid study year did not finish');
    const pending = world().pending;
    if (pending?.kind === 'decision') {
      const choice = pending.choices.find(item => !choiceUnavailable(world(), item));
      if (!choice) throw new Error('No visible available continuation choice');
      await command({ type: 'choose', eventId: pending.id, choiceId: choice.id });
    } else await command(pending ? { type: 'acknowledge', resultId: pending.id } : { type: 'resume' });
  }
}

async function setup() {
  // Unchanged historical v3 graduate, normal resignation, one actual Arts
  // admission and real loan-funded tuition. This is not a natural birth-to-
  // qualification journey; no cash, stats, date or RNG are substituted.
  const initial = startStudy('university'), directory = mkdtempSync(join(tmpdir(), 'dreams-campus-')), path = join(directory, 'life.db');
  let sqlite!: DatabaseSync, repository: SaveRepository, nextYield: Promise<void> | undefined;
  const connect = (): SqlDatabase => {
    const connection = sqlite = new DatabaseSync(path); connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = {
      run: async (sql, values = []) => { connection.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => { connection.exec('BEGIN IMMEDIATE'); try { const result = await action(session); connection.exec('COMMIT'); return result; } catch (error) { connection.exec('ROLLBACK'); throw error; } } };
  };
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])) as Record<string, Record<string, unknown>[]>;
  const bootstrap = async () => {
    mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused', yieldToUI: async () => { const held = nextYield; nextYield = undefined; if (held) await held; } });
    expect(await mockStore.getState().bootstrap()).toBe(true);
  };
  repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(oldArchive));
  const oldRows = rows(); await repository.create(initial); await bootstrap();
  return { initial, get sqlite() { return sqlite; }, get repository() { return repository; }, rows,
    pause: () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; },
    cold: async () => { sqlite.close(); repository = new SaveRepository(connect()); await repository.initialise(); await bootstrap(); },
    original: () => { const now = rows(); for (const table of ['lives', 'backups', 'receipts', 'snapshots', 'snapshot_metadata', 'branches', 'restore_receipts']) for (const row of oldRows[table]) expect(now[table]).toContainEqual(row); },
    close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); },
  };
}

test('a genuine paid course earns campus access through attendance, retains a failed introduction and club draft, and cold-reopens exactly the same paid classmates', async () => {
  const context = await setup(); let view: ReturnType<typeof render> | undefined;
  try {
    const enrolled = world().studyCourses.find(item => item.personId === world().activePersonId && item.status === 'active')!;
    expect(enrolled.origin).toBe('enrolment'); expect(enrolled.months).toBe(0);
    expect(enrolled.firstPayment!.billed).toBeGreaterThan(0n);
    expect(world().ledger.find(row => row.id === enrolled.firstPayment!.transactionId)).toMatchObject({ category: 'tuition', cashDelta: -enrolled.firstPayment!.billed });
    await command({ type: 'advance' }); await finishYear();
    const before = world(), course = before.studyCourses.find(item => item.id === enrolled.id)!;
    expect(course.status).toBe('active'); expect(course.months).toBeGreaterThan(0);
    expect(course.months).toBe(before.people[before.activePersonId].education.months);
    expect(course.firstPayment).toEqual(enrolled.firstPayment); expect(currentCampus(before)).toBeUndefined();
    const beforeText = encodeWorld(before), beforeRows = context.rows(); expect(Object.keys(beforeRows)).toHaveLength(8);
    view = render(frame());
    const commit = jest.spyOn(context.repository, 'commit'), dispatch = jest.spyOn(mockStore.getState(), 'dispatch');
    const review = () => screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.kind === 'confirmation')!.props.event;
    await press('Meet Fellow Students'); expect(screen.getByText('Meet fellow students?')).toBeOnTheScreen();
    await press('Never mind'); expect(world()).toBe(before); expect(context.rows()).toEqual(beforeRows); expect(commit).not.toHaveBeenCalled();
    await press('Meet Fellow Students'); const terms = review();
    context.sqlite.exec("CREATE TRIGGER fail_campus BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Meet Students'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(screen.getAllByRole('alert')).toHaveLength(1); expect(review()).toEqual(terms);
    expect(world()).toBe(before); expect(encodeWorld(world())).toBe(beforeText); expect(context.rows()).toEqual(beforeRows);
    context.sqlite.exec('DROP TRIGGER fail_campus'); const release = context.pause(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    const meet = { type: 'meet-campus' as const, courseId: course.id }, expected = resolveCommand(before, meet, true);
    const submit = screen.getByRole('button', { name: 'Meet Students' });
    act(() => { fireEvent.press(submit); fireEvent.press(submit); });
    expect(mockStore.getState().busy).toBe(true); expect(screen.getByRole('button', { name: 'Meet Students' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled();
    fireEvent(screen.UNSAFE_getByType(Modal), 'requestClose'); expect(review()).toEqual(terms);
    expect(world()).toBe(before); expect(context.rows()).toEqual(beforeRows); expect(dispatch).toHaveBeenCalledTimes(2);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false));
    expect(world()).toEqual(expected); expect(commit).toHaveBeenCalledTimes(2); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const introduced = world(), campus = currentCampus(introduced)!;
    expect(campus.courseId).toBe(course.id); expect(campus.students).toHaveLength(2);
    expect(new Set(campus.students.map(item => item.personId)).size).toBe(2);
    for (const student of campus.students) {
      expect(before.people[student.personId]).toBeUndefined();
      const peerCourse = introduced.studyCourses.find(item => item.id === student.courseId)!;
      expect(peerCourse).toMatchObject({ personId: student.personId, origin: 'enrolment', status: 'active', months: 0, started: introduced.date });
      expect(peerCourse.firstPayment!.billed).toBeGreaterThan(0n);
      expect(introduced.ledger.find(row => row.id === peerCourse.firstPayment!.transactionId)).toMatchObject({ personId: student.personId, category: 'tuition', currency: peerCourse.currency, cashDelta: -peerCourse.firstPayment!.billed });
    }
    for (const [id, person] of Object.entries(before.people)) expect(introduced.people[id]).toEqual(person);
    expect(introduced.ledger.slice(0, before.ledger.length)).toEqual(before.ledger);
    expect(introduced.studyCourses.find(item => item.id === course.id)).toEqual(course);
    const introducedRows = context.rows(); expect(introducedRows.receipts).toHaveLength(beforeRows.receipts.length + 1);
    expect(context.sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(before.id)?.payload).toBe(beforeRows.lives.find(row => row.id === before.id)!.payload);
    context.original(); view.unmount(); view = undefined; commit.mockRestore(); dispatch.mockRestore();

    await context.cold(); expect(world()).toEqual(introduced); expect(context.rows()).toEqual(introducedRows); view = render(frame());
    expect(world().pending?.kind).toBe('result'); const resultId = world().pending!.id;
    await press('Continue'); const acknowledged = world(), acknowledgedRows = context.rows();
    expect(acknowledged.revision).toBe(introduced.revision + 1); expect(currentCampus(acknowledged)).toEqual(campus);
    expect(acknowledged.people).toEqual(introduced.people); expect(acknowledged.random).toEqual(introduced.random);
    await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId })).toBe(false); });
    expect(context.rows()).toEqual(acknowledgedRows); expect(world()).toBe(acknowledged); act(() => { mockStore.getState().clearError(); });
    const peer = acknowledged.people[campus.students[0].personId], browseRows = context.rows(), browseCommit = jest.spyOn(context.repository, 'commit');
    await act(async () => { fireEvent.press(screen.getByText(fullName(peer))); });
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/person/[id]', params: { id: peer.id, tab: 'activities' } });
    mockParams = { id: peer.id, tab: 'activities' }; view.rerender(frame(<Person />));
    expect(screen.getByText(fullName(peer))).toBeOnTheScreen(); expect(world()).toBe(acknowledged); expect(context.rows()).toEqual(browseRows); expect(browseCommit).not.toHaveBeenCalled();
    view.rerender(frame());
    await act(async () => { fireEvent.press(screen.getByRole('radio', { name: /^Science Club\b/ })); });
    expect(screen.getByRole('radio', { name: /^Science Club\b/, checked: true })).toBeOnTheScreen();
    expect(world()).toBe(acknowledged); expect(context.rows()).toEqual(browseRows); expect(browseCommit).not.toHaveBeenCalled();
    await press('Review Club'); expect(screen.getByText('Join the Science Club?')).toBeOnTheScreen(); const clubTerms = review();
    const clubCommand = { type: 'campus-club' as const, communityId: campus.id, club: 'science' as const }, expectedClub = resolveCommand(acknowledged, clubCommand, true);
    context.sqlite.exec("CREATE TRIGGER fail_campus_club BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Join Club'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(screen.getAllByRole('alert')).toHaveLength(1); expect(review()).toEqual(clubTerms); expect(world()).toBe(acknowledged); expect(context.rows()).toEqual(browseRows);
    await press('Never mind'); expect(screen.getByRole('radio', { name: /^Science Club\b/, checked: true })).toBeOnTheScreen();
    await press('Review Club'); context.sqlite.exec('DROP TRIGGER fail_campus_club'); await press('Join Club');
    expect(world()).toEqual(expectedClub); expect(currentCampus(world())!.club).toBe('science'); expect(currentCampus(world())!.periods).toEqual(campus.periods);
    expect(world().random).toEqual(acknowledged.random); expect(world().ledger).toEqual(acknowledged.ledger); expect(world().accounts).toEqual(acknowledged.accounts);
    expect(world().people[world().activePersonId].stats).toEqual(acknowledged.people[acknowledged.activePersonId].stats);
    expect(context.rows().receipts).toHaveLength(acknowledgedRows.receipts.length + 1); context.original();
    // Actual attended club gains and paused/withdrawn stopping are domain tests;
    // choosing a club itself grants neither attendance nor a skill reward.
  } finally { view?.unmount(); jest.restoreAllMocks(); context.close(); }
}, 60000);
