import type { World, Person } from '../model';
import { assetCatalog } from '../content/assets';
import { rules } from '../rules';
import { countries } from '../countries';
import { ageOn, fullName } from '../personHelpers';
import { IneligibleAction } from '../errors';
import { fact } from './common';
import { createContact } from './npcs';
import { isConfined } from './legalSchemas';
import { activeTrip } from './travelSchemas';
import { serviceAway } from './serviceSchemas';

type Asset = World['assets'][number];
const availableOwner = (world: World, person: Person | undefined) => !!person && person.id !== world.activePersonId && !person.died && ageOn(person, world.date) >= Math.max(18, rules[person.country].adultAge) && person.country === world.people[world.activePersonId].country && person.city === world.people[world.activePersonId].city && !isConfined(world, person) && !activeTrip(world, person.id) && !serviceAway(world, person.id) && person.health.hospitalizedUntil === null;
export function theftTargetVehicle(world: World, ownerId?: string): Asset {
  const asset = world.assets.find(item => item.kind === 'vehicle' && !!item.ownerId && item.ownerId !== world.activePersonId && (!ownerId || item.ownerId === ownerId) && !item.stolen && !item.mortgageId && item.condition > 0 && availableOwner(world, world.people[item.ownerId]) && item.country === world.people[world.activePersonId].country && item.city === world.people[world.activePersonId].city);
  if (asset) return asset;
  if (ownerId) throw new IneligibleAction('Choose an available adult with a recorded lawful vehicle in your city');
  // A new external owner's opening property is explicit. Never invent a car for
  // a named relative or contact, and never mint a second copy of an existing car.
  const person = createContact(world, { age: 35 }), offer = assetCatalog.find(item => item.id === 'used-compact')!;
  const value = rules[person.country].baseWage * BigInt(offer.priceBps) / 10000n;
  const registered: Asset = { id: 'registered_vehicle_' + person.id, ownerId: person.id, catalogId: offer.id,
    kind: 'vehicle', name: offer.name, country: person.country, city: person.city, currency: countries[person.country].currency,
    pricePaid: 0n, costBasis: 0n, value, condition: offer.condition, ageMonths: 0, acquired: { ...world.date },
    mortgageId: null, primaryHome: false, rental: 'none', rentPerMonth: 0n, upkeepBps: offer.upkeepBps, insured: false,
    listing: null, ownershipSource: 'legacy', titleSince: { ...world.date },
    provenance: ['Opening vehicle registered to ' + fullName(person) + '. Earlier purchase payment is not recorded.'],
  };
  world.assets.push(registered);
  return registered;
}
/** The same registered asset changes possession; no purchase or cash reward occurs. */
export function recordStolenVehicle(world: World, incident: World['incidents'][number], registeredOwner: Person, asset: Asset): Asset {
  if (incident.offence !== 'vehicle-theft' || incident.victimId !== registeredOwner.id || incident.gain.minor !== 0n || incident.personId === registeredOwner.id || asset.ownerId !== registeredOwner.id || asset.kind !== 'vehicle' || asset.stolen || asset.ownershipSource === 'theft' || asset.mortgageId || !world.assets.includes(asset))
    throw new IneligibleAction('A stolen vehicle needs its actual registered asset, theft incident and owner');
  if (world.assets.some(item => item.stolen?.incidentId === incident.id)) throw new IneligibleAction('This theft already has a vehicle record');
  asset.stolen = { rulesVersion: 1, incidentId: incident.id, thiefId: incident.personId, registeredOwnerId: registeredOwner.id,
    status: 'held', resolved: null, originalTitle: { ownershipSource: asset.ownershipSource, titleSince: { ...asset.titleSince }, pricePaid: asset.pricePaid, costBasis: asset.costBasis } };
  incident.stolenVehicle = { rulesVersion: 1, assetId: asset.id };
  asset.ownerId = incident.personId; asset.ownershipSource = 'theft'; asset.titleSince = { ...world.date };
  asset.pricePaid = 0n; asset.costBasis = 0n; asset.insured = false;
  asset.provenance.push('Stolen from ' + fullName(registeredOwner) + ' by ' + fullName(world.people[incident.personId]) + ' in ' + world.date.year + '. No purchase payment or lawful title.');
  return asset;
}
export function recoverStolenVehicle(world: World, asset: Asset, status: 'recovered' | 'seized') {
  const theft = asset.stolen;
  if (!theft || theft.status !== 'held' || asset.ownerId !== theft.thiefId) throw new IneligibleAction('This stolen vehicle is no longer held');
  if (status === 'recovered' && world.people[theft.registeredOwnerId].died) status = 'seized';
  asset.ownerId = status === 'recovered' ? theft.registeredOwnerId : null; asset.insured = false;
  if (status === 'recovered') {
    asset.ownershipSource = theft.originalTitle.ownershipSource; asset.titleSince = { ...theft.originalTitle.titleSince };
    asset.pricePaid = theft.originalTitle.pricePaid; asset.costBasis = theft.originalTitle.costBasis;
  }
  theft.status = status; theft.resolved = { ...world.date };
  const text = status === 'recovered'
    ? 'I returned ' + asset.name + ' to its registered owner, ' + fullName(world.people[theft.registeredOwnerId]) + '. The theft investigation remained on record.'
    : 'The authorities seized the stolen ' + asset.name + '. It could not be sold or inherited.';
  asset.provenance.push(text);
  fact(world, text, 'assets', '', theft.thiefId);
}
export function seizeStolenVehicles(world: World, personId: string) {
  for (const asset of world.assets)
    if (asset.ownerId === personId && asset.stolen?.status === 'held') recoverStolenVehicle(world, asset, 'seized');
}
export function stolenAssetReason(asset: Asset) {
  return asset.stolen && asset.stolen.status !== 'recovered' ? 'Stolen property has no lawful title; return it rather than sell or insure it' : undefined;
}
