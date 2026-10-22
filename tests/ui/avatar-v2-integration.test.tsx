import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { useCreationDraft } from '../../src/state/creationDraft';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { copyWorld, decodeWorld, encodeWorld, personSchema, validateWorld } from '../../src/game/model';
import { createLife, randomCreation } from '../../src/game/createLife';
import { createContact } from '../../src/game/systems/npcs';
import { CharacterPortrait } from '../../src/assets/CharacterPortrait';
import { portraitLayers, portraitTraits } from '../../src/assets/portraitPlan';
import { avatarPresets } from '../../src/ui/CreationElements';
import { ThemeProvider } from '../../src/ui/theme';
import { hairLabels, outfitLabels } from '../../src/assets/portraitLayout';
import { hairColorLabels } from '../../src/ui/appearanceLabels';
import graduate from '../fixtures/v3-employed-graduate.json';

let mockStore: ReturnType<typeof createGameStore>;
let mockParams: { id?: string } = {};
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() }, Redirect: () => null,
  useLocalSearchParams: () => mockParams }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import Appearance from '../../app/appearance';
import Life from '../../app/(game)/(tabs)/life';
import Profile from '../../app/(game)/profile';
import PersonProfile from '../../app/(game)/person/[id]';
import FamilyTree from '../../app/(game)/family-tree';

const frame = (child: React.ReactNode, dark = false) => <SafeAreaProvider initialMetrics={{ frame: { x:0,y:0,width:390,height:844 }, insets: { top:47,bottom:34,left:0,right:0 } }}><ThemeProvider appearance={dark ? 'dark' : 'light'}>{child}</ThemeProvider></SafeAreaProvider>;
const headSource = () => screen.UNSAFE_getAllByType(Image).map(image => image.props.source.testUri as string).find(path => path?.includes('/head-'));

beforeEach(() => {
  jest.spyOn(require('react-native'),'useWindowDimensions').mockReturnValue({ width:390,height:844,scale:3,fontScale:1 });
  useCreationDraft.setState({ draft:null }); mockParams = {};
});
afterEach(() => jest.restoreAllMocks());

test('legacy appearances derive bounded stable identities without changing their saved fields, survive SQLite reload and remain independent of names and editable traits', async () => {
  const raw = structuredClone(graduate), original = JSON.stringify(raw), initial = decodeWorld(original);
  expect(JSON.stringify(raw)).toBe(original);
  const ids = Object.fromEntries(Object.values(initial.people).map(person => [person.id,portraitTraits(person.appearance,25,person.id).identity]));
  for (const person of Object.values(initial.people)) expect(person.appearance).toEqual(raw.people[person.id as keyof typeof raw.people].appearance);
  for (const identity of Object.values(ids)) { expect(identity).toBeGreaterThanOrEqual(0); expect(identity).toBeLessThan(16); }
  expect(decodeWorld(original).people).toEqual(initial.people);
  const changed = copyWorld(initial), player = changed.people[changed.activePersonId], beforeRandom = { ...changed.random };
  const before = portraitTraits(player.appearance,25,player.id);
  player.firstName = 'Renamed'; player.appearance.hairColor = (player.appearance.hairColor+1)%5; player.appearance.hair = (player.appearance.hair+1)%8;
  const validated = validateWorld(changed), context = database();
  try {
    const repository = new SaveRepository(context.driver); await repository.initialise(); await repository.create(validated);
    const reopened = new SaveRepository(context.driver); await reopened.initialise(); const loaded = await reopened.load(validated.id);
    expect(loaded.random).toEqual(beforeRandom); expect(loaded.people[loaded.activePersonId].firstName).toBe('Renamed');
    expect(loaded.people[loaded.activePersonId].appearance).toEqual(player.appearance);
    expect(portraitTraits(player.appearance,25,player.id).identity).toBe(before.identity);
    expect(portraitTraits(player.appearance,25,player.id).clothing).toBe(before.clothing);
    expect(decodeWorld(encodeWorld(loaded)).people).toEqual(loaded.people);
    expect(Object.fromEntries(Object.values(loaded.people).map(person => [person.id,portraitTraits(person.appearance,25,person.id).identity]))).toEqual(ids);
  } finally { context.sqlite.close(); }
  const appearance = personSchema.shape.appearance;
  expect(appearance.safeParse({ face:0,skin:0,hair:0,hairColor:0 }).success).toBe(true);
  for (const identity of [-1,16,1.5]) expect(appearance.safeParse({ face:0,skin:0,hair:0,hairColor:0,identity }).success).toBe(false);
  for (const outfit of [-1,16,1.5]) expect(appearance.safeParse({ face:0,skin:0,hair:0,hairColor:0,outfit }).success).toBe(false);
});

test('an explicit clothing choice survives SQLite reload without changing facial identity or consuming randomness', async () => {
  const world = decodeWorld(JSON.stringify(graduate)), player = world.people[world.activePersonId];
  const before = portraitTraits(player.appearance,25,player.id), random = { ...world.random };
  player.appearance.outfit = (before.clothing + 7) % 16;
  const context = database();
  try {
    const repository = new SaveRepository(context.driver); await repository.initialise(); await repository.create(world);
    const reopened = new SaveRepository(context.driver); await reopened.initialise(); const loaded = await reopened.load(world.id);
    const result = loaded.people[loaded.activePersonId];
    expect(result.appearance).toEqual(player.appearance); expect(loaded.random).toEqual(random);
    const after = portraitTraits(result.appearance,25,result.id);
    expect(after.clothing).toBe(player.appearance.outfit);
    expect({ ...after,clothing:before.clothing }).toEqual(before);
  } finally { context.sqlite.close(); }
});

test('artwork identity never consumes gameplay randomness or changes generated family/game facts', () => {
  const input = randomCreation(42), date = { year:2026,month:10,day:22 };
  const a = createLife('life_art_random',42,{ ...input,appearance:{ ...input.appearance,identity:0 } },date);
  const b = createLife('life_art_random',42,{ ...input,appearance:{ ...input.appearance,identity:15 } },date);
  expect(a.random).toEqual(b.random);
  b.people[b.activePersonId].appearance.identity = 0;
  expect(encodeWorld(a)).toBe(encodeWorld(b));
});

test('real creation controls preserve facial identity and outfit, with no obsolete face-shape controls', async () => {
  useCreationDraft.getState().begin(42,'custom');
  const draft = useCreationDraft.getState().draft!;
  useCreationDraft.getState().update({ ...draft.input,appearance:{ ...avatarPresets[9] } });
  render(frame(<Appearance />));
  const press = async (role:'radio'|'tab',name:string) => { await act(async () => { fireEvent.press(screen.getByRole(role,{ name })); }); };
  const original = portraitTraits(avatarPresets[9],25);
  await press('tab','Hair Color'); await press('radio','Blond');
  await press('tab','Hair Style'); await press('radio','Bun');
  await press('tab','Skin Tone'); await press('radio','Skin tone 6, deep brown');
  await press('tab','Avatars');
  expect(screen.queryByRole('radiogroup',{ name:'Face shape' })).toBeNull();
  expect(screen.queryByText('FACE SHAPE')).toBeNull();
  const result = useCreationDraft.getState().draft!.input.appearance;
  expect(result).toEqual({ identity:9,outfit:9,face:2,skin:5,hair:6,hairColor:3 });
  expect(new Set(screen.UNSAFE_getAllByType(CharacterPortrait).map(item => item.props.appearance.identity ?? 0)).size).toBe(16);
  expect(portraitTraits(result,25).identity).toBe(original.identity);
  expect(portraitTraits(result,25).clothing).toBe(original.clothing);
  await press('tab','Clothing'); await press('radio','Rose V-neck');
  expect(useCreationDraft.getState().draft!.input.appearance).toEqual({ ...result,outfit:4 });
  expect(screen.getByRole('radio',{ name:'Rose V-neck' })).toBeChecked();
  await press('tab','Hair Style'); await press('radio','Short straight');
  expect(useCreationDraft.getState().draft!.input.appearance).toEqual({ ...result,hair:1,outfit:4 });
});

test('actual Life, player profile and family screens use the same saved artwork; optionally export their rendered native component trees', () => {
  let world = decodeWorld(JSON.stringify(graduate));
  world.people[world.activePersonId].appearance = { ...avatarPresets[0] };
  const parent = Object.values(world.people).find(person => person.id !== world.activePersonId)!;
  parent.appearance = { ...avatarPresets[11] };
  const npc = createContact(world,{ age:34,gender:'nonbinary' }); npc.appearance = { ...avatarPresets[3] };
  world = validateWorld(world);
  mockStore = createGameStore({ repository:async () => { throw new Error('Read-only screenshot'); },date:() => world.date,id:() => 'unused' });
  mockStore.setState({ world });
  useCreationDraft.getState().begin(42,'custom'); const draft = useCreationDraft.getState().draft!;
  useCreationDraft.getState().update({ ...draft.input,appearance:{ ...avatarPresets[0] } });
  const directory = process.env.DREAMS_AVATAR_CAPTURE_DIR;
  function capture(name:string, tree:ReturnType<ReturnType<typeof render>['toJSON']>) {
    if (!directory) return;
    const clean = (node:any):any => Array.isArray(node) ? node.map(clean) : !node || typeof node !== 'object' ? node : ({
      type:node.type,props:{ style:StyleSheet.flatten(node.props?.style),source:node.props?.source,
        svg:node.type?.startsWith('RNSVG') ? Object.fromEntries(['d','name','clipPath','matrix','x','y','width','height','minX','minY','vbWidth','vbHeight','src','align'].filter(key=>node.props?.[key]!==undefined).map(key=>[key,node.props[key]])) : undefined,
        contentContainerStyle:StyleSheet.flatten(node.props?.contentContainerStyle),edges:node.props?.edges,
        accessibilityRole:node.props?.accessibilityRole,accessibilityLabel:node.props?.accessibilityLabel },children:node.children?.map(clean) });
    mkdirSync(directory,{ recursive:true }); writeFileSync(join(directory,name+'.json'),JSON.stringify(clean(tree)));
  }
  const before = encodeWorld(world), view = render(frame(<Life />));
  const lifeHead = headSource(); expect(lifeHead).toContain('head-0-'); capture('life',view.toJSON());
  view.rerender(frame(<Profile />)); expect(headSource()).toBe(lifeHead); capture('profile',view.toJSON());
  view.rerender(frame(<Appearance />)); expect(screen.getAllByRole('radio',{ name:/^Avatar \d+, / })).toHaveLength(16); capture('creation',view.toJSON());
  fireEvent.press(screen.getByRole('tab',{ name:'Clothing' })); expect(screen.getAllByRole('radio')).toHaveLength(16); capture('clothing-screen',view.toJSON());
  mockParams = { id:npc.id }; view.rerender(frame(<PersonProfile />)); expect(headSource()).toContain('head-3-3-5'); capture('npc',view.toJSON());
  mockParams = { id:parent.id }; view.rerender(frame(<PersonProfile />)); expect(headSource()).toContain('head-11-'); capture('family-profile',view.toJSON());
  view.rerender(frame(<FamilyTree />)); expect(screen.UNSAFE_getAllByType(CharacterPortrait).some(item => item.props.appearance.identity === 0)).toBe(true); capture('family-tree',view.toJSON());
  const gallery = (items: { appearance:typeof avatarPresets[number]; age:number; size:number; label:string }[],dark=false) => <View style={{ padding:20,gap:16,flexDirection:'row',flexWrap:'wrap',backgroundColor:dark?'#253247':'#F8F7F5',width:720 }}>{items.map((item,index)=><View key={index} style={{ alignItems:'center',gap:6,width:150 }}><CharacterPortrait name={item.label} {...item} /><Text style={{ color:dark?'#F6F8FF':'#0B1545',fontSize:13 }}>{item.label}</Text></View>)}</View>;
  const show = (name:string,items:Parameters<typeof gallery>[0],dark=false) => { view.rerender(frame(gallery(items,dark),dark)); capture(name,view.toJSON()); };
  show('all-presets',avatarPresets.map((appearance,identity)=>({ appearance,age:25,size:140,label:'Identity '+(identity+1) })));
  show('four-140',[0,3,9,11].map(identity=>({ appearance:avatarPresets[identity],age:25,size:140,label:'Identity '+(identity+1)+' · 140px' })));
  show('ages',[0,7,16,25,48,68,86,100].map(age=>({ appearance:avatarPresets[0],age,size:140,label:'Age '+age })));
  show('skin',Array.from({length:6},(_,skin)=>({ appearance:{ ...avatarPresets[1],skin },age:25,size:140,label:'Skin '+(skin+1) })));
  show('skin-dark-base',Array.from({length:6},(_,skin)=>({ appearance:{ ...avatarPresets[3],skin },age:25,size:140,label:'Skin '+(skin+1) })));
  show('hair-colours',Array.from({length:5},(_,hairColor)=>({ appearance:{ ...avatarPresets[0],hairColor },age:25,size:140,label:hairColorLabels[hairColor] })));
  show('hairstyles',Array.from({length:8},(_,hair)=>({ appearance:{ ...avatarPresets[0],hair },age:25,size:140,label:hairLabels[hair] })));
  show('face-shapes',Array.from({length:4},(_,face)=>({ appearance:{ ...avatarPresets[0],face },age:25,size:140,label:'Legacy '+['Oval','Round','Long','Broad'][face] })));
  for (const hair of [4,5,7]) show('hair-fit-'+hair,avatarPresets.map((appearance,identity)=>({ appearance:{ ...appearance,hair },age:25,size:140,label:'Face '+(identity+1) })));
  show('long-hair-ages',[1,3,11,13].flatMap(identity=>[7,25,86].map(age=>({ appearance:avatarPresets[identity],age,size:140,label:'Face '+(identity+1)+' · age '+age }))));
  show('clothing',outfitLabels.map((label,outfit)=>({ appearance:{ ...avatarPresets[0],outfit },age:25,size:140,label })));
  for (const dark of [false,true]) show(dark?'sizes-dark':'sizes-light',[0,3,9,11].flatMap(identity=>[52,88,140].map(size=>({ appearance:avatarPresets[identity],age:25,size,label:(identity+1)+' · '+size+'px' }))),dark);
  expect(encodeWorld(mockStore.getState().world!)).toBe(before);
  expect(portraitLayers(portraitTraits(avatarPresets[0],25)).length).toBeLessThanOrEqual(5);
  view.unmount();
});
