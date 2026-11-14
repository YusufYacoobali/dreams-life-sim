// Full store + on-disk SQLite A/B pairs, alternating order in the same process.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite'),{runtime,sha}=require('./scaling-runtime.cjs');
const flags={};for(let i=2;i<process.argv.length;i+=2)flags[process.argv[i]]=process.argv[i+1];
const apis=[runtime(flags['--reference']),runtime(flags['--source']??path.join(__dirname,'..'))].map(api=>({...api,
 Repository:api.load('src/persistence/repository.ts').SaveRepository,store:api.load('src/state/gameStore.ts').createGameStore,
 project:api.load('src/ui/journalProjection.ts').createJournalProjection,unavailable:api.load('src/game/choiceAvailability.ts').choiceUnavailable}));
const hashes=apis.map(api=>api.digest()),inputBytes=fs.readFileSync(flags['--inputs']),inputs=JSON.parse(inputBytes),samples=Number(flags['--samples']??11);assert(samples>=5&&samples<=50);
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'dreams-store-pairs-')),results=[];
const q=(values,p)=>[...values].sort((a,b)=>a-b)[Math.ceil(values.length*p)-1],stats=values=>({p50:q(values,.5),p95:q(values,.95),max:Math.max(...values)});
function database(api,file){const sqlite=new DatabaseSync(file);sqlite.exec('PRAGMA journal_mode=WAL;PRAGMA foreign_keys=ON');const session={run:async(sql,v=[])=>{sqlite.prepare(sql).run(...v);},get:async(sql,v=[])=>sqlite.prepare(sql).get(...v)??null,all:async(sql,v=[])=>sqlite.prepare(sql).all(...v)};return {sqlite,repo:new api.Repository({...session,exec:async sql=>sqlite.exec(sql),transaction:async action=>{sqlite.exec('BEGIN IMMEDIATE');try{const value=await action(session);sqlite.exec('COMMIT');return value;}catch(error){sqlite.exec('ROLLBACK');throw error;}}},()=> '2026-11-14T12:00:00.000Z')};}
async function trial(api,initial,kind,side,cold){
 const file=path.join(folder,side+'.db');fs.rmSync(file,{force:true});let {sqlite,repo}=database(api,file);await repo.initialise();await repo.create(initial);
 const store=api.store({repository:async()=>repo,date:()=>initial.date,id:()=> 'unused',onFeedback:()=>{},yieldToUI:()=>new Promise(resolve=>setImmediate(resolve))});assert(await store.getState().bootstrap());
 const world=()=>store.getState().world,project=api.project(),scope=w=>({lifeId:w.id,personId:w.activePersonId,born:w.people[w.activePersonId].born});project(initial.journal,scope(initial),initial);
 const commands=[],start=performance.now(),cpuBefore=process.cpuUsage();
 async function act(command){commands.push(command);assert(await store.getState().dispatch(command),store.getState().error??'Dispatch failed');project(world().journal,scope(world()),world());}
 if(kind==='routine')await act({type:'health-routine',routine:{...world().people[world().activePersonId].health.routine,mindfulness:!world().people[world().activePersonId].health.routine.mindfulness}});
 else if(kind==='finance')await act({type:'borrow',amount:1n});else await act({type:world().annual?'resume':'advance'});
 if(kind==='routine'||kind==='finance')await act({type:'acknowledge',resultId:world().pending.id});
 if(kind==='fullYear'){let guard=0;while((world().pending||world().annual)&&!world().people[world().activePersonId].died&&guard++<200){const event=world().pending;await act(event?.kind==='decision'?{type:'choose',eventId:event.id,choiceId:event.choices.find(choice=>!api.unavailable(world(),choice)).id}:event?{type:'acknowledge',resultId:event.id}:{type:'resume'});}assert(guard<200);}
 const elapsedMs=performance.now()-start,cpu=process.cpuUsage(cpuBefore),final=world(),payload=sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(final.id).payload;
 const outcome={canonicalSha256:sha(api.model.encodeWorld(final)),random:final.random,date:final.date,died:final.people[final.activePersonId].died,
 revision:final.revision,journal:final.journal.length,ledger:final.ledger.length,people:Object.keys(final.people).length,commands:commands.length,commandsSha256:sha(JSON.stringify(commands,api.model.moneyJSON)),review:await repo.loadReviewTracker()};
 assert.equal(sqlite.prepare('SELECT count(*) AS n FROM receipts WHERE life_id=?').get(final.id).n,commands.length);
 sqlite.close();
 if(cold){({sqlite,repo}=database(api,file));assert.equal(sha(api.model.encodeWorld(await repo.load(final.id))),outcome.canonicalSha256);assert.equal((await repo.recoveryPreview(final.id)).revision,final.revision-1);sqlite.close();}
 return {elapsedMs,cpuMs:(cpu.user+cpu.system)/1000,checkpointBytes:Buffer.byteLength(payload),checkpointSha256:sha(payload),outcome};
}
async function main(){for(const input of inputs.snapshots.filter(row=>!flags['--levels']||flags['--levels'].split(',').includes(row.summary.level))){
 const worlds=apis.map(api=>api.codec.unpackCheckpoint(input.payload,true));
 for(const kind of (flags['--kinds']??'routine,finance,firstAgeUp,fullYear').split(',')){
  const warm=[];for(let side=0;side<2;side++)warm[side]=await trial(apis[side],worlds[side],kind,side,true);assert.deepEqual(warm[0].outcome,warm[1].outcome);
  const pairs=[];
  for(let sample=0;sample<samples;sample++){if(global.gc)global.gc();await new Promise(resolve=>setImmediate(resolve));const rows=[],order=sample%2?[1,0]:[0,1];for(const side of order)rows[side]=await trial(apis[side],worlds[side],kind,side,false);assert.deepEqual(rows[0].outcome,rows[1].outcome);assert.deepEqual(rows[0].outcome,warm[0].outcome);for(const side of [0,1])assert.equal(rows[side].checkpointSha256,warm[side].checkpointSha256);pairs.push({order,reference:rows[0],candidate:rows[1]});}
  results.push({input:input.summary,inputDate:worlds[0].date,kind,outcome:warm[0].outcome,reference:stats(pairs.map(pair=>pair.reference.elapsedMs)),candidate:stats(pairs.map(pair=>pair.candidate.elapsedMs)),medianPairedRatio:q(pairs.map(pair=>pair.candidate.elapsedMs/pair.reference.elapsedMs),.5),pairs});
  fs.writeFileSync(flags['--output'],JSON.stringify({scope:'Production store.dispatch, real on-disk SQLite, review metadata, journal projection and async UI yield. Same-process baseline/candidate order alternates per sample; one warm-up per side. Forced GC outside each pair. No opt-in command listener, native bridge or React/device claim. All canonical/RNG/command/review outcomes match; each versioned codec is deterministic. Cold reopen and backups verified outside timing once per side/case.',sourceHashes:hashes,inputSha256:sha(inputBytes),samples,results},null,2));
  const row=results.at(-1);process.stderr.write(`${input.summary.age}/${input.summary.level??'continue'}/${kind}: ${row.reference.p50.toFixed(1)} -> ${row.candidate.p50.toFixed(1)}ms (${row.medianPairedRatio.toFixed(3)})\n`);
 }
 }assert.deepEqual(apis.map(api=>api.digest()),hashes);}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>fs.rmSync(folder,{recursive:true,force:true}));
