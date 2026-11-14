import type { MiniGameSession, MiniGameInput } from '../../src/minigames/core/types';
import { cellBoard } from '../../src/minigames/escape/cellEscapeLogic';
import { escapeSequence } from '../../src/minigames/escape/escapeLogic';
import { memorySolution } from './escapeMemory';
export function escapeSolution(session: MiniGameSession): MiniGameInput[] {
  if (session.escapeVersion === 2) return memorySolution(session);
  const actions: MiniGameInput['action'][] = session.escapeVersion === 3 ? cellBoard(session).locks.map(lock => ({ type: 'escape-fit', keyId: lock.keyId, lockId: lock.id })) : escapeSequence(session).map(symbol => ({ type: 'stamp', symbol }));
  return actions.map((action, index) => ({ at: (index + 1) * 100, action }));
}
