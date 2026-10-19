import type { World } from '../model';
import { ageOn } from '../model';
import { countries } from '../countries';
import { rules } from '../rules';
import { roundRatio } from '../money';
import { fxMoney } from '../valuation';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
type IncomePart={id:string;label:string;annual:bigint;paidMonths:number};
const recurringCategories=new Map([
 ['rent','Rental receipts'],['dividend','Investment distributions'],['creator-income','Creator payments'],['sponsorship','Delivered brand agreements'],['career-royalties','Music royalties'],['creator-contract-income','Freelance production'],['clinic-income','Clinical services'],['royal-allowance','Attended royal duties'],
]);
const monthOf=(year:number,month:number)=>year*12+month-1;
/** Authored underwriting: current external contracts and demonstrated recent receipts.
 * Company promises, owner capital, gifts, asset sales and isolated payments are not income evidence.
 */
export function qualifyingAnnualIncome(world:World,personId=world.activePersonId){
 const person=world.people[personId],currency=countries[person.country].currency,current=monthOf(world.date.year,world.date.month),cutoff=current-11,parts:IncomePart[]=[];
 const eligibleMonths=(months:Set<number>)=>months.size>=3&&Math.max(...months)>=current-2;
 const local=(minor:bigint,source:typeof currency)=>fxMoney(world,{minor,currency:source},currency).minor;
 if(!person.died&&!isConfined(world,person)&&!person.legal.wanted&&person.employment&&!person.employment.companyId){
  const contract=world.careers.find(item=>item.employmentId===person.employment!.id&&item.status==='active'),service=world.serviceCareers.find(item=>item.employmentId===person.employment!.id&&item.status==='active'),serviceContract=service?.contracts.find(item=>item.employmentId===person.employment!.id),remaining=contract?.contractMonthsRemaining??(serviceContract?serviceContract.term-serviceContract.months:12),annual=roundRatio(person.employment.annualPay*BigInt(Math.max(0,Math.min(12,remaining)))*BigInt(hospitalized(world,person)?5000:10000),120000n);
  if(annual>0n)parts.push({id:'employment',label:remaining<12?'Remaining external contract':'Current external employment',annual,paidMonths:person.employment.paidMonths});
 }
 if(!person.died&&person.finance.pensionAnnual>0n)parts.push({id:'pension',label:'Earned pension',annual:person.finance.pensionAnnual,paidMonths:person.finance.pensionMonths});
 const histories=new Map<string,{totals:Map<typeof currency,bigint>;months:Set<number>}>();
 for(const entry of world.ledger){const month=monthOf(entry.year,entry.month);if(entry.personId!==personId||entry.cashDelta<=0n||month<cutoff||month>current||!recurringCategories.has(entry.category))continue;const evidence=histories.get(entry.category)??{totals:new Map<typeof currency,bigint>(),months:new Set<number>()};evidence.totals.set(entry.currency,(evidence.totals.get(entry.currency)??0n)+entry.cashDelta);evidence.months.add(month);histories.set(entry.category,evidence);}
 for(const [category,evidence] of histories){const annual=[...evidence.totals].reduce((sum,[source,amount])=>sum+local(amount,source),0n);if(eligibleMonths(evidence.months)&&annual>0n)parts.push({id:category,label:recurringCategories.get(category)!,annual,paidMonths:evidence.months.size});}
 for(const company of world.businesses.filter(item=>item.status==='active')){
  const owner=company.ownerId===personId,employee=person.employment?.companyId===company.id;if(!owner&&!employee)continue;
  let receipts=0n,ownerWagesAccrued=0n;const paidMonths=new Set<number>();
  for(const entry of world.businessLedger){const month=monthOf(entry.date.year,entry.date.month);if(entry.businessId!==company.id||entry.personId!==personId||month<cutoff||month>current)continue;
   const wage=entry.category==='payroll'||entry.category==='payable-payment'&&entry.payableId&&world.businessPayables.some(item=>item.id===entry.payableId&&item.kind==='wages');
   if(owner&&entry.category==='payroll')ownerWagesAccrued+=-entry.cashDelta+entry.debtDelta;
   if(entry.cashDelta<0n&&(wage||owner&&entry.category==='owner-distribution')){receipts-=entry.cashDelta;paidMonths.add(month);}
  }
  if(!eligibleMonths(paidMonths)||receipts<=0n)continue;
  if(owner){const operating=company.months.filter(item=>item.month>=cutoff&&item.month<=current).reduce((sum,item)=>sum+item.profit,0n)+ownerWagesAccrued,capacity=operating>0n?operating:0n;receipts=receipts<capacity?receipts:capacity;}
  if(receipts>0n)parts.push({id:company.id,label:(owner?'Earned company income: ':'Funded company wages: ')+company.name,annual:local(receipts,company.currency),paidMonths:paidMonths.size});
 }
 return {currency,annual:person.died?0n:parts.reduce((sum,item)=>sum+item.annual,0n),parts:person.died?[]:parts};
}
export function personalLoanCapacity(world:World){const person=world.people[world.activePersonId],income=qualifyingAnnualIncome(world),limit=income.annual/2n,outstanding=world.liabilities.filter(item=>item.ownerId===person.id&&item.kind==='personal'&&item.principal>0n).reduce((sum,item)=>sum+fxMoney(world,{minor:item.principal,currency:item.currency},income.currency).minor,0n);const eligibleBorrower=!person.died&&ageOn(person,world.date)>=rules[person.country].adultAge&&!isConfined(world,person)&&!person.legal.wanted;return {...income,limit,outstanding,eligibleBorrower,available:eligibleBorrower&&limit>outstanding?limit-outstanding:0n};}
export function personalBorrowReason(world:World,amount:bigint):string|undefined{const person=world.people[world.activePersonId];if(ageOn(person,world.date)<rules[person.country].adultAge)return 'Personal borrowing is available to adults';if(isConfined(world,person)||person.legal.wanted)return 'Resolve custody or pursuit before new borrowing';const capacity=personalLoanCapacity(world);if(!capacity.annual)return 'Current external employment, an earned pension, or three recent paid months of recurring income are required';if(amount>capacity.available)return 'Personal borrowing is limited to half your qualifying annual income, including existing personal debts';}
