import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { database } from '../support/sqlite';
import { medicalEpisodeScenarios } from '../support/medicalEpisodes';
import { accountFor, post } from '../../src/game/systems/common';
import type { World } from '../../src/game/model';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Doctor from '../../app/(game)/doctor';
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Doctor /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (label: string) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name: label })); }); };
async function setup(initial: World) {
  const db = database(), repository = new SaveRepository(db.driver); await repository.initialise(); await repository.create(initial);
  const cold = async () => { mockStore = createGameStore({ repository: async () => new SaveRepository(db.driver), date: () => initial.date, id: () => 'unused' }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await cold(); return { ...db, cold };
}

test('symptoms, actual diagnosis and treatment use native controls, retain failed-save screens, and cold-resume only committed outcomes', async () => {
  const scenario = medicalEpisodeScenarios(), db = await setup(scenario.symptoms);
  const view = render(frame());
  try {
    expect(screen.getByText('Feeling Unwell')).toBeTruthy();
    expect(screen.queryByText(/diagnoses asthma/i)).toBeNull();
    const before = mockStore.getState().world!, cash = accountFor(before).cash;
    db.sqlite.exec("CREATE TRIGGER fail_medical_ui BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Visit the Doctor');
    expect(mockStore.getState().world).toEqual(before); expect(accountFor(mockStore.getState().world!).cash).toBe(cash);
    expect(screen.getByText('Feeling Unwell')).toBeTruthy(); expect(screen.queryByText('Bad News')).toBeNull();
    db.sqlite.exec('DROP TRIGGER fail_medical_ui');
    await press('Visit the Doctor'); await waitFor(() => expect(screen.getByText('Bad News')).toBeTruthy());
    expect(mockStore.getState().world!.people[before.activePersonId].health.conditions[0].diagnosed).not.toBeNull();
    expect(mockStore.getState().world!.people[before.activePersonId].health.conditions[0].treatment).toBeNull();
    const diagnosed = mockStore.getState().world!;
    db.sqlite.exec("CREATE TRIGGER fail_medical_ui BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Start Treatment'); expect(mockStore.getState().world).toEqual(diagnosed);
    expect(screen.getByText('Bad News')).toBeTruthy(); expect(screen.queryByText('Care has begun')).toBeNull();
    db.sqlite.exec('DROP TRIGGER fail_medical_ui');
    await press('Start Treatment'); await waitFor(() => expect(screen.getByText('Care has begun')).toBeTruthy());
    const saved = mockStore.getState().world!;
    expect(saved.people[saved.activePersonId].health.conditions[0].treatment?.method).toBe('medication');
    expect(db.sqlite.prepare('SELECT COUNT(*) AS n FROM receipts WHERE life_id=?').get(saved.id)?.n).toBe(2);
    await act(async () => { await db.cold(); }); view.rerender(frame());
    expect(mockStore.getState().world).toEqual(saved); expect(screen.getByText('Care has begun')).toBeTruthy();
  } finally { view.unmount(); db.sqlite.close(); }
});

test('an unaffordable assessment stays visibly disabled while the truthful ignore choice remains available', async () => {
  const { symptoms } = medicalEpisodeScenarios();
  post(symptoms, -accountFor(symptoms).cash, 0n, 'fixture-spending', 'Declared empty care budget');
  const db = await setup(symptoms), view = render(frame());
  try {
    expect(screen.getByRole('button', { name: 'Visit the Doctor' }).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText('Not enough available money for this care')).toBeTruthy();
    await press('Ignore It');
    const world = mockStore.getState().world!;
    expect(world.pending).toMatchObject({ kind: 'result', title: 'Probably nothing. Hopefully.' });
    expect(world.people[world.activePersonId].health.conditions[0].diagnosed).toBeNull();
    expect(accountFor(world).cash).toBe(0n);
  } finally { view.unmount(); db.sqlite.close(); }
});
