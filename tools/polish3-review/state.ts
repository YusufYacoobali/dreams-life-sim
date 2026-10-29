import { useSyncExternalStore } from 'react';
import { decodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { createContact } from '../../src/game/systems/npcs';
import { accountFor } from '../../src/game/systems/common';
import { randomInteger } from '../../src/game/random';
import graduate from '../../tests/fixtures/v3-employed-graduate.json';

const query = new URLSearchParams(location.search);
export const reviewScreen = query.get('screen') || 'assets';
export const reviewParams: Record<string,string> = {
  kind:query.get('kind') || 'property',id:query.get('id') || 'studio',
  ...(query.get('method') ? {method:query.get('method')!} : {}),
};
let world = decodeWorld(JSON.stringify(graduate));
const originalRandom = {...world.random};
const listeners = new Set<()=>void>();
const publish = () => listeners.forEach(listener=>listener());
export const galleryPeople: {id:string;gender:string;age:number}[] = [];
if(reviewScreen==='portraits') {
  for(const gender of ['male','female','nonbinary'] as const) {
    const count=gender==='nonbinary'?12:50;
    for(let i=0;i<count;i++) {
      const age=[0,3,8,16,28,52,80][i%7];
      const person=createContact(world,{age,gender});
      galleryPeople.push({id:person.id,gender,age});
    }
  }
}
if(reviewScreen==='person'||reviewScreen==='support') {
  const role=query.get('role') || 'teacher';
  const person=createContact(world,{age:role==='child'?3:45,gender:role==='father'?'male':'female',...(['teacher','father'].includes(role)?{qualifiedRole:'teacher'}:{})});
  world.relationships.push({id:'relation_polish3_review',from:role==='father'||role==='teacher'?person.id:world.activePersonId,to:role==='father'||role==='teacher'?world.activePersonId:person.id,
    kind:role==='father'||role==='child'?'parent':role==='spouse'?'partner':role==='teacher'?'teacher':'friend',
    roles:[role==='father'||role==='child'?'parent':role==='spouse'?'partner':role==='teacher'?'teacher':'friend'],
    romance:role==='spouse'?'married':'none',since:{...world.date},parentType:role==='father'||role==='child'?'biological':null,
    strength:90,trust:90,memories:[],lastInteractionYear:world.date.year});
  reviewParams.id=person.id;
  if(role==='spouse')world.marriages.push({id:'marriage_polish3_review',a:world.activePersonId,b:person.id,started:{...world.date},ended:null,endReason:null,
    baselineA:{minor:0n,currency:accountFor(world).currency},baselineB:{minor:0n,currency:accountFor(world,person).currency},ledgerStart:world.ledger.length,weddingCost:null,excludedA:0n,excludedB:0n});
  if(reviewScreen==='support') {
    person.traits=['kind'];
    const account=accountFor(world,person);account.cash+=10000000n;account.openingCash+=10000000n;
    for(let seed=1;seed<100000;seed++)if(randomInteger(seed,1,100).value===10){world.random.outcomes=seed;break;}
    const variant=query.get('variant')||'money';
    world=resolveCommand(world,{type:'ask-person-support',lifeId:world.id,actorId:world.activePersonId,personId:person.id,
      kind:variant==='money'?'money':'loan',amount:50000n,currency:account.currency});
    if(variant==='accepted'){
      if(world.pending?.kind==='result')world=resolveCommand(world,{type:'acknowledge',resultId:world.pending.id});
      world=resolveCommand(world,{type:'respond-person-loan',lifeId:world.id,actorId:world.activePersonId,
        requestId:world.personSupportRequests.at(-1)!.id,accept:true});
    }
  }
}
world=validateWorld(world);
const state:any={world,busy:false,error:null,clearError(){state.error=null;publish();},
  async dispatch(command:GameCommand){try{state.world=resolveCommand(state.world,command);state.error=null;publish();return true;}catch(error){state.error=String(error instanceof Error?error.message:error);publish();return false;}},
};
function select<T>(selector:(state:any)=>T):T {
  const snapshot=useSyncExternalStore(callback=>{listeners.add(callback);return()=>listeners.delete(callback);},()=>state.world);
  return selector({...state,world:snapshot});
}
export const useGame=Object.assign(select,{getState:()=>state,setState(next:any){Object.assign(state,next);publish();}});
export function reviewWorld():World{return state.world;}
(window as any).polish3={world:()=>state.world,initialRandom:originalRandom,galleryPeople,dispatch:state.dispatch};
