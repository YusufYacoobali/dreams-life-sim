import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { accountFor } from '../../src/game/systems/common';
import { rentalResidence } from '../../src/game/systems/rentalSchemas';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import graduate from '../fixtures/v3-employed-graduate.json';
let mockStore: ReturnType<typeof createGameStore>, mockRouteId='studio';
const mockDismissTo=jest.fn();
jest.mock('expo-router',()=>({useLocalSearchParams:()=>({id:mockRouteId}),router:{back:jest.fn(),push:jest.fn(),dismissTo:(...args:unknown[])=>mockDismissTo(...args)}}));
jest.mock('../../src/state/useGame',()=>({useGame:(selector:unknown)=>require('zustand').useStore(mockStore,selector)}));
import Rental from '../../app/(game)/rental/[id]';
import { EventModal } from '../../src/ui/EventModal';
const world=()=>mockStore.getState().world!;
const frame=()=> <SafeAreaProvider initialMetrics={{frame:{x:0,y:0,width:390,height:844},insets:{top:47,bottom:34,left:0,right:0}}}><ThemeProvider><Rental /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press=async(name:string|RegExp)=>{await act(async()=>{fireEvent.press(screen.getByRole('button',{name}));});};
async function setup(){
  mockDismissTo.mockReset();
  const initial=decodeWorld(JSON.stringify(graduate)),account=accountFor(initial);account.cash+=100000000n;account.openingCash+=100000000n;
  const directory=mkdtempSync(join(tmpdir(),'dreams-rental-')),path=join(directory,'save.db');let sqlite!:DatabaseSync;
  const connect=():SqlDatabase=>{
    sqlite=new DatabaseSync(path);sqlite.exec('PRAGMA foreign_keys=ON');const connection=sqlite;
    const session:SqlSession={run:async(sql,values=[])=>{connection.prepare(sql).run(...values);},get:async<T,>(sql:string,values:(string|number|null)[]=[])=>connection.prepare(sql).get(...values) as T??null,all:async<T,>(sql:string,values:(string|number|null)[]=[])=>connection.prepare(sql).all(...values) as T[]};
    return {...session,exec:async sql=>{connection.exec(sql);},transaction:async action=>{connection.exec('BEGIN IMMEDIATE');try{const value=await action(session);connection.exec('COMMIT');return value;}catch(error){connection.exec('ROLLBACK');throw error;}}};
  };
  const repository=new SaveRepository(connect());await repository.initialise();await repository.create(initial);let pause:Promise<void>|undefined;
  const bootstrap=async(repo:SaveRepository)=>{mockStore=createGameStore({repository:async()=>repo,date:()=>initial.date,id:()=> 'unused',yieldToUI:async()=>{const wait=pause;pause=undefined;if(wait)await wait;}});expect(await mockStore.getState().bootstrap()).toBe(true);};
  await bootstrap(repository);mockRouteId='studio';
  const rows=()=>Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row=>[row.name,sqlite.prepare('SELECT * FROM '+row.name+' ORDER BY 1,2').all()]));
  return {get sqlite(){return sqlite;},rows,pauseNext:()=>{let release!:()=>void;pause=new Promise<void>(resolve=>{release=resolve;});return release;},cold:async()=>{sqlite.close();await bootstrap(new SaveRepository(connect()));},close:()=>{sqlite.close();rmSync(directory,{recursive:true,force:true});}};
}

test('lease review cancels cleanly; storage failure preserves review, then retry and cold load keep one paid lease and saved result',async()=>{
  const context=await setup();let view=render(frame());
  try{
    const before=encodeWorld(world()),rows=context.rows();await press('Review Lease');expect(within(screen.UNSAFE_getByType(Modal)).getByText('Due today')).toBeOnTheScreen();await press('Never mind');expect(encodeWorld(world())).toBe(before);expect(context.rows()).toEqual(rows);
    await press('Review Lease');context.sqlite.exec("CREATE TRIGGER fail_rental BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'rental storage failure'); END");await press('Sign Lease');
    expect(encodeWorld(world())).toBe(before);expect(context.rows()).toEqual(rows);expect(mockDismissTo).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Sign Lease'})).toBeOnTheScreen();expect(mockStore.getState().error).toBeTruthy();
    context.sqlite.exec('DROP TRIGGER fail_rental');await press('Sign Lease');expect(world().rentalLeases).toHaveLength(1);expect(mockDismissTo).toHaveBeenCalledTimes(1);expect(mockDismissTo).toHaveBeenCalledWith('/assets');expect(world().ledger.filter(row=>row.category==='housing-rent')).toHaveLength(1);expect(world().pending).toMatchObject({kind:'result',title:'Welcome to your rental'});
    const saved=encodeWorld(world());view.unmount();await context.cold();view=render(frame());expect(encodeWorld(world())).toBe(saved);expect(rentalResidence(world())?.catalogId).toBe('studio');expect(screen.getByText('Welcome to your rental')).toBeOnTheScreen();
    await press('Continue');const cash=accountFor(world()).cash;await press('Review Move Out');await press('Move Out');expect(rentalResidence(world())).toBeUndefined();expect(world().rentalLeases[0].endReason).toBe('moved-out');expect(accountFor(world()).cash).toBe(cash);
    const ended=encodeWorld(world());view.unmount();await context.cold();view=render(frame());expect(encodeWorld(world())).toBe(ended);expect(world().ledger.filter(row=>row.category==='housing-rent')).toHaveLength(1);
  }finally{view.unmount();context.close();}
},60000);

test('busy double confirmation and cancellation cannot sign twice, and stale reviews cannot mutate a switched life',async()=>{
  const context=await setup();const view=render(frame());
  try{
    await press('Review Lease');const stale=screen.UNSAFE_getAllByType(EventModal).find(item=>item.props.event?.kind==='confirmation')!.props.onChoose;
    const release=context.pauseNext();await act(async()=>{fireEvent.press(screen.getByRole('button',{name:'Sign Lease'}));fireEvent.press(screen.getByRole('button',{name:'Sign Lease'}));fireEvent.press(screen.getByRole('button',{name:'Never mind'}));});
    expect(mockStore.getState().busy).toBe(true);expect(world().rentalLeases).toHaveLength(0);await act(async()=>{release();});expect(world().rentalLeases).toHaveLength(1);expect(mockDismissTo).toHaveBeenCalledTimes(1);expect(mockDismissTo).toHaveBeenCalledWith('/assets');expect(world().ledger.filter(row=>row.category==='housing-rent')).toHaveLength(1);
    const other=decodeWorld(encodeWorld(world()));other.id='life_switched';await act(async()=>{mockStore.setState({world:other});});const saved=encodeWorld(world());await act(async()=>{await stale('confirm');});expect(encodeWorld(world())).toBe(saved);
  }finally{view.unmount();context.close();}
},60000);
