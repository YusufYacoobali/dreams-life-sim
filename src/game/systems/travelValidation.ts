import type { World } from '../model';
import { ageOn, compareDates } from '../model';
import { monthFrom } from '../calendar';
import { countries } from '../countries';
import { destinations } from '../content/travel';
import { convertMoney } from '../money';

export function validateTravel(world: World) {
  const month = world.date.year * 12 + world.date.month - 1, ids = new Set<string>(), activePeople = new Set<string>(), transactions = new Map(world.ledger.map(item => [item.id, item])), used = new Set<string>(), paidLeave = new Set<string>();
  for (const trip of world.trips) {
    const organizer = world.people[trip.organizerId], destination = destinations[trip.destinationId], start = trip.started.year * 12 + trip.started.month - 1, quote = trip.quote;
    if (ids.has(trip.id) || !organizer || ageOn({ ...organizer, died: null }, trip.started) < 18 || !trip.participantIds.includes(trip.organizerId) || new Set(trip.participantIds).size !== trip.participantIds.length || trip.participantIds.some(id => !world.people[id] || compareDates(world.people[id].born, trip.started) > 0 || world.people[id].died && compareDates(world.people[id].died!, trip.started) < 0) || compareDates(trip.started, world.date) > 0 || compareDates(trip.expectedReturn, monthFrom(trip.started, trip.duration, trip.anchorDay)) !== 0 || trip.lastMonth !== start + trip.periods.length || trip.lastMonth > month || (trip.status === 'active') !== (trip.ended === null) || trip.ended && (compareDates(trip.ended, trip.started) < 0 || compareDates(trip.ended, world.date) > 0) || (trip.status === 'declined') !== trip.consents.some(item => !item.accepted) || trip.status === 'completed' && trip.periods.length !== trip.duration || trip.status !== 'completed' && trip.periods.length >= trip.duration || trip.status === 'declined' && trip.periods.length) throw new Error('Invalid trip identity, dates or completion');
    ids.add(trip.id);
    if (trip.status === 'active') for (const id of trip.participantIds) {
      const person = world.people[id];
      if (activePeople.has(id) || person.died || person.country !== trip.originCountry || person.city !== trip.originCity || trip.lastMonth !== month) throw new Error('Invalid active traveller');
      activePeople.add(id);
    }
    const consentKeys = new Set<string>();
    for (const consent of trip.consents) {
      const key = consent.personId + ':' + consent.forPersonId;
      if (consentKeys.has(key) || !world.people[consent.personId] || !trip.participantIds.includes(consent.forPersonId) || ageOn({ ...world.people[consent.personId], died: null }, trip.started) < 18) throw new Error('Invalid trip consent');
      consentKeys.add(key);
    }
    if (!trip.consents.some(item => item.personId === trip.organizerId && item.forPersonId === trip.organizerId && item.accepted) || trip.participantIds.some(id => id !== trip.organizerId && ageOn({ ...world.people[id], died: null }, trip.started) >= 18 && !consentKeys.has(id + ':' + id))) throw new Error('Missing adult travel consent');
    const weight = trip.participantIds.reduce((sum, id) => sum + (ageOn({ ...world.people[id], died: null }, trip.started) < 18 ? 7500 : 10000), 0), accommodation = convertMoney({ minor: quote.accommodationNative, currency: quote.destinationCurrency }, quote.currency, quote.rate.numerator, quote.rate.denominator).minor, fee = quote.currency === quote.destinationCurrency ? 0n : (accommodation + 99n) / 100n;
    if (quote.currency !== countries[trip.originCountry].currency || quote.destinationCurrency !== countries[destination.country].currency || quote.months !== trip.duration || quote.partyWeight !== weight || quote.accommodation !== accommodation || quote.exchangeFee !== fee || quote.total !== quote.transport + accommodation + fee || trip.paid !== (trip.status === 'declined' ? 0n : quote.total) || trip.refund !== (trip.status === 'returned' ? quote.accommodation * BigInt(trip.duration - trip.periods.length) / (BigInt(trip.duration) * 2n) : 0n)) throw new Error('Trip package or refund does not reconcile');
    for (const [id, amount, category] of [[trip.chargeTransactionId, -trip.paid, 'travel'], [trip.refundTransactionId, trip.refund, 'travel-refund']] as const) {
      const entry = id && transactions.get(id);
      if (amount === 0n ? id !== null : !id || used.has(id) || !entry || entry.personId !== trip.organizerId || entry.currency !== quote.currency || entry.cashDelta !== amount || entry.debtDelta !== 0n || entry.category !== category || entry.year * 12 + entry.month - 1 !== (category === 'travel' ? start : trip.ended!.year * 12 + trip.ended!.month - 1)) throw new Error('Trip payment does not reconcile to its ledger');
      if (id) used.add(id);
    }
    const leavePeople = new Set<string>();
    for (const leave of trip.leave) {
      const history = world.workHistory.find(item => item.id === leave.employmentId && item.personId === leave.personId);
      if (leavePeople.has(leave.personId) || !trip.participantIds.includes(leave.personId) || !history || compareDates(history.started, trip.started) > 0 || history.monthsWorked < leave.monthsAtDeparture || leave.year !== monthFrom(trip.started, 1, trip.anchorDay).year || leave.used && (!leave.paid || history.monthsWorked <= leave.monthsAtDeparture || !world.actionCounts[leave.personId + ':paid-travel-leave:' + leave.year] || trip.ended && trip.ended.year * 12 + trip.ended.month - 1 <= start) || leave.paid && (trip.duration !== 1 || leave.monthsAtDeparture < 12)) throw new Error('Invalid travel leave');
      if (leave.used) { const key = leave.personId + ':' + leave.year; if (paidLeave.has(key)) throw new Error('Duplicate paid travel leave'); paidLeave.add(key); }
      leavePeople.add(leave.personId);
    }
    for (let index = 0; index < trip.periods.length; index++) {
      const period = trip.periods[index], people = new Set<string>();
      if (period.month !== start + index + 1 || period.changes.length !== trip.participantIds.length) throw new Error('Trip periods do not reconcile');
      for (const change of period.changes) {
        const happiness = (period.focus === 'rest' ? 2 : 3) + (period.responseRoll >= 85 ? 1 : 0) - (period.weather === 'rain' && period.focus === 'sightseeing' ? 1 : 0), stress = period.focus === 'rest' ? 4 : 2, energy = period.focus === 'rest' ? 6 : period.focus === 'food' ? 1 : -2;
        if (people.has(change.personId) || !trip.participantIds.includes(change.personId) || change.happiness < 0 || change.happiness > happiness || change.stress < -stress || change.stress > 0 || change.energy < Math.min(0, energy) || change.energy > Math.max(0, energy) || change.smarts < 0 || change.smarts > (period.focus === 'sightseeing' ? 1 : 0)) throw new Error('Invalid recorded travel experience');
        people.add(change.personId);
      }
    }
  }
}
