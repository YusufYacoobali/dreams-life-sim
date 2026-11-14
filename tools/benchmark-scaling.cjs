// Node/real on-disk SQLite through the production store. Not a native device benchmark.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const {DatabaseSync} = require('node:sqlite'), {PerformanceObserver} = require('node:perf_hooks');
const {runtime,sha} = require('./scaling-runtime.cjs');
const flags = {}; for (let i=2;i<process.argv.length;i+=2) flags[process.argv[i]]=process.argv[i+1];
const samples = Number(flags['--samples'] ?? 7); assert(samples >= 5 && samples <= 50);
let phases, gc = [];
const observe = (name,ms) => { if (phases) { const row = phases[name] ??= {calls:0,ms:0}; row.calls++; row.ms+=ms; } };
const {load,model,codec,engine,digest} = runtime(flags['--source'] ?? path.join(__dirname,'..'),observe), sourceHash = digest();
if (flags['--engine'] === 'draft') {
  const work=engine.resolveCommandUsingDraft;
  engine.resolveCommand=(...args)=>global.__scalingMeasure('resolveCommand',()=>work(...args));
}
const {SaveRepository} = load('src/persistence/repository.ts'), {createGameStore} = load('src/state/gameStore.ts');
const {observeCommandTimings} = load('src/performance/commandTiming.ts'), {createJournalProjection} = load('src/ui/journalProjection.ts');
const {choiceUnavailable} = load('src/game/choiceAvailability.ts'), {personalBorrowReason} = load('src/game/systems/credit.ts');
const inputBytes = fs.readFileSync(flags['--inputs']), inputs = JSON.parse(inputBytes), results = [];
const folder = fs.mkdtempSync(path.join(os.tmpdir(),'dreams-scaling-'));
const observer = new PerformanceObserver(list => gc.push(...list.getEntries().map(entry => entry.duration))); observer.observe({entryTypes:['gc']});
const quantile = (values,p) => [...values].sort((a,b)=>a-b)[Math.ceil(values.length*p)-1];
const stats = values => ({p50:quantile(values,.5),p95:quantile(values,.95),max:Math.max(...values)});
function database(file) {
  const sqlite = new DatabaseSync(file); sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON');
  const session = {};
  for (const [method,operation] of [['run','run'],['get','get'],['all','all']]) session[method] = async (sql,values=[]) => {
    const start = performance.now(), result = sqlite.prepare(sql)[operation](...values); observe('sqlite:'+method,performance.now()-start);
    // Upper-level native transfer workload, not a measurement of a real native bridge.
    if (phases) {
      const row = phases.nativeTransferBytes ??= {calls:0,ms:0}; row.calls++;
      row.ms+=Buffer.byteLength(JSON.stringify(values))+Buffer.byteLength(JSON.stringify(result,(_key,value)=>typeof value==='bigint'?String(value):value)??'');
    }
    return result ?? null;
  };
  const driver = {...session,exec:async sql=>sqlite.exec(sql),transaction:async action=>{
    const start = performance.now(); sqlite.exec('BEGIN IMMEDIATE');
    try { const result=await action(session); sqlite.exec('COMMIT'); return result; }
    catch(error) { sqlite.exec('ROLLBACK'); throw error; }
    finally { observe('sqlite:transaction',performance.now()-start); }
  }};
  return {sqlite,repo:new SaveRepository(driver,()=> '2026-11-14T12:00:00.000Z')};
}
async function main() {
  const selected = inputs.snapshots.filter(row => (!flags['--ages'] || flags['--ages'].split(',').includes(String(row.summary.age))) && (!flags['--levels'] || flags['--levels'].split(',').includes(row.summary.level)));
  for (const snapshot of selected) for (const kind of (flags['--kinds'] ?? 'routine,finance,firstAgeUp,fullYear').split(',')) {
    const initial = codec.unpackCheckpoint(snapshot.payload,true); if (kind === 'finance' && personalBorrowReason(initial,1n)) continue;
    const trials = []; let expected;
    for (let trial=0;trial<=samples;trial++) {
      const file = path.join(folder,'trial.db'); fs.rmSync(file,{force:true});
      const {sqlite,repo} = database(file); await repo.initialise(); await repo.create(initial);
      const store = createGameStore({repository:async()=>repo,date:()=>initial.date,id:()=> 'unused',onFeedback:()=>{},yieldToUI:()=>new Promise(resolve=>setImmediate(resolve))});
      assert(await store.getState().bootstrap());
      const project = createJournalProjection(), scope = world=>({lifeId:world.id,personId:world.activePersonId,born:world.people[world.activePersonId].born});
      project(initial.journal,scope(initial),initial);
      if (global.gc) global.gc(); await new Promise(resolve=>setImmediate(resolve)); gc=[];
      const memoryBefore=process.memoryUsage(), cpuBefore=process.cpuUsage(), events=[], stop=observeCommandTimings(event=>events.push(event));
      phases={}; const start=performance.now(), commands=[];
      const world=()=>store.getState().world;
      async function act(command) {
        commands.push(command); assert(await store.getState().dispatch(command),store.getState().error ?? 'Dispatch failed');
        const began=performance.now(); project(world().journal,scope(world()),world()); observe('journalProjection',performance.now()-began);
      }
      if (kind === 'routine') {
        await act({type:'health-routine',routine:{...world().people[world().activePersonId].health.routine,mindfulness:!world().people[world().activePersonId].health.routine.mindfulness}});
      } else if (kind === 'finance') await act({type:'borrow',amount:1n});
      else await act({type:world().annual?'resume':'advance'});
      if (kind === 'routine' || kind === 'finance') await act({type:'acknowledge',resultId:world().pending.id});
      if (kind === 'fullYear') {
        let guard=0;
        while ((world().annual || world().pending) && !world().people[world().activePersonId].died && guard++<200) {
          const event=world().pending;
          await act(event?.kind==='decision'?{type:'choose',eventId:event.id,choiceId:event.choices.find(choice=>!choiceUnavailable(world(),choice)).id}:event?{type:'acknowledge',resultId:event.id}:{type:'resume'});
        }
        assert(guard<200);
      }
      const elapsedMs=performance.now()-start, measured=phases; phases=undefined; stop();
      const memoryAfter=process.memoryUsage(), cpu=process.cpuUsage(cpuBefore);
      await new Promise(resolve=>setImmediate(resolve));
      const final=world(), payload=sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(final.id).payload;
      const outcome={worldSha256:sha(model.encodeWorld(final)),checkpointSha256:sha(payload),random:final.random,date:final.date,
        revision:final.revision,journalRows:final.journal.length,ledgerRows:final.ledger.length,people:Object.keys(final.people).length,
        reviewTracker:await repo.loadReviewTracker(),commandsSha256:sha(JSON.stringify(commands,model.moneyJSON))};
      if (expected) assert.deepEqual(outcome,expected); else expected=outcome;
      assert.equal(sqlite.prepare('SELECT count(*) AS n FROM receipts WHERE life_id=?').get(final.id).n,commands.length);
      sqlite.close();
      const cold=database(file); assert.deepEqual(await cold.repo.load(final.id),final); assert.equal((await cold.repo.recoveryPreview(final.id)).revision,final.revision-1); cold.sqlite.close();
      if (trial) trials.push({elapsedMs,heapDelta:memoryAfter.heapUsed-memoryBefore.heapUsed,rss:memoryAfter.rss,cpu,gcMs:gc.reduce((a,b)=>a+b,0),gcCount:gc.length,phases:measured,events});
    }
    const names=[...new Set(trials.flatMap(trial=>Object.keys(trial.phases)))];
    results.push({input:snapshot.summary,kind,outcome:expected,timingMs:stats(trials.map(trial=>trial.elapsedMs)),heapDeltaBytes:stats(trials.map(trial=>trial.heapDelta)),rssBytes:stats(trials.map(trial=>trial.rss)),gcMs:stats(trials.map(trial=>trial.gcMs)),
      phases:Object.fromEntries(names.map(name=>[name,{...stats(trials.map(trial=>trial.phases[name]?.ms??0)),calls:trials[0].phases[name]?.calls??0}])),trials});
    fs.writeFileSync(flags['--output'],JSON.stringify({scope:'Node 24 / real on-disk SQLite / production store. One warm-up, nearest-rank p50/p95/max. Inclusive overlapping phase times. nativeTransferBytes is bytes, not ms; no native bridge/device/React timing claim.',sourceHash,inputSha256:sha(inputBytes),samples,node:process.version,results},null,2));
    process.stderr.write(`${snapshot.summary.age}/${snapshot.summary.level ?? 'continue'}/${kind}: ${results.at(-1).timingMs.p50.toFixed(1)}ms\n`);
  }
  assert.equal(digest(),sourceHash,'Sources changed during benchmark');
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{observer.disconnect();fs.rmSync(folder,{recursive:true,force:true});});
