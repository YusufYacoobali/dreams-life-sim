import type { World } from './model';
import type { BoundChoice } from './runtime';
/** Funds can change while a higher-priority decision is resolved; no fake reservation is made. */
export function choiceUnavailable(world: World, choice: BoundChoice): string | undefined {
  if (choice.disabledReason) return choice.disabledReason;
  for (const effect of choice.effects) {
    if (effect.kind === 'legal-bail') {
      const item = world.cases.find(candidate => candidate.id === effect.caseId), account = item && world.accounts.find(candidate => candidate.ownerId === item.personId && candidate.currency === item.bail.currency);
      if (!item || !account || account.cash - account.lockedCash < item.bail.minor) return 'Insufficient available funds';
    }
    if (effect.kind === 'transfer') { const account = world.accounts.find(candidate => candidate.id === effect.fromAccountId); if (!account || account.cash - account.lockedCash < effect.minor) return 'Insufficient available funds'; }
  }
}
