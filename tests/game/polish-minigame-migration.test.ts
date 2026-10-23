import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { assetCatalog } from '../../src/game/content/assets';
import { accountFor } from '../../src/game/systems/common';
import { rentalQuote } from '../../src/game/systems/rentalHomes';
import { createContact } from '../../src/game/systems/npcs';
import { randomInteger } from '../../src/game/random';
import { keeperPosition } from '../../src/minigames/sports/sportsLogic';
import { targetAngle } from '../../src/minigames/crime/crimeLogic';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { athleteFixture, miniGameFixture, nextMatchPeriod, startMiniGame } from '../support/miniGames';
import graduate from '../fixtures/v3-employed-graduate.json';

const markers = { schemaVersion:45, engineVersion:47, contentVersion:24 };
const rawWorld = (world:World):Record<string,any> => JSON.parse(encodeWorld(world));
const acknowledge = (world:World) => world.pending?.kind==='result'
  ? resolveCommand(world,{type:'acknowledge',resultId:world.pending.id}) : world;

function gameWorld(state:'empty'|'active'|'completed'|'applied') {
  const initial=athleteFixture();
  if(state==='empty')return initial;
  let world=startMiniGame(initial,'sports');
  const session=world.miniGames[0],keeper=keeperPosition(0,session.seed,session.difficulty);
  world=resolveCommand(world,{type:'mini-game-input',sessionId:session.id,index:0,
    input:{at:1500,action:{type:'shot',x:keeper<.5?.88:.12,y:.14,power:.78}}});
  if(state==='active')return world;
  world=resolveCommand(world,{type:'mini-game-complete',sessionId:session.id});
  return state==='applied'?nextMatchPeriod(world):world;
}

function leasedWorld() {
  const world=decodeWorld(JSON.stringify(graduate)),account=accountFor(world);
  // Explicit fixture capital covers a real lease through the ordinary command.
  account.cash+=100000000n;account.openingCash+=100000000n;
  const home=assetCatalog.find(row=>row.id==='studio')!;
  return acknowledge(resolveCommand(world,{type:'sign-home-lease',catalogId:home.id,quotedRent:rentalQuote(world,home).monthlyRent}));
}

function supportAndLeaseWorld() {
  let world=leasedWorld();
  const actor=world.people[world.activePersonId],target=createContact(world,{age:30,city:actor.city});
  target.traits=['kind'];
  world.relationships.push({id:'relation_variant_support',from:actor.id,to:target.id,kind:'friend',roles:['friend'],romance:'none',
    since:{...world.date},parentType:null,strength:95,trust:95,memories:[],lastInteractionYear:world.date.year});
  for(let seed=1;seed<100000;seed++)if(randomInteger(seed,1,100).value===10){world.random.outcomes=seed;break;}
  world=acknowledge(resolveCommand(validateWorld(world),{type:'ask-person-support',lifeId:world.id,actorId:world.activePersonId,
    personId:target.id,kind:'loan',amount:1000n,currency:accountFor(world,target).currency}));
  // A normal interaction also supplies a nonempty action history to preserve.
  return acknowledge(resolveCommand(world,{type:'person-action',lifeId:world.id,actorId:world.activePersonId,personId:target.id,action:'distance'}));
}

test.each(['empty','active','completed','applied'] as const)('published 42/44/content20 preserves its literal %s mini-game history',state=>{
  const original=gameWorld(state),raw=rawWorld(original);
  // These are arranged published envelopes around normal, validated sessions.
  // The independent mini-game reader had none of the polish histories.
  Object.assign(raw,{schemaVersion:42,engineVersion:44,contentVersion:20});
  delete raw.rentalLeases;delete raw.personSupportRequests;delete raw.personActionHistory;
  const before=JSON.stringify(raw),restored=decodeWorld(before,true);
  expect(rawWorld(restored)).toEqual({...raw,...markers,rentalLeases:[],personSupportRequests:[],personActionHistory:[]});
  expect(JSON.stringify(restored.miniGames)).toBe(JSON.stringify(original.miniGames));
  expect(restored.random).toEqual(original.random);expect(restored.actionCounts).toEqual(original.actionCounts);
  expect(restored.pending).toEqual(original.pending);expect(restored.ledger).toEqual(original.ledger);
  expect(JSON.stringify(raw)).toBe(before);
  if(state!=='empty')expect(restored.miniGames[0].inputs).toHaveLength(1);
  if(state==='completed'||state==='applied')expect(restored.miniGames[0].score).not.toBeNull();
  if(state==='applied')expect(restored.miniGames[0].appliedMonth).not.toBeNull();
  expect(unpackCheckpoint(packCheckpoint(restored),true)).toEqual(restored);
});

function publishedBurglary(world:World) {
  const raw=rawWorld(world);Object.assign(raw,{schemaVersion:42,engineVersion:44,contentVersion:20});
  delete raw.rentalLeases;delete raw.personSupportRequests;delete raw.personActionHistory;
  return decodeWorld(JSON.stringify(raw),true);
}

test('an active published burglary keeps its input and yearly reservation, then forfeits exactly once after migration',()=>{
  let active=startMiniGame(miniGameFixture(),'crime');
  const id=active.miniGames[0].id,seed=active.miniGames[0].seed;
  active=resolveCommand(active,{type:'mini-game-input',sessionId:id,index:0,input:{at:0,action:{type:'lock',angle:targetAngle(seed,0)}}});
  const key=active.activePersonId+':legal:'+active.date.year+':crime:burglary',migrated=publishedBurglary(active);
  expect(migrated.actionCounts[key]).toBe(1);expect(migrated.miniGames).toEqual(active.miniGames);
  expect(migrated.random).toEqual(active.random);expect(migrated.incidents).toHaveLength(0);
  const forfeited=resolveCommand(migrated,{type:'mini-game-forfeit',sessionId:id}),session=forfeited.miniGames[0];
  expect(session).toMatchObject({id,seed,status:'forfeited',score:0,appliedMonth:active.date.year*12+active.date.month-1});
  expect(session.inputs).toEqual(active.miniGames[0].inputs);expect(forfeited.actionCounts[key]).toBe(1);
  expect(forfeited.incidents).toHaveLength(1);expect(forfeited.incidents[0]).toMatchObject({offence:'burglary',personId:active.activePersonId,gain:{minor:0n}});
  const cold=decodeWorld(encodeWorld(forfeited),true),before=encodeWorld(cold);
  expect(()=>resolveCommand(cold,{type:'mini-game-forfeit',sessionId:id})).toThrow();
  expect(()=>resolveCommand(cold,{type:'mini-game-complete',sessionId:id})).toThrow();
  expect(encodeWorld(cold)).toBe(before);expect(cold.incidents).toHaveLength(1);
});

test('a completed published burglary retains its score, paid proceeds and applied incident without settling again',()=>{
  let world=startMiniGame(miniGameFixture(),'crime');
  const id=world.miniGames[0].id,seed=world.miniGames[0].seed;
  for(let index=0;index<3;index++)world=resolveCommand(world,{type:'mini-game-input',sessionId:id,index,
    input:{at:index*1000,action:{type:'lock',angle:targetAngle(seed,index)}}});
  const completed=resolveCommand(world,{type:'mini-game-complete',sessionId:id}),migrated=publishedBurglary(completed);
  expect(migrated.miniGames).toEqual(completed.miniGames);expect(migrated.miniGames[0]).toMatchObject({score:100,status:'completed',appliedMonth:world.date.year*12+world.date.month-1});
  expect(migrated.incidents).toEqual(completed.incidents);expect(migrated.incidents).toHaveLength(1);
  expect(migrated.accounts).toEqual(completed.accounts);expect(migrated.ledger).toEqual(completed.ledger);
  expect(migrated.random).toEqual(completed.random);expect(migrated.actionCounts).toEqual(completed.actionCounts);
  const cold=unpackCheckpoint(packCheckpoint(migrated),true),before=encodeWorld(cold);
  expect(cold).toEqual(migrated);
  expect(()=>resolveCommand(cold,{type:'mini-game-complete',sessionId:id})).toThrow();
  expect(()=>resolveCommand(cold,{type:'mini-game-forfeit',sessionId:id})).toThrow();
  expect(encodeWorld(cold)).toBe(before);
});

test('own 42/44/content21 keeps earned leases and adds only empty support/actions and mini-games',()=>{
  const original=leasedWorld(),raw=rawWorld(original);
  Object.assign(raw,{schemaVersion:42,engineVersion:44,contentVersion:21});
  delete raw.miniGames;delete raw.personSupportRequests;delete raw.personActionHistory;
  const before=JSON.stringify(raw),restored=decodeWorld(before,true);
  expect(original.rentalLeases).toHaveLength(1);
  expect(rawWorld(restored)).toEqual({...raw,...markers,miniGames:[],personSupportRequests:[],personActionHistory:[]});
  expect(restored.rentalLeases).toEqual(original.rentalLeases);expect(restored.ledger).toEqual(original.ledger);
  expect(restored.random).toEqual(original.random);expect(JSON.stringify(raw)).toBe(before);
});

test('own 43/45/content22 preserves saved loan offers, actions and lease payments while adding only empty mini-games',()=>{
  const original=supportAndLeaseWorld(),raw=rawWorld(original);
  Object.assign(raw,{schemaVersion:43,engineVersion:45,contentVersion:22});delete raw.miniGames;
  const before=JSON.stringify(raw),restored=decodeWorld(before,true);
  expect(original.rentalLeases).toHaveLength(1);expect(original.personActionHistory).toHaveLength(1);
  expect(original.personSupportRequests[0]).toMatchObject({outcome:'loan-offered',status:'offered'});
  expect(rawWorld(restored)).toEqual({...raw,...markers,miniGames:[]});
  expect(restored.random).toEqual(original.random);expect(restored.ledger).toEqual(original.ledger);
  expect(JSON.stringify(raw)).toBe(before);
  // The preserved offer remains actionable after migration, with consent still
  // required before creating exactly one creditor-backed liability.
  const request=restored.personSupportRequests[0];
  const accepted=resolveCommand(restored,{type:'respond-person-loan',lifeId:restored.id,actorId:restored.activePersonId,requestId:request.id,accept:true});
  expect(accepted.personSupportRequests[0].status).toBe('accepted');
  expect(accepted.liabilities.find(row=>row.id===accepted.personSupportRequests[0].liabilityId)).toMatchObject({creditorId:request.targetId,principal:request.offered});
});

test.each(['empty','active','completed','applied'] as const)('own 44/46/content23 gains only current markers and preserves its %s session',state=>{
  const raw=rawWorld(gameWorld(state));Object.assign(raw,{schemaVersion:44,engineVersion:46,contentVersion:23});
  const before=JSON.stringify(raw),restored=decodeWorld(before,true);
  expect(rawWorld(restored)).toEqual({...raw,...markers});
  expect(JSON.stringify(raw)).toBe(before);
  expect(unpackCheckpoint(packCheckpoint(restored),true)).toEqual(restored);
});

test('own 44/46/content23 retains nonempty support, action and lease histories without rebinding them',()=>{
  const raw=rawWorld(supportAndLeaseWorld());Object.assign(raw,{schemaVersion:44,engineVersion:46,contentVersion:23});
  const before=JSON.stringify(raw),restored=decodeWorld(before,true);
  expect(raw.personSupportRequests).toHaveLength(1);expect(raw.personActionHistory).toHaveLength(1);expect(raw.rentalLeases).toHaveLength(1);
  expect(rawWorld(restored)).toEqual({...raw,...markers});expect(JSON.stringify(raw)).toBe(before);
});

test.each(['miniGames','rentalLeases','personSupportRequests','personActionHistory'] as const)('current 45/47/content24 rejects a missing required %s history',key=>{
  const raw=rawWorld(decodeWorld(JSON.stringify(graduate)));delete raw[key];
  expect(()=>decodeWorld(JSON.stringify(raw))).toThrow();
});

test.each(['missing','null','object'] as const)('published 42/44/content20 rejects %s mini-game history instead of taking the rental migration',kind=>{
  const raw=rawWorld(gameWorld('empty'));Object.assign(raw,{schemaVersion:42,engineVersion:44,contentVersion:20});
  delete raw.rentalLeases;delete raw.personSupportRequests;delete raw.personActionHistory;
  if(kind==='missing')delete raw.miniGames;else raw.miniGames=kind==='null'?null:{};
  expect(()=>decodeWorld(JSON.stringify(raw))).toThrow(/Mini-game save is missing its session history/);
});
