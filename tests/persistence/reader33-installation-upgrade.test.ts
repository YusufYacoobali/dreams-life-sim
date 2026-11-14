import { readFileSync, writeFileSync, copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SaveRepository, type SqlDatabase } from '../../src/persistence/repository';
import { resolveCommand } from '../../src/game/engine';
import { encodeWorld } from '../../src/game/model';
import { diskDatabase } from '../support/refinementSqlite';
import manifest from '../fixtures/v2-reader32-installation.db.gz.json';

const sha=(data:string|Buffer)=>createHash('sha256').update(data).digest('hex');
test('a real reader-32 writer installation upgrades atomically on a separate copy and retains every life/history/receipt across failure, retry and cold reopen',async()=>{
 const folder=mkdtempSync(join(tmpdir(),'dreams-installation33-')),pre=join(folder,'untouched-reader32.db'),post=join(folder,'upgrade33.db');
 const bytes=gunzipSync(readFileSync(join(__dirname,'../fixtures/v2-reader32-installation.db.gz')));expect(sha(bytes)).toBe(manifest.databaseSha256);
 writeFileSync(pre,bytes);copyFileSync(pre,post);
 let {sqlite,driver}=diskDatabase(post),repo=new SaveRepository(driver);
 const rows=()=>Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(row=>[String(row.name),sqlite.prepare('SELECT * FROM '+row.name+' ORDER BY rowid').all()]));
 const reopen=()=>{sqlite.close();({sqlite,driver}=diskDatabase(post));repo=new SaveRepository(driver);return repo;};
 try {
  expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(32);const original=rows();expect(sha(JSON.stringify(original))).toBe(manifest.rowsSha256);
  const failing:SqlDatabase={...driver,transaction:action=>driver.transaction(tx=>action({...tx,run:async(sql,values)=>{await tx.run(sql,values);if(sql==='PRAGMA user_version = 33')throw Error('Interrupted upgrade');}}))};
  await expect(new SaveRepository(failing).initialise()).rejects.toThrow('Interrupted upgrade');expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(32);expect(rows()).toEqual(original);
  await reopen().initialise();expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(33);expect(rows()).toEqual(original);
  for(const life of manifest.lives)expect(sha(encodeWorld(await repo.load(life.id)))).toBe(life.canonicalSha256);
  expect(rows()).toEqual(original);expect(sha(readFileSync(pre))).toBe(manifest.databaseSha256);
  const before=await repo.load('life_v2_performance_42');expect(before.pending?.kind).toBe('result');
  const acknowledged=resolveCommand(before,{type:'acknowledge',resultId:before.pending!.id},true);await repo.commit(acknowledged,before.revision,'upgrade-ack');
  const next=resolveCommand(acknowledged,{type:'borrow',amount:1n},true),saved=rows();
  sqlite.exec("CREATE TRIGGER fail_upgraded BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'Interrupted write'); END");
  await expect(repo.commit(next,acknowledged.revision,'upgrade-credit')).rejects.toThrow('Interrupted write');expect(rows()).toEqual(saved);
  await reopen().initialise();expect(await repo.load(before.id)).toEqual(acknowledged);sqlite.exec('DROP TRIGGER fail_upgraded');
  expect(await repo.commit(next,acknowledged.revision,'upgrade-credit')).toEqual(next);expect(await repo.commit(next,acknowledged.revision,'upgrade-credit')).toEqual(next);
  expect(sqlite.prepare('SELECT count(*) AS n FROM receipts WHERE command_id=?').get('upgrade-credit')?.n).toBe(1);
  expect(JSON.parse(String(sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(before.id)?.payload)).format).toBe('dreams-checkpoint-v5');
  await reopen().initialise();expect(await repo.load(before.id)).toEqual(next);expect(await repo.recoveryPreview(before.id)).toEqual(acknowledged);
  const checkpoint=(await repo.snapshots(before.id))[0],branch=await repo.restoreBranch(before.id,checkpoint.id,next.revision,'life_upgraded_independent','upgraded-restore');
  expect(branch.journal).toEqual(acknowledged.journal);expect(branch.ledger).toEqual(acknowledged.ledger);expect(await repo.load(before.id)).toEqual(next);
  const exported=await repo.export(before.id),importFile=join(folder,'import.db'),imported=diskDatabase(importFile);
  try{const destination=new SaveRepository(imported.driver);await destination.initialise();expect(await destination.import(exported)).toEqual(next);expect(await destination.snapshots(before.id)).toEqual(await repo.snapshots(before.id));}finally{imported.sqlite.close();}
  sqlite.exec('PRAGMA user_version=34');const future=rows();await expect(reopen().initialise()).rejects.toThrow('newer version');expect(rows()).toEqual(future);expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(34);
  expect(sha(readFileSync(pre))).toBe(manifest.databaseSha256);
 }finally{sqlite.close();rmSync(folder,{recursive:true,force:true});}
},120000);
