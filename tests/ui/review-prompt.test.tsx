import React from 'react';
import * as Native from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createLife, randomCreation } from '../../src/game/createLife';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { newReviewTracker } from '../../src/reviews/tracker';
import { ThemeProvider } from '../../src/ui/theme';
import { database } from '../support/sqlite';
let mockStore:ReturnType<typeof createGameStore>;
jest.mock('../../src/state/useGame',()=>({useGame:(selector:unknown)=>require('zustand').useStore(mockStore,selector)}));
jest.mock('../../src/reviews/nativeReview',()=>({nativeReviewAvailable:jest.fn(async()=>false),requestNativeReview:jest.fn(async()=>true),reviewPromptSupported:jest.fn(()=>true),openStoreReview:jest.fn(async()=>true)}));
import { requestNativeReview, reviewPromptSupported, openStoreReview } from '../../src/reviews/nativeReview';
import { ReviewPromptHost } from '../../src/ui/ReviewPromptHost';
import { EventModal } from '../../src/ui/EventModal';
import { hasAppModal, modalPresenceStore } from '../../src/ui/modalPresence';
const supported=jest.mocked(reviewPromptSupported),request=jest.mocked(requestNativeReview),openStore=jest.mocked(openStoreReview);
let initialAppState:typeof Native.AppState.currentState;
beforeEach(()=>{initialAppState=Native.AppState.currentState;Native.AppState.currentState='active';});
async function setup() {
  const {sqlite,driver}=database(),repository=new SaveRepository(driver);await repository.initialise();
  // Declared clean age-five boundary; actual Age Up accounting has separate SQLite coverage.
  const world=createLife('life_review_ui',42,{...randomCreation(42),country:'US',city:'New York',background:'ordinary'},{year:2026,month:10,day:22});world.birthAcknowledged=true;world.date.year+=5;Object.assign(world.people[world.activePersonId].stats,{health:90,happiness:90,stress:0});await repository.create(world);
  sqlite.prepare("INSERT INTO preferences(key,value) VALUES('app_review',?)").run(JSON.stringify({...newReviewTracker(),globalYearsPlayed:5,candidate:{lifeId:world.id,personId:world.activePersonId,frameId:'declared_boundary',startDate:{...world.date,year:world.date.year-1},negative:false,revision:world.revision,globalYear:5,age:5}}));
  mockStore=createGameStore({repository:async()=>repository,date:()=>world.date,id:()=> 'life_review_ui_next',reviewDelay:()=>17});await mockStore.getState().bootstrap();return {sqlite,repository};
}
function frame({dark=false,visible=true,local=false}:{dark?:boolean;visible?:boolean;local?:boolean}={}) {
  const width=dark?320:390;
  return <SafeAreaProvider initialMetrics={{frame:{x:0,y:0,width,height:844},insets:{top:47,bottom:34,left:0,right:0}}}><ThemeProvider appearance={dark?'dark':'light'}>{local&&<EventModal event={{id:'local-review-blocker',kind:'confirmation',title:'Review your purchase',body:'A local dialog is already open.',terms:[],confirmLabel:'Buy'}} onChoose={()=>{}} />}<ReviewPromptHost visible={visible} /></ThemeProvider></SafeAreaProvider>;
}
function capture(name:string,tree:unknown) {
  const directory=process.env.DREAMS_POLISH_CAPTURE_DIR;if(!directory)return;
  // Retain SVG drawing props, image sources and flattened native styles.
  const clean=(node:any):any=>Array.isArray(node)?node.map(clean):!node||typeof node!=='object'?node:{type:node.type,props:{...node.props,style:Native.StyleSheet.flatten(node.props?.style),contentContainerStyle:Native.StyleSheet.flatten(node.props?.contentContainerStyle),children:undefined},children:node.children?.map(clean)};
  mkdirSync(directory,{recursive:true});writeFileSync(join(directory,name+'.json'),JSON.stringify(clean(tree)));
}
const press=async(name:string)=>{await act(async()=>{fireEvent.press(screen.getByRole('button',{name}));});};
afterEach(()=>{Native.AppState.currentState=initialAppState;jest.restoreAllMocks();request.mockClear();request.mockResolvedValue(true);supported.mockReturnValue(true);openStore.mockClear();openStore.mockResolvedValue(true);expect(modalPresenceStore.getState().owners.size).toBe(0);});

test.each([false,true])('warm pre-prompt stays visible through its own registration; Sure persists before native request (dark=%s)',async dark=>{
  const context=await setup(),width=dark?320:390;jest.spyOn(require('react-native'),'useWindowDimensions').mockReturnValue({width,height:844,scale:2,fontScale:dark?1.4:1});const view=render(frame({dark}));
  try {
    await waitFor(()=>expect(screen.getByText('Enjoying Dreams?')).toBeOnTheScreen());expect(screen.getByRole('button',{name:'Maybe later'})).toBeOnTheScreen();expect(hasAppModal()).toBe(false);expect(modalPresenceStore.getState().owners.size).toBe(1);capture('review-preprompt-'+(dark?'dark-large':'light'),view.toJSON());
    const stale=screen.UNSAFE_getByType(EventModal).props.onChoose;context.sqlite.exec("CREATE TRIGGER fail_ui_review BEFORE INSERT ON preferences WHEN NEW.key='app_review' BEGIN SELECT RAISE(ABORT,'review save failure'); END");await press('Sure');expect(request).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Sure'})).toBeOnTheScreen();expect(screen.getByText('Could not save that. Please try again.')).toBeOnTheScreen();
    context.sqlite.exec('DROP TRIGGER fail_ui_review');request.mockImplementation(async canPresent=>{expect(modalPresenceStore.getState().owners.size).toBe(0);expect(screen.queryByText('Enjoying Dreams?')).toBeNull();expect(canPresent?.()).toBe(true);return true;});await press('Sure');await waitFor(()=>expect(request).toHaveBeenCalledTimes(1));expect(screen.queryByText('Enjoying Dreams?')).toBeNull();const tracker=await context.repository.loadReviewTracker();expect(tracker?.reviewCompletedOrDismissedCount).toBe(1);expect(tracker?.nextReviewPromptAtGlobalYear).toBe(22);await act(async()=>{stale('sure');});expect(request).toHaveBeenCalledTimes(1);
  }finally{view.unmount();context.sqlite.close();}
});

test.each(['button','android-back'] as const)('Maybe later via %s schedules ten years and never calls the native API',async method=>{
  const context=await setup(),view=render(frame());try{await waitFor(()=>expect(screen.getByText('Enjoying Dreams?')).toBeOnTheScreen());if(method==='button')await press('Maybe later');else await act(async()=>{screen.UNSAFE_getByType(Native.Modal).props.onRequestClose();});expect(request).not.toHaveBeenCalled();expect((await context.repository.loadReviewTracker())?.nextReviewPromptAtGlobalYear).toBe(15);expect((await context.repository.loadReviewTracker())?.reviewCompletedOrDismissedCount).toBe(1);}finally{view.unmount();context.sqlite.close();}
});

test('another EventModal blocks claiming; closing it permits one offer without a self-dismiss loop',async()=>{
  const context=await setup(),claim=jest.spyOn(context.repository,'claimReview'),view=render(frame({local:true}));try{await act(async()=>{});expect(hasAppModal()).toBe(true);expect(claim).not.toHaveBeenCalled();expect(screen.queryByText('Enjoying Dreams?')).toBeNull();view.rerender(frame());await waitFor(()=>expect(screen.getByText('Enjoying Dreams?')).toBeOnTheScreen());await act(async()=>{});expect(claim).toHaveBeenCalledTimes(1);expect(hasAppModal()).toBe(false);expect(screen.getByRole('button',{name:'Sure'})).toBeOnTheScreen();}finally{view.unmount();context.sqlite.close();}
});

test('unsupported hosts, hidden Life and a changed life never show or act on a stale offer',async()=>{
  const context=await setup(),claim=jest.spyOn(context.repository,'claimReview');supported.mockReturnValue(false);let view=render(frame());try{await act(async()=>{});expect(claim).not.toHaveBeenCalled();view.unmount();supported.mockReturnValue(true);view=render(frame({visible:false}));await act(async()=>{});expect(claim).not.toHaveBeenCalled();view.rerender(frame());await waitFor(()=>expect(screen.getByText('Enjoying Dreams?')).toBeOnTheScreen());const stale=screen.UNSAFE_getByType(EventModal).props.onChoose;await act(async()=>{await mockStore.getState().startLife({...randomCreation(44),country:'US',city:'New York',background:'ordinary'},44);});expect(mockStore.getState().reviewOffer).toBeNull();await act(async()=>{stale('sure');});expect(request).not.toHaveBeenCalled();expect((await context.repository.loadReviewTracker())!.nextReviewPromptAtGlobalYear).toBe(15);}finally{view.unmount();context.sqlite.close();}
});

test('an overdue reminder waits for foreground without depending on native store availability',async()=>{
  let change!:(state:Native.AppStateStatus)=>void;
  jest.spyOn(Native.AppState,'addEventListener').mockImplementation((_type,listener)=>{change=listener as typeof change;return {remove:jest.fn()};});
  const context=await setup();Native.AppState.currentState='background';const view=render(frame());
  try {
    await act(async()=>{});expect(screen.queryByText('Enjoying Dreams?')).toBeNull();
    await act(async()=>{Native.AppState.currentState='active';change('active');});
    await waitFor(()=>expect(screen.getByText('Enjoying Dreams?')).toBeOnTheScreen());
    expect(request).not.toHaveBeenCalled();
  }finally{view.unmount();context.sqlite.close();}
});

test('a hidden Life screen holds the native request until its own prompt is gone and Life is visible again',async()=>{
  const context=await setup(),view=render(frame());
  try {
    await waitFor(()=>expect(screen.getByText('Enjoying Dreams?')).toBeOnTheScreen());
    const frames=new Map<number,FrameRequestCallback>();let sequence=0;
    jest.spyOn(global,'requestAnimationFrame').mockImplementation(callback=>{frames.set(++sequence,callback);return sequence;});
    jest.spyOn(global,'cancelAnimationFrame').mockImplementation(id=>{if(id!=null)frames.delete(id);});
    await press('Sure');expect(request).not.toHaveBeenCalled();
    view.rerender(frame({visible:false}));
    await act(async()=>{for(const [id,callback]of [...frames]){frames.delete(id);callback(0);}});
    expect(request).not.toHaveBeenCalled();
    view.rerender(frame());
    for(let i=0;i<3;i++)await act(async()=>{for(const [id,callback]of [...frames]){frames.delete(id);callback(i*16);}});
    expect(request).toHaveBeenCalledTimes(1);
    expect(modalPresenceStore.getState().owners.size).toBe(0);
  }finally{view.unmount();context.sqlite.close();}
});

test('a temporary claim write failure retries on the next foreground without a render-time retry loop',async()=>{
  let change!:(state:Native.AppStateStatus)=>void;
  jest.spyOn(Native.AppState,'addEventListener').mockImplementation((_type,listener)=>{change=listener as typeof change;return {remove:jest.fn()};});
  const context=await setup(),claim=jest.spyOn(context.repository,'claimReview');
  context.sqlite.exec("CREATE TRIGGER fail_claim_review BEFORE INSERT ON preferences WHEN NEW.key='app_review' BEGIN SELECT RAISE(ABORT,'temporary claim error'); END");
  const view=render(frame());
  try {
    await waitFor(()=>expect(claim).toHaveBeenCalledTimes(1));await act(async()=>{});
    expect(screen.queryByText('Enjoying Dreams?')).toBeNull();expect(claim).toHaveBeenCalledTimes(1);
    context.sqlite.exec('DROP TRIGGER fail_claim_review');
    await act(async()=>{Native.AppState.currentState='background';change('background');});
    await act(async()=>{Native.AppState.currentState='active';change('active');});
    await waitFor(()=>expect(screen.getByText('Enjoying Dreams?')).toBeOnTheScreen());
    expect(claim).toHaveBeenCalledTimes(2);expect(request).not.toHaveBeenCalled();
  }finally{view.unmount();context.sqlite.close();}
});

test('an age-five release save without review metadata gets a reminder even when native review is unavailable',async()=>{
  const context=await setup();context.sqlite.exec("DELETE FROM preferences WHERE key='app_review'");
  await mockStore.getState().bootstrap();request.mockResolvedValue(false);
  const view=render(frame());
  try {
    await waitFor(()=>expect(screen.getByText('Enjoying Dreams?')).toBeOnTheScreen());
    expect(openStore).not.toHaveBeenCalled();
    openStore.mockImplementation(async canPresent=>{expect(canPresent?.()).toBe(true);expect(modalPresenceStore.getState().owners.size).toBe(0);return true;});
    await press('Sure');await waitFor(()=>expect(openStore).toHaveBeenCalledTimes(1));
    expect(request).toHaveBeenCalledTimes(1);
    expect((await context.repository.loadReviewTracker())?.reviewCompletedOrDismissedCount).toBe(1);
  } finally { view.unmount();context.sqlite.close(); }
});

test('a persisted unanswered reminder returns after a cold bootstrap without a second offer sequence',async()=>{
  const context=await setup();let view=render(frame());
  try {
    await waitFor(()=>expect(screen.getByText('Enjoying Dreams?')).toBeOnTheScreen());
    const id=mockStore.getState().reviewOffer!.id;
    view.unmount();await mockStore.getState().bootstrap();view=render(frame());
    await waitFor(()=>expect(screen.getByText('Enjoying Dreams?')).toBeOnTheScreen());
    expect(mockStore.getState().reviewOffer!.id).toBe(id);
    expect((await context.repository.loadReviewTracker())?.offerSequence).toBe(1);
    await press('Maybe later');expect(request).not.toHaveBeenCalled();expect(openStore).not.toHaveBeenCalled();
  } finally { view.unmount();context.sqlite.close(); }
});

test('a stale handler cannot answer a resumed offer with the same ID in a new revision',async()=>{
  const context=await setup(),respond=jest.spyOn(mockStore.getState(),'respondReview');const view=render(frame());
  try {
    await waitFor(()=>expect(screen.getByText('Enjoying Dreams?')).toBeOnTheScreen());
    const stale=screen.UNSAFE_getByType(EventModal).props.onChoose;
    const state=mockStore.getState(),revision=state.world!.revision+1;
    await act(async()=>{mockStore.setState({world:{...state.world!,revision},reviewOffer:{...state.reviewOffer!,revision}});});
    await act(async()=>{stale('sure');});
    expect(respond).not.toHaveBeenCalled();expect(request).not.toHaveBeenCalled();expect(openStore).not.toHaveBeenCalled();
  } finally { view.unmount();context.sqlite.close(); }
});
