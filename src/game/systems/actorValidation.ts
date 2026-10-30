import type { World } from '../model';
import { actorProjectTypes } from '../content/actor';
/** Cross-world checks are prospective: legacy projects have no creative metadata. */
export function validateActor(world: World) {
  for (const career of world.careers) {
    const state = career.actor;
    if (!state) continue;
    const allProjects = [...career.projects, ...(career.creativeArchives ?? [])];
    const completed = allProjects.filter(project => project.status === 'completed');
    const newCompleted = completed.filter(project => project.creative?.kind === 'actor');
    if (career.kind !== 'actor' || state.boardCountry !== career.country || state.credits !== completed.length || state.leadingCredits !== newCompleted.filter(project => project.creative!.role === 'lead').length || state.hits !== newCompleted.filter(project => ['hit', 'blockbuster'].includes(project.creative!.release?.commercial ?? '')).length || state.awards !== completed.filter(project => !!project.award).length || state.nominations !== newCompleted.filter(project => project.creative!.release?.nomination).length || state.industry.completed !== state.credits || state.comeback && !state.collapseCount)
      throw new Error('Invalid acting career progression');
    if (state.industry.contacts && Object.values(state.industry.contacts).some(id => !world.people[id] || id === career.personId || !career.contacts.includes(id))) throw new Error('Invalid acting industry contacts');
    if (new Set(state.savedBoards.map(board => board.country)).size !== state.savedBoards.length || state.savedBoards.some(board => board.season !== state.industry.boardSeason)) throw new Error('Invalid saved acting casting boards');
    const boardIds = new Set<string>();
    for (const saved of state.savedBoards) {
      const ids = new Set<string>();
      for (const offer of saved.offers) {
        if (ids.has(offer.id) || !offer.id.startsWith(career.id + ':casting:' + saved.country + ':' + saved.season + ':') || !(actorProjectTypes as readonly string[]).includes(offer.category) || offer.expires < saved.season * 3 || offer.expires > saved.season * 3 + 2) throw new Error('Invalid cached acting casting board');
        ids.add(offer.id);
      }
    }
    for (const offer of state.industry.board) {
      if (boardIds.has(offer.id) || !offer.id.startsWith(career.id + ':casting:' + state.boardCountry + ':' + state.industry.boardSeason + ':') || !(actorProjectTypes as readonly string[]).includes(offer.category) || offer.expires < state.industry.boardSeason * 3 || offer.expires > state.industry.boardSeason * 3 + 2) throw new Error('Invalid saved acting opportunity');
      boardIds.add(offer.id);
    }
    for (const project of allProjects) {
      const creative = project.creative;
      if (!creative || creative.kind !== 'actor') continue;
      if (!(actorProjectTypes as readonly string[]).includes(creative.category) || creative.term !== project.targetMonths || project.status === 'active' && creative.release || creative.commissionPaid > project.grossEarned || creative.processedGross > project.grossEarned) throw new Error('Invalid acting production');
      const release = creative.release;
      if (release && (project.status === 'active' || release.nomination && (release.critical < 76 || creative.prestige < 60 || project.status !== 'completed') || project.award && (!release.nomination || release.critical < 80 || project.responseRoll > 10 || project.quality < 80))) throw new Error('Invalid acting release');
      const choices = new Set<string>();
      for (const choice of creative.choices) {
        if (choices.has(choice.id)) throw new Error('A production choice was recorded twice');
        choices.add(choice.id);
      }
    }
  }
}
