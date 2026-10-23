import { childhoodTemplates } from '../../src/game/content/childhood';
import { bindEvent, eligibleTemplates } from '../../src/game/content/events';
import { storyOption as o, type EventTemplate } from '../../src/game/content/eventTypes';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { offerPending } from '../../src/game/pendingQueue';
import { pupil } from '../support/pupil';

const rewritten=[
  'toddler-parent-name','toddler-ice-cube','child-pocket-museum','school-slide-queue',
  'school-inverted-map','school-library-whisper','school-secret-language','school-rainy-break','teen-unit-confusion','teen-study-soundtrack',
  'teen-shrinking-sleeves','teen-phone-at-dinner','teen-old-interest-box','teen-parent-voice-note','teen-sunday-list',
  'school-recorder-solo','school-bench-reserve','teen-group-project-credit',
] as const;
const scene=(id:string)=>childhoodTemplates.find(item=>item.id===id)!;
const arranged=(template:EventTemplate)=>{
  const world=pupil('US',template.min);
  world.people[world.activePersonId].education.grades=60;
  for(const edge of world.relationships){edge.strength=50;edge.trust=50;}
  return world;
};
function choose(world:World,event:ReturnType<typeof bindEvent>,choiceId:string){
  offerPending(world,event);
  return resolveCommand(decodeWorld(encodeWorld(world)),{type:'choose',eventId:event.id,choiceId});
}

test.each(rewritten)('%s binds real participants and finishes every alternative immediately without new people, money, chains or random draws',id=>{
  const template=scene(id),initial=arranged(template),before=encodeWorld(initial),event=bindEvent(initial,template);
  expect(eligibleTemplates(initial)).toContainEqual(template);expect(encodeWorld(initial)).toBe(before);
  expect(event.choices.length).toBeGreaterThanOrEqual(2);expect(event.choices.length).toBeLessThanOrEqual(4);
  for(const field of ['label','resultBody','journal'] as const)expect(new Set(event.choices.map(option=>option[field])).size).toBe(event.choices.length);
  expect(JSON.stringify(event)).not.toMatch(/\{(?:parent|classmate|teacher|school|city|money)\}/);
  for(const participant of event.participants??[])expect(initial.people[participant.personId]).toBeDefined();
  for(const choice of event.choices){
    expect(choice.effects.some(effect=>effect.kind==='schedule-story')).toBe(false);
    const selected=choose(decodeWorld(before),event,choice.id);
    expect(selected.random).toEqual(initial.random);expect(selected.accounts).toEqual(initial.accounts);expect(selected.ledger).toEqual(initial.ledger);
    expect(selected.liabilities).toEqual(initial.liabilities);expect(selected.assets).toEqual(initial.assets);
    expect(selected.storyThreads).toEqual(initial.storyThreads);expect(Object.keys(selected.people)).toEqual(Object.keys(initial.people));
    expect(selected.pending).toMatchObject({kind:'result',title:choice.resultTitle,body:choice.resultBody});
    expect(selected.journal.at(-1)?.text).toBe(choice.journal);
    for(const person of Object.values(initial.people))expect(selected.people[person.id].education.qualifications).toEqual(person.education.qualifications);
    expect(decodeWorld(encodeWorld(selected))).toEqual(selected);
    expect(()=>resolveCommand(selected,{type:'choose',eventId:event.id,choiceId:choice.id})).toThrow();
    const done=resolveCommand(selected,{type:'acknowledge',resultId:selected.pending!.id});
    expect(done.people).toEqual(selected.people);expect(done.relationships).toEqual(selected.relationships);expect(done.random).toEqual(selected.random);expect(done.storyThreads).toEqual(selected.storyThreads);
  }
});

test.each([
  {id:'school-slide-queue',choiceId:'push',role:'peer',bond:-18,trust:-12},
  {id:'school-rainy-break',choiceId:'quit',role:'peer',bond:-20,trust:-18},
  {id:'teen-unit-confusion',choiceId:'defend',role:'teacher',bond:-16,trust:-14,grades:-18},
  {id:'teen-phone-at-dinner',choiceId:'score',role:'parent',bond:-16,trust:-18},
  {id:'teen-group-project-credit',choiceId:'interrupt',role:'peer',bond:-20,trust:-15,grades:-16},
] as const)('$id applies its substantial real grade/bond/trust consequences to the frozen saved participant once',row=>{
  const world=arranged(scene(row.id)),event=bindEvent(world,scene(row.id)),option=event.choices.find(choice=>choice.id===row.choiceId)!;
  const immediate=option.effects.find(effect=>effect.kind==='story-immediate');
  if(immediate?.kind!=='story-immediate')throw Error('Missing immediate trust effect');
  const target=immediate.trust?.find(item=>item.role===row.role);if(!target)throw Error('Missing bound role');
  expect(event.personIds).toContain(target.otherId);expect(event.participants?.some(item=>item.personId===target.otherId)).toBe(true);
  const selected=choose(world,event,row.choiceId),edge=selected.relationships.find(item=>item.id===target.relationshipId)!;
  expect(edge.strength).toBe(50+row.bond);expect(edge.trust).toBe(50+row.trust);
  const gradeDelta='grades'in row && row.grades!==undefined?row.grades:0;
  expect(selected.people[selected.activePersonId].education.grades).toBe(60+gradeDelta);
  const frozen=decodeWorld(encodeWorld(selected));expect(frozen.relationships).toEqual(selected.relationships);
  expect(frozen.pending).toEqual(selected.pending);expect(frozen.random).toEqual(world.random);
});

test('a saved old unit-confusion decision resolves its original modest effects and literal copy after the template is rewritten',()=>{
  // Original da0b0e5 template text and choices. Frozen saves carry these bound
  // fields; they must not acquire the new fabricated-data premise or effects.
  const old:EventTemplate={...scene('teen-unit-confusion'),title:'A remarkably large answer',
    body:'Your science calculation produces a desk taller than a mountain. {teacher} asks whether you used centimetres or metres. You used whichever fitted.',choices:[
      o('redo','Redo it with consistent units',{discipline:2,energy:-3},'A smaller desk','The corrected answer fits in the classroom. You mark the unit beside every step.','I corrected inconsistent units in a science calculation.',undefined,{grades:2,skill:{id:'science',delta:2}}),
      o('help','Ask where the units changed',{smarts:2},'The missing conversion','{teacher} helps you find the line where the scale changed. You finish the correction yourself.','I asked {teacher} to help find a unit-conversion mistake.',undefined,{teacherBond:3,grades:1}),
      o('defend','Defend your extremely large desk',{happiness:2,discipline:-1},'Insufficient classroom space','{teacher} returns the calculation for correction. The original answer does not earn the marks.','I defended a science answer with incompatible units.',undefined,{grades:-2,teacherBond:-2}),
    ]};
  const world=arranged(old),event=bindEvent(world,old),choice=event.choices.find(item=>item.id==='defend')!;
  offerPending(world,event);const frozen=decodeWorld(encodeWorld(world));expect(frozen.pending).toEqual(event);
  expect(frozen.pending!.body).not.toContain('invented the numbers');
  const selected=resolveCommand(frozen,{type:'choose',eventId:event.id,choiceId:choice.id});
  expect(selected.pending).toMatchObject({kind:'result',title:choice.resultTitle,body:choice.resultBody});
  expect(selected.people[selected.activePersonId].education.grades).toBe(58);
  const effect=choice.effects.find(item=>item.kind==='relationship');if(effect?.kind!=='relationship')throw Error('Missing old teacher bond');
  expect(selected.relationships.find(item=>item.id===effect.relationshipId)).toMatchObject({strength:48,trust:50});
  expect(selected.journal.at(-1)?.text).toBe('I defended a science answer with incompatible units.');
  expect(selected.random).toEqual(world.random);expect(decodeWorld(encodeWorld(selected))).toEqual(selected);
});
