import { createLife, randomCreation } from '../../src/game/createLife';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { assetCatalog } from '../../src/game/content/assets';
import { rentalHomeMonth, rentalQuote } from '../../src/game/systems/rentalHomes';
import { refreshRentalLeases, rentalResidence } from '../../src/game/systems/rentalSchemas';
import { householdLivingCost, financialActors, ownHousehold, moveHousehold } from '../../src/game/systems/households';
import { accountFor, charge } from '../../src/game/systems/common';
import { assetPrice } from '../../src/game/systems/assets';
import { financeMonth } from '../../src/game/systems/finance';
import { netWorth } from '../../src/game/systems/markets';
import { rules } from '../../src/game/rules';
import { roundRatio } from '../../src/game/money';
import { annualFinanceSummary, indexPersonalFinances } from '../../src/ui/annualFinances';
import graduate from '../fixtures/v3-employed-graduate.json';
const offer=assetCatalog.find(item=>item.id==='studio')!;
function fixture(){const world=decodeWorld(JSON.stringify(graduate)),account=accountFor(world);account.cash+=100000000n;account.openingCash+=100000000n;return world;}
function ack(world:World){return resolveCommand(world,{type:'acknowledge',resultId:world.pending!.id});}
function apply(world:World,command:GameCommand){return ack(resolveCommand(world,command));}
function rent(world=fixture()){return apply(world,{type:'sign-home-lease',catalogId:offer.id,quotedRent:rentalQuote(world,offer).monthlyRent});}
function nextMonth(world:World){if(world.date.month===12){world.date.year++;world.date.month=1;}else world.date.month++;world.date.day=Math.min(world.date.day,28);}

test('signing pays one disclosed month, preserves ownership and RNG, and records rented residence separately',()=>{
  const initial=fixture(), player=initial.people[initial.activePersonId], rentDue=rentalQuote(initial,offer).monthlyRent, worth=netWorth(initial).minor, before=householdLivingCost(initial,player);
  const after=rent(initial), lease=after.rentalLeases[0];
  expect(after.assets).toEqual(initial.assets);expect(netWorth(after).minor).toBe(worth-rentDue);expect(after.random).toEqual(initial.random);
  expect(accountFor(initial).cash-accountFor(after).cash).toBe(rentDue);expect(lease.payments).toHaveLength(1);expect(rentalResidence(after)?.name).toBe(offer.name);
  expect(householdLivingCost(after,after.people[player.id])).toBe(roundRatio(before*4500n,10000n));
  expect(after.ledger.at(-1)).toMatchObject({personId:player.id,category:'housing-rent',cashDelta:-rentDue,debtDelta:0n});
  expect(decodeWorld(encodeWorld(after))).toEqual(after);validateWorld(after);
});

test('calendar-month rent has one household payer and a saved cursor, including cold retries and arrears',()=>{
  const initial=fixture(),player=initial.people[initial.activePersonId],other=Object.values(initial.people).find(person=>person.id!==player.id&&!person.died&&person.country===player.country&&person.city===player.city)!;
  moveHousehold(initial,[other.id],player.householdId!);
  const world=rent(initial), lease=world.rentalLeases[0], member=other.id;
  expect(financialActors(world).some(person=>person.id===lease.tenantId)).toBe(true);
  nextMonth(world);rentalHomeMonth(world,world.people[lease.tenantId]);rentalHomeMonth(world,world.people[member]);rentalHomeMonth(world,world.people[lease.tenantId]);
  expect(world.ledger.filter(row=>row.category==='housing-rent')).toHaveLength(2);
  const cold=decodeWorld(encodeWorld(world));rentalHomeMonth(cold,cold.people[lease.tenantId]);expect(encodeWorld(cold)).toBe(encodeWorld(world));
  // Exhaust cash through a ledger-backed expense so the next actual rent becomes debt.
  const debtBefore=cold.liabilities.filter(item=>item.kind==='living').reduce((sum,item)=>sum+item.principal,0n);
  const account=accountFor(cold);charge(cold,account.cash,'test-expense','Test cash exhaustion');nextMonth(cold);rentalHomeMonth(cold,cold.people[lease.tenantId]);
  expect(cold.ledger.at(-1)).toMatchObject({category:'housing-rent',cashDelta:0n,debtDelta:lease.monthlyRent});expect(cold.liabilities.filter(item=>item.kind==='living').reduce((sum,item)=>sum+item.principal,0n)).toBe(debtBefore+lease.monthlyRent);validateWorld(cold);
});

test('monthly household charges exclude the housing allowance and rent appears once as an expense',()=>{
  const world=rent(),player=world.people[world.activePersonId],lease=world.rentalLeases[0],otherCost=householdLivingCost(world,player);nextMonth(world);
  const cash=accountFor(world).cash;financeMonth(world);expect(cash-accountFor(world).cash).toBe(lease.monthlyRent+otherCost);
  const monthRows=world.ledger.filter(row=>row.year===world.date.year&&row.month===world.date.month);expect(monthRows.filter(row=>row.category==='housing-rent')).toHaveLength(1);expect(monthRows.find(row=>row.category==='living')?.cashDelta).toBe(-otherCost);
  const summary=annualFinanceSummary(indexPersonalFinances(world,player.id),world.date.year,lease.currency);expect(summary.sections.find(section=>section.id==='expenses')?.categories.find(category=>category.category==='housing-rent')?.paid).toBe(lease.monthlyRent*2n);
  validateWorld(world);
});

test('unpaid rent and bills become debt without charging interest on the month they first fall due',()=>{
  let world=fixture();for(const debt of world.liabilities.filter(item=>item.ownerId===world.activePersonId&&item.principal>0n))world=apply(world,{type:'repay',liabilityId:debt.id,amount:debt.principal});
  world=rent(world);charge(world,accountFor(world).cash,'test-expense','Test cash exhaustion');nextMonth(world);
  const due=world.rentalLeases[0].monthlyRent+householdLivingCost(world,world.people[world.activePersonId]);financeMonth(world);
  const added=world.ledger.filter(row=>row.year===world.date.year&&row.month===world.date.month);expect(added.filter(row=>row.category==='interest')).toHaveLength(0);expect(added.reduce((sum,row)=>sum+row.debtDelta,0n)).toBe(due);validateWorld(world);
});

test('moving out stops future rent, restores ordinary housing and refunds nothing',()=>{
  const world=rent(),cash=accountFor(world).cash,lease=world.rentalLeases[0],before=fixture(),base=householdLivingCost(before,before.people[before.activePersonId]);
  const after=apply(world,{type:'end-home-lease',leaseId:lease.id});expect(accountFor(after).cash).toBe(cash);expect(rentalResidence(after)).toBeUndefined();expect(after.rentalLeases[0].endReason).toBe('moved-out');expect(householdLivingCost(after,after.people[after.activePersonId])).toBe(base);
  nextMonth(after);rentalHomeMonth(after,after.people[after.activePersonId]);expect(after.ledger.filter(row=>row.category==='housing-rent')).toHaveLength(1);validateWorld(after);
});

test('buying while renting keeps a property investment; moving into it closes the lease while landlord renting still works',()=>{
  let world=rent();world=apply(world,{type:'buy-asset',catalogId:offer.id,financing:'cash',depositBps:2000,termMonths:360,quotedPrice:assetPrice(world,offer)});
  const asset=world.assets.find(item=>item.ownerId===world.activePersonId)!;expect(asset.primaryHome).toBe(false);expect(rentalResidence(world)).toBeDefined();
  world=apply(world,{type:'move-in',assetId:asset.id});expect(rentalResidence(world)).toBeUndefined();expect(world.rentalLeases[0].endReason).toBe('owned-home');
  world=apply(world,{type:'rent-property',assetId:asset.id});expect(world.assets.find(item=>item.id===asset.id)?.rental).toBe('listed');validateWorld(world);
});

test.each(['quote','cash','minor','duplicate'] as const)('ineligible %s leases leave the source byte-for-byte intact',kind=>{
  let world=kind==='duplicate'?rent():kind==='minor'?createLife('life_minor',123,randomCreation(123),{year:2026,month:10,day:22}):fixture();if(kind==='cash')charge(world,accountFor(world).cash,'test-expense','Test cash exhaustion');if(kind==='minor')world.birthAcknowledged=true;
  const before=encodeWorld(world),quotedRent=rentalQuote(world,offer).monthlyRent+(kind==='quote'?1n:0n);expect(()=>resolveCommand(world,{type:'sign-home-lease',catalogId:offer.id,quotedRent})).toThrow(({quote:/quote changed/,cash:/first month/,minor:/available from age/,duplicate:/current rental/})[kind]);expect(encodeWorld(world)).toBe(before);
});

test.each(['death','household','location'] as const)('lease closes centrally on tenant %s without altering old payments',kind=>{
  const world=rent(),player=world.people[world.activePersonId],payments=[...world.rentalLeases[0].payments];
  if(kind==='death')player.died={...world.date};else if(kind==='household')ownHousehold(world,player);else player.city='Elsewhere';
  refreshRentalLeases(world);expect(world.rentalLeases[0].endReason).toBe(({death:'tenant-died',household:'household-changed',location:'relocated'} as const)[kind]);expect(world.rentalLeases[0].payments).toEqual(payments);expect(rentalResidence(world)).toBeUndefined();
});

test.each(['missing-payment','amount','duplicate','residence'] as const)('saved lease rejects %s inconsistencies',kind=>{
  const world=rent(),lease=world.rentalLeases[0];if(kind==='missing-payment')lease.payments[0].transactionId='missing';if(kind==='amount')lease.monthlyRent++;if(kind==='duplicate')world.rentalLeases.push({...lease});if(kind==='residence')world.households.find(item=>item.id===lease.householdId)!.homeAssetId='missing';expect(()=>validateWorld(world)).toThrow();
});

test('World41 migration adds only empty leases and current markers, preserving old bound data exactly',()=>{
  const current=JSON.parse(encodeWorld(fixture())),old={...current,schemaVersion:41,engineVersion:43,contentVersion:20};delete old.rentalLeases;
  const before=JSON.stringify(old),migrated=decodeWorld(before);expect(JSON.parse(encodeWorld(migrated))).toEqual({...old,schemaVersion:43,engineVersion:45,contentVersion:22, personSupportRequests: [], personActionHistory: [],rentalLeases:[]});expect(JSON.stringify(old)).toBe(before);
});
