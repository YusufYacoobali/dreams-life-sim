import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { encodeWorld, fullName } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { randomInteger } from '../../src/game/random';
import * as eventRarity from '../../src/game/content/eventRarity';
import { relationFor } from '../../src/game/systems/relationships';
import { SaveRepository } from '../../src/persistence/repository';
import * as checkpoints from '../../src/persistence/checkpoints';
import { database } from '../support/sqlite';
import { adultSocial } from '../support/adultSocial';
import { ThemeProvider } from '../../src/ui/theme';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() }, Redirect: () => null }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Life from '../../app/(game)/(tabs)/life';
import { PendingEvent } from '../../src/ui/PendingEvent';
const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><Life /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string) => { await act(async () => fireEvent.press(screen.getByRole('button', { name }))); };

// A declared UI-unit selector arrangement: the real annual engine still checks
// eligibility, advances months and binds its own people/effects. Preserve its
// one selection draw; only the eligible ticket is arranged, without seed search.
function arrangeEligibleTicket(templateId: string) {
  const select = eventRarity.weightedEvent; let arranged = false;
  return jest.spyOn(eventRarity, 'weightedEvent').mockImplementation((pool, draw) => {
    const index = pool.findIndex(template => template.id === templateId);
    if (arranged || index < 0) return select(pool, draw);
    arranged = true;
    const ticket = pool.slice(0, index).reduce((sum, template) => sum + eventRarity.eventWeight(template), 0);
    return select(pool, total => { draw(total); return ticket; });
  });
}
afterEach(() => { jest.restoreAllMocks(); });

test.each([['friend-different-budget', 'walk', 'friend'], ['partner-money-conversation', 'honest', 'partner']] as const)('Age Up with an arranged eligible ticket binds %s; failed choice %s rolls back, retries warm and cold-acknowledges the named %s once', async (templateId, choiceId, type) => {
  const { world: initial, friendId, partnerId } = adultSocial(), otherId = type === 'friend' ? friendId : partnerId;
  initial.random.events = 1; expect(randomInteger(1, 1, 100).value).toBe(63);
  arrangeEligibleTicket(templateId);
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.create(initial);
  const boot = async (repo = repository) => { mockStore = createGameStore({ repository: async () => repo, date: () => initial.date, id: () => 'unused' }); await mockStore.getState().bootstrap(); };
  await boot(); let view = render(frame()); await press('Age Up'); await waitFor(() => expect(mockStore.getState().world!.pending).toMatchObject({ kind: 'decision', templateId }));
  const offered = mockStore.getState().world!; if (offered.pending?.kind !== 'decision') throw new Error('Missing adult social scene'); const event = offered.pending, choice = event.choices.find(item => item.id === choiceId)!;
  expect(offered.annual?.stage).toBe('complete');
  expect(event.personIds).toEqual([offered.activePersonId, otherId]); expect(screen.getByText(event.body)).toBeOnTheScreen(); expect(event.body).toContain(fullName(offered.people[otherId]));
  const before = encodeWorld(offered), rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => [row.name, sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all()])), originalRows = rows();
  const unpack = jest.spyOn(checkpoints, 'unpackCheckpoint'); sqlite.exec("CREATE TRIGGER fail_adult_story BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press(choice.label); await waitFor(() => expect(mockStore.getState().error).toMatch(/couldn't be saved/)); expect(encodeWorld(mockStore.getState().world!)).toBe(before); expect(rows()).toEqual(originalRows);
  sqlite.exec('DROP TRIGGER fail_adult_story'); await press(choice.label); await waitFor(() => expect(screen.getByText(choice.resultTitle)).toBeOnTheScreen()); const result = mockStore.getState().world!;
  expect(result).toEqual(resolveCommand(offered, { type: 'choose', eventId: event.id, choiceId }, true)); expect(unpack).not.toHaveBeenCalled(); unpack.mockRestore();
  expect(result.accounts).toEqual(offered.accounts); expect(result.ledger).toEqual(offered.ledger); expect(result.workHistory).toEqual(offered.workHistory); expect(result.people[otherId]).toEqual(offered.people[otherId]);
  const effect = choice.effects.find(item => item.kind === 'relationship'); if (effect?.kind !== 'relationship') throw new Error('Missing named bond'); expect(effect.relationshipId).toBe(relationFor(offered, offered.activePersonId, otherId)!.id);
  expect(relationFor(result, offered.activePersonId, otherId)!.strength).toBe(Math.min(100, relationFor(offered, offered.activePersonId, otherId)!.strength + effect.delta));
  view.unmount(); await boot(new SaveRepository(driver)); view = render(frame()); expect(mockStore.getState().world).toEqual(result); expect(screen.getByText(choice.resultTitle)).toBeOnTheScreen(); await press('Continue');
  const done = mockStore.getState().world!; expect(done).toEqual(resolveCommand(result, { type: 'acknowledge', resultId: result.pending!.id }, true)); expect(done.pending).toBeNull(); expect(done.annual).toBeNull(); expect(done.people).toEqual(result.people); expect(done.relationships).toEqual(result.relationships); expect(done.random).toEqual(result.random); expect(done.journal.filter(item => item.text === choice.journal)).toHaveLength(1);
  expect(await repository.load(done.id)).toEqual(done); view.unmount(); sqlite.close();
}, 30000);
