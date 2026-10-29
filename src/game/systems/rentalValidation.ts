import type { World } from '../model';
import { indexLedger } from '../ledgerIndex';
import { ageOn, compareDates } from '../personHelpers';
import { assetCatalog } from '../content/assets';
import { countries } from '../countries';
import { rules } from '../rules';

export function validateRentalLeases(world: World, ledger=indexLedger(world.ledger)) {
  const ids=new Set<string>(), activeHouseholds=new Set<string>(), activeTenants=new Set<string>(), payments=new Set<string>();
  const now=world.date.year*12+world.date.month-1;
  for(const lease of world.rentalLeases) {
    const tenant=world.people[lease.tenantId], household=world.households.find(item=>item.id===lease.householdId);
    if(!tenant||ids.has(lease.id)||!assetCatalog.some(offer=>offer.id===lease.catalogId&&offer.kind==='property')||!countries[lease.country].cities.includes(lease.city)||countries[lease.country].currency!==lease.currency||ageOn({...tenant,died:null},lease.started)<rules[lease.country].adultAge||compareDates(lease.started,world.date)>0||tenant.died&&compareDates(lease.started,tenant.died)>0||!!lease.ended!==!!lease.endReason||lease.ended&&(compareDates(lease.ended,lease.started)<0||compareDates(lease.ended,world.date)>0)) throw new Error('Invalid rental lease history');
    ids.add(lease.id);
    if(!lease.ended) {
      if(tenant.died||!household||tenant.householdId!==household.id||!household.members.includes(tenant.id)||household.homeAssetId||tenant.country!==lease.country||tenant.city!==lease.city||activeHouseholds.has(household.id)||activeTenants.has(tenant.id)) throw new Error('Invalid rented residence');
      activeHouseholds.add(household.id);activeTenants.add(tenant.id);
    }
    let expected=lease.started.year*12+lease.started.month-1;
    for(const payment of lease.payments) {
      const row=ledger.transactions.get(payment.transactionId);
      if(payments.has(payment.transactionId)||payment.month!==expected++||payment.month>now||lease.ended&&payment.month>lease.ended.year*12+lease.ended.month-1||!row||row.personId!==tenant.id||row.currency!==lease.currency||row.category!=='housing-rent'||row.cashDelta>0n||row.debtDelta<0n||-row.cashDelta+row.debtDelta!==lease.monthlyRent||row.year*12+row.month-1<payment.month) throw new Error('Rental payment does not reconcile with ledger');
      if(payment===lease.payments[0]&&(row.debtDelta!==0n||row.year!==lease.started.year||row.month!==lease.started.month)) throw new Error('First rent was not paid when signing');
      payments.add(payment.transactionId);
    }
  }
  if(ledger.categories('housing-rent').some(row=>!payments.has(row.id))) throw new Error('Rent payment lacks its lease');
}
