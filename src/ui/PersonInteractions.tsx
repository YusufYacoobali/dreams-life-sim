import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import type { World } from '../game/model';
import type { GameCommand } from '../game/engine';
import { personActionOptions, personActionReason, type PersonAction } from '../game/systems/personInteractions';
import { loanOfferReason, pendingPersonLoanOffers, supportAmountOptions, supportRequestReason } from '../game/systems/personSupport';
import { relationFor } from '../game/systems/relationships';
import { formatMoney } from '../game/money';
import { useGame } from '../state/useGame';
import { PersonActionArt } from '../assets/PersonActionArt';
import { ActionRow, Body, Button, Heading } from './components';
import { EventModal, type EventPresentation } from './EventModal';
import { useColors } from './theme';

type SupportKind = 'money' | 'loan';
type Review = { context: string } & (
  { kind: 'support'; request: SupportKind; options: ReturnType<typeof supportAmountOptions> }
  | { kind: 'action'; action: PersonAction }
);

function personContext(world: World, personId: string) {
  const actor = world.people[world.activePersonId], target = world.people[personId], relation = target && relationFor(world, actor.id, personId);
  return JSON.stringify([world.id, actor.id, personId, actor.died, target?.died, actor.country, target?.country, relation?.id, relation?.roles, relation?.romance, world.date.year]);
}

/** These rows quote core actions; all consent, money movement and results stay in the engine. */
export function usePersonInteractions(world: World, personId: string, blocked = false) {
  const dispatch = useGame(state => state.dispatch), busy = useGame(state => state.busy), error = useGame(state => state.error), c = useColors();
  const [review, setReview] = useState<Review | null>(null);
  const context = personContext(world, personId), contextRef = useRef(context), worldRef = useRef(world), blockedRef = useRef(blocked), submitting = useRef(false), mounted = useRef(true);
  contextRef.current = context; worldRef.current = world; blockedRef.current = blocked;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { setReview(saved => saved?.context !== context ? null : saved); }, [context]);
  const target = world.people[personId], shown = review?.context === context && target && !target.died ? review : null;
  const reviewRef = useRef<Review | null>(shown); reviewRef.current = shown;
  const options = target ? personActionOptions(world, personId) : [];
  const disabled = busy || !!world.pending || blocked;
  const run = async (command: GameCommand, expectedContext = context, expectedReview?: Review) => {
    if (!mounted.current || busy || blockedRef.current || submitting.current || contextRef.current !== expectedContext || worldRef.current.pending) return;
    submitting.current = true;
    try {
      if (await dispatch(command) && mounted.current && contextRef.current === expectedContext) setReview(saved => !expectedReview || saved === expectedReview ? null : saved);
    } finally { submitting.current = false; }
  };
  const actionRow = (option: typeof options[number]) => <ActionRow key={option.id} title={option.label} subtitle={option.subtitle}
    icon={<PersonActionArt id={option.id} size={40} />}
    disabled={disabled} disabledReason={option.disabledReason} onPress={() => {
      if (disabled || submitting.current || personActionReason(worldRef.current, personId, option.id)) return;
      if (option.id === 'insult' || option.id === 'distance' || option.id === 'scold') setReview({ kind: 'action', action: option.id, context });
      else void run({ type: 'person-action', lifeId: world.id, actorId: world.activePersonId, personId, action: option.id });
    }} />;
  const supportRows = options.filter(option => !['insult', 'distance', 'request-gift'].includes(option.id)).map(actionRow);
  const conflictRows = options.filter(option => option.id === 'insult' || option.id === 'distance').map(actionRow);
  const moneyRows = options.filter(option => option.id === 'request-gift').map(actionRow);
  if (target) {
    for (const request of ['money', 'loan'] as const) {
      const amounts = supportAmountOptions(world, personId, request);
      if (!amounts.length) continue;
      moneyRows.push(<ActionRow key={'request-' + request} title={request === 'money' ? 'Ask for Money' : 'Ask for a Loan'}
        subtitle={request === 'money' ? 'Choose an amount and ask for help' : 'Interest-free · Repay when you can'}
        icon={<PersonActionArt id={request==='money'?'ask-money':'ask-loan'} size={40} />} disabled={disabled} disabledReason={supportRequestReason(world, personId, request)}
        onPress={() => { if (!disabled && !submitting.current && !supportRequestReason(worldRef.current, personId, request)) setReview({ kind: 'support', request, options: amounts, context }); }} />);
    }
    for (const offer of pendingPersonLoanOffers(world, personId)) {
      const reason = loanOfferReason(world, offer.id);
      moneyRows.push(<View key={offer.id} style={{ borderColor: c.line, borderWidth: 1, borderRadius: 12, padding: 14, gap: 10 }}>
        <Heading size={17}>Loan offer from {target.firstName}</Heading>
        <Body>{formatMoney({ minor: offer.offered, currency: offer.currency })} · Interest-free · Repay when you can</Body>
        <Body muted>You owe this money back only if you accept.</Body>
        {reason && <Body muted>{reason}</Body>}
        <View style={{flexDirection:'row',alignItems:'center',gap:10}}><PersonActionArt id="accept-loan" size={32} /><View style={{flex:1,minWidth:0}}><Button label="Accept Loan" disabled={disabled || !!reason} onPress={() => void run({ type: 'respond-person-loan', lifeId: world.id, actorId: world.activePersonId, requestId: offer.id, accept: true })} /></View></View>
        <View style={{flexDirection:'row',alignItems:'center',gap:10}}><PersonActionArt id="decline-loan" size={32} /><View style={{flex:1,minWidth:0}}><Button label="Decline Loan" tone="secondary" disabled={disabled} onPress={() => void run({ type: 'respond-person-loan', lifeId: world.id, actorId: world.activePersonId, requestId: offer.id, accept: false })} /></View></View>
      </View>);
    }
    const debts = world.liabilities.filter(debt => debt.ownerId === world.activePersonId && debt.kind === 'personal' && debt.creditorId === personId && debt.principal > 0n);
    for (const debt of debts) moneyRows.push(<ActionRow key={debt.id} title={'Loan from ' + target.firstName}
      subtitle={formatMoney({ minor: debt.principal, currency: debt.currency }) + ' left to repay · ' + (debt.interestBps ? debt.interestBps / 100 + '% annual interest' : 'Interest-free')}
      value="Repay" icon={<PersonActionArt id="repay-loan" size={40} />} onPress={() => router.push('/bank')} />);
  }
  let event: EventPresentation | null = null;
  if (shown?.kind === 'support' && target) event = {
    id: 'person-support:' + shown.request + ':' + context, kind: 'selection', illustration:'person-action:'+(shown.request==='money'?'ask-money':'ask-loan'),
    title: (shown.request === 'money' ? 'Ask ' : 'Borrow from ') + target.firstName + (shown.request === 'money' ? ' for money' : ''),
    body: shown.request === 'money' ? 'They can give, offer less, offer a loan or say no.' : 'Ask for an interest-free loan. You choose whether to accept any offer.',
    confirmLabel: shown.request === 'money' ? 'Ask for Money' : 'Ask for a Loan',
    choices: shown.options.map(option => ({ id: option.id, label: option.label, disabledReason: supportRequestReason(world, personId, shown.request, option.amount) ?? option.disabledReason })),
  };
  else if (shown?.kind === 'action' && target) event = {
    id: 'person-action:' + shown.action + ':' + context, kind: 'confirmation', illustration:'person-action:'+shown.action,
    title: shown.action === 'distance' ? 'Distance yourself from ' + target.firstName + '?' : (shown.action === 'insult' ? 'Insult ' : 'Scold ') + target.firstName + '?',
    body: shown.action === 'distance' ? 'Take a step back from this relationship.' : shown.action === 'insult' ? 'Say something unkind. They may take it personally.' : 'Let them know you disapprove.',
    terms: [], confirmLabel: shown.action === 'distance' ? 'Distance Yourself' : shown.action === 'insult' ? 'Insult' : 'Scold',
  };
  const modal = <EventModal event={event} busy={busy} error={error} onCancel={() => {
    if (!busy && !submitting.current && reviewRef.current === shown) { reviewRef.current = null; setReview(saved => saved === shown ? null : saved); }
  }} onChoose={async selected => {
    if (!shown || reviewRef.current !== shown || !mounted.current || busy || submitting.current || contextRef.current !== shown.context) return;
    if (shown.kind === 'action') {
      if (!personActionReason(worldRef.current, personId, shown.action)) await run({ type: 'person-action', lifeId: world.id, actorId: world.activePersonId, personId, action: shown.action }, shown.context, shown);
    } else {
      const option = shown.options.find(row => row.id === selected);
      if (option && !supportRequestReason(worldRef.current, personId, shown.request, option.amount)) await run({ type: 'ask-person-support', lifeId: world.id, actorId: world.activePersonId, personId, kind: shown.request, amount: option.amount, currency: option.currency }, shown.context, shown);
    }
  }} />;
  return { supportRows, conflictRows, moneyRows, modal, reviewing: !!shown, canLeave: () => !submitting.current };
}
