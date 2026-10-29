import { decodeWorld } from '../../src/game/model';
import { relationLabel } from '../../src/game/systems/relationships';
import newborn from '../fixtures/v1-newborn.json';

test('family labels use saved gender, parent type and relationship direction', () => {
  const world = decodeWorld(JSON.stringify(newborn));
  const parent = world.relationships.find(row=>row.roles.includes('parent')&&row.to===world.activePersonId)!;
  const adult = world.people[parent.from], child = world.people[parent.to];
  for (const [gender,role] of [['female','Mother'],['male','Father'],['nonbinary','Parent']] as const) {
    adult.gender=gender;parent.parentType='biological';
    expect(relationLabel(world,parent)).toBe(role);
    parent.parentType='adoptive';
    expect(relationLabel(world,parent)).toBe('Adoptive '+(role==='Parent'?'parent':role));
  }
  parent.parentType='biological';
  for (const [gender,role] of [['female','Daughter'],['male','Son'],['nonbinary','Child']] as const) {
    child.gender=gender;
    expect(relationLabel(world,parent,parent.from)).toBe(role);
    parent.parentType='adoptive';
    expect(relationLabel(world,parent,parent.from)).toBe('Adopted '+(role==='Child'?'child':role));
    parent.parentType='biological';
  }
  parent.kind='guardian';parent.roles=['guardian'];parent.parentType='guardian';
  expect(relationLabel(world,parent)).toBe('Guardian');
  expect(relationLabel(world,parent,parent.from)).toBe('In your care');
});

test('sibling labels describe the saved person and preserve nonbinary identities', () => {
  const world = decodeWorld(JSON.stringify(newborn));
  const source = world.relationships.find(row=>row.roles.includes('parent')&&row.to===world.activePersonId)!;
  const sibling = {...source,kind:'sibling' as const,roles:['sibling' as const],parentType:null};
  const person=world.people[sibling.from];
  for (const [gender,label] of [['female','Sister'],['male','Brother'],['nonbinary','Sibling']] as const) {
    person.gender=gender;expect(relationLabel(world,sibling)).toBe(label);
  }
});
