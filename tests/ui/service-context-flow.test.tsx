import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { servicePayQuote, serviceSelectionReason } from '../../src/game/systems/services';
import { serviceQualified } from '../../src/game/systems/serviceSchemas';
import type { ServiceKind } from '../../src/game/content/services';
import { SaveRepository } from '../../src/persistence/repository';
import { decodeSave } from '../../src/persistence/archive';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import archive from '../fixtures/v16-service-archive.json';

let mockStore: ReturnType<typeof createGameStore>, mockKind: ServiceKind = 'military';
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ kind: mockKind }), router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Service from '../../app/(game)/service/[kind]';
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Service /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => fireEvent.press(screen.getByRole('button', { name }))); };
const world = () => mockStore.getState().world!;
const acknowledge = (input: World) => resolveCommand(input, { type: 'acknowledge', resultId: input.pending!.id }, true);
function finish(input: World) {
  let current = input, guard = 0;
  while ((current.pending || current.annual) && guard++ < 200) {
    const pending = current.pending;
    current = pending ? pending.kind === 'result' ? acknowledge(current) : resolveCommand(current, { type: 'choose', eventId: pending.id, choiceId: pending.choices.find(choice => !choiceUnavailable(current, choice))!.id }, true) : resolveCommand(current, { type: 'resume' }, true);
  }
  if (guard >= 200) throw new Error('The actual service preparation did not finish'); return current;
}
function returnedMember() {
  const current = decodeSave(JSON.stringify(archive)).world;
  expect(current.pending?.title).toBe('Your assignment has ended');
  const returned = acknowledge(current); expect(serviceQualified(returned.serviceCareers[0])).toBe(true); expect(returned.serviceCareers[0].assignments[0].status).toBe('completed');
  return returned;
}
let candidate: string | undefined;
function eligibleCandidate() {
  if (!candidate) {
    let current = returnedMember(); current = acknowledge(resolveCommand(current, { type: 'leave-service', serviceId: current.serviceCareers[0].id }, true));
    current = finish(resolveCommand(current, { type: 'career-training', skill: 'science', mode: 'coached' }, true));
    // Three actual paid training years develop the missing science skill. No
    // date/stat/qualification/cash/selection outcome is edited or rerolled.
    for (let year = 0; year < 3; year++) current = finish(resolveCommand(current, { type: 'advance' }, true));
    expect(current.people[current.activePersonId].training?.months).toBe(36); expect(current.people[current.activePersonId].skills.science).toBeGreaterThanOrEqual(60);
    expect(serviceSelectionReason(current, 'military')).toBeUndefined(); expect(serviceSelectionReason(current, 'astronaut')).toBeUndefined();
    candidate = encodeWorld(current);
  }
  return decodeWorld(candidate);
}
async function setup(initial: World) {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.create(initial);
  const cold = async () => { const repo = new SaveRepository(driver); mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused' }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await cold();
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  return { sqlite, rows, cold };
}

test.each(['astronaut', 'military'] as const)('switching into %s resets the previous branch/review and retains the valid same-kind failed application for retry', async kind => {
  mockKind = kind === 'astronaut' ? 'military' : 'astronaut'; const context = await setup(eligibleCandidate());
  let view: ReturnType<typeof render> | undefined;
  try {
    const initial = world(), original = encodeWorld(initial), beforeRows = context.rows(); view = render(frame());
    if (mockKind === 'military') await press('Navy');
    await press('Review Service Application'); const oldTitle = 'Apply to the ' + mockKind + ' programme?'; expect(screen.getByText(oldTitle)).toBeOnTheScreen();
    mockKind = kind; view.rerender(frame()); expect(screen.queryByText(oldTitle)).toBeNull();
    if (kind === 'military') { expect(screen.getByRole('button', { name: 'Army. Selected' })).toBeOnTheScreen(); await press('Navy'); }
    expect(encodeWorld(world())).toBe(original); expect(context.rows()).toEqual(beforeRows);
    await press('Review Service Application'); const title = 'Apply to the ' + kind + ' programme?', command: GameCommand = { type: 'apply-service', kind, branch: kind === 'astronaut' ? 'space-program' : 'navy', quotedAnnualPay: servicePayQuote(initial, kind) }, expected = resolveCommand(initial, command, true);
    expect(expected.pending?.title).toBe('Your service begins');
    const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    context.sqlite.exec("CREATE TRIGGER fail_service_context BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Apply for Service'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(screen.getByText(title)).toBeOnTheScreen(); expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows);
    view.rerender(frame()); expect(screen.getByText(title)).toBeOnTheScreen(); expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/);
    if (kind === 'military') expect(screen.getByRole('button', { name: 'Navy. Selected' })).toBeOnTheScreen();
    context.sqlite.exec('DROP TRIGGER fail_service_context'); await press('Apply for Service'); expect(world()).toEqual(expected); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
    const member = world().serviceCareers.find(item => item.kind === kind)!; expect(member.branch).toBe(command.branch); expect(member.contracts.at(-1)?.trainingScores).toEqual([]); expect(member.contracts.at(-1)?.months).toBe(0);
    if (kind === 'astronaut') { expect(serviceQualified(member)).toBe(false); expect(member.contracts.at(-1)?.trainingResult).toBe('pending'); }
    else expect(member.contracts.at(-1)?.trainingResult).toBe('exempt'); // The actual earlier military qualification remains earned.
    for (const account of initial.accounts) expect(world().accounts.find(item => item.id === account.id)).toEqual(account);
    expect(world().ledger).toEqual(initial.ledger); expect(world().people[initial.activePersonId].skills).toEqual(initial.people[initial.activePersonId].skills);
    const savedRows = context.rows(); view.unmount(); view = undefined; await context.cold(); view = render(frame()); expect(world()).toEqual(expected); expect(context.rows()).toEqual(savedRows);
    await press('Continue'); const done = world(); expect(done.serviceCareers).toEqual(expected.serviceCareers); expect(done.people).toEqual(expected.people); expect(done.accounts).toEqual(expected.accounts); expect(done.random).toEqual(expected.random);
    const acknowledgedRows = context.rows(); await act(async () => { expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: expected.pending!.id })).toBe(false); }); expect(context.rows()).toEqual(acknowledgedRows);
  } finally { jest.restoreAllMocks(); view?.unmount(); context.sqlite.close(); }
});

test('service-kind round trips clear open mission history without changing its real records or any saved table', async () => {
  mockKind = 'military'; const context = await setup(returnedMember());
  let view: ReturnType<typeof render> | undefined;
  try {
    const initial = world(), beforeRows = context.rows(); view = render(frame());
    await press('View Monthly Record'); expect(screen.getByRole('button', { name: 'Hide Monthly Record' })).toBeOnTheScreen();
    await press(/^Careful Routine\./); expect(screen.getByText('Set your working routine?')).toBeOnTheScreen();
    mockKind = 'astronaut'; view.rerender(frame()); expect(screen.queryByText('Set your working routine?')).toBeNull();
    mockKind = 'military'; view.rerender(frame()); expect(screen.getByRole('button', { name: 'View Monthly Record' })).toBeOnTheScreen(); expect(screen.queryByRole('button', { name: 'Hide Monthly Record' })).toBeNull();
    expect(world()).toEqual(initial); expect(context.rows()).toEqual(beforeRows); expect(world().serviceCareers[0].assignments[0].periods).toHaveLength(6);
  } finally { view?.unmount(); context.sqlite.close(); }
});
