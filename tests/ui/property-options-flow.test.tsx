import { displayText } from '../../src/ui/displayNumbers';
import React from 'react';
import * as Native from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomCreation } from '../../src/game/createLife';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { assetCatalog } from '../../src/game/content/assets';
import { assetPrice, purchaseQuote } from '../../src/game/systems/assets';
import { rentalQuote } from '../../src/game/systems/rentalHomes';
import { rentalResidence } from '../../src/game/systems/rentalSchemas';
import { accountFor } from '../../src/game/systems/common';
import { formatMoney } from '../../src/game/money';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { EventModal } from '../../src/ui/EventModal';
import { AssetListing } from '../../src/ui/AssetFeatures';
import { CatalogArt } from '../../src/assets/CatalogArt';
import graduate from '../fixtures/v3-employed-graduate.json';
let mockStore:ReturnType<typeof createGameStore>,mockRoute:{id:string;kind:string;method?:string}={id:'studio',kind:'property'};
const mockPush=jest.fn(),mockDismissTo=jest.fn();
jest.mock('expo-router',()=>({useLocalSearchParams:()=>mockRoute,router:{back:jest.fn(),push:(...args:unknown[])=>mockPush(...args),navigate:jest.fn(),dismissTo:(...args:unknown[])=>mockDismissTo(...args)}}));
jest.mock('../../src/state/useGame',()=>({useGame:(selector:unknown)=>require('zustand').useStore(mockStore,selector)}));
import Shopping from '../../app/(game)/shopping/[kind]';
import Offer from '../../app/(game)/offer/[id]';
import Rentals from '../../app/(game)/rentals';
import Rental from '../../app/(game)/rental/[id]';
const studio=assetCatalog.find(offer=>offer.id==='studio')!;
const world=()=>mockStore.getState().world!;
const money=(minor:bigint)=>formatMoney({minor,currency:accountFor(world()).currency});
const frame=(child:React.ReactNode=<Offer />,dark=false)=><SafeAreaProvider initialMetrics={{frame:{x:0,y:0,width:dark?320:390,height:844},insets:{top:47,bottom:34,left:0,right:0}}}><ThemeProvider appearance={dark?'dark':'light'}>{child}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press=async(name:string|RegExp)=>{await act(async()=>{fireEvent.press(screen.getByRole('button',{name}));});};
const method=async(name:string)=>{await act(async()=>{fireEvent.press(screen.getByRole('radio',{name}));});};
async function setup() {
  const initial=decodeWorld(JSON.stringify(graduate)),account=accountFor(initial);account.cash+=100000000n;account.openingCash+=100000000n;
  const directory=mkdtempSync(join(tmpdir(),'dreams-property-options-')),path=join(directory,'save.db');let sqlite!:DatabaseSync;
  const connect=():SqlDatabase=>{sqlite=new DatabaseSync(path);sqlite.exec('PRAGMA foreign_keys=ON');const db=sqlite;
    const session:SqlSession={run:async(sql,values=[])=>{db.prepare(sql).run(...values);},get:async<T,>(sql:string,values:(string|number|null)[]=[])=>db.prepare(sql).get(...values) as T??null,all:async<T,>(sql:string,values:(string|number|null)[]=[])=>db.prepare(sql).all(...values) as T[]};
    return {...session,exec:async sql=>{db.exec(sql);},transaction:async action=>{db.exec('BEGIN IMMEDIATE');try{const result=await action(session);db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}}};
  };
  const repository=new SaveRepository(connect());await repository.initialise();await repository.create(initial);let pause:Promise<void>|undefined;
  const bootstrap=async(repo:SaveRepository)=>{mockStore=createGameStore({repository:async()=>repo,date:()=>initial.date,id:()=> 'life_property_next',yieldToUI:async()=>{const waiting=pause;pause=undefined;if(waiting)await waiting;}});expect(await mockStore.getState().bootstrap()).toBe(true);};
  await bootstrap(repository);mockRoute={id:'studio',kind:'property'};mockPush.mockClear();mockDismissTo.mockClear();
  const rows=()=>Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row=>[row.name,sqlite.prepare('SELECT * FROM '+row.name+' ORDER BY 1,2').all()]));
  return {get sqlite(){return sqlite;},initial,rows,pauseNext:()=>{let release!:()=>void;pause=new Promise<void>(resolve=>{release=resolve;});return release;},cold:async()=>{sqlite.close();await bootstrap(new SaveRepository(connect()));},close:()=>{sqlite.close();rmSync(directory,{recursive:true,force:true});}};
}
function capture(name:string,tree:unknown) {
  const directory=process.env.DREAMS_POLISH_CAPTURE_DIR;if(!directory)return;
  const clean=(node:any):any=>Array.isArray(node)?node.map(clean):!node||typeof node!=='object'?node:{type:node.type,props:{...node.props,style:Native.StyleSheet.flatten(node.props?.style),contentContainerStyle:Native.StyleSheet.flatten(node.props?.contentContainerStyle),children:undefined},children:node.children?.map(clean)};
  mkdirSync(directory,{recursive:true});writeFileSync(join(directory,name+'.json'),JSON.stringify(clean(tree)));
}
afterEach(()=>jest.restoreAllMocks());

test.each(['cash','mortgage','rent'] as const)('%s is reviewed and committed from the same property screen, with real fees/payment and durable failure retry',async selected=>{
  const context=await setup();let view=render(frame());try{
    const original=encodeWorld(world()),beforeRows=context.rows(),cash=accountFor(world()).cash;
    expect(screen.getByRole('radio',{name:'Buy Outright'})).toBeChecked();
    if(selected==='mortgage'){
      await method('Mortgage');await press(/^Deposit/);await method('40%');await press('Choose');await press(/^Term/);await method('20 years');await press('Choose');
    }else if(selected==='rent')await method('Rent');
    const quote=purchaseQuote(context.initial,studio,selected==='mortgage'?'mortgage':'cash',selected==='mortgage'?4000:2000,selected==='mortgage'?240:360),rent=rentalQuote(context.initial,studio).monthlyRent;
    if(selected==='rent'){expect(screen.getByLabelText(displayText('Monthly rent: '+money(rent)))).toBeOnTheScreen();expect(screen.queryByText('Purchase fees')).toBeNull();}
    else{expect(screen.getByLabelText(displayText('Purchase fees: '+money(quote.fee)))).toBeOnTheScreen();expect(screen.getByLabelText(displayText('Cash paid upfront: '+money(quote.cashRequired)+'. '+(selected==='mortgage'?'Deposit plus purchase fees':'Price plus purchase fees')))).toBeOnTheScreen();if(selected==='mortgage')expect(screen.getByLabelText(displayText('Monthly payment: '+money(quote.payment)))).toBeOnTheScreen();}
    expect(mockPush).not.toHaveBeenCalled();expect(encodeWorld(world())).toBe(original);
    await press(selected==='rent'?'Review Lease':'Review Purchase');await press('Never mind');expect(encodeWorld(world())).toBe(original);expect(context.rows()).toEqual(beforeRows);
    await press(selected==='rent'?'Review Lease':'Review Purchase');const confirm=selected==='rent'?'Sign Lease':'Confirm Purchase';
    context.sqlite.exec("CREATE TRIGGER fail_property_confirm BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'property storage failure'); END");await press(confirm);expect(encodeWorld(world())).toBe(original);expect(context.rows()).toEqual(beforeRows);expect(screen.getByRole('button',{name:confirm})).toBeOnTheScreen();
    context.sqlite.exec('DROP TRIGGER fail_property_confirm');await press(confirm);
    const command:GameCommand=selected==='rent'?{type:'sign-home-lease',catalogId:'studio',quotedRent:rent}:{type:'buy-asset',catalogId:'studio',financing:selected==='mortgage'?'mortgage':'cash',depositBps:selected==='mortgage'?4000:2000,termMonths:selected==='mortgage'?240:360,quotedPrice:assetPrice(context.initial,studio)};
    expect(encodeWorld(world())).toBe(encodeWorld(resolveCommand(context.initial,command,true)));expect(accountFor(world()).cash).toBe(cash-(selected==='rent'?rent:quote.cashRequired));
    if(selected==='rent'){expect(world().assets).toHaveLength(0);expect(rentalResidence(world())?.catalogId).toBe('studio');expect(world().ledger.filter(row=>row.category==='housing-rent')).toHaveLength(1);}
    else{expect(world().assets.filter(asset=>asset.ownerId===world().activePersonId)).toHaveLength(1);if(selected==='mortgage')expect(world().liabilities.find(debt=>debt.kind==='mortgage')).toMatchObject({principal:quote.principal,monthlyPayment:quote.payment,remainingMonths:240});else expect(world().liabilities.some(debt=>debt.kind==='mortgage')).toBe(false);}
    const saved=encodeWorld(world());view.unmount();await context.cold();mockRoute.method=selected==='cash'?undefined:selected;view=render(frame());expect(encodeWorld(world())).toBe(saved);await press('Continue');
    if(selected==='rent'){expect(screen.getByText('Your Rented Home')).toBeOnTheScreen();const beforeMove=accountFor(world()).cash;await press('Review Move Out');await press('Move Out');expect(rentalResidence(world())).toBeUndefined();expect(accountFor(world()).cash).toBe(beforeMove);}
  }finally{view.unmount();context.close();}
},60000);

test('switching methods only updates the quote, and a busy/stale confirmation cannot buy twice or act after a life switch',async()=>{
  const context=await setup(),view=render(frame());try{
    const original=encodeWorld(world()),quote=purchaseQuote(world(),studio,'cash');await method('Mortgage');await method('Rent');await method('Buy Outright');expect(screen.getByLabelText(displayText('Cash paid upfront: '+money(quote.cashRequired)+'. Price plus purchase fees'))).toBeOnTheScreen();expect(encodeWorld(world())).toBe(original);
    await press('Review Purchase');const stale=screen.UNSAFE_getAllByType(EventModal).find(item=>item.props.event?.kind==='confirmation')!.props.onChoose,release=context.pauseNext();await act(async()=>{fireEvent.press(screen.getByRole('button',{name:'Confirm Purchase'}));stale('confirm');fireEvent.press(screen.getByRole('button',{name:'Never mind'}));});expect(mockStore.getState().busy).toBe(true);expect(mockDismissTo).not.toHaveBeenCalled();expect(world().assets).toHaveLength(0);await act(async()=>{release();});expect(world().assets).toHaveLength(1);
    await act(async()=>{await mockStore.getState().startLife({...randomCreation(44),country:'US',city:'New York',background:'ordinary'},44);});const before=encodeWorld(world());await act(async()=>{await stale('confirm');});expect(encodeWorld(world())).toBe(before);expect(world().assets).toHaveLength(0);
  }finally{view.unmount();context.close();}
});

test('all properties share one price-and-rent catalogue; canonical and legacy deep links select the intended method',async()=>{
  const context=await setup();let view=render(frame(<Shopping />));try{
    expect(screen.UNSAFE_getAllByType(AssetListing)).toHaveLength(assetCatalog.filter(offer=>offer.kind==='property').length);expect(screen.queryByRole('button',{name:/^Rent a Home/})).toBeNull();fireEvent.press(screen.getByRole('button',{name:/City Studio.*Buy .*Rent .*month.*Beds: 1/}));expect(mockPush).toHaveBeenLastCalledWith({pathname:'/offer/[id]',params:{id:'studio'}});
    view.rerender(frame(<Rentals />));expect(screen.getByRole('header',{name:'Real Estate'})).toBeOnTheScreen();fireEvent.press(screen.getByRole('button',{name:/City Studio.*Buy .*Rent .*month.*Beds: 1/}));expect(mockPush).toHaveBeenLastCalledWith({pathname:'/offer/[id]',params:{id:'studio',method:'rent'}});
    for(const route of ['rent','mortgage'] as const){mockRoute.method=route;view.rerender(frame(<Offer />));expect(screen.getByRole('radio',{name:route==='rent'?'Rent':'Mortgage'})).toBeChecked();expect(screen.UNSAFE_getAllByType(CatalogArt).some(art=>art.props.id==='studio'&&art.props.size===190)).toBe(true);}
    mockRoute.method=undefined;view.rerender(frame(<Rental />));expect(screen.getByRole('radio',{name:'Rent'})).toBeChecked();expect(screen.getByRole('header',{name:'Property Details'})).toBeOnTheScreen();
    mockRoute.id='missing-property';view.rerender(frame(<Offer />));expect(screen.getByRole('header',{name:'Offer unavailable'})).toBeOnTheScreen();mockRoute.id='city-car';view.rerender(frame(<Rental />));expect(screen.getByRole('header',{name:'Offer unavailable'})).toBeOnTheScreen();
  }finally{view.unmount();context.close();}
});

test.each([false,true])('property options retain one illustration and readable quotes at phone width (dark=%s)',async dark=>{
  const context=await setup(),width=dark?320:390;jest.spyOn(require('react-native'),'useWindowDimensions').mockReturnValue({width,height:844,scale:2,fontScale:dark?1.4:1});const view=render(frame(<Shopping />,dark));try{
    capture('polish3-real-estate-'+(dark?'dark-large':'light'),view.toJSON());view.rerender(frame(<Offer />,dark));
    for(const option of [{radio:'Buy Outright',suffix:'cash'},{radio:'Mortgage',suffix:'mortgage'},{radio:'Rent',suffix:'rent'}]){await method(option.radio);expect(screen.getByRole('radio',{name:option.radio})).toBeChecked();expect(screen.getByRole('header',{name:'Property Details'})).toBeOnTheScreen();capture('polish3-property-'+option.suffix+'-'+(dark?'dark-large':'light'),view.toJSON());}
    expect(context.rows().receipts).toHaveLength(0);
  }finally{view.unmount();context.close();}
});
