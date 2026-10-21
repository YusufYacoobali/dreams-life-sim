import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld } from '../../src/game/model';
import { GameCommand, resolveCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { SaveRepository } from '../../src/persistence/repository';
import { decodeSave } from '../../src/persistence/archive';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import archive from '../fixtures/v24-university-loan-archive.json';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import ScholarshipApplications from '../../app/(game)/scholarships';
import Education from '../../app/(game)/education';
import Life from '../../app/(game)/(tabs)/life';
import { PendingEvent } from '../../src/ui/PendingEvent';
const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{child}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };

test('a genuine historical pupil earns an offer, retries application/enrolment/renewal writes and cold-resumes the exact tuition waiver and debt', async () => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver), save = decodeSave(JSON.stringify(archive));
  await repository.initialise(); await repository.import(JSON.stringify(archive));
  await repository.restoreBranch(save.world.id, save.snapshots[0].summary.id, save.world.revision, 'life_scholarship_ui', 'fixture_aid_branch');
  const cold = async () => { mockStore = createGameStore({ repository: async () => repository, date: () => save.world.date, id: () => 'unused' }); await mockStore.getState().bootstrap(); };
  await cold(); const world = () => mockStore.getState().world!, view = render(frame(<Life />));
  const finishYear = async () => {
    let guard = 0;
    while ((world().pending || world().annual) && guard++ < 150) {
      const w = world();
      if (w.pending?.kind === 'decision') { const choice = w.pending.choices.find(item => !choiceUnavailable(w, item))!; await press(choice.label); }
      else if (w.pending) await press('Continue');
      else await press('Continue This Year');
    }
    expect(guard).toBeLessThan(150);
  };
  await press('Age Up'); await finishYear();
  expect(world().schoolCompletions.find(item => item.personId === world().activePersonId)?.passed).toBe(true);
  const beforeBrowse = encodeWorld(world()); view.rerender(frame(<Education />)); await press(/^Scholarships\./); expect(router.push).toHaveBeenCalledWith('/scholarships'); view.rerender(frame(<ScholarshipApplications />)); expect(encodeWorld(world())).toBe(beforeBrowse);
  await press('Apply · Academic Scholarship'); expect(screen.getByText('Annual tuition remaining')).toBeOnTheScreen(); expect(screen.getByText('$3,500.00')).toBeOnTheScreen();
  sqlite.exec("CREATE TRIGGER fail_aid_application BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press('Apply For Scholarship'); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/));
  expect(encodeWorld(world())).toBe(beforeBrowse); expect(encodeWorld(await repository.load(world().id))).toBe(beforeBrowse);
  expect(screen.getByText('Apply for an Academic Scholarship?')).toBeOnTheScreen();
  sqlite.exec('DROP TRIGGER fail_aid_application'); await press('Apply For Scholarship');
  expect(world().scholarships[0]).toMatchObject({ status: 'offered', roll: 51, periods: [] });
  const offered = encodeWorld(world()); await act(async () => { await cold(); }); view.rerender(frame(<ScholarshipApplications />)); expect(encodeWorld(world())).toBe(offered); await press('Continue');
  await press('Review Course With This Offer'); expect(router.push).toHaveBeenCalledWith('/education'); view.rerender(frame(<Education />));
  await press('Review Course With This Offer'); expect(screen.getByText('Application fee')).toBeOnTheScreen(); expect(screen.getByText('No fee or loan')).toBeOnTheScreen();
  const beforeApplication = encodeWorld(world());
  sqlite.exec("CREATE TRIGGER fail_university_application BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press('Submit University Application'); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/)); expect(encodeWorld(world())).toBe(beforeApplication); expect(screen.getByText('Apply to study computing?')).toBeOnTheScreen();
  sqlite.exec('DROP TRIGGER fail_university_application'); await press('Submit University Application'); expect(world().universityApplications[0].status).toBe('accepted'); expect(world().scholarships[0].status).toBe('offered'); expect(world().ledger.filter(item => item.category === 'tuition')).toEqual([]); await press('Continue');
  await press('Review Course With This Offer'); fireEvent.press(screen.getByRole('radio', { name: /Student loan/ })); await press('Review Enrolment'); expect(screen.getByText('First-year tuition billed')).toBeOnTheScreen(); expect(screen.getByText('$3,500.00')).toBeOnTheScreen();
  const beforeEnrol = encodeWorld(world());
  sqlite.exec("CREATE TRIGGER fail_aid_tuition BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press('Accept Place And Enrol'); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/));
  expect(encodeWorld(world())).toBe(beforeEnrol); expect(encodeWorld(await repository.load(world().id))).toBe(beforeEnrol); expect(world().scholarships[0].status).toBe('offered'); expect(screen.getByText('Accept your university place?')).toBeOnTheScreen();
  sqlite.exec('DROP TRIGGER fail_aid_tuition'); await press('Accept Place And Enrol');
  expect(world().scholarships[0]).toMatchObject({ status: 'active', periods: [{ billed: 350000n, waived: 1050000n }] });
  expect(world().liabilities.find(item => item.kind === 'student')?.principal).toBe(350000n);
  const enrolled = encodeWorld(world()); await act(async () => { await cold(); }); view.rerender(frame(<Education />)); expect(encodeWorld(world())).toBe(enrolled); await press('Continue');
  view.rerender(frame(<Life />)); let failedRenewal = false;
  const checkedPress = async (command: GameCommand, label: string) => {
    const before = encodeWorld(world()), predicted = resolveCommand(world(), command), renews = !failedRenewal && predicted.scholarships[0].periods.length > 1;
    if (renews) {
      sqlite.exec("CREATE TRIGGER fail_aid_renewal BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
      await press(label); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/)); expect(encodeWorld(world())).toBe(before); expect(encodeWorld(await repository.load(world().id))).toBe(before);
      sqlite.exec('DROP TRIGGER fail_aid_renewal'); failedRenewal = true;
    }
    await press(label);
    if (renews) { const committed = encodeWorld(world()); await act(async () => { await cold(); }); view.rerender(frame(<Life />)); expect(encodeWorld(world())).toBe(committed); }
  };
  for (let year = 0; year < 3 && !failedRenewal; year++) {
    await checkedPress({ type: 'advance' }, 'Age Up'); let guard = 0;
    while ((world().pending || world().annual) && guard++ < 150) {
      const w = world();
      if (w.pending?.kind === 'decision') { const choice = w.pending.choices.find(item => !choiceUnavailable(w, item))!; await checkedPress({ type: 'choose', eventId: w.pending.id, choiceId: choice.id }, choice.label); }
      else if (w.pending) await checkedPress({ type: 'acknowledge', resultId: w.pending.id }, 'Continue');
      else await checkedPress({ type: 'resume' }, 'Continue This Year');
    }
    expect(guard).toBeLessThan(150);
  }
  expect(failedRenewal).toBe(true); expect(world().scholarships[0].periods.map(item => item.waived)).toEqual([1050000n, 1050000n]);
  expect(world().ledger.filter(item => item.category === 'tuition').map(item => item.cashDelta)).toEqual([-350000n, -350000n]);
  view.rerender(frame(<Education />)); expect(screen.getByText('Total tuition waived: $21,000.00')).toBeOnTheScreen();
  const original = await repository.load(save.world.id); expect(original.scholarships).toEqual([]); expect(original.people[original.activePersonId].education.months).toBe(12); expect(original.ledger.filter(item => item.category === 'tuition').map(item => item.cashDelta)).toEqual([-1400000n]);
  view.unmount(); sqlite.close();
}, 60000);
