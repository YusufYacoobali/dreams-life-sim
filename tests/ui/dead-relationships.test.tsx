import React from 'react';
import * as Native from 'react-native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { copyWorld, encodeWorld, immutableWorld, type World } from '../../src/game/model';
import { monthFrom } from '../../src/game/calendar';
import { createLife, randomCreation } from '../../src/game/createLife';
import { recordDeath } from '../../src/game/engine';
import { createContact } from '../../src/game/systems/npcs';
import { connectPerson } from '../../src/game/systems/relationshipContacts';
import { decodeSave } from '../../src/persistence/archive';
import { SaveRepository } from '../../src/persistence/repository';
import { relationshipContacts, relationshipFilters } from '../../src/ui/relationshipFilters';
import { RelationshipRow } from '../../src/ui/RelationshipRow';
import { FilterTabs } from '../../src/ui/FilterTabs';
import { ThemeProvider } from '../../src/ui/theme';
import { database } from '../support/sqlite';
import creatorArchive from '../fixtures/v10-creator-archive.json';

let mockWorld: World;
const mockDispatch = jest.fn();
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() }, Redirect: () => null }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: (state: unknown) => unknown) => selector({ world: mockWorld, dispatch: mockDispatch, busy: false, error: null }) }));
import { router } from 'expo-router';
import Relationships from '../../app/(game)/(tabs)/relationships';

type Edge = World['relationships'][number];

function contactsFixture() {
  const world = copyWorld(decodeSave(JSON.stringify(creatorArchive)).world);
  // Prepare a saved view fixture using actual NPC/death lifecycles. No game
  // command runs while the player changes a filter or searches below.
  world.pending = null; world.pendingPriority = 0; world.annual = null; world.deferred = [];
  const add = (firstName: string, kind: Edge['kind'], reverse = false) => {
    const person = createContact(world, { age: 30 }); person.firstName = firstName; person.lastName = 'Test';
    connectPerson(world, person.id);
    const edge = world.relationships.find(item => item.from === world.activePersonId && item.to === person.id)!;
    edge.kind = kind; edge.roles = [kind]; edge.strength = 84;
    if (kind === 'partner') edge.romance = 'ex';
    if (reverse) { edge.from = person.id; edge.to = world.activePersonId; }
    return { person, edge };
  };
  const friend = add('Avery', 'friend');
  const coworker = add('Robin', 'coworker', true);
  const classmate = add('Casey', 'classmate');
  const teacher = add('Morgan', 'teacher', true);
  const partner = add('Taylor', 'partner');
  const older = add('Harper', 'friend', true);
  const recentTeacher = add('Iris', 'teacher');
  const recentPartner = add('Rowan', 'partner', true);
  const parent = world.relationships.find(edge => edge.to === world.activePersonId && edge.roles.includes('parent') && !world.people[edge.from].died)!;
  recordDeath(world, older.person.id, 'a long illness');
  world.date = monthFrom(world.date, 1);
  recordDeath(world, recentTeacher.person.id, 'Natural causes');
  recordDeath(world, recentPartner.person.id, 'an accident');
  recordDeath(world, parent.from, 'Natural causes');
  return { world: immutableWorld(world), friend, coworker, classmate, teacher, partner, older, recentTeacher, recentPartner, parent };
}

const visible = () => screen.UNSAFE_getByType(Native.FlatList).props.data as Edge[];
const select = (name: string) => fireEvent.press(screen.getByRole('tab', { name }));
afterEach(() => { jest.restoreAllMocks(); });

test.each([false, true])('active tabs exclude deaths; Dead keeps sorted memorials, search, navigation and saved bytes (dark=%s)', async dark => {
  const fixture = contactsFixture(), { world, friend, coworker, classmate, teacher, partner, older, recentTeacher, recentPartner, parent } = fixture;
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.create(world);
  mockWorld = await repository.load(world.id);
  const encoded = encodeWorld(mockWorld), payload = sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(world.id)!.payload;
  jest.spyOn(Native, 'useWindowDimensions').mockReturnValue({ width: dark ? 320 : 390, height: 568, scale: 2, fontScale: dark ? 1.5 : 1 });
  const scroll = jest.spyOn(Native.FlatList.prototype, 'scrollToOffset').mockImplementation(() => {});
  const view = render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: dark ? 320 : 390, height: 568 }, insets: { top: 20, bottom: 0, left: 0, right: 0 } }}><ThemeProvider appearance={dark ? 'dark' : 'light'}><Relationships /></ThemeProvider></SafeAreaProvider>);
  try {
    const activeTabs = ['All', 'Family', 'Friends', 'Romance', 'Work / School'];
    for (const tab of activeTabs) {
      select(tab);
      expect(visible().every(edge => !mockWorld.people[edge.from === world.activePersonId ? edge.to : edge.from].died)).toBe(true);
      expect(visible()).not.toContainEqual(parent);
      expect(screen.getByRole('tab', { name: tab })).toHaveProp('accessibilityState', expect.objectContaining({ selected: true }));
    }
    select('Friends'); expect(visible().map(edge => edge.id)).toContain(friend.edge.id);
    select('Romance'); expect(visible().map(edge => edge.id)).toContain(partner.edge.id);
    select('Work / School'); expect(visible().map(edge => edge.id)).toEqual(expect.arrayContaining([coworker.edge.id, classmate.edge.id, teacher.edge.id]));
    select('Dead');
    const deceased = visible(), ids = deceased.map(edge => edge.id);
    expect(ids).toEqual(expect.arrayContaining([older.edge.id, recentTeacher.edge.id, recentPartner.edge.id, parent.id]));
    expect(deceased.every(edge => !!mockWorld.people[edge.from === world.activePersonId ? edge.to : edge.from].died)).toBe(true);
    expect(ids.indexOf(recentTeacher.edge.id)).toBeLessThan(ids.indexOf(older.edge.id));
    expect(ids.indexOf(recentTeacher.edge.id)).toBeLessThan(ids.indexOf(recentPartner.edge.id));
    const memorial = screen.getByRole('button', { name: /Iris Test\. Teacher · Deceased\. Natural causes\. Bond 84%/ });
    expect(within(memorial).getByText('Natural causes')).toBeOnTheScreen();
    const row = screen.UNSAFE_getAllByType(RelationshipRow).find(item => item.props.person.id === recentTeacher.person.id)!;
    expect(row.props.person.appearance).toEqual(recentTeacher.person.appearance); expect(row.props.strength).toBe(84);
    fireEvent.press(memorial); expect(router.push).toHaveBeenCalledWith({ pathname: '/person/[id]', params: { id: recentTeacher.person.id } });
    fireEvent.changeText(screen.getByLabelText('Search relationships'), '  iRiS  ');
    expect(visible().map(edge => edge.id)).toEqual([recentTeacher.edge.id]);
    select('All'); expect(visible()).toHaveLength(0); expect(screen.getByText('No matching names in this view.')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: 'Show All Connections' }));
    expect(screen.getByLabelText('Search relationships')).toHaveProp('value', '');
    expect(visible().some(edge => edge.id === friend.edge.id)).toBe(true);
    expect(scroll).toHaveBeenCalledWith({ offset: 0, animated: false });
    expect(screen.UNSAFE_getByType(FilterTabs).props.values).toEqual(relationshipFilters);
    for (const tab of screen.getAllByRole('tab')) expect(Native.StyleSheet.flatten(tab.props.style).minHeight).toBeGreaterThanOrEqual(48);
    fireEvent.press(screen.getByRole('button', { name: 'Household Pets' })); expect(router.push).toHaveBeenCalledWith('/pets');
    fireEvent.press(screen.getByRole('button', { name: 'Family Tree' })); expect(router.push).toHaveBeenCalledWith('/family-tree');
    expect(mockDispatch).not.toHaveBeenCalled(); expect(encodeWorld(mockWorld)).toBe(encoded);
    expect(sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(world.id)!.payload).toBe(payload);
  } finally { view.unmount(); sqlite.close(); }
});

test('the selector preserves original edge identities and keeps the saved graph order unchanged', () => {
  const { world } = contactsFixture(), before = encodeWorld(world), order = world.relationships.map(edge => edge.id);
  for (const filter of relationshipFilters) for (const query of ['', 'Test', 'no-such-person']) {
    expect(relationshipContacts(world, filter.id, query).every(edge => world.relationships.includes(edge))).toBe(true);
  }
  expect(world.relationships.map(edge => edge.id)).toEqual(order); expect(encodeWorld(world)).toBe(before);
});

test('an empty Dead view has a clear return to living connections', () => {
  mockWorld = immutableWorld(createLife('life_no_memorials', 0, { ...randomCreation(0), background: 'ordinary' }, { year: 2026, month: 10, day: 24 }));
  const encoded = encodeWorld(mockWorld), view = render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 320, height: 568 }, insets: { top: 20, bottom: 0, left: 0, right: 0 } }}><ThemeProvider><Relationships /></ThemeProvider></SafeAreaProvider>);
  select('Dead'); expect(visible()).toHaveLength(0); expect(screen.getByText('People you have lost will appear here.')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Show All Connections' }));
  expect(screen.getByRole('tab', { name: 'All' })).toHaveProp('accessibilityState', expect.objectContaining({ selected: true }));
  expect(visible().length).toBeGreaterThan(0); expect(encodeWorld(mockWorld)).toBe(encoded); view.unmount();
});
