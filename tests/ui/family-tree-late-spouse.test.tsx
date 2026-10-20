import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { createGameStore } from '../../src/state/gameStore';
import { ageOn, decodeWorld, encodeWorld, fullName, type World } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { childrenOf, divorceQuote } from '../../src/game/systems/family';
import { otherPerson, partnerRelation } from '../../src/game/systems/relationships';
import * as checkpoints from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import marriage from '../fixtures/v5-marriage-result.json';
import birth from '../fixtures/v6-birth-result.json';
import pension from '../fixtures/v17-pension-archive.json';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import FamilyTree from '../../app/(game)/family-tree';

const frame = () => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider><FamilyTree /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => { fireEvent.press(screen.getByRole('button', { name })); }); };
const personButton = (world: World, id: string) => new RegExp('^' + fullName(world.people[id]).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.');
const acknowledge = (world: World) => resolveCommand(world, { type: 'acknowledge', resultId: world.pending!.id });

function open(input: World) {
  // This is a read-only route/codec regression, not a SQLite or natural-life test.
  const canonical = encodeWorld(input), initial = decodeWorld(canonical, true);
  const repository = jest.fn(async () => { throw new Error('Family Tree must not request persistence'); });
  mockStore = createGameStore({ repository, date: () => initial.date, id: () => 'unused' });
  mockStore.setState({ world: initial, ready: true });
  const dispatch = jest.spyOn(mockStore.getState(), 'dispatch'), unpack = jest.spyOn(checkpoints, 'unpackCheckpoint');
  return { initial, canonical, unchanged: (expected = initial) => {
    expect(mockStore.getState().world).toBe(expected); expect(encodeWorld(expected)).toBe(canonical);
    expect(repository).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled(); expect(unpack).not.toHaveBeenCalled();
  } };
}

test.each([['childless', marriage], ['with the genuine child', birth]] as const)('an actual retained marriage keeps its deceased spouse %s, once, with exact identity and read-only navigation', async (_scope, fixture) => {
  const sourceBytes = JSON.stringify(fixture), recorded = decodeWorld(sourceBytes), married = _scope === 'childless' ? acknowledge(recorded) : recorded, spouse = otherPerson(married, partnerRelation(married)!);
  expect(childrenOf(married)).toHaveLength(_scope === 'childless' ? 0 : 1);
  // Explicitly arranged mortality boundary on the genuine existing paid marriage.
  // No new spouse, marriage, child, date, stats, cash or RNG is manufactured.
  recordDeath(married, spouse.id, 'Explicit Family Tree mortality-boundary regression');
  expect(partnerRelation(married)).toBeUndefined();
  expect(married.marriages.find(item => item.a === spouse.id || item.b === spouse.id)).toMatchObject({ ended: married.date, endReason: 'death' });
  const context = open(married), view = render(frame());
  try {
    const spouseRow = screen.getByRole('button', { name: personButton(context.initial, spouse.id) });
    expect(screen.getAllByRole('button', { name: personButton(context.initial, spouse.id) })).toHaveLength(1);
    expect(spouseRow.props.accessibilityLabel).toContain('Late spouse · Age ');
    expect(spouseRow.props.accessibilityLabel).toContain('Died ' + married.date.year);
    for (const child of childrenOf(context.initial)) {
      expect(context.initial.relationships.filter(edge => edge.roles.includes('parent') && edge.to === child.id)).toHaveLength(2);
      expect(screen.getAllByRole('button', { name: personButton(context.initial, child.id) })).toHaveLength(1);
    }
    for (const edge of context.initial.relationships.filter(item => item.roles.includes('parent') && item.to === context.initial.activePersonId)) expect(screen.getByRole('button', { name: personButton(context.initial, edge.from) })).toBeOnTheScreen();
    await press(personButton(context.initial, spouse.id)); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/person/[id]', params: { id: spouse.id } });
    await press(personButton(context.initial, context.initial.activePersonId)); expect(router.push).toHaveBeenLastCalledWith('/profile');
    await press('Back'); expect(router.back).toHaveBeenCalledTimes(1); context.unchanged();
    const reopened = decodeWorld(context.canonical, true); await act(async () => { mockStore.setState({ world: reopened }); });
    expect(reopened).toEqual(context.initial); expect(encodeWorld(reopened)).toBe(context.canonical);
    expect(screen.getAllByRole('button', { name: personButton(reopened, spouse.id) })).toHaveLength(1);
    expect(screen.getByRole('button', { name: personButton(reopened, spouse.id) }).props.accessibilityLabel).toContain('Late spouse');
    context.unchanged(reopened);
    expect(JSON.stringify(fixture)).toBe(sourceBytes);
  } finally { view.unmount(); jest.restoreAllMocks(); }
});

test('a genuinely divorced childless former spouse is not relabelled as a late spouse after death', () => {
  let current = acknowledge(decodeWorld(JSON.stringify(marriage))); const spouse = otherPerson(current, partnerRelation(current)!);
  current = acknowledge(resolveCommand(current, { type: 'divorce', personId: spouse.id, custody: 'shared', quotedPayment: divorceQuote(current, spouse.id).signed }));
  recordDeath(current, spouse.id, 'Explicit divorced-person mortality-boundary regression');
  expect(current.marriages.find(item => item.a === spouse.id || item.b === spouse.id)?.endReason).toBe('divorce');
  const context = open(current), view = render(frame());
  try {
    expect(screen.queryByRole('button', { name: personButton(current, spouse.id) })).toBeNull();
    expect(screen.queryByText(/Late spouse/)).toBeNull(); context.unchanged();
  } finally { view.unmount(); jest.restoreAllMocks(); }
});

test('the genuine pension archive retains its deceased parent through existing family edges without inventing a player spouse', async () => {
  const current = checkpoints.unpackCheckpoint(pension.checkpoint), endedMarriage = current.marriages.find(item => item.endReason === 'death')!;
  expect(endedMarriage).toBeDefined(); expect([endedMarriage.a, endedMarriage.b]).not.toContain(current.activePersonId);
  const deceased = [endedMarriage.a, endedMarriage.b].find(id => current.people[id].died)!;
  expect(current.relationships.some(edge => edge.from === deceased && edge.to === current.activePersonId && edge.roles.includes('parent'))).toBe(true);
  const context = open(current), view = render(frame());
  try {
    // This genuine world has two people called Sora Romano; age/death labels
    // distinguish the actual recorded parent instead of assuming names are IDs.
    const person = current.people[deceased], label = fullName(person) + '. Age ' + ageOn(person, current.date) + ' · Died ' + person.died!.year;
    const row = screen.getByRole('button', { name: label });
    expect(row.props.accessibilityLabel).toContain('Died ' + current.people[deceased].died!.year);
    expect(row.props.accessibilityLabel).not.toContain('Late spouse');
    await press(label); expect(router.push).toHaveBeenLastCalledWith({ pathname: '/person/[id]', params: { id: deceased } }); context.unchanged();
  } finally { view.unmount(); jest.restoreAllMocks(); }
});
