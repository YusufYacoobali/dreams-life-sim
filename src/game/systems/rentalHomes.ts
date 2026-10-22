import type { Person, World } from '../model';
import { ageOn } from '../personHelpers';
import { assetCatalog, type AssetOffer } from '../content/assets';
import { rules } from '../rules';
import { formatMoney, roundRatio } from '../money';
import { IneligibleAction } from '../errors';
import { assetPrice } from './assetPricing';
import { accountFor, active, availableCash, charge, fact, result } from './common';
import { ownHousehold } from './households';
import { isConfined } from './legalSchemas';
import { endRentalLease, refreshRentalLeases, rentalResidence } from './rentalSchemas';

export const rentalMonth = (world: World) => world.date.year*12+world.date.month-1;
export function rentalQuote(world: World, offer: AssetOffer) {
  return { monthlyRent:roundRatio(assetPrice(world,offer)*600n,120000n), currency:accountFor(world).currency };
}
export function rentalReason(world: World, offer: AssetOffer): string | undefined {
  const person=active(world);
  if (offer.kind!=='property') return 'Choose a home to rent';
  if (person.died) return 'This life has ended';
  if (isConfined(world)) return 'New leases are unavailable in custody';
  if (ageOn(person,world.date)<rules[person.country].adultAge) return 'Renting a home is available from age '+rules[person.country].adultAge;
  if (rentalResidence(world,person)) return 'Move out of your current rental before signing another lease';
  if (availableCash(accountFor(world))<rentalQuote(world,offer).monthlyRent) return 'You need the first month’s rent in your available balance';
}

export function signHomeLease(world: World, catalogId: string, quotedRent: bigint) {
  const offer=assetCatalog.find(item=>item.id===catalogId);
  if(!offer||offer.kind!=='property') throw new IneligibleAction('This rental home is unavailable');
  const quote=rentalQuote(world,offer), reason=rentalReason(world,offer);
  if(quote.monthlyRent!==quotedRent) throw new IneligibleAction('The rent quote changed. Review it again');
  if(reason) throw new IneligibleAction(reason);
  const person=active(world);
  if(!person.householdId) ownHousehold(world,person);
  const household=world.households.find(item=>item.id===person.householdId)!;
  household.homeAssetId=null;
  for(const asset of world.assets) if(asset.primaryHome&&asset.ownerId&&household.members.includes(asset.ownerId)) asset.primaryHome=false;
  charge(world,quote.monthlyRent,'housing-rent','First month’s rent: '+offer.name);
  const lease: World['rentalLeases'][number]={id:'lease_'+world.revision,tenantId:person.id,householdId:household.id,catalogId:offer.id,name:offer.name,
    country:person.country,city:person.city,currency:quote.currency,monthlyRent:quote.monthlyRent,started:{...world.date},ended:null,endReason:null,
    payments:[{month:rentalMonth(world),transactionId:world.ledger.at(-1)!.id}]};
  world.rentalLeases.push(lease);
  fact(world,'I rented '+lease.name+' in '+lease.city+' for '+formatMoney({minor:lease.monthlyRent,currency:lease.currency})+' a month.','housing');
  result(world,'Welcome to your rental','You’ve got the keys. The first month is paid; rent is due monthly until you move out.','property',[
    {id:'home',label:'Rented home',value:lease.name,tone:'neutral'},
    {id:'rent',label:'Monthly rent',value:formatMoney({minor:lease.monthlyRent,currency:lease.currency}),tone:'negative'},
  ]);
}

export function leaveHomeLease(world: World, leaseId: string) {
  const lease=world.rentalLeases.find(item=>item.id===leaseId&&item.tenantId===world.activePersonId&&!item.ended);
  if(!lease) throw new IneligibleAction('You do not hold this active lease');
  rentalHomeMonth(world,active(world));
  endRentalLease(world,lease,'moved-out');
  fact(world,'I moved out of '+lease.name+'.','housing');
  result(world,'You moved out','Future rent has stopped. Your normal housing budget resumes; rent already paid is not refunded.','property');
}

/** Each lease has one payer and a persisted calendar-month cursor. */
export function rentalHomeMonth(world: World, person: Person) {
  refreshRentalLeases(world);
  for(const lease of world.rentalLeases.filter(item=>item.tenantId===person.id&&!item.ended)) {
    for(let month=lease.payments.at(-1)!.month+1;month<=rentalMonth(world);month++) {
      charge(world,lease.monthlyRent,'housing-rent','Monthly rent: '+lease.name,'living',lease.currency,person);
      lease.payments.push({month,transactionId:world.ledger.at(-1)!.id});
    }
  }
}
