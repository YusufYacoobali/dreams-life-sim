import { decodeWorld, validateWorld } from '../../src/game/model';
import { createContact } from '../../src/game/systems/npcs';
import graduate from '../fixtures/v3-employed-graduate.json';

/** Explicit, valid saved-role fixtures; both people have real employment rows. */
export function personProfilePolishFixture(role:'Teacher'|'Father'='Teacher') {
  const world=decodeWorld(JSON.stringify(graduate));
  const teacher=createContact(world,{age:55,gender:'male',qualifiedRole:'teacher'});
  const actor=createContact(world,{age:25,city:teacher.city});world.activePersonId=actor.id;
  world.relationships.push({id:'relation_profile_polish',from:teacher.id,to:actor.id,kind:role==='Father'?'parent':'teacher',
    roles:role==='Father'?['parent']:['teacher'],romance:'none',since:{...world.date},parentType:role==='Father'?'biological':null,
    strength:85,trust:80,memories:[],lastInteractionYear:world.date.year});
  return {world:validateWorld(world),personId:teacher.id};
}
