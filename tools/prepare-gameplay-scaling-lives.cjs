// Independent lifetime policies. Only normal creation/birth acknowledgement,
// supported commands and ordinary ageing. No outcome/money/date/RNG patches.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite'),{runtime,sha}=require('./scaling-runtime.cjs');
const flags={};for(let i=2;i<process.argv.length;i+=2)flags[process.argv[i]]=process.argv[i+1];
const api=runtime(flags['--source']??path.join(__dirname,'..'),undefined,{instrument:false}),{load,model,codec,engine}=api,sourceHash=api.digest();
const {randomCreation}=load('src/game/createLife.ts'),{createGameStore}=load('src/state/gameStore.ts'),{SaveRepository}=load('src/persistence/repository.ts');
const {choiceUnavailable}=load('src/game/choiceAvailability.ts'),{jobs}=load('src/game/content/jobs.ts'),work=load('src/game/systems/work.ts');
const common=load('src/game/systems/common.ts'),careers=load('src/game/systems/careers.ts'),actor=load('src/game/systems/actor.ts'),modelCareer=load('src/game/systems/modelCareer.ts');
const family=load('src/game/systems/family.ts'),relationships=load('src/game/systems/relationships.ts'),social=load('src/game/systems/social.ts'),leisure=load('src/game/systems/leisure.ts'),pets=load('src/game/systems/pets.ts');
const assets=load('src/game/systems/assets.ts'),{assetPrice}=load('src/game/systems/assetPricing.ts'),{assetCatalog}=load('src/game/content/assets.ts'),market=load('src/game/systems/markets.ts');
const business=load('src/game/systems/businesses.ts'),vehicles=load('src/game/systems/vehicleActivities.ts'),licences=load('src/game/systems/vehicleLicences.ts');
const output=flags['--output'];assert(output);
const profiles=(flags['--profiles']??'career,actor,model,family,wealth,mixed').split(','),snapshots=[],continues=[],lives=[];
const scope='Independent ordinary seed-42 births with declared career/actor/model/family/wealth/mixed policies. Career/family/mixed use annual preventive healthcare; actor/model/wealth retain the first exploratory policy without these extra medical actions. Up to 40 direct relationships before further introductions stop. Actual birth store transition, eligible supported commands and natural years only. Rejected actions retained. No loan/repayment padding, money/date/health/outcome/RNG edits or cooldown bypass. Heavy means the recorded lifetime policy, not an invented action count.';
function save(){fs.writeFileSync(output,JSON.stringify({scope,sourceHash,snapshots}));fs.writeFileSync(output+'.continue.json',JSON.stringify({scope,sourceHash,snapshots:continues}));fs.writeFileSync(output+'.commands.json',JSON.stringify({scope,sourceHash,lives},model.moneyJSON));}
async function birth(profile){
 const sqlite=new DatabaseSync(':memory:'),session={run:async(sql,v=[])=>{sqlite.prepare(sql).run(...v);},get:async(sql,v=[])=>sqlite.prepare(sql).get(...v)??null,all:async(sql,v=[])=>sqlite.prepare(sql).all(...v)};
 const repo=new SaveRepository({...session,exec:async sql=>sqlite.exec(sql),transaction:async action=>{sqlite.exec('BEGIN IMMEDIATE');try{const result=await action(session);sqlite.exec('COMMIT');return result;}catch(error){sqlite.exec('ROLLBACK');throw error;}}},()=> '2026-11-14T12:00:00Z');
 await repo.initialise();const creation={...randomCreation(42),country:'US',city:'New York',firstName:'Alex',lastName:'Walker',gender:'female',background:'ordinary',wantsChildren:true};
 const store=createGameStore({repository:async()=>repo,date:()=>({year:2026,month:11,day:14}),id:()=> 'life_gameplay_'+profile,onFeedback:()=>{}});
 assert(await store.getState().startLife(creation,42));assert(await store.getState().acknowledgeBirth());const world=store.getState().world;sqlite.close();return {world,creation};
}
async function main(){for(const profile of profiles){
 const initial=await birth(profile);let world=initial.world,activities=0,decisions=0,interruptions=0;
 const commands=[],rejected={},targets=new Set([23,30,50,70]),continued=new Set(),visited=new Set();let previousRole;
 const life={profile,seed:42,creation:initial.creation,date:world.date,initialPayload:codec.packCheckpointV4(world),commands,rejected};lives.push(life);
 const person=()=>world.people[world.activePersonId],age=()=>model.ageOn(person(),world.date),cash=()=>common.availableCash(common.accountFor(world));
 function act(command){world=engine.resolveCommand(world,command,true);commands.push(command);if(!['advance','resume','choose','acknowledge'].includes(command.type))activities++;if(command.type==='choose')decisions++;}
 function settle(){let guard=0;while((world.pending||world.annual)&&!person().died&&guard++<300){const event=world.pending;
   if(!event&&world.annual?.pausedForPlanning){interruptions++;if([23,30,50,70].includes(age())&&!continued.has(age())){capture(continues,'continue');continued.add(age());}}
   const preferred=event?.kind==='decision'&&event.choices.filter(choice=>!choiceUnavailable(world,choice));
   const choice=preferred&&(preferred.find(choice=>['stay','treat','care','rest','attend','accept','continue','save','cooperate'].includes(choice.id))??preferred[0]);
   act(event?.kind==='decision'?{type:'choose',eventId:event.id,choiceId:choice.id}:event?{type:'acknowledge',resultId:event.id}:{type:'resume'});
 }assert(guard<300);}
 function attempt(command){if(person().died||world.pending||world.annual)return false;try{act(command);}catch(error){if(!(error instanceof load('src/game/errors.ts').IneligibleAction))throw error;const key=command.type+': '+error.message;rejected[key]=(rejected[key]??0)+1;return false;}settle();return true;}
 function capture(destination,level){const text=model.encodeWorld(world);destination.push({summary:{profile,level,age:age(),activityActions:activities,commands:commands.length,decisions,interruptions,revision:world.revision,date:world.date,people:Object.keys(world.people).length,relationships:world.relationships.length,journalRows:world.journal.length,ledgerRows:world.ledger.length,workHistory:world.workHistory.length,careers:world.careers.map(c=>({kind:c.kind,projects:c.projects.length,status:c.status})),socialAccounts:world.socialAccounts.length,children:family.childrenOf(world).length,businesses:world.businesses.length,assets:world.assets.length,pets:world.pets.length,hobbies:world.hobbies.length,commandCounts:commands.reduce((counts,c)=>(counts[c.type]=(counts[c.type]??0)+1,counts),{}),sha256:sha(text),canonicalBytes:Buffer.byteLength(text)},payload:codec.packCheckpointV4(world)});save();process.stderr.write(profile+'/'+age()+'/'+level+' '+activities+' activities, '+world.journal.length+' journal, '+world.ledger.length+' ledger\n');}
 function normalJob(){if(age()<18||age()>=65||person().employment||person().education.stage!=='none')return;const offers=jobs.filter(j=>!j.specialCareer&&j.id!==previousRole&&!work.jobReason(world,j)).sort((a,b)=>work.salaryFor(world,a)>work.salaryFor(world,b)?-1:1);if(offers[0])attempt({type:'apply-job',roleId:offers[0].id});}
 function socialYear(){
   if(age()>=8&&world.relationships.filter(r=>r.from===person().id||r.to===person().id).length<40)attempt({type:'meet-people',purpose:'friend',gender:'any'});
   const contacts=world.relationships.filter(r=>r.from===person().id||r.to===person().id).map(r=>r.from===person().id?r.to:r.from).filter(id=>!world.people[id].died).slice(0,profile==='family'?12:6);
   for(const id of contacts){attempt({type:'interact',personId:id,action:'talk'});if(age()>=12)attempt({type:'interact',personId:id,action:'compliment'});}
   if(age()>=13){for(const platform of ['photogram','lifelink'])if(!world.socialAccounts.some(a=>a.ownerId===person().id&&a.platform===platform))attempt({type:'create-social',platform,handle:'alex_'+platform,bio:'Everyday life.'});
    for(const account of world.socialAccounts.filter(a=>a.ownerId===person().id&&a.status==='active')){if(account.cadence==='off')attempt({type:'social-routine',accountId:account.id,cadence:'weekly',topic:'message',intent:'authentic'});if(!social.postReason(world,account,'message','authentic'))attempt({type:'publish-post',accountId:account.id,kind:'message',intent:'authentic',sponsored:false});if(!social.monetisationReason(world,account))attempt({type:'monetise-social',accountId:account.id});}}
   if(age()>=18){let relation=relationships.partnerRelation(world);if(!relation){attempt({type:'meet-people',purpose:'dating',gender:'any'});const candidate=world.relationships.filter(r=>r.from===person().id||r.to===person().id).map(r=>relationships.otherPerson(world,r)).find(p=>!relationships.romanceReason(world,p));if(candidate)attempt({type:'ask-date',personId:candidate.id});}
    relation=relationships.partnerRelation(world);if(relation){const partner=relationships.otherPerson(world,relation);attempt({type:'interact',personId:partner.id,action:'spend-time'});if(relation.romance==='dating'&&relation.strength>=70)attempt({type:'propose',personId:partner.id});relation=relationships.partnerRelation(world);if(relation?.romance==='engaged')attempt({type:'marry',personId:partner.id,budget:0n});if(age()<42&&family.childrenOf(world).length<3&&!family.tryForBabyReason(world,partner.id))attempt({type:'try-child',personId:partner.id});}}
   if(age()>=30&&age()<=45&&family.childrenOf(world).length<2&&cash()>family.adoptionFee(world)*3n)attempt({type:'adopt',age:0});
 }
 function leisureYear(){for(const kind of ['reading','cooking'])if(age()>=6&&!world.hobbies.some(p=>p.personId===person().id&&p.kind===kind&&p.plans.some(plan=>plan.status==='active'))&&!leisure.hobbyReason(world,kind,'community'))attempt({type:'hobby-plan',kind,mode:'community',reviewedPayerId:person().id,quotedMonthlyFee:leisure.hobbyFee(person().country,kind,'community')});
  for(const kind of ['park','museum','cinema'])if(!leisure.outingReason(world,kind))attempt({type:'leisure-outing',kind,reviewedPayerId:person().id,quotedTotal:leisure.outingFee(world,kind)});
  if(age()>=18&&world.pets.filter(p=>p.ownerId===person().id&&p.status==='active').length<1&&!pets.petAdoptionReason(world,'milo'))attempt({type:'adopt-pet',offerId:'milo',name:'Milo',reviewedOwnerId:person().id,quotedFee:pets.petAdoptionFee(world,'milo')});
  for(const pet of world.pets.filter(p=>p.ownerId===person().id&&p.status==='active'))for(const activity of ['play','feed','walk'])if(!pets.petCareReason(world,pet,activity))attempt({type:'pet-care',petId:pet.id,activity});}
 function wealthYear(){if(age()<18)return;
  if(cash()>20000n){const quote=market.investmentQuote(world,'GROVE',1n);if(quote.buyCost<cash()/10n)attempt({type:'buy-investment',instrumentId:'GROVE',quantity:1n,quotedMinor:quote.buyCost});}
  if(age()%4===0){const holding=world.holdings.find(h=>h.ownerId===person().id&&h.quantity>0n);if(holding){const quote=market.investmentQuote(world,holding.instrumentId,1n);if(quote.sellProceeds>0n)attempt({type:'sell-investment',holdingId:holding.id,quantity:1n,quotedMinor:quote.sellProceeds});}}
  for(const kind of ['vehicle','property'])if(!world.assets.some(a=>a.ownerId===person().id&&a.kind===kind)){const offer=assetCatalog.find(a=>a.kind===kind&&!assets.purchaseReason(world,a,'cash')&&assetPrice(world,a)<cash()/2n);if(offer)attempt({type:'buy-asset',catalogId:offer.id,financing:'cash',depositBps:10000,termMonths:360,quotedPrice:assetPrice(world,offer)});}
  for(const asset of world.assets.filter(a=>a.ownerId===person().id)){if(asset.kind==='property'&&!asset.rented)attempt({type:'rent-property',assetId:asset.id});if(asset.kind==='vehicle'){if(!asset.vehicleLife)attempt({type:'enable-vehicle-activities',assetId:asset.id});if(!licences.hasLicence(world,'road')&&!licences.licenceReason(world,'road'))attempt({type:'take-licence-test',kind:'road',answers:[1,2,0],quotedFee:licences.licenceFee(world,'road')});const current=world.assets.find(a=>a.id===asset.id);for(const activity of ['service','drive'])if(!vehicles.vehicleActivityReason(world,current,activity,null))attempt({type:'vehicle-activity',assetId:asset.id,activity,contactId:null,quotedCost:vehicles.vehicleActivityCost(world,current,activity)});}}
  if(!world.businesses.some(b=>b.ownerId===person().id&&b.status==='active')&&!business.businessStartReason(world,'cafe','manager')&&cash()>business.businessStartupQuote(world,'cafe').total*4n)attempt({type:'start-business',kind:'cafe',name:'Everyday Cafe',operation:'manager',quotedCapital:business.businessStartupQuote(world,'cafe').capital});
  for(const company of world.businesses.filter(b=>b.ownerId===person().id&&b.status==='active')){if(company.marketing==='none')attempt({type:'business-marketing',businessId:company.id,marketing:'local'});attempt({type:'business-prices',businessId:company.id,priceBps:age()%2?10000:10500});if(company.cash>business.businessReserve(world,company)*3n&&age()%5===0)attempt({type:'improve-business',businessId:company.id,quotedCost:business.improvementQuote(company)});}
 }
 while(age()<=70&&!person().died){settle();if(person().died)break;const years=age();if(visited.has(years))throw new Error('Natural year failed to advance');visited.add(years);
  if(years>=6){const routine={...person().health.routine,exercise:'walking',sleep:'restful',mindfulness:true};if(JSON.stringify(routine)!==JSON.stringify(person().health.routine))attempt({type:'health-routine',routine});if(person().education.stage!=='none')attempt({type:'study'});}
  if(years>=18&&(flags['--preventive']?flags['--preventive']==='yes':['career','family','mixed'].includes(profile))){attempt({type:'consult',service:'checkup'});attempt({type:'vaccinate',vaccine:'seasonal'});attempt({type:'meditate'});}
  else if(years>=18&&years%5===0)attempt({type:'consult',service:'checkup'});
  for(const condition of person().health.conditions.filter(c=>c.diagnosed&&c.status==='active'&&!c.treatment))attempt({type:'treat',conditionId:condition.id});
  const creative=profile==='actor'||profile==='model',skill=profile==='model'?'modeling':'acting';
  if((creative||profile==='mixed')&&years>=6&&!careers.trainingReason(world,skill)&&person().training?.skill!==skill)attempt({type:'career-training',skill,mode:'self'});
  if(creative&&years>=18&&years<65){const system=profile==='actor'?actor:modelCareer,career=world.careers.find(c=>c.personId===person().id&&c.kind===profile);if(!career){if(person().employment)attempt({type:'quit-job'});if(!(profile==='actor'?actor.actorEntryReason(world):modelCareer.modelEntryReason(world)))attempt({type:profile+'-enter'});}
   const current=world.careers.find(c=>c.personId===person().id&&c.kind===profile),industry=profile==='actor'?current?.actor?.industry:current?.modelCareer?.industry;
   if(industry){attempt({type:profile+'-refresh-offers'});const updated=world.careers.find(c=>c.id===current.id),board=profile==='actor'?updated.actor.industry.board:updated.modelCareer.industry.board;
    for(const offer of board.filter(o=>!(profile==='actor'?actor.actorOfferReason(world,o):modelCareer.modelOfferReason(world,o))).slice(0,2))attempt(profile==='actor'?{type:'actor-audition',offerId:offer.id,quotedAnnualPay:offer.annualPay,negotiate:false}:{type:'model-casting',offerId:offer.id,quotedAnnualPay:offer.annualPay});
    if(profile==='actor'){for(const action of ['prepare','cooperate'])if(!actor.actorProductionReason(world,action))attempt({type:'actor-production',action});}
    else if(!modelCareer.modelPortfolioReason(world,'commercial','self'))attempt({type:'model-portfolio',specialisation:'commercial',style:'self',quotedCost:modelCareer.modelPortfolioQuote(world,'self')});
   }
  }else{if(profile==='career'&&years>=23&&years<60&&years%7===2&&person().employment){previousRole=person().employment.roleId;attempt({type:'quit-job'});}normalJob();if(profile==='career'&&person().employment&&person().employment.effort!=='hard')attempt({type:'work-effort',effort:'hard'});}
  if(['family','mixed'].includes(profile))socialYear();
  if(['wealth','mixed'].includes(profile))wealthYear();
  if(['mixed','family','actor','model'].includes(profile))leisureYear();
  if(profile==='mixed'&&[20,31,46].includes(years))attempt({type:'crime',offence:'shoplift'});
  if(targets.has(years)){capture(snapshots,'heavy');targets.delete(years);}
  if(years===70)break;act({type:'advance'});settle();
 }
 life.final={age:age(),died:person().died,activities,decisions,interruptions,commands:commands.length,missingAges:[...targets],sha256:sha(model.encodeWorld(world))};save();process.stderr.write(JSON.stringify({profile,...life.final})+'\n');
 }
 assert.equal(api.digest(),sourceHash,'Source drift');
}
main().catch(error=>{save();console.error(error);process.exitCode=1;});
