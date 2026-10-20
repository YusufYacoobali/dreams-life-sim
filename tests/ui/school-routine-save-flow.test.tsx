import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { clubLabels } from '../../src/game/systems/school';
import { SaveRepository } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import archive from '../fixtures/v28-native-school-archive.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import School from '../../app/(game)/school';

const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><School /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };

test.each(['club', 'conduct', 'effort'] as const)('the genuine Riley school %s keeps its failed draft, retries warm and cold-resumes once without rewriting old history', async kind => {
  const { sqlite, driver } = database(), repository = new SaveRepository(driver);
  await repository.initialise(); await repository.import(JSON.stringify(archive));
  let saveGate: Promise<void> | null = null;
  const cold = async (activeRepository = new SaveRepository(driver)) => {
    mockStore = createGameStore({ repository: async () => activeRepository, date: () => ({ year: 2026, month: 10, day: 20 }), id: () => 'unused', yieldToUI: () => saveGate ?? Promise.resolve() });
    expect(await mockStore.getState().bootstrap()).toBe(true);
  };
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));
  try {
    await cold(repository);
    const world = () => mockStore.getState().world!, before = world(), encoded = encodeWorld(before), beforeRows = rows(), school = currentSchool(before)!, education = before.people[before.activePersonId].education;
    const beforePayload = sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(before.id)?.payload;
    expect(before).toMatchObject({ revision: 53, pending: null, annual: null });
    const title = kind === 'club' ? /^Extracurricular Activities/ : kind === 'conduct' ? /^Behave in Class/ : /^Study Routine/;
    const confirm = kind === 'club' ? 'Set Club' : kind === 'conduct' ? 'Set Behaviour' : 'Set Routine';
    const currentReason = kind === 'club' ? 'This is your current club plan' : kind === 'conduct' ? 'This is your current classroom behaviour' : 'This is your current study routine';
    const conductLabels = { quiet: 'Pay attention and get on with my work', helpful: 'Help out and support the class', disruptive: 'Push the limits and disrupt lessons' };
    const effortLabels = { relaxed: 'Relaxed', balanced: 'Balanced', focused: 'Focused' };
    const currentLabel = kind === 'club' ? clubLabels[school.club] + ' · Current' : kind === 'conduct' ? conductLabels[school.conduct] : effortLabels[education.effort];
    const club = school.club === 'music' ? 'science' : 'music', conduct = school.conduct === 'helpful' ? 'quiet' : 'helpful', effort = education.effort === 'focused' ? 'balanced' : 'focused';
    const changedLabel = kind === 'club' ? clubLabels[club] : kind === 'conduct' ? conductLabels[conduct] : effortLabels[effort];
    const command: GameCommand = kind === 'club' ? { type: 'school-club', communityId: school.id, club } : kind === 'conduct' ? { type: 'school-conduct', communityId: school.id, conduct } : { type: 'study-effort', effort };
    const predicted = resolveCommand(before, command, true), commit = jest.spyOn(repository, 'commit'), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
    const view = render(frame());

    await act(async () => { mockStore.setState({ busy: true }); });
    for (const name of [/^Extracurricular Activities/, /^Behave in Class/, /^Study Routine/]) expect(screen.getByRole('button', { name })).toBeDisabled();
    fireEvent.press(screen.getByRole('button', { name: title }));
    expect(screen.queryByRole('button', { name: confirm })).toBeNull();
    await act(async () => { mockStore.setState({ busy: false }); });

    await press(title);
    const current = screen.getByRole('radio', { name: currentLabel + '. ' + currentReason });
    expect(current).toBeDisabled(); fireEvent.press(current);
    expect(screen.getByRole('button', { name: confirm })).toBeDisabled(); await press(confirm);
    fireEvent.press(screen.getByRole('radio', { name: changedLabel }));
    expect(screen.getByRole('button', { name: confirm })).toBeEnabled(); await press('Never mind');
    expect(commit).not.toHaveBeenCalled(); expect(unpack).not.toHaveBeenCalled(); expect(world()).toBe(before); expect(rows()).toEqual(beforeRows);

    await press(title); expect(screen.getByRole('button', { name: confirm })).toBeDisabled();
    fireEvent.press(screen.getByRole('radio', { name: changedLabel }));
    sqlite.exec("CREATE TRIGGER fail_school_draft BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    let releaseSave!: () => void;
    saveGate = new Promise(resolve => { releaseSave = resolve; });
    act(() => { fireEvent.press(screen.getByRole('button', { name: confirm })); });
    expect(mockStore.getState().busy).toBe(true); expect(screen.getByRole('button', { name: confirm })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Never mind' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: changedLabel, checked: true })).toBeDisabled(); expect(world()).toBe(before); expect(rows()).toEqual(beforeRows);
    saveGate = null; await act(async () => { releaseSave(); });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(screen.getByRole('radio', { name: changedLabel, checked: true })).toBeEnabled(); expect(screen.getByRole('button', { name: confirm })).toBeEnabled();
    expect(encodeWorld(world())).toBe(encoded); expect(rows()).toEqual(beforeRows);

    sqlite.exec('DROP TRIGGER fail_school_draft'); await press(confirm);
    expect(world()).toEqual(predicted); expect(commit).toHaveBeenCalledTimes(2); expect(unpack).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: confirm })).toBeNull(); expect(screen.queryByRole('alert')).toBeNull();
    const savedRows = rows(), resultPayload = sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(before.id)?.payload;
    expect(sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(before.id)?.payload).toBe(beforePayload);
    unpack.mockRestore(); commit.mockRestore();
    await act(async () => { await cold(); }); view.rerender(frame());
    expect(world()).toEqual(predicted); expect(rows()).toEqual(savedRows);
    expect(predicted.pending?.kind).toBe('result');
    const acknowledged = resolveCommand(predicted, { type: 'acknowledge', resultId: predicted.pending!.id }, true);
    await press('Continue'); expect(world()).toEqual(acknowledged); expect(world().random).toEqual(before.random);
    expect(world().schoolCommunities.map(item => ({ periods: item.periods, exams: item.exams, help: item.help }))).toEqual(before.schoolCommunities.map(item => ({ periods: item.periods, exams: item.exams, help: item.help })));
    expect(world().people[before.activePersonId].skills).toEqual(before.people[before.activePersonId].skills);
    expect(sqlite.prepare('SELECT payload FROM backups WHERE life_id=?').get(before.id)?.payload).toBe(resultPayload);
    expect(rows().snapshots).toEqual(beforeRows.snapshots); expect(rows().snapshot_metadata).toEqual(beforeRows.snapshot_metadata);
    for (const moment of archive.snapshots) expect(sqlite.prepare('SELECT payload FROM snapshots WHERE snapshot_id=?').get(moment.summary.id)?.payload).toBe(moment.payload);

    const finalRows = rows(), finalWorld = world(); await press(title);
    expect(screen.getByRole('radio', { name: changedLabel + (kind === 'club' ? ' · Current' : '') + '. ' + currentReason })).toBeDisabled();
    expect(screen.getByRole('button', { name: confirm })).toBeDisabled(); await press(confirm); await press('Never mind');
    expect(world()).toBe(finalWorld); expect(rows()).toEqual(finalRows);
    view.unmount();
  } finally { jest.restoreAllMocks(); sqlite.close(); }
}, 60000);
