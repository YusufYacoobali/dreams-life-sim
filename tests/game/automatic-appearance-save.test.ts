import { automaticAppearance, isAutomaticAppearance, legacyNPCDefaultGender } from '../../src/game/appearance';
import { portraitLayers, portraitTraits } from '../../src/assets/portraitPlan';
import { decodeWorld, encodeWorld, type Person, type World } from '../../src/game/model';
import { createContact } from '../../src/game/systems/npcs';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { childrenOf } from '../../src/game/systems/family';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import birth from '../fixtures/v6-birth-result.json';

const look=(world:World,person:Person)=>portraitLayers(portraitTraits(person.appearance,25,person.id,legacyNPCDefaultGender(world,person.id,person.appearance)));

test('cold SQLite loads and restored branches preserve legacy rendered defaults, new automatic artwork, deliberate custom choices and every saved draw',async()=>{
  const context=database(), world=decodeWorld(JSON.stringify(birth)), player=world.people[world.activePersonId];
  player.appearance={face:2,skin:2,hair:7,hairColor:3,identity:3,outfit:15};
  const generated=createContact(world,{age:31,gender:'female'}), edited=createContact(world,{age:35,gender:'male'});
  edited.appearance={...automaticAppearance({face:1,skin:4,hair:2,hairColor:1},'male','edited'),identity:11,outfit:4};
  const appearances=Object.fromEntries(Object.values(world.people).map(person=>[person.id,person.appearance]));
  const layers=Object.fromEntries(Object.values(world.people).map(person=>[person.id,look(world,person)]));
  const encoded=encodeWorld(world), random={...world.random};
  try{
    const repository=new SaveRepository(context.driver); await repository.initialise(); await repository.create(world);
    const rowsBefore=context.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(world.id);
    const reopened=new SaveRepository(context.driver); await reopened.initialise(); const loaded=await reopened.load(world.id);
    expect(encodeWorld(loaded)).toBe(encoded); expect(loaded.random).toEqual(random);
    expect(isAutomaticAppearance(loaded.people[generated.id].appearance)).toBe(true);
    expect(isAutomaticAppearance(loaded.people[edited.id].appearance)).toBe(false);
    expect(Object.fromEntries(Object.values(loaded.people).map(person=>[person.id,look(loaded,person)]))).toEqual(layers);
    expect(context.sqlite.prepare('SELECT payload FROM lives WHERE id=?').get(world.id)).toEqual(rowsBefore);
    const snapshots=await reopened.snapshot(world.id,world.revision);
    const restored=await reopened.restoreBranch(world.id,snapshots[0].id,world.revision,'life_artwork_branch','artwork_branch_request');
    expect(Object.fromEntries(Object.values(restored.people).map(person=>[person.id,person.appearance]))).toEqual(appearances);
    expect(Object.fromEntries(Object.values(restored.people).map(person=>[person.id,look(restored,person)]))).toEqual(layers);
    const cold=new SaveRepository(context.driver); await cold.initialise(); const again=await cold.load(restored.id);
    expect(again.random).toEqual(random); expect(encodeWorld(await cold.load(world.id))).toBe(encoded);
    expect(Object.fromEntries(Object.values(again.people).map(person=>[person.id,look(again,person)]))).toEqual(layers);
  }finally{context.sqlite.close();}
});

test('the legacy child’s displayed likeness is frozen on ordinary inheritance handover and survives a cold save without re-casting',async()=>{
  const context=database(); let world=decodeWorld(JSON.stringify(birth));
  const child=childrenOf(world)[0], original=child.appearance, likeness=look(world,child), fromId=world.activePersonId;
  const savedBefore=encodeWorld(world); recordDeath(world,fromId,'test fixture');
  world=resolveCommand(world,{type:'continue-child',personId:child.id});
  expect(look(world,world.people[child.id])).toEqual(likeness);
  expect(isAutomaticAppearance(world.people[child.id].appearance)).toBe(true);
  expect(JSON.parse(savedBefore).people[child.id].appearance).toEqual(original);
  try{
    const repository=new SaveRepository(context.driver); await repository.initialise(); await repository.create(world);
    const cold=new SaveRepository(context.driver); await cold.initialise(); const loaded=await cold.load(world.id);
    expect(loaded.legacies.at(-1)).toMatchObject({fromId,toId:child.id});
    expect(loaded.people[child.id].appearance).toEqual(world.people[child.id].appearance);
    expect(look(loaded,loaded.people[child.id])).toEqual(likeness);
    expect(loaded.random).toEqual(world.random); expect(loaded.estates).toEqual(world.estates);
  }finally{context.sqlite.close();}
});
