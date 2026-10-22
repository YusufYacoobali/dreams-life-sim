import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import * as Native from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { copyWorld, decodeWorld, encodeWorld, fullName, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { hobbyFee, leisurePayer } from '../../src/game/systems/leisure';
import { formatMoney } from '../../src/game/money';
import { countries } from '../../src/game/countries';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { ThemeProvider } from '../../src/ui/theme';
import { ActionRow } from '../../src/ui/components';
import { TravelArt } from '../../src/assets/TravelArt';
import { travelArtIds } from '../../src/assets/travelLayout';
import { HobbyRoutine } from '../../src/ui/HobbyRoutine';
import birth from '../fixtures/v6-birth-result.json';
import moveArchive from '../fixtures/v20-relocation-archive.json';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

let mockWorld: World;
let mockParams: { id?: string; route?: string } = { id: 'paris' };
const mockDispatch = jest.fn();
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react'), { Text } = require('react-native');
  const glyphs = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
  return ({ name,size,color }: { name:string;size:number;color:string }) => React.createElement(Text,{ accessible:false,style:{ fontFamily:'Ionicons',fontSize:size,color } },String.fromCodePoint(glyphs[name]));
});
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, useLocalSearchParams: () => mockParams }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: (state: unknown) => unknown) => selector({ world: mockWorld, busy: false, error: null, dispatch: mockDispatch }) }));
import Destination from '../../app/(game)/destination/[id]';
import Emigrate from '../../app/(game)/emigrate';
import Travel from '../../app/(game)/travel';
import Destinations from '../../app/(game)/destinations';

const frame = (children: React.ReactNode, dark = false, width = 320) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width, height: 700 }, insets: { top: 24, bottom: 24, left: 0, right: 0 } }}><ThemeProvider appearance={dark ? 'dark' : 'light'}>{children}</ThemeProvider></SafeAreaProvider>;
function familyWorld() {
  let world = decodeWorld(JSON.stringify(birth));
  while (world.pending) {
    const pending = world.pending;
    world = pending.kind === 'result' ? resolveCommand(world,{ type:'acknowledge',resultId:pending.id })
      : resolveCommand(world,{ type:'choose',eventId:pending.id,choiceId:pending.choices.find(choice => !choiceUnavailable(world,choice))!.id });
  }
  return world;
}
function approvedFamilyWorld() {
  const world = copyWorld(unpackCheckpoint(decodeSave(JSON.stringify(moveArchive)).snapshots[0].payload,true));
  // A read-only form fixture: an existing parent shares this address so the
  // approved offer can expose companion controls. No booking/move is resolved.
  const person = world.people[world.activePersonId], home = world.households.find(item => item.id === person.householdId)!;
  const member = Object.values(world.people).find(item => item.id !== person.id && !item.died)!;
  for (const household of world.households) household.members = household.members.filter(id => id !== member.id);
  world.households = world.households.filter(household => household.members.length > 0);
  member.householdId = home.id; member.country = person.country; member.city = person.city;
  home.members.push(member.id);
  return world;
}
afterEach(() => { jest.restoreAllMocks(); mockDispatch.mockReset(); });

test('travel illustrations fit the shared row icon column at small widths and large text, while hero art keeps its size', () => {
  jest.spyOn(Native,'useWindowDimensions').mockReturnValue({ width:320,height:700,scale:2,fontScale:1.6 });
  const view = render(frame(<View>{travelArtIds.map(id=><ActionRow key={id} title={'Visit '+id} icon={<TravelArt id={id} />} onPress={()=>{}} />)}</View>,true));
  for (const row of screen.getAllByRole('button')) {
    const iconColumn = row.findAllByType(View).find(node => StyleSheet.flatten(node.props.style)?.width === 40)!;
    const art = iconColumn.findByType(TravelArt).findByType(View);
    const bounds = StyleSheet.flatten(art.props.style);
    expect(bounds.width).toBeLessThanOrEqual(40); expect(bounds.height).toBeLessThanOrEqual(40);
    expect(bounds.flexShrink).toBe(0); expect(bounds.overflow).toBe('hidden');
    expect(art.findByType(Image).props.accessible).toBe(false);
  }
  view.rerender(frame(<TravelArt id="paris" width={250} />));
  expect(StyleSheet.flatten(screen.UNSAFE_getByType(TravelArt).findByType(View).props.style).width).toBe(250);
});

test.each([false,true])('trip companions start visibly unchecked and reopening clears the unsaved party (dark=%s)', dark => {
  jest.spyOn(Native,'useWindowDimensions').mockReturnValue({ width:320,height:700,scale:2,fontScale:dark ? 1.6 : 1 });
  mockWorld = familyWorld(); mockParams = { id:'paris' }; const before = encodeWorld(mockWorld);
  let view = render(frame(<Destination />,dark));
  const names = screen.getAllByRole('checkbox').map(node => node.props.accessibilityLabel as string);
  expect(names.length).toBeGreaterThan(0);
  names.forEach(name => {
    const checkbox = screen.getByRole('checkbox',{ name,checked:false });
    expect(checkbox).toBeOnTheScreen(); expect(checkbox.findByType(Ionicons).props.name).toBe('square-outline');
  });
  fireEvent.press(screen.getByRole('checkbox',{ name:names[0] }));
  expect(screen.getByRole('checkbox',{ name:names[0],checked:true })).toBeOnTheScreen();
  expect(screen.getByRole('checkbox',{ name:names[0] }).findByType(Ionicons).props.name).toBe('checkbox');
  expect(encodeWorld(mockWorld)).toBe(before); expect(mockDispatch).not.toHaveBeenCalled();
  view.unmount(); view = render(frame(<Destination />,dark));
  names.forEach(name => expect(screen.getByRole('checkbox',{ name,checked:false })).toBeOnTheScreen());
  fireEvent.press(screen.getByRole('checkbox',{ name:names[0] }));
  mockParams = { id:'tokyo' }; view.rerender(frame(<Destination />,dark));
  names.forEach(name => expect(screen.getByRole('checkbox',{ name,checked:false })).toBeOnTheScreen());
  expect(encodeWorld(mockWorld)).toBe(before); expect(mockDispatch).not.toHaveBeenCalled();
});

test.each([false,true])('approved emigration begins with nobody invited and reopens unchecked (dark=%s)', dark => {
  jest.spyOn(Native,'useWindowDimensions').mockReturnValue({ width:320,height:700,scale:2,fontScale:dark ? 1.6 : 1 });
  mockWorld = approvedFamilyWorld(); mockParams = {}; const before = encodeWorld(mockWorld);
  let view = render(frame(<Emigrate />,dark));
  const names = screen.getAllByRole('checkbox').map(node=>node.props.accessibilityLabel as string);
  expect(names.length).toBeGreaterThan(0);
  names.forEach(name=> {
    const checkbox = screen.getByRole('checkbox',{ name,checked:false });
    expect(checkbox).toBeOnTheScreen(); expect(checkbox.findByType(Ionicons).props.name).toBe('square-outline');
  });
  fireEvent.press(screen.getByRole('checkbox',{ name:names[0] }));
  expect(screen.getByRole('checkbox',{ name:names[0],checked:true })).toBeOnTheScreen();
  expect(screen.getByRole('checkbox',{ name:names[0] }).findByType(Ionicons).props.name).toBe('checkbox');
  view.unmount(); view = render(frame(<Emigrate />,dark));
  names.forEach(name=>expect(screen.getByRole('checkbox',{ name,checked:false })).toBeOnTheScreen());
  expect(encodeWorld(mockWorld)).toBe(before); expect(mockDispatch).not.toHaveBeenCalled();
});

test('guitar review is short and retains the real fee, responsible payer and pause terms', () => {
  mockWorld = familyWorld(); const person = mockWorld.people[mockWorld.activePersonId], payer = leisurePayer(mockWorld)!;
  const before = encodeWorld(mockWorld), view = render(frame(<HobbyRoutine kind="guitar" />));
  fireEvent.press(screen.getByRole('radio',{ name:'Guided lessons' }));
  fireEvent.press(screen.getByRole('button',{ name:'Review Hobby Routine' }));
  const modal = within(screen.UNSAFE_getByType(Native.Modal));
  expect(modal.getByText('Responsible payer')).toBeOnTheScreen();
  expect(modal.getByText(fullName(payer))).toBeOnTheScreen();
  const fee = formatMoney({ minor:hobbyFee(person.country,'guitar','lessons'),currency:countries[person.country].currency },countries[person.country].locale);
  expect(modal.getByText(fee)).toBeOnTheScreen();
  expect(modal.getByText('When you cannot attend or afford it')).toBeOnTheScreen();
  expect(modal.getByText('Shared equipment and materials')).toBeOnTheScreen();
  expect(modal.queryByText(/Actual attended months offer/)).toBeNull();
  expect(encodeWorld(mockWorld)).toBe(before); expect(mockDispatch).not.toHaveBeenCalled(); view.unmount();
});

test('optionally capture production travel, emigration and hobby review trees', () => {
  const directory = process.env.DREAMS_POLISH_CAPTURE_DIR;
  if (!directory) return;
  mkdirSync(directory,{ recursive:true });
  const clean = (node:any):any => Array.isArray(node) ? node.map(clean) : !node || typeof node !== 'object' ? node : ({
    type:node.type,props:{ style:StyleSheet.flatten(node.props?.style),source:node.props?.source,
      svg:node.type?.startsWith('RNSVG') ? Object.fromEntries(['d','name','clipPath','matrix','x','y','width','height','minX','minY','vbWidth','vbHeight','src','align'].filter(key=>node.props?.[key]!==undefined).map(key=>[key,node.props[key]])) : undefined,
      contentContainerStyle:StyleSheet.flatten(node.props?.contentContainerStyle),edges:node.props?.edges,
      accessibilityRole:node.props?.accessibilityRole,accessibilityLabel:node.props?.accessibilityLabel },children:node.children?.map(clean) });
  const dimensions = jest.spyOn(Native,'useWindowDimensions');
  for (const dark of [false,true]) {
    const width = dark ? 320 : 390;
    dimensions.mockReturnValue({ width,height:700,scale:2,fontScale:dark ? 1.6 : 1 });
    mockWorld = familyWorld(); mockParams = { id:'paris' };
    let view = render(frame(<Travel />,dark,width));
    writeFileSync(join(directory,dark?'travel-dark-large.json':'travel-light.json'),JSON.stringify(clean(view.toJSON()))); view.unmount();
    view = render(frame(<Destinations />,dark,width));
    writeFileSync(join(directory,dark?'destinations-dark-large.json':'destinations-light.json'),JSON.stringify(clean(view.toJSON()))); view.unmount();
    view = render(frame(<Destination />,dark,width));
    writeFileSync(join(directory,dark?'trip-companions-dark-large.json':'trip-companions-light.json'),JSON.stringify(clean(view.toJSON()))); view.unmount();
    mockWorld = approvedFamilyWorld(); mockParams = {};
    view = render(frame(<Emigrate />,dark,width));
    writeFileSync(join(directory,dark?'emigration-dark-large.json':'emigration-light.json'),JSON.stringify(clean(view.toJSON()))); view.unmount();
  }
  dimensions.mockReturnValue({ width:390,height:700,scale:2,fontScale:1 });
  mockWorld = familyWorld(); const before = encodeWorld(mockWorld);
  const view = render(frame(<HobbyRoutine kind="guitar" />,false,390));
  fireEvent.press(screen.getByRole('radio',{ name:'Guided lessons' }));
  fireEvent.press(screen.getByRole('button',{ name:'Review Hobby Routine' }));
  writeFileSync(join(directory,'hobby-review.json'),JSON.stringify(clean(view.toJSON())));
  expect(encodeWorld(mockWorld)).toBe(before); expect(mockDispatch).not.toHaveBeenCalled(); view.unmount();
});
