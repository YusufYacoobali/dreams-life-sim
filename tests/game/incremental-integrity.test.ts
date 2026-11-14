import { createDataDraft } from '../../src/game/dataDraft';
import { createIntegrityChecks } from '../../src/game/integrityChecks';
import { copyWorld, decodeWorld, encodeWorld, journalAppendStart, validateWorld, type World } from '../../src/game/model';
import { post } from '../../src/game/systems/common';
import graduate from '../fixtures/v3-employed-graduate.json';

test('validator reuse requires identical read dependencies, presence, enumeration and supplied ledger', () => {
  let calls=0;
  const first:{branch:Readonly<{value:number}>;other:number;ledger:readonly number[]}={branch:Object.freeze({value:1}),other:1,ledger:Object.freeze([])};
  const validate=(world:typeof first)=>{calls++;return world.branch.value;};
  const initial=createIntegrityChecks(first); expect(initial.run(validate)).toBe(1);
  const unchanged=createIntegrityChecks({...first,other:2},initial.records); unchanged.run(validate); expect(calls).toBe(1);
  const changed=createIntegrityChecks({...first,branch:Object.freeze({value:2})},unchanged.records); expect(changed.run(validate)).toBe(2); expect(calls).toBe(2);
  const readsKeys=(world:typeof first)=>Object.keys(world).join(','); initial.run(readsKeys);
  expect(createIntegrityChecks({...first,added:true},initial.records).run(readsKeys)).toContain('added');
  const ledgerCheck=(_world:typeof first,_ledger:object)=>++calls; initial.run(ledgerCheck,{});
  createIntegrityChecks({...first,ledger:Object.freeze([1])},initial.records).run(ledgerCheck,{}); expect(calls).toBe(4);
});

const saved=()=>decodeWorld(JSON.stringify(graduate),true);
test.each(['duplicate','missing-person','future-date','old-person-removed','changed-birthday','backwards-time','old-row-edit','reorder','wrong-field'] as const)('%s cannot borrow incremental journal or ledger integrity',kind=>{
  const before=saved(), original=encodeWorld(before), tx=createDataDraft(before), world=tx.draft;
  if(kind==='duplicate') world.journal.push({...world.journal[0]});
  if(kind==='missing-person') world.journal.push({...world.journal[0],id:'new-fact',personId:'person_missing'});
  if(kind==='future-date') world.journal.push({...world.journal[0],id:'new-fact',date:{...world.date,year:world.date.year+1}});
  if(kind==='old-person-removed') delete world.people[world.journal[0].personId];
  if(kind==='changed-birthday') world.people[world.journal[0].personId].born={...world.date,year:world.date.year+1};
  if(kind==='backwards-time') world.date={...world.date,year:world.date.year-20};
  if(kind==='old-row-edit') world.ledger[0].cashDelta+=1n;
  if(kind==='reorder') {world.ledger.reverse();world.ledger.push(world.ledger[0]);}
  if(kind==='wrong-field') world.journal=world.accounts as unknown as World['journal'];
  const finished=tx.finish();
  expect(()=>validateWorld(finished,true)).toThrow(); expect(()=>validateWorld(finished)).toThrow(); expect(encodeWorld(before)).toBe(original);
});

test('certified append proofs cover skipped publications and distinguish divergent branches without old-array chains',()=>{
  const before=saved();
  const append=(world:World,id:string)=>{const tx=createDataDraft(world);tx.draft.journal.push({id,personId:world.activePersonId,date:{...world.date},text:id,category:'test'});return validateWorld(tx.finish(),true);};
  const first=append(before,'first'),second=append(first,'second'),branch=append(before,'branch');
  expect(journalAppendStart(before.journal,second.journal)).toBe(before.journal.length);
  expect(journalAppendStart(first.journal,second.journal)).toBe(first.journal.length);
  expect(journalAppendStart(first.journal,branch.journal)).toBeUndefined();
  const mutable=copyWorld(second);mutable.journal[0].text='Edited historical fact';
  const edited=validateWorld(mutable,true); expect(journalAppendStart(second.journal,edited.journal)).toBeUndefined();
  const tx=createDataDraft(before);post(tx.draft,25n,0n,'test','Append');
  const next=validateWorld(tx.finish(),true);expect(encodeWorld(next)).toBe(encodeWorld(validateWorld(next)));
});
