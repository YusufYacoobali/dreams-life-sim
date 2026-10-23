import { activeCult } from '../game/systems/cultSchemas';
import type { World } from '../game/model';
import { countries } from '../game/countries';
import { jobs } from '../game/content/jobs';
import { isConfined } from '../game/systems/legalSchemas';
import { relationFor, relationLabel } from '../game/systems/relationships';

const equivalent = (a:string,b:string) => a.trim().toLocaleLowerCase().replace(/^your\s+/,'')===b.trim().toLocaleLowerCase().replace(/^your\s+/,'');

/** Saved relationship first; employment adds information rather than repeating it. */
export function personProfileDisplay(world:World,personId:string) {
  const person=world.people[personId];if(!person)return;
  const relation=relationFor(world,world.activePersonId,personId),role=relation&&relationLabel(world,relation);
  const employment=person.employment;
  const title=isConfined(world,person)?'In custody':activeCult(world,personId)?'Cult Leader':employment?jobs.find(job=>job.id===employment.roleId)?.title??'Employed'
    :person.education.stage!=='none'?person.education.school||'Student':person.finance.pensionAnnual>0n?'Retired':'No current occupation';
  const employer=!isConfined(world,person)&&employment?.employer?.trim();
  const occupation=role&&equivalent(role,title)?(employer&&!equivalent(role,employer)?employer:undefined):title;
  return {role,occupation,location:person.city+', '+countries[person.country].name};
}
