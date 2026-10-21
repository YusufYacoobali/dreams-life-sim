import { indexLedger } from '../ledgerIndex';
import { ageOn } from '../personHelpers';
import type { World } from '../model';
import { countries } from '../countries';
import { creatorCatalog } from '../content/creators';
import { creatorCrewQuote } from './creators';
const compare=(a:World['date'],b:World['date'])=>a.year-b.year||a.month-b.month||a.day-b.day;
const absolute=(date:World['date'])=>date.year*12+date.month-1;
export function validateCreators(world:World, ledger = indexLedger(world.ledger)){
  const month=absolute(world.date),studios=new Map(world.creatorStudios.map(item=>[item.id,item])),crew=new Map<string,{member:World['creatorStudios'][number]['crew'][number];studio:World['creatorStudios'][number]}>(),keys=new Set<string>(),fullTime=new Set<string>();
  const agency=new Map<string,bigint>(),fees=new Map<string,bigint>(),income=new Map<string,bigint>(),totalPosts=new Map<string,number>();
  const add=(map:Map<string,bigint>,key:string,value:bigint)=>map.set(key,(map.get(key)??0n)+value);
  if(studios.size!==world.creatorStudios.length)throw new Error('Duplicate creator studio');
  for(const studio of studios.values()){
    const person=world.people[studio.personId],account=world.socialAccounts.find(item=>item.id===studio.accountId),key=studio.personId+':'+studio.kind,active=studio.status==='active';
    if(!person||!account||keys.has(key)||account.ownerId!==person.id||account.platform!==creatorCatalog[studio.kind].platform||studio.currency!==countries[studio.country].currency||compare(studio.started,account.created)<0||compare(studio.started,world.date)>0||ageOn({...person,died:null},studio.started)<13||studio.lastWorkMonth>month||studio.lastNoticeMonth!==null&&studio.lastNoticeMonth>month||active&&(person.died||studio.ended||['deleted','memorial'].includes(account.status))||!active&&(!studio.ended||compare(studio.ended,studio.started)<0||compare(studio.ended,world.date)>0||studio.focus==='full-time'||studio.crew.some(item=>!item.ended))||studio.status==='deceased'&&!person.died)throw new Error('Invalid creator studio');
    keys.add(key);
    if(studio.focus==='full-time'){
      if(fullTime.has(person.id)||ageOn(person,world.date)<18)throw new Error('Invalid full-time studio commitment');
      fullTime.add(person.id);
    }
    for(const [id,catalogId] of [[studio.laptopId,'laptop'],[studio.cameraId,'camera']] as const)if(id&&!world.assets.some(item=>item.id===id&&item.catalogId===catalogId))throw new Error('Invalid selected studio equipment');
    const roles=new Set<string>();
    for(const member of studio.crew){
      const contractor=world.people[member.personId],terms=creatorCrewQuote(studio,member.role);
      if(crew.has(member.id)||!contractor||contractor.id===person.id||!contractor.education.qualifications.some(item=>member.role==='editor'?item.level==='degree'&&item.field==='arts':item.level==='secondary')||member.currency!==studio.currency||member.feePerPost!==terms.fee||member.agencyFee!==terms.agency||compare(member.hired,studio.started)<0||compare(member.hired,world.date)>0||ageOn({...person,died:null},member.hired)<18||ageOn({...contractor,died:null},member.hired)<18||!member.ended&&(contractor.died||roles.has(member.role))||member.ended&&(compare(member.ended,member.hired)<0||compare(member.ended,world.date)>0))throw new Error('Invalid freelance crew');
      if(!member.ended)roles.add(member.role);
      crew.set(member.id,{member,studio});add(agency,person.id+':'+studio.currency,member.agencyFee);
    }
    if(studio.useCrew&&active&&!roles.size)throw new Error('Crew production requires a current crew');
    totalPosts.set(studio.id,account.posts.filter(item=>item.studioId===studio.id).length+account.archived.reduce((sum,item)=>sum+(item.studioPosts[studio.id]??0),0));
  }
  const invoices=new Set<string>(),ranges=new Map<string,{first:number;last:number}[]>(),billed=new Map<string,number>();
  for(const invoice of world.creatorInvoices){
    const entry=crew.get(invoice.crewId),studio=studios.get(invoice.studioId),account=studio&&world.socialAccounts.find(item=>item.id===studio.accountId),key=invoice.crewId+':'+invoice.year+':'+invoice.month;
    if(!entry||!studio||entry.studio.id!==studio.id||!account||invoices.has(key)||invoice.currency!==entry.member.currency||invoice.paid!==entry.member.feePerPost*BigInt(invoice.posts)||invoice.firstPost>invoice.lastPost||invoice.lastPost>=account.totalPosts||invoice.posts>invoice.lastPost-invoice.firstPost+1||invoice.year<entry.member.hired.year||invoice.year>world.date.year||entry.member.ended&&invoice.year>entry.member.ended.year||invoice.month!==null&&(invoice.year*12+invoice.month-1>month||invoice.year*12+invoice.month-1<absolute(entry.member.hired)||entry.member.ended&&invoice.year*12+invoice.month-1>absolute(entry.member.ended)))throw new Error('Invalid freelance invoice');
    const intervals=ranges.get(invoice.crewId)??[];if(intervals.some(range=>invoice.firstPost<=range.last&&invoice.lastPost>=range.first))throw new Error('Overlapping freelance invoices');intervals.push({first:invoice.firstPost,last:invoice.lastPost});ranges.set(invoice.crewId,intervals);invoices.add(key);
    billed.set(invoice.crewId,(billed.get(invoice.crewId)??0)+invoice.posts);if(billed.get(invoice.crewId)!>(totalPosts.get(studio.id)??0))throw new Error('Freelance invoices exceed published studio work');
    add(fees,studio.personId+':'+studio.currency,invoice.paid);add(income,entry.member.personId+':'+invoice.currency,invoice.paid);
  }
  for(const account of world.socialAccounts){
    const studio=world.creatorStudios.find(item=>item.accountId===account.id&&item.status==='active');if(account.cadence==='twice-weekly'&&studio?.focus!=='full-time')throw new Error('Eight monthly posts require a full-time studio');
    for(const post of account.posts){
      const source=post.studioId&&studios.get(post.studioId);if(post.studioId&&(!source||source.accountId!==account.id||compare(post.date,source.started)<0)||post.liveMinutes&&(!source||source.kind!=='streamer'||account.platform!=='streamline'))throw new Error('Invalid studio content');
    }
    for(const archive of account.archived){
      const sourceCounts=Object.entries(archive.studioPosts);if(archive.livePosts>archive.posts||archive.liveMinutes<archive.livePosts*30||archive.liveMinutes>archive.livePosts*120||archive.liveMinutes%30||archive.livePosts&&account.platform!=='streamline'||archive.livePosts>sourceCounts.reduce((sum,[id,count])=>sum+(studios.get(id)?.kind==='streamer'?count:0),0)||sourceCounts.reduce((sum,[,count])=>sum+count,0)>archive.posts||sourceCounts.some(([id])=>studios.get(id)?.accountId!==account.id))throw new Error('Invalid archived studio content');
    }
  }
  const actualAgency=new Map<string,bigint>(),actualFees=new Map<string,bigint>(),actualIncome=new Map<string,bigint>();
  for(const entry of ledger.categories('creator-agency', 'creator-contract-fee', 'creator-contract-income')){
    const key=entry.personId+':'+entry.currency;
    if(entry.category==='creator-agency'||entry.category==='creator-contract-fee'){if(entry.cashDelta>=0n||entry.debtDelta)throw new Error('Invalid freelance payment');add(entry.category==='creator-agency'?actualAgency:actualFees,key,-entry.cashDelta);}
    if(entry.category==='creator-contract-income'){if(entry.cashDelta<=0n||entry.debtDelta)throw new Error('Invalid freelance receipt');add(actualIncome,key,entry.cashDelta);}
  }
  for(const [expected,actual] of [[agency,actualAgency],[fees,actualFees],[income,actualIncome]])for(const key of new Set([...expected.keys(),...actual.keys()]))if((expected.get(key)??0n)!==(actual.get(key)??0n))throw new Error('Freelance payments do not match actual personal accounts');
}
