import type { World } from '../model';
import { countries } from '../countries';
import { rules } from '../rules';
import { formatMoney, roundRatio } from '../money';
import { forkRandom, randomInteger } from '../random';
import { IneligibleAction } from '../errors';
import { modelBookingContent, modelBookingDefinition, modelSpecialisationContent } from '../content/modelCareer';
import { active, accountFor, availableCash, bounded, charge, fact, post, result } from './common';
import { endEmployment } from './work';
import { gainPublicFame } from './social';
import { relationFor } from './relationshipQueries';
import { selectionReason, trainingReason, type Career } from './careers';
import { beginCreativeContract, changeAgency, creativeOfferReason, ensureCreativeCareer, ensureIndustryContacts, recordCreativeFailure, settleCreativeMonth } from './creativeCore';
import { creativeMonthNumber, newIndustryState, type CreativeOffer } from './creativeSchemas';
import { type ModelCareerCommand, type ModelCareerState, type ModelSpecialisation } from './modelCareerSchemas';
export { modelCareerCommandSchema } from './modelCareerSchemas';
export type { ModelCareerCommand } from './modelCareerSchemas';
type Project = Career['projects'][number];
type Brand = ModelCareerState['brands'][number];
type ProductionAction = Extract<ModelCareerCommand, { type: 'model-production' }>['action'];
type BrandAction = Extract<ModelCareerCommand, { type: 'model-brand' }>['action'];
const quarter = (world: World) => Math.floor(creativeMonthNumber(world) / 3);
const milestone = (state: ModelCareerState, id: string) => { if (!state.industry.milestones.includes(id) && state.industry.milestones.length < 32) state.industry.milestones.push(id); };
export function modelCareer(world: World) { return world.careers.find(career => career.personId === world.activePersonId && career.kind === 'model'); }
function requireModel(world: World): Career & { modelCareer: ModelCareerState } {
  const career = modelCareer(world);
  if (!career?.modelCareer) throw new IneligibleAction('Open your modelling portfolio first.');
  return career as Career & { modelCareer: ModelCareerState };
}
export function modelEntryReason(world: World): string | undefined {
  const person = active(world), career = modelCareer(world);
  if (person.died) return 'This life has ended';
  if (career?.modelCareer && !['left', 'retired'].includes(career.status)) return 'Your modelling portfolio is already open';
  if (career?.status === 'active') return 'Finish or leave your existing modelling project first; its progress is kept';
  return selectionReason(world, 'model', true);
}
function emptyModel(world: World, career: Career): ModelCareerState {
  return { version: 1, industry: { ...newIndustryState(), completed: career.projects.filter(project => project.status === 'completed').length }, boardCountry: active(world).country, boards: [], portfolio: { editorial: 10, runway: 10, commercial: 15, luxury: 5, lifestyle: 15 }, specialisations: ['commercial'], professionalism: 50, notableWork: [], brands: [], archivedBrands: 0, archivedWork: 0, lostRepresentation: false, lastPortfolioQuarter: -1, lastBrandActionMonth: -1 };
}
export function modelBrandTerm(offer: CreativeOffer) { return offer.exclusivity ? Math.min(12, offer.months + 3) : offer.months; }
function refreshOffers(world: World, career: Career & { modelCareer: ModelCareerState }) {
  const state = career.modelCareer, season = quarter(world), person = world.people[career.personId];
  if (state.industry.boardSeason === season && state.boardCountry === person.country) throw new IneligibleAction('These castings remain available until the next quarter.');
  if (state.industry.boardSeason === season && state.industry.board.length) {
    state.boards = state.boards.filter(board => board.season === season && board.country !== state.boardCountry);
    state.boards.push({ country: state.boardCountry, season, offers: state.industry.board.map(offer => ({ ...offer })) });
  } else state.boards = [];
  const cached = state.boards.find(board => board.country === person.country && board.season === season);
  state.industry.board = cached ? cached.offers.map(offer => ({ ...offer })) : modelBookingContent.map(definition => {
    const id = career.id + ':model:' + person.country + ':' + season + ':' + definition.id;
    let seed = forkRandom(0, world.id + ':' + id);
    const roll = (minimum: number, maximum: number) => { const next = randomInteger(seed, minimum, maximum); seed = next.state; return next.value; };
    const experience = state.portfolio[definition.specialisation], agencyBonus = state.industry.representation.tier === 'major' ? 20 : state.industry.representation.tier === 'boutique' ? 8 : 0;
    const annualPay = roundRatio(rules[person.country].baseWage * BigInt(definition.wageBps) * BigInt(100 + Math.floor(experience / 4) + Math.floor(career.reputation / 4) + agencyBonus), 1000000n);
    return { id, title: definition.names[roll(0, definition.names.length - 1)], category: definition.id, genre: definition.genre, role: definition.role, annualPay, months: definition.months, prestige: definition.prestige, popularity: definition.popularity, difficulty: definition.difficulty, risk: definition.risk, minSkill: definition.minSkill, minReputation: definition.minReputation, minAgency: definition.minAgency, exclusivity: definition.exclusivity, auditionRoll: roll(1, 100), negotiationRoll: roll(1, 100), expires: (season + 1) * 3, status: 'open' as const };
  });
  state.industry.boardSeason = season; state.boardCountry = person.country;
}
export function modelOfferReason(world: World, offer: CreativeOffer): string | undefined {
  const career = modelCareer(world), state = career?.modelCareer;
  if (!career || !state) return 'Open your modelling portfolio first';
  if (state.boardCountry !== active(world).country) return 'Refresh your casting board after relocating; old foreign-currency terms are kept as history';
  const common = creativeOfferReason(world, career, offer); if (common) return common;
  const definition = modelBookingDefinition(offer.category); if (!definition) return 'This booking is unavailable';
  if (state.portfolio[definition.specialisation] < (offer.category === 'luxury' ? 40 : offer.category === 'ambassador' ? 25 : 0)) return 'Build your ' + modelSpecialisationContent[definition.specialisation].title.toLowerCase() + ' portfolio first';
  if (offer.exclusivity && world.sponsorships.some(sponsor => sponsor.ownerId === world.activePersonId && sponsor.status === 'active' && ['style', 'fitness'].includes(sponsor.category))) return 'End your competing style or fitness sponsorship before signing exclusive modelling rights';
  const competing = ['advertising', 'ambassador', 'luxury'].includes(offer.category);
  if (competing && state.brands.some(brand => brand.status === 'active' && brand.ends > creativeMonthNumber(world))) return 'Existing brand exclusivity prevents this competing booking. Finish its term or review a breach first';
  if (competing && state.brands.some(brand => brand.penaltyLiabilityId && (world.liabilities.find(debt => debt.id === brand.penaltyLiabilityId)?.principal ?? 0n) > 0n)) return 'Settle your outstanding brand-contract claim before another endorsement';
  return undefined;
}
export function modelSponsorshipReason(world: World, category: string): string | undefined {
  if (!['style', 'fitness'].includes(category)) return;
  const state = modelCareer(world)?.modelCareer;
  if (state?.brands.some(brand => brand.status === 'active' && brand.ends > creativeMonthNumber(world))) return 'Your modelling brand exclusivity prevents competing style or fitness endorsements. Review that agreement first';
}
export function modelPortfolioQuote(world: World, style: 'self' | 'professional') { return style === 'professional' ? roundRatio(rules[active(world).country].baseWage, 40n) : roundRatio(rules[active(world).country].baseWage, 400n); }
export function modelPortfolioReason(world: World, specialisation: ModelSpecialisation, style: 'self' | 'professional'): string | undefined {
  const career = modelCareer(world), state = career?.modelCareer;
  if (!state) return 'Open your modelling portfolio first';
  const availability = trainingReason(world, 'modeling'); if (availability) return availability;
  const person = active(world);
  if (person.died || career?.status === 'deceased') return 'This life has ended';
  if (state.lastPortfolioQuarter >= quarter(world)) return 'You have already developed your portfolio this quarter';
  if (person.stats.energy < 15 || person.stats.health < 25) return 'Rest and recover before a portfolio shoot';
  if (state.portfolio[specialisation] >= 100) return 'This portfolio area is already fully developed';
  if (availableCash(accountFor(world)) < modelPortfolioQuote(world, style)) return 'Your available balance cannot cover this shoot';
}
export function modelProductionReason(world: World, projectId: string, action: ProductionAction): string | undefined {
  const career = modelCareer(world), project = career?.projects.find(item => item.id === projectId);
  if (!career?.modelCareer || career.status !== 'active' || !project?.creative || project.status !== 'active') return 'Choose your current modelling booking';
  if (project.creative.choices.some(choice => choice.id === 'model:' + action)) return 'You have already made this decision for this booking';
  if (project.creative.choices.length >= 12) return 'Your production plan is complete';
  if (active(world).stats.energy < 10) return 'Rest before making another production commitment';
}
export function modelBrandQuote(world: World, brand: Brand, action: BrandAction): bigint {
  if (action !== 'breach') return 0n;
  if (brand.penaltyLiabilityId) return world.liabilities.find(debt => debt.id === brand.penaltyLiabilityId)?.principal ?? 0n;
  return brand.status === 'active' ? roundRatio(brand.agreedFee, 5n) : 0n;
}
export function modelBrandReason(world: World, brand: Brand, action: BrandAction): string | undefined {
  const career = modelCareer(world), state = career?.modelCareer;
  if (!state || !state.brands.includes(brand)) return 'Choose a recorded brand agreement';
  if (action === 'fulfil') { const availability = trainingReason(world, 'modeling'); if (availability) return availability; }
  if (action === 'breach') {
    const cost = modelBrandQuote(world, brand, action);
    if (brand.status !== 'active' && !cost) return 'This agreement has already ended';
    if (cost > availableCash(accountFor(world, active(world), brand.currency))) return 'Your available balance cannot cover this contract settlement';
    return;
  }
  if (brand.status !== 'active') return 'This agreement has already ended';
  if (action === 'renegotiate' && brand.negotiated) return 'These terms have already been negotiated';
  if (action === 'fulfil' && brand.fulfilled >= brand.obligations) return 'All agreed appearances are complete';
  if (state.lastBrandActionMonth >= creativeMonthNumber(world)) return 'One optional brand action is available each month';
}
function changeContact(world: World, career: Career, role: string, delta: number) {
  const id = career.modelCareer?.industry.contacts[role], relation = id ? relationFor(world, career.personId, id) : undefined;
  if (relation) {
    relation.strength = bounded(relation.strength + delta); relation.trust = bounded(relation.trust + delta); relation.lastInteractionYear = world.date.year;
    const memory = 'model-work:' + role + ':' + (delta >= 0 ? 'collaboration:' : 'conflict:') + world.date.year;
    if (!relation.memories.includes(memory) && relation.memories.length < 40) relation.memories.push(memory);
  }
}
function releaseModel(world: World, career: Career, project: Project) {
  const state = career.modelCareer!, details = project.creative!, person = world.people[career.personId], definition = modelBookingDefinition(details.category)!;
  const critical = bounded(Math.round(project.quality * .6 + details.prestige * .25 + state.professionalism * .15) + Math.round((50 - details.criticRoll) / 5));
  const audience = bounded(Math.round(project.quality * .4 + details.popularity * .45 + Math.max(0, details.publicity)) + Math.round((50 - details.audienceRoll) / 4));
  const completed = project.status === 'completed', success = completed && (critical >= 64 || audience >= 68), fame = completed ? audience >= 85 ? 7 : audience >= 65 ? 4 : 1 : 0, reputation = !completed ? -9 : critical >= 80 ? 10 : success ? 5 : -5;
  career.reputation = bounded(career.reputation + reputation); gainPublicFame(world, person, fame);
  details.release = { critical, audience, commercial: audience >= 85 ? 'blockbuster' : audience >= 65 ? 'hit' : audience >= 40 ? 'modest' : 'flop', nomination: completed && critical >= 75 && details.prestige >= 65, fame, reputation, summary: completed ? critical >= 80 && audience < 50 ? 'Industry praise; a quiet commercial reception.' : audience >= 85 && critical < 60 ? 'An enormous audience, followed by some very polite fashion reviews.' : success ? 'The work travels further than the mood board.' : 'The client approves the invoice with more enthusiasm than the photographs.' : 'The unfinished booking remains in your actual career history.' };
  if (completed) {
    state.industry.completed++;
    state.portfolio[definition.specialisation] = bounded(state.portfolio[definition.specialisation] + (critical >= 75 ? 12 : 6));
    state.professionalism = bounded(state.professionalism + (project.periods.every(period => period.attended) ? 4 : 1));
    state.notableWork.push({ projectId: project.id, title: project.name, specialisation: definition.specialisation, currency: project.currency, quality: project.quality, prestige: details.prestige, date: { ...world.date }, gross: project.grossEarned });
    while (state.notableWork.length > 24) { state.notableWork.shift(); state.archivedWork++; }
    milestone(state, 'First paid booking');
    if (details.category !== 'runway') milestone(state, 'First paid shoot');
    if (details.category === 'runway') milestone(state, 'First runway show');
    if (details.category === 'editorial' && critical >= 75) milestone(state, 'Magazine cover');
    if (details.category === 'advertising' && audience >= 70) milestone(state, 'Major advertising campaign');
    if (details.category === 'luxury') milestone(state, 'Luxury brand contract');
    if (career.reputation >= 80 && state.industry.completed >= 4) milestone(state, 'International fashion breakthrough');
    if (state.lostRepresentation && success) { milestone(state, 'Successful comeback'); state.lostRepresentation = false; }
    if (critical >= 80 && details.prestige >= 65 && project.quality >= 80 && project.responseRoll <= 10) { project.award = 'Fashion Craft Council recognition'; milestone(state, 'Industry award'); }
    changeContact(world, career, definition.id === 'editorial' ? 'photographer' : 'designer', success ? 5 : -4);
  }
  if (recordCreativeFailure(world, career, !success)) { milestone(state, 'Lost representation'); state.lostRepresentation = true; }
  career.rank = Math.min(3, Math.floor(state.industry.completed / 3));
  fact(world, 'My ' + definition.title.toLowerCase() + ', ' + project.name + ', earned ' + formatMoney({ minor: project.grossEarned, currency: project.currency }) + ' gross. ' + details.release.summary, 'career', '', person.id);
  if (person.id === world.activePersonId) result(world, completed ? 'The booking is out in the world' : 'The booking ends unfinished', project.name + ' · ' + details.role + '. ' + details.release.summary + ' These are the actual paid wages, not an invented campaign valuation.', 'model', [
    { id: 'quality', label: 'Performance quality', value: project.quality + '%', tone: 'neutral' }, { id: 'industry', label: 'Industry reception', value: critical + '%', tone: critical >= 65 ? 'positive' : 'negative' }, { id: 'audience', label: 'Audience response', value: audience + '%', tone: audience >= 65 ? 'positive' : 'neutral' },
    { id: 'gross', label: 'Actual gross earnings', value: formatMoney({ minor: project.grossEarned, currency: project.currency }), tone: 'positive' }, { id: 'commission', label: 'Actual agency commission', value: formatMoney({ minor: details.commissionPaid, currency: project.currency }), tone: 'negative' },
    { id: 'reputation', label: 'Industry reputation change', value: (reputation >= 0 ? '+' : '') + reputation, tone: reputation >= 0 ? 'positive' : 'negative' },
  ]);
}
function assessBrandClaim(world: World, career: Career, brand: Brand) {
  const amount = roundRatio(brand.agreedFee, 5n); if (!amount || brand.penaltyLiabilityId) return;
  const id = 'brand_claim_' + brand.id;
  world.liabilities.push({ id, ownerId: career.personId, currency: brand.currency, kind: 'settlement', principal: amount, interestBps: 0, creditorId: null, assetId: null, monthlyPayment: roundRatio(amount, 3n), remainingMonths: 3, missedPayments: 0 });
  post(world, 0n, amount, 'career-contract-penalty', 'Unfulfilled ' + brand.name + ' endorsement settlement', id, world.people[career.personId], brand.currency);
  brand.penaltyLiabilityId = id;
}
export function modelCareerMonth(world: World) {
  const month = creativeMonthNumber(world);
  for (const career of world.careers.filter(item => item.kind === 'model' && item.modelCareer)) {
    const state = career.modelCareer!, person = world.people[career.personId];
    if (person.died) { modelCareerExit(world, person.id); continue; }
    const current = career.projects.find(project => project.status === 'active' && project.creative?.kind === 'model');
    if (current) { settleCreativeMonth(world, career, releaseModel); if (current.status === 'cancelled') modelCareerExit(world, person.id); }
    for (const brand of state.brands.filter(item => item.status === 'active')) {
      const project = career.projects.find(item => item.id === brand.projectId);
      const latest = project?.periods.at(-1);
      if (latest?.month === month && latest.attended && brand.lastFulfilledQuarter < Math.floor(month / 3) && month > brand.started) { brand.fulfilled = Math.min(brand.obligations, brand.fulfilled + 1); brand.lastFulfilledQuarter = Math.floor(month / 3); }
      if (month >= brand.ends) {
        brand.status = brand.fulfilled >= brand.obligations ? 'completed' : 'breached';
        if (brand.status === 'completed') { milestone(state, 'Brand relationship fulfilled'); career.reputation = bounded(career.reputation + 4); changeContact(world, career, 'designer', 4); }
        else { assessBrandClaim(world, career, brand); career.reputation = bounded(career.reputation - 10); state.professionalism = bounded(state.professionalism - 8); changeContact(world, career, 'designer', -10); }
        fact(world, 'My agreement with ' + brand.name + (brand.status === 'completed' ? ' ended with all appearances fulfilled.' : ' ended with a recorded contract settlement after missed obligations.'), 'career', '', person.id);
      }
    }
  }
}
export function modelCareerExit(world: World, personId: string) {
  for (const career of world.careers.filter(item => item.kind === 'model' && item.personId === personId && item.modelCareer)) {
    const state = career.modelCareer!;
    if (world.people[personId].died) {
      for (const brand of state.brands) if (brand.status === 'active') brand.status = 'cancelled';
    } else for (const brand of state.brands.filter(item => item.status === 'active')) {
      const project = career.projects.find(item => item.id === brand.projectId);
      if (project?.status !== 'cancelled') continue;
      brand.status = 'breached'; assessBrandClaim(world, career, brand);
      career.reputation = bounded(career.reputation - 8); state.professionalism = bounded(state.professionalism - 5);
      changeContact(world, career, 'designer', -8);
      fact(world, 'Leaving my unfinished booking with ' + brand.name + ' created a recorded settlement claim; future wages stopped.', 'career', '', personId);
    }
    // Root lifecycle cleanup removes only a decision belonging to this interrupted commitment.
  }
}
export function resolveModelCareer(world: World, command: ModelCareerCommand) {
  const person = active(world);
  if (command.type === 'model-enter') {
    const reason = modelEntryReason(world); if (reason) throw new IneligibleAction(reason);
    const career = ensureCreativeCareer(world, 'model');
    career.modelCareer ??= emptyModel(world, career);
    ensureIndustryContacts(world, career, ['agent', 'designer', 'photographer', 'rival']);
    if (career.modelCareer.industry.boardSeason !== quarter(world) || career.modelCareer.boardCountry !== person.country) refreshOffers(world, career as Career & { modelCareer: ModelCareerState });
    result(world, 'Your modelling portfolio is open', 'Choose your specialisations and inspect real castings. Experience, presentation and professional relationships shape this career; there is no body-perfection checklist.', 'model'); return;
  }
  const career = requireModel(world), state = career.modelCareer;
  if (command.type === 'model-refresh-offers') { refreshOffers(world, career); result(world, 'The casting board is current', 'These saved opportunities keep their terms and casting response throughout this quarter. Opening the board again does not reroll them.', 'model'); return; }
  if (command.type === 'model-agency') { changeAgency(world, career, command.tier, command.negotiate); if (command.tier !== 'independent') milestone(state, 'Signed by an agency'); return; }
  if (command.type === 'model-specialise') {
    if (new Set(command.specialisations).size !== command.specialisations.length) throw new IneligibleAction('Choose different portfolio specialisations');
    state.specialisations = [...command.specialisations]; result(world, 'Your modelling identity is set', 'These areas improve your casting fit. Existing credits and all other portfolio experience remain yours.', 'model'); return;
  }
  if (command.type === 'model-portfolio') {
    const reason = modelPortfolioReason(world, command.specialisation, command.style); if (reason) throw new IneligibleAction(reason);
    const cost = modelPortfolioQuote(world, command.style); if (cost !== command.quotedCost) throw new IneligibleAction('Review the current portfolio-shoot price');
    charge(world, cost, 'career-portfolio', command.style === 'professional' ? 'Commissioned professional portfolio shoot' : 'Self-directed portfolio shoot');
    const gain = command.style === 'professional' ? 15 : 6; state.portfolio[command.specialisation] = bounded(state.portfolio[command.specialisation] + gain); state.professionalism = bounded(state.professionalism + (command.style === 'professional' ? 3 : 1)); state.lastPortfolioQuarter = quarter(world); person.stats.energy = bounded(person.stats.energy - (command.style === 'professional' ? 6 : 3)); changeContact(world, career, 'photographer', command.style === 'professional' ? 5 : 1);
    fact(world, 'I developed my ' + command.specialisation + ' portfolio through a ' + command.style + ' shoot.', 'career');
    result(world, 'Work worth showing', 'Your ' + modelSpecialisationContent[command.specialisation].title.toLowerCase() + ' portfolio improves by ' + gain + ' points. The photographer finally stops describing everything as “a conversation”.', 'model', [{ id: 'cost', label: 'Actual shoot payment', value: formatMoney({ minor: cost, currency: countries[person.country].currency }), tone: 'negative' }]); return;
  }
  if (command.type === 'model-casting' || command.type === 'model-decline') {
    const offer = state.industry.board.find(item => item.id === command.offerId); if (!offer) throw new IneligibleAction('Choose a recorded casting opportunity');
    if (command.type === 'model-decline') { if (offer.status !== 'open') throw new IneligibleAction('That opportunity has already been answered'); offer.status = 'declined'; result(world, 'The brief is someone else’s problem', 'You decline this booking without a fee or lost portfolio work. Other saved opportunities remain available.', 'model'); return; }
    const reason = modelOfferReason(world, offer); if (reason) throw new IneligibleAction(reason);
    if (command.quotedAnnualPay !== offer.annualPay) throw new IneligibleAction('Review the current booking terms');
    const definition = modelBookingDefinition(offer.category)!, fit = state.portfolio[definition.specialisation], relation = state.industry.contacts[definition.id === 'editorial' ? 'photographer' : 'designer'], contact = relation ? relationFor(world, person.id, relation) : undefined;
    const agentId = state.industry.representation.agentId, agentRelation = agentId ? relationFor(world, person.id, agentId) : undefined;
    const agencyConnection = agentRelation ? (agentRelation.trust - 35) / 8 + (state.industry.representation.rapport - 50) / 10 : 0;
    const chance = Math.max(8, Math.min(95, Math.round(person.skills.modeling * .4 + career.reputation * .15 + state.professionalism * .2 + fit * .15 + (state.specialisations.includes(definition.specialisation) ? 8 : 0) + (contact ? (contact.trust - 50) / 10 : 0) + state.industry.opportunityBoost + agencyConnection - offer.difficulty / 5)));
    if (offer.auditionRoll > chance) { offer.status = 'rejected'; state.professionalism = bounded(state.professionalism + 1); result(world, 'The booking went elsewhere', 'The client chose another model. The saved casting result stays recorded; your existing portfolio remains available for a better-fitting brief.', 'model'); return; }
    offer.status = 'accepted'; beginCreativeContract(world, career, offer);
    const project = career.projects.find(item => item.status === 'active')!, details = project.creative!; details.preparation = Math.min(100, 40 + Math.floor(state.professionalism / 3) + Math.floor(fit / 5));
    if (offer.exclusivity) {
      const brand: Brand = { id: 'model_brand_' + project.id, name: offer.title, sector: definition.specialisation, status: 'active', projectId: project.id, currency: project.currency, started: creativeMonthNumber(world), agreedFee: roundRatio(offer.annualPay * BigInt(offer.months), 12n), penaltyLiabilityId: null, lastFulfilledQuarter: quarter(world) - 1, ends: creativeMonthNumber(world) + modelBrandTerm(offer), obligations: Math.ceil(modelBrandTerm(offer) / 3), fulfilled: 0, penaltyPaid: 0n, negotiated: false };
      state.brands.push(brand); while (state.brands.length > 24) { const index = state.brands.findIndex(item => item.status !== 'active'); if (index < 0) throw new Error('Too many active modelling agreements'); state.brands.splice(index, 1); state.archivedBrands++; }
    }
    const netFee = roundRatio(offer.annualPay * BigInt(offer.months), 12n); fact(world, 'I accepted ' + offer.title + ', a ' + definition.title.toLowerCase() + '.', 'career');
    result(world, 'Your booking is signed', offer.title + ' · ' + offer.role + '. Wages arrive only during actual working months. ' + (offer.exclusivity ? 'Exclusive brand rights run for ' + modelBrandTerm(offer) + ' months; fulfil the quarterly appearances or review the real settlement terms.' : 'There are no competing-brand restrictions after this booking.'), 'model', [{ id: 'fee', label: 'Contracted gross for attended work', value: formatMoney({ minor: netFee, currency: career.currency }), tone: 'positive' }, { id: 'months', label: 'Paid production months', value: String(offer.months), tone: 'neutral' }]); return;
  }
  if (command.type === 'model-production') {
    const reason = modelProductionReason(world, command.projectId, command.action); if (reason) throw new IneligibleAction(reason);
    const project = career.projects.find(item => item.id === command.projectId)!, details = project.creative!;
    let note = '';
    if (command.action === 'prepare') { details.preparation = bounded(details.preparation + 18); details.qualityBonus = Math.min(50, details.qualityBonus + 5); state.professionalism = bounded(state.professionalism + 3); person.stats.energy = bounded(person.stats.energy - 8); person.stats.stress = bounded(person.stats.stress + 3); note = 'You rehearse the route, test the clothes and solve three problems before anybody calls them a vision.'; }
    if (command.action === 'interpret') { const accepted = details.criticRoll <= Math.min(90, 30 + Math.floor(person.skills.modeling / 2) + Math.floor(state.professionalism / 5)); details.qualityBonus = Math.max(-50, Math.min(50, details.qualityBonus + (accepted ? 13 : -8))); details.publicity = Math.max(-50, Math.min(50, details.publicity + (accepted ? 3 : 8))); changeContact(world, career, 'designer', accepted ? 7 : -6); note = accepted ? 'Your revised brief gives the campaign a point of view. The designer takes notes as though this was always the plan.' : 'Your interpretation is memorable. The client’s email asking what happened is also memorable.'; }
    if (command.action === 'negotiate') { const accepted = details.audienceRoll <= Math.min(85, 25 + Math.floor(career.reputation / 2) + Math.floor(state.industry.representation.rapport / 5)); if (accepted && person.employment?.id === project.employmentId) person.employment.annualPay = roundRatio(person.employment.annualPay * 110n, 100n); else changeContact(world, career, 'designer', -5); note = accepted ? 'The client signs a ten-percent increase on remaining wage instalments. Past payments stay exactly as paid.' : 'The client declines. Your actual contract pay stays unchanged; their next “quick favour” may be less quick.'; }
    if (command.action === 'publicity') { details.publicity = Math.min(50, details.publicity + 16); details.qualityBonus = Math.max(-50, details.qualityBonus - 4); person.publicLife.attention = bounded(person.publicLife.attention + 5); person.stats.stress = bounded(person.stats.stress + 5); note = 'You sell the campaign between takes. More people see it; slightly fewer minutes remain for making it.'; }
    details.choices.push({ id: 'model:' + command.action, choice: command.action, month: creativeMonthNumber(world), note }); fact(world, note, 'career'); result(world, 'Your modelling direction is recorded', note, 'model'); return;
  }
  const brand = state.brands.find(item => item.id === command.brandId); if (!brand) throw new IneligibleAction('Choose a recorded brand agreement');
  const reason = modelBrandReason(world, brand, command.action); if (reason) throw new IneligibleAction(reason);
  const cost = modelBrandQuote(world, brand, command.action); if (cost !== command.quotedCost) throw new IneligibleAction('Review the current brand settlement quote');
  if (command.action === 'fulfil') { brand.fulfilled++; brand.lastFulfilledQuarter = quarter(world); state.professionalism = bounded(state.professionalism + 2); changeContact(world, career, 'designer', 3); result(world, 'The brand appearance is delivered', 'You meet one recorded obligation. There is no second sponsorship payment: this work is part of the actual modelling agreement.', 'model'); }
  if (command.action === 'renegotiate') { brand.negotiated = true; const id = state.industry.contacts.designer, relationship = id ? relationFor(world, person.id, id) : undefined; const accepted = (relationship?.trust ?? 50) + career.reputation >= 115; if (accepted) { brand.ends = Math.max(creativeMonthNumber(world) + 1, brand.ends - 2); brand.obligations = Math.max(brand.fulfilled, brand.obligations - 1, 1); } else changeContact(world, career, 'designer', -4); result(world, accepted ? 'A shorter exclusivity term' : 'The original agreement stands', accepted ? 'The brand releases two months of remaining rights and one unfulfilled appearance. Past wages and the production contract remain unchanged.' : 'Your client declines the amendment. The existing saved agreement remains in force.', 'model'); }
  if (command.action === 'breach') {
    if (cost) {
      if (brand.penaltyLiabilityId) { const debt = world.liabilities.find(item => item.id === brand.penaltyLiabilityId)!; post(world, -cost, -cost, 'debt-payment', 'Modelling brand-contract settlement', debt.id, person, brand.currency); debt.principal -= cost; }
      else charge(world, cost, 'career-contract-penalty', 'Early exit from ' + brand.name, undefined, brand.currency);
      brand.penaltyPaid += cost;
    }
    brand.status = 'breached'; career.reputation = bounded(career.reputation - 8); state.professionalism = bounded(state.professionalism - 5); changeContact(world, career, 'designer', -10);
    const project = career.projects.find(item => item.id === brand.projectId && item.status === 'active'); if (project && person.employment?.id === project.employmentId) endEmployment(world, person.id);
    result(world, 'The competing-brand restriction is released', 'You settle the recorded claim and end this agreement. Earned wages remain recorded; future production wages stop if you leave the associated booking.', 'model', [{ id: 'fee', label: 'Actual settlement payment', value: formatMoney({ minor: cost, currency: brand.currency }), tone: 'negative' }]);
  }
  state.lastBrandActionMonth = creativeMonthNumber(world);
}
