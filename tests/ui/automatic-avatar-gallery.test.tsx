import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createLife, randomCreation } from '../../src/game/createLife';
import { encodeWorld, type Person, type World } from '../../src/game/model';
import { ageOn } from '../../src/game/personHelpers';
import { createContact } from '../../src/game/systems/npcs';
import { automaticArtworkPools } from '../../src/game/appearanceArtwork';
import { isAutomaticAppearance, legacyNPCDefaultGender } from '../../src/game/appearance';
import { portraitLayers, portraitTraits } from '../../src/assets/portraitPlan';
import { CharacterPortrait } from '../../src/assets/CharacterPortrait';

let mockWorld:World;
jest.mock('../../src/state/useGame',()=>({useGame:(selector:(state:{world:World})=>unknown)=>selector({world:mockWorld})}));
import { Portrait } from '../../src/ui/components';

const date={year:2026,month:10,day:22}, ages=[0,3,8,16,25,48,68,86,100];
const fresh=()=>createLife('life_npc_portrait_gallery',6552,{...randomCreation(6552),country:'US',city:'New York',background:'ordinary'},date);
function capture(name:string,tree:unknown){
  const directory=process.env.DREAMS_POLISH_CAPTURE_DIR;if(!directory)return;
  const clean=(node:any):any=>Array.isArray(node)?node.map(clean):!node||typeof node!=='object'?node:({
    type:node.type,props:{style:StyleSheet.flatten(node.props?.style),source:node.props?.source,
      svg:node.type?.startsWith('RNSVG')?Object.fromEntries(['d','name','clipPath','matrix','x','y','width','height','minX','minY','vbWidth','vbHeight','src','align'].filter(key=>node.props?.[key]!==undefined).map(key=>[key,node.props[key]])):undefined,
      accessibilityRole:node.props?.accessibilityRole,accessibilityLabel:node.props?.accessibilityLabel},children:node.children?.map(clean)});
  mkdirSync(directory,{recursive:true});writeFileSync(join(directory,name+'.json'),JSON.stringify(clean(tree)));
}
type Item={person:Person;age:number;size:number;label:string};
function Gallery({items,dark=false,width=660}:{items:Item[];dark?:boolean;width?:number}){
  return <View style={{width,padding:20,gap:16,flexDirection:'row',flexWrap:'wrap',backgroundColor:dark?'#18243A':'#F8F7F5'}}>
    {items.map(({person,age,size,label},index)=><View key={person.id+':'+index} style={{width:size===140?156:110,gap:6,alignItems:'center'}}>
      <Portrait appearance={person.appearance} age={age} personId={person.id} name={label} size={size}/>
      <Text style={{fontSize:11,lineHeight:15,color:dark?'#F4F7FF':'#111B45',textAlign:'center'}}>{label}</Text>
    </View>)}
  </View>;
}

test('one hundred actual generated NPCs show suitable male and female artwork across skin tones and ages; capture review grids without touching saves',()=>{
  mockWorld=fresh();
  const groups=(['male','female'] as const).map(gender=>({gender,people:Array.from({length:50},(_,index)=>createContact(mockWorld,{age:ages[index%ages.length],gender}))}));
  const neutral=Array.from({length:18},(_,index)=>createContact(mockWorld,{age:ages[index%ages.length],gender:'nonbinary'}));
  const before=encodeWorld(mockWorld),view=render(<Gallery items={[]}/>);
  for(const {gender,people} of groups){
    const pool=automaticArtworkPools[gender==='male'?'masculine':'feminine'];
    expect(people).toHaveLength(50);expect(new Set(people.map(person=>person.appearance.skin)).size).toBe(6);
    const items=people.map((person,index)=>({person,age:ageOn(person,mockWorld.date),size:88,label:(index+1)+' · '+ageOn(person,mockWorld.date)+'y · skin '+(person.appearance.skin+1)}));
    for(const item of items){
      expect(isAutomaticAppearance(item.person.appearance)).toBe(true);
      expect(pool.identities as readonly number[]).toContain(item.person.appearance.identity);
      const layers=portraitLayers(portraitTraits(item.person.appearance,item.age,item.person.id));
      expect(layers.some(layer=>layer.asset==='clothing-'+item.person.appearance.outfit)).toBe(item.age>=3);
      expect(layers.length).toBeLessThanOrEqual(5);
    }
    view.rerender(<Gallery items={items}/>);expect(screen.UNSAFE_getAllByType(CharacterPortrait)).toHaveLength(50);
    capture('portraits-npc-50-'+gender+'-light',view.toJSON());
    view.rerender(<Gallery items={items} dark/>);capture('portraits-npc-50-'+gender+'-dark',view.toJSON());
  }
  const neutralItems=neutral.map((person,index)=>({person,age:ages[index%ages.length],size:88,label:'Neutral '+(index+1)+' · '+ages[index%ages.length]+'y'}));
  for(const person of neutral)expect(automaticArtworkPools.neutral.identities as readonly number[]).toContain(person.appearance.identity);
  view.rerender(<Gallery items={neutralItems}/>);capture('portraits-npc-neutral',view.toJSON());
  const sizes=groups.flatMap(({gender,people})=>[52,88,140].flatMap(size=>[3,25,86].map(age=>({person:people.find(person=>ageOn(person,mockWorld.date)===age)!,age,size,label:gender+' · '+age+'y · '+size+'px'}))));
  for(const dark of [false,true]){view.rerender(<Gallery items={sizes} dark={dark}/>);capture('portraits-npc-sizes-'+(dark?'dark':'light'),view.toJSON());}
  expect(encodeWorld(mockWorld)).toBe(before);view.unmount();
});

test('the shared Portrait wrapper applies legacy compatibility in every scene while explicit, edited, active and former player choices render verbatim',()=>{
  mockWorld=fresh();const person=mockWorld.people.person_parent1;person.appearance={face:1,skin:4,hair:3,hairColor:0};
  const old=encodeWorld(mockWorld),expected=portraitTraits(person.appearance,25,person.id,legacyNPCDefaultGender(mockWorld,person.id,person.appearance));
  const view=render(<Portrait appearance={person.appearance} age={25} personId={person.id} name="Saved parent" size={88}/>);
  const heads=()=>screen.UNSAFE_getAllByType(Image).map(image=>image.props.source.testUri).filter((uri:string)=>uri?.includes('/head-'));
  expect(heads()).toEqual([expect.stringContaining('head-'+expected.identity+'-3-4')]);
  capture('portraits-legacy-parent',view.toJSON());expect(encodeWorld(mockWorld)).toBe(old);
  for(const appearance of [{...person.appearance,identity:0,outfit:15},{...person.appearance,provenance:{kind:'custom' as const}}]){
    person.appearance=appearance;view.rerender(<Portrait appearance={appearance} age={25} personId={person.id} name="Chosen parent" size={88}/>);
    const traits=portraitTraits(appearance,25,person.id);expect(heads()).toEqual([expect.stringContaining('head-'+traits.identity+'-3-4')]);
  }
  person.appearance={face:1,skin:4,hair:3,hairColor:0};mockWorld.legacies=[{fromId:person.id,toId:mockWorld.activePersonId,date}];
  view.rerender(<Portrait appearance={person.appearance} age={25} personId={person.id} name="Earlier player"/>);
  expect(heads()).toEqual([expect.stringContaining('head-'+portraitTraits(person.appearance,25,person.id).identity+'-3-4')]);
  view.unmount();
});
