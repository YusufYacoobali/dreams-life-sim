import { ageOn, type Person, type World } from '../model';
import type { EventTemplate, StoryChildGroup } from '../content/eventTypes';
import { activeHobbyPlan } from './leisureSchemas';
import { householdPets } from './petSchemas';
import { storyPersonPresent } from './storyContext';
import { conditions } from '../content/health';
import { publicRoyalDuty } from './royaltySchemas';
import { creatorCatalog } from '../content/creators';

/** Read once per annual selection. No people, purchases, practice or draws are created. */
export function lifeStoryContexts(world: World) {
  const player = world.people[world.activePersonId];
  const children: Partial<Record<StoryChildGroup, { person: Person; relationshipId: string }>> = {};
  for (const edge of world.relationships) {
    if (edge.from !== player.id || !edge.roles.some(role => role === 'parent' || role === 'guardian')) continue;
    const child = world.people[edge.to];
    if (!child || !storyPersonPresent(world, child) || child.country !== player.country || child.city !== player.city) continue;
    const age = ageOn(child, world.date); if (age < 0) continue;
    if (age < 18 && (!player.householdId || child.householdId !== player.householdId)) continue;
    const group: StoryChildGroup = age <= 2 ? 'baby' : age <= 11 ? 'young' : age <= 17 ? 'teen' : 'adult';
    children[group] ??= { person: child, relationshipId: edge.id };
  }
  const household = world.households.find(item => item.id === player.householdId);
  const home = household && world.assets.find(item => item.id === household.homeAssetId && item.kind === 'property' && item.condition > 0 && item.country === player.country && item.city === player.city && item.ownerId && household.members.includes(item.ownerId));
  const pets = householdPets(world).filter(pet => world.people[pet.ownerId] && storyPersonPresent(world, world.people[pet.ownerId]));
  const hobbies = world.hobbies.filter(hobby => {
    const plan = activeHobbyPlan(hobby);
    return hobby.personId === player.id && plan?.country === player.country && plan.city === player.city && hobby.practices.some(row => row.planId === plan.id && row.attended && row.date.year * 12 + row.date.month >= world.date.year * 12 + world.date.month - 12);
  });
  const visited = [...world.trips].reverse().find(trip => trip.status === 'completed' && trip.participantIds.includes(player.id));
  const condition = player.health.conditions.find(item => item.status === 'active' && item.diagnosed && item.months >= 12 && conditions[item.type].chronic);
  const specialCareers = new Set<string>();
  for (const career of world.careers) if (career.personId === player.id && career.status === 'active' && career.employmentId === player.employment?.id) specialCareers.add(career.kind);
  for (const career of world.serviceCareers) if (career.personId === player.id && career.status === 'active' && career.employmentId === player.employment?.id) specialCareers.add(career.kind);
  if (world.creatorStudios.some(studio => studio.personId === player.id && studio.status === 'active')) specialCareers.add('creator');
  // Dedicated platform situations need this person's actual local studio and
  // its matching live account. Keep the older shared Creator predicate intact.
  for (const studio of world.creatorStudios) {
    if (studio.personId !== player.id || studio.status !== 'active' || studio.country !== player.country || studio.city !== player.city) continue;
    const account = world.socialAccounts.find(item => item.id === studio.accountId);
    if (account?.ownerId === player.id && account.platform === creatorCatalog[studio.kind].platform && account.status === 'active') specialCareers.add(studio.kind);
  }
  if (world.businesses.some(business => business.ownerId === player.id && business.status === 'active' && business.country === player.country && business.city === player.city)) specialCareers.add('business');
  if (publicRoyalDuty(world)) specialCareers.add('royalty');
  return { specialCareers, present: storyPersonPresent(world, player), children, home, pets, hobbies, visited, condition };
}
export function lifeStoryBinding(context: ReturnType<typeof lifeStoryContexts>, template: EventTemplate) {
  return { child: template.child ? context.children[template.child] : undefined,
    pet: template.pet ? context.pets.find(pet => template.pet === 'any' || pet.species === template.pet) : undefined,
    hobby: template.hobby ? context.hobbies.find(hobby => template.hobby === 'any' || hobby.kind === template.hobby) : undefined,
  };
}
export function lifeStoryAvailable(context: ReturnType<typeof lifeStoryContexts>, template: EventTemplate) {
  const binding = lifeStoryBinding(context, template);
  return (!template.local || context.present) && (!template.child || !!binding.child) && (!template.home || !!context.home) && (!template.pet || !!binding.pet) && (!template.hobby || !!binding.hobby) && (!template.visited || !!context.visited) && (!template.chronicCondition || !!context.condition) && (!template.specialCareer || context.specialCareers.has(template.specialCareer));
}
