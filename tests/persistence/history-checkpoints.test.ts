import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { gzipSync, gunzipSync, strToU8, strFromU8 } from 'fflate';
import * as codec from '../../src/persistence/checkpoints';
import { copyWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { createDataDraft } from '../../src/game/dataDraft';
import { resolveCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { SaveRepository } from '../../src/persistence/repository';
import { decodeSave } from '../../src/persistence/archive';
import { diskDatabase } from '../support/refinementSqlite';

const payload=readFileSync(join(__dirname,'../fixtures/v30-family-year91-checkpoint.json'),'utf8');
let historical:World;
beforeAll(()=>{historical=codec.unpackCheckpoint(payload,true);});
const original=()=>historical;
type Part={bytes:number;hash:string;data:string};
function part(text:string):Part {
  const bytes=strToU8(text);let hash=2166136261;
  for(const byte of bytes)hash=Math.imul(hash^byte,16777619)>>>0;
  return {bytes:bytes.length,hash:hash.toString(16).padStart(8,'0'),data:Buffer.from(gzipSync(bytes)).toString('base64')};
}
const inflate=(part:Part)=>strFromU8(gunzipSync(Buffer.from(part.data,'base64')));
function recount(frame:any){frame.bytes=frame.main.bytes+[...frame.people,...frame.ledger,...frame.history.journal,...frame.history.relationships].reduce((sum:number,part:Part)=>sum+part.bytes,0);}
afterEach(()=>jest.restoreAllMocks());

test('genuine long-running legacy history round-trips to deterministic v5 without dropping or reordering records',()=>{
  const before=original(),text=encodeWorld(before),packed=codec.packCheckpointV5(before),frame=JSON.parse(packed);
  expect(frame.format).toBe('dreams-checkpoint-v5');expect(frame.history.journal.length).toBeGreaterThan(1);
  const root=JSON.parse(inflate(frame.main));expect(root.journal).toEqual([]);expect(root.relationships).toEqual([]);
  const restored=codec.unpackCheckpoint(packed,true);
  expect(encodeWorld(restored)).toBe(text);expect(restored.random).toEqual(before.random);
  expect(codec.packCheckpointV5(restored)).toBe(packed);expect(codec.packCheckpointV5(before)).toBe(packed);
});

test('verified appends reuse all full history blocks and edits invalidate encoded fragments',()=>{
  const before=original(),packed=codec.packCheckpointV5(before),frame=JSON.parse(packed),tx=createDataDraft(before);
  const gzip=jest.spyOn(require('fflate') as typeof import('fflate'),'gzipSync');
  expect(codec.packCheckpointV5(before)).toBe(packed);expect(gzip).toHaveBeenCalledTimes(1);gzip.mockClear();
  tx.draft.journal.push({id:'new-unicode-fact',date:{...before.date},personId:before.activePersonId,text:'雪 — "hello" \\ \n 🐈',category:'test'});
  const appended=validateWorld(tx.finish(),true),next=JSON.parse(codec.packCheckpointV5(appended));
  expect(gzip).toHaveBeenCalledTimes(2);
  const full=Math.floor(before.journal.length/128);
  expect(next.history.journal.slice(0,full)).toEqual(frame.history.journal.slice(0,full));
  expect(next.history.relationships).toEqual(frame.history.relationships);
  expect(codec.unpackCheckpoint(JSON.stringify(next))).toEqual(appended);
  const edited=copyWorld(appended);edited.journal[0].text='Changed old history';
  const changed=codec.packCheckpointV5(edited);expect(changed).not.toBe(JSON.stringify(next));
  expect(codec.unpackCheckpoint(changed).journal[0].text).toBe('Changed old history');
  expect(codec.packCheckpointV5(before)).toBe(packed);
});

test.each(['hash','total','empty','short-prefix','duplicate','missing-person','future-date','body','oversize'] as const)('%s corruption cannot bypass v5 history integrity',kind=>{
  const frame=JSON.parse(codec.packCheckpointV5(original()));
  if(kind==='hash')frame.history.journal[0].hash='00000000';
  else if(kind==='total')frame.bytes++;
  else if(kind==='oversize')frame.history.journal[0].bytes=32_000_001;
  else if(kind==='body'){const root=JSON.parse(inflate(frame.main));root.journal=[{}];frame.main=part(JSON.stringify(root));recount(frame);}
  else {
    const rows=JSON.parse(inflate(frame.history.journal[0]));
    if(kind==='empty')rows.length=0;
    if(kind==='short-prefix')rows.pop();
    if(kind==='duplicate')rows[1]=rows[0];
    if(kind==='missing-person')rows[0].personId='person_missing';
    if(kind==='future-date')rows[0].date.year=9999;
    frame.history.journal[0]=part(JSON.stringify(rows));recount(frame);
  }
  expect(()=>codec.unpackCheckpoint(JSON.stringify(frame),true)).toThrow();
});

test('v5 SQLite save failure, exact retry, cold reopen, backups, exports and independent snapshot branches preserve full history',async()=>{
  jest.spyOn(codec,'packCheckpoint').mockImplementation(codec.packCheckpointV5);
  const folder=mkdtempSync(join(tmpdir(),'dreams-v5-')),file=join(folder,'save.db');
  let {sqlite,driver}=diskDatabase(file),repo=new SaveRepository(driver);
  try {
    const before=original();await repo.initialise();await repo.create(before);
    const snapshots=await repo.snapshot(before.id,before.revision),event=before.pending;
    const command=event?.kind==='decision'?{type:'choose' as const,eventId:event.id,choiceId:event.choices.find(choice=>!choiceUnavailable(before,choice))!.id}:event?{type:'acknowledge' as const,resultId:event.id}:before.annual?{type:'resume' as const}:{type:'health-routine' as const,routine:{...before.people[before.activePersonId].health.routine,mindfulness:true}};
    const next=resolveCommand(before,command,true);
    sqlite.exec("CREATE TRIGGER fail_v5 BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'controlled v5 failure'); END");
    await expect(repo.commit(next,before.revision,'v5-retry')).rejects.toThrow('controlled v5 failure');
    expect(await repo.load(before.id)).toEqual(before);
    sqlite.exec('DROP TRIGGER fail_v5');expect(await repo.commit(next,before.revision,'v5-retry')).toEqual(next);
    expect(await repo.commit(next,before.revision,'v5-retry')).toEqual(next);
    sqlite.close();({sqlite,driver}=diskDatabase(file));repo=new SaveRepository(driver);await repo.initialise();
    expect(await repo.load(before.id)).toEqual(next);expect(await repo.recoveryPreview(before.id)).toEqual(before);
    const exported=decodeSave(await repo.export(before.id));expect(exported.world).toEqual(next);expect(exported.snapshots).toHaveLength(1);
    const branch=await repo.restoreBranch(before.id,snapshots[0].id,next.revision,'life_v5_independent','v5-branch');
    expect(branch.journal).toEqual(before.journal);expect(branch.ledger).toEqual(before.ledger);expect(await repo.load(before.id)).toEqual(next);
  } finally {sqlite.close();rmSync(folder,{recursive:true,force:true});}
},120000);
