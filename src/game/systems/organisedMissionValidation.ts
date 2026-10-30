import type { World } from '../model';
import type { LedgerIndex } from '../ledgerIndex';
import type { OrganisedMissionResult } from './organisedMissionSchemas';
import { organisedMissions } from '../content/organisedCrime';
const dateKey = (date: World['date']) => date.year * 372 + date.month * 31 + date.day;
export function sameMissionResult(a: OrganisedMissionResult, b: OrganisedMissionResult) {
  return a.rulesVersion === b.rulesVersion && a.outcome === b.outcome && a.loss === b.loss && a.lossTransactionId === b.lossTransactionId && a.proceedsTransactionId === b.proceedsTransactionId && a.victimId === b.victimId && a.victimTransactionId === b.victimTransactionId && a.rivalId === b.rivalId && a.memberId === b.memberId && a.scandalId === b.scandalId && a.reputationDelta === b.reputationDelta && a.successChance === b.successChance && a.title === b.title && a.body === b.body &&
    a.crew.length === b.crew.length && a.crew.every((member, i) => member.personId === b.crew[i].personId && member.loyalty === b.crew[i].loyalty && member.skill === b.crew[i].skill) &&
    (a.cargo === null ? b.cargo === null : !!b.cargo && a.cargo.id === b.cargo.id && a.cargo.description === b.cargo.description && a.cargo.status === b.cargo.status);
}
/** Includes archived assignments: their legal and financial facts remain verifiable. */
export function validateOrganisedMissionIncidents(world: World, ledger: LedgerIndex) {
  const gangs = new Map(world.gangs.map(gang => [gang.id, gang])), seenPayments = new Set<string>();
  const controversies = new Map(world.controversies.map(item => [item.id, item]));
  for (const incident of world.incidents) {
    const saved = incident.organisedMission;
    if (!saved) continue;
    const gang = gangs.get(saved.gangId), state = gang?.organised, facts = saved.result;
    const mission = organisedMissions.find(item => item.id === saved.category);
    const success = ['quiet-profit', 'exposed-profit', 'victim-complaint'].includes(saved.outcome);
    const allowed = saved.style === 'street-syndicate' ? ['quiet-profit', 'exposed-profit', 'costly-respect', 'rival-advance'] : saved.style === 'fraud-network' ? ['quiet-profit', 'victim-complaint', 'collapsed-scheme', 'public-scandal'] : ['quiet-profit', 'exposed-profit', 'cargo-confiscation', 'associate-betrayal'];
    const offence = saved.style === 'fraud-network' ? 'financial-scam' : saved.style === 'smuggling-ring' ? 'contraband' : saved.category === 'protection-dispute' ? 'extortion' : 'organized-job';
    if (world.overhaulVersion !== 1 || !gang || !state || gang.personId !== incident.personId || state.style !== saved.style || !mission || !(mission.styles as readonly string[]).includes(saved.style) || saved.jobId !== 'organised_job_' + incident.id || !allowed.includes(saved.outcome) || saved.outcome !== facts.outcome || saved.title !== facts.title || saved.body !== facts.body || incident.offence !== offence || facts.victimId !== incident.victimId || facts.crew.length + 1 !== saved.participantIds.length || saved.participantIds[0] !== incident.personId || new Set(saved.participantIds).size !== saved.participantIds.length || facts.crew.some((member, index) => saved.participantIds[index + 1] !== member.personId || !state.members.some(item => item.personId === member.personId)) || saved.participantIds.some(id => !world.people[id]) || !success && incident.gain.minor !== 0n || !!facts.proceedsTransactionId !== (incident.gain.minor > 0n) || !!facts.lossTransactionId !== (facts.loss > 0n) || facts.memberId && !facts.crew.some(member => member.personId === facts.memberId) || facts.rivalId && !gang.contactIds.includes(facts.rivalId) || saved.outcome === 'rival-advance' && !facts.rivalId || saved.outcome === 'associate-betrayal' && !facts.memberId || (saved.style === 'fraud-network' || saved.category === 'protection-dispute') && !facts.victimId || !!facts.victimTransactionId !== (!!facts.victimId && incident.gain.minor > 0n) || (saved.style === 'smuggling-ring') !== !!facts.cargo)
      throw new Error('Invalid versioned organised mission facts');
    if (facts.cargo && (facts.cargo.id !== 'cargo_' + incident.id || facts.cargo.status !== (success ? 'delivered' : saved.outcome === 'cargo-confiscation' ? 'confiscated' : 'lost'))) throw new Error('Invalid mission cargo record');
    const scandal = facts.scandalId ? controversies.get(facts.scandalId) : null;
    if ((saved.outcome === 'public-scandal') !== !!facts.scandalId || facts.scandalId && (!scandal || scandal.personId !== incident.personId || facts.scandalId !== 'controversy_' + incident.id || dateKey(scandal.date) !== dateKey(incident.date))) throw new Error('Invalid mission scandal');
    if (['victim-complaint', 'public-scandal', 'cargo-confiscation'].includes(saved.outcome) && !incident.caseId) throw new Error('Reported mission lacks a genuine case');
    const payments = [
      { id: facts.proceedsTransactionId, personId: incident.personId, cash: incident.gain.minor, category: 'crime-proceeds' },
      { id: facts.lossTransactionId, personId: incident.personId, cash: -facts.loss, category: 'crime-assignment-loss' },
      { id: facts.victimTransactionId, personId: facts.victimId, cash: -incident.gain.minor, category: 'crime-loss' },
    ];
    for (const payment of payments) {
      if (!payment.id) continue;
      const row = ledger.transactions.get(payment.id);
      if (seenPayments.has(payment.id) || !row || row.personId !== payment.personId || row.cashDelta !== payment.cash || row.debtDelta !== 0n || row.category !== payment.category || row.currency !== incident.gain.currency || row.year !== incident.date.year || row.month !== incident.date.month) throw new Error('Invalid mission financial provenance');
      seenPayments.add(payment.id);
    }
  }
  return seenPayments;
}
