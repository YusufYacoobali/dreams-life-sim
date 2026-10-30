import { countries } from '../countries';
import type { World } from '../model';
import { actorProjectCatalog, actorMilestoneLabels } from '../content/actor';
import { actorReleaseSummary } from '../content/creativeOutcomes';
import { IneligibleAction } from '../errors';
import { formatMoney, roundRatio } from '../money';
import { forkRandom, randomInteger } from '../random';
import { rules } from '../rules';
import { offerPending } from '../pendingQueue';
import { active, accountFor, availableCash, bounded, charge, fact, result } from './common';
import { selectionReason, type Career } from './careers';
import { actorProductionActionIds, type ActorCommand, type ActorProductionAction, type ActorState } from './actorSchemas';
import { creativeMonthNumber, creativeMonthLabel, newIndustryState, type CreativeOffer } from './creativeSchemas';
import { beginCreativeContract, changeAgency, creativeOfferReason, ensureCreativeCareer, ensureIndustryContacts, recordCreativeFailure, settleCreativeMonth } from './creativeCore';
import { activeTrip } from './travelSchemas';
import { isConfined } from './legalSchemas';
import { hospitalized } from './healthSchemas';
import { addCondition } from './health';
import { relationFor } from './relationshipQueries';
import { gainPublicFame } from './social';
export { actorCommandSchema } from './actorSchemas';
export type { ActorCommand } from './actorSchemas';

export const actorProductionActions: readonly { id: ActorProductionAction; label: string; description: string }[] = [
  { id: 'prepare', label: 'Prepare the Role', description: 'Fund rehearsal and research. Better preparation supports every remaining production month, at a stress cost.' },
  { id: 'stunt', label: 'Perform the Stunt', description: 'Fitness and preparation give the stunt a chance. A memorable scene can also become a real injury.' },
  { id: 'improvise', label: 'Try an Improvisation', description: 'Acting skill can rescue a scene or infuriate the director. The creative risk changes the performance.' },
  { id: 'reshoot', label: 'Fund a Reshoot', description: 'Pay for a focused second attempt. Improve the material without extending the signed production term.' },
  { id: 'publicity', label: 'Promote the Production', description: 'Buy a modest publicity campaign. Reach more viewers while giving less attention to the performance.' },
  { id: 'cooperate', label: 'Work with the Cast', description: 'Build trust with the director and co-star. A calmer set helps the work without creating a publicity spectacle.' },
];
const clampBonus = (value: number) => Math.max(-50, Math.min(50, Math.round(value)));
export const actorCareer = (world: World) => world.careers.find(career => career.personId === world.activePersonId && career.kind === 'actor');
export const actorOffers = (world: World): readonly CreativeOffer[] => actorCareer(world)?.actor?.industry.board ?? [];
const currentProject = (career?: Career) => career?.projects.find(project => project.status === 'active' && project.creative?.kind === 'actor');
const attemptKey = (world: World) => world.activePersonId + ':actor-auditions:' + world.date.year;
function actorState(career: Career): ActorState {
  if (!career.actor) throw new IneligibleAction('Open your actor career dashboard first');
  return career.actor;
}
function milestone(state: ActorState, id: string) {
  if (!state.industry.milestones.includes(id)) state.industry.milestones.push(id);
}
export function actorEntryReason(world: World): string | undefined {
  const career = actorCareer(world);
  if (career?.actor && !['left', 'retired'].includes(career.status)) return 'Your actor career dashboard is already set up';
  if (career?.status === 'active') return 'Finish your existing acting project before choosing the new career system';
  return selectionReason(world, 'actor', true);
}
export function actorStyleReason(world: World, style?: ActorState['style']): string | undefined {
  const career = actorCareer(world), state = career?.actor;
  if (!state) return 'Explore acting first';
  if (style === state.style) return 'Your current acting approach';
  if (career.status === 'active') return 'Finish your current production before changing acting style';
  if (state.lastStyleMonth !== undefined && creativeMonthNumber(world) < state.lastStyleMonth + 12) return 'Your next style change is available ' + creativeMonthLabel(state.lastStyleMonth + 12);
}
export function actorOfferReason(world: World, offer: CreativeOffer): string | undefined {
  const career = actorCareer(world);
  if (!career?.actor) return 'Open your actor career dashboard first';
  if (career.actor.boardCountry !== active(world).country) return 'Refresh the casting board after moving country';
  const shared = creativeOfferReason(world, career, offer);
  if (shared) return shared;
  if ((world.actionCounts[attemptKey(world)] ?? 0) >= 4) return 'Four acting auditions are available per calendar year';
  const directorId = career.actor.industry.contacts.director, director = directorId && world.people[directorId];
  if (director && !director.died && (relationFor(world, career.personId, director.id)?.trust ?? 35) < 15 && ['studio-film', 'series'].includes(offer.category)) return 'Repair your relationship with the director before seeking this recommendation';
}
export function actorProductionCost(world: World, action: ActorProductionAction): bigint {
  const bps = action === 'prepare' ? 50 : action === 'reshoot' ? 200 : action === 'publicity' ? 100 : 0;
  return roundRatio(rules[actorCareer(world)?.country ?? active(world).country].baseWage * BigInt(bps), 10000n);
}
export function actorProductionReason(world: World, action: ActorProductionAction): string | undefined {
  const career = actorCareer(world), project = currentProject(career), person = active(world);
  if (!career?.actor || career.status !== 'active' || !project?.creative) return 'Sign a new acting production first';
  if (!actorProductionActionIds.includes(action)) return 'Choose a production action';
  if (isConfined(world, person) || person.legal.wanted) return 'Resolve custody or pursuit before working on set';
  if (activeTrip(world, person.id) || hospitalized(world, person)) return 'Return to the production after your absence';
  if (person.stats.health < 20 || person.stats.energy < 15) return 'Recover some health and energy before this production action';
  if (project.creative.choices.some(choice => choice.id === 'actor-action:' + action)) return 'You have already made this production choice';
  if (project.creative.choices.filter(choice => choice.id.startsWith('actor-action:')).length >= 3 || project.creative.choices.length >= 12) return 'Your three optional production interventions are committed';
  if (actorProductionCost(world, action) > availableCash(accountFor(world, person, career.currency))) return 'Your available balance cannot cover this production choice';
}
function buildBoard(world: World, career: Career) {
  const state = actorState(career), month = creativeMonthNumber(world), season = Math.floor(month / 3);
  const country = active(world).country;
  if (state.industry.boardSeason === season && state.boardCountry === country) throw new IneligibleAction('Your current casting board is saved until the next quarter');
  if (state.industry.boardSeason !== season) { state.savedBoards = []; state.boardSeed = world.random.events; }
  else if (state.industry.board.length) {
    state.savedBoards = state.savedBoards.filter(board => board.country !== state.boardCountry);
    state.savedBoards.push({ country: state.boardCountry, season, offers: state.industry.board });
  }
  state.industry.boardSeason = season; state.boardCountry = country;
  career.country = country; career.currency = countries[country].currency;
  const saved = state.savedBoards.find(board => board.country === country && board.season === season);
  if (saved) { state.industry.board = saved.offers; return; }
  let seed = forkRandom(state.boardSeed, career.id + ':actor-casting:' + season + ':' + country);
  const pick = (min: number, max: number) => { const next = randomInteger(seed, min, max); seed = next.state; return next.value; };
  const agency = state.industry.representation.tier === 'major' ? 2 : state.industry.representation.tier === 'boutique' ? 1 : 0;
  state.industry.board = actorProjectCatalog.map(definition => {
    const role = definition.id === 'commercial' ? 'featured appearance' : ['supporting', 'minor', 'lead'][pick(0, 2)];
    const roleBps = role === 'lead' ? 13500 : role === 'minor' ? 7000 : 10000;
    const opportunityBps = 10000 + career.rank * 1000 + agency * 1200 + Math.max(-15, state.industry.opportunityBoost) * 100;
    const annualPay = roundRatio(rules[career.country].baseWage * BigInt(definition.payBps) * BigInt(roleBps) * BigInt(opportunityBps), 1000000000000n);
    return {
      id: career.id + ':casting:' + country + ':' + season + ':' + definition.id, title: definition.titles[pick(0, definition.titles.length - 1)], category: definition.id,
      genre: definition.genres[pick(0, definition.genres.length - 1)], role, annualPay, months: definition.months,
      prestige: definition.prestige, popularity: definition.popularity, difficulty: bounded(definition.difficulty + (role === 'lead' ? 8 : role === 'minor' ? -7 : 0)), risk: definition.risk,
      minSkill: definition.minSkill, minReputation: definition.minReputation, minAgency: definition.minAgency,
      exclusivity: definition.id === 'series', auditionRoll: pick(1, 100), negotiationRoll: pick(1, 100), expires: (season + 1) * 3 - 1, status: 'open' as const,
    };
  });
}
function enter(world: World) {
  const reason = actorEntryReason(world); if (reason) throw new IneligibleAction(reason);
  const career = ensureCreativeCareer(world, 'actor');
  if (career.actor) {
    if (career.actor.industry.boardSeason !== Math.floor(creativeMonthNumber(world) / 3) || career.actor.boardCountry !== active(world).country) buildBoard(world, career);
    result(world, 'Return to acting', 'You are back in the audition rooms. Some faces are familiar; their opinions have had time to settle. There is still a part to win.', 'actor');
    return;
  }
  const oldCredits = career.projects.filter(project => project.status === 'completed').length, oldAwards = career.projects.filter(project => !!project.award).length;
  career.actor = { industry: newIndustryState(), boardCountry: active(world).country, boardSeed: world.random.events, savedBoards: [], credits: oldCredits, leadingCredits: 0, hits: 0, nominations: 0, awards: oldAwards, collapseCount: 0, comeback: false, style: career.focus === 'craft' ? 'craft' : career.focus === 'publicity' ? 'popular' : 'versatile' };
  career.actor.industry.completed = oldCredits;
  career.status = 'between'; career.ended = null;
  if (oldCredits) milestone(career.actor, 'first-role'); if (oldAwards) milestone(career.actor, 'acting-award');
  ensureIndustryContacts(world, career, ['agent', 'director', 'costar', 'rival']); buildBoard(world, career);
  result(world, 'Your acting career, your choices', 'You enter a business where “we’ll be in touch” covers an alarming range of outcomes. Meet your contacts, choose representation and find a role worth chasing.', 'actor');
}
function relationshipChange(world: World, career: Career, role: string, delta: number) {
  const id = career.actor?.industry.contacts[role], edge = id && !world.people[id]?.died ? relationFor(world, career.personId, id) : undefined;
  if (edge) { edge.strength = bounded(edge.strength + delta); edge.trust = bounded(edge.trust + delta); edge.lastInteractionYear = world.date.year; }
}
function production(world: World, career: Career, action: ActorProductionAction) {
  const reason = actorProductionReason(world, action); if (reason) throw new IneligibleAction(reason);
  const person = active(world), project = currentProject(career)!, metadata = project.creative!, cost = actorProductionCost(world, action);
  if (cost) charge(world, cost, 'career-production', 'Acting production: ' + action, undefined, career.currency, person);
  let note: string;
  if (action === 'prepare') {
    metadata.preparation = bounded(metadata.preparation + 25); metadata.qualityBonus = clampBonus(metadata.qualityBonus + 4); person.stats.stress = bounded(person.stats.stress + 5);
    note = 'You research the role, rehearse the awkward passages and discover why the character keeps moving to cheaper flats. The preparation now supports the remaining production months.';
  } else if (action === 'stunt') {
    const safe = metadata.audienceRoll <= Math.min(95, 30 + Math.floor(person.stats.fitness / 2) + Math.floor(metadata.preparation / 4));
    metadata.qualityBonus = clampBonus(metadata.qualityBonus + (safe ? 10 : -9)); metadata.publicity = clampBonus(metadata.publicity + (safe ? 8 : 3));
    person.stats.health = bounded(person.stats.health - (safe ? 2 : 10)); person.stats.stress = bounded(person.stats.stress + (safe ? 5 : 11));
    if (!safe) addCondition(world, person, 'sprain', 24);
    note = safe ? 'You land the stunt. The crew cheers, the scene improves and the insurance representative silently develops a new facial expression.' : 'The stunt ends with a genuine sprain and a stunt double finishing the shot. The production loses quality; your body requests a speaking role next time.';
  } else if (action === 'improvise') {
    const works = metadata.criticRoll <= Math.min(95, person.skills.acting + Math.floor(metadata.preparation / 5) - Math.floor(metadata.risk / 3));
    metadata.qualityBonus = clampBonus(metadata.qualityBonus + (works ? 10 : -7)); relationshipChange(world, career, 'director', works ? 7 : -8);
    note = works ? 'Your improvised exchange gives the scene a pulse. The director keeps it, calls it a discovery and carefully avoids admitting the script needed help.' : 'Your improvisation turns a tense farewell into an extremely long explanation of parking permits. The director restores the script and remembers this meeting.';
  } else if (action === 'reshoot') {
    metadata.qualityBonus = clampBonus(metadata.qualityBonus + 8); person.stats.stress = bounded(person.stats.stress + 8); relationshipChange(world, career, 'director', -3);
    note = 'You pay for a focused reshoot. The scene becomes clearer; the director becomes less available for friendly conversation. The signed production finish date stays put.';
  } else if (action === 'publicity') {
    metadata.publicity = clampBonus(metadata.publicity + 15); metadata.qualityBonus = clampBonus(metadata.qualityBonus - 3); person.stats.stress = bounded(person.stats.stress + 4);
    note = 'The publicity campaign finds actual viewers. It also finds somebody who would like to discuss your old haircut. Audience prospects rise while rehearsal receives less attention.';
  } else {
    metadata.qualityBonus = clampBonus(metadata.qualityBonus + 4); metadata.publicity = clampBonus(metadata.publicity - 2); person.stats.stress = bounded(person.stats.stress - 4);
    relationshipChange(world, career, 'director', 8); relationshipChange(world, career, 'costar', 9);
    note = 'You work through the scene with the cast instead of fighting for the best camera angle. The work improves, and two real professional relationships become warmer.';
  }
  person.stats.energy = bounded(person.stats.energy - 5);
  metadata.choices.push({ id: 'actor-action:' + action, choice: action, month: creativeMonthNumber(world), note });
  fact(world, 'I chose “' + actorProductionActions.find(row => row.id === action)!.label + '” for ' + project.name + '.', 'career');
  result(world, actorProductionActions.find(row => row.id === action)!.label, note, 'actor', cost ? [{ id: 'cost', label: 'Actual production cost', value: formatMoney({ minor: cost, currency: career.currency }), tone: 'negative' }] : []);
}
export function resolveActor(world: World, command: ActorCommand) {
  if (command.type === 'actor-enter') { enter(world); return; }
  const career = actorCareer(world); if (!career?.actor) throw new IneligibleAction('Open your actor career dashboard first');
  const state = career.actor;
  if (command.type === 'actor-refresh-offers') {
    if (career.status === 'active') throw new IneligibleAction('Finish your current production before reviewing another casting board');
    buildBoard(world, career); result(world, 'The new casting board', 'A new quarter brings fresh roles. Some promise acclaim, some promise a cheque, and some are surprisingly vague about both.', 'actor'); return;
  }
  if (command.type === 'actor-agency') { changeAgency(world, career, command.tier, command.negotiate); return; }
  if (command.type === 'actor-style') {
    const reason = actorStyleReason(world, command.style); if (reason) throw new IneligibleAction(reason);
    state.lastStyleMonth = creativeMonthNumber(world);
    state.style = command.style; career.focus = command.style === 'craft' ? 'craft' : command.style === 'popular' ? 'publicity' : 'balanced';
    result(world, 'An acting approach', command.style === 'craft' ? 'You favour character and critical craft. Popularity is still possible; it will need an audience.' : command.style === 'popular' ? 'You favour accessible performances and publicity. Critics retain the right to be difficult.' : 'You keep your approach versatile, balancing character work with a sustainable professional routine.', 'actor'); return;
  }
  if (command.type === 'actor-production') { production(world, career, command.action); return; }
  const offer = state.industry.board.find(item => item.id === command.offerId);
  if (!offer || offer.status !== 'open' || offer.expires < creativeMonthNumber(world)) throw new IneligibleAction('Choose a current, unattempted casting opportunity');
  if (command.type === 'actor-decline') { offer.status = 'declined'; result(world, 'Not your part', 'You pass on the role and keep your time for something else. There are easier ways to earn a living, although casting offices rarely mention them.', 'actor'); return; }
  const reason = actorOfferReason(world, offer); if (reason) throw new IneligibleAction(reason);
  if (offer.annualPay !== command.quotedAnnualPay) throw new IneligibleAction('Review the current signed-pay quote before auditioning');
  world.actionCounts[attemptKey(world)] = (world.actionCounts[attemptKey(world)] ?? 0) + 1;
  const agency = state.industry.representation.tier === 'major' ? 16 : state.industry.representation.tier === 'boutique' ? 8 : 0;
  const director = state.industry.contacts.director, edge = director ? relationFor(world, career.personId, director) : undefined;
  const appearance = offer.category === 'commercial' ? Math.floor(active(world).stats.looks / 12) : 0;
  const castSupport = ['costar', 'rival'].reduce((sum, role) => sum + ((relationFor(world, career.personId, state.industry.contacts[role])?.trust ?? 50) - 50) / 25, 0);
  const chance = Math.max(12, Math.min(95, Math.round(40 + active(world).skills.acting / 2 + career.reputation / 4 + Math.min(12, state.credits * 2) + agency + appearance + castSupport + (state.industry.representation.rapport - 50) / 8 + ((edge?.trust ?? 35) - 35) / 8 - offer.difficulty / 3 - (offer.role === 'lead' ? 5 : 0))));
  if (offer.auditionRoll > chance) {
    offer.status = 'rejected'; career.reputation = bounded(career.reputation - 1); relationshipChange(world, career, 'rival', -2);
    fact(world, 'I auditioned for ' + offer.title + ' but the part went to somebody else.', 'career');
    result(world, 'The part goes elsewhere', 'The casting team chooses someone else for ' + offer.title + '. Your rival has opinions, none of which you asked for. There will be another audition.', 'actor'); return;
  }
  if (command.negotiate) {
    const accepted = offer.negotiationRoll <= Math.min(90, 35 + Math.floor(career.reputation / 2) + agency + Math.floor((state.industry.representation.rapport - 50) / 5));
    offer.annualPay = roundRatio(offer.annualPay * BigInt(accepted ? 11200 : 9700), 10000n);
    state.industry.representation.rapport = bounded(state.industry.representation.rapport + (accepted ? 3 : -5));
  }
  offer.status = 'accepted'; beginCreativeContract(world, career, offer);
  milestone(state, 'first-role'); if (offer.role === 'lead') milestone(state, 'first-lead');
  fact(world, 'I won the ' + offer.role + ' role in ' + offer.title + '.', 'career');
  const gross = roundRatio(offer.annualPay * BigInt(offer.months), 12n);
  result(world, 'You have the part', offer.title + ' casts you in a ' + offer.role + ' role. The ' + offer.months + '-month commitment is signed. Now comes the part where you have to perform it.', 'actor', [
    { id: 'contract', label: 'Gross fee if all contract months are paid', value: formatMoney({ minor: gross, currency: career.currency }), tone: 'positive' },
    { id: 'commission', label: 'Agreed representation commission', value: state.industry.representation.commissionBps % 100 === 0 ? state.industry.representation.commissionBps / 100 + '%' : state.industry.representation.commissionBps + ' basis points (100 = 1%)', tone: 'neutral' },
  ]);
}
function releaseActor(world: World, career: Career, project: Career['projects'][number]) {
  const state = actorState(career), metadata = project.creative!, person = world.people[career.personId];
  if (metadata.release || metadata.cancellation) return;
  if (project.status === 'cancelled') { cancelActorProduction(world, career, project); return; }
  const milestonesBefore = new Set(state.industry.milestones);
  const completed = project.status === 'completed';
  const style = metadata.actingStyle ?? state.style;
  const critical = completed ? bounded(project.quality * .64 + metadata.prestige * .32 + (51 - metadata.criticRoll) * .22 + (style === 'craft' ? 8 : style === 'popular' ? -2 : 2)) : 0;
  const audience = completed ? bounded(project.quality * .40 + metadata.popularity * .48 + metadata.publicity * .5 + (51 - metadata.audienceRoll) * .25 + (style === 'popular' ? 8 : 0)) : 0;
  const commercial = audience >= 85 && metadata.popularity >= 70 ? 'blockbuster' : audience >= 65 ? 'hit' : audience >= 42 ? 'modest' : 'flop';
  const nomination = completed && critical >= 76 && metadata.prestige >= 60;
  const award = nomination && critical >= 80 && project.quality >= 80 && project.responseRoll <= 10;
  const reputationChange = completed ? (critical >= 76 ? 8 : critical >= 55 ? 3 : -7) + (commercial === 'blockbuster' || commercial === 'hit' ? 3 : commercial === 'flop' ? -3 : 0) : -8;
  const fameChange = completed ? (commercial === 'blockbuster' ? 12 : commercial === 'hit' ? 7 : commercial === 'modest' ? 2 : -2) + (critical >= 80 ? 3 : 0) : -2;
  if (completed) { state.credits++; state.industry.completed++; if (metadata.role === 'lead') state.leadingCredits++; }
  if (nomination) { state.nominations++; milestone(state, 'first-nomination'); }
  if (award) { state.awards++; project.award = 'Lantern Acting Award'; milestone(state, 'acting-award'); }
  if (commercial === 'hit' || commercial === 'blockbuster') { state.hits++; milestone(state, 'commercial-hit'); }
  if (critical >= 82 && completed) milestone(state, 'breakout');
  const wasComeback = state.comeback;
  const disappointing = state.industry.representation.tier === 'major' ? critical < 55 && audience < 65 : critical < 45 && audience < 45;
  const dropped = recordCreativeFailure(world, career, !completed || disappointing);
  if (dropped || state.industry.representation.failures === 3) { state.collapseCount++; state.comeback = false; milestone(state, 'career-collapse'); }
  if (state.collapseCount > 0 && completed && (critical >= 76 || audience >= 72)) { state.comeback = true; milestone(state, 'comeback'); }
  const beforeReputation = career.reputation, beforeFame = person.publicLife.earnedFame;
  career.reputation = bounded(career.reputation + reputationChange); gainPublicFame(world, person, fameChange);
  const reputation = career.reputation - beforeReputation, fame = person.publicLife.earnedFame - beforeFame;
  career.rank = Math.min(3, Math.floor(state.credits / 3));
  if (career.reputation >= 75 && state.credits >= 5) milestone(state, 'established-star');
  relationshipChange(world, career, 'director', critical >= 70 ? 5 : -4); relationshipChange(world, career, 'costar', completed ? 3 : -5);
  const summary = actorReleaseSummary(metadata.category, critical, audience);
  metadata.release = { critical, audience, commercial, nomination, fame, reputation, summary };
  fact(world, 'My ' + metadata.role + ' role in ' + project.name + ' received critics ' + critical + '/100 and audience ' + audience + '/100.' + (award ? ' I won a Lantern Acting Award.' : nomination ? ' It earned an acting nomination.' : ''), 'career', '', person.id);
  if (person.id === world.activePersonId) {
    const money = (minor: bigint) => formatMoney({ minor, currency: project.currency });
    offerPending(world, { kind: 'result', id: 'actor-release:' + project.id, title: project.name + (completed ? ' is released' : ' closes unfinished'), body: metadata.role + ' · ' + metadata.genre + '. ' + summary + (dropped ? ' Your agency ends representation after repeated failures.' : '') + (!wasComeback && state.comeback ? ' You have a comeback worth talking about.' : ''), illustration: 'actor', effects: [
      { id: 'quality', label: 'Performance quality', value: project.quality + '%', tone: 'neutral' },
      { id: 'critical', label: 'Critical reception', value: critical + '/100', tone: critical >= 60 ? 'positive' : 'negative' },
      { id: 'audience', label: 'Audience reception', value: audience + '/100 · ' + commercial, tone: audience >= 60 ? 'positive' : 'neutral' },
      { id: 'gross', label: 'Actual gross wages', value: money(project.grossEarned), tone: 'positive' },
      { id: 'commission', label: 'Actual agency commission', value: money(metadata.commissionPaid), tone: metadata.commissionPaid ? 'negative' : 'neutral' },
      { id: 'rep', label: 'Industry reputation change', value: (reputation > 0 ? '+' : '') + reputation, tone: reputation >= 0 ? 'positive' : 'negative' },
      { id: 'fame', label: 'Earned fame change', value: (fame > 0 ? '+' : '') + fame, tone: fame >= 0 ? 'positive' : 'negative' },
      ...state.industry.milestones.filter(id => !milestonesBefore.has(id)).map(id => ({ id: 'milestone:' + id, label: 'Career milestone', value: actorMilestoneLabels[id] ?? id, tone: 'positive' as const })),
      ...(nomination ? [{ id: 'award', label: award ? 'Award' : 'Recognition', value: award ? 'Lantern Acting Award' : 'Acting nomination', tone: 'positive' as const }] : []),
    ] }, 50);
    if (world.annual?.stage === 'months') world.annual.pausedForPlanning = true;
  }
}
export function actorMonth(world: World) {
  for (const career of world.careers.filter(item => item.kind === 'actor' && item.actor && item.status === 'active')) settleCreativeMonth(world, career, releaseActor);
}
/** Exit/death cancels future production; the shared employment path retains every paid receipt. */
function cancelActorProduction(world: World, career: Career, project: Career['projects'][number]) {
  const metadata = project.creative!, state = actorState(career), person = world.people[career.personId];
  if (metadata.release || metadata.cancellation) return;
  const beforeReputation = career.reputation, beforeFame = person.publicLife.earnedFame;
  const dropped = !person.died && recordCreativeFailure(world, career, true);
  if (dropped || !person.died && state.industry.representation.failures === 3) { state.collapseCount++; state.comeback = false; milestone(state, 'career-collapse'); }
  if (!person.died) {
    career.reputation = bounded(career.reputation - 8); gainPublicFame(world, person, -2);
    relationshipChange(world, career, 'director', -4); relationshipChange(world, career, 'costar', -5);
  }
  const summary = person.died ? 'The production stops before you can finish your part.' : 'Your part ends before the production is finished. There is no finished performance to review.';
  metadata.cancellation = { summary, reputation: career.reputation - beforeReputation, fame: person.publicLife.earnedFame - beforeFame };
  if (person.died) return;
  fact(world, 'I could not finish ' + project.name + '.' + (dropped ? ' My agency dropped me after repeated setbacks.' : ''), 'career', '', person.id);
  if (person.id === world.activePersonId) offerPending(world, { kind: 'result', id: 'actor-cancelled:' + project.id, title: project.name + ' ends unfinished', body: summary + (dropped ? ' After repeated setbacks, your agent ends the arrangement.' : ''), illustration: 'actor', effects: [
    { id: 'work', label: 'Contract months elapsed', value: project.months + ' / ' + project.targetMonths + ' months', tone: 'neutral' },
    { id: 'gross', label: 'Gross wages earned', value: formatMoney({ minor: project.grossEarned, currency: project.currency }), tone: 'positive' },
    { id: 'commission', label: 'Agency commission paid', value: formatMoney({ minor: metadata.commissionPaid, currency: project.currency }), tone: 'neutral' },
    { id: 'rep', label: 'Industry reputation change', value: String(metadata.cancellation.reputation), tone: 'negative' },
    { id: 'fame', label: 'Earned fame change', value: String(metadata.cancellation.fame), tone: 'neutral' },
  ] }, 50);
}
export function actorExit(world: World, personId: string) {
  for (const career of world.careers.filter(item => item.personId === personId && item.actor))
    for (const project of career.projects) if (project.status === 'cancelled' && project.creative?.outcomeVersion === 2) cancelActorProduction(world, career, project);
}
export { actorMilestoneLabels };
