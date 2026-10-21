import { ageOn, compareDates } from '../personHelpers';
import type { World } from '../model';
import { countries } from '../countries';
import { hobbyContent } from '../content/leisure';
import { hobbyEventApproachContent, hobbyEventChance, hobbyEventDeltas } from '../content/hobbyEvents';
import { indexLedger } from '../ledgerIndex';
import { hobbyEventFee } from './hobbyEvents';
import { validateLeisurePermission } from './leisureValidation';
export function validateHobbyEvents(world: World, ledger = indexLedger(world.ledger)) {
  if (!world.hobbyEvents.length) { if (ledger.categories('hobby-event').length) throw new Error('Hobby event payment lacks actual attendance'); return; }
  const used = new Set<string>(), ids = new Set<string>(), years = new Set<string>();
  const hobbies = new Map(world.hobbies.map(hobby => [hobby.id, hobby]));
  for (const row of world.hobbyEvents) {
    const person = world.people[row.personId], hobby = hobbies.get(row.hobbyId), plan = hobby?.plans.find(plan => plan.id === row.planId), key = row.personId + ':' + row.kind + ':' + row.date.year;
    if (!person || !hobby || hobby.personId !== row.personId || hobby.kind !== row.kind || !plan || !plan.consent.accepted || ids.has(row.id) || !/^hobby_event_\d+$/.test(row.id) || years.has(key) || compareDates(row.date, world.date) > 0 || compareDates(plan.started, row.date) > 0 || plan.ended && compareDates(plan.ended, row.date) < 0 || row.country !== plan.country || row.city !== plan.city || row.currency !== countries[row.country].currency || ageOn({ ...person, died: null }, row.date) < hobbyContent[row.kind].minAge || row.quotedFee !== hobbyEventFee(row.country, row.kind) || row.available < row.quotedFee || row.ledgerCursor > world.ledger.length) throw new Error('Invalid hobby event identity, date or quote');
    ids.add(row.id); years.add(key); validateLeisurePermission(world, row.personId, row.payerId, row.date, row.consent);
    const before = hobby.practices.slice(0, row.practiceCursor);
    if (row.practiceCursor > hobby.practices.length || before.some(practice => compareDates(practice.date, row.date) > 0) || hobby.practices[row.practiceCursor] && compareDates(hobby.practices[row.practiceCursor].date, row.date) < 0 || before.filter(practice => practice.source === 'monthly' && practice.attended).length < 12 || row.proficiency !== (before.at(-1)?.after ?? 0) || row.proficiency < 20 || row.chance !== hobbyEventChance(row.proficiency, row.discipline, row.approach)) throw new Error('Hobby event lacks its actual practice or chance');
    if (!row.consent.accepted) {
      if (row.paid !== 0n || row.paymentId || row.roll !== null || row.recognized || row.effects.length) throw new Error('Declined hobby event cannot create attendance, payment or effects');
      continue;
    }
    const payment = row.paymentId && ledger.positioned.get(row.paymentId), receipt = payment && payment.row;
    if (row.roll === null || row.recognized !== (row.roll <= row.chance) || row.paid !== row.quotedFee || !receipt || used.has(receipt.id) || payment.index !== row.ledgerCursor || receipt.personId !== row.payerId || receipt.currency !== row.currency || receipt.cashDelta !== -row.paid || receipt.debtDelta !== 0n || receipt.category !== 'hobby-event' || receipt.year !== row.date.year || receipt.month !== row.date.month) throw new Error('Hobby event outcome or payment does not reconcile');
    used.add(receipt.id);
    const deltas = hobbyEventDeltas(row.approach, row.recognized);
    if (row.effects.length !== 4 || new Set(row.effects.map(effect => effect.stat)).size !== 4 || (row.effects.find(effect => effect.stat === 'energy')?.before ?? 0) < hobbyEventApproachContent[row.approach].energy || row.effects.some(effect => effect.after !== Math.max(0, Math.min(100, effect.before + deltas[effect.stat])))) throw new Error('Hobby event has invalid bounded effects');
  }
  for (const receipt of ledger.categories('hobby-event')) if (!used.has(receipt.id)) throw new Error('Hobby event payment lacks actual attendance');
}
