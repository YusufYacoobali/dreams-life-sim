import type { World } from '../model';
import type { OrganisedCrimeCommand, OrganisedCrimeState } from './organisedCrimeSchemas';
import type { OrganisedMissionResult, OrganisedMissionIncident } from './organisedMissionSchemas';
import { organisedMissions, organisedMissionProfiles } from '../content/organisedCrime';
import { rules } from '../rules';
import { countries } from '../countries';
import { ageOn, fullName } from '../personHelpers';
import { formatMoney } from '../money';
import { offerPending } from '../pendingQueue';
import { active, accountFor, availableCash, bounded, draw, fact, post, result } from './common';
import { isConfined } from './legalSchemas';
import { recordOrganisedCrime } from './legal';
import { addCondition } from './health';
import { activeTrip } from './travelSchemas';
import { serviceAway } from './serviceSchemas';
import { createContact } from './npcs';
import { connectPerson } from './relationshipContacts';
import { relationFor } from './relationshipQueries';

type Gang = World['gangs'][number];
type Member = OrganisedCrimeState['members'][number];
type Command = Extract<OrganisedCrimeCommand, { type: 'organised-mission' }>;
const remember = (items: string[], text: string, limit: number) => { items.push(text); if (items.length > limit) items.shift(); };
const transactionId = (world: World) => 'txn_' + world.revision + '_' + world.ledger.length;
function missionVictim(world: World, gang: Gang) {
  const s = gang.organised!, actor = active(world);
  const person = Object.values(world.people).find(candidate =>
    candidate.id !== actor.id && !candidate.died && ageOn(candidate, world.date) >= Math.max(18, rules[candidate.country].adultAge) &&
    candidate.country === s.country && candidate.city === s.city && !isConfined(world, candidate) &&
    !activeTrip(world, candidate.id) && !serviceAway(world, candidate.id) && candidate.health.hospitalizedUntil === null &&
    !gang.contactIds.includes(candidate.id) && availableCash(accountFor(world, candidate)) > 0n,
  ) ?? createContact(world, { age: 35, country: s.country, city: s.city });
  connectPerson(world, person.id);
  return person;
}
function scandal(world: World, source: World['incidents'][number], victimId: string) {
  const person = active(world), id = 'controversy_' + source.id;
  const body = fullName(world.people[victimId]) + ' circulates a warning about your fictional financial promises. Your real name is on the complaint.';
  world.controversies.push({ id, personId: person.id, accountId: null, postId: null, date: { ...world.date }, title: 'The prospectus has readers', body, impact: 12, responseRoll: draw(world, 'outcomes', 1, 100), response: null, resolved: null });
  person.publicLife.image = bounded(person.publicLife.image - 12);
  if (person.employment) {
    person.employment.performance = bounded(person.employment.performance - 12);
    fact(world, 'The financial investigation disrupted my work at ' + person.employment.employer + '. My performance suffered; my employment had not ended.', 'work');
  }
  offerPending(world, { kind: 'decision', id, templateId: 'public-controversy', title: 'The prospectus has readers', body, illustration: 'handcuffs', personIds: [person.id, victimId], choices: (['apologise', 'clarify', 'ignore'] as const).map(response => ({
    id: response, label: response === 'apologise' ? 'Apologise publicly' : response === 'clarify' ? 'Offer an explanation' : 'Say nothing',
    effects: [{ kind: 'public-response' as const, controversyId: id, response }],
    resultTitle: 'The response is recorded', resultBody: response === 'ignore' ? 'You leave the warning unanswered. The recorded complaint and investigation remain.' : 'Your response reaches the people reading the warning. It can change your public image; it cannot erase the complaint or decide a court case.',
    journal: response === 'ignore' ? 'I left a warning about my financial scheme unanswered.' : 'I responded publicly to a warning about my financial scheme.',
  })) }, 65);
  return id;
}
/** Every new assignment uses v2 facts; historical jobs and their judgments are read unchanged. */
export function performOrganisedAssignment(world: World, gang: Gang, command: Command, crew: Member[]) {
  const person = active(world), s = gang.organised!, mission = organisedMissions.find(item => item.id === command.mission)!, profile = organisedMissionProfiles[mission.id];
  const skill = crew.length ? crew.reduce((sum, member) => sum + world.people[member.personId].legal.crimeSkill, 0) / crew.length : 0;
  const loyalty = crew.length ? crew.reduce((sum, member) => sum + member.loyalty, 0) / crew.length : 0;
  const styleSkill = s.style === 'fraud-network' ? Math.floor(person.stats.smarts / 12) : s.style === 'smuggling-ring' ? Math.floor(person.stats.discipline / 15) : Math.floor(s.reputation / 15);
  const chance = Math.max(20, Math.min(90, 45 + Math.floor(person.legal.crimeSkill / 5) + styleSkill + (command.approach === 'cautious' ? 15 : command.approach === 'bold' ? -7 : Math.floor(loyalty / 10 + skill / 12))));
  const originalCrew = crew.map(member => ({ personId: member.personId, loyalty: member.loyalty, skill: world.people[member.personId].legal.crimeSkill }));
  const success = draw(world, 'outcomes', 1, 100) <= chance;
  const complication = draw(world, 'outcomes', 1, 100) <= (command.approach === 'cautious' ? 18 : command.approach === 'bold' ? 65 : 32);
  let outcome: OrganisedMissionResult['outcome'];
  if (s.style === 'street-syndicate') outcome = success ? complication ? 'exposed-profit' : 'quiet-profit' : complication ? 'rival-advance' : 'costly-respect';
  else if (s.style === 'fraud-network') outcome = success ? complication ? 'victim-complaint' : 'quiet-profit' : complication ? 'public-scandal' : 'collapsed-scheme';
  else outcome = success ? complication ? 'exposed-profit' : 'quiet-profit' : complication && crew.length ? 'associate-betrayal' : 'cargo-confiscation';
  const rival = s.rivals.find(item => !item.resolved && !!world.people[item.personId] && !world.people[item.personId].died) ?? s.rivals.find(item => !!world.people[item.personId] && !world.people[item.personId].died);
  if (outcome === 'rival-advance' && !rival) outcome = 'costly-respect';
  const victim = s.style === 'fraud-network' || (s.style === 'street-syndicate' && mission.id === 'protection-dispute') ? missionVictim(world, gang) : null;
  const currency = countries[person.country].currency;
  let gain = success ? rules[person.country].baseWage * BigInt(mission.reward * (command.approach === 'bold' ? 145 : command.approach === 'crew-led' ? 85 : 70)) / 1000000n : 0n;
  let victimTransactionId: string | null = null;
  if (victim && gain) {
    const cash = availableCash(accountFor(world, victim)); gain = gain < cash ? gain : cash;
    if (gain) { victimTransactionId = transactionId(world); post(world, -gain, 0n, 'crime-loss', 'Funds lost to ' + mission.title, null, victim); }
  }
  const paymentId = gain ? transactionId(world) : null;
  if (gain) post(world, gain, 0n, 'crime-proceeds', gang.name + ': ' + mission.title + ' (' + command.approach + ')');
  const financialLoss = !success && outcome !== 'public-scandal' && outcome !== 'rival-advance';
  const requestedLoss = financialLoss ? rules[person.country].baseWage * BigInt(profile.lossBps * (command.approach === 'bold' ? 150 : command.approach === 'crew-led' ? 70 : 100)) / 1000000n : 0n;
  const available = availableCash(accountFor(world)), loss = requestedLoss < available ? requestedLoss : available;
  const lossTransactionId = loss ? transactionId(world) : null;
  if (loss) post(world, -loss, 0n, 'crime-assignment-loss', 'Lost assignment expenses: ' + mission.title);
  const involved = command.approach === 'crew-led' && (outcome === 'exposed-profit' || outcome === 'associate-betrayal') ? crew[0] : null;
  const title = outcome === 'quiet-profit' ? 'The assignment pays' : outcome === 'exposed-profit' ? 'Paid, with witnesses' : outcome === 'victim-complaint' ? 'Paid, then reported' : outcome === 'costly-respect' ? 'An expensive reputation' : outcome === 'rival-advance' ? 'Their territory now' : outcome === 'public-scandal' ? 'A very public failure' : outcome === 'collapsed-scheme' ? 'The pitch collapses' : outcome === 'associate-betrayal' ? 'An associate changes sides' : 'Cargo in official custody';
  let body = success ? outcome === 'quiet-profit' ? profile.quiet : profile.exposed : outcome === 'rival-advance' ? profile.setback : profile.failure;
  if (!success && !loss && financialLoss) body = 'The assignment for ' + mission.title + ' falls through. You cannot cover the expenses.';
  const amount = (value: bigint) => formatMoney({ minor: value, currency });
  body += gain ? ' Proceeds: ' + amount(gain) + '.' : ' You receive no proceeds.';
  if (victim) body += gain ? ' ' + fullName(victim) + ' loses ' + amount(gain) + '.' : ' ' + fullName(victim) + ' transfers no money.';
  if (loss) body += ' Your account pays ' + amount(loss) + ' in lost expenses.';
  else if (financialLoss) body += ' You have no cash available; nothing leaves your account.';
  if (outcome === 'cargo-confiscation') body = 'The authorities confiscate ' + profile.cargo + '. You receive no proceeds.' + (loss ? ' Your account pays ' + amount(loss) + ' in lost expenses.' : ' You have no cash available; nothing leaves your account.');
  if (outcome === 'associate-betrayal') body = fullName(world.people[involved!.personId]) + ' diverts ' + profile.cargo + ' and leaves the crew. You hear about their departure after the cargo has gone. You receive no proceeds.' + (loss ? ' Your account pays ' + amount(loss) + ' in lost expenses.' : ' You have no cash available; nothing leaves your account.');
  if (outcome === 'public-scandal') body = 'The scheme for ' + mission.title + ' collapses. ' + fullName(victim!) + ' transfers no money and circulates a warning naming you. You receive no proceeds.';
  if (outcome === 'public-scandal') body += ' Your public image suffers;' + (person.employment ? ' the investigation also disrupts your current work.' : ' the warning remains on record.');
  if (outcome === 'costly-respect') body += ' The crew credits your restraint despite the unpaid assignment.';
  if (involved && success) body += ' ' + fullName(world.people[involved.personId]) + ' resents taking the exposure for a reduced share; their loyalty falls.';
  const incidentId = 'incident_' + person.id + '_' + world.revision + '_' + world.incidents.length;
  const jobId = 'organised_job_' + incidentId;
  const details: OrganisedMissionResult = { rulesVersion: 2, outcome, loss, lossTransactionId, proceedsTransactionId: paymentId, victimId: victim?.id ?? null, victimTransactionId,
    rivalId: s.style !== 'fraud-network' ? rival?.personId ?? null : null, memberId: involved?.personId ?? null, scandalId: null,
    cargo: s.style === 'smuggling-ring' ? { id: 'cargo_' + incidentId, description: profile.cargo, status: success ? 'delivered' : outcome === 'cargo-confiscation' ? 'confiscated' : 'lost' } : null,
    crew: originalCrew, successChance: chance, reputationDelta: 0, title, body };
  const incidentFacts: OrganisedMissionIncident = { rulesVersion: 2, gangId: gang.id, jobId, category: mission.id, style: s.style, outcome, participantIds: [person.id, ...crew.map(member => member.personId)], title, body, result: details };
  const source = recordOrganisedCrime(world, person.id, gain, {
    offence: s.style === 'fraud-network' ? 'financial-scam' : s.style === 'smuggling-ring' ? 'contraband' : mission.id === 'protection-dispute' ? 'extortion' : 'organized-job',
    victimId: victim?.id ?? null, mission: incidentFacts,
    riskDeltaBps: mission.risk + (command.approach === 'cautious' ? -2000 : command.approach === 'bold' ? 1200 : -700),
    evidenceDelta: (command.approach === 'cautious' ? -12 : command.approach === 'bold' ? 12 : 0) + (complication ? profile.pressure : 0),
    reported: outcome === 'victim-complaint' || outcome === 'public-scandal' || outcome === 'cargo-confiscation',
  });
  if (victim) {
    const relation = relationFor(world, person.id, victim.id)!;
    relation.trust = bounded(relation.trust - (gain ? 35 : 15)); relation.strength = bounded(relation.strength - (gain ? 18 : 8));
    remember(relation.memories, 'crime-victim:' + source.id, 32);
  }
  const previousReputation = s.reputation;
  s.reputation = bounded(s.reputation + (outcome === 'costly-respect' ? 8 : success ? command.approach === 'bold' ? 12 : 8 : outcome === 'public-scandal' ? -14 : -4));
  s.loyalty = bounded(s.loyalty + (success ? command.approach === 'crew-led' ? 9 : 6 : -7)); gang.standing = s.reputation;
  if (rival && s.style !== 'fraud-network') {
    const oldInfluence = rival.influence;
    rival.influence = bounded(rival.influence + (success ? -profile.pressure : outcome === 'costly-respect' ? -Math.ceil(profile.pressure / 2) : profile.pressure));
    rival.resolved = rival.influence === 0;
    remember(rival.memories, 'mission:' + mission.id + ':' + outcome + ':' + world.date.year, 12);
    if (rival.influence !== oldInfluence) body += ' ' + fullName(world.people[rival.personId]) + '’s rival influence ' + (rival.influence < oldInfluence ? 'falls' : 'grows') + '.';
  }
  for (const member of crew) {
    if (success) member.loyalty = bounded(member.loyalty + 4);
    remember(member.memories, 'mission:' + mission.id + ':' + (success ? 'completed' : 'failed') + ':' + world.date.year, 16);
    if (member === involved) {
      member.loyalty = bounded(member.loyalty - (success ? 8 : 35));
      remember(member.memories, 'mission-grievance:' + source.id, 16);
      if (outcome === 'associate-betrayal') {
        member.role = 'former';
        // Reuse a resolved rivalry slot; never discard an unresolved opponent.
        const slot = s.rivals.find(item => item.resolved);
        if (!s.rivals.some(item => item.personId === member.personId) && (s.rivals.length < 3 || slot)) {
          const newRival = { personId: member.personId, influence: 55, reputation: 40, resolved: false, memories: ['betrayal:' + source.id] };
          if (slot) s.rivals[s.rivals.indexOf(slot)] = newRival; else s.rivals.push(newRival);
        }
        const relation = relationFor(world, person.id, member.personId);
        if (relation) { relation.trust = bounded(relation.trust - 35); remember(relation.memories, 'mission-betrayal:' + source.id, 32); }
      }
    }
  }
  const injury = command.approach === 'bold' && draw(world, 'outcomes', 1, 100) <= mission.injury;
  if (injury) { person.stats.health = bounded(person.stats.health - 8); addCondition(world, person, 'sprain', 35); body += ' You leave with a sprain.'; }
  person.stats.energy = bounded(person.stats.energy - 12); person.stats.stress = bounded(person.stats.stress + (command.approach === 'cautious' ? 4 : 8));
  person.legal.crimeSkill = bounded(person.legal.crimeSkill + (success ? 7 : 3));
  if (success) s.completedJobs++;
  const scandalId = outcome === 'public-scandal' ? scandal(world, source, victim!.id) : null;
  // Freeze the final truthful text, including concrete rival and health consequences.
  source.organisedMission!.body = body;
  details.scandalId = scandalId; details.reputationDelta = s.reputation - previousReputation; details.body = body;
  s.jobs.push({ id: jobId, category: mission.id, approach: command.approach, participantIds: [...incidentFacts.participantIds], date: { ...world.date }, incidentId: source.id, transactionId: paymentId, proceeds: gain, success, mission: details });
  if (s.jobs.length > 32) { const archived = s.jobs.shift()!; s.archivedJobs++; if (archived.success) s.archivedCompleted++; s.archivedProceeds += archived.proceeds; }
  gang.lastIncomeMonth = world.date.year * 12 + world.date.month - 1;
  const history = 'I ' + (success ? 'completed ' : 'failed ') + mission.title + ' for ' + gang.name + ': ' + title.toLowerCase() + '.';
  s.history.push({ date: { ...world.date }, kind: 'job:' + outcome, personId: involved?.personId ?? victim?.id ?? rival?.personId ?? null, text: history }); if (s.history.length > 64) s.history.shift();
  fact(world, history + (gain ? ' Proceeds: ' + amount(gain) + '.' : ' No proceeds.') + (loss ? ' Lost expenses: ' + amount(loss) + '.' : ''), 'crime');
  fact(world, body, 'crime');
  // Arrest remains the priority. The factual assignment result follows it instead of disappearing.
  result(world, title, body, 'handcuffs', [
    { id: 'proceeds', label: 'Proceeds', value: amount(gain), tone: gain ? 'positive' : 'neutral' },
    ...(loss ? [{ id: 'loss', label: 'Lost expenses', value: amount(loss), tone: 'negative' as const }] : []),
    { id: 'reputation', label: 'Reputation', value: s.reputation + '%', tone: 'neutral' },
  ]);
  return source;
}
