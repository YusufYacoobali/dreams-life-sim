import type { World } from '../model';
import type { LedgerIndex } from '../ledgerIndex';
import { compareDates } from '../personHelpers';
import { monthFrom } from '../calendar';
import { supportAttemptKey, supportChanceV1 } from './personSupportSchemas';
import { personActionKey } from './personActionSchemas';

export function validatePersonSupport(world:World,ledger:LedgerIndex) {
  const ids=new Set<string>(),attempts=new Set<string>(),receipts=new Set<string>();
  const relationships=new Map(world.relationships.map(row=>[row.id,row]));
  for(const row of world.personSupportRequests) {
    const actor=world.people[row.actorId],target=world.people[row.targetId],relation=relationships.get(row.relationshipId),key=supportAttemptKey(row.actorId,row.targetId,row.proposed.year);
    if(!actor||!target||actor===target||!relation||![relation.from,relation.to].includes(row.actorId)||![relation.from,relation.to].includes(row.targetId)||ids.has(row.id)||!/^person_support_\d+$/.test(row.id)||attempts.has(key)||world.actionCounts[key]!==1||compareDates(row.proposed,world.date)>0||compareDates(row.expires,monthFrom(row.proposed,12,row.proposed.day))!==0||row.chance!==supportChanceV1(row)||row.offered>row.requested||row.offered>row.available||row.resolved&&compareDates(row.resolved,row.proposed)<0||row.resolved&&compareDates(row.resolved,world.date)>0)throw new Error('Invalid personal support request');
    ids.add(row.id);attempts.add(key);
    const succeeded=row.available>0n&&row.roll<=row.chance;
    if(succeeded!==['gift','partial','loan-offered'].includes(row.outcome)||row.outcome==='gift'&&row.offered!==row.requested||row.outcome==='partial'&&row.offered>=row.requested||!succeeded&&row.offered!==0n)throw new Error('Personal support outcome contradicts its decision');
    if(row.outcome==='loan-offered') {
      if(row.offered<=0n||row.actorAge<18||!['offered','accepted','declined','expired'].includes(row.status)||row.status==='offered'&&(row.resolved||actor.died||target.died||compareDates(world.date,row.expires)>0)||row.status!=='offered'&&!row.resolved||row.status==='accepted'&&row.resolved&&compareDates(row.resolved,row.expires)>0)throw new Error('Invalid personal loan offer');
    } else if(row.status!=='completed'||!row.resolved||row.liabilityId)throw new Error('A money request cannot invent a loan');
    const funded=row.outcome==='gift'||row.outcome==='partial'||row.status==='accepted';
    if(!funded) {if(row.debitId||row.creditId||row.liabilityId)throw new Error('Unaccepted support cannot transfer money or create debt');continue;}
    if(row.offered<=0n||!row.debitId||!row.creditId||receipts.has(row.debitId)||receipts.has(row.creditId))throw new Error('Personal support needs unique funding receipts');
    const debit=ledger.transactions.get(row.debitId),credit=ledger.transactions.get(row.creditId),loan=row.status==='accepted',date=loan?row.resolved!:row.proposed,category=loan?'person-loan':'person-support-gift';
    if(!debit||!credit||debit.personId!==row.targetId||credit.personId!==row.actorId||debit.currency!==row.currency||credit.currency!==row.currency||debit.cashDelta!==-row.offered||credit.cashDelta!==row.offered||debit.debtDelta!==0n||credit.debtDelta!==(loan?row.offered:0n)||debit.category!==category||credit.category!==category||debit.liabilityId!==null||credit.liabilityId!==row.liabilityId||[debit,credit].some(receipt=>receipt.year!==date.year||receipt.month!==date.month))throw new Error('Personal support differs from actual funding');
    receipts.add(row.debitId);receipts.add(row.creditId);
    if(loan) {const debt=world.liabilities.find(item=>item.id===row.liabilityId);if(row.liabilityId!=='debt_person_loan_'+row.id||!debt||debt.ownerId!==row.actorId||debt.currency!==row.currency||debt.interestBps!==0||debt.kind!=='personal'||debt.creditorId!==row.targetId&&debt.creditorId!==null)throw new Error('Personal loan differs from accepted terms');}
  }
  const actionIds=new Set<string>(),actionAttempts=new Set<string>(),permissions=new Set<string>();
  for(const row of world.personActionHistory) {
    const relation=relationships.get(row.relationshipId),key=personActionKey(row.actorId,row.targetId,row.action,row.date.year);
    if(!world.people[row.actorId]||!world.people[row.targetId]||row.actorId===row.targetId||!relation||![relation.from,relation.to].includes(row.actorId)||![relation.from,relation.to].includes(row.targetId)||actionIds.has(row.id)||!/^person_action_\d+$/.test(row.id)||actionAttempts.has(key)||world.actionCounts[key]!==1||compareDates(row.date,world.date)>0)throw new Error('Invalid person action history');
    actionIds.add(row.id);actionAttempts.add(key);
    const consent=['ask-advice','ask-permission','ask-help','request-gift'].includes(row.action);
    if(consent?(row.action!=='request-gift'&&(row.outcome==='approved')!==(row.roll<=row.chance)||row.outcome==='completed'):row.outcome!=='completed')throw new Error('Person action outcome contradicts consent');
    if(row.action==='ask-activity') {const approval=world.personActionHistory.find(item=>item.id===row.permissionId);if(!approval||approval.actorId!==row.actorId||approval.targetId!==row.targetId||approval.action!=='ask-permission'||approval.outcome!=='approved'||approval.date.year!==row.date.year||compareDates(approval.date,row.date)>0||permissions.has(approval.id))throw new Error('An outing needs an actual unused parental permission');permissions.add(approval.id);}else if(row.permissionId)throw new Error('Only an outing can consume permission');
    if(row.action==='request-gift'&&row.outcome==='approved') {
      const receipt=row.transactionId&&ledger.transactions.get(row.transactionId);
      if(!row.assetId||!receipt||receipts.has(receipt.id)||receipt.personId!==row.targetId||receipt.category!=='person-present'||receipt.cashDelta>=0n||receipt.debtDelta!==0n||receipt.liabilityId!==null||receipt.year!==row.date.year||receipt.month!==row.date.month)throw new Error('A requested gift needs its actual purchase');
      receipts.add(receipt.id);
      const asset=world.assets.find(item=>item.id===row.assetId);if(asset&&(asset.catalogId!=='watch'||asset.pricePaid!==-receipt.cashDelta||asset.currency!==receipt.currency))throw new Error('Gift asset differs from purchase');
    } else if(row.assetId||row.transactionId)throw new Error('A declined or non-gift action cannot buy an asset');
  }
}
