import { indexLedger } from '../ledgerIndex';
import { ageOn, compareDates, World } from '../model';
import { countries } from '../countries';
import { hobbyContent, outingContent } from '../content/leisure';
import { roundRatio } from '../money';
import { rules } from '../rules';
import { activeHobbyPlan, HobbyPlan, LeisureEffect } from './leisureSchemas';
import { hobbyFee } from './leisure';

export function validateLeisure(world: World, ledger = indexLedger(world.ledger)) {
  if (!world.hobbies.length && !world.leisureOutings.length) {
    if (ledger.categories('hobby', 'entertainment').length > 0) throw new Error('Leisure payment lacks its actual history'); return;
  }
  const month = (date: World['date']) => date.year * 12 + date.month - 1, now = month(world.date), ids = new Set<string>(), profiles = new Set<string>(), used = new Set<string>(), activeCounts = new Map<string, number>(), transactions = ledger.positioned;
  const aliveAt = (id: string, date: World['date']) => { const person = world.people[id]; return person && compareDates(person.born, date) <= 0 && (!person.died || compareDates(person.died, date) >= 0); };
  const permission = (personId: string, payerId: string, date: World['date'], consent: HobbyPlan['consent']) => {
    const person = world.people[personId], payer = world.people[payerId];
    if (!person || !payer || !aliveAt(personId, date) || !aliveAt(payerId, date) || compareDates(date, world.date) > 0 || ageOn({ ...payer, died: null }, date) < 18 || consent.accepted !== (consent.roll <= consent.chance)) throw new Error('Invalid leisure consent or participant');
    if (personId === payerId ? consent.strength !== null || consent.chance !== 100 || consent.roll !== 100 || ageOn({ ...person, died: null }, date) < 18 : ageOn({ ...person, died: null }, date) >= 18 || consent.strength === null || consent.chance !== Math.min(95, 45 + Math.floor(consent.strength / 2)) || !world.relationships.some(edge => edge.from === payerId && edge.to === personId && edge.roles.some(role => role === 'parent' || role === 'guardian')) && !world.custody.some(item => item.childId === personId && item.primaryId === payerId)) throw new Error('Leisure payer lacks the saved actual authority');
  };
  const payment = (id: string, personId: string, currency: string, paid: bigint, category: string, date: World['date'], cursor?: number) => {
    const entry = transactions.get(id), row = entry?.row;
    if (!row || used.has(id) || row.personId !== personId || row.currency !== currency || row.cashDelta !== -paid || row.debtDelta !== 0n || row.category !== category || row.year !== date.year || row.month !== date.month || cursor !== undefined && entry!.index !== cursor) throw new Error('Leisure payment does not reconcile with ledger'); used.add(id);
  };
  const effects = (actual: LeisureEffect[], deltas: Partial<Record<LeisureEffect['stat'], number>>) => {
    const keys = Object.keys(deltas); if (actual.length !== keys.length || new Set(actual.map(item => item.stat)).size !== actual.length) throw new Error('Leisure effects are incomplete');
    for (const effect of actual) if (!keys.includes(effect.stat) || effect.after !== Math.max(0, Math.min(100, effect.before + deltas[effect.stat]!))) throw new Error('Invalid bounded leisure effect');
  };
  for (const hobby of world.hobbies) {
    const person = world.people[hobby.personId], key = hobby.personId + ':' + hobby.kind;
    if (!person || ids.has(hobby.id) || profiles.has(key) || hobby.id !== 'hobby_' + person.id + '_' + hobby.kind || !hobby.plans.length) throw new Error('Invalid hobby identity'); ids.add(hobby.id); profiles.add(key);
    const plans = new Map(hobby.plans.map(plan => [plan.id, plan])), monthly = new Map<string, number>(), manualMonths = new Set<number>();
    let open = 0;
    for (const plan of hobby.plans) {
      if (ids.has(plan.id) || !plan.id.startsWith('hobby_plan_') || ageOn({ ...person, died: null }, plan.started) < hobbyContent[hobby.kind].minAge || plan.currency !== countries[plan.country].currency || plan.monthlyFee !== hobbyFee(plan.country, hobby.kind, plan.mode) || plan.lastMonth < month(plan.started) || plan.lastMonth > now) throw new Error('Invalid hobby arrangement'); ids.add(plan.id); permission(person.id, plan.payerId, plan.started, plan.consent);
      const requestKey = person.id + ':hobby-request:' + hobby.kind + ':' + plan.mode + ':' + plan.payerId + ':' + plan.started.year;
      if (plan.payerId === person.id ? !world.actionCounts[person.id + ':hobby-change:' + hobby.kind + ':' + month(plan.started)] : !world.actionCounts[requestKey]) throw new Error('Hobby arrangement lacks its saved request');
      if ((plan.status === 'declined') !== !plan.consent.accepted) throw new Error('Hobby consent differs from outcome');
      if (plan.status === 'active') {
        open++; activeCounts.set(person.id, (activeCounts.get(person.id) ?? 0) + 1); const payer = world.people[plan.payerId];
        if (plan.ended || plan.endReason || person.died || payer.died || person.country !== plan.country || person.city !== plan.city || plan.lastMonth !== now || payer.id !== person.id && (ageOn(person, world.date) >= 18 || !person.householdId || person.householdId !== payer.householdId || payer.country !== plan.country || payer.city !== plan.city)) throw new Error('Invalid active hobby arrangement');
      } else if (!plan.ended || !plan.endReason || compareDates(plan.ended, plan.started) < 0 || compareDates(plan.ended, world.date) > 0 || plan.lastMonth > month(plan.ended) || person.died && compareDates(plan.ended, person.died) > 0 || plan.status === 'declined' && compareDates(plan.ended, plan.started) !== 0 || plan.status === 'died' && (!person.died || compareDates(plan.ended, person.died) !== 0) || plan.status === 'adult-review' && (plan.payerId === person.id || ageOn({ ...person, died: null }, plan.ended) < 18)) throw new Error('Invalid hobby ending');
    }
    if (open > 1 || (activeCounts.get(person.id) ?? 0) > 2) throw new Error('Too many active hobby arrangements');
    const acceptedPlans = hobby.plans.filter(plan => plan.consent.accepted);
    for (let index = 1; index < acceptedPlans.length; index++) if (!acceptedPlans[index - 1].ended || compareDates(acceptedPlans[index - 1].ended!, acceptedPlans[index].started) > 0) throw new Error('Overlapping hobby arrangements');
    let proficiency = 0, attendedMonths = 0, lastDate = hobby.plans[0].started;
    for (const [index, row] of hobby.practices.entries()) {
      const plan = plans.get(row.planId), at = month(row.date);
      if (!plan || !plan.consent.accepted || row.sequence !== index || row.before !== proficiency || compareDates(row.date, plan.started) < 0 || compareDates(row.date, lastDate) < 0 || compareDates(row.date, world.date) > 0 || plan.ended && compareDates(row.date, plan.ended) > 0 || row.ledgerCursor > world.ledger.length || row.attended !== !row.reason || !aliveAt(person.id, row.date) || !aliveAt(plan.payerId, row.date)) throw new Error('Invalid actual hobby practice'); lastDate = row.date;
      if (row.source === 'monthly') {
        const count = (monthly.get(plan.id) ?? 0) + 1; monthly.set(plan.id, count);
        if (at !== month(plan.started) + count || row.due !== plan.monthlyFee) throw new Error('Hobby monthly cursor or quote is inconsistent');
      } else {
        if (manualMonths.has(at) || row.due !== 0n || !row.attended || !hobby.practices.some(prior => prior.sequence < row.sequence && prior.planId === plan.id && prior.source === 'monthly' && prior.attended && month(prior.date) === at)) throw new Error('Extra hobby practice lacks an attended month or was repeated'); manualMonths.add(at);
      }
      const gain = row.attended ? Math.min(100 - row.before, row.source === 'manual' ? 1 : plan.mode === 'lessons' ? 4 : 2) : 0;
      if (row.gain !== gain || row.after !== row.before + gain) throw new Error('Hobby proficiency lacks actual practice'); proficiency = row.after;
      if (!row.attended) {
        if (row.paid !== 0n || row.paymentId || row.effects.length || row.reason === 'funds' && row.available >= row.due) throw new Error('Paused hobby practice cannot charge or award effects');
      } else {
        if (row.available < row.due || row.paid !== row.due || row.paid > 0n && !row.paymentId || row.paid === 0n && row.paymentId) throw new Error('Hobby fee is not funded');
        if (row.paymentId) payment(row.paymentId, plan.payerId, plan.currency, row.paid, 'hobby', row.date, row.ledgerCursor);
        const deltas: Partial<Record<LeisureEffect['stat'], number>> = { energy: -(row.source === 'manual' || plan.mode === 'community' ? 2 : 4), happiness: 1, stress: -1 };
        if (row.source === 'monthly') { attendedMonths++; if (hobby.kind === 'guitar' && attendedMonths % 3 === 0) deltas.music = 1; if ((hobby.kind === 'chess' || hobby.kind === 'reading') && attendedMonths % 6 === 0) deltas.smarts = 1; }
        if (row.effects.find(effect => effect.stat === 'energy')!.before < -deltas.energy!) throw new Error('Hobby attendance lacks its required energy');
        effects(row.effects, deltas);
      }
    }
    if (hobby.proficiency !== proficiency) throw new Error('Hobby proficiency differs from its practice history');
    for (const plan of hobby.plans) if (plan.lastMonth !== month(plan.started) + (monthly.get(plan.id) ?? 0)) throw new Error('Hobby arrangement has missing or duplicate months');
    const current = activeHobbyPlan(hobby); if (current && !current.consent.accepted) throw new Error('Refused hobby cannot become active');
  }
  const outingMonths = new Set<string>();
  for (const outing of world.leisureOutings) {
    const person = world.people[outing.personId], key = outing.personId + ':' + outing.kind + ':' + month(outing.date), content = outingContent[outing.kind];
    if (!person || ids.has(outing.id) || outingMonths.has(key) || ageOn({ ...person, died: null }, outing.date) < content.minAge || outing.currency !== countries[outing.country].currency || outing.participants.join(',') !== (outing.payerId === person.id ? [person.id] : [person.id, outing.payerId]).join(',') || outing.quotedTotal !== roundRatio(rules[outing.country].baseWage * BigInt(content.feeBps), 10000n) * BigInt(outing.participants.length) || outing.available < outing.quotedTotal || !world.actionCounts[person.id + ':outing:' + outing.kind + ':' + month(outing.date)]) throw new Error('Invalid entertainment outing');
    ids.add(outing.id); outingMonths.add(key); permission(person.id, outing.payerId, outing.date, outing.consent);
    if (!outing.consent.accepted) { if (outing.paid !== 0n || outing.paymentId || outing.outcome || outing.effects.length) throw new Error('Refused outing cannot create attendance or payment'); }
    else {
      if (outing.paid !== outing.quotedTotal || !outing.paymentId || !outing.outcome) throw new Error('Accepted outing lacks its actual ticket payment/outcome'); payment(outing.paymentId, outing.payerId, outing.currency, outing.paid, 'entertainment', outing.date);
      const deltas: Partial<Record<LeisureEffect['stat'], number>> = { happiness: outing.outcome * 2, stress: -outing.outcome, energy: -content.energy }; if (outing.kind === 'museum') deltas.smarts = 1; if (outing.effects.find(effect => effect.stat === 'energy')?.before! < content.energy) throw new Error('Outing lacks the required energy'); effects(outing.effects, deltas);
    }
  }
  for (const row of ledger.categories('hobby', 'entertainment')) if (!used.has(row.id)) throw new Error('Leisure ledger entry lacks its actual attendance');
}
