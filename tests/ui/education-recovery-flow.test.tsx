import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld } from '../../src/game/model';
import { GameCommand, resolveCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { currentRecovery } from '../../src/game/systems/educationRecoverySchemas';
import { accountFor } from '../../src/game/systems/common';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import { decodeSave } from '../../src/persistence/archive';
import archive from '../fixtures/v23-low-grade-school-archive.json';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Education from '../../app/(game)/education';
import School from '../../app/(game)/school';
import Life from '../../app/(game)/(tabs)/life';
import { PendingEvent } from '../../src/ui/PendingEvent';
const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };

test('a real historical branch finishes school, retries evening enrolment and the final qualification write, and resumes the exact course cold', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver), save = decodeSave(JSON.stringify(archive));
  await repository.initialise(); await repository.import(JSON.stringify(archive));
  const initial = await repository.restoreBranch(save.world.id, save.snapshots.at(-1)!.summary.id, save.world.revision, 'life_evening_ui', 'fixture_recovery_branch');
  // Initial financial test setup funds ordinary living and any real healthcare,
  // independently of the no-fee course. All later learning uses actual commands.
  const funded = { ...initial, accounts: initial.accounts.map(item => item.id === accountFor(initial).id ? { ...item, cash: item.cash + 100000000n, openingCash: item.openingCash + 100000000n } : item), revision: initial.revision + 1 };
  await repository.commit(funded, initial.revision, 'fixture_initial_funds');
  const cold = async () => { mockStore = createGameStore({ repository: async () => repository, date: () => funded.date, id: () => 'unused' }); await mockStore.getState().bootstrap(); };
  await cold(); const view = render(frame(<Life />)); let failedFinalCredit = false;
  const world = () => mockStore.getState().world!;
  const commandPress = async (command: GameCommand, label: string) => {
    const before = encodeWorld(world()), predicted = resolveCommand(world(), command);
    const awards = !failedFinalCredit && predicted.recoveryCourses.some(item => item.personId === world().activePersonId && item.qualificationAwarded);
    if (awards) {
      sqlite.exec("CREATE TRIGGER fail_final_evening_credit BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
      await press(label); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/));
      expect(encodeWorld(world())).toBe(before); expect(encodeWorld(await repository.load(world().id))).toBe(before);
      expect(world().people[world().activePersonId].education.qualifications).toEqual([]);
      expect(currentRecovery(world())!.periods.length).toBeLessThan(24);
      sqlite.exec('DROP TRIGGER fail_final_evening_credit'); failedFinalCredit = true;
    }
    await press(label);
  };
  const finishYear = async () => {
    let guard = 0;
    while ((world().pending || world().annual) && guard++ < 150) {
      const current = world();
      if (current.pending?.kind === 'decision') { const choice = current.pending.choices.find(item => !choiceUnavailable(current, item))!; await commandPress({ type: 'choose', eventId: current.pending.id, choiceId: choice.id }, choice.label); }
      else if (current.pending) await commandPress({ type: 'acknowledge', resultId: current.pending.id }, 'Continue');
      else await commandPress({ type: 'resume' }, 'Continue This Year');
    }
    expect(guard).toBeLessThan(150);
  };
  await commandPress({ type: 'advance' }, 'Age Up'); await finishYear();
  expect(world().schoolCompletions.find(item => item.personId === world().activePersonId)).toMatchObject({ passed: false, grade: 0 });
  view.rerender(frame(<School />)); expect(screen.getByText(/No secondary qualification awarded/)).toBeOnTheScreen();
  await press(/^Education & Qualifications/); expect(router.push).toHaveBeenCalledWith('/education'); view.rerender(frame(<Education />));
  const beforeEnrol = encodeWorld(world()), loans = world().liabilities.filter(item => item.kind === 'student');
  await press(/^Complete Secondary Education/); expect(screen.getByText('24 months')).toBeOnTheScreen(); expect(screen.getByText('No fee or loan')).toBeOnTheScreen();
  sqlite.exec("CREATE TRIGGER fail_evening_enrolment BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press('Join Evening Classes'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
  expect(encodeWorld(world())).toBe(beforeEnrol); expect(encodeWorld(await repository.load(world().id))).toBe(beforeEnrol);
  sqlite.exec('DROP TRIGGER fail_evening_enrolment'); await press('Join Evening Classes');
  await waitFor(() => expect(screen.getByText('Evening course enrolled')).toBeOnTheScreen());
  const enrolled = encodeWorld(world()); await act(async () => { await cold(); }); view.rerender(frame(<Education />));
  expect(encodeWorld(world())).toBe(enrolled); await press('Continue');
  expect(screen.getByText('0 of 24 attended months · 50% needed to pass')).toBeOnTheScreen();
  expect(world().liabilities.filter(item => item.kind === 'student')).toEqual(loans);
  await press(/^Evening Study Routine/); fireEvent.press(screen.getByRole('radio', { name: 'Focused' })); await press('Set Evening Routine'); await press('Continue');
  for (let year = 0; year < 5 && currentRecovery(world()); year++) {
    view.rerender(frame(<Education />));
    const extra = screen.getByRole('button', { name: /^Extra Evening Study/ });
    if (!extra.props.accessibilityState.disabled) { await press(/^Extra Evening Study/); await press('Continue'); }
    view.rerender(frame(<Life />)); await commandPress({ type: 'advance' }, 'Age Up'); await finishYear();
  }
  expect(failedFinalCredit).toBe(true); expect(currentRecovery(world())).toBeUndefined();
  const completed = world().recoveryCourses[0]; expect(completed).toMatchObject({ status: 'passed', qualificationAwarded: true }); expect(completed.periods).toHaveLength(24);
  expect(world().people[world().activePersonId].education.qualifications.filter(item => item.level === 'secondary')).toHaveLength(1);
  const terminal = encodeWorld(world()); await act(async () => { await cold(); }); view.rerender(frame(<Education />));
  expect(encodeWorld(world())).toBe(terminal); expect(screen.getByText('Secondary qualification earned')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: /^School Years/ })).toBeOnTheScreen();
  expect((await repository.load(save.world.id)).people[save.world.activePersonId].education.qualifications).toEqual([{ level: 'secondary', field: 'general', year: 2018 }]);
  view.unmount(); sqlite.close();
}, 60000);
