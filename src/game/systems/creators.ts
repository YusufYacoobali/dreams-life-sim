import { z } from 'zod';
import { World, ageOn } from '../model';
import { countries } from '../countries';
import { jobs } from '../content/jobs';
import { rules } from '../rules';
import { Currency, Money, roundRatio } from '../money';
import { IneligibleAction } from '../errors';
import { creatorKinds, creatorRoles, fullTimeCreator, studioForAccount } from './creatorSchemas';
import { creatorCatalog } from '../content/creators';
import { active, accountFor, availableCash, bounded, charge, fact, post, result, draw } from './common';
import { isConfined } from './legalSchemas';
import { hospitalized } from './healthSchemas';
import { campaignCommitment } from './politicsSchemas';
import { recordingCommitment } from './musicSchemas';
import { createContact } from './npcs';
import { connectPerson, relationFor } from './relationships';
import { fxMoney } from '../valuation';
import { offerPending } from '../pendingQueue';
type Studio=World['creatorStudios'][number];
type Crew=Studio['crew'][number];
type Account=World['socialAccounts'][number];
const absolute=(world:World)=>world.date.year*12+world.date.month-1;
export const creatorCommandSchema=z.discriminatedUnion('type',[
  z.object({type:z.literal('start-creator'),kind:z.enum(creatorKinds),accountId:z.string()}),
  z.object({type:z.literal('creator-focus'),studioId:z.string(),focus:z.enum(['part-time','full-time'])}),
  z.object({type:z.literal('creator-equipment'),studioId:z.string(),laptopId:z.string().nullable(),cameraId:z.string().nullable()}),
  z.object({type:z.literal('creator-production'),studioId:z.string(),useCrew:z.boolean()}),
  z.object({type:z.literal('hire-creator-crew'),studioId:z.string(),role:z.enum(creatorRoles),quotedFee:z.bigint().positive(),quotedAgency:z.bigint().nonnegative()}),
  z.object({type:z.literal('dismiss-creator-crew'),studioId:z.string(),crewId:z.string()}),z.object({type:z.literal('leave-creator'),studioId:z.string()}),
]);
export type CreatorCommand=z.infer<typeof creatorCommandSchema>;
const ownedGear=(world:World,studio:Studio,id:string|null,catalogId:'laptop'|'camera')=>id?world.assets.find(item=>item.id===id&&item.ownerId===studio.personId&&item.catalogId===catalogId&&item.condition>0):undefined;
export function creatorFocusReason(world:World,studio:Studio):string|undefined {
  const person=world.people[studio.personId],account=world.socialAccounts.find(item=>item.id===studio.accountId);
  if(ageOn(person,world.date)<18)return 'Full-time production is available from age eighteen';
  if(studio.status!=='active'||account?.status!=='active')return 'An active studio and profile are required';
  if(person.skills.content<40)return 'Content Production skill of 40% is required';
  if(isConfined(world,person)||person.legal.wanted||hospitalized(world,person)||person.stats.health<25)return 'Recover or resolve custody/pursuit before full-time production';
  if(person.employment&&!jobs.find(item=>item.id===person.employment!.roleId)?.partTime||person.education.stage!=='none'||campaignCommitment(world,person.id)||recordingCommitment(world,person.id)||world.careers.some(item=>item.personId===person.id&&item.status==='active')||world.creatorStudios.some(item=>item.personId===person.id&&item.status==='active'&&item.focus==='full-time'&&item.id!==studio.id))return 'Finish or leave another full-time commitment first';
  if((ownedGear(world,studio,studio.laptopId,'laptop')?.condition??0)<40)return 'Select an owned Creative Laptop with at least 40% condition';
}
export function creatorStartReason(world:World,kind:typeof creatorKinds[number]):string|undefined {
  const person=active(world);if(ageOn(person,world.date)<13)return 'Channels are available from age thirteen';if(isConfined(world)||person.legal.wanted)return 'Resolve custody or pursuit first';
  if(world.creatorStudios.some(item=>item.personId===person.id&&item.kind===kind&&item.status==='active'))return 'Your studio is already active';
  if(!world.socialAccounts.some(item=>item.ownerId===person.id&&item.platform===creatorCatalog[kind].platform&&item.status==='active'))return 'Create or reopen your '+creatorCatalog[kind].platform+' profile first';
}
export const creatorCrewQuote=(studio:Studio,role:typeof creatorRoles[number])=>({fee:roundRatio(rules[studio.country].baseWage,BigInt(role==='editor'?5000:8000))||1n,agency:roundRatio(rules[studio.country].baseWage,400n),currency:studio.currency});
function myStudio(world:World,id:string){const studio=world.creatorStudios.find(item=>item.id===id&&item.personId===world.activePersonId&&item.status==='active');if(!studio)throw new IneligibleAction('Choose your active studio');return studio;}
export function closeCreator(world:World,studio:Studio,status:'left'|'deceased'='left'){
  studio.status=status;studio.focus='part-time';studio.ended={...world.date};studio.warningReason=null;for(const member of studio.crew.filter(item=>!item.ended))member.ended={...world.date};const account=world.socialAccounts.find(item=>item.id===studio.accountId);if(account)account.cadence='off';
}
export function resolveCreator(world:World,command:CreatorCommand){const person=active(world);
  if(command.type==='start-creator'){
    const reason=creatorStartReason(world,command.kind);if(reason)throw new IneligibleAction(reason);const account=world.socialAccounts.find(item=>item.id===command.accountId&&item.ownerId===person.id&&item.platform===creatorCatalog[command.kind].platform&&item.status==='active');if(!account)throw new IneligibleAction('Choose your matching active channel');
    const previous=world.creatorStudios.find(item=>item.personId===person.id&&item.kind===command.kind);if(previous){previous.status='active';previous.ended=null;previous.focus='part-time';previous.useCrew=false;previous.lastWorkMonth=absolute(world);previous.warningReason=null;}
    else{const gear=(id:string)=>world.assets.filter(item=>item.ownerId===person.id&&item.catalogId===id&&item.condition>0).sort((a,b)=>b.condition-a.condition)[0]?.id??null;world.creatorStudios.push({id:'studio_'+person.id+'_'+command.kind,personId:person.id,accountId:account.id,kind:command.kind,country:person.country,city:person.city,currency:countries[person.country].currency,started:{...world.date},ended:null,status:'active',focus:'part-time',laptopId:gear('laptop'),cameraId:gear('camera'),useCrew:false,lastWorkMonth:absolute(world),lastNoticeMonth:null,warningReason:null,crew:[]});}
    fact(world,'I began working on my '+creatorCatalog[command.kind].title+' channel.','career');result(world,'Your studio is ready','Choose equipment, build your production skill and set a posting routine. Earnings follow actual delivered views and brand work.','video');return;
  }
  const studio=myStudio(world,command.studioId),account=world.socialAccounts.find(item=>item.id===studio.accountId)!;
  if(command.type==='creator-focus'){
    if(command.focus==='full-time'){const reason=creatorFocusReason(world,studio);if(reason)throw new IneligibleAction(reason);account.cadence='twice-weekly';}
    else if(account.cadence==='twice-weekly')account.cadence='weekly';studio.focus=command.focus;
  }else if(command.type==='creator-equipment'){
    if(command.laptopId&&!ownedGear(world,studio,command.laptopId,'laptop')||command.cameraId&&!ownedGear(world,studio,command.cameraId,'camera'))throw new IneligibleAction('Choose equipment you actually own');studio.laptopId=command.laptopId;studio.cameraId=command.cameraId;
  }else if(command.type==='creator-production'){
    if(command.useCrew&&!studio.crew.some(item=>!item.ended))throw new IneligibleAction('Hire a freelance crew member first');studio.useCrew=command.useCrew;
  }else if(command.type==='hire-creator-crew'){
    if(ageOn(person,world.date)<18)throw new IneligibleAction('Freelance contracts are available to adults');if(studio.crew.some(item=>item.role===command.role&&!item.ended))throw new IneligibleAction('You already have a current '+command.role);const terms=creatorCrewQuote(studio,command.role);if(command.quotedFee!==terms.fee||command.quotedAgency!==terms.agency)throw new IneligibleAction('Review the current freelance quote');const key=person.id+':creator-hire:'+studio.id+':'+world.date.year;if((world.actionCounts[key]??0)>=4)throw new IneligibleAction('Four agency placements are available per studio each year');
    charge(world,terms.agency,'creator-agency','Freelance crew introduction',undefined,terms.currency);const contractor=createContact(world,{age:draw(world,'npcs',28,35),country:studio.country,city:studio.city,qualifiedRole:command.role==='editor'?'designer':'administrator'});connectPerson(world,contractor.id);const relation=relationFor(world,person.id,contractor.id)!;if(!relation.roles.includes('coworker'))relation.roles.push('coworker');relation.kind='coworker';studio.crew.push({id:'crew_'+studio.id+'_'+world.revision+'_'+studio.crew.length,personId:contractor.id,role:command.role,hired:{...world.date},ended:null,currency:terms.currency,feePerPost:terms.fee,agencyFee:terms.agency});studio.useCrew=true;world.actionCounts[key]=(world.actionCounts[key]??0)+1;
  }else if(command.type==='dismiss-creator-crew'){
    const member=studio.crew.find(item=>item.id===command.crewId&&!item.ended);if(!member)throw new IneligibleAction('Choose a current freelance crew member');member.ended={...world.date};if(!studio.crew.some(item=>!item.ended))studio.useCrew=false;
  }else if(command.type==='leave-creator'){
    closeCreator(world,studio);fact(world,'I stopped my '+creatorCatalog[studio.kind].title+' studio.','career');result(world,'You left the studio','The posting routine and future freelance fees stop. Your profile remains, and active brand delivery requirements still apply until cancelled.','video');return;
  }
  result(world,'Studio updated','Your production plan is set. Routine work and any freelance service fees apply when new content is actually published.','video');
}
export function creatorProductionQuote(world:World,accountId:string){const studio=studioForAccount(world,accountId),crew=studio?.useCrew?studio.crew.filter(item=>!item.ended):[];return {studio,crew,fees:crew.map(member=>({member,minor:member.feePerPost,currency:member.currency}))};}
export function creatorProductionReason(world:World,account:Account,baseCost:Money):string|undefined {
  const {studio,fees}=creatorProductionQuote(world,account.id);if(!studio)return;
  if(studio.focus==='full-time'){const reason=creatorFocusReason(world,studio);if(reason)return reason;}
  const totals=new Map<Currency,bigint>();if(baseCost.minor)totals.set(baseCost.currency,baseCost.minor);
  for(const fee of fees){const member=world.people[fee.member.personId];if(member.died||isConfined(world,member)||member.legal.wanted||hospitalized(world,member))return 'Your '+fee.member.role+' is unavailable; review the crew or use self-production';totals.set(fee.currency,(totals.get(fee.currency)??0n)+fee.minor);}
  for(const [currency,amount] of totals){const funds=world.accounts.find(item=>item.ownerId===account.ownerId&&item.currency===currency);if(!funds||availableCash(funds)<amount)return 'Your '+currency+' balance cannot cover production and freelance services';}
}
function archiveInvoices(world:World){const cutoff=absolute(world)-24,old=world.creatorInvoices.filter(item=>item.month!==null&&item.year*12+item.month-1<cutoff);world.creatorInvoices=world.creatorInvoices.filter(item=>item.month===null||item.year*12+item.month-1>=cutoff);for(const invoice of old){let archive=world.creatorInvoices.find(item=>item.studioId===invoice.studioId&&item.crewId===invoice.crewId&&item.year===invoice.year&&item.month===null);if(!archive){archive={...invoice,month:null,posts:0,paid:0n};world.creatorInvoices.push(archive);}archive.posts+=invoice.posts;archive.paid+=invoice.paid;archive.firstPost=Math.min(archive.firstPost,invoice.firstPost);archive.lastPost=Math.max(archive.lastPost,invoice.lastPost);}}
export function creatorBeforePublish(world:World,account:Account,postIndex:number){const {studio,crew}=creatorProductionQuote(world,account.id);if(!studio)return {studio:undefined,bonus:0,moderated:false};let bonus=Math.floor(world.people[studio.personId].skills.content/10)+Math.floor((ownedGear(world,studio,studio.laptopId,'laptop')?.condition??0)/10)+Math.floor((ownedGear(world,studio,studio.cameraId,'camera')?.condition??0)/10);
  for(const member of crew){const payee=world.people[member.personId];charge(world,member.feePerPost,'creator-contract-fee','Freelance '+member.role+' review',undefined,member.currency,world.people[studio.personId]);post(world,member.feePerPost,0n,'creator-contract-income','Freelance '+member.role+' review',null,payee,member.currency);payee.finance.cycleGross+=fxMoney(world,{minor:member.feePerPost,currency:member.currency},countries[payee.country].currency).minor;let invoice=world.creatorInvoices.find(item=>item.studioId===studio.id&&item.crewId===member.id&&item.year===world.date.year&&item.month===world.date.month);if(!invoice){invoice={studioId:studio.id,crewId:member.id,year:world.date.year,month:world.date.month,currency:member.currency,posts:0,firstPost:postIndex,lastPost:postIndex,paid:0n};world.creatorInvoices.push(invoice);}if(invoice.posts&&invoice.lastPost>=postIndex)throw new Error('This freelance review was already billed');invoice.posts++;invoice.lastPost=postIndex;invoice.paid+=member.feePerPost;if(member.role==='editor')bonus+=10;}
  studio.warningReason=null;archiveInvoices(world);return {studio,bonus,moderated:crew.some(item=>item.role==='moderator')};
}
export function creatorWorkEnergy(world:World,studio:Studio|undefined,automatic:boolean,liveMinutes:number){const person=studio&&world.people[studio.personId];if(studio&&person&&studio.focus==='full-time'&&automatic){if(studio.lastWorkMonth!==absolute(world)){studio.lastWorkMonth=absolute(world);person.stats.stress=bounded(person.stats.stress+2);return 3;}return 0;}return (automatic?1:3)+Math.ceil(liveMinutes/30);}
export function creatorRoutineWarning(world:World,account:Account,reason:string){const studio=studioForAccount(world,account.id);if(!studio||studio.personId!==world.activePersonId||studio.lastNoticeMonth===absolute(world))return;studio.warningReason=reason;studio.lastNoticeMonth=absolute(world);offerPending(world,{kind:'result',id:'studio_warning_'+studio.id+'_'+absolute(world),title:'Your studio needs attention',body:reason+'. Review the setup, crew or funding before continuing. The completed posts and payments remain recorded.',illustration:studio.kind==='streamer'?'streamer':'video',effects:[]},54);if(world.annual?.stage==='months')world.annual.pausedForPlanning=true;}
export function creatorDeath(world:World,personId:string){for(const studio of world.creatorStudios){if(studio.personId===personId&&studio.status==='active')closeCreator(world,studio,'deceased');for(const member of studio.crew.filter(item=>item.personId===personId&&!item.ended))member.ended={...world.date};if(!studio.crew.some(item=>!item.ended))studio.useCrew=false;}}
export function creatorProfileClosed(world:World,accountId:string){const studio=studioForAccount(world,accountId);if(studio)closeCreator(world,studio);}
