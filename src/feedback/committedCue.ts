import type { GameCommand } from '../game/engine';
import type { World } from '../game/model';
import { lifeProgress } from '../progression/progress';
import type { GameplayCue } from './gameplayFeedback';

const substantialAchievements = new Set([
  'working-decade', 'world-traveller', 'hobby-master', 'pet-five-years',
  'scholarship-graduate', 'varied-ventures', 'loan-repaid', 'mortgage-repaid',
  'space-assignment',
]);
const purchases = new Set<GameCommand['type']>([
  'buy-asset', 'buy-investment', 'renovate', 'start-business', 'improve-business',
  'expand-business', 'cult-headquarters', 'cult-upgrade',
]);
const noOutcome = new Set<GameCommand['type']>([
  'mini-game-start', 'mini-game-input', 'mini-game-pause', 'mini-game-resume',
  'mini-game-forfeit', 'end-life', 'continue-child',
]);

export function seriousTransition(before: World, after: World) {
  const id = before.activePersonId, person = after.people[id], previous = before.people[id];
  if (!person || person.died) return true;
  const close = new Set([id]);
  for (const relation of before.relationships) {
    if (relation.from !== id && relation.to !== id) continue;
    if (relation.roles.some(role => ['parent', 'sibling', 'guardian', 'partner', 'spouse'].includes(role))) close.add(relation.from === id ? relation.to : relation.from);
  }
  if ([...close].some(personId => after.people[personId]?.died && !before.people[personId]?.died)) return true;
  if (after.pets.some(row => row.ownerId === id && row.status === 'deceased' && before.pets.find(old => old.id === row.id)?.status !== 'deceased')) return true;
  if (person.health.hospitalizedUntil !== null && person.health.hospitalizedUntil !== previous.health.hospitalizedUntil) return true;
  if (person.health.conditions.some(row => row.diagnosed && !previous.health.conditions.find(old => old.id === row.id)?.diagnosed)) return true;
  return after.pregnancies.some(row => (row.carrierId === id || row.otherParentId === id) && ['lost', 'ended-death'].includes(row.status) && before.pregnancies.find(old => old.id === row.id)?.status === 'pregnant');
}

function milestone(before: World, after: World) {
  const id = before.activePersonId, person = after.people[id], previous = before.people[id];
  if (person.education.qualifications.length > previous.education.qualifications.length) return true;
  if (after.marriages.some(row => (row.a === id || row.b === id) && !row.ended && !before.marriages.some(old => old.id === row.id))) return true;
  if (after.relationships.some(row => row.from === id && row.roles.includes('parent') && row.parentType !== 'guardian' && !before.relationships.some(old => old.from === id && old.to === row.to && old.roles.includes('parent')))) return true;
  // Upper-tier promotions, not routine performance changes or annual raises.
  if (person.employment && previous.employment?.id === person.employment.id && person.employment.rank >= 2 && person.employment.rank > previous.employment.rank) return true;
  if (after.careers.some(career => career.personId === id && career.projects.some(project => project.award && !before.careers.find(old => old.id === career.id)?.projects.find(old => old.id === project.id)?.award))) return true;
  if (after.musicReleases.some(row => row.personId === id && row.milestone && !before.musicReleases.find(old => old.id === row.id)?.milestone)) return true;
  if (after.serviceCareers.some(career => career.personId === id && (career.rank >= 2 && career.rank > (before.serviceCareers.find(old => old.id === career.id)?.rank ?? career.rank) || career.assignments.some(row => row.distinction && !before.serviceCareers.find(old => old.id === career.id)?.assignments.find(old => old.id === row.id)?.distinction)))) return true;
  if (after.elections.some(row => row.status === 'completed' && row.winnerId === id && before.elections.find(old => old.id === row.id)?.status !== 'completed')) return true;
  for (const cult of after.cults.filter(row => row.leaderId === id && row.status === 'active')) {
    const old = before.cults.find(row => row.id === cult.id);
    if (!old) return true;
    const peak = Math.max(old.followers, ...old.months.map(row => row.followers));
    if ([100, 1000, 10000].some(threshold => peak < threshold && cult.followers >= threshold)) return true;
    if (cult.threads.some(row => row.kind === 'claim' && row.outcome === 'success' && row.fulfilledMonth !== null && old.threads.find(prior => prior.id === row.id)?.fulfilledMonth == null)) return true;
  }
  const prior = new Set(lifeProgress(before)?.achievements.filter(row => row.complete).map(row => row.id));
  return lifeProgress(after)?.achievements.some(row => row.complete && substantialAchievements.has(row.id) && !prior.has(row.id)) ?? false;
}

function unsuccessful(before: World, after: World, command: GameCommand) {
  const id = before.activePersonId;
  if (command.type === 'mini-game-complete') {
    const previous = before.miniGames.find(row => row.id === command.sessionId), next = after.miniGames.find(row => row.id === command.sessionId);
    return previous?.status === 'active' && next?.status === 'completed' && next.rating === 'failed';
  }
  if (command.type === 'choose' && before.pending?.kind === 'decision' && before.pending.id === command.eventId) {
    const interview = before.pending.choices.find(row => row.id === command.choiceId)?.effects.find(effect => effect.kind === 'job-interview');
    if (interview?.kind === 'job-interview' && interview.answerId !== 'withdraw') return after.people[id].employment?.id === before.people[id].employment?.id;
  }
  if (command.type === 'select-career') return !after.careers.some(row => row.personId === id && row.kind === command.kind && row.status === 'active');
  if (command.type === 'apply-service') return !after.serviceCareers.some(row => row.personId === id && row.kind === command.kind && row.status === 'active');
  return after.universityApplications.some(row => row.personId === id && row.status === 'rejected' && before.universityApplications.find(old => old.id === row.id)?.status !== 'rejected') || after.scholarships.some(row => row.personId === id && row.status === 'failed' && !before.scholarships.some(old => old.id === row.id));
}

/** Examine committed facts, never copy, popup visibility or arbitrary stat deltas. */
export function committedCues(before: World, after: World, command: GameCommand): readonly GameplayCue[] {
  if (before.id !== after.id || before.activePersonId !== after.activePersonId || after.revision !== before.revision + 1 || noOutcome.has(command.type) || seriousTransition(before, after)) return [];
  const cues: GameplayCue[] = command.type === 'advance' ? ['age-up'] : [];
  if (unsuccessful(before, after, command)) return [...cues, 'error'];
  if (milestone(before, after)) return [...cues, 'big-success'];
  if (purchases.has(command.type)) {
    const paid = after.ledger.slice(before.ledger.length).some(row => row.personId === before.activePersonId && row.cashDelta < 0n);
    const businessPaid = after.businessLedger.slice(before.businessLedger.length).some(row => row.cashDelta < 0n && row.category === command.type && after.businesses.some(company => company.id === row.businessId && company.ownerId === before.activePersonId));
    const treasuryPaid = after.cults.some(cult => cult.leaderId === before.activePersonId && cult.book.some(row => row.kind === 'expense' && row.delta < 0n && !before.cults.find(old => old.id === cult.id)?.book.some(old => old.id === row.id)));
    if (paid || businessPaid || treasuryPaid) return ['purchase'];
  }
  return cues;
}
