// Reproducible installation made by the retained reader-32 implementation.
// Writes a new disposable database; never upgrades/downgrades a user's file.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),{gzipSync}=require('node:zlib'),{DatabaseSync}=require('node:sqlite');
const {runtime,sha}=require('./scaling-runtime.cjs'),flags={};for(let i=2;i<process.argv.length;i+=2)flags[process.argv[i]]=process.argv[i+1];
const api=runtime(flags['--reference'],undefined,{instrument:false}),{SaveRepository}=api.load('src/persistence/repository.ts'),{decodeSave}=api.load('src/persistence/archive.ts');
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'dreams-reader32-')),file=path.join(folder,'installation.db'),sqlite=new DatabaseSync(file);
const session={run:async(sql,v=[])=>{sqlite.prepare(sql).run(...v);},get:async(sql,v=[])=>sqlite.prepare(sql).get(...v)??null,all:async(sql,v=[])=>sqlite.prepare(sql).all(...v)};
const repo=new SaveRepository({...session,exec:async sql=>sqlite.exec(sql),transaction:async action=>{sqlite.exec('BEGIN IMMEDIATE');try{const result=await action(session);sqlite.exec('COMMIT');return result;}catch(error){sqlite.exec('ROLLBACK');throw error;}}},()=> '2026-11-14T12:00:00.000Z');
async function main(){
 const sourceHash=api.digest(),inputBytes=fs.readFileSync(flags['--inputs']),fixtureBytes=fs.readFileSync(path.join(__dirname,'../tests/fixtures/v28-ordinary-hobby-archive.json'));
 await repo.initialise();assert.equal(sqlite.prepare('PRAGMA user_version').get().user_version,32);
 const worlds=[api.codec.unpackCheckpoint(JSON.parse(inputBytes).snapshots.find(s=>s.summary.age===30).payload,true),decodeSave(fixtureBytes.toString()).world];
 for(const world of worlds){await repo.create(world);await repo.snapshot(world.id,world.revision);}
 const before=worlds[0],routine={...before.people[before.activePersonId].health.routine,mindfulness:!before.people[before.activePersonId].health.routine.mindfulness};
 const next=api.engine.resolveCommand(before,{type:'health-routine',routine},true);await repo.commit(next,before.revision,'legacy-real-command');
 const snapshot=(await repo.snapshots(before.id))[0];await repo.restoreBranch(before.id,snapshot.id,next.revision,'life_reader32_branch','legacy-restore');
 const tables=sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(r=>r.name),rows=Object.fromEntries(tables.map(t=>[t,sqlite.prepare('SELECT * FROM '+t+' ORDER BY rowid').all()]));
 const manifest={scope:'New installation written entirely by retained reader-32 code from real command-generated/archived lives. Not a captured user installation. All eight tables populated through repository operations; no payload or reader-marker edits.',reference:'8378d0f8',sourceHash,inputSha256:sha(inputBytes),archivedFixtureSha256:sha(fixtureBytes),reader:32,tableCounts:Object.fromEntries(tables.map(t=>[t,rows[t].length])),rowsSha256:sha(JSON.stringify(rows)),lives:await Promise.all((await repo.list()).map(async life=>({id:life.id,canonicalSha256:sha(api.model.encodeWorld(await repo.load(life.id)))})))};
 sqlite.close();const bytes=fs.readFileSync(file);manifest.databaseSha256=sha(bytes);fs.writeFileSync(flags['--output'],gzipSync(bytes,{mtime:0}));fs.writeFileSync(flags['--output']+'.json',JSON.stringify(manifest,null,2)+'\n');assert.equal(api.digest(),sourceHash);console.log(manifest);
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{try{sqlite.close();}catch{}fs.rmSync(folder,{recursive:true,force:true});});
