import { escapeRounds, escapeSequence } from '../../src/minigames/escape/escapeLogic';
import type { MiniGameInput, MiniGameSession } from '../../src/minigames/core/types';

export function memorySolution(session: MiniGameSession): MiniGameInput[] {
  const actions: MiniGameInput['action'][] = [];
  for (let round = 0; round < escapeRounds(session.difficulty); round++) {
    actions.push({ type: 'escape-recall' });
    for (const symbol of escapeSequence(session, round)) actions.push({ type: 'stamp', symbol });
  }
  return actions.map((action, index) => ({ at: (index + 1) * 100, action }));
}
