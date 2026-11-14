// Finite actual SQLite churn. Heap after forced GC is retained Node memory,
// never a claim about native peaks or an unbounded session.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite'),{runtime,sha}=require('./scaling-runtime.cjs');
const flags={};for(let i=2;i<process.argv.length;i+=2)flags[process.argv[i]]=process.argv[i+1];
assert(global.gc,'Run with --expose-gc');
const {load,model,codec,engine,digest}=runtime(flags['--source']??path.join(__dirname,'..')),sourceHash=digest();
const {SaveRepository}=load('src/persistence/repository.ts'),{createJournalProjection}=load('src/ui/journalProjection.ts');
const {lifetimeStatistics}=load('src/ui/lifetimeStatistics.ts'),{relationshipContacts}=load('src/ui/relationshipFilters.ts');
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'dreams-scaling-memory-')),file=path.join(folder,'lives.db');
function database(){const sqlite=new DatabaseSync(file);sqlite.exec('PRAGMA journal_mode=WAL;PRAGMA foreign_keys=ON');const session={run:async(sql,v=[])=>{sqlite.prepare(sql).run(...v);},get:async(sql,v=[])=>sqlite.prepare(sql).get(...v)??null,all:async(sql,v=[])=>sqlite.prepare(sql).all(...v)};return {sqlite,repo:new SaveRepository({...session,exec:async sql=>sqlite.exec(sql),transaction:async action=>{sqlite.exec('BEGIN IMMEDIATE');try{const result=await action(session);sqlite.exec('COMMIT');return result;}catch(error){sqlite.exec('ROLLBACK');throw error;}}})};}
async function main(){
 const inputs=[JSON.parse(fs.readFileSync(flags['--inputs'])).snapshots.find(row=>row.summary.age===70&&row.summary.level==='extreme'),JSON.parse(fs.readFileSync(flags['--continue'])).snapshots[0]];
 const ids=[],initial={};let {sqlite,repo}=database();await repo.initialise();
 for(const row of inputs){const world=codec.unpackCheckpoint(row.payload,true);assert(!ids.includes(world.id));ids.push(world.id);initial[world.id]={canonicalSha256:sha(model.encodeWorld(world)),journal:world.journal.length,ledger:world.ledger.length};await repo.create(world);}
 const project=createJournalProjection(),samples=[],commands=[];
 const projectWorld=world=>project(world.journal,{lifeId:world.id,personId:world.activePersonId,born:world.people[world.activePersonId].born},world);
 for(let cycle=0;cycle<32;cycle++){const world=await repo.select(ids[cycle%2]);lifetimeStatistics(world);relationshipContacts(world,'all');projectWorld(world);assert.equal(sha(model.encodeWorld(world)),initial[world.id].canonicalSha256);global.gc();samples.push({cycle,heapAfterGc:process.memoryUsage().heapUsed,rssHighWater:process.resourceUsage().maxRSS*1024});}
 let world=await repo.select(ids[0]);const baseline={journal:world.journal.length,ledger:world.ledger.length};
 for(let cycle=0;cycle<500;cycle++){
  const routine={...world.people[world.activePersonId].health.routine,mindfulness:!world.people[world.activePersonId].health.routine.mindfulness};
  for(const command of [{type:'health-routine',routine},{type:'acknowledge'}]){
   if(command.type==='acknowledge')command.resultId=world.pending.id;
   const before=world;world=engine.resolveCommand(before,command,true);world=await repo.commit(world,before.revision,'memory:'+world.revision);projectWorld(world);
  }
  assert.equal(world.journal.length,baseline.journal);assert.equal(world.ledger.length,baseline.ledger);
  if(cycle%25===24){global.gc();commands.push({cycle:cycle+1,revision:world.revision,heapAfterGc:process.memoryUsage().heapUsed,rssHighWater:process.resourceUsage().maxRSS*1024,journal:world.journal.length,ledger:world.ledger.length});}
 }
 const final=sha(model.encodeWorld(world));sqlite.close();({sqlite,repo}=database());assert.equal(sha(model.encodeWorld(await repo.load(ids[0]))),final);assert.equal((await repo.recoveryPreview(ids[0])).revision,world.revision-1);sqlite.close();
 assert.equal(digest(),sourceHash);fs.writeFileSync(flags['--output'],JSON.stringify({scope:'32 actual switches between two genuine distinct saved lives, then 500 routine/acknowledgement pairs (1000 committed commands) without growing history. Real SQLite receipts, backups and cold reopen. Node retained heap after forced GC; process RSS high-water includes TypeScript/setup. Finite evidence, not an unbounded/native memory guarantee.',sourceHash,initial,samples,commands,finalCanonicalSha256:final},null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>fs.rmSync(folder,{recursive:true,force:true}));
