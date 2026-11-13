import React from 'react';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { act, fireEvent, render, screen, waitFor } from '../support/rendering';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../../src/ui/theme';
import { HobbyLifestyle } from '../../src/ui/HobbyLifestyle';
import { SharedLeisure } from '../../src/ui/SharedLeisure';
import { PetLifestyle } from '../../src/ui/PetLifestyle';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { diskDatabase } from '../support/refinementSqlite';
import { lifestyleFixture, act as apply } from '../helpers/lifestyle';
import { hobbyFee, leisureMonth } from '../../src/game/systems/leisure';
import { monthFrom } from '../../src/game/calendar';
import { encodeWorld, fullName, validateWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { useGame } from '../../src/state/useGame';
import { petAdoptionFee } from '../../src/game/systems/pets';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('../../src/state/useGame', () => ({ useGame: (select: unknown) => require('zustand').useStore(mockStore, select) }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
const frame = (children: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 640 }, insets: { top: 24, bottom: 24, left: 0, right: 0 } }}><ThemeProvider>{children}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp, role: 'button' | 'radio' = 'button') => { await act(async () => { await fireEvent.press(screen.getByRole(role, { name })); }); };
async function saved(world: World) {
  const folder = mkdtempSync(join(tmpdir(), 'dreams-hobby-pet-ui-')), file = join(folder, 'life.db');
  let { sqlite, driver } = diskDatabase(file), repository = new SaveRepository(driver);
  await repository.initialise(); await repository.create(world);
  const cold = async () => {
    sqlite.close(); ({ sqlite, driver } = diskDatabase(file)); repository = new SaveRepository(driver); await repository.initialise();
    mockStore = createGameStore({ repository: async () => repository, date: () => world.date, id: () => 'unused' }); await mockStore.getState().bootstrap();
  };
  await cold();
  return { get sqlite() { return sqlite; }, get repository() { return repository; }, cold, close() { sqlite.close(); rmSync(folder, { recursive: true, force: true }); } };
}
function prepared() {
  let world = lifestyleFixture();
  world = apply(world, { type: 'hobby-plan', kind: 'writing', mode: 'community', reviewedPayerId: world.activePersonId, quotedMonthlyFee: hobbyFee(world.people[world.activePersonId].country, 'writing', 'community') });
  for (let i = 0; i < 12; i++) { world.date = monthFrom(world.date, 1); leisureMonth(world); }
  return validateWorld(world);
}
test('one projects flow cancels without writes, then finishes actual later practice after failed-save retry and cold reopening', async () => {
  let initial = prepared();
  initial = apply(initial, { type: 'start-hobby-project', hobbyId: initial.hobbies[0].id, title: 'The Last Bus' });
  for (let i = 0; i < 4; i++) { initial.date = monthFrom(initial.date, 1); leisureMonth(initial); }
  const db = await saved(validateWorld(initial));
  try {
    const view = await render(frame(<HobbyLifestyle kind="writing" />)), before = encodeWorld(initial), id = initial.lifestyle!.projects[0].id;
    expect(screen.getAllByText('Personal Projects')).toHaveLength(1); expect(screen.queryByLabelText('Personal project title')).toBeNull();
    expect(screen.getByText('0/4 parts complete')).toBeOnTheScreen();
    await press(/^Work on This Project/); await press('Never mind'); expect(encodeWorld(await db.repository.load(initial.id))).toBe(before);
    await press(/^Work on This Project/);
    db.sqlite.exec("CREATE TRIGGER fail_project BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Confirm'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(encodeWorld(mockStore.getState().world!)).toBe(before);
    db.sqlite.exec('DROP TRIGGER fail_project'); await press('Confirm');
    expect(mockStore.getState().world).toEqual(resolveCommand(initial, { type: 'work-hobby-project', projectId: id }, true));
    await press('Continue'); const finished = encodeWorld(mockStore.getState().world!);
    await act(async () => { await db.cold(); }); await view.rerender(frame(<HobbyLifestyle kind="writing" />));
    expect(encodeWorld(mockStore.getState().world!)).toBe(finished); expect(screen.queryByRole('button', { name: /^Work on This Project/ })).toBeNull();
    await press(/^Completed Projects/); expect(screen.getByText('The Last Bus · ' + initial.date.year)).toBeOnTheScreen();
    expect(mockStore.getState().world!.assets).toEqual(initial.assets); expect(mockStore.getState().world!.hobbies).toEqual(initial.hobbies);
  } finally { db.close(); }
});
test('a shared outing selects a venue and portrait in separate popups and cancellation leaves tickets, RNG and memories untouched', async () => {
  const initial = lifestyleFixture(), db = await saved(initial);
  try {
    const before = encodeWorld(initial); await render(frame(<SharedLeisure />));
    expect(screen.queryByText(fullName(initial.people.person_parent1))).toBeNull();
    await press('Invite a Friend or Family Member'); await press('Spend Time at the Park', 'radio'); await press('Choose Venue');
    await press(new RegExp('^' + fullName(initial.people.person_parent1)), 'radio'); await press('Choose');
    expect(screen.getByText('Tickets')).toBeOnTheScreen(); await press('Never mind');
    expect(encodeWorld(mockStore.getState().world!)).toBe(before); expect(encodeWorld(await db.repository.load(initial.id))).toBe(before);
  } finally { db.close(); }
});
function PetScreen() { const pet = useGame(state => state.world!.pets[0]); return <PetLifestyle pet={pet} />; }
test('pet groups keep paid care reviews local and retry exactly one actual preventive-care payment', async () => {
  let initial = lifestyleFixture();
  initial = apply(initial, { type: 'adopt-pet', offerId: 'biscuit', name: 'Biscuit', reviewedOwnerId: initial.activePersonId, quotedFee: petAdoptionFee(initial, 'biscuit') });
  const db = await saved(initial);
  try {
    mockStore.setState({ error: 'Tenancy notice is incomplete', errorScope: 'tenancy' });
    const view = await render(frame(<PetScreen />)), before = encodeWorld(initial);
    expect(screen.queryByText('Tenancy notice is incomplete')).toBeNull(); expect(screen.queryByRole('button', { name: /^Preventive Veterinary Care/ })).toBeNull();
    await press('Health & Care'); expect(screen.queryByRole('button', { name: /^Treat Additional Condition/ })).toBeNull();
    await press(/^Preventive Veterinary Care/); await press('Never mind'); expect(encodeWorld(mockStore.getState().world!)).toBe(before);
    await press(/^Preventive Veterinary Care/);
    db.sqlite.exec("CREATE TRIGGER fail_companion_care BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Confirm'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/)); expect(encodeWorld(await db.repository.load(initial.id))).toBe(before);
    db.sqlite.exec('DROP TRIGGER fail_companion_care'); await press('Confirm'); await press('Continue');
    const savedWorld = mockStore.getState().world!, paid = savedWorld.lifestyle!.records.filter(row => row.subjectId === savedWorld.pets[0].id && row.kind === 'pet-prevent');
    expect(paid).toHaveLength(1); expect(paid[0].paymentIds).toHaveLength(1);
    await act(async () => { await db.cold(); }); await view.rerender(frame(<PetScreen />)); expect(mockStore.getState().world).toEqual(savedWorld);
    if (!screen.queryByRole('button', { name: /^Preventive Veterinary Care/ })) await press(/^Health & Care/); expect(screen.getByRole('button', { name: /^Preventive Veterinary Care/ })).toBeDisabled();
  } finally { db.close(); }
});
