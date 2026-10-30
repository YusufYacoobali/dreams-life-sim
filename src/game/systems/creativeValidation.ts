import { convertMoney, roundRatio } from '../money';
import type { World } from '../model';
import { validateActor } from './actorValidation';
import { validateModelCareer } from './modelCareerValidation';
export function validateCreativeCareers(world: World) {
  if (!world.careers.some(career => career.actor || career.modelCareer)) return;
  const ledgerById = new Map(world.ledger.map(row => [row.id, row]));
  const usedCommissions = new Set<string>(), usedCreativeContracts = new Set<string>();
  const jobs = new Map(world.workHistory.map(row => [row.id, row]));
  for (const career of world.careers) {
    const industry = career.kind === 'actor' ? career.actor?.industry : career.kind === 'model' ? career.modelCareer?.industry : undefined;
    if (career.actor && career.kind !== 'actor' || career.modelCareer && career.kind !== 'model') throw new Error('Industry state belongs to the wrong career');
    if (!industry) { if (career.projects.some(project => project.creative) || career.creativeArchives?.length) throw new Error('Creative project has no industry state'); continue; }
    if (new Set(industry.milestones).size !== industry.milestones.length || new Set(industry.seenStories).size !== industry.seenStories.length || new Set(industry.board.map(offer => offer.id)).size !== industry.board.length) throw new Error('Duplicate industry records');
    if (Object.values(industry.contacts).some(id => !world.people[id] || id === career.personId) || new Set(Object.values(industry.contacts)).size !== Object.values(industry.contacts).length) throw new Error('Invalid industry contacts');
    const rep = industry.representation;
    if (rep.tier === 'independent' && (rep.agentId || rep.commissionBps) || rep.agentId && !world.people[rep.agentId] || rep.history.some(record => record.agentId && !world.people[record.agentId])) throw new Error('Invalid agency representation');
    let gross = 0n, commission = 0n;
    for (const project of [...career.projects, ...(career.creativeArchives ?? [])]) {
      const meta = project.creative; if (!meta) continue;
      if (usedCreativeContracts.has(project.employmentId) || project.grossAtStart !== 0n || jobs.get(project.employmentId)?.grossEarned !== project.grossEarned) throw new Error('Creative projects must reconcile one complete employment contract');
      usedCreativeContracts.add(project.employmentId);
      if (meta.kind !== career.kind || !industry || meta.term !== project.targetMonths || meta.processedGross !== project.grossEarned || meta.commissionPaid > project.grossEarned || meta.agentId && !world.people[meta.agentId] || new Set(meta.choices.map(choice => choice.id)).size !== meta.choices.length) throw new Error('Invalid creative contract');
      if (new Set(meta.commissionTransactions).size !== meta.commissionTransactions.length || new Set(meta.commissionConversions.map(row => row.transactionId)).size !== meta.commissionConversions.length) throw new Error('Duplicate commission receipt');
      if (meta.commissionPaid !== roundRatio(project.grossEarned * BigInt(meta.commissionBps), 10000n)) throw new Error('Commission differs from signed terms');
      let recorded = 0n;
      for (const id of meta.commissionTransactions) { if (usedCommissions.has(id)) throw new Error('Commission receipt used by more than one project'); usedCommissions.add(id); const txn = ledgerById.get(id); if (!txn || txn.personId !== career.personId || txn.currency !== project.currency || txn.category !== 'career-agency-commission' || txn.cashDelta >= 0n || txn.debtDelta !== 0n) throw new Error('Invalid agency payment'); recorded -= txn.cashDelta; }
      if (recorded !== meta.commissionPaid) throw new Error('Agency payments do not reconcile');
      if (meta.release && project.status === 'active') throw new Error('Unfinished project cannot have a release');
      if (meta.referenceCurrency !== world.people[career.personId].finance.earningsCurrency || meta.normalizedGross !== jobs.get(project.employmentId)?.normalizedGross) throw new Error('Invalid reference career earnings');
      let referenceFees = 0n;
      for (const conversion of meta.commissionConversions) { const txn = ledgerById.get(conversion.transactionId); if (!txn || !meta.commissionTransactions.includes(conversion.transactionId) || conversion.reference !== convertMoney({ minor: -txn.cashDelta, currency: txn.currency }, meta.referenceCurrency, conversion.numerator, conversion.denominator).minor) throw new Error('Invalid commission currency receipt'); referenceFees += conversion.reference; }
      if (meta.commissionConversions.length !== meta.commissionTransactions.length || referenceFees !== meta.normalizedCommission) throw new Error('Commission reference totals do not reconcile');
      gross += meta.normalizedGross; commission += meta.normalizedCommission;
    }
    if (industry.totalGross !== gross || industry.totalCommission !== commission) throw new Error('Industry earnings do not reconcile');
    if (industry.decision) {
      const decision = industry.decision, event = [world.pending, ...world.deferred.map(entry => entry.event)].find(event => event?.kind === 'decision' && event.id === decision.id);
      if (!event || event.kind !== 'decision' || event.templateId !== 'creative-' + decision.storyId || event.personIds[0] !== career.personId || event.choices.length !== 3 || event.choices.some(choice => choice.effects.length !== 1 || choice.effects[0].kind !== 'creative-choice' || choice.effects[0].careerId !== career.id || choice.effects[0].decisionId !== decision.id || choice.effects[0].choiceId !== choice.id || choice.effects[0].snapshot.storyId !== decision.storyId || choice.effects[0].snapshot.projectId !== decision.projectId || !event.personIds.includes(choice.effects[0].snapshot.contactId) || !world.people[choice.effects[0].snapshot.contactId]) || new Set(event.choices.map(choice => choice.id)).size !== 3) throw new Error('Industry decision lost its saved binding');
    }
    if (industry.boardSeason > Math.floor((world.date.year * 12 + world.date.month - 1) / 3)) throw new Error('Industry board comes from the future');
  }
  validateActor(world); validateModelCareer(world);
}
