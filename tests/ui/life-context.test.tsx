import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createLife, randomCreation } from '../../src/game/createLife';
import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand, recordDeath, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { endEmployment } from '../../src/game/systems/work';
import { startCareerContract, careerPayQuote } from '../../src/game/systems/careers';
import { servicePayQuote } from '../../src/game/systems/services';
import { startCourse } from '../../src/game/systems/education';
import { recordingQuote } from '../../src/game/systems/music';
import { accountFor } from '../../src/game/systems/common';
import { rentalQuote } from '../../src/game/systems/rentalHomes';
import { assetCatalog } from '../../src/game/content/assets';
import type { CareerKind } from '../../src/game/content/careers';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { resolveLifeContext } from '../../src/ui/lifeContext';
import { ThemeProvider } from '../../src/ui/theme';
import { FeedbackProvider } from '../../src/ui/feedback';
import { pupil } from '../support/pupil';
import { pendingCaseStoryWorld, prisonPeerStoryWorld } from '../support/legalStories';
import graduate from '../fixtures/v3-employed-graduate.json';
import oldCareer from '../fixtures/v12-career-archive.json';
import music from '../fixtures/v13-music-archive.json';
import election from '../fixtures/v14-election-archive.json';
import oldStudio from '../fixtures/v15-studio-archive.json';
import oldService from '../fixtures/v16-service-archive.json';
import royal from '../fixtures/v17-royal-archive.json';
import pension from '../fixtures/v17-pension-archive.json';
import company from '../fixtures/v11-business-archive.json';

let mockWorld: World, mockBusy = false;
const mockDispatch = jest.fn(async () => true);
jest.mock('expo-router', () => ({ router:{ push:jest.fn(),back:jest.fn() } }));
jest.mock('../../src/state/useGame', () => ({ useGame:(selector:(state:unknown)=>unknown) => selector({ world:mockWorld,busy:mockBusy,error:null,dispatch:mockDispatch }) }));
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react'), { Text } = require('react-native');
  const glyphs = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
  return ({ name,size,color,style,...props }:any) => <Text {...props} allowFontScaling={false} style={[{ fontFamily:'Ionicons',fontSize:size,color },style]}>{String.fromCodePoint(glyphs[name])}</Text>;
});
import Life from '../../app/(game)/(tabs)/life';
import Activities from '../../app/(game)/(tabs)/activities';

function ready(input: World): World {
  let world = input;
  for (let count=0;world.pending && count<100;count++) {
    const pending = world.pending;
    world = pending.kind === 'result' ? resolveCommand(world,{ type:'acknowledge',resultId:pending.id })
      : resolveCommand(world,{ type:'choose',eventId:pending.id,choiceId:pending.choices.find(choice=>!choiceUnavailable(world,choice))!.id });
  }
  if (world.pending) throw new Error('Unsettled context fixture');
  return world;
}
const command = (world: World, action: GameCommand) => ready(resolveCommand(world,action));
const archive = (value:unknown) => ready(decodeSave(JSON.stringify(value)).world);
const worker = () => ready(decodeWorld(JSON.stringify(graduate)));
function unemployed() { const world=worker(); endEmployment(world); return validateWorld(world); }
function baby(age = 0) {
  const world=createLife('life_context_child',42,randomCreation(42),{ year:2000,month:1,day:1 });
  world.birthAcknowledged=true; world.date.year+=age; return validateWorld(world);
}
// These are declared UI contexts built with the real contract/course helpers.
// Selection odds and eligibility are covered by their dedicated system tests.
function contracted(kind:CareerKind) {
  if (kind==='politician') return archive(election);
  const world=unemployed(); startCareerContract(world,kind,careerPayQuote(world,kind),world.people[world.activePersonId],false);
  return validateWorld(world);
}
function astronaut() {
  let world=archive(oldService); endEmployment(world);
  const person=world.people[world.activePersonId]; person.skills.science=100;
  person.stats.health=100; person.stats.fitness=100; person.stats.smarts=100; person.stats.discipline=100;
  // A fixed preparation seed, no outcome search. The test concerns the actual
  // accepted trainee's route, not admission odds or instant qualification.
  world.random.outcomes=1;
  world=command(world,{ type:'apply-service',kind:'astronaut',branch:'space-program',quotedAnnualPay:servicePayQuote(world,'astronaut') });
  if (!world.serviceCareers.some(item=>item.kind==='astronaut'&&item.status==='active')) throw new Error('Expected an accepted service fixture');
  return world;
}
function creator(kind:'youtuber'|'streamer', employed=false) {
  let world=employed ? worker() : unemployed();
  world=command(world,{ type:'create-social',platform:kind==='streamer' ? 'streamline' : 'videowave',handle:'context_'+kind,bio:'' });
  const account=world.socialAccounts.find(item=>item.ownerId===world.activePersonId&&item.platform===(kind==='streamer' ? 'streamline' : 'videowave'))!;
  return command(world,{ type:'start-creator',kind,accountId:account.id });
}
function recording() {
  const world=archive(music);
  return command(world,{ type:'record-music',title:'The Context Sessions',genre:'folk',format:'single',quotedCost:recordingQuote(world,'single').cost });
}
function studying(program:'university'|'trade'|'graduate') {
  const world=unemployed(), cash=accountFor(world); cash.cash+=100000000n; cash.openingCash+=100000000n;
  startCourse(world,program,program==='graduate' ? 'law' : 'computing','cash');
  return validateWorld(world);
}
function remand() { const world=pendingCaseStoryWorld(); world.cases[0].detained=true; return validateWorld(world); }
function retired() {
  const world=archive(pension);
  // This archive also contains ongoing public royal duties. Prepare a private
  // royal life so this case tests retirement without a higher-priority role.
  for (const house of world.royalHouses) {
    const member=house.members.find(item=>item.personId===world.activePersonId);
    if (member) member.mode='private';
  }
  return validateWorld(world);
}
type Scenario = { name:string; world:()=>World; label:string; href:Href };
const scenarios: Scenario[] = [
  { name:'newborn',world:()=>baby(),label:'Profile',href:'/profile' },
  { name:'toddler',world:()=>baby(3),label:'Profile',href:'/profile' },
  { name:'primary school',world:()=>pupil('US',7),label:'School',href:'/school' },
  { name:'secondary school',world:()=>pupil('US',14),label:'School',href:'/school' },
  { name:'university',world:()=>studying('university'),label:'Studies',href:'/education' },
  { name:'trade school',world:()=>studying('trade'),label:'Studies',href:'/education' },
  { name:'graduate study',world:()=>studying('graduate'),label:'Studies',href:'/education' },
  { name:'ordinary job',world:worker,label:'Job',href:'/work' },
  { name:'unemployed adult',world:unemployed,label:'Career',href:'/work' },
  { name:'retirement',world:retired,label:'Profile',href:'/profile' },
  { name:'business owner',world:()=>archive(company),label:'Business',href:{ pathname:'/manage-business/[id]',params:{ id:'business_person_player_67' } } },
  ...(['actor','model','athlete','musician','politician'] as const).map((kind,index)=>({
    name:kind,world:()=>contracted(kind),label:['Acting','Model','Sports','Music','Politics'][index],
    href:kind==='politician' ? '/politics' as const : { pathname:'/career/[kind]' as const,params:{ kind } },
  })),
  { name:'recording musician',world:recording,label:'Music',href:'/music-studio' },
  { name:'campaign',world:()=>ready(unpackCheckpoint(decodeSave(JSON.stringify(election)).snapshots[0].payload,true)),label:'Politics',href:'/politics' },
  { name:'military service',world:()=>archive(oldService),label:'Military',href:{ pathname:'/service/[kind]',params:{ kind:'military' } } },
  { name:'astronaut trainee',world:astronaut,label:'Space',href:{ pathname:'/service/[kind]',params:{ kind:'astronaut' } } },
  { name:'public royal duties',world:()=>archive(royal),label:'Royalty',href:'/royalty' },
  { name:'YouTuber studio',world:()=>creator('youtuber'),label:'Videos',href:{ pathname:'/creator-studio/[kind]',params:{ kind:'youtuber' } } },
  { name:'streaming studio',world:()=>creator('streamer'),label:'Live',href:{ pathname:'/creator-studio/[kind]',params:{ kind:'streamer' } } },
  { name:'prison sentence',world:prisonPeerStoryWorld,label:'Prison',href:'/prison' },
  { name:'remand',world:remand,label:'Prison',href:'/prison' },
];
const frame = (child:React.ReactNode,dark=false,width=390) => <SafeAreaProvider initialMetrics={{ frame:{ x:0,y:0,width,height:844 },insets:{ top:47,bottom:34,left:0,right:0 } }}><ThemeProvider appearance={dark?'dark':'light'}>{child}</ThemeProvider></SafeAreaProvider>;
function pressHandler(label:string) {
  // React Native's memo/forwardRef wrapper is not a stable findByType boundary.
  // Walk from the real accessible button to its committed press callback.
  let control=screen.getByRole('button',{ name:label });
  while (typeof control.props.onPress!=='function') {
    if (!control.parent) throw new Error('Missing native press handler');
    control=control.parent;
  }
  return control.props.onPress as ()=>unknown;
}
afterEach(()=>{ jest.restoreAllMocks(); jest.mocked(router.push).mockClear(); mockDispatch.mockClear(); mockBusy=false; });

test.each(scenarios)('$name resolves and opens the actual current context without a game command',scenario=>{
  mockWorld=scenario.world(); const before=encodeWorld(mockWorld);
  expect(resolveLifeContext(mockWorld)).toMatchObject({ label:scenario.label,href:scenario.href });
  render(frame(<Life />));
  const shortcut=screen.getByRole('button',{ name:scenario.label }); expect(shortcut).toBeEnabled();
  expect(screen.queryByRole('button',{ name:'More Life Options' })).toBeNull();
  fireEvent.press(shortcut); expect(router.push).toHaveBeenCalledWith(scenario.href);
  expect(mockDispatch).not.toHaveBeenCalled(); expect(encodeWorld(mockWorld)).toBe(before);
});

test('custody wins over work; business wins over employment; a live creator studio wins over an ordinary job',()=>{
  const held=remand(); expect(held.people[held.activePersonId].employment).not.toBeNull();
  expect(resolveLifeContext(held).key).toBe('prison');
  const business=archive(company); expect(business.people[business.activePersonId].employment).not.toBeNull();
  expect(resolveLifeContext(business).key).toBe('business');
  expect(resolveLifeContext(creator('youtuber',true)).key).toBe('creator-youtuber');
  const retiredRoyal=archive(pension); expect(retiredRoyal.people[retiredRoyal.activePersonId].finance.pensionAnnual).toBeGreaterThan(0n);
  expect(resolveLifeContext(retiredRoyal).key).toBe('royalty');
});

test('ended careers, royalties, left studios, private royal titles and training do not masquerade as current careers',()=>{
  expect(resolveLifeContext(archive(oldCareer)).key).toBe('career');
  expect(resolveLifeContext(archive(music)).key).toBe('career');
  const former=archive(oldStudio), studio=former.creatorStudios.find(item=>item.personId===former.activePersonId)!;
  expect(resolveLifeContext(command(former,{ type:'leave-creator',studioId:studio.id })).key).toBe('career');
  const privateRoyal=archive(royal); privateRoyal.royalHouses.flatMap(house=>house.members).find(member=>member.personId===privateRoyal.activePersonId)!.mode='private';
  expect(resolveLifeContext(validateWorld(privateRoyal)).key).toBe('career');
  const training=unemployed(); training.people[training.activePersonId].training={ skill:'acting',mode:'self',started:{ ...training.date },lastMonth:training.date.year*12+training.date.month-1,months:0,fees:0n,currency:accountFor(training).currency };
  expect(resolveLifeContext(validateWorld(training)).key).toBe('career');
  const dead=unemployed(); recordDeath(dead,dead.activePersonId,'natural causes');
  expect(resolveLifeContext(validateWorld(dead)).key).toBe('profile');
});

test.each([false,true])('the actual footer keeps Age Up dominant and its context accessible at small/large text (dark=%s)',dark=>{
  const width=dark?320:390,fontScale=dark?1.4:1;
  // Spy on the exported module used by Life, rather than Babel's namespace copy.
  jest.spyOn(require('react-native'),'useWindowDimensions').mockReturnValue({ width,height:844,scale:2,fontScale });
  mockWorld=pupil('US',7); render(frame(<Life />,dark,width));
  const shortcut=screen.getByRole('button',{ name:'School' }),advance=screen.getByRole('button',{ name:'Age Up' });
  expect(shortcut).toHaveStyle({ width:dark?54:88,minHeight:62,flexShrink:0 });
  expect(advance).toHaveStyle({ flex:1,minWidth:0,minHeight:62 });
  expect(screen.queryByText('School')).toBe(dark?null:screen.getByText('School'));
  expect(StyleSheet.flatten(screen.getByText('Age Up').props.style)).toMatchObject({ flexShrink:1,textAlign:'center' });
  fireEvent.press(shortcut); expect(router.push).toHaveBeenCalledWith('/school');
});

test('busy/pending gates, haptics, replaced contexts and unmount guard retained shortcut callbacks',async()=>{
  const feedback=jest.fn(async()=>{});
  mockWorld=pupil('US',7);
  const wrapped=()=>frame(<FeedbackProvider reducedMotion haptics onButtonFeedback={feedback}><Life /></FeedbackProvider>);
  const view=render(wrapped()); await act(async()=>{});
  const schoolPress=pressHandler('School'); fireEvent.press(screen.getByRole('button',{ name:'School' }));
  expect(feedback).toHaveBeenCalledTimes(1); jest.mocked(router.push).mockClear(); feedback.mockClear();
  mockBusy=true; view.rerender(wrapped()); act(()=>{ schoolPress(); });
  expect(screen.getByRole('button',{ name:'School' })).toBeDisabled(); expect(router.push).not.toHaveBeenCalled(); expect(feedback).not.toHaveBeenCalled();
  mockBusy=false; mockWorld.pending={ kind:'result',id:'saved-context-result',title:'Saved result',body:'Already stored.',illustration:'journal',effects:[] };
  view.rerender(wrapped()); act(()=>{ schoolPress(); }); expect(router.push).not.toHaveBeenCalled(); expect(feedback).not.toHaveBeenCalled();
  mockWorld=worker(); view.rerender(wrapped()); const jobPress=pressHandler('Job');
  act(()=>{ schoolPress(); }); expect(router.push).not.toHaveBeenCalled(); expect(feedback).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button',{ name:'Job' })); expect(router.push).toHaveBeenCalledWith('/work'); expect(feedback).toHaveBeenCalledTimes(1);
  jest.mocked(router.push).mockClear(); feedback.mockClear(); view.unmount(); act(()=>{ jobPress(); });
  expect(router.push).not.toHaveBeenCalled(); expect(feedback).not.toHaveBeenCalled(); expect(mockDispatch).not.toHaveBeenCalled();
});

test('rented-home identity and journal data stay in place when opening the context shortcut',()=>{
  const input=worker(),cash=accountFor(input); cash.cash+=100000000n; cash.openingCash+=100000000n;
  const offer=assetCatalog.find(item=>item.id==='studio')!;
  mockWorld=command(input,{ type:'sign-home-lease',catalogId:offer.id,quotedRent:rentalQuote(input,offer).monthlyRent });
  const before=encodeWorld(mockWorld); render(frame(<Life />));
  expect(screen.getByText('Home: '+offer.name)).toBeOnTheScreen();
  const rows=screen.UNSAFE_getByType(FlatList).props.data;
  fireEvent.press(screen.getByRole('button',{ name:'Job' }));
  expect(screen.UNSAFE_getByType(FlatList).props.data).toBe(rows); expect(encodeWorld(mockWorld)).toBe(before);
});

test('every former overflow destination remains in Activities',()=>{
  mockWorld=worker(); render(frame(<Activities />));
  for (const [label,href] of [['My Life',{ pathname:'/profile',params:{ tab:'activities' } }],['Extras','/extras'],['Saved Lives','/saved-lives'],['Time Machine','/time-machine'],['Settings','/settings']] as const) {
    fireEvent.press(screen.getByRole('button',{ name:new RegExp('^'+label+'(?:\\.|$)') }));
    expect(router.push).toHaveBeenLastCalledWith(href);
  }
  expect(mockDispatch).not.toHaveBeenCalled();
});

test('optionally export actual Life context trees for normal and cramped layouts',()=>{
  const directory=process.env.DREAMS_POLISH_CAPTURE_DIR;
  if (!directory) return;
  mkdirSync(directory,{ recursive:true });
  const clean=(node:any):any=>Array.isArray(node)?node.map(clean):!node||typeof node!=='object'?node:({
    type:node.type,props:{ style:StyleSheet.flatten(node.props?.style),source:node.props?.source,
      svg:node.type?.startsWith('RNSVG')?Object.fromEntries(['d','name','clipPath','matrix','x','y','width','height','minX','minY','vbWidth','vbHeight','src','align'].filter(key=>node.props?.[key]!==undefined).map(key=>[key,node.props[key]])):undefined,
      contentContainerStyle:StyleSheet.flatten(node.props?.contentContainerStyle),edges:node.props?.edges,
      accessibilityRole:node.props?.accessibilityRole,accessibilityLabel:node.props?.accessibilityLabel,
      allowFontScaling:node.props?.allowFontScaling,resizeMode:node.props?.resizeMode },children:node.children?.map(clean) });
  const dimensions=jest.spyOn(require('react-native'),'useWindowDimensions');
  for (const dark of [false,true]) for (const [name,world] of [['school',()=>pupil('US',7)],['job',worker],['prison',prisonPeerStoryWorld],['business',()=>archive(company)]] as const) {
    const width=dark?320:390; dimensions.mockReturnValue({ width,height:844,scale:2,fontScale:dark?1.4:1 });
    mockWorld=world(); const before=encodeWorld(mockWorld),view=render(frame(<Life />,dark,width));
    writeFileSync(join(directory,'life-context-'+name+'-'+(dark?'dark-large':'light')+'.json'),JSON.stringify(clean(view.toJSON())));
    expect(encodeWorld(mockWorld)).toBe(before); view.unmount();
  }
  expect(mockDispatch).not.toHaveBeenCalled();
});
