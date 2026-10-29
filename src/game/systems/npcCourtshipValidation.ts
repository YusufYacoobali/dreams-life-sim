import { ageOn, compareDates } from '../personHelpers';
import type { World } from '../model';
import { monthFrom } from '../calendar';
import { countries } from '../countries';
import { rules } from '../rules';
import { roundRatio } from '../money';
import { indexLedger } from '../ledgerIndex';
import { npcWeddingChance } from './npcCourtshipSchemas';

export function validateNpcCourtships(world: World, ledger = indexLedger(world.ledger)) {
  const payments = ledger.categories('npc-wedding'), automatic = world.marriages.filter(row => row.id.startsWith('marriage_npc_'));
  if (!world.npcCourtships.length) { if (payments.length || automatic.length) throw new Error('NPC wedding lacks its actual courtship'); return; }
  const relationships = new Map(world.relationships.map(row => [row.id, row])), marriages = new Map(world.marriages.map(row => [row.id, row]));
  const ids = new Set<string>(), open = new Set<string>(), usedPayments = new Set<string>(), usedMarriages = new Set<string>(), years = new Set<number>();
  for (const row of world.npcCourtships) {
    const a = world.people[row.a], b = world.people[row.b], relation = relationships.get(row.relationshipId);
    if (!a || !b || row.a === row.b || !relation || relation.from !== row.a || relation.to !== row.b || ids.has(row.id) || !/^courtship_\d+_\d+$/.test(row.id) || compareDates(row.observedSince, row.lastChecked) > 0 || compareDates(row.lastChecked, world.date) > 0 || compareDates(relation.since, row.observedSince) > 0 || ageOn({ ...a, died: null }, row.observedSince) < rules[row.observedCountryA].adultAge || ageOn({ ...b, died: null }, row.observedSince) < rules[row.observedCountryB].adultAge || !!row.ended !== !!row.endReason || row.ended && (compareDates(row.ended, row.lastChecked) < 0 || compareDates(row.ended, world.date) > 0) || row.marriageId && row.ended) throw new Error('Invalid NPC courtship identity or clock');
    ids.add(row.id);
    if (!row.ended && !row.marriageId) { if (open.has(row.relationshipId)) throw new Error('Duplicate current NPC courtship'); open.add(row.relationshipId); }
    let acceptedId: string | null = null, previous = row.observedSince;
    for (const proposal of row.proposals) {
      const fee = roundRatio(rules[proposal.country].baseWage, 100n);
      if (acceptedId || years.has(proposal.date.year) || world.actionCounts['npc-courtships:' + proposal.date.year] !== 1 || compareDates(proposal.date, previous) < 0 || compareDates(proposal.date, row.lastChecked) > 0 || compareDates(monthFrom(row.observedSince, 24, row.observedSince.day), proposal.date) > 0 || proposal.currency !== countries[proposal.country].currency || !proposal.city || proposal.fee !== fee || proposal.shareA !== (fee + 1n) / 2n || proposal.shareB !== fee / 2n || proposal.availableA < proposal.shareA || proposal.availableB < proposal.shareB || proposal.wealthA.currency !== proposal.currency || proposal.wealthB.currency !== proposal.currency || proposal.chance !== npcWeddingChance(proposal.trust) || proposal.accepted !== (proposal.rollA <= proposal.chance && proposal.rollB <= proposal.chance) || proposal.ledgerCursor > world.ledger.length) throw new Error('Invalid NPC wedding time, consent or quote');
      years.add(proposal.date.year); previous = proposal.date;
      if (!proposal.accepted) { if (proposal.paymentAId || proposal.paymentBId || proposal.marriageId) throw new Error('Declined NPC wedding cannot charge or marry'); continue; }
      const marriage = proposal.marriageId && marriages.get(proposal.marriageId);
      if (!marriage || !/^marriage_npc_\d+_\d+$/.test(marriage.id) || usedMarriages.has(marriage.id) || marriage.a !== row.a || marriage.b !== row.b || compareDates(marriage.started, proposal.date) !== 0 || marriage.weddingCost?.minor !== fee || marriage.weddingCost.currency !== proposal.currency || marriage.ledgerStart !== proposal.ledgerCursor + 2 || marriage.baselineA.currency !== proposal.currency || marriage.baselineB.currency !== proposal.currency || marriage.baselineA.minor !== proposal.wealthA.minor - proposal.shareA || marriage.baselineB.minor !== proposal.wealthB.minor - proposal.shareB) throw new Error('NPC wedding does not bind its real marriage and after-fee baselines');
      for (const [id, personId, share, offset] of [[proposal.paymentAId, row.a, proposal.shareA, 0], [proposal.paymentBId, row.b, proposal.shareB, 1]] as const) {
        const payment = id && ledger.positioned.get(id), receipt = payment && payment.row;
        if (!receipt || usedPayments.has(receipt.id) || payment.index !== proposal.ledgerCursor + offset || receipt.personId !== personId || receipt.currency !== proposal.currency || receipt.category !== 'npc-wedding' || receipt.cashDelta !== -share || receipt.debtDelta !== 0n || receipt.liabilityId !== null || receipt.year !== proposal.date.year || receipt.month !== proposal.date.month) throw new Error('NPC wedding payment does not bind both actual payers');
        usedPayments.add(receipt.id);
      }
      if (!marriage.ended && (relation.romance !== 'married' || !relation.roles.includes('spouse'))) throw new Error('Current NPC marriage lacks its spousal relationship');
      usedMarriages.add(marriage.id); acceptedId = marriage.id;
    }
    if (acceptedId !== row.marriageId) throw new Error('NPC courtship marriage differs from its accepted wedding');
  }
  if (payments.some(row => !usedPayments.has(row.id)) || automatic.some(row => !usedMarriages.has(row.id))) throw new Error('NPC wedding has orphan payments or marriage');
}
