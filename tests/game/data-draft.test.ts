import { arrayChange, createDataDraft } from '../../src/game/dataDraft';
import { createLife, randomCreation } from '../../src/game/createLife';
import { copyWorld, encodeWorld, immutableWorld, validateWorld } from '../../src/game/model';
import { resolveCommand, resolveCommandUsingDraft, type GameCommand } from '../../src/game/engine';
import { packCheckpoint } from '../../src/persistence/checkpoints';
import { choiceUnavailable } from '../../src/game/choiceAvailability';

test('nested edits, deletes, enumeration, BigInt, arrays and aliases leave the frozen source intact', () => {
  const inner=Object.freeze({money:4n,label:'old'}), rows=Object.freeze([inner,Object.freeze({money:2n,label:'other'})]);
  const source=Object.freeze({rows,stable:Object.freeze({yes:true}),record:Object.freeze({first:1,second:2})});
  const tx=createDataDraft(source), draft=tx.draft as any;
  draft.rows[0].money+=3n; draft.rows.push({money:1n,label:'new'});
  draft.record.third=draft.record.first; delete draft.record.first; draft.record.first=1;
  const next=tx.finish();
  expect(next.rows[0].money).toBe(7n); expect(source.rows[0].money).toBe(4n);
  expect(next.rows[1]).toBe(source.rows[1]); expect(next.stable).toBe(source.stable);
  expect(Object.keys(next.record)).toEqual(['second','third','first']);
  expect(Object.isFrozen(next.rows[0])).toBe(true); expect(arrayChange(next.rows)?.appendOnly).toBe(false);
  expect(()=>draft.rows).toThrow(); expect(()=>tx.finish()).toThrow();
});

test('append certificates reject edits, nested mutations, deletion, truncation, reorder and replaced arrays', () => {
  const source=Object.freeze({rows:Object.freeze([Object.freeze({id:1}),Object.freeze({id:2})])});
  const append=createDataDraft(source); (append.draft.rows as any).push({id:3}); const result=append.finish();
  expect(arrayChange(result.rows)).toMatchObject({base:source.rows,appendOnly:true});
  for (const mutate of [(d:any)=>d.rows[0].id++, (d:any)=>d.rows.reverse(), (d:any)=>{delete d.rows[0];}, (d:any)=>{d.rows.length=0;}]) {
    const tx=createDataDraft(source); mutate(tx.draft); expect(arrayChange(tx.finish().rows)?.appendOnly).toBe(false);
  }
  const replaced=createDataDraft(source); (replaced.draft as any).rows=[...replaced.draft.rows,{id:3}];
  expect(arrayChange(replaced.finish().rows)).toBeUndefined();
});

test('assigned containers cannot leak live proxies or retain mutable command references', () => {
  const source=Object.freeze({rows:Object.freeze([Object.freeze({id:1}),Object.freeze({id:2})])});
  const input={id:3}, tx=createDataDraft(source), draft=tx.draft as any;
  draft.rows=[...draft.rows,input]; draft.rows[0].id=7;
  const next=tx.finish(); input.id=99;
  expect(next.rows).toEqual([{id:7},{id:2},{id:3}]); expect(source.rows[0].id).toBe(1);
  expect(JSON.stringify(next)).toBe('{"rows":[{"id":7},{"id":2},{"id":3}]}');
});

test('failed transactions revoke retained drafts without touching the source', () => {
  const source=Object.freeze({nested:Object.freeze({value:1})}), tx=createDataDraft(source), retained=tx.draft.nested;
  (retained as any).value=2; tx.discard(); expect(source.nested.value).toBe(1); expect(()=>retained.value).toThrow();
});

test('real multi-month commands match the copy engine, canonical worlds, RNG and checkpoint bytes after every command', () => {
  const raw=createLife('life_draft_comparison',42,randomCreation(42),{year:2026,month:11,day:14}); raw.birthAcknowledged=true;
  let reference=immutableWorld(raw), candidate=reference;
  const act=(command:GameCommand)=>{
    const previous=candidate, original=encodeWorld(candidate);
    reference=resolveCommand(reference,command,true); candidate=resolveCommandUsingDraft(candidate,command,true);
    expect(encodeWorld(candidate)).toBe(encodeWorld(reference)); expect(candidate.random).toEqual(reference.random);
    expect(packCheckpoint(candidate)).toBe(packCheckpoint(reference)); expect(encodeWorld(validateWorld(candidate))).toBe(encodeWorld(candidate));
    expect(encodeWorld(previous)).toBe(original);
  };
  for(let year=0;year<12;year++) {
    act({type:'advance'}); let guard=0;
    while((candidate.pending||candidate.annual)&&guard++<100) {
      const event=candidate.pending;
      act(event?.kind==='decision'?{type:'choose',eventId:event.id,choiceId:event.choices.find(choice=>!choiceUnavailable(candidate,choice))!.id}:event?{type:'acknowledge',resultId:event.id}:{type:'resume'});
    }
    expect(guard).toBeLessThan(100);
  }
  const before=encodeWorld(candidate);
  expect(()=>resolveCommandUsingDraft(candidate,{type:'choose',eventId:'missing',choiceId:'missing'},true)).toThrow();
  expect(encodeWorld(candidate)).toBe(before);
  const edited=copyWorld(candidate); edited.accounts[0].cash+=1n; expect(()=>validateWorld(edited,true)).toThrow();
},120000);
