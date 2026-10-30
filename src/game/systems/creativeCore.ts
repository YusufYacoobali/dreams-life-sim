import { fxRate } from '../valuation';
import type { World } from '../model';
import { ageOn, fullName } from '../personHelpers';
import { countries } from '../countries';
import { rules } from '../rules';
import { roundRatio, formatMoney, convertMoney } from '../money';
import { IneligibleAction } from '../errors';
import { active, accountFor, bounded, charge, draw, fact, result } from './common';
import { startCareerContract, selectionReason, type Career } from './careers';
import { careerCatalog } from '../content/careers';
import { endEmployment } from './work';
import { createContact } from './npcs';
import { connectPerson } from './relationshipContacts';
import { relationFor } from './relationshipQueries';
import { isConfined } from './legalSchemas';
import { hospitalized } from './healthSchemas';
import { gainPublicFame } from './social';
import { creativeMonthNumber, agencyTiers, type CreativeKind, type CreativeOffer, type IndustryState, type Representation } from './creativeSchemas';

export type CreativeCareer = Career;
export type CreativeWork = Career['projects'][number];
export function getIndustry(career: Career): IndustryState | undefined { return career.kind === 'actor' ? career.actor?.industry : career.kind === 'model' ? career.modelCareer?.industry : undefined; }
export function ensureCreativeCareer(world: World, kind: CreativeKind): Career {
  const person = active(world), age = ageOn(person, world.date), definition = careerCatalog[kind];
  if (age < definition.minAge || age > definition.maxAge) throw new IneligibleAction('Explore this career between ages ' + definition.minAge + ' and ' + definition.maxAge + '.');
  let career = world.careers.find(item => item.personId === person.id && item.kind === kind);
  if (career?.status === 'active') throw new IneligibleAction('Finish or leave your existing contract before starting the new career system. Your current project is kept.');
  if (!career) {
    career = { id: 'career_' + person.id + '_' + kind, personId: person.id, kind, country: person.country, currency: countries[person.country].currency, started: { ...world.date }, ended: null, status: 'between', rank: 0, reputation: 40, focus: 'balanced', employmentId: null, employer: '', contractMonthsRemaining: 0, lastMonth: creativeMonthNumber(world), contacts: [], projects: [] };
    world.careers.push(career);
  }
  career.status = 'between'; career.ended = null;
  world.schemaVersion = 50; world.engineVersion = 52; world.contentVersion = 29;
  return career;
}
export function ensureIndustryContacts(world: World, career: Career, roles: readonly string[]): Record<string, string> {
  const industry = getIndustry(career); if (!industry) throw new IneligibleAction('Open the new career dashboard first.');
  const person = world.people[career.personId];
  for (const role of roles) {
    if (industry.contacts[role] && world.people[industry.contacts[role]] && !world.people[industry.contacts[role]].died) continue;
    const used = new Set(Object.values(industry.contacts));
    const existing = career.contacts.find(id => !used.has(id) && world.people[id] && !world.people[id].died);
    const contact = existing ? world.people[existing] : createContact(world, { age: Math.max(26, Math.min(60, ageOn(person, world.date) + 4)), country: person.country, city: person.city });
    industry.contacts[role] = contact.id;
    if (!career.contacts.includes(contact.id)) career.contacts.push(contact.id);
    connectPerson(world, person.id, contact.id);
    const relation = relationFor(world, person.id, contact.id)!;
    if (!relation.roles.includes('coworker')) relation.roles.push('coworker');
    if (relation.kind === 'acquaintance') relation.kind = 'coworker';
    fact(world, 'I began working with ' + fullName(contact) + ' as my ' + role.replace(/-/g, ' ') + '.', 'career', '', person.id);
  }
  return industry.contacts;
}
function agencyHistory(world: World, career: Career, reason: string) {
  const rep = getIndustry(career)!.representation, previous = rep.history.at(-1);
  if (previous && !previous.ended) { previous.ended = { ...world.date }; previous.reason = reason; }
  if (rep.history.length >= 24) { rep.history.shift(); rep.archived++; }
  rep.history.push({ tier: rep.tier, agentId: rep.agentId, commissionBps: rep.commissionBps, started: { ...world.date }, ended: null, reason });
}
export function creativeAgencyQuote(career: Career, tier: Representation['tier'], negotiate: boolean) {
  const current = getIndustry(career)?.representation;
  const minimumBps = tier === 'major' ? 1000 : tier === 'boutique' ? 500 : 0;
  const standardBps = current?.tier === tier ? current.commissionBps : tier === 'major' ? 2000 : tier === 'boutique' ? 1200 : 0;
  const proposedBps = negotiate ? Math.min(standardBps, Math.max(minimumBps, standardBps - 200)) : standardBps;
  return { standardBps, proposedBps, minimumBps };
}
export function changeAgency(world: World, career: Career, tier: Representation['tier'], negotiate: boolean): void {
  const industry = getIndustry(career); if (!industry) throw new IneligibleAction('Open this career first.');
  const person = world.people[career.personId], rep = industry.representation, quarter = Math.floor(creativeMonthNumber(world) / 3), key = person.id + ':' + career.kind + ':agency:' + quarter;
  if (world.actionCounts[key]) throw new IneligibleAction('Review representation again next quarter.');
  if (tier === rep.tier && !negotiate) throw new IneligibleAction('This is your current representation.');
  if (tier === 'major' && (career.reputation < 60 || industry.completed < 2)) throw new IneligibleAction('A major agency needs reputation 60 and two completed contracts.');
  if (tier === 'boutique' && career.reputation < 30) throw new IneligibleAction('Build reputation to 30 for boutique representation.');
  const sameTier = tier === rep.tier, { standardBps, proposedBps, minimumBps: floor } = creativeAgencyQuote(career, tier, negotiate);
  if (sameTier && negotiate && rep.commissionBps <= floor) throw new IneligibleAction('Your agency already agreed its lowest commission rate.');
  const agentId = tier === 'independent' ? null : ensureIndustryContacts(world, career, ['agent']).agent;
  if (agentId && world.people[agentId].died) throw new IneligibleAction('Your former agent has died. Continue independently; their history is retained.');
  world.actionCounts[key] = 1;
  let commission = standardBps;
  const success = negotiate && tier !== 'independent' && draw(world, 'outcomes', 1, 100) <= Math.min(90, 35 + Math.floor(career.reputation / 2) + Math.floor(rep.rapport / 5));
  if (success) commission = proposedBps;
  if (negotiate && !success) rep.rapport = bounded(rep.rapport - 5);
  const previous = rep.history.at(-1); if (previous && !previous.ended) previous.ended = { ...world.date };
  rep.tier = tier; rep.agentId = agentId; rep.commissionBps = commission; rep.failures = 0;
  rep.rapport = bounded(rep.rapport + (success ? 5 : tier === 'independent' ? -3 : 2));
  agencyHistory(world, career, tier === 'independent' ? 'Returned to independent work' : success ? 'Negotiated representation' : 'Signed representation');
  if (agentId) { const relationship = relationFor(world, person.id, agentId); if (relationship) { relationship.lastInteractionYear = world.date.year; relationship.strength = bounded(relationship.strength + (success ? 5 : -1)); relationship.trust = bounded(relationship.trust + (success ? 3 : -2)); } }
  if (tier !== 'independent' && !industry.milestones.includes('signed-agency')) industry.milestones.push('signed-agency');
  fact(world, 'I chose ' + tier + ' representation for my ' + career.kind + ' work. Future contracts use the commission recorded in my agency agreement.', 'career', '', person.id);
  result(world, tier === 'independent' ? 'Independent again' : 'Representation agreed', 'The agreed commission shown in Agency applies to new contracts. Existing signed terms stay fixed.' + (success ? ' You negotiated a lower rate.' : negotiate ? ' They declined a lower rate; the reviewed commission stays in place.' : ''), career.kind);
}
export function recordCreativeFailure(world: World, career: Career, failed: boolean): boolean {
  const industry = getIndustry(career); if (!industry) return false;
  const rep = industry.representation;
  rep.failures = failed ? rep.failures + 1 : Math.max(0, rep.failures - 1); rep.rapport = bounded(rep.rapport + (failed ? -9 : 6));
  if (rep.agentId) { const relation = relationFor(world, career.personId, rep.agentId); if (relation) { relation.lastInteractionYear = world.date.year; relation.strength = bounded(relation.strength + (failed ? -5 : 4)); relation.trust = bounded(relation.trust + (failed ? -4 : 3)); } }
  if (rep.tier === 'independent' || rep.failures < 3) return false;
  const previous = rep.history.at(-1); if (previous) { previous.ended = { ...world.date }; previous.reason = 'Representation ended after repeated failed contracts'; }
  rep.tier = 'independent'; rep.agentId = null; rep.commissionBps = 0;
  agencyHistory(world, career, 'Dropped by agency');
  if (!industry.milestones.includes('lost-representation')) industry.milestones.push('lost-representation');
  return true;
}
export function creativeOfferReason(world: World, career: Career, offer: CreativeOffer): string | undefined {
  const industry = getIndustry(career); if (!industry) return 'Open this career first.';
  if (offer.status !== 'open') return 'This opportunity has already been answered.';
  if (offer.expires < creativeMonthNumber(world)) return 'This casting round has closed.';
  if (industry.bookingHoldUntil >= creativeMonthNumber(world)) return 'Your exclusive first-refusal agreement runs through ' + Math.floor(industry.bookingHoldUntil / 12) + '-' + String(industry.bookingHoldUntil % 12 + 1).padStart(2, '0') + '.';
  const reason = selectionReason(world, career.kind, true); if (reason) return reason;
  if (career.reputation < offer.minReputation) return 'Industry reputation ' + offer.minReputation + ' required.';
  if (agencyTiers.indexOf(industry.representation.tier) < offer.minAgency) return (offer.minAgency === 2 ? 'Major' : 'Boutique or major') + ' representation required.';
  const person = world.people[career.personId];
  if (person.skills[career.kind === 'actor' ? 'acting' : 'modeling'] < offer.minSkill) return 'Build your career skill to ' + offer.minSkill + '%.';
}
export function beginCreativeContract(world: World, career: Career, offer: CreativeOffer): Career {
  const industry = getIndustry(career); if (!industry) throw new IneligibleAction('Open this career first.');
  const rep = industry.representation;
  // Commit an unchosen default on signing; never backdate a lock in an old save.
  if (career.actor && career.actor.lastStyleMonth === undefined) career.actor.lastStyleMonth = creativeMonthNumber(world);
  if (career.modelCareer && career.modelCareer.lastSpecialisationMonth === undefined) career.modelCareer.lastSpecialisationMonth = creativeMonthNumber(world);
  startCareerContract(world, career.kind, offer.annualPay, world.people[career.personId], false);
  const project = career.projects.find(item => item.status === 'active')!;
  project.id = 'creative_project_' + career.id + '_' + project.employmentId;
  project.name = offer.title; project.targetMonths = offer.months; career.contractMonthsRemaining = offer.months;
  project.creative = { outcomeVersion: 2, ...(career.actor ? { actingStyle: career.actor.style } : {}), kind: career.kind as CreativeKind, offerId: offer.id, category: offer.category, genre: offer.genre, role: offer.role, term: offer.months, prestige: offer.prestige, popularity: offer.popularity, risk: offer.risk, exclusivity: offer.exclusivity, commissionBps: rep.commissionBps, agentId: rep.agentId, processedGross: 0n, commissionPaid: 0n, commissionTransactions: [], referenceCurrency: world.people[career.personId].finance.earningsCurrency, normalizedGross: 0n, normalizedCommission: 0n, commissionConversions: [], preparation: 50, qualityBonus: 0, publicity: 0, criticRoll: draw(world, 'outcomes', 1, 100), audienceRoll: draw(world, 'outcomes', 1, 100), choices: [], release: null };
  career.employer = offer.title; world.people[career.personId].employment!.employer = offer.title;
  world.workHistory.find(item => item.id === career.employmentId)!.employer = offer.title;
  return career;
}
/** Called after ordinary workMonth has paid wages/tax. Never posts another wage. */
export function settleCreativeMonth(world: World, career: Career, onRelease: (world: World, career: Career, project: CreativeWork) => void): void {
  if (career.status !== 'active') return;
  const project = career.projects.find(item => item.status === 'active'), meta = project?.creative, industry = getIndustry(career), month = creativeMonthNumber(world);
  if (!project || !meta || !industry || career.lastMonth >= month) return;
  const person = world.people[career.personId], history = world.workHistory.find(item => item.id === career.employmentId);
  if (!history || person.employment?.id !== history.id) throw new Error('Creative production lost its real employment contract');
  meta.outcomeVersion = 2;
  career.lastMonth = month; project.grossEarned = history.grossEarned - project.grossAtStart;
  const earned = project.grossEarned - meta.processedGross;
  if (earned < 0n) throw new Error('Creative earnings moved backwards');
  const commission = roundRatio(project.grossEarned * BigInt(meta.commissionBps), 10000n) - meta.commissionPaid;
  if (commission > 0n) {
    charge(world, commission, 'career-agency-commission', 'Agency commission for ' + project.name, undefined, project.currency, person);
    const transactionId = world.ledger.at(-1)!.id, rate = fxRate(world, project.currency, meta.referenceCurrency);
    const reference = convertMoney({ minor: commission, currency: project.currency }, meta.referenceCurrency, rate.numerator, rate.denominator).minor;
    meta.commissionTransactions.push(transactionId); meta.commissionConversions.push({ transactionId, reference, numerator: rate.numerator, denominator: rate.denominator });
    meta.commissionPaid += commission; meta.normalizedCommission += reference; industry.totalCommission += reference;
  }
  industry.totalGross += history.normalizedGross - meta.normalizedGross; meta.normalizedGross = history.normalizedGross; meta.processedGross = project.grossEarned;
  const attended = !person.died && !isConfined(world, person) && !person.legal.wanted && !hospitalized(world, person) && person.stats.health >= 15 && ageOn(person, world.date) <= careerCatalog[career.kind].maxAge;
  const style = career.kind === 'actor' ? meta.actingStyle ?? career.actor?.style : undefined;
  const styleBonus = style === 'craft' ? 4 : style === 'popular' ? -2 : style === 'versatile' ? 1 : 0;
  const score = attended ? bounded(Math.round((person.skills[career.kind === 'actor' ? 'acting' : 'modeling'] * 2 + person.employment.performance + person.stats.discipline) / 4) + Math.round((meta.preparation - 50) / 6) + meta.qualityBonus + styleBonus + draw(world, person.id === world.activePersonId ? 'outcomes' : 'npcs', -8, 8)) : 0;
  project.periods.push({ month, score, attended, success: attended && score >= meta.risk }); project.months++; career.contractMonthsRemaining--;
  project.quality = Math.round(project.periods.reduce((sum, period) => sum + period.score, 0) / project.periods.length);
  person.stats.stress = bounded(person.stats.stress + (meta.preparation > 75 ? 2 : 1)); person.stats.energy = bounded(person.stats.energy - 2);
  if (attended && meta.publicity > 0) gainPublicFame(world, person, 1);
  if (project.months < project.targetMonths && attended) return;
  if (project.months < project.targetMonths && !attended && !person.died && person.stats.health >= 15 && ageOn(person, world.date) <= careerCatalog[career.kind].maxAge) return;
  project.status = project.months >= project.targetMonths && project.periods.filter(period => period.attended).length >= Math.ceil(project.targetMonths / 2) ? 'completed' : 'cancelled'; project.ended = { ...world.date };
  onRelease(world, career, project);
  endEmployment(world, person.id); career.status = person.died ? 'deceased' : ageOn(person, world.date) > careerCatalog[career.kind].maxAge || person.stats.health < 15 ? 'retired' : 'between';
  if (career.status !== 'between') career.ended = { ...world.date };
  if (person.id === world.activePersonId && world.annual?.stage === 'months') world.annual.pausedForPlanning = true;
}
