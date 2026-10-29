import { bindEvent, eventTemplates } from '../../src/game/content/events';
import { resolveCommand } from '../../src/game/engine';
import { copyWorld, encodeWorld, fullName, validateWorld } from '../../src/game/model';
import { nextPending, offerPending } from '../../src/game/pendingQueue';
import { pendingSchema } from '../../src/game/runtime';
import { storyParticipants } from '../../src/game/storyNames';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { pupil } from '../support/pupil';
import cohort from '../fixtures/story-name-collision-cohort.json';

function project() {
  const record = cohort.records.find(row => row.decisionPointer === 'IT/result.json#/decisions/9')!;
  const world = unpackCheckpoint(record.checkpoint);
  const event = bindEvent(world,eventTemplates.find(row => row.id === 'teen-group-project-credit')!);
  return { world,event };
}

test('fresh names carry explicit roles even when identical; bound labels and chosen-result labels survive checkpoint reload unchanged',()=>{
  const { world,event } = project(), before = encodeWorld(world);
  expect(event.participants).toEqual(expect.arrayContaining([
    expect.objectContaining({name:'Leonardo Ferrari',role:'classmate'}),
    expect.objectContaining({name:'Leonardo Ferrari',role:'teacher'}),
  ]));
  expect(new Set(event.participants!.map(row=>row.personId)).size).toBe(event.participants!.length);
  expect(event.participants!.every(row=>row.personId!==world.activePersonId)).toBe(true);
  expect(encodeWorld(world)).toBe(before);
  const offered = copyWorld(world); offered.pending = event;
  const frozen = structuredClone(event.participants);
  // A later name/relationship change cannot rewrite already-bound scene copy.
  offered.people[event.participants![0].personId].firstName = 'Renamed';
  const cold = unpackCheckpoint(packCheckpoint(validateWorld(offered)));
  expect(cold.pending?.participants).toEqual(frozen);
  const result = resolveCommand(cold,{type:'choose',eventId:event.id,choiceId:'interrupt'});
  expect(result.pending?.kind).toBe('result'); expect(result.pending?.participants).toEqual(frozen);
  expect(unpackCheckpoint(packCheckpoint(result)).pending?.participants).toEqual(frozen);
  expect(result.random).toEqual(cold.random);
});

test('new offers label only their own contacts and never retrofit a saved scene moving through the deferred queue',()=>{
  const { world,event } = project(), historical = structuredClone(world.pending);
  expect(historical).not.toHaveProperty('participants');
  const fresh = structuredClone(event); delete fresh.participants;
  offerPending(world,fresh,50);
  expect(world.pending?.participants).toEqual(event.participants);
  expect(world.deferred.find(row=>row.event.id===historical!.id)?.event).toEqual(historical);
  world.pending = null; world.pendingPriority = 0;
  expect(nextPending(world)).toBe(true); expect(world.pending).toEqual(historical);
  expect(world.pending).not.toHaveProperty('participants');
});

test('family labels use actual saved direction, adoption and guardianship; literal names and multiple roles remain literal',()=>{
  const world = pupil(), relation = world.relationships.find(row=>row.to===world.activePersonId&&row.roles.includes('parent'))!;
  const parent = world.people[relation.from]; parent.gender = 'female';
  parent.firstName = 'A$& "{teacher}"'; parent.lastName = 'Example';
  expect(storyParticipants(world,[world.activePersonId,parent.id,parent.id,'missing'])).toEqual([
    {personId:parent.id,name:fullName(parent),role:'mother'},
  ]);
  relation.parentType = 'adoptive';
  expect(storyParticipants(world,[parent.id],{[parent.id]:'teacher'})[0]).toMatchObject({name:'A$& "{teacher}" Example',role:'adoptive mother / teacher'});
  relation.parentType = 'guardian';
  expect(storyParticipants(world,[parent.id])[0].role).toBe('guardian');
  relation.parentType = 'adoptive'; const childId = world.activePersonId; world.activePersonId = parent.id;
  world.people[childId].gender = 'nonbinary';
  expect(storyParticipants(world,[childId])[0].role).toBe('adopted child');
  relation.parentType = 'guardian'; expect(storyParticipants(world,[childId])[0].role).toBe('child in your care');
});

test('an immediate targeted action freezes its actual contact role without rewriting result copy or randomness',()=>{
  const initial = pupil('US',7), parentId = initial.relationships.find(row=>row.to===initial.activePersonId&&row.roles.includes('parent'))!.from;
  const expected = storyParticipants(initial,[parentId]), before = encodeWorld(initial);
  const result = resolveCommand(initial,{type:'interact',personId:parentId,action:'compliment'});
  expect(result.pending).toMatchObject({kind:'result',participants:expected});
  expect(result.pending!.body).toContain(initial.people[parentId].firstName);
  expect(unpackCheckpoint(packCheckpoint(result)).pending).toEqual(result.pending);
  expect(encodeWorld(initial)).toBe(before);
  const acknowledged = resolveCommand(result,{type:'acknowledge',resultId:result.pending!.id});
  expect(acknowledged.people).toEqual(result.people);expect(acknowledged.random).toEqual(result.random);
});

test('manual introduction decisions label all their new contacts and preserve them in the chosen result',()=>{
  const initial = pupil('US',7), offered = resolveCommand(initial,{type:'meet-people',purpose:'friend',gender:'any'});
  if(offered.pending?.kind!=='decision')throw new Error('Expected a new introduction');
  expect(offered.pending.participants).toHaveLength(3);
  expect(offered.pending.participants!.every(row=>row.role==='new acquaintance')).toBe(true);
  const result = resolveCommand(offered,{type:'choose',eventId:offered.pending.id,choiceId:offered.pending.choices[0].id});
  expect(result.pending?.participants).toEqual(offered.pending.participants);
  expect(result.random).toEqual(offered.random);
});

test('participant metadata is optional for old saves and bounded for new scenes',()=>{
  const { event } = project(), old = structuredClone(event); delete old.participants;
  expect(pendingSchema.parse(old)).not.toHaveProperty('participants');
  const row = event.participants![0];
  for(const participants of [[],[{...row,personId:''}],[{...row,name:''}],[{...row,role:''}],Array.from({length:13},()=>row)]) {
    expect(pendingSchema.safeParse({...event,participants}).success).toBe(false);
  }
});
