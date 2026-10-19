import type { World } from './model';
import type { BoundChoice } from './runtime';
import { storyContextReason } from './systems/storyContext';
import { storyChoiceReason } from './systems/stories';
/** Funds can change while a higher-priority decision is resolved; no fake reservation is made. */
export function choiceUnavailable(world: World, choice: BoundChoice): string | undefined {
  if (choice.disabledReason) return choice.disabledReason;
  for (const effect of choice.effects) {
    if (effect.kind === 'schedule-story') { const reason = storyContextReason(world, effect); if (reason) return reason; }
    if (effect.kind === 'resolve-story') { const reason = storyChoiceReason(world, effect.threadId, effect.resolution); if (reason) return reason; }
    if (effect.kind === 'brand-decision' && effect.accepted && (world.people[world.activePersonId].publicLife.image < 25 || world.sentences.some(item => item.personId === world.activePersonId && item.state === 'active') || world.cases.some(item => item.personId === world.activePersonId && item.detained && item.status === 'awaiting-trial'))) return 'This agreement is unavailable in your current circumstances';
    if (effect.kind === 'legal-bail') {
      const item = world.cases.find(candidate => candidate.id === effect.caseId), account = item && world.accounts.find(candidate => candidate.ownerId === item.personId && candidate.currency === item.bail.currency);
      if (!item || !account || account.cash - account.lockedCash < item.bail.minor) return 'Insufficient available funds';
    }
    if (effect.kind === 'transfer') { const account = world.accounts.find(candidate => candidate.id === effect.fromAccountId); if (!account || account.cash - account.lockedCash < effect.minor) return 'Insufficient available funds'; }
  }
}
