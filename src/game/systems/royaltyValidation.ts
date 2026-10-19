import { indexLedger } from '../ledgerIndex';
import { World,ageOn } from '../model';
import { countries } from '../countries';
import { daysInMonth } from '../calendar';
import { monthlyAmount,rules } from '../rules';
import { roundRatio } from '../money';
import { royalRoleBps } from '../content/royalty';
import { royalEligible,royalLine } from './royaltyMath';
const compare=(a:World['date'],b:World['date'])=>a.year-b.year||a.month-b.month||a.day-b.day;
const absolute=(date:World['date'])=>date.year*12+date.month-1;
const countBits=(value:number)=>value.toString(2).replaceAll('0','').length;
export function validateRoyalty(world:World, ledger = indexLedger(world.ledger)){
 const ids=new Set<string>(),activeMemberships=new Set<string>(),income=new Map<string,bigint>(),month=absolute(world.date);
 for(const house of world.royalHouses){
  const members=new Map(house.members.map(item=>[item.personId,item])),founder=members.get(house.founderId),line=royalLine(world,house),heads=new Set(house.successions.map(item=>item.toId).filter((id):id is string=>!!id));
  if(ids.has(house.id)||members.size!==house.members.length||!founder||founder.joinedVia!=='founder'||!founder.hereditary||house.currency!==countries[house.country].currency||compare(house.started,world.date)>0||house.lastMonth>month||house.lastMonth<absolute(house.started)||house.members.filter(item=>item.joinedVia==='founder').length!==1||house.headId&&(!royalEligible(world,house,house.headId)||!heads.has(house.headId))||!house.successions.length)throw new Error('Invalid royal house');ids.add(house.id);
  for(const member of members.values()){
   const person=world.people[member.personId];if(!person||compare(member.joined,house.started)<0||compare(member.joined,world.date)>0||member.hereditary!==(member.joinedVia!=='marriage')||member.hereditary&&!line.includes(person.id)||member.status==='active'&&(person.died||member.ended||activeMemberships.has(person.id))||member.status!=='active'&&(!member.ended||compare(member.ended,member.joined)<0||compare(member.ended,world.date)>0||member.mode!=='private')||member.status==='deceased'&&!person.died||member.status==='left'&&member.hereditary||member.joinedVia==='marriage'&&!world.marriages.some(item=>item.a===person.id&&members.has(item.b)||item.b===person.id&&members.has(item.a)))throw new Error('Invalid royal membership');if(member.status==='active')activeMemberships.add(person.id);
  }
  let lastHead:string|null=null,lastDate=house.started;
  for(const [index,change] of house.successions.entries()){
   if(compare(change.date,lastDate)<0||compare(change.date,world.date)>0||change.fromId!==lastHead||change.toId&&!members.get(change.toId)?.hereditary||index===0&&(change.reason!=='foundation'||change.fromId!==null||change.toId!==house.founderId)||index>0&&change.reason==='foundation'||change.fromId===change.toId)throw new Error('Invalid recorded crown succession');lastHead=change.toId;lastDate=change.date;
  }
  if(lastHead!==house.headId)throw new Error('The current crown does not match its succession history');
  if(house.regentId){const regent=world.people[house.regentId],head=house.headId&&world.people[house.headId];if(!head||ageOn(head,world.date)>=18||!regent||regent.died||ageOn(regent,world.date)<18||members.get(regent.id)?.status!=='active'||regent.id===head.id)throw new Error('Invalid royal regency');}
  const occupied=new Map<string,number>(),archives=new Set<string>();
  const add=(personId:string,year:number,mask:number,amount:bigint)=>{const key=personId+':'+year,existing=occupied.get(key)??0;if(existing&mask)throw new Error('Duplicate royal duty period');occupied.set(key,existing|mask);const moneyKey=personId+':'+house.currency;income.set(moneyKey,(income.get(moneyKey)??0n)+amount);};
  for(const record of house.records){
   const person=world.people[record.personId],membership=members.get(record.personId),date={year:record.year,month:record.month,day:Math.min(world.calendarAnchorDay,daysInMonth(record.year,record.month))},annual=roundRatio(rules[house.country].baseWage*BigInt(royalRoleBps[record.role]),10000n);
   if(!person||!membership||absolute(date)<absolute(membership.joined)||absolute(date)>month||membership.ended&&absolute(date)>absolute(membership.ended)||record.headId&&!heads.has(record.headId)||record.role==='head'&&record.headId!==person.id||record.role==='child'&&ageOn({...person,died:null},date)>=18||record.role!=='child'&&ageOn({...person,died:null},date)<18||record.role==='regent'&&(!record.headId||ageOn({...world.people[record.headId],died:null},date)>=18)||record.annualPay!==annual||record.allowance!==(record.attended?monthlyAmount(annual,record.month-1):0n)||!record.attended&&(record.score||record.engagements)||record.attended&&(!record.headId||record.role==='child'||![2,3].includes(record.engagements)))throw new Error('Invalid actual royal duty record');add(person.id,record.year,1<<(record.month-1),record.allowance);
  }
  for(const record of house.archives){
   const key=record.personId+':'+record.year+':'+record.role,person=world.people[record.personId],membership=members.get(record.personId),annual=roundRatio(rules[house.country].baseWage*BigInt(royalRoleBps[record.role]),10000n),invalidMonth=!person||!membership||Array.from({length:12},(_,index)=>index).some(index=>{if(!(record.monthsMask&(1<<index)))return false;const date={year:record.year,month:index+1,day:Math.min(world.calendarAnchorDay,daysInMonth(record.year,index+1))},age=ageOn({...person,died:null},date);return absolute(date)<absolute(membership.joined)||absolute(date)>month||!!membership.ended&&absolute(date)>absolute(membership.ended)||(record.role==='child'?age>=18:age<18);}),expected=Array.from({length:12},(_,index)=>record.attendedMask&(1<<index)?monthlyAmount(record.annualPay,index):0n).reduce((sum,value)=>sum+value,0n);
   if(invalidMonth||archives.has(key)||!person||!membership||record.role==='head'&&!heads.has(record.personId)||record.year<membership.joined.year||record.year>world.date.year||membership.ended&&record.year>membership.ended.year||record.months!==countBits(record.monthsMask)||record.attended!==countBits(record.attendedMask)||record.attendedMask&~record.monthsMask||record.annualPay!==annual||record.allowance!==expected||record.scoreTotal>record.attended*100||record.engagements<record.attended*2||record.engagements>record.attended*3||record.role==='child'&&(record.attended||record.allowance))throw new Error('Invalid archived royal duty record');archives.add(key);add(person.id,record.year,record.monthsMask,record.allowance);
  }
 }
 const paid=new Map<string,bigint>();for(const entry of ledger.categories('royal-allowance')){if(entry.cashDelta<=0n||entry.debtDelta)throw new Error('Invalid royal allowance receipt');const key=entry.personId+':'+entry.currency;paid.set(key,(paid.get(key)??0n)+entry.cashDelta);}for(const key of new Set([...income.keys(),...paid.keys()]))if((income.get(key)??0n)!==(paid.get(key)??0n))throw new Error('Royal duty allowances do not match actual personal accounts');
}
