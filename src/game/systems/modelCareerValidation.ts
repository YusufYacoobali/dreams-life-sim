import type { World } from '../model';
import { countries, countryCodes } from '../countries';
import { rules } from '../rules';
import { modelBookingDefinition } from '../content/modelCareer';
import { creativeMonthNumber } from './creativeSchemas';

/** Cross-reference checks supplement the persisted shape schema; legacy careers remain untouched. */
export function validateModelCareer(world: World) {
  const month = creativeMonthNumber(world);
  for (const career of world.careers) {
    const state = career.modelCareer; if (!state) continue;
    if (career.kind !== 'model') throw new Error('Modelling state belongs to a modelling career');
    const person = world.people[career.personId];
    if (new Set(state.specialisations).size !== state.specialisations.length || state.lastPortfolioQuarter > Math.floor(month / 3) || state.lastBrandActionMonth > month || state.industry.boardSeason > Math.floor(month / 3)) throw new Error('Invalid modelling development history');
    const offers = state.industry.board;
    if (new Set(offers.map(offer => offer.id)).size !== offers.length || new Set(state.boards.map(board => board.country)).size !== state.boards.length) throw new Error('Duplicate modelling casting');
    for (const board of [{ country: state.boardCountry, season: state.industry.boardSeason, offers }, ...state.boards]) {
      if (board.season > Math.floor(month / 3)) throw new Error('Modelling casting is from the future');
      for (const offer of board.offers) {
        const definition = modelBookingDefinition(offer.category);
        if (!definition || offer.months !== definition.months || offer.minSkill !== definition.minSkill || offer.minReputation !== definition.minReputation || offer.minAgency !== definition.minAgency || offer.exclusivity !== definition.exclusivity || offer.annualPay > rules[board.country].baseWage * 12n || offer.expires !== (board.season + 1) * 3 || !offer.id.includes(':' + board.country + ':' + board.season + ':')) throw new Error('Invalid recorded modelling casting');
      }
    }
    const workIds = new Set<string>();
    for (const work of state.notableWork) {
      const project = career.projects.find(item => item.id === work.projectId) ?? career.creativeArchives?.find(item => item.id === work.projectId);
      if (workIds.has(work.projectId) || !project || project.status !== 'completed' || project.creative?.kind !== 'model' || work.title !== project.name || work.quality !== project.quality || work.currency !== project.currency || work.gross !== project.grossEarned || work.prestige !== project.creative.prestige || work.date.year * 12 + work.date.month - 1 > month) throw new Error('Invalid modelling portfolio credit');
      workIds.add(work.projectId);
    }
    const brandIds = new Set<string>();
    let activeBrands = 0;
    for (const brand of state.brands) {
      const project = career.projects.find(item => item.id === brand.projectId) ?? career.creativeArchives?.find(item => item.id === brand.projectId);
      if (brandIds.has(brand.id) || !project || !project.creative || !project.creative.exclusivity || project.creative.kind !== 'model' || brand.currency !== project.currency || brand.started !== project.started.year * 12 + project.started.month - 1 || brand.ends < brand.started + 1 || brand.ends > brand.started + 12 || brand.started > month || brand.fulfilled > brand.obligations || brand.lastFulfilledQuarter > Math.floor(month / 3) || brand.status === 'active' && (person.died || month > brand.ends)) throw new Error('Invalid modelling brand agreement');
      const currencyCeiling = countryCodes.filter(code => countries[code].currency === brand.currency).reduce((max, code) => rules[code].baseWage > max ? rules[code].baseWage : max, 0n) * 20n;
      if (brand.agreedFee > currencyCeiling) throw new Error('Invalid modelling contract fee');
      if (brand.status === 'active') activeBrands++;
      if (brand.penaltyLiabilityId) {
        const debt = world.liabilities.find(item => item.id === brand.penaltyLiabilityId);
        if (!debt || debt.ownerId !== career.personId || debt.kind !== 'settlement' || debt.currency !== brand.currency || brand.status !== 'breached') throw new Error('Invalid modelling brand settlement');
      }
      brandIds.add(brand.id);
    }
    if (activeBrands > 1) throw new Error('Competing exclusive brand agreements');
    for (const id of Object.values(state.industry.contacts)) if (!world.people[id] || id === person.id || !career.contacts.includes(id)) throw new Error('Invalid modelling industry contact');
    if (state.notableWork.length + state.archivedWork > state.industry.completed || state.industry.representation.agentId && !world.people[state.industry.representation.agentId]) throw new Error('Invalid modelling career progression');
    if (state.boardCountry !== person.country && offers.some(offer => offer.status === 'accepted' && career.projects.some(project => project.status === 'active' && project.creative?.offerId === offer.id) && countries[state.boardCountry].currency !== career.currency)) throw new Error('Modelling booking currency is inconsistent');
  }
}
