import { automaticAppearance, automaticAppearanceKey, isAutomaticAppearance, legacyNPCDefaultGender, legacyNPCPortraitAppearance, presentationForGender } from '../../src/game/appearance';
import { automaticArtworkPools, clothingArtworkTags, faceArtworkTags, hairArtworkTags, supportsArtworkPresentation } from '../../src/game/appearanceArtwork';
import { portraitLayers, portraitTraits } from '../../src/assets/portraitPlan';
import { createLife, randomCreation } from '../../src/game/createLife';
import { countries } from '../../src/game/countries';
import { decodeWorld, encodeWorld, personSchema, type Person, type World } from '../../src/game/model';
import { nextRandom, randomInteger } from '../../src/game/random';
import { createContact, hireNpc } from '../../src/game/systems/npcs';
import { addChild, childrenOf } from '../../src/game/systems/family';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { npcBackgroundRoleIds } from '../../src/game/content/jobs';
import birth from '../fixtures/v6-birth-result.json';

const date = { year:2026,month:10,day:22 };
const raw = { face:3,skin:4,hair:5,hairColor:2 };
const fresh = (seed=42) => createLife('life_artwork_defaults',seed,{ ...randomCreation(seed),country:'US',city:'New York',background:'ordinary' },date);
function rendered(world:World,person:Person,age=25) {
  return portraitTraits(person.appearance,age,person.id,legacyNPCDefaultGender(world,person.id,person.appearance));
}

test('the complete artwork audit tags all sixteen identities, eight hairstyles and sixteen outfits; neutral defaults use explicitly neutral artwork', () => {
  expect(faceArtworkTags).toHaveLength(16); expect(hairArtworkTags).toHaveLength(8); expect(clothingArtworkTags).toHaveLength(16);
  for (const presentation of ['masculine','feminine','neutral'] as const) {
    const pool = automaticArtworkPools[presentation];
    for (const [indices,tags] of [[pool.identities,faceArtworkTags],[pool.hair,hairArtworkTags],[pool.outfits,clothingArtworkTags]] as const) {
      expect(new Set(indices).size).toBe(indices.length);
      for (const index of indices) expect(supportsArtworkPresentation(tags[index],presentation)).toBe(true);
    }
  }
  expect(automaticArtworkPools.neutral.identities).not.toEqual(automaticArtworkPools.masculine.identities);
  expect(automaticArtworkPools.neutral.identities).not.toEqual(automaticArtworkPools.feminine.identities);
});

test.each(['male','female','nonbinary'] as const)('%s automatic artwork is diverse, stable across ageing, and independent of simulation randomness', gender => {
  const presentation = presentationForGender(gender), pool = automaticArtworkPools[presentation], identities = new Set<number>();
  for (let index=0;index<100;index++) {
    const appearance = automaticAppearance(raw,gender,automaticAppearanceKey('life_style','person_npc_0_'+index));
    identities.add(appearance.identity!);
    expect(isAutomaticAppearance(appearance)).toBe(true);
    expect(pool.identities as readonly number[]).toContain(appearance.identity);
    expect(pool.hair as readonly number[]).toContain(appearance.hair);
    expect(pool.outfits as readonly number[]).toContain(appearance.outfit);
    expect({ face:appearance.face,skin:appearance.skin,hairColor:appearance.hairColor }).toEqual({ face:raw.face,skin:raw.skin,hairColor:raw.hairColor });
    expect(automaticAppearance(raw,gender,automaticAppearanceKey('life_style','person_npc_0_'+index))).toEqual(appearance);
    for (const age of [0,3,12,25,48,68,86,100]) {
      const traits = portraitTraits(appearance,age,'person_npc_0_'+index);
      expect(traits.identity).toBe(appearance.identity); expect(traits.clothing).toBe(appearance.outfit);
      expect(portraitLayers(traits).length).toBeLessThanOrEqual(5);
    }
  }
  expect(identities.size).toBe(pool.identities.length);
  expect(raw).toEqual({ face:3,skin:4,hair:5,hairColor:2 });
});

test.each(['male','female','nonbinary'] as const)('%s contacts retain the original constructor draws, inherited colour draws and game facts', gender => {
  const world = fresh(), before = { ...world.random }, country = countries.US;
  const bounds = [[1,12],[1,28],[0,country.firstNames.length-1],[0,country.lastNames.length-1],[40,90],[65,100],[25,90],[25,95],[25,85],[30,85],[5,50],[30,90],[0,3],[0,5],[0,7],[0,4],[0,5],...(gender==='nonbinary'?[[0,1]]:[]),[1,100]];
  let state = before.npcs; const original:number[]=[];
  for (const [minimum,maximum] of bounds) { const draw=randomInteger(state,minimum,maximum); state=draw.state; original.push(draw.value); }
  const person = createContact(world,{ age:8,gender,schoolStudent:true });
  expect(world.random).toEqual({ ...before,npcs:state });
  expect(person.firstName).toBe(country.firstNames[original[2]]); expect(person.lastName).toBe(country.lastNames[original[3]]);
  expect(person.stats.smarts).toBe(original[6]); expect(person.appearance.face).toBe(original[12]);
  expect(person.appearance.skin).toBe(original[13]); expect(person.appearance.hairColor).toBe(original[15]);
  expect(person.gender).toBe(gender); expect(person.education.stage).toBe('primary'); expect(isAutomaticAppearance(person.appearance)).toBe(true);
});

test('parents and professional, campus, school and child creation paths store suitable complete artwork; inherited facial preferences and colours survive', () => {
  const world = fresh(), player=world.people[world.activePersonId];
  expect(player.appearance).toEqual(randomCreation(42).appearance);
  const parents=Object.values(world.people).filter(person=>person.id!==player.id);
  for (const person of parents) expect(isAutomaticAppearance(person.appearance)).toBe(true);
  const contacts = [createContact(world,{ age:40,gender:'female',qualifiedRole:'teacher' }),createContact(world,{ age:40,gender:'male',qualifiedRole:'doctor' }),createContact(world,{ age:8,gender:'nonbinary',schoolStudent:true }),createContact(world,{ age:21,gender:'female',postsecondaryStudent:{ program:'university',annualTuition:500000n } })];
  for (const person of contacts) expect(isAutomaticAppearance(person.appearance)).toBe(true);
  const family=decodeWorld(JSON.stringify(birth)), first=family.people[family.activePersonId], second=family.people[family.marriages.at(-1)!.b];
  const child=addChild(family,[first,second],'biological'), adopted=addChild(family,[first,second],'adoptive',3);
  expect([first.appearance.face,second.appearance.face]).toContain(child.appearance.face);
  expect(child.appearance.skin).toBe(Math.round((first.appearance.skin+second.appearance.skin)/2));
  expect([first.appearance.hairColor,second.appearance.hairColor]).toContain(child.appearance.hairColor);
  expect(isAutomaticAppearance(child.appearance)).toBe(true); expect(isAutomaticAppearance(adopted.appearance)).toBe(true);
  for (const person of Object.values(world.people).filter(person=>person.employment)) expect(npcBackgroundRoleIds).toContain(person.employment!.roleId);
});

test('legacy automatic defaults are render-only; reserved identifiers, exact old fields and player lineage prevent accidental custom recasting', () => {
  const world=fresh(), parent=world.people.person_parent1; parent.appearance={ ...raw };
  const original=encodeWorld(world), random={...world.random}, traits=rendered(world,parent);
  expect(automaticArtworkPools.feminine.identities as readonly number[]).toContain(traits.identity);
  expect(encodeWorld(world)).toBe(original); expect(world.random).toEqual(random);
  expect(rendered({...world,id:'life_restored_branch'},parent)).toEqual(traits);
  const cases:Person['appearance'][] = [
    { ...raw,identity:0 },{ ...raw,outfit:0 },{ ...raw,provenance:{kind:'custom'} },
    { ...automaticAppearance(raw,'male','deliberate'),hair:7 },
  ];
  for (const appearance of cases) {
    parent.appearance=appearance;
    expect(legacyNPCDefaultGender(world,parent.id,appearance)).toBeUndefined();
    expect(legacyNPCPortraitAppearance(appearance,parent.id,parent.gender)).toBe(appearance);
    expect(rendered(world,parent)).toEqual(portraitTraits(appearance,25,parent.id));
  }
  const generated=automaticAppearance(raw,'male','deliberate');
  expect(isAutomaticAppearance(generated)).toBe(true); expect(isAutomaticAppearance({...generated,outfit:(generated.outfit!+1)%16})).toBe(false);
  parent.appearance=generated;
  const stable=rendered(world,parent); parent.gender='nonbinary'; expect(rendered(world,parent)).toEqual(stable);
  parent.appearance={...raw};
  expect(legacyNPCDefaultGender(world,'external_custom_id',raw)).toBeUndefined();
  expect(legacyNPCDefaultGender(world,'person_player',raw)).toBeUndefined();
  expect(legacyNPCDefaultGender({...world,activePersonId:parent.id},parent.id,raw)).toBeUndefined();
  for (const edge of [{fromId:parent.id,toId:'person_player',date},{fromId:'person_player',toId:parent.id,date}]) expect(legacyNPCDefaultGender({...world,legacies:[edge]},parent.id,raw)).toBeUndefined();
  expect(personSchema.shape.appearance.parse(raw)).toEqual(raw);
});

test('the existing sixteen manual identities remain unrestricted even when they contrast with a saved gender', () => {
  const world=fresh(), parent=world.people.person_parent1;
  for (let identity=0;identity<16;identity++) for (let hair=0;hair<8;hair++) for (let outfit=0;outfit<16;outfit++) {
    const appearance={...raw,identity,hair,outfit}; parent.appearance=appearance;
    expect(rendered(world,parent)).toEqual(portraitTraits(appearance,25,parent.id));
    expect(parent.appearance).toBe(appearance);
  }
});

test.each(['legacy','explicit','edited-automatic','custom'] as const)('continue as child freezes only a proven legacy look and preserves %s appearance and saved game facts', mode => {
  let world=decodeWorld(JSON.stringify(birth)); const child=childrenOf(world)[0];
  if (mode==='explicit') child.appearance={...raw,identity:0,outfit:15};
  if (mode==='edited-automatic') child.appearance={...automaticAppearance(raw,child.gender,'edited'),hairColor:4};
  if (mode==='custom') child.appearance={...raw,provenance:{kind:'custom'}};
  const before=encodeWorld(world), random={...world.random}, likeness=rendered(world,child,3), oldAppearance=child.appearance;
  recordDeath(world,world.activePersonId,'test fixture');
  const afterDeath={born:child.born,education:child.education,gender:child.gender,traits:child.traits};
  world=resolveCommand(decodeWorld(encodeWorld(world)),{type:'continue-child',personId:child.id});
  const heir=world.people[child.id];
  expect(rendered(world,heir,3)).toEqual(likeness); expect(world.random).toEqual(random);
  expect({born:heir.born,education:heir.education,gender:heir.gender,traits:heir.traits}).toEqual(afterDeath);
  if (mode==='legacy') expect(isAutomaticAppearance(heir.appearance)).toBe(true); else expect(heir.appearance).toEqual(oldAppearance);
  const loaded=decodeWorld(encodeWorld(world)); expect(rendered(loaded,loaded.people[child.id],3)).toEqual(likeness);
  expect(JSON.parse(before).people[child.id].appearance).toEqual(oldAppearance);
});

test('the expanded job catalogue does not create background management experience or reroll default NPC job pools', () => {
  const world=fresh();
  for (let index=0;index<30;index++) {
    const person=createContact(world,{age:40});
    expect(npcBackgroundRoleIds).toContain(person.employment!.roleId);
  }
  const person=createContact(world,{age:40}); person.stats.smarts=100;
  person.education.qualifications.push({level:'degree',field:'business',year:world.date.year-10});
  expect(()=>hireNpc(world,person,'project-manager')).toThrow(/qualification/);
  expect(()=>createContact(fresh(),{age:40,qualifiedRole:'project-manager'})).toThrow(/recorded paid work/);
  // A pure appearance call cannot even advance the next stream draw.
  const state=world.random.npcs; automaticAppearance(raw,'female','no-draw'); expect(nextRandom(world.random.npcs)).toEqual(nextRandom(state));
});
