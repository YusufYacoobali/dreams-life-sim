import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { encodeWorld, type World } from '../../src/game/model';
import { ThemeProvider } from '../../src/ui/theme';
import { personProfilePolishFixture } from '../support/personProfilePolish';

let mockWorld:World,mockPersonId:string;
const mockDispatch=jest.fn();
jest.mock('expo-router',()=>({router:{push:jest.fn(),back:jest.fn()},useLocalSearchParams:()=>({id:mockPersonId})}));
jest.mock('../../src/state/useGame',()=>({useGame:(selector:(state:unknown)=>unknown)=>selector({world:mockWorld,dispatch:mockDispatch,busy:false,error:null})}));
jest.mock('@expo/vector-icons/Ionicons',()=>{
  const React=require('react'),{Text}=require('react-native');
  const glyphs=require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
  return ({name,size,color,style,...props}:any)=><Text {...props} allowFontScaling={false} style={[{fontFamily:'Ionicons',fontSize:size,color},style]}>{String.fromCodePoint(glyphs[name]||glyphs['ellipse-outline'])}</Text>;
});
import PersonProfile from '../../app/(game)/person/[id]';

function capture(name:string,tree:unknown) {
  const directory=process.env.DREAMS_POLISH_CAPTURE_DIR;if(!directory)return;
  const clean=(node:any):any=>Array.isArray(node)?node.map(clean):!node||typeof node!=='object'?node:({type:node.type,
    props:{style:StyleSheet.flatten(node.props?.style),source:node.props?.source,
      svg:node.type?.startsWith('RNSVG')?Object.fromEntries(['d','name','clipPath','matrix','x','y','width','height','minX','minY','vbWidth','vbHeight','src','align'].filter(key=>node.props?.[key]!==undefined).map(key=>[key,node.props[key]])):undefined,
      contentContainerStyle:StyleSheet.flatten(node.props?.contentContainerStyle),edges:node.props?.edges,
      accessibilityRole:node.props?.accessibilityRole,accessibilityLabel:node.props?.accessibilityLabel,
      allowFontScaling:node.props?.allowFontScaling,resizeMode:node.props?.resizeMode,placeholder:node.props?.placeholder,value:node.props?.value},children:node.children?.map(clean)});
  mkdirSync(directory,{recursive:true});writeFileSync(join(directory,name+'.json'),JSON.stringify(clean(tree)));
}

afterEach(()=>jest.restoreAllMocks());

test.each([false,true])('real Teacher and Father/Teacher profiles export read-only review trees, dark/large=%s',dark=>{
  const width=dark?320:390,fontScale=dark?1.4:1;
  jest.spyOn(require('react-native'),'useWindowDimensions').mockReturnValue({width,height:844,scale:2,fontScale});
  for(const role of ['Teacher','Father'] as const) {
    const fixture=personProfilePolishFixture(role);mockWorld=fixture.world;mockPersonId=fixture.personId;
    const before=encodeWorld(mockWorld),view=render(<SafeAreaProvider initialMetrics={{frame:{x:0,y:0,width,height:844},insets:{top:47,bottom:34,left:0,right:0}}}><ThemeProvider appearance={dark?'dark':'light'}><PersonProfile /></ThemeProvider></SafeAreaProvider>);
    expect(screen.getByRole('header',{name:'Person Profile'})).toBeOnTheScreen();
    capture('person-'+role.toLowerCase()+'-'+(dark?'dark-large':'light'),view.toJSON());
    expect(encodeWorld(mockWorld)).toBe(before);expect(mockDispatch).not.toHaveBeenCalled();view.unmount();
  }
});
