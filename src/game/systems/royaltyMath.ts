import type { World } from '../model';
import { ageOn } from '../model';
import { visibleConvictions } from './legal';
import type { RoyalRole } from '../content/royalty';
export type RoyalHouse=World['royalHouses'][number];
const compare=(a:World['date'],b:World['date'])=>a.year-b.year||a.month-b.month||a.day-b.day;
/** Absolute birth-order descent through actual recognised parent links. */
export function royalLine(world:World,house:RoyalHouse):string[]{
 const members=new Set(house.members.filter(item=>item.hereditary).map(item=>item.personId)),visited=new Set<string>(),line:string[]=[],childrenByParent=new Map<string,string[]>();
 for(const edge of world.relationships.filter(item=>item.roles.includes('parent'))){const children=childrenByParent.get(edge.from)??[];children.push(edge.to);childrenByParent.set(edge.from,children);}
 const visit=(id:string)=>{if(visited.has(id))return;visited.add(id);if(members.has(id))line.push(id);const children=(childrenByParent.get(id)??[]).map(id=>world.people[id]).sort((a,b)=>compare(a.born,b.born)||a.id.localeCompare(b.id));for(const child of children)visit(child.id);};visit(house.founderId);return line;
}
export function royalEligible(world:World,house:RoyalHouse,id:string,member=house.members.find(item=>item.personId===id)){const person=world.people[id];return !!person&&!person.died&&!!member&&member.status==='active'&&member.hereditary&&!visibleConvictions(world,person).length&&!world.incidents.some(item=>item.personId===id&&item.victimKilled&&house.successions.some(change=>change.toId===item.victimId));}
export function royalSuccession(world:World,house:RoyalHouse){const members=new Map(house.members.map(item=>[item.personId,item]));return royalLine(world,house).filter(id=>id!==house.headId&&royalEligible(world,house,id,members.get(id)));}
export function royalRole(world:World,house:RoyalHouse,personId:string,knownHeirId?:string|null):RoyalRole{const person=world.people[personId];if(ageOn(person,world.date)<18)return 'child';if(house.headId===personId)return 'head';if(house.regentId===personId)return 'regent';if((knownHeirId===undefined?royalSuccession(world,house)[0]:knownHeirId)===personId)return 'heir';return 'family';}
export function royalTitle(world:World,house:RoyalHouse,personId:string){const member=house.members.find(item=>item.personId===personId),person=world.people[personId];if(!member)return 'No royal title';if(member.status==='renounced')return 'Title renounced';if(member.status==='left')return 'Former royal family member';if(member.status==='deceased'&&house.successions.some(item=>item.toId===personId))return 'Former Sovereign';if(house.headId===personId)return 'Sovereign';if(house.regentId===personId)return 'Regent';if(world.marriages.some(item=>!item.ended&&(item.a===personId&&item.b===house.headId||item.b===personId&&item.a===house.headId)))return 'Royal Consort';return member.hereditary?(person.gender==='female'?'Princess':person.gender==='male'?'Prince':'Royal Family Member'):'Royal Family Member';}
