import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { createContact } from '../../src/game/systems/npcs';
import { connectPerson, partnerRelation, relationFor } from '../../src/game/systems/relationships';
import { SaveRepository } from '../../src/persistence/repository';
import { EventModal } from '../../src/ui/EventModal';
import { RomanceActions } from '../../src/ui/RomanceActions';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { ThemeProvider } from '../../src/ui/theme';
import { database } from '../support/sqlite';
import marriage from '../fixtures/v5-marriage-result.json';
let mockStore:ReturnType<typeof createGameStore>;
jest.mock('expo-router',()=>({router:{back:jest.fn(),push:jest.fn()}}));
jest.mock('../../src/state/useGame',()=>({useGame:(selector:unknown)=>require('zustand').useStore(mockStore,selector)}));
function Current({personId}:{personId:string}){const world=require('zustand').useStore(mockStore,(s:{world:World})=>s.world);return <RomanceActions key={world.id+':'+world.activePersonId+':'+personId} world={world} personId={personId}/>;}
const frame=(personId:string)=><SafeAreaProvider initialMetrics={{frame:{x:0,y:0,width:390,height:844},insets:{top:47,bottom:34,left:0,right:0}}}><ThemeProvider><Current personId={personId}/><PendingEvent/></ThemeProvider></SafeAreaProvider>;
const press=async(name:string|RegExp)=>{await act(async()=>fireEvent.press(screen.getByRole('button',{name})));};
const confirm=async()=>{await act(async()=>{await modal().props.onChoose();});};
const modal=()=>screen.UNSAFE_getAllByType(EventModal).find(item=>item.props.event?.id.startsWith('romance-review:'))!;
test('affair review preserves failed save, blocks stale cancelled callbacks and retries exactly one recorded affair',async()=>{
  const archived=decodeWorld(JSON.stringify(marriage));if(archived.pending?.kind!=='result')throw Error('fixture');const initial=resolveCommand(archived,{type:'acknowledge',resultId:archived.pending.id}),actor=initial.people[initial.activePersonId];actor.attractedTo=['male','female','nonbinary'];
  const lover=createContact(initial,{age:27,gender:'female',compatibleWith:actor.gender,country:actor.country,city:actor.city});lover.attractedTo=['male','female','nonbinary'];lover.traits=['impulsive'];connectPerson(initial,lover.id);const relation=relationFor(initial,actor.id,lover.id)!;relation.strength=95;relation.trust=90;initial.random.outcomes=0;
  const db=database(),repository=new SaveRepository(db.driver);await repository.initialise();await repository.create(initial);mockStore=createGameStore({repository:async()=>repository,date:()=>initial.date,id:()=> 'unused'});expect(await mockStore.getState().bootstrap()).toBe(true);
  const view=render(frame(lover.id)),original=encodeWorld(mockStore.getState().world!),dispatch=jest.spyOn(mockStore.getState(),'dispatch');
  try{
    await press(/^Pursue an Affair$/);const cancelled=modal().props.onChoose;await press('Never mind');await act(async()=>{await cancelled();});expect(dispatch).not.toHaveBeenCalled();expect(encodeWorld(mockStore.getState().world!)).toBe(original);
    await press(/^Pursue an Affair$/);const stale=modal().props.onChoose;view.rerender(frame('person_parent1'));await act(async()=>{await stale();});expect(dispatch).not.toHaveBeenCalled();view.rerender(frame(lover.id));
    await press(/^Pursue an Affair$/);db.sqlite.exec("CREATE TRIGGER fail_romance BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");await confirm();await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));expect(encodeWorld(mockStore.getState().world!)).toBe(original);expect(modal().props.event).not.toBeNull();
    db.sqlite.exec('DROP TRIGGER fail_romance');await confirm();await waitFor(()=>expect(mockStore.getState().busy).toBe(false));const saved=mockStore.getState().world!;expect(saved.affairs).toHaveLength(1);expect(saved.affairs![0]).toMatchObject({actorId:actor.id,loverId:lover.id});expect(partnerRelation(saved)!.romance).toBe('married');expect(await repository.load(saved.id)).toEqual(saved);expect(saved.ledger).toEqual(initial.ledger);
  }finally{view.unmount();jest.restoreAllMocks();db.sqlite.close();}
});
