import { createLife, randomCreation } from '../../src/game/createLife';
import { countries, countryCodes } from '../../src/game/countries';
import { monthFrom } from '../../src/game/calendar';
import { resolveCommand } from '../../src/game/engine';
import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { rules } from '../../src/game/rules';
import { educationMonth, startCourse } from '../../src/game/systems/education';
import { schoolMonth } from '../../src/game/systems/school';
import { refreshSchools } from '../../src/game/systems/school';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';

function fresh(country: typeof countryCodes[number] = 'US') {
  const world = createLife('life_milestones',42,{ ...randomCreation(42),country,city:countries[country].cities[0] },{ year:2000,month:1,day:1 });
  world.birthAcknowledged = true;
  const person = world.people[world.activePersonId]; person.stats.health = 100;
  person.stats.smarts = 85; person.stats.discipline = 85;
  return world;
}
const cards = (world: World) => [world.pending,...world.deferred.map(row=>row.event)].filter((event): event is NonNullable<World['pending']>=>!!event);
function acknowledgeAll(initial: World) {
  let world = initial;
  while(world.pending?.kind === 'result') world = resolveCommand(world,{ type:'acknowledge',resultId:world.pending.id });
  return world;
}

test.each(countryCodes)('%s queues the real named primary entry and both secondary-transition milestones once',country=>{
  let world = fresh(country), person = world.people[world.activePersonId];
  world.date.year += rules[country].schoolStart;
  educationMonth(world,person); schoolMonth(world);
  expect(world.pending).toMatchObject({kind:'result',title:'First day of primary school',illustration:'education'});
  expect(world.pending!.body).toContain(person.education.school);
  const intro = structuredClone(cards(world)), random = { ...world.random };
  world = unpackCheckpoint(packCheckpoint(validateWorld(world))); expect(cards(world)).toEqual(intro);
  world = acknowledgeAll(world); expect(world.random).toEqual(random);
  person = world.people[world.activePersonId];
  educationMonth(world,person); expect(cards(world)).toEqual([]);
  const primary = person.education.school;
  world.date.year = person.born.year + rules[country].secondaryStart;
  educationMonth(world,person); schoolMonth(world);
  expect(cards(world).map(event=>event.title)).toEqual(['Primary school completed','Secondary school starts']);
  expect(cards(world)[0].body).toContain(primary); expect(cards(world)[1].body).toContain(person.education.school);
  const ids = cards(world).map(event=>event.id); expect(new Set(ids).size).toBe(2);
  world = decodeWorld(encodeWorld(validateWorld(world))); expect(cards(world).map(event=>event.id)).toEqual(ids);
  educationMonth(world,world.people[world.activePersonId]); expect(cards(world).map(event=>event.id)).toEqual(ids);
  world = acknowledgeAll(world); expect(cards(world)).toEqual([]);
  expect(()=>resolveCommand(world,{type:'acknowledge',resultId:ids[0]})).toThrow(/no longer open/);
});

test('a genuine annual school entry keeps its saved month cursor and resumes identically after reload',()=>{
  const initial = fresh(); initial.date.year += rules.US.schoolStart - 1;
  const offered = resolveCommand(initial,{type:'advance'});
  expect(offered.pending).toMatchObject({kind:'result',title:'First day of primary school'});
  expect(offered.annual?.monthsProcessed).toBe(12);
  expect(offered.people[offered.activePersonId].education.months).toBe(1);
  const cold = unpackCheckpoint(packCheckpoint(offered));
  const ack = {type:'acknowledge' as const,resultId:offered.pending!.id};
  let world = resolveCommand(cold,ack);
  expect(world).toEqual(resolveCommand(offered,ack));
  for(let count=0;count<20&&(world.pending||world.annual);count++){
    world = resolveCommand(world,world.pending?.kind==='decision'
      ? {type:'choose',eventId:world.pending.id,choiceId:world.pending.choices[0].id}
      : world.pending ? {type:'acknowledge',resultId:world.pending.id} : {type:'resume'});
  }
  expect(world.annual).toBeNull(); expect(world.pending).toBeNull();
  expect(world.date).toEqual({...initial.date,year:initial.date.year+1});
  expect(world.people[world.activePersonId].education.months).toBe(1);
  expect(world.journal.filter(row=>row.text==='I started at '+world.people[world.activePersonId].education.school+'.')).toHaveLength(1);
});

test.each([49,50])('secondary completion remains one saved assessment/result with final grade %i',grade=>{
  let world = fresh(), person = world.people[world.activePersonId];
  world.date.year += rules.US.schoolEnd - 1;
  educationMonth(world,person); schoolMonth(world); world = acknowledgeAll(world); person = world.people[world.activePersonId];
  const school = person.education.school;
  person.education.months = 12; person.education.grades = grade;
  world.date.year++;
  educationMonth(world,person); refreshSchools(world);
  expect(world.schoolCompletions).toHaveLength(1);
  expect(world.pending?.body).toContain(school);
  expect(cards(world)).toHaveLength(1);
  expect(person.education.qualifications.some(row=>row.level==='secondary')).toBe(grade>=50);
  world = unpackCheckpoint(packCheckpoint(validateWorld(world)));
  educationMonth(world,world.people[world.activePersonId]); expect(world.schoolCompletions).toHaveLength(1); expect(cards(world)).toHaveLength(1);
  world = acknowledgeAll(world); educationMonth(world,world.people[world.activePersonId]); expect(cards(world)).toEqual([]);
});

test.each(['university','trade','graduate'] as const)('%s completion and failure produce one persisted outcome without repeating tuition or qualifications',program=>{
  for(const grade of [0,100]){
    let world = fresh(), person = world.people[world.activePersonId]; world.date.year += 26;
    person.education.qualifications.push({level:'secondary',field:'general',year:2018});
    if(program==='graduate') person.education.qualifications.push({level:'degree',field:'science',year:2022});
    startCourse(world,program,program==='graduate'?'medicine':'computing','loan','Milestone College');
    person.education.grades = grade;
    // Run the real course length, tuition renewals and final assessment.
    const duration = person.education.requiredMonths;
    for(let month=0;month<duration;month++){
      world.date = monthFrom(world.date,1);
      educationMonth(world,person);
    }
    const payments = world.ledger.length;
    expect(world.pending?.title).toBe(grade>=50?'You graduated!':'No qualification this time');
    expect(world.pending?.body).toContain('Milestone College');
    expect(world.studyCourses.at(-1)?.status).toBe(grade>=50?'completed':'failed');
    const recorded = copyWorld(world);
    world = decodeWorld(encodeWorld(validateWorld(world)));
    educationMonth(world,world.people[world.activePersonId]);
    expect(world.ledger).toHaveLength(payments); expect(world.people[world.activePersonId].education.qualifications).toEqual(recorded.people[recorded.activePersonId].education.qualifications);
    expect(cards(world)).toEqual(cards(recorded));
    world = acknowledgeAll(world); educationMonth(world,world.people[world.activePersonId]); expect(cards(world)).toEqual([]);
  }
});
