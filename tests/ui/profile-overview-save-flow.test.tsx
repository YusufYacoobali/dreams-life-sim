import { displayText } from '../../src/ui/displayNumbers';
import React from 'react';
import { Image, Switch } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { router } from 'expo-router';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, encodeWorld, fullName, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { countries } from '../../src/game/countries';
import { formatMoney } from '../../src/game/money';
import { netWorth } from '../../src/game/valuation';
import { childrenOf } from '../../src/game/systems/family';
import { otherPerson, partnerRelation } from '../../src/game/systems/relationships';
import { decodeSave } from '../../src/persistence/archive';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import newborn from '../fixtures/v1-newborn.json';
import birth from '../fixtures/v6-birth-result.json';
import history from '../fixtures/v7-history-archive.json';
import relocated from '../fixtures/v20-relocation-archive.json';
import school from '../fixtures/v21-school-archive.json';
import service from '../fixtures/v16-service-archive.json';
import royal from '../fixtures/v17-royal-archive.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), replace: jest.fn(), push: jest.fn() }, Redirect: () => null }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Profile from '../../app/(game)/profile';
import { CharacterPortrait } from '../../src/assets/CharacterPortrait';

const frame = (pending = false) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Profile />{pending && <PendingEvent />}</ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const world = () => mockStore.getState().world!;
const toggleDating = async (name: string) => { await act(async () => { fireEvent.press(screen.getByRole('checkbox', { name })); }); };
const toggleChildren = async (value: boolean) => { await act(async () => { fireEvent(screen.getByRole('switch', { name: 'Would like children' }), 'valueChange', value); }); };
function finish(initial: World) {
  let current = initial, guard = 0;
  while ((current.pending || current.annual && !current.annual.pausedForPlanning) && guard++ < 150) {
    const command: GameCommand = current.pending?.kind === 'decision' ? { type: 'choose', eventId: current.pending.id, choiceId: current.pending.choices.find(choice => !choiceUnavailable(current, choice))!.id } : current.pending ? { type: 'acknowledge', resultId: current.pending.id } : { type: 'resume' };
    current = resolveCommand(current, command, true);
  }
  expect(guard).toBeLessThan(150); return current;
}
const family = () => finish(decodeWorld(JSON.stringify(birth)));

async function setup(initial: World) {
  const directory = mkdtempSync(join(tmpdir(), 'dreams-profile-')), file = join(directory, 'dreams.db');
  let sqlite: DatabaseSync;
  function connect(): SqlDatabase {
    sqlite = new DatabaseSync(file); sqlite.exec('PRAGMA foreign_keys=ON'); const connection = sqlite;
    const session: SqlSession = {
      run: async (sql, values = []) => { connection.prepare(sql).run(...values); },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).get(...values) as T ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) => connection.prepare(sql).all(...values) as T[],
    };
    return { ...session, exec: async sql => { connection.exec(sql); }, transaction: async action => {
      connection.exec('BEGIN IMMEDIATE');
      try { const result = await action(session); connection.exec('COMMIT'); return result; }
      catch (error) { connection.exec('ROLLBACK'); throw error; }
    } };
  }
  const repository = new SaveRepository(connect()); await repository.initialise(); await repository.import(JSON.stringify(history));
  const oldLives = sqlite!.prepare('SELECT * FROM lives ORDER BY id').all(), oldBackups = sqlite!.prepare('SELECT * FROM backups ORDER BY life_id').all(), oldMoments = sqlite!.prepare('SELECT * FROM snapshots ORDER BY 1,2').all();
  await repository.create(initial);
  let nextYield: Promise<void> | undefined;
  const pauseNextSave = () => { let release!: () => void; nextYield = new Promise<void>(resolve => { release = resolve; }); return release; };
  const bootstrap = async (repo: SaveRepository) => {
    mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused', yieldToUI: async () => { const pause = nextYield; nextYield = undefined; if (pause) await pause; } });
    expect(await mockStore.getState().bootstrap()).toBe(true);
  };
  await bootstrap(repository);
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [String(row.name), sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { get sqlite() { return sqlite!; }, rows, pauseNextSave,
    cold: async () => { sqlite.close(); await bootstrap(new SaveRepository(connect())); },
    original: () => {
      for (const row of oldLives) expect(sqlite.prepare('SELECT * FROM lives WHERE id=?').get(row.id!)).toEqual(row);
      for (const row of oldBackups) expect(sqlite.prepare('SELECT * FROM backups WHERE life_id=?').get(row.life_id!)).toEqual(row);
      expect(sqlite.prepare('SELECT * FROM snapshots ORDER BY 1,2').all()).toEqual(oldMoments);
      for (const point of history.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(point.summary.id)?.payload).toBe(point.payload);
    },
    close: () => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); },
  };
}

beforeEach(() => { jest.clearAllMocks(); });
afterEach(() => { jest.restoreAllMocks(); });

test('the newborn overview reads actual identity, family, finances and all ten bounded stats without a save', async () => {
  const context = await setup(decodeWorld(JSON.stringify(newborn)));
  try {
    const initial = world(), player = initial.people[initial.activePersonId], before = encodeWorld(initial), rows = context.rows(), dispatch = jest.spyOn(mockStore.getState(), 'dispatch'), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    expect(Object.keys(rows)).toHaveLength(8); const view = render(frame());
    expect(screen.getByText(fullName(player))).toBeOnTheScreen(); expect(screen.getByText('Age 0')).toBeOnTheScreen(); expect(screen.getByText('Born 2026-10-18')).toBeOnTheScreen(); expect(screen.getByText('🇮🇹 Italian')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Occupation. Newborn' })).toBeOnTheScreen(); expect(screen.getByRole('button', { name: 'Education. No completed qualifications' })).toBeOnTheScreen(); expect(screen.getByRole('button', { name: 'Children. None' })).toBeOnTheScreen();
    for (const [stat, label] of Object.entries({ happiness: 'Happiness', health: 'Health', smarts: 'Smarts', looks: 'Looks', respect: 'Respect', energy: 'Energy', fitness: 'Fitness', stress: 'Stress', discipline: 'Discipline', fame: 'Fame' }) as [keyof typeof player.stats, string][]) expect(screen.getByRole('progressbar', { name: label })).toHaveProp('accessibilityValue', { min: 0, max: 100, now: player.stats[stat] });
    expect(screen.queryByRole('button', { name: 'Save Preferences' })).toBeNull(); await press(/^Net Worth\./); expect(router.push).toHaveBeenLastCalledWith('/assets'); await press('Back'); expect(router.back).toHaveBeenCalledTimes(1);
    expect(dispatch).not.toHaveBeenCalled(); expect(unpack).not.toHaveBeenCalled(); expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(rows); context.original(); view.unmount();
  } finally { context.close(); }
});

test('the adult overview shows the actual degree, employer, spouse, child, reputation and mixed asset/debt net worth', async () => {
  const context = await setup(family());
  try {
    const initial = world(), player = initial.people[initial.activePersonId], partner = otherPerson(initial, partnerRelation(initial)!), before = encodeWorld(initial), rows = context.rows(); const view = render(frame());
    expect(screen.getByRole('button', { name: 'Education. Latest qualification · computing. Degree' })).toBeOnTheScreen(); expect(screen.getByRole('button', { name: 'Occupation. New York Technology. Software Developer' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Marital Status. ' + fullName(partner) + '. Married' })).toBeOnTheScreen(); expect(screen.getByRole('button', { name: 'Children. ' + childrenOf(initial).length })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: displayText('Net Worth. ' + formatMoney(netWorth(initial), countries[player.country].locale)) })).toBeOnTheScreen(); expect(screen.getByRole('button', { name: new RegExp('^Reputation\\. Private Life · Public image ' + player.publicLife.image + '%\\. Respect ' + player.stats.respect + '%$') })).toBeOnTheScreen();
    for (const [name, href] of [[/^Education\./, '/education'], [/^Occupation\./, '/work'], [/^Residence\./, '/household'], [/^Children\./, '/family'], [/^Reputation\./, '/fame']] as const) { await press(name); expect(router.push).toHaveBeenLastCalledWith(href); }
    await press(/^Marital Status\./); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/person/[id]', params: { id: partner.id } }); expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(rows); context.original(); view.unmount();
  } finally { context.close(); }
});

test.each([
  ['relocated nationality', relocated, 'Residence. Tokyo, Japan', /^Occupation\./, '/work'],
  ['primary school', school, 'Education. New York Primary School. Primary school', 'Occupation. Student', '/school'],
  ['active service', service, /^Occupation\./, /^Occupation\./, { pathname: '/service/[kind]', params: { kind: 'military' } }],
  ['royal duties', royal, /^Occupation\./, /^Occupation\./, '/royalty'],
] as const)('%s uses the current contextual records and working shortcut without writing history', async (name, archive, row, shortcut, href) => {
  const context = await setup(finish(decodeSave(JSON.stringify(archive)).world));
  try {
    const before = encodeWorld(world()), rows = context.rows(), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); const view = render(frame());
    expect(screen.getByRole('button', { name: row })).toBeOnTheScreen(); if (name === 'relocated nationality') expect(screen.getByText('🇺🇸 American')).toBeOnTheScreen(); await press(shortcut); expect(router.push).toHaveBeenLastCalledWith(href);
    expect(encodeWorld(world())).toBe(before); expect(context.rows()).toEqual(rows); expect(unpack).not.toHaveBeenCalled(); context.original(); view.unmount();
  } finally { context.close(); }
});

test('unchanged preferences, including a reordered restored attraction set, never dispatch or write', async () => {
  const context = await setup(family());
  try {
    const initial = world(), rows = context.rows(), dispatch = jest.spyOn(mockStore.getState(), 'dispatch'); const view = render(frame());
    expect(screen.getByRole('button', { name: 'Save Preferences' })).toBeDisabled(); await press('Save Preferences'); await toggleDating('Men'); expect(screen.getByRole('button', { name: 'Save Preferences' })).toBeEnabled(); await toggleDating('Men');
    await toggleChildren(false); await toggleChildren(true); expect(screen.getByRole('button', { name: 'Save Preferences' })).toBeDisabled(); expect(screen.getByText('Your preferences are up to date.')).toBeOnTheScreen(); await press('Save Preferences');
    expect(dispatch).not.toHaveBeenCalled(); expect(world()).toEqual(initial); expect(context.rows()).toEqual(rows); context.original(); view.unmount();
  } finally { context.close(); }
});

test('a failed preference save retains the reviewed form, freezes all inputs while saving, retries once and cold-resumes the exact durable result', async () => {
  const context = await setup(family());
  try {
    const initial = world(), player = initial.people[initial.activePersonId], command: GameCommand = { type: 'relationship-preferences', attractedTo: player.attractedTo.filter(gender => gender !== 'male'), wantsChildren: false }, predicted = resolveCommand(initial, command, true), beforeRows = context.rows();
    let view = render(frame(true)); await toggleDating('Men'); await toggleChildren(false); const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    context.sqlite.exec("CREATE TRIGGER fail_profile BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Save Preferences'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(screen.getByRole('alert')).toHaveProp('accessibilityLiveRegion', 'polite'); expect(screen.getAllByRole('alert')).toHaveLength(1); expect(screen.getByRole('checkbox', { name: 'Men' })).toBeOnTheScreen(); expect(screen.getByRole('switch', { name: 'Would like children' })).toHaveProp('value', false); expect(screen.getByRole('button', { name: 'Save Preferences' })).toBeEnabled(); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
    context.sqlite.exec('DROP TRIGGER fail_profile'); const release = context.pauseNextSave(); await press('Save Preferences'); expect(mockStore.getState().busy).toBe(true);
    expect(screen.getByRole('button', { name: 'Save Preferences', busy: true })).toBeDisabled(); expect(screen.getAllByRole('button', { busy: true })).toHaveLength(1); for (const name of ['Men', 'Women', 'Non-binary']) expect(screen.getByRole('checkbox', { name })).toBeDisabled(); expect(screen.getByRole('switch', { name: 'Would like children' })).toBeDisabled(); expect(screen.UNSAFE_getByType(Switch).props.disabled).toBe(true);
    await toggleDating('Men'); await toggleChildren(true); await press('Save Preferences'); expect(screen.getByRole('checkbox', { name: 'Men' })).toBeOnTheScreen(); expect(screen.getByRole('switch', { name: 'Would like children' })).toHaveProp('value', false); expect(context.rows()).toEqual(beforeRows);
    await act(async () => { release(); }); await waitFor(() => expect(mockStore.getState().busy).toBe(false)); expect(world()).toEqual(predicted); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore(); expect(screen.queryByRole('alert')).toBeNull(); expect(screen.getByRole('button', { name: 'Save Preferences' })).toBeDisabled();
    const savedRows = context.rows(); view.unmount(); await context.cold(); view = render(frame(true)); expect(world()).toEqual(predicted); expect(context.rows()).toEqual(savedRows); expect(screen.getByRole('checkbox', { name: 'Men' })).toBeOnTheScreen(); expect(screen.getByRole('switch', { name: 'Would like children' })).toHaveProp('value', false);
    const layers = () => screen.UNSAFE_getByType(CharacterPortrait).findAllByType(Image).map(image => image.props), beforeAcknowledgement = layers(), savedAppearance = world().people[player.id].appearance;
    expect(beforeAcknowledgement.length).toBeGreaterThan(0);
    await press('Continue'); expect(world()).toEqual(resolveCommand(predicted, { type: 'acknowledge', resultId: predicted.pending!.id }, true)); expect(world().people).toEqual(predicted.people); expect(world().accounts).toEqual(initial.accounts); expect(world().random).toEqual(initial.random);
    expect(world().people[player.id].appearance).not.toBe(savedAppearance);
    expect(layers()).toHaveLength(beforeAcknowledgement.length); layers().forEach((props, index) => { expect(props).toEqual(beforeAcknowledgement[index]); expect(props).toBe(beforeAcknowledgement[index]); });
    const doneRows = context.rows(); await press('Save Preferences'); expect(context.rows()).toEqual(doneRows); context.original(); view.unmount();
  } finally { context.close(); }
});

test('changing the selected life resets the old preference draft and error, even when both lives use person_player', async () => {
  const context = await setup(family());
  try {
    const initial = world(); const view = render(frame()); await toggleDating('Men'); await toggleChildren(false);
    context.sqlite.exec("CREATE TRIGGER fail_profile BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END"); await press('Save Preferences'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); context.sqlite.exec('DROP TRIGGER fail_profile');
    await act(async () => { expect(await mockStore.getState().selectLife('life_fixture_history')).toBe(true); }); expect(world().activePersonId).toBe(initial.activePersonId); expect(world().id).not.toBe(initial.id); expect(screen.queryByRole('alert')).toBeNull(); expect(screen.getByRole('checkbox', { name: 'Men' })).toBeOnTheScreen(); expect(screen.getByRole('switch', { name: 'Would like children' })).toHaveProp('value', true); expect(screen.getByRole('button', { name: 'Save Preferences' })).toBeDisabled();
    await act(async () => { expect(await mockStore.getState().selectLife(initial.id)).toBe(true); }); const rows = context.rows(), dispatch = jest.spyOn(mockStore.getState(), 'dispatch'); expect(world()).toEqual(initial); expect(screen.getByRole('checkbox', { name: 'Men' })).toBeOnTheScreen(); expect(screen.queryByRole('alert')).toBeNull(); expect(screen.getByRole('button', { name: 'Save Preferences' })).toBeDisabled(); await press('Save Preferences'); expect(dispatch).not.toHaveBeenCalled(); expect(context.rows()).toEqual(rows); context.original(); view.unmount();
  } finally { context.close(); }
});
