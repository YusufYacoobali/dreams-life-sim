// Measure actual paid development for every hobby without editing player worlds.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
global.expect=require('expect').expect;
const {decodeWorld,moneyJSON}=require(root+'/src/game/model.ts'),{lifestyleJourney}=require(root+'/tests/support/lifestyleJourney.ts'),{hobbyKinds}=require(root+'/src/game/content/leisure.ts'),{hobbyFee,hobbyReason}=require(root+'/src/game/systems/leisure.ts');
const {countries}=require(root+'/src/game/countries.ts');
const template=fs.readFileSync(root+'/tests/fixtures/v3-employed-graduate.json','utf8');
const rows=[];
(async()=>{
 for(const mode of ['community','lessons']) for(let i=0;i<hobbyKinds.length;i+=2){
  const run=await lifestyleJourney(decodeWorld(template));
  try{
   await run.act({type:'enable-lifestyle'});
   const start={...run.world.date},pair=hobbyKinds.slice(i,i+2),quotes=[];
   for(const kind of pair){
    const reason=hobbyReason(run.world,kind,mode);if(reason)throw Error(kind+': '+reason);
    const fee=hobbyFee(run.world.people[run.world.activePersonId].country,kind,mode);quotes.push({kind,fee});
    await run.act({type:'hobby-plan',kind,mode,reviewedPayerId:run.world.activePersonId,quotedMonthlyFee:fee});
   }
   for(let year=0;year<10&&!run.world.people[run.world.activePersonId].died&&!pair.every(kind=>run.world.hobbies.find(h=>h.kind===kind).proficiency>=90);year++)await run.year();
   for(const kind of pair){
    const hobby=run.world.hobbies.find(h=>h.kind===kind),practices=hobby.practices.filter(p=>p.source==='monthly');
    rows.push({kind,mode,currency:countries[run.world.people[run.world.activePersonId].country].currency,monthlyFee:quotes.find(q=>q.kind===kind).fee,start,end:run.world.date,proficiency:hobby.proficiency,attendedMonths:practices.filter(p=>p.attended).length,missedMonths:practices.filter(p=>!p.attended).length,missedReasons:practices.filter(p=>!p.attended).reduce((counts,p)=>{counts[p.reason]=(counts[p.reason]??0)+1;return counts;},{}),paid:practices.reduce((n,p)=>n+p.paid,0n),thresholds:[15,40,70,90].map(threshold=>{const index=practices.findIndex(p=>p.after>=threshold);return{threshold,date:index<0?null:practices[index].date,elapsedMonths:index<0?null:practices[index].date.year*12+practices[index].date.month-start.year*12-start.month,attendedMonths:index<0?null:practices.slice(0,index+1).filter(p=>p.attended).length,paid:index<0?null:practices.slice(0,index+1).reduce((n,p)=>n+p.paid,0n)};})});
   }
   console.log(mode,pair.join(','),'completed');
  } finally{run.close();}
 }
 fs.writeFileSync(process.argv[2]??'/tmp/lifestyle-polish-hobby-development.json',JSON.stringify({scope:'Sixteen hobbies in both paid modes, sixteen separate actual employed-graduate policy cohorts with two routines each. No funds, dates, health or random streams patched. Each command committed to real SQLite, followed by a closed-connection reopen. Thresholds are observed monthly practice records; not human playtesting.',sourceCommit:'7fe1a2e151876cdc8ce7b08473b1bd867cd5420e',rows},moneyJSON,2)+'\n');
 console.log('All',rows.length,'development observations saved');
})().catch(error=>{console.error(error);process.exitCode=1;});
