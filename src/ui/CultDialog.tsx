import { usePremiumAction } from '../purchases/PurchaseUI';
import React, { useEffect, useRef, useState } from 'react';
import type { CultCommand } from '../game/systems/cultSchemas';
import { useGame } from '../state/useGame';
import { CultArt, type CultArtId } from '../assets/CultArt';
import {
  EventModal,
  type EventPresentation,
  type EffectRow,
  type SelectionSearch,
} from './EventModal';
type Dialog = {
  identity: string;
  event: EventPresentation;
  command?: CultCommand;
  onSelect?: (id: string) => void;
  search?: SelectionSearch;
};
export function useCultDialog(cultId?: string) {
  const dispatch = useGame((state) => state.dispatch),
    busy = useGame((state) => state.busy),
    error = useGame((state) => state.error),
    clearError = useGame((state) => state.clearError);
  const identity = useGame((state) => {
    const world = state.world;
    if (!world) return 'none';
    const person = world.people[world.activePersonId],
      cult = world.cults.find((row) => row.id === cultId);
    return JSON.stringify([
      world.id,
      person.id,
      person.country,
      person.city,
      person.died,
      cultId,
      cult?.leaderId,
      cult?.status,
    ]);
  });
  const premium = usePremiumAction(identity);
  const [dialog, setDialog] = useState<Dialog | null>(null),
    current = useRef<Dialog | null>(null),
    context = useRef(identity),
    mounted = useRef(true),
    submitting = useRef(false),
    sequence = useRef(0);
  context.current = identity;
  if (current.current?.identity !== identity) current.current = null;
  const shown =
    dialog === current.current && dialog?.identity === identity ? dialog : null;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      current.current = null;
    };
  }, []);
  useEffect(
    () => setDialog((saved) => (saved?.identity === identity ? saved : null)),
    [identity],
  );
  const isCurrent = (value: Dialog) =>
    mounted.current &&
    context.current === value.identity &&
    current.current === value;
  const close = (value: Dialog) => {
    if (!isCurrent(value)) return;
    current.current = null;
    setDialog((saved) => (saved === value ? null : saved));
  };
  function open(
    event: EventPresentation,
    extra: Pick<Dialog, 'command' | 'onSelect' | 'search'> = {},
  ) {
    if (
      !mounted.current ||
      busy ||
      submitting.current ||
      context.current !== identity
    )
      return;
    const value = { identity, event, ...extra };
    clearError();
    current.current = value;
    setDialog(value);
  }
  const art = (id: CultArtId) => <CultArt id={id} size={64} />;
  return {
    open: !!shown,
    select(
      title: string,
      body: string,
      choices: readonly {
        id: string;
        label: string;
        disabledReason?: string;
        illustration?: React.ReactNode;
      }[],
      onSelect: (id: string) => void,
      id: CultArtId = 'cult',
      illustration?: React.ReactNode,
      search?: SelectionSearch,
    ) {
      open(
        {
          kind: 'selection',
          id: identity + ':select:' + sequence.current++,
          title,
          body,
          choices,
          confirmLabel: 'Choose',
          illustration: illustration ?? art(id),
        },
        { onSelect, search },
      );
    },
    confirm(
      command: CultCommand,
      title: string,
      body: string,
      terms: EffectRow[] = [],
      id: CultArtId = 'cult',
      label = 'Confirm',
    ) {
      premium.run(command.type === 'found-cult' ? 'cult' : null, command.type, () => {
      open(
        {
          kind: 'confirmation',
          id: identity + ':review:' + sequence.current++,
          title,
          body,
          terms,
          confirmLabel: label,
          illustration: art(id),
        },
        { command },
      );
      });
    },
    info(
      title: string,
      body: string,
      effects: EffectRow[] = [],
      id: CultArtId = 'cult',
    ) {
      open({
        kind: 'result',
        id: identity + ':record:' + sequence.current++,
        title,
        body,
        effects,
        continueLabel: 'Close',
        illustration: art(id),
      });
    },
    modal: (
      <>{premium.modal}<EventModal
        event={shown?.event ?? null}
        busy={busy}
        selectionSearch={shown?.search}
        error={shown?.command ? error : null}
        onCancel={
          shown?.event.kind === 'result'
            ? undefined
            : () => {
                if (shown && !busy && !submitting.current) close(shown);
              }
        }
        onClose={() => {
          if (shown && !busy && !submitting.current) close(shown);
        }}
        onChoose={async (id) => {
          if (!shown || busy || submitting.current || !isCurrent(shown)) return;
          if (shown.onSelect) {
            const choose = shown.onSelect;
            close(shown);
            choose(id);
            return;
          }
          if (!shown.command) {
            close(shown);
            return;
          }
          submitting.current = true;
          try {
            if ((await dispatch(shown.command)) && isCurrent(shown))
              close(shown);
          } finally {
            submitting.current = false;
          }
        }}
      /></>
    ),
  };
}
