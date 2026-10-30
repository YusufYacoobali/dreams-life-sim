import { purchases } from '../../src/purchases/native';
import { features } from '../../src/purchases/catalog';
// This existing gameplay/save journey uses a licensed-player fixture.
beforeEach(() => { purchases.setState({ ownership: Object.fromEntries(features.map(feature => [feature, true])) as Record<typeof features[number], boolean> }); });
import React from 'react';
import { act,fireEvent,render,screen,waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld,encodeWorld,World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { servicePayQuote } from '../../src/game/systems/services';
import { serviceQualified } from '../../src/game/systems/serviceSchemas';
import { endEmployment } from '../../src/game/systems/work';
import { accountFor } from '../../src/game/systems/common';
import { randomInteger } from '../../src/game/random';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import fixture from '../fixtures/v3-employed-graduate.json';
let mockStore:ReturnType<typeof createGameStore>,mockKind:'military'|'astronaut'='military';
jest.mock('expo-router',()=>({router:{back:jest.fn(),push:jest.fn()},useLocalSearchParams:()=>({kind:mockKind})}));
jest.mock('../../src/state/useGame',()=>({useGame:(selector:unknown)=>require('zustand').useStore(mockStore,selector)}));
import ServiceCareer from '../../app/(game)/service/[kind]';
import { PendingEvent } from '../../src/ui/PendingEvent';
const frame=(content:React.ReactNode)=><SafeAreaProvider initialMetrics={{frame:{x:0,y:0,width:390,height:844},insets:{top:47,bottom:34,left:0,right:0}}}><ThemeProvider>{content}<PendingEvent/></ThemeProvider></SafeAreaProvider>;
function initial(){const world=decodeWorld(JSON.stringify(fixture));endEmployment(world);const person=world.people[world.activePersonId],cash=accountFor(world);person.born.year-=5;person.skills.science=90;person.skills.service=90;person.stats.health=100;person.stats.fitness=100;person.stats.smarts=90;person.stats.discipline=90;cash.cash+=100000000n;cash.openingCash+=100000000n;for(let seed=1;seed<1000;seed++){const assessment=randomInteger(seed,1,100),exam=randomInteger(assessment.state,1,100);if(assessment.value<=95&&exam.value<=80){world.random.outcomes=seed;break;}}return world;}
function drain(input:World){let world=input,guard=0;while(world.pending&&guard++<100){if(world.pending.kind==='result')world=resolveCommand(world,{type:'acknowledge',resultId:world.pending.id});else{const option=world.pending.choices.find(item=>!choiceUnavailable(world,item));if(!option)throw new Error('No available option');world=resolveCommand(world,{type:'choose',eventId:world.pending.id,choiceId:option.id});}}return world;}
test.each(['military','astronaut'] as const)('native %s application rolls back a failed contract and retries one actual job with no instant training or pay',async kind=>{
 mockKind=kind;const {sqlite,driver}=database(),repository=new SaveRepository(driver);await repository.initialise();const start=initial();await repository.create(start);mockStore=createGameStore({ premiumAccess: () => true, repository:async()=>repository,date:()=>start.date,id:()=> 'life_unused'});await mockStore.getState().bootstrap();const view=render(frame(<ServiceCareer/>));expect(encodeWorld(mockStore.getState().world!)).toBe(encodeWorld(start));sqlite.exec("CREATE TRIGGER fail_service BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
 fireEvent.press(screen.getByRole('button',{name:'Review Service Application'}));await act(async()=>{fireEvent.press(screen.getByRole('button',{name:'Apply for Service'}));});await waitFor(()=>expect(screen.getByText(/couldn't be saved/)).toBeOnTheScreen());expect(await repository.load(start.id)).toEqual(start);expect(mockStore.getState().world!.serviceCareers).toEqual([]);
 sqlite.exec('DROP TRIGGER fail_service');fireEvent.press(screen.getByRole('button',{name:'Review Service Application'}));await act(async()=>{fireEvent.press(screen.getByRole('button',{name:'Apply for Service'}));});await waitFor(()=>expect(screen.getByText('Your service begins')).toBeOnTheScreen());const committed=mockStore.getState().world!;expect(committed.serviceCareers).toHaveLength(1);expect(committed.serviceCareers[0].contracts[0].trainingScores).toEqual([]);expect(accountFor(committed).cash).toBe(accountFor(start).cash);expect(committed.people[committed.activePersonId].employment!.paidMonths).toBe(0);await act(async()=>{fireEvent.press(screen.getByRole('button',{name:'Continue'}));});const cold=await repository.load(start.id);expect(cold.serviceCareers).toEqual(committed.serviceCareers);expect(cold.random).toEqual(committed.random);view.unmount();sqlite.close();
});
test('a native mission departure uses earned two-year qualification and preserves one saved assignment after transaction failure',async()=>{
 mockKind='astronaut';let start=initial();start=drain(resolveCommand(start,{type:'apply-service',kind:'astronaut',branch:'space-program',quotedAnnualPay:servicePayQuote(start,'astronaut')}));for(let year=0;year<2;year++){start=resolveCommand(start,{type:'advance'});let guard=0;while((start.pending||start.annual)&&!start.people[start.activePersonId].died&&guard++<200)start=start.pending?drain(start):resolveCommand(start,{type:'resume'});if(guard>=200)throw new Error('Training year stalled');}expect(serviceQualified(start.serviceCareers[0])).toBe(true);
 const {sqlite,driver}=database(),repository=new SaveRepository(driver);await repository.initialise();await repository.create(start);mockStore=createGameStore({ premiumAccess: () => true, repository:async()=>repository,date:()=>start.date,id:()=> 'life_unused'});await mockStore.getState().bootstrap();const view=render(frame(<ServiceCareer/>));sqlite.exec("CREATE TRIGGER fail_mission BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");fireEvent.press(screen.getByText('Orbital Research'));await act(async()=>{fireEvent.press(screen.getByRole('button',{name:'Depart on Assignment'}));});await waitFor(()=>expect(screen.getByText(/couldn't be saved/)).toBeOnTheScreen());expect(await repository.load(start.id)).toEqual(start);expect(mockStore.getState().world!.serviceCareers[0].assignments).toEqual([]);
 sqlite.exec('DROP TRIGGER fail_mission');fireEvent.press(screen.getByText('Orbital Research'));await act(async()=>{fireEvent.press(screen.getByRole('button',{name:'Depart on Assignment'}));});await waitFor(()=>expect(screen.getByText('Your assignment is booked')).toBeOnTheScreen());const committed=mockStore.getState().world!;expect(committed.serviceCareers[0].assignments).toHaveLength(1);expect(committed.serviceCareers[0].assignments[0].periods).toEqual([]);expect(committed.serviceCareers[0].assignments[0].units).toBe(0);expect(accountFor(committed).cash).toBe(accountFor(start).cash);await act(async()=>{fireEvent.press(screen.getByRole('button',{name:'Continue'}));});const cold=await repository.load(start.id);expect(cold.serviceCareers).toEqual(committed.serviceCareers);expect(cold.random).toEqual(committed.random);view.unmount();sqlite.close();
});
