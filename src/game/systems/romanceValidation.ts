import type { World } from '../model';
import { closeFamily } from './relationshipQueries';
import { compareDates } from '../personHelpers';
import { ageOn } from '../personHelpers';
import { rules } from '../rules';

/** Historical participants stay bound even after death, relocation or child continuation. */
export function validateRomance(world: World) {
  const affairIds=new Set<string>(), offerIds=new Set<string>();
  for (const row of world.affairs??[]) {
    if (affairIds.has(row.id)) throw new Error('Duplicate affair identity'); affairIds.add(row.id);
    const actor=world.people[row.actorId],partner=world.people[row.partnerId],lover=world.people[row.loverId], relation=world.relationships.find(r=>r.id===row.relationshipId);
    if (!actor || !partner || !lover || new Set([actor.id,partner.id,lover.id]).size!==3 || !relation || ![relation.from,relation.to].includes(actor.id) || ![relation.from,relation.to].includes(partner.id)) throw new Error('Invalid affair participants');
    if ([actor,partner,lover].some(p=>ageOn({...p,died:null},row.started)<Math.max(18,rules[p.country].adultAge))) throw new Error('Affair participants must be adults');
    if ([actor,partner,lover].some(p=>compareDates(row.started,p.born)<0 || p.died && compareDates(row.started,p.died)>0) || closeFamily(world,actor.id,lover.id) || compareDates(row.started,world.date)>0 || row.ended && (compareDates(row.ended,row.started)<0 || compareDates(row.ended,world.date)>0) || row.discovered && (compareDates(row.discovered,row.started)<0 || compareDates(row.discovered,world.date)>0)) throw new Error('Invalid affair chronology or family');
    if (row.knownBy.includes(partner.id) && !row.discovered) throw new Error('Partner knowledge requires a recorded discovery');
    if (row.knownBy.some(id=>!world.people[id]) || new Set(row.knownBy).size!==row.knownBy.length || !row.knownBy.includes(row.actorId) || !row.knownBy.includes(row.loverId) || !!row.ended!==!!row.endReason) throw new Error('Invalid affair knowledge or outcome');
    if (!!row.discovered!==!!row.discoveryReason || row.discovered && !row.knownBy.includes(row.partnerId)) throw new Error('Invalid affair discovery');
    if (!row.ended && ([actor,partner,lover].some(p=>p.died) || !['dating','engaged','married'].includes(relation.romance))) throw new Error('An active affair requires living participants and its exclusive commitment');
  }
  const activeActors=new Set<string>();
  for (const row of world.affairs??[]) if (!row.ended) { if (activeActors.has(row.actorId)) throw new Error('Only one simultaneous affair per actor'); activeActors.add(row.actorId); }
  for (const row of world.romanceOffers??[]) {
    if (offerIds.has(row.id)) throw new Error('Duplicate romance offer'); offerIds.add(row.id);
    const relation=world.relationships.find(r=>r.id===row.relationshipId),actor=world.people[row.actorId],target=world.people[row.personId];
    if (!actor || !target || actor.id===target.id || !relation || ![relation.from,relation.to].includes(actor.id) || ![relation.from,relation.to].includes(target.id)) throw new Error('Invalid romance offer participants');
    if (ageOn({...actor,died:null},row.offered)<Math.max(18,rules[actor.country].adultAge) || ageOn({...target,died:null},row.offered)<Math.max(18,rules[target.country].adultAge)) throw new Error('Romance offers require adults');
    if ([actor,target].some(p=>compareDates(row.offered,p.born)<0 || p.died && compareDates(row.offered,p.died)>0) || compareDates(row.offered,world.date)>0 || row.resolved && (compareDates(row.resolved,row.offered)<0 || compareDates(row.resolved,world.date)>0)) throw new Error('Invalid romance offer chronology');
    if (row.affairId && !(world.affairs??[]).some(a=>a.id===row.affairId && a.actorId===row.personId && a.partnerId===row.actorId)) throw new Error('Invalid bound affair discovery');
    if (!!row.resolved!==!!row.choiceId || !!row.resolved!==!!row.outcome) throw new Error('Incomplete romance response');
    if (row.storyChoices && new Set(row.storyChoices.map(c=>c.id)).size!==row.storyChoices.length) throw new Error('Duplicate romance story choice');
  }
  for (const event of [world.pending,...world.deferred.map(r=>r.event)]) {
    if (event?.kind!=='decision') continue;
    const effects=event.choices.flatMap(c=>c.effects.filter(e=>e.kind==='romance-choice'));
    if (!effects.length) continue;
    if (effects.length!==event.choices.length) throw new Error('Invalid romance decision effects');
    const first=effects[0],row=(world.romanceOffers??[]).find(r=>r.id===first.offerId);
    if (!row || row.id!==event.id || row.resolved || !event.personIds.includes(row.actorId) || !world.people[row.personId].died && !event.personIds.includes(row.personId)) throw new Error('Invalid pending romance offer');
    for (const [index,effect] of effects.entries()) if (effect.offerId!==row.id || effect.actorId!==row.actorId || effect.personId!==row.personId || effect.relationshipId!==row.relationshipId || effect.choiceId!==event.choices[index].id || event.choices[index].effects.length!==1) throw new Error('Invalid romance choice identity');
  }
}
