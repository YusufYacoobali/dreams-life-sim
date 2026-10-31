// Finite retained-heap/cache churn; process RSS is not native peak memory.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto'),ts=require('typescript'),{DatabaseSync}=require('node:sqlite');
const flags={};for(let i=2;i<process.argv.length;i+=2)flags[process.argv[i]]=process.argv[i+1];
const source=path.resolve(flags['--source']),folder=fs.mkdtempSync(path.join(os.tmpdir(),'dreams-mobile-memory-'));
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const load=file=>require(path.join(source,file)),{SaveRepository}=load('src/persistence/repository.ts'),{unpackCheckpoint}=load('src/persistence/checkpoints.ts'),{encodeWorld}=load('src/game/model.ts');
const {resolveCommand}=load('src/game/engine.ts'),{choiceUnavailable}=load('src/game/choiceAvailability.ts');
const {lifetimeStatistics}=load('src/ui/lifetimeStatistics.ts'),{relationshipContacts}=load('src/ui/relationshipFilters.ts'),{createJournalProjection}=load('src/ui/journalProjection.ts');
const sqlite=new DatabaseSync(path.join(folder,'lives.db'));sqlite.exec('PRAGMA journal_mode=WAL;PRAGMA foreign_keys=ON');
const session={run:async(sql,v=[])=>{sqlite.prepare(sql).run(...v);},get:async(sql,v=[])=>sqlite.prepare(sql).get(...v)??null,all:async(sql,v=[])=>sqlite.prepare(sql).all(...v)};
const repository=new SaveRepository({...session,exec:async sql=>sqlite.exec(sql),transaction:async action=>{sqlite.exec('BEGIN IMMEDIATE');try{const value=await action(session);sqlite.exec('COMMIT');return value;}catch(error){sqlite.exec('ROLLBACK');throw error;}}});
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
(async()=>{
 await repository.initialise();const ids=[],expected={};
 for(const [name,age]of [['ordinary',90],['generations',1]]){
  const input=JSON.parse(fs.readFileSync(path.join(flags['--inputs'],name+'.json'),'utf8')),row=input.snapshots.find(s=>s.summary.age===age),world=unpackCheckpoint(row.payload,true);
  assert(!ids.includes(world.id));ids.push(world.id);expected[world.id]={hash:sha(encodeWorld(world)),ledger:world.ledger.length,journal:world.journal.length};await repository.create(world);
 }
 const project=createJournalProjection(),samples=[];
 for(let cycle=0;cycle<32;cycle++){
  const id=ids[cycle%ids.length],start=performance.now();await repository.select(id);const world=await repository.load(id);
  lifetimeStatistics(world);relationshipContacts(world,'all');project(world.journal,{lifeId:world.id,personId:world.activePersonId,born:world.people[world.activePersonId].born},world);
  assert.equal(world.ledger.length,expected[id].ledger);assert.equal(world.journal.length,expected[id].journal);
  if(cycle<2)assert.equal(sha(encodeWorld(world)),expected[id].hash);
  const elapsedMs=performance.now()-start,beforeGc=process.memoryUsage().heapUsed;if(global.gc)global.gc();
  samples.push({cycle,id,elapsedMs,heapBeforeGc:beforeGc,heapAfterGc:process.memoryUsage().heapUsed,rssHighWaterBytes:process.resourceUsage().maxRSS*1024});
 }
 const commandSamples=[];
 for(const id of ids){
  let world=await repository.load(id);
  for(let cycle=0;cycle<16&&!world.people[world.activePersonId].died;cycle++){
   const commands=[];
   const act=async command=>{const before=world;world=resolveCommand(before,command,true);await repository.commit(world,before.revision,'memory:'+id+':'+cycle+':'+commands.length);commands.push(command);};
   await act({type:'advance'});let guard=0;
   while((world.pending||world.annual)&&guard++<120&&!world.people[world.activePersonId].died){
    const event=world.pending;
    await act(event?.kind==='decision'?{type:'choose',eventId:event.id,choiceId:event.choices.find(choice=>!choiceUnavailable(world,choice)).id}:event?{type:'acknowledge',resultId:event.id}:{type:'resume'});
   }
   assert(guard<120);world=await repository.load(id);
   lifetimeStatistics(world);relationshipContacts(world,'all');project(world.journal,{lifeId:id,personId:world.activePersonId,born:world.people[world.activePersonId].born},world);
   const hash=sha(encodeWorld(world)),beforeGc=process.memoryUsage().heapUsed;if(global.gc)global.gc();
   commandSamples.push({id,cycle,commands,hash,date:world.date,random:world.random,people:Object.keys(world.people).length,ledger:world.ledger.length,journal:world.journal.length,died:world.people[world.activePersonId].died??null,heapBeforeGc:beforeGc,heapAfterGc:process.memoryUsage().heapUsed,rssHighWaterBytes:process.resourceUsage().maxRSS*1024});
  }
 }
 fs.writeFileSync(flags['--output'],JSON.stringify({scope:'32 actual alternating selects/loads of two distinct existing lives through one real SQLite repository, with statistics/relationships/journal detail projections. Then up to sixteen actual full-year Age Up/Continue sequences per life are committed, stopping at original natural death; all choices/results use the same available-command policy. No saved records pruned or dates/funds/RNG patched. Heap after forced GC is retained Node memory; RSS is process lifetime high-water including setup. No native/React scroll memory claim and no proof about every possible session.',node:process.version,driverHash:sha(fs.readFileSync(__filename)),runtimeHashes:Object.fromEntries(['src/game/model.ts','src/game/ledgerIndex.ts','src/persistence/checkpoints.ts','src/persistence/repository.ts'].map(file=>[file,sha(fs.readFileSync(path.join(source,file)))])),expected,samples,commandSamples},null,2)+'\n');
 sqlite.close();fs.rmSync(folder,{recursive:true,force:true});
})().catch(error=>{console.error(error);process.exitCode=1;});
