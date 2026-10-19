import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld } from '../../src/game/model';
import { decodeSave } from '../../src/persistence/archive';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import archive from '../fixtures/v28-ordinary-hobby-archive.json';
import nativeArchive from '../../docs/verification/android24-opening-20261019/custom-result-save.json';

let mockStore: ReturnType<typeof createGameStore>, mockRepository: SaveRepository;
let sqlite: ReturnType<typeof database>['sqlite'];
const mockFiles = new Map<string, string>(), mockDeleted: string[] = [];
const mockPickDirectory = jest.fn(), mockPickFile = jest.fn(), mockShareAvailable = jest.fn(), mockShare = jest.fn();
let mockWriteError: Error | null = null, mockReadError: Error | null = null;
let folder: { createFile: jest.Mock };
jest.mock('expo-router', () => ({ router: { back: jest.fn(), replace: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
jest.mock('../../src/persistence/native', () => ({ openRepository: async () => mockRepository }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: () => mockShareAvailable(), shareAsync: (...args: unknown[]) => mockShare(...args) }));
jest.mock('expo-file-system', () => ({
  Directory: { pickDirectoryAsync: () => mockPickDirectory() }, Paths: { cache: 'file:///cache' },
  File: class {
    static pickFileAsync: (...args: unknown[]) => Promise<unknown> = (...args) => mockPickFile(...args);
    uri: string;
    constructor(...parts: string[]) { this.uri = parts.join('/'); }
    get size() { return Buffer.byteLength(mockFiles.get(this.uri) ?? ''); }
    write(text: string) { mockFiles.set(this.uri, text); if (mockWriteError) throw mockWriteError; }
    async text() { if (mockReadError) throw mockReadError; if (!mockFiles.has(this.uri)) throw new Error('File unavailable'); return mockFiles.get(this.uri)!; }
    delete() { mockDeleted.push(this.uri); mockFiles.delete(this.uri); }
  },
}));
import { router } from 'expo-router';
import { File } from 'expo-file-system';
import SavedLives from '../../app/saved-lives';

const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, bottom: 48, left: 0, right: 0 } }}><ThemeProvider><SavedLives /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const exportButton = /^Export save file\./, shareButton = /^Share save file\./;
const tables = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()]));

beforeEach(async () => {
  mockFiles.clear(); mockDeleted.length = 0; mockWriteError = null; mockReadError = null;
  mockPickDirectory.mockReset(); mockPickFile.mockReset(); mockShareAvailable.mockReset(); mockShare.mockReset();
  mockShareAvailable.mockResolvedValue(true); mockShare.mockResolvedValue(undefined);
  folder = { createFile: jest.fn((name: string) => new File('content://selected-folder/' + name)) }; mockPickDirectory.mockResolvedValue(folder);
  const opened = database(); sqlite = opened.sqlite; mockRepository = new SaveRepository(opened.driver); await mockRepository.initialise(); await mockRepository.import(JSON.stringify(archive));
  mockStore = createGameStore({ repository: async () => mockRepository, date: () => ({ year: 2026, month: 10, day: 19 }), id: () => 'unused' }); await mockStore.getState().bootstrap();
});
afterEach(() => { sqlite.close(); });

test.each(['ERR_PICKER_CANCELLED', 'ERR_FILE_PICKING_CANCELLED'])('%s closes folder selection without an error, file or changed save', async code => {
  const before = tables(); mockPickDirectory.mockRejectedValueOnce(Object.assign(new Error('Picker cancelled'), { code })); render(frame());
  await press(exportButton); await waitFor(() => expect(screen.getByRole('button', { name: exportButton })).toBeEnabled());
  expect(screen.queryByText(/cancelled|Saved Dreams-save/)).toBeNull(); expect(folder.createFile).not.toHaveBeenCalled(); expect(mockFiles.size).toBe(0); expect(tables()).toEqual(before);
});

test('folder export guards duplicate taps, preserves all nine original moments and writes a separate complete copy on each successful export', async () => {
  const before = tables(), world = mockStore.getState().world!; let finish!: (value: typeof folder) => void;
  mockPickDirectory.mockReturnValueOnce(new Promise(resolve => { finish = resolve; })); render(frame());
  const submit = screen.getByRole('button', { name: exportButton });
  act(() => { fireEvent.press(submit); fireEvent.press(submit); }); expect(mockPickDirectory).toHaveBeenCalledTimes(1);
  await act(async () => { finish(folder); }); await waitFor(() => expect(screen.getByText(/^Saved Dreams-save-/)).toBeOnTheScreen());
  const first = [...mockFiles.entries()][0]; expect(first[0]).toMatch(/^content:\/\/selected-folder\/Dreams-save-[\w.-]+\.dreams\.json$/);
  expect(decodeSave(first[1]).world).toEqual(world); expect(decodeSave(first[1]).snapshots).toEqual(archive.snapshots);
  expect(folder.createFile).toHaveBeenCalledWith(expect.any(String), 'application/json'); expect(mockShare).not.toHaveBeenCalled();
  await press(exportButton); await waitFor(() => expect(mockFiles.size).toBe(2));
  expect(mockFiles.get(first[0])).toBe(first[1]); expect(new Set([...mockFiles.keys()]).size).toBe(2);
  for (const text of mockFiles.values()) { expect(decodeSave(text).world).toEqual(world); expect(decodeSave(text).snapshots).toEqual(archive.snapshots); }
  expect(encodeWorld(mockStore.getState().world!)).toBe(encodeWorld(world)); expect(tables()).toEqual(before);
});

test('a failed folder write removes its incomplete new file and can retry without modifying the live, backup, receipts or original moments', async () => {
  const before = tables(); mockWriteError = new Error("Call to FileSystemFile.write rejected: Missing WRITE permission"); render(frame()); await press(exportButton);
  await waitFor(() => expect(screen.getByText('Could not save a copy to that folder. Choose another folder and try again.')).toBeOnTheScreen());
  expect(screen.queryByText(/FileSystemFile|Missing WRITE/)).toBeNull();
  expect(mockDeleted).toHaveLength(1); expect(mockFiles.size).toBe(0); expect(screen.queryByText(/^Saved Dreams-save-/)).toBeNull(); expect(tables()).toEqual(before);
  mockWriteError = null; await press(exportButton); await waitFor(() => expect(screen.getByText(/^Saved Dreams-save-/)).toBeOnTheScreen());
  expect(mockFiles.size).toBe(1); expect(decodeSave([...mockFiles.values()][0]).snapshots).toEqual(archive.snapshots); expect(tables()).toEqual(before);
});

test('an unwritable destination reports the failure before creating a file, and sharing remains a separate valid-copy action', async () => {
  const before = tables(); folder.createFile.mockImplementationOnce(() => { throw new Error('Folder is read-only'); }); render(frame());
  await press(exportButton); await waitFor(() => expect(screen.getByText('Could not save a copy to that folder. Choose another folder and try again.')).toBeOnTheScreen()); expect(mockFiles.size).toBe(0);
  mockShareAvailable.mockResolvedValueOnce(false); await press(shareButton); await waitFor(() => expect(screen.getByText('File sharing is unavailable on this device. Save a copy to a folder instead.')).toBeOnTheScreen()); expect(mockShare).not.toHaveBeenCalled(); expect(mockFiles.size).toBe(0);
  await press(shareButton); await waitFor(() => expect(mockShare).toHaveBeenCalledTimes(1));
  const [uri, options] = mockShare.mock.calls[0]; expect(uri).toMatch(/^file:\/\/\/cache\/Dreams-save-/); expect(options).toMatchObject({ mimeType: 'application/json', UTI: 'public.json' });
  const copied = decodeSave(mockFiles.get(uri)!); expect(copied.world).toEqual(mockStore.getState().world); expect(copied.snapshots).toEqual(archive.snapshots); expect(tables()).toEqual(before);
});

test('native file import can cancel or reject invalid content, then previews and imports the genuine native birthday result while retaining the original reading life', async () => {
  const before = tables(), original = mockStore.getState().world!; mockPickFile.mockResolvedValueOnce({ canceled: true, result: null }); render(frame());
  await press('Import a Save'); expect(tables()).toEqual(before);
  mockFiles.set('file:///picked/bad.json', '{broken'); mockPickFile.mockResolvedValueOnce({ canceled: false, result: new File('file:///picked/bad.json') });
  await press('Import a Save'); await waitFor(() => expect(screen.getByText('This file is not a supported, valid Dreams save. Your lives have not changed.')).toBeOnTheScreen()); expect(tables()).toEqual(before);
  const text = JSON.stringify(nativeArchive); mockFiles.set('file:///picked/native.json', text); mockPickFile.mockResolvedValue({ canceled: false, result: new File('file:///picked/native.json') });
  mockReadError = new Error("Call to FileSystemFile.text rejected: Missing READ permission");
  await press('Import a Save'); await waitFor(() => expect(screen.getByText('Could not read the selected file. Choose another copy and try again.')).toBeOnTheScreen());
  expect(screen.queryByText(/FileSystemFile|Missing READ/)).toBeNull(); expect(tables()).toEqual(before); mockReadError = null;
  await press('Import a Save'); await waitFor(() => expect(screen.getByText('Import this life?')).toBeOnTheScreen()); expect(tables()).toEqual(before);
  await press('Never mind'); expect(tables()).toEqual(before); expect(mockStore.getState().world).toEqual(original);
  await press('Import a Save'); await waitFor(() => expect(screen.getByText('Import this life?')).toBeOnTheScreen()); await press('Import Life');
  await waitFor(() => expect(mockStore.getState().world?.id).toBe(decodeSave(text).world.id)); expect(router.replace).toHaveBeenLastCalledWith('/life');
  expect(mockStore.getState().world).toEqual(decodeSave(text).world); expect(mockStore.getState().world?.pending).toMatchObject({ kind: 'result', title: 'The photograph survives' });
  expect(await mockRepository.load(original.id)).toEqual(original); expect(JSON.parse(await mockRepository.export(original.id)).snapshots).toEqual(archive.snapshots); expect(await mockRepository.list()).toHaveLength(2);
});
