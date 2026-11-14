// Forward diagnostic over the preserved original driver. No device/React-paint claim.
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const originalFile = path.join(__dirname, 'benchmark-final-performance.cjs');
let driver = fs.readFileSync(originalFile, 'utf8');
function replaceOnce(before, after) {
  if (driver.split(before).length !== 2) throw Error('Review benchmark instrumentation: ' + before.slice(0, 80));
  driver = driver.replace(before, after);
}
replaceOnce("scan(path.join(source,'src/persistence'));", `scan(path.join(source,'src/persistence'));
for (const folder of ['src/state','src/reviews','src/performance','src/feedback','src/access','src/purchases','src/progression']) scan(path.join(source,folder));
files.push(path.join(source,'app/(game)/(tabs)/life.tsx'));`);
replaceOnce("const load=file=>require(path.join(source,file))", `
// Only the Expo native configuration boundary is supplied by this Node host.
// Premium override/profiling remain off; command timing is enabled by the observer.
const nativeLoad = Module._load;
Module._load = function(name, ...args) { return name === 'expo-constants' ? { __esModule:true, default:{expoConfig:{extra:{}}} } : nativeLoad.call(this,name,...args); };
const load=file=>require(path.join(source,file))`);
replaceOnce("const {createHash}=require('node:crypto')", "const Module=require('node:module');const {createHash}=require('node:crypto')");
replaceOnce('Math.floor((values.length-1)*p)', 'Math.ceil(values.length*p)-1');
replaceOnce("return{type:'advance'};}", "return{type:world.annual?'resume':'advance'};}");
replaceOnce("const folder=fs.mkdtempSync", `
const {createGameStore}=load('src/state/gameStore.ts'),{observeCommandTimings}=load('src/performance/commandTiming.ts');
const ledgerIndex=load('src/game/ledgerIndex.ts');
for (const name of ['indexLedger','rememberLedgerIndex']) {
  const work=ledgerIndex[name]; ledgerIndex[name]=(...args)=>global.__dreamsMeasure(name,()=>work(...args));
}
const engine=load('src/game/engine.ts'), originalResolve=engine.resolveCommand;
engine.resolveCommand=(...args)=>global.__dreamsMeasure('resolveCommand',()=>originalResolve(...args));
for (const [file,names] of [['src/feedback/committedCue.ts',['committedCues','seriousTransition']],['src/progression/progress.ts',['lifeProgress']],['src/progression/facts.ts',['progressFacts']]]) {
  const mod=load(file);for (const name of names){const work=mod[name];mod[name]=(...args)=>global.__dreamsMeasure(name,()=>work(...args));}
}
const commitName=SaveRepository.prototype.commitWithReview ? 'commitWithReview' : 'commit', originalCommit=SaveRepository.prototype[commitName];
SaveRepository.prototype[commitName]=async function(...args) {
  const target=phases,start=performance.now();try{return await originalCommit.apply(this,args);}finally{
    if(target){const row=target.repositoryCommit??={calls:0,inclusiveMs:0};row.calls++;row.inclusiveMs+=performance.now()-start;}
  }
};
const folder=fs.mkdtempSync`);
replaceOnce("let world=await repo.load(original.id);if(global.gc)", `let world=await repo.load(original.id);
const store=createGameStore({repository:async()=>repo,date:()=>world.date,id:()=> 'unused',onFeedback:()=>{}});
assert(await store.getState().bootstrap());
const commandEvents=[],stopTiming=observeCommandTimings(event=>commandEvents.push(event));
if(global.gc)`);
replaceOnce("const start=performance.now(),next=resolveCommand(world,cmd,true),resolved=performance.now();world=await repo.commit(next,world.revision,'benchmark:'+world.revision+':'+cmd.type,cmd.type==='advance');resolveMs+=resolved-start;commitMs+=performance.now()-resolved;", `assert(await store.getState().dispatch(cmd),store.getState().error??'Command failed');world=store.getState().world;`);
replaceOnce("const totalMs=performance.now()-opening,measured=phases;phases=null;", `const totalMs=performance.now()-opening,measured=phases;stopTiming();
resolveMs=measured.resolveCommand?.inclusiveMs??0;commitMs=measured.repositoryCommit?.inclusiveMs??0;
for (const name of ['simulation','validation','checkpoint','sqlite','feedback','review']) {
  let start;
  for(const event of commandEvents){if(event.phase===name+':start')start=event.elapsedMs;
    if(event.phase===name+':end'&&start!==undefined){const row=measured['trace:'+name]??={calls:0,inclusiveMs:0};row.calls++;row.inclusiveMs+=event.elapsedMs-start;start=undefined;}}
}
phases=null;`);
replaceOnce("gcMs:gcEntries.reduce((sum,e)=>sum+e.ms,0),phases:measured", "gcMs:gcEntries.reduce((sum,e)=>sum+e.ms,0),commandEvents,phases:measured");
replaceOnce("const outcome={worldSha256:", "const outcome={reviewTracker:await repo.loadReviewTracker(),worldSha256:");
replaceOnce("assert.deepEqual(await cold.repo.load(world.id),world);", "assert.deepEqual(await cold.repo.load(world.id),world);assert.deepEqual(await cold.repo.loadReviewTracker(),outcome.reviewTracker);");
replaceOnce("const backup=await cold.repo.recoveryPreview(world.id);", "assert.equal(cold.sqlite.prepare('SELECT count(*) AS n FROM receipts WHERE life_id=?').get(world.id).n,commands.length);const backup=await cold.repo.recoveryPreview(world.id);");
replaceOnce("scope:'Cloud Node/on-disk SQLite, one warm-up then fixed-world samples. Original current/backup/snapshot histories preserved. Synchronous command spans are not native frame timings; no React or physical-device claim.'", "scope:'Cloud Node/on-disk SQLite through real gameStore.dispatch, one warm-up then fixed-world samples. Original current/backup/snapshot histories preserved. Expo Constants native boundary supplied with overrides off. Synchronous phases overlap; no React or physical-device claim.',historicalDriverSha256:sha(fs.readFileSync(" + JSON.stringify(originalFile) + "))");
const compiled = new Module(__filename, module);
compiled.filename = __filename;
compiled.paths = Module._nodeModulePaths(__dirname);
compiled._compile(driver, __filename);
