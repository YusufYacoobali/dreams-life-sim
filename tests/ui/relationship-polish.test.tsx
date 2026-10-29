import React from 'react';
import * as Native from 'react-native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { decodeSave } from '../../src/persistence/archive';
import { encodeWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { ThemeProvider } from '../../src/ui/theme';
import childArchive from '../fixtures/v28-ordinary-hobby-archive.json';

let mockWorld: World, mockPersonId = 'person_parent1';
const mockDispatch = jest.fn();
jest.mock('expo-router', () => ({ router: { push: jest.fn(),back:jest.fn() },Redirect:()=>null,useLocalSearchParams:()=>({id:mockPersonId}) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: (state: unknown)=>unknown) => selector({world:mockWorld,dispatch:mockDispatch,busy:false,error:null}) }));
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react'), { Text } = require('react-native');
  const glyphs = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
  return ({ name, size, color, style, ...props }: any) => <Text {...props} allowFontScaling={false} style={[{ fontFamily: 'Ionicons', fontSize: size, color }, style]}>{String.fromCodePoint(glyphs[name] || glyphs['ellipse-outline'])}</Text>;
});
import Relationships from '../../app/(game)/(tabs)/relationships';
import PersonProfile from '../../app/(game)/person/[id]';
import { StatBar, StatTrack } from '../../src/ui/components';
import { RelationshipRow, affectionColor } from '../../src/ui/RelationshipRow';
import { lightColors } from '../../src/ui/theme';

function capture(name: string, tree: ReturnType<ReturnType<typeof render>['toJSON']>) {
  const directory = process.env.DREAMS_POLISH_CAPTURE_DIR;
  if (!directory) return;
  const clean = (node:any):any => Array.isArray(node) ? node.map(clean) : !node || typeof node !== 'object' ? node : ({
    type:node.type,props:{style:Native.StyleSheet.flatten(node.props?.style),source:node.props?.source,
      svg:node.type?.startsWith('RNSVG') ? Object.fromEntries(['d','name','clipPath','matrix','x','y','width','height','minX','minY','vbWidth','vbHeight','src','align'].filter(key=>node.props?.[key]!==undefined).map(key=>[key,node.props[key]])) : undefined,
      contentContainerStyle:Native.StyleSheet.flatten(node.props?.contentContainerStyle),edges:node.props?.edges,
      accessibilityRole:node.props?.accessibilityRole,accessibilityLabel:node.props?.accessibilityLabel,
      allowFontScaling:node.props?.allowFontScaling,resizeMode:node.props?.resizeMode,placeholder:node.props?.placeholder,value:node.props?.value},children:node.children?.map(clean)});
  mkdirSync(directory,{recursive:true});writeFileSync(join(directory,name+'.json'),JSON.stringify(clean(tree)));
}

afterEach(()=>jest.restoreAllMocks());

test('production relationship and person screens remain read-only and export review trees', () => {
  const initial = decodeSave(JSON.stringify(childArchive)).world;
  mockWorld = resolveCommand(initial,{type:'acknowledge',resultId:initial.pending!.id},true);
  const before = encodeWorld(mockWorld);
  for (const dark of [false,true]) {
    const width = dark ? 320 : 390, fontScale = dark ? 1.4 : 1;
    jest.spyOn(require('react-native'),'useWindowDimensions').mockReturnValue({width,height:844,scale:2,fontScale});
    const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{frame:{x:0,y:0,width,height:844},insets:{top:47,bottom:34,left:0,right:0}}}><ThemeProvider appearance={dark?'dark':'light'}>{child}</ThemeProvider></SafeAreaProvider>;
    const view = render(frame(<Relationships />));
    expect(screen.getByRole('header',{name:'Relationships'})).toBeOnTheScreen();
    capture('relationships-'+(dark?'dark-large':'light'),view.toJSON());
    view.rerender(frame(<PersonProfile />));
    expect(screen.getByRole('header',{name:'Person Profile'})).toBeOnTheScreen();
    capture('person-'+(dark?'dark-large':'light'),view.toJSON());
    view.unmount();jest.restoreAllMocks();
  }
  expect(encodeWorld(mockWorld)).toBe(before);
  expect(mockDispatch).not.toHaveBeenCalled();
});

test('affection tracks use red, amber and green at low, middling and strong bonds', () => {
  expect(affectionColor(0,lightColors)).toBe(lightColors.red);
  expect(affectionColor(34,lightColors)).toBe(lightColors.red);
  expect(affectionColor(35,lightColors)).toBe(lightColors.amber);
  expect(affectionColor(69,lightColors)).toBe(lightColors.amber);
  expect(affectionColor(70,lightColors)).toBe(lightColors.green);
  expect(affectionColor(100,lightColors)).toBe(lightColors.green);
});

test('a relationship row keeps its portrait and affection beside the name, as one named action', () => {
  mockWorld=decodeSave(JSON.stringify(childArchive)).world;
  const person=mockWorld.people.person_parent1, choose=jest.fn();
  render(<ThemeProvider><RelationshipRow person={person} name="Ruby Kelly" role="Mother" age={42} strength={24} first last onPress={choose} /></ThemeProvider>);
  const row=screen.getByRole('button',{name:'Ruby Kelly. Mother · Age 42. Bond 24%'});
  expect(Native.StyleSheet.flatten(row.props.style).flexDirection).toBe('row');
  expect(screen.queryAllByRole('image')).toHaveLength(0);
  expect(screen.queryAllByRole('progressbar')).toHaveLength(0);
  const track=screen.UNSAFE_getByType(StatTrack);
  expect(track.props.color).toBe(lightColors.red);
  expect(within(row).getByText('Mother · Age 42')).toBeOnTheScreen();
  fireEvent.press(row);expect(choose).toHaveBeenCalledTimes(1);
});

test('shared stat tracks are thicker and keep bounded accessible values at large text sizes', () => {
  jest.spyOn(require('react-native'),'useWindowDimensions').mockReturnValue({width:320,height:568,scale:2,fontScale:1.5});
  render(<ThemeProvider appearance="dark"><StatBar label="Happiness" value={120} color={lightColors.green} icon={<Native.View />} /></ThemeProvider>);
  expect(screen.getByRole('progressbar',{name:'Happiness'})).toHaveProp('accessibilityValue',{min:0,max:100,now:100});
  const track=screen.UNSAFE_getByType(StatTrack), nativeTrack=track.findAllByType(Native.View)[0];
  expect(Native.StyleSheet.flatten(nativeTrack.props.style).height).toBe(14);
  expect(Native.StyleSheet.flatten(screen.getByRole('progressbar',{name:'Happiness'}).props.style).flexDirection).toBe('column');
});
