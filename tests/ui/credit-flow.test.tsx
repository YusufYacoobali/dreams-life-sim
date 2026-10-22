import React from 'react';
import { act,fireEvent,render,screen,waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { decodeSave } from '../../src/persistence/archive';
import { decodeWorld,encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { personalLoanCapacity } from '../../src/game/systems/credit';
import { accountFor } from '../../src/game/systems/common';
import { endEmployment } from '../../src/game/systems/work';
import { businessStartupQuote } from '../../src/game/systems/businesses';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import studioArchive from '../fixtures/v15-studio-archive.json';
import graduate from '../fixtures/v3-employed-graduate.json';
let mockStore:ReturnType<typeof createGameStore>;
jest.mock('expo-router',()=>({router:{back:jest.fn(),push:jest.fn()}}));
jest.mock('../../src/state/useGame',()=>({useGame:(selector:unknown)=>require('zustand').useStore(mockStore,selector)}));
import Bank from '../../app/(game)/bank';
import { PendingEvent } from '../../src/ui/PendingEvent';
const frame=(content:React.ReactNode)=><SafeAreaProvider initialMetrics={{frame:{x:0,y:0,width:390,height:844},insets:{top:47,bottom:34,left:0,right:0}}}><ThemeProvider>{content}<PendingEvent/></ThemeProvider></SafeAreaProvider>;
test('an unemployed established creator can review a real loan; a failed bank commit preserves receipts and retries exactly once',async()=>{
 const initial=decodeSave(JSON.stringify(studioArchive)).world,capacity=personalLoanCapacity(initial);expect(initial.people[initial.activePersonId].employment).toBeNull();const {sqlite,driver}=database(),repository=new SaveRepository(driver);await repository.initialise();await repository.create(initial);mockStore=createGameStore({repository:async()=>repository,date:()=>initial.date,id:()=> 'life_unused'});await mockStore.getState().bootstrap();const view=render(frame(<Bank/>));expect(screen.getByRole('button',{name:'Review Personal Loan'})).toBeEnabled();fireEvent.changeText(screen.getByLabelText('Amount in USD'),'100');sqlite.exec("CREATE TRIGGER fail_credit BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");fireEvent.press(screen.getByRole('button',{name:'Review Personal Loan'}));await act(async()=>{fireEvent.press(screen.getByRole('button',{name:'Accept Loan'}));});await waitFor(()=>expect(screen.getByText(/couldn't be saved/)).toBeOnTheScreen());expect(await repository.load(initial.id)).toEqual(initial);expect(encodeWorld(mockStore.getState().world!)).toBe(encodeWorld(initial));
 sqlite.exec('DROP TRIGGER fail_credit');fireEvent.press(screen.getByRole('button',{name:'Review Personal Loan'}));await act(async()=>{fireEvent.press(screen.getByRole('button',{name:'Accept Loan'}));});await waitFor(()=>expect(screen.getByText('Loan paid into your account')).toBeOnTheScreen());const committed=mockStore.getState().world!;expect(accountFor(committed).cash).toBe(accountFor(initial).cash+10000n);expect(personalLoanCapacity(committed).available).toBe(capacity.available-10000n);expect(committed.socialAccounts).toEqual(initial.socialAccounts);expect(committed.creatorInvoices).toEqual(initial.creatorInvoices);await act(async()=>{fireEvent.press(screen.getByRole('button',{name:'Continue'}));});const cold=await repository.load(initial.id);expect(cold.liabilities).toEqual(committed.liabilities);expect(cold.random).toEqual(initial.random);expect(personalLoanCapacity(cold).available).toBe(capacity.available-10000n);view.unmount();sqlite.close();
});
test('the bank explains why an owner’s new unfunded salary cannot support a personal loan',async()=>{
 let initial=decodeWorld(JSON.stringify(graduate));endEmployment(initial);const cash=accountFor(initial);cash.cash+=10000000n;cash.openingCash+=10000000n;initial=resolveCommand(initial,{type:'start-business',kind:'cafe',name:'First Day Cafe',operation:'owner',quotedCapital:businessStartupQuote(initial,'cafe').capital});initial=resolveCommand(initial,{type:'acknowledge',resultId:initial.pending!.id});const {sqlite,driver}=database(),repository=new SaveRepository(driver);await repository.initialise();await repository.create(initial);mockStore=createGameStore({repository:async()=>repository,date:()=>initial.date,id:()=> 'life_unused'});await mockStore.getState().bootstrap();const view=render(frame(<Bank/>));expect(initial.people[initial.activePersonId].employment!.annualPay).toBeGreaterThan(0n);expect(screen.getByRole('button',{name:'Review Personal Loan'})).toBeDisabled();expect(screen.getByText('You need outside employment, an earned pension or established regular income.')).toBeOnTheScreen();expect(personalLoanCapacity(mockStore.getState().world!).annual).toBe(0n);view.unmount();sqlite.close();
});
