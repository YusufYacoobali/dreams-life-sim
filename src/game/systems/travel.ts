import { z } from 'zod';
import type { Person, World } from '../model';
import { ageOn, fullName } from '../personHelpers';
import { countries } from '../countries';
import { destinationIds, destinations, DestinationId, tripFocuses } from '../content/travel';
import { monthFrom } from '../calendar';
import { convertMoney, formatMoney, roundRatio } from '../money';
import { rules } from '../rules';
import { fxRate } from '../valuation';
import { IneligibleAction } from '../errors';
import { active, availableCash, accountFor, bounded, charge, draw, fact, post, result } from './common';
import { activeTrip, samePhysicalPlace, tripSchema } from './travelSchemas';
import { serviceAway, serviceCareer } from './serviceSchemas';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { publicRoyalDuty } from './royaltySchemas';
import { fullTimeCreator } from './creatorSchemas';
import { recordingCommitment } from './musicSchemas';
import { campaignCommitment } from './politicsSchemas';
import { businessManager } from './businesses';
import { offerPending } from '../pendingQueue';

type Trip = z.infer<typeof tripSchema>;
export type TripDuration = 1 | 3 | 12;
const absolute = (world: World) => world.date.year * 12 + world.date.month - 1;
export const travelCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('book-trip'), destinationId: z.enum(destinationIds), duration: z.union([z.literal(1), z.literal(3), z.literal(12)]), companionIds: z.array(z.string()).max(11), focus: z.enum(tripFocuses), quotedTotal: z.bigint().positive() }),
  z.object({ type: z.literal('trip-focus'), tripId: z.string(), focus: z.enum(tripFocuses) }),
  z.object({ type: z.literal('return-trip'), tripId: z.string() }),
]);
export type TravelCommand = z.infer<typeof travelCommandSchema>;

/** An external package is quoted and paid once in the organiser's residence currency. */
export function tripQuote(world: World, destinationId: DestinationId, months: TripDuration, companionIds: string[] = []) {
  const person = active(world), destination = destinations[destinationId], currency = countries[person.country].currency, destinationCurrency = countries[destination.country].currency;
  const people = [person.id, ...new Set(companionIds)].map(id => world.people[id]);
  if (people.some(item => !item)) throw new IneligibleAction('Choose existing companions');
  const partyWeight = people.reduce((sum, item) => sum + (ageOn(item, world.date) < 18 ? 7500 : 10000), 0);
  const transport = roundRatio(rules[person.country].baseWage * BigInt(destination.country === person.country ? 200 : 400) * BigInt(partyWeight), 100000000n);
  const accommodationNative = roundRatio(rules[destination.country].livingCost * 3n * BigInt(months) * BigInt(partyWeight), 20000n);
  const rate = fxRate(world, destinationCurrency, currency), accommodation = convertMoney({ minor: accommodationNative, currency: destinationCurrency }, currency, rate.numerator, rate.denominator).minor;
  const exchangeFee = currency === destinationCurrency ? 0n : (accommodation + 99n) / 100n;
  return { currency, destinationCurrency, months, partyWeight, transport, accommodationNative, rate, accommodation, exchangeFee, total: transport + accommodation + exchangeFee };
}

function personalTravelReason(world: World, person: Person, duration: TripDuration): string | undefined {
  if (person.died || isConfined(world, person) || person.legal.wanted) return 'Travel requires being alive, outside custody and free of active pursuit';
  if (activeTrip(world, person.id) || serviceAway(world, person.id)) return 'Finish the existing trip or assignment first';
  if (hospitalized(world, person) || person.stats.health < 35) return 'Recover your health before travel';
  if (world.pregnancies.some(item => item.carrierId === person.id && item.status === 'pregnant')) return 'Wait until after the pregnancy before this extended trip';
  if (world.cases.some(item => item.personId === person.id && item.status === 'awaiting-trial')) return 'Resolve the current court case before travel';
  if (serviceCareer(world, person.id) || world.careers.some(item => item.personId === person.id && item.status === 'active')) return 'Finish or leave the current special-career contract before travel';
  if (publicRoyalDuty(world, person.id)) return 'Choose a private royal life before taking a trip';
  if (fullTimeCreator(world, person.id)) return 'Switch your studio to part-time before travel';
  if (recordingCommitment(world, person.id) || campaignCommitment(world, person.id)) return 'Finish or cancel the recording or campaign before travel';
  if (duration > 1 && (person.employment || person.education.stage !== 'none')) return 'Extended travel and gap years require leaving work and current study first';
  if (person.employment?.companyId) {
    const company = world.businesses.find(item => item.id === person.employment!.companyId);
    if (company?.ownerId === person.id && company.ownerOperated && !businessManager(world, company)) return 'Appoint a working manager before leaving your company';
  }
}
export function parentOf(world: World, adultId: string, childId: string) {
  return world.relationships.some(item => item.from === adultId && item.to === childId && item.roles.some(role => role === 'parent' || role === 'guardian')) || world.custody.some(item => !item.ended && item.childId === childId && item.primaryId === adultId);
}
export function homeCareReason(world: World, person: Person, participantIds: string[]): string | undefined {
  const household = world.households.find(item => item.id === person.householdId);
  for (const child of (household?.members ?? []).map(id => world.people[id]).filter(item => !item.died && !isConfined(world, item) && ageOn(item, world.date) < 18 && !participantIds.includes(item.id))) {
    const carer = household!.members.some(id => !participantIds.includes(id) && !world.people[id].died && ageOn(world.people[id], world.date) >= 18 && parentOf(world, id, child.id) && !isConfined(world, world.people[id]) && !serviceAway(world, id) && !activeTrip(world, id) && !hospitalized(world, world.people[id]));
    if (!carer) return 'Bring ' + child.firstName + ' or arrange an existing available parent or guardian at home';
  }
}
export function approvals(world: World, participantIds: string[]) {
  const organizerId = world.activePersonId, approvals: { personId: string; forPersonId: string }[] = [];
  for (const id of participantIds) {
    const person = world.people[id];
    if (id !== organizerId && ageOn(person, world.date) >= 18) approvals.push({ personId: id, forPersonId: id });
    if (ageOn(person, world.date) < 18) for (const parent of Object.values(world.people).filter(item => !item.died && item.id !== organizerId && !participantIds.includes(item.id) && parentOf(world, item.id, id))) approvals.push({ personId: parent.id, forPersonId: id });
  }
  return approvals;
}
const consentKey = (world: World, personId: string, forPersonId: string) => world.activePersonId + ':trip-consent:' + world.date.year + ':' + personId + ':' + forPersonId;
export function tripReason(world: World, destinationId: DestinationId, duration: TripDuration, companionIds: string[] = []): string | undefined {
  const person = active(world), destination = destinations[destinationId], participantIds = [person.id, ...companionIds];
  if (ageOn(person, world.date) < 18) return 'Book your own travel from age eighteen';
  if (new Set(participantIds).size !== participantIds.length || participantIds.length > 12) return 'Choose each companion once, with at most twelve people in the party';
  if (world.date.year * 12 + world.date.month - 1 + duration >= 12000000) return 'This trip extends beyond the supported calendar';
  if (destination.country === person.country && destination.city === person.city) return 'You already live here; choose another destination';
  for (const id of participantIds) {
    const member = world.people[id]; if (!member) return 'Choose existing companions';
    const reason = personalTravelReason(world, member, duration); if (reason) return (id === person.id ? '' : member.firstName + ': ') + reason;
    if (id !== person.id && (member.householdId !== person.householdId || !samePhysicalPlace(world, person.id, id))) return 'Companions must currently share your household and home city';
    if (ageOn(member, world.date) < 18 && !parentOf(world, person.id, id)) return 'Only your existing children or wards can travel as minors';
  }
  for (const company of world.businesses.filter(item => item.status === 'active' && item.ownerId === person.id && item.ownerOperated)) {
    const manager = businessManager(world, company); if (!manager || participantIds.includes(manager.personId) || hospitalized(world, world.people[manager.personId]) || activeTrip(world, manager.personId) || serviceAway(world, manager.personId)) return 'Keep an available manager at home before leaving your company';
  }
  const careReason = homeCareReason(world, person, participantIds); if (careReason) return careReason;
  for (const approval of approvals(world, participantIds)) if (world.actionCounts[consentKey(world, approval.personId, approval.forPersonId)]) return 'You already requested this person’s travel consent this calendar year';
  if (tripQuote(world, destinationId, duration, companionIds).total > availableCash(accountFor(world))) return 'Your available balance cannot cover this trip';
}

export function unusedTripRefund(trip: Trip) {
  return trip.status === 'active' ? trip.quote.accommodation * BigInt(trip.duration - trip.periods.length) / (BigInt(trip.duration) * 2n) : 0n;
}
function endTrip(world: World, trip: Trip, status: 'completed' | 'returned' | 'interrupted', reason: string, refund = 0n) {
  trip.status = status; trip.ended = { ...world.date }; trip.endReason = reason;
  if (refund) { post(world, refund, 0n, 'travel-refund', 'Unused accommodation refund', null, world.people[trip.organizerId], trip.quote.currency); trip.refund = refund; trip.refundTransactionId = world.ledger.at(-1)!.id; }
  const destination = destinations[trip.destinationId];
  for (const id of trip.participantIds) if (!world.people[id].died) fact(world, status === 'completed' ? 'I completed a ' + trip.duration + '-month trip to ' + destination.city + '.' : 'My trip to ' + destination.city + ' ended early. ' + reason, status === 'completed' ? 'travel' : 'travel-return', '', id);
  if (trip.participantIds.includes(world.activePersonId) && !active(world).died) {
    offerPending(world, { kind: 'result', id: 'trip_end_' + trip.id, title: status === 'completed' ? 'Back from ' + destination.city : 'Your trip ended early', body: reason + (refund ? ' Unused accommodation refund: ' + formatMoney({ minor: refund, currency: trip.quote.currency }) + '.' : '') + ' You are back in ' + trip.originCity + '.', illustration: 'travel', effects: [] }, 45);
    if (world.annual?.stage === 'months') world.annual.pausedForPlanning = true;
  }
}
/** Called after decisions and before death's household/estate work. */
export function refreshTrips(world: World) {
  for (const trip of world.trips.filter(item => item.status === 'active')) {
    const interrupted = trip.participantIds.find(id => world.people[id].died || isConfined(world, world.people[id]) || world.people[id].legal.wanted || hospitalized(world, world.people[id]) || world.cases.some(item => item.personId === id && item.status === 'awaiting-trial'));
    if (interrupted) endTrip(world, trip, 'interrupted', fullName(world.people[interrupted]) + ' could no longer continue the trip. The party returned; the prepaid package is not refunded.');
    else { const careReason = homeCareReason(world, world.people[trip.organizerId], trip.participantIds); if (careReason) endTrip(world, trip, 'interrupted', 'Your child needed an available caregiver at home. The party returned; the prepaid package is not refunded.'); }
  }
}
export function resolveTravel(world: World, command: TravelCommand) {
  if (command.type === 'book-trip') {
    const reason = tripReason(world, command.destinationId, command.duration, command.companionIds); if (reason) throw new IneligibleAction(reason);
    const quote = tripQuote(world, command.destinationId, command.duration, command.companionIds); if (quote.total !== command.quotedTotal) throw new IneligibleAction('Review the current travel quote');
    const person = active(world), participantIds = [person.id, ...command.companionIds], consents: Trip['consents'] = [{ personId: person.id, forPersonId: person.id, accepted: true, roll: 100 }];
    for (const approval of approvals(world, participantIds)) {
      world.actionCounts[consentKey(world, approval.personId, approval.forPersonId)] = 1;
      const relation = world.relationships.find(item => item.from === person.id && item.to === approval.personId || item.to === person.id && item.from === approval.personId), roll = draw(world, 'npcs', 1, 100), chance = Math.min(95, 45 + Math.floor((relation?.strength ?? 20) / 2));
      consents.push({ ...approval, roll, accepted: !isConfined(world, world.people[approval.personId]) && !world.people[approval.personId].legal.wanted && roll <= chance });
    }
    const accepted = consents.every(item => item.accepted), trip: Trip = { id: 'trip_' + world.revision + '_' + world.trips.length, organizerId: person.id, participantIds, consents, destinationId: command.destinationId, originCountry: person.country, originCity: person.city, started: { ...world.date }, expectedReturn: monthFrom(world.date, command.duration, world.calendarAnchorDay), anchorDay: world.calendarAnchorDay, ended: accepted ? null : { ...world.date }, duration: command.duration, status: accepted ? 'active' : 'declined', focus: command.focus, quote, paid: 0n, refund: 0n, chargeTransactionId: null, refundTransactionId: null, lastMonth: absolute(world), endReason: accepted ? null : 'The requested party did not all consent.', leave: [], periods: [] };
    world.trips.push(trip);
    if (!accepted) { const declined = [...new Set(consents.filter(item => !item.accepted).map(item => fullName(world.people[item.personId])))].join(', '); fact(world, 'My proposed trip to ' + destinations[command.destinationId].city + ' fell through. ' + declined + ' did not agree to the party.', 'travel-plan'); result(world, 'The party did not agree', declined + ' did not agree to the proposed trip. No booking was made and no money was charged. You can travel alone; these approvals can be requested again next calendar year.', 'travel'); return; }
    charge(world, quote.total, 'travel', 'Prepaid trip to ' + destinations[command.destinationId].city); trip.paid = quote.total; trip.chargeTransactionId = world.ledger.at(-1)!.id;
    for (const id of participantIds) {
      const member = world.people[id], job = member.employment;
      if (job) { const year = monthFrom(world.date, 1, world.calendarAnchorDay).year, key = id + ':paid-travel-leave:' + year, paid = job.paidMonths >= 12 && !world.actionCounts[key]; trip.leave.push({ personId: id, employmentId: job.id, paid, used: false, monthsAtDeparture: job.paidMonths, year }); }
      fact(world, 'I arrived in ' + destinations[command.destinationId].city + ' for a planned ' + command.duration + '-month trip.', 'travel-arrival', '', id);
    }
    result(world, 'Welcome to ' + destinations[command.destinationId].city, 'Your party has arrived. The package is paid; normal home bills continue. Work leave and study absence apply only as the actual months pass. Your residence and nationality are unchanged.', 'travel');
    return;
  }
  const trip = world.trips.find(item => item.id === command.tripId && item.organizerId === world.activePersonId && item.status === 'active'); if (!trip) throw new IneligibleAction('Choose your current trip');
  if (command.type === 'trip-focus') { trip.focus = command.focus; result(world, 'Holiday plans updated', 'Your new plan starts with the next month.', 'travel'); }
  else endTrip(world, trip, 'returned', 'You returned before the planned end. Half the unused accommodation value is refundable; transport, conversion fees and used accommodation are not.', unusedTripRefund(trip));
}

export function travelMonth(world: World) {
  refreshTrips(world); const month = absolute(world);
  for (const trip of world.trips.filter(item => item.status === 'active')) {
    if (trip.lastMonth >= month) continue;
    if (trip.lastMonth !== month - 1) throw new Error('Travel must advance through actual monthly periods');
    trip.lastMonth = month;
    const weatherRoll = draw(world, 'outcomes', 1, 100), weather = weatherRoll <= 50 ? 'clear' as const : weatherRoll <= 75 ? 'cloud' as const : 'rain' as const, responseRoll = draw(world, 'outcomes', 1, 100);
    const changes = trip.participantIds.map(id => {
      const stats = world.people[id].stats, before = { ...stats }, happiness = (trip.focus === 'rest' ? 2 : 3) + (responseRoll >= 85 ? 1 : 0) - (weather === 'rain' && trip.focus === 'sightseeing' ? 1 : 0);
      stats.happiness = bounded(stats.happiness + happiness); stats.stress = bounded(stats.stress - (trip.focus === 'rest' ? 4 : 2)); stats.energy = bounded(stats.energy + (trip.focus === 'rest' ? 6 : trip.focus === 'food' ? 1 : -2)); if (trip.focus === 'sightseeing') stats.smarts = bounded(stats.smarts + 1);
      return { personId: id, happiness: stats.happiness - before.happiness, stress: stats.stress - before.stress, energy: stats.energy - before.energy, smarts: stats.smarts - before.smarts };
    });
    trip.periods.push({ month, focus: trip.focus, weather, responseRoll, changes });
    if (trip.periods.length === trip.duration) endTrip(world, trip, 'completed', 'You spent ' + trip.duration + ' actual calendar month' + (trip.duration === 1 ? '' : 's') + ' away. The trip is complete, and the remaining year can continue when you are ready.');
  }
}
