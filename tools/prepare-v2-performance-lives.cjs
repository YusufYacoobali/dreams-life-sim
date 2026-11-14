// V2 age-specific diagnostic inputs. Actual commands; no funds, health, date or RNG patches after birth.
// Birth acknowledgement mirrors the production store transition; seed 42 is declared, not searched.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),sha=s=>createHash('sha256').update(s).digest('hex');
const source=path.resolve(process.argv[4]??root);
const load=file=>require(path.join(path.resolve(source),file));
const sourceFiles=[];function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(dir,entry.name);if(entry.isDirectory())scan(file);else if(file.endsWith('.ts'))sourceFiles.push(file);}}
scan(path.join(source,'src/game'));scan(path.join(source,'src/persistence'));
const sourceHash=sha(sourceFiles.map(file=>path.relative(source,file)+'\0'+fs.readFileSync(file,'utf8')).join('\0'));

require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {createLife,randomCreation}=load('src/game/createLife.ts'),model=load('src/game/model.ts'),{resolveCommand}=load('src/game/engine.ts');
const {choiceUnavailable}=load('src/game/choiceAvailability.ts'),{jobs}=load('src/game/content/jobs.ts'),{jobReason,salaryFor}=load('src/game/systems/work.ts');
const {availableCash,accountFor}=load('src/game/systems/common.ts'),{adoptionFee,childrenOf}=load('src/game/systems/family.ts'),{hospitalized}=load('src/game/systems/healthSchemas.ts');
const {assetCatalog}=load('src/game/content/assets.ts'),{purchaseReason}=load('src/game/systems/assets.ts'),{assetPrice}=load('src/game/systems/assetPricing.ts');
const {packCheckpoint}=load('src/persistence/checkpoints.ts');
const seed=Number(process.argv[2]??42),output=process.argv[3]??'/tmp/dreams-v2-perf-inputs.json',trace=[];
const date={year:2026,month:11,day:14},input={...randomCreation(seed),country:'US',city:'New York',firstName:'Alex',lastName:'Walker',gender:'female',background:'ordinary',wantsChildren:true};
let world=model.immutableWorld({...createLife('life_v2_performance_'+seed,seed,input,date),birthAcknowledged:true,revision:1});
const person=()=>world.people[world.activePersonId],age=()=>model.ageOn(person(),world.date),targets=new Set([18,23,30,50,70]),snapshots=[];
const act=command=>{world=resolveCommand(world,command,true);trace.push(command);};
function finish(){let guard=0;while((world.pending||world.annual)&&!person().died&&guard++<120){const e=world.pending;act(e?.kind==='decision'?{type:'choose',eventId:e.id,choiceId:e.choices.find(c=>!choiceUnavailable(world,c)).id}:e?{type:'acknowledge',resultId:e.id}:{type:'resume'});}assert(guard<120);}
function action(command){act(command);finish();}
while(age()<=70&&!person().died){finish();if(person().died)break;
  const years=age(),p=person();
  if(years>=6){const routine={...p.health.routine,exercise:'walking',sleep:'restful',mindfulness:true};if(JSON.stringify(routine)!==JSON.stringify(p.health.routine))action({type:'health-routine',routine});}
  if(years>=13)for(const platform of ['photogram','lifelink'])if(!world.socialAccounts.some(a=>a.ownerId===p.id&&a.platform===platform))action({type:'create-social',platform,handle:'alex_'+platform,bio:'Ordinary life, occasional photos.'});
  for(const account of world.socialAccounts.filter(a=>a.ownerId===p.id&&a.status==='active'&&a.cadence==='off'))action({type:'social-routine',accountId:account.id,cadence:'monthly',topic:'message',intent:'authentic'});
  if(years>=18&&years<65&&!person().employment&&person().education.stage==='none'&&!hospitalized(world,person())){const roles=jobs.filter(j=>!j.specialCareer&&!jobReason(world,j)).sort((a,b)=>salaryFor(world,a)>salaryFor(world,b)?-1:1);if(roles[0])action({type:'apply-job',roleId:roles[0].id});}
  if(years>=35&&years<=50&&!childrenOf(world).length&&person().stats.health>=40&&person().wantsChildren&&person().householdId&&person().employment&&!hospitalized(world,person())&&availableCash(accountFor(world))>=adoptionFee(world))action({type:'adopt',age:0});
  if(years>=25&&!world.assets.some(a=>a.ownerId===p.id)){const offer=assetCatalog.find(a=>a.kind==='possession'&&!purchaseReason(world,a,'cash'));if(offer)action({type:'buy-asset',catalogId:offer.id,financing:'cash',depositBps:10000,termMonths:120,quotedPrice:assetPrice(world,offer)});}
  if(targets.has(years)){const text=model.encodeWorld(world);snapshots.push({summary:{age:years,revision:world.revision,date:world.date,people:Object.keys(world.people).length,ledgerRows:world.ledger.length,journalRows:world.journal.length,children:childrenOf(world).length,assets:world.assets.filter(a=>a.ownerId===p.id).length,socialAccounts:world.socialAccounts.filter(a=>a.ownerId===p.id).length,sha256:sha(text)},payload:packCheckpoint(world)});targets.delete(years);fs.writeFileSync(output,JSON.stringify({scope:'Real command progression with explicit walking/restful/mindfulness, eligible work, two monthly social accounts, affordable adoption and a possession. Birth acknowledgement mirrors the production birth transition. No funds, dates, outcomes or RNG are patched.',seed,input,date,sourceHash,commands:trace.length,snapshots}));process.stderr.write('captured age '+years+' ('+world.journal.length+' journal rows)\n');}
  if(years===70)break;action({type:'advance'});
}
fs.writeFileSync(output+'.commands.json',JSON.stringify(trace,model.moneyJSON));
console.log({output,sourceHash,seed,age:age(),died:person().died,snapshots:snapshots.map(s=>s.summary)});
if(targets.size)process.exitCode=2;
