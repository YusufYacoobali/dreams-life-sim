import { useEffect, useId, useRef } from 'react';
import type { GameCommand } from '../game/engine';
import { useGame } from '../state/useGame';

/** Errors belong to the mounted workflow that submitted an action, never a save. */
export function useScopedGameAction(context = '') {
  const id = useId();
  const identity = useGame(state => state.world ? state.world.id + ':' + state.world.activePersonId : 'none');
  const scope = id + ':' + identity + ':' + context;
  const dispatch = useGame(state => state.dispatch), busy = useGame(state => state.busy);
  const clearError = useGame(state => state.clearError);
  const error = useGame(state => state.errorScope === scope ? state.error : null);
  const current = useRef(scope), mounted = useRef(true), submitting = useRef(false);
  current.current = scope;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  return {
    busy, error,
    clear: () => clearError?.(),
    async dispatch(command: GameCommand) {
      if (!mounted.current || current.current !== scope || busy || submitting.current) return false;
      submitting.current = true;
      try { return await dispatch(command, scope); }
      finally {
        submitting.current = false;
        if (!mounted.current || current.current !== scope) clearError?.(scope);
      }
    },
  };
}
