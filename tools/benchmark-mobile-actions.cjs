// Identical real-command branches from frozen inputs; no player state is patched.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict'), ts = require('typescript');
const flags = {}; for (let i=2;i<process.argv.length;i+=2) flags[process.argv[i]]=process.argv[i+1];
const source=path.resolve(flags['--source']), samples=Number(flags['--samples']??5);
assert(samples>=5&&samples<=50&&flags['--output']);
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const load=file=>require(path.join(source,'src/game',file+'.ts'));
const {resolveCommand}=load('engine'),{encodeWorld,moneyJSON}=load('model');
const {unpackCheckpoint}=require(path.join(source,'src/persistence/checkpoints.ts'));
const {assetCatalog}=load('content/assets'),{purchaseReason,purchaseQuote}=load('systems/assets');
const input=JSON.parse(fs.readFileSync(flags['--inputs'],'utf8')),results=[];
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const percentile=(a,p)=>[...a].sort((a,b)=>a-b)[Math.ceil(a.length*p)-1];
for(const snapshot of input.snapshots){
  const world=unpackCheckpoint(snapshot.payload,true),before=sha(encodeWorld(world)),person=world.people[world.activePersonId];
  const commands=[];
  for(const edge of world.relationships){
    const id=edge.from===person.id?edge.to:edge.to===person.id?edge.from:null;
    if(!id)continue;
    const command={type:'interact',personId:id,action:'talk'};
    try{resolveCommand(world,command,true);commands.push({name:'talk',command});break;}catch{}
  }
  if(person.employment)commands.push({name:'work-effort',command:{type:'work-effort',effort:person.employment.effort==='hard'?'balanced':'hard'}});
  const item=assetCatalog.find(row=>row.kind==='possession'&&!purchaseReason(world,row,'cash'));
  if(item)commands.push({name:'buy-possession',command:{type:'buy-asset',catalogId:item.id,financing:'cash',depositBps:10000,termMonths:120,quotedPrice:purchaseQuote(world,item,'cash').price}});
  for(const {name,command} of commands){
    const timings=[];let expected;
    for(let sample=0;sample<=samples;sample++){
      if(global.gc)global.gc();
      const began=performance.now(),next=resolveCommand(world,command,true),elapsedMs=performance.now()-began;
      const outcome={canonicalWorldSha256:sha(encodeWorld(next)),random:next.random,journalRows:next.journal.length,date:next.date};
      if(expected)assert.deepEqual(outcome,expected);else expected=outcome;
      if(sample)timings.push(elapsedMs);
      assert.equal(sha(encodeWorld(world)),before);
    }
    results.push({age:snapshot.summary.age,inputWorldSha256:before,name,command,expected,timingsMs:{median:percentile(timings,.5),p95:percentile(timings,.95),samples:timings}});
  }
  console.log(snapshot.summary.age,'actual actions',commands.map(x=>x.name).join(','));
}
fs.writeFileSync(flags['--output'],JSON.stringify({scope:'Cloud Node synchronous real command resolution, one excluded warm-up and fixed frozen worlds. Unavailable purchases/work are not forced; no injected funds or dates. Talking uses the first genuinely eligible existing contact. Complete canonical outcomes and RNG are independently retained.',samples,inputFileSha256:sha(fs.readFileSync(flags['--inputs'])),driverSha256:sha(fs.readFileSync(__filename)),results},moneyJSON,2)+'\n');
