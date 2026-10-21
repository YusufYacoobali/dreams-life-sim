import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { SaveRepository } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import archive from '../fixtures/v27-responsive-archive.json';

let mockStore: ReturnType<typeof createGameStore>, mockHobbyKind = 'reading';
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() }, useLocalSearchParams: () => ({ kind: mockHobbyKind }) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import { router } from 'expo-router';
import Hobbies from '../../app/(game)/hobbies';
import Hobby from '../../app/(game)/hobby/[kind]';
import Life from '../../app/(game)/(tabs)/life';
import { PendingEvent } from '../../src/ui/PendingEvent';
const frame = (children: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{children}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };

test('the genuine child keeps original history, browses all new hobbies, and retries/cold-resumes actual reading consent, monthly bills and optional practice', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.import(JSON.stringify(archive));
  // Reset both repository and store caches on the same open in-memory connection.
  // This is a decoded reload, not a closed-connection/native cold-start claim.
  const cold = async () => { const reopened = new SaveRepository(driver); mockStore = createGameStore({ repository: async () => reopened, date: () => ({ year: 2026, month: 10, day: 19 }), id: () => 'unused' }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await cold(); const world = () => mockStore.getState().world!, reading = () => world().hobbies.find(item => item.kind === 'reading')!;
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  const expectOneSave = (before: ReturnType<typeof rows>) => {
    const previous = before.lives.find((row: Record<string, unknown>) => row.id === world().id)!;
    expect(world().revision).toBe(Number(previous.revision) + 1);
    expect(rows().receipts).toHaveLength(before.receipts.length + 1);
    expect(sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(world().id)?.payload).toBe(previous.payload);
  };
  const view = render(frame(<Life />));
  const finish = async () => {
    let guard = 0;
    while ((world().pending || world().annual) && guard++ < 150) {
      const current = world();
      if (current.pending?.kind === 'decision') await press(current.pending.choices.find(item => !choiceUnavailable(current, item))!.label);
      else if (current.pending) await press('Continue'); else await press('Continue This Year');
    }
    expect(guard).toBeLessThan(150);
  };
  await finish(); const beforeBrowse = encodeWorld(world()), originalGuitarMonths = structuredClone(world().hobbies[0].practices);
  view.rerender(frame(<Hobbies />));
  for (const [kind, name] of [['gaming', 'Video Games'], ['cooking', 'Cooking'], ['gardening', 'Gardening'], ['reading', 'Reading']]) {
    await press(new RegExp('^' + name + '\\.'));
    expect(router.push).toHaveBeenLastCalledWith({ pathname: '/hobby/[kind]', params: { kind } });
    mockHobbyKind = kind; view.rerender(frame(<Hobby />));
    expect(screen.getByText('Choose a Routine')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Guitar\./ })).toBeNull();
    expect(encodeWorld(world())).toBe(beforeBrowse);
    await press('Back'); expect(router.back).toHaveBeenCalled(); view.rerender(frame(<Hobbies />));
  }
  mockHobbyKind = 'unknown'; view.rerender(frame(<Hobby />));
  expect(screen.getByText('This hobby is unavailable.')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Review Hobby Routine' })).toBeNull();
  view.rerender(frame(<Hobbies />)); await press(/^Reading\./); mockHobbyKind = 'reading'; view.rerender(frame(<Hobby />));
  expect(encodeWorld(world())).toBe(beforeBrowse);
  const accounts = structuredClone(world().accounts), assets = structuredClone(world().assets), beforePlanRows = rows();
  const parent = world().relationships.find(edge => [edge.from, edge.to].includes(world().activePersonId) && [edge.from, edge.to].includes('person_parent1'))!;
  const parentStrength = parent.strength, consentChance = Math.min(95, 45 + Math.floor(parentStrength / 2));
  // The unchanged archive now reaches a different ordinary-story relationship;
  // the payer formula and saved47 roll have not changed.
  expect(consentChance).toBe(87); expect(Object.keys(beforePlanRows)).toHaveLength(8);
  await press('Review Hobby Routine'); expect(screen.getByText('Responsible payer')).toBeOnTheScreen();
  sqlite.exec("CREATE TRIGGER fail_reading_plan BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press('Ask For This Routine'); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/));
  expect(encodeWorld(world())).toBe(beforeBrowse); expect(encodeWorld(await repository.load(world().id))).toBe(beforeBrowse); expect(rows()).toEqual(beforePlanRows);
  const planUnpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
  sqlite.exec('DROP TRIGGER fail_reading_plan'); await press('Ask For This Routine');
  expect(planUnpack).not.toHaveBeenCalled(); planUnpack.mockRestore(); expectOneSave(beforePlanRows);
  expect(reading()).toMatchObject({ proficiency: 0, practices: [], plans: [{ payerId: 'person_parent1', monthlyFee: 1160n, consent: { accepted: true, strength: parentStrength, roll: 47, chance: consentChance } }] });
  expect(world().accounts).toEqual(accounts); expect(world().assets).toEqual(assets);
  const planned = encodeWorld(world()); await act(async () => { await cold(); }); view.rerender(frame(<Hobby />));
  expect(encodeWorld(world())).toBe(planned); await press('Continue');
  view.rerender(frame(<Life />)); const beforeYear = encodeWorld(world()), beforeYearRows = rows(), predicted = resolveCommand(world(), { type: 'advance' }, true);
  sqlite.exec("CREATE TRIGGER fail_reading_months BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press('Age Up'); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/));
  expect(encodeWorld(world())).toBe(beforeYear); expect(encodeWorld(await repository.load(world().id))).toBe(beforeYear); expect(rows()).toEqual(beforeYearRows);
  const yearUnpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
  sqlite.exec('DROP TRIGGER fail_reading_months'); await press('Age Up'); expect(world()).toEqual(predicted);
  expect(yearUnpack).not.toHaveBeenCalled(); yearUnpack.mockRestore(); expectOneSave(beforeYearRows);
  const interrupted = encodeWorld(world()); await act(async () => { await cold(); }); view.rerender(frame(<Life />));
  expect(encodeWorld(world())).toBe(interrupted); await finish();
  expect(reading().practices.filter(row => row.source === 'monthly')).toHaveLength(12);
  expect(reading().practices.every(row => row.attended)).toBe(true); expect(reading().proficiency).toBe(24);
  expect(reading().practices.reduce((sum, row) => sum + row.paid, 0n)).toBe(13920n);
  expect(reading().practices.flatMap(row => row.effects).filter(effect => effect.stat === 'smarts').reduce((sum, effect) => sum + effect.after - effect.before, 0)).toBe(2);
  expect(world().hobbies[0].practices.slice(0, originalGuitarMonths.length)).toEqual(originalGuitarMonths);
  expect(world().pets[0].periods).toHaveLength(36);
  view.rerender(frame(<Hobbies />)); await press(/^Reading\./); view.rerender(frame(<Hobby />));
  const beforePractice = encodeWorld(world()), beforePracticeRows = rows(), money = structuredClone(world().accounts), ledger = structuredClone(world().ledger), smarts = world().people[world().activePersonId].stats.smarts;
  sqlite.exec("CREATE TRIGGER fail_reading_extra BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press('Extra Practice'); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/)); expect(encodeWorld(world())).toBe(beforePractice); expect(rows()).toEqual(beforePracticeRows);
  const practiceUnpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
  sqlite.exec('DROP TRIGGER fail_reading_extra'); await press('Extra Practice');
  expect(practiceUnpack).not.toHaveBeenCalled(); practiceUnpack.mockRestore(); expectOneSave(beforePracticeRows);
  expect(reading().practices.at(-1)).toMatchObject({ source: 'manual', gain: 1, paid: 0n, paymentId: null });
  expect(world().accounts).toEqual(money); expect(world().ledger).toEqual(ledger); expect(world().people[world().activePersonId].stats.smarts).toBe(smarts);
  expect(world().pending).toMatchObject({ kind: 'result', effects: [{ id: 'proficiency', value: '+1%', tone: 'positive' }, expect.anything(), expect.anything(), expect.anything()] });
  const practiced = encodeWorld(world()); await act(async () => { await cold(); }); view.rerender(frame(<Hobby />));
  expect(encodeWorld(world())).toBe(practiced); await press('Continue');
  expect(screen.getByRole('button', { name: 'Extra Practice' })).toBeDisabled();
  expect(reading().practices.filter(row => row.source === 'manual')).toHaveLength(1);
  view.unmount(); sqlite.close();
}, 60000);
