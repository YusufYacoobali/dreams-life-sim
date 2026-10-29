import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { encodeWorld, validateWorld } from '../../src/game/model';
import { rules } from '../../src/game/rules';
import { educationMonth } from '../../src/game/systems/education';
import { schoolMonth } from '../../src/game/systems/school';
import { SaveRepository, type SqlDatabase, type SqlSession } from '../../src/persistence/repository';
import { createGameStore } from '../../src/state/gameStore';
import { pupil } from '../support/pupil';

test('both transition popups persist in order; failed acknowledgement rolls back and cold reopening delivers the second exactly once',async()=>{
  const initial = pupil(), person = initial.people[initial.activePersonId];
  const primarySchool = person.education.school;
  initial.date.year = person.born.year + rules.US.secondaryStart;
  educationMonth(initial,person); schoolMonth(initial); validateWorld(initial);
  expect(initial.pending).toMatchObject({kind:'result',title:'Primary school completed'});
  expect(initial.pending!.body).toContain(primarySchool);
  expect(initial.deferred.map(row=>row.event.title)).toEqual(['Secondary school starts']);
  const directory = mkdtempSync(join(tmpdir(),'dreams-school-milestones-')), path = join(directory,'life.db');
  let sqlite!: DatabaseSync;
  function connect(): SqlDatabase {
    const connection = sqlite = new DatabaseSync(path); connection.exec('PRAGMA foreign_keys=ON');
    const session: SqlSession = {
      run:async(sql,values=[])=>{connection.prepare(sql).run(...values);},
      get:async<T,>(sql:string,values:(string|number|null)[]=[])=>connection.prepare(sql).get(...values) as T ?? null,
      all:async<T,>(sql:string,values:(string|number|null)[]=[])=>connection.prepare(sql).all(...values) as T[],
    };
    return {...session,exec:async sql=>{connection.exec(sql);},transaction:async action=>{
      connection.exec('BEGIN IMMEDIATE');
      try{const value=await action(session);connection.exec('COMMIT');return value;}
      catch(error){connection.exec('ROLLBACK');throw error;}
    }};
  }
  let repository = new SaveRepository(connect());
  const rows = () => Object.fromEntries(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row=>[String(row.name),sqlite.prepare('SELECT * FROM '+row.name+' ORDER BY 1,2').all()]));
  const bootstrap = async()=>{
    const store=createGameStore({repository:async()=>repository,date:()=>initial.date,id:()=> 'unused'});
    expect(await store.getState().bootstrap()).toBe(true);return store;
  };
  try{
    await repository.initialise();await repository.create(initial);
    let store = await bootstrap();const before=encodeWorld(store.getState().world!), saved=rows();
    const ack={type:'acknowledge' as const,resultId:initial.pending!.id};
    sqlite.exec("CREATE TRIGGER fail_school_ack BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    expect(await store.getState().dispatch(ack)).toBe(false);
    expect(encodeWorld(store.getState().world!)).toBe(before);expect(rows()).toEqual(saved);
    sqlite.exec('DROP TRIGGER fail_school_ack');expect(await store.getState().dispatch(ack)).toBe(true);
    const second=store.getState().world!, secondRows=rows();
    expect(second.pending).toMatchObject({kind:'result',title:'Secondary school starts',illustration:'education'});
    expect(second.pending!.body).toContain(second.people[second.activePersonId].education.school);
    expect(second.deferred).toEqual([]);expect(second.random).toEqual(initial.random);
    sqlite.close();repository=new SaveRepository(connect());await repository.initialise();store=await bootstrap();
    expect(store.getState().world).toEqual(second);expect(rows()).toEqual(secondRows);
    const ackSecond={type:'acknowledge' as const,resultId:second.pending!.id};
    expect(await store.getState().dispatch(ackSecond)).toBe(true);
    expect(store.getState().world!.pending).toBeNull();const done=rows();
    expect(await store.getState().dispatch(ackSecond)).toBe(false);expect(rows()).toEqual(done);
    expect(store.getState().world!.people).toEqual(second.people);expect(store.getState().world!.random).toEqual(second.random);
  }finally{sqlite.close();rmSync(directory,{recursive:true,force:true});}
});
