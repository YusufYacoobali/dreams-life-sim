import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { World } from '../../src/game/model';
import { encodeWorld } from '../../src/game/model';
import { ThemeProvider } from '../../src/ui/theme';
import { personProfileDisplay } from '../../src/ui/personProfileDisplay';
import { personActionImages } from '../../src/assets/personActionImages';
import { personProfilePolishFixture } from '../support/personProfilePolish';

let mockWorld:World,mockPersonId:string;
const mockDispatch=jest.fn();
jest.mock('expo-router',()=>({router:{push:jest.fn(),back:jest.fn()},useLocalSearchParams:()=>({id:mockPersonId})}));
jest.mock('../../src/state/useGame',()=>({useGame:(selector:(state:unknown)=>unknown)=>selector({world:mockWorld,dispatch:mockDispatch,busy:false,error:null})}));
import PersonProfile from '../../app/(game)/person/[id]';

afterEach(()=>jest.restoreAllMocks());

test.each([false,true])('Teacher is a prominent saved role without a duplicate occupation, dark/large=%s',dark=>{
  const fixture=personProfilePolishFixture();mockWorld=fixture.world;mockPersonId=fixture.personId;
  const before=encodeWorld(mockWorld),width=dark?320:390;
  jest.spyOn(require('react-native'),'useWindowDimensions').mockReturnValue({width,height:844,scale:2,fontScale:dark?1.4:1});
  render(<SafeAreaProvider initialMetrics={{frame:{x:0,y:0,width,height:844},insets:{top:47,bottom:34,left:0,right:0}}}><ThemeProvider appearance={dark?'dark':'light'}><PersonProfile /></ThemeProvider></SafeAreaProvider>);
  const role=screen.getByText('Teacher');expect(screen.getAllByText('Teacher')).toHaveLength(1);
  expect(StyleSheet.flatten(role.props.style)).toMatchObject({fontWeight:'700',fontSize:15});
  expect(screen.getByText(mockWorld.people[mockPersonId].employment!.employer)).toBeOnTheScreen();
  const sources=screen.UNSAFE_getAllByType(Image).map(item=>item.props.source);
  expect(sources).toEqual(expect.arrayContaining((['talk','compliment','spend-time','give-money','argue','insult','distance','apologise'] as const).map(id=>personActionImages[id])));
  expect(encodeWorld(mockWorld)).toBe(before);expect(mockDispatch).not.toHaveBeenCalled();
});

test('a Father who is a Teacher keeps both different facts and never changes world state',()=>{
  const {world,personId}=personProfilePolishFixture('Father'),before=encodeWorld(world);
  expect(personProfileDisplay(world,personId)).toMatchObject({role:'Father',occupation:'Teacher'});
  expect(encodeWorld(world)).toBe(before);
});

test('unknown people do not manufacture a profile or consume randomness',()=>{
  const {world}=personProfilePolishFixture(),before=encodeWorld(world);
  expect(personProfileDisplay(world,'person_missing')).toBeUndefined();expect(encodeWorld(world)).toBe(before);
});
