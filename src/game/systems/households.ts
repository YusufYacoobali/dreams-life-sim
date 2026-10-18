import { ageOn, fullName, Person, World } from '../model';
import { rules } from '../rules';
import { roundRatio } from '../money';
import { isConfined } from './legalSchemas';

export function moveHousehold(world: World, personIds: string[], targetId: string) {
  const target = world.households.find(household => household.id === targetId);
  if (!target) throw new Error('Missing household');
  const moving = new Set(personIds);
  for (const household of world.households) if (household.id !== targetId) household.members = household.members.filter(id => !moving.has(id));
  world.households = world.households.filter(household => household.members.length > 0);
  for (const id of personIds) { if (!target.members.includes(id)) target.members.push(id); world.people[id].householdId = targetId; }
  for (const asset of world.assets) if (asset.primaryHome && asset.ownerId && target.members.includes(asset.ownerId) && asset.id !== target.homeAssetId) asset.primaryHome = false;
  for (const household of world.households) if (household.homeAssetId && !world.assets.some(asset => asset.id === household.homeAssetId && asset.ownerId && household.members.includes(asset.ownerId))) household.homeAssetId = null;
}
export function ownHousehold(world: World, person: Person, include: string[] = []) {
  const id = 'household_' + person.id + '_' + world.revision;
  const home = world.assets.find(asset => asset.ownerId === person.id && asset.primaryHome) ?? world.assets.find(asset => asset.ownerId && include.includes(asset.ownerId) && asset.primaryHome);
  if (!world.households.some(household => household.id === id)) world.households.push({ id, name: fullName(person) + '’s household', members: [person.id], homeAssetId: home?.id ?? null });
  moveHousehold(world, [person.id, ...include], id);
  return id;
}
export function householdLivingCost(world: World, person: Person): bigint {
  if (isConfined(world, person)) return 0n;
  const rule = rules[person.country];
  if (ageOn(person, world.date) < rule.adultAge || (ageOn(person, world.date) < rule.schoolEnd && (person.education.stage === 'primary' || person.education.stage === 'secondary'))) return 0n;
  const household = world.households.find(item => item.id === person.householdId);
  if (!household) return rule.livingCost;
  const members = household.members.map(id => world.people[id]).filter(member => !member.died && !isConfined(world, member) && member.country === person.country);
  const adults = members.filter(member => ageOn(member, world.date) >= rules[member.country].adultAge && !(ageOn(member, world.date) < rules[member.country].schoolEnd && (member.education.stage === 'primary' || member.education.stage === 'secondary'))).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const children = members.length - adults.length;
  const weight = 10000 + Math.max(0, adults.length - 1) * 5000 + children * 2500;
  let total = roundRatio(rule.livingCost * BigInt(weight), 10000n);
  const home = world.assets.find(asset => asset.id === household.homeAssetId && asset.ownerId && household.members.includes(asset.ownerId)) ?? world.assets.find(asset => asset.primaryHome && asset.ownerId && household.members.includes(asset.ownerId));
  if (home) total = roundRatio(total * 4500n, 10000n);
  const count = BigInt(adults.length || 1); const index = adults.findIndex(member => member.id === person.id);
  return total / count + (BigInt(Math.max(index, 0)) < total % count ? 1n : 0n);
}
export function financialActors(world: World): Person[] {
  const player = world.people[world.activePersonId]; const ids = new Set([player.id]);
  const household = world.households.find(item => item.id === player.householdId);
  for (const id of household?.members ?? []) ids.add(id);
  for (const relation of world.relationships) {
    if (relation.from !== player.id && relation.to !== player.id) continue;
    if (relation.roles.includes('parent') || relation.romance === 'dating' || relation.romance === 'engaged' || relation.romance === 'married') {
      const id = relation.from === player.id ? relation.to : relation.from;
      const person = world.people[id];
      if (person.employment || person.finance.pensionAnnual > 0n || person.householdId === player.householdId) ids.add(id);
    }
  }
  for (const asset of world.assets) if (asset.ownerId) ids.add(asset.ownerId);
  for (const holding of world.holdings) if (holding.quantity > 0n) ids.add(holding.ownerId);
  for (const company of world.businesses.filter(item => item.status === 'active')) { if (company.ownerId) ids.add(company.ownerId); for (const member of company.staff.filter(item => !item.ended)) ids.add(member.personId); }
  for (const payable of world.businessPayables) if (payable.creditorId && payable.principal > 0n) ids.add(payable.creditorId);
  for (const career of world.careers.filter(item=>item.status==='active')) {ids.add(career.personId);for(const id of career.contacts)ids.add(id);}
  for (const release of world.musicReleases.filter(item=>['recording','paused','released'].includes(item.status))) ids.add(release.personId);
  for (const election of world.elections.filter(item=>item.status==='campaign')) for(const candidate of election.candidates) ids.add(candidate.personId);
  for (const person of Object.values(world.people).filter(item=>item.training)) {ids.add(person.id);if(ageOn(person,world.date)<rules[person.country].adultAge)for(const relation of world.relationships)if(relation.to===person.id&&relation.roles.some(role=>role==='parent'||role==='guardian'))ids.add(relation.from);}
  for (const custody of world.custody) if (!custody.ended) { ids.add(custody.a); ids.add(custody.b); }
  for (const pregnancy of world.pregnancies) if (pregnancy.status === 'pregnant') { ids.add(pregnancy.carrierId); ids.add(pregnancy.otherParentId); }
  for (const debt of world.liabilities) if (debt.creditorId && debt.principal > 0n) { ids.add(debt.ownerId); ids.add(debt.creditorId); }
  for (const person of Object.values(world.people)) {
    if (isConfined(world, person) || person.legal.wanted) ids.add(person.id);
    const routine = person.health.routine;
    if (person.health.conditions.some(item => item.status !== 'recovered') || routine.diet === 'nutritious' || routine.exercise === 'gym' || routine.exercise === 'sport' || routine.smoking || routine.drinking !== 'none') {
      ids.add(person.id);
      if (ageOn(person, world.date) < rules[person.country].adultAge) for (const relation of world.relationships) if (relation.to === person.id && relation.roles.some(role => role === 'parent' || role === 'guardian')) ids.add(relation.from);
    }
  }
  for (const person of Object.values(world.people)) if (person.finance.cycleGross > 0n) ids.add(person.id);
  for (const household of world.households) if (household.members.some(id => ids.has(id))) for (const id of household.members) ids.add(id);
  return [...ids].map(id => world.people[id]).filter(person => !person.died);
}
