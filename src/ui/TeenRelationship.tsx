import React, { useEffect, useRef, useState } from 'react';
import { ageOn, fullName, type World } from '../game/model';
import { relationFor } from '../game/systems/relationships';
import { currentTeenRelationship, teenRelationshipHistory } from '../game/systems/teenRelationshipSchemas';
import { teenDateReason, type TeenRelationshipCommand } from '../game/systems/teenRelationships';
import { useGame } from '../state/useGame';
import { ActionRow, Body, Button, Card, Heading } from './components';
import { EventModal, type EventPresentation } from './EventModal';
import { PersonActionArt } from '../assets/PersonActionArt';

function reviewIdentity(world: World, personId: string) {
  const actor = world.people[world.activePersonId], peer = world.people[personId], relation = peer && relationFor(world, actor.id, peer.id);
  const history = relation ? teenRelationshipHistory(world, relation.id) : [], latest = history[history.length - 1];
  return JSON.stringify([world.id, actor.id, personId, actor.country, actor.city, actor.died, peer?.country, peer?.city, peer?.died, world.date.year, ageOn(actor, world.date), peer && ageOn(peer, world.date), relation?.id, relation?.roles, relation?.romance, currentTeenRelationship(world)?.id, currentTeenRelationship(world, personId)?.id, latest?.id, latest?.status]);
}
function reviewedReason(world: World, command: TeenRelationshipCommand) {
  if (command.type === 'ask-teen-date') return teenDateReason(world, command.personId);
  const row = currentTeenRelationship(world);
  if (row?.id !== command.teenRelationshipId || row.relationshipId !== command.relationshipId) return 'Review your current teenage relationship';
}
export function TeenRelationshipCard({ world, personId, onReviewChange }: { world: World; personId: string; onReviewChange: (open: boolean) => void }) {
  const dispatch = useGame(state => state.dispatch), busy = useGame(state => state.busy), error = useGame(state => state.error);
  const [historyLimit, setHistoryLimit] = useState(6), [review, setReview] = useState<{ identity: string; command: TeenRelationshipCommand } | null>(null);
  const actor = world.people[world.activePersonId], peer = world.people[personId], relation = peer && relationFor(world, actor.id, peer.id);
  const current = currentTeenRelationship(world), active = current?.relationshipId === relation?.id ? current : undefined;
  const history = relation ? teenRelationshipHistory(world, relation.id) : [];
  const identity = reviewIdentity(world, personId), identityRef = useRef(identity), worldRef = useRef(world), submitting = useRef(false);
  identityRef.current = identity; worldRef.current = world;
  const shown = review?.identity === identity && !actor.died && peer && !peer.died ? review : null, visible = !!shown;
  useEffect(() => { onReviewChange(visible); }, [visible, onReviewChange]);
  useEffect(() => () => onReviewChange(false), [onReviewChange]);
  useEffect(() => { setReview(saved => saved && saved.identity !== identity ? null : saved); }, [identity]);
  const actorAge = ageOn(actor, world.date), peerAge = peer ? ageOn(peer, world.date) : 0;
  if (!peer || !relation || !history.length && !(actorAge >= 13 && actorAge <= 17 && peerAge >= 13 && peerAge <= 17)) return null;
  const open = (command: TeenRelationshipCommand) => { if (!busy && !submitting.current) setReview({ identity, command }); };
  const ending = shown?.command.type === 'end-teen-relationship';
  const event: EventPresentation | null = shown ? { id: shown.command.type + ':' + relation.id, kind: 'confirmation', illustration:'person-action:'+(ending?'end-teen-relationship':'ask-teen-date'), title: ending ? 'End this relationship?' : 'Ask ' + peer.firstName + (relation.romance === 'ex' ? ' on a date again?' : ' on a first date?'), body: ending ? 'End this relationship. Your bond, trust and shared history remain.' : 'Ask for a free afternoon walking together; they can say no. If accepted, you start dating and use four energy; your existing bond and trust stay the same.', terms: [], confirmLabel: ending ? 'End Relationship' : relation.romance === 'ex' ? 'Ask on a Date Again' : 'Ask on a First Date' } : null;
  return <Card><Heading size={18}>First Relationships</Heading>
    {active ? <><Body>You are seeing each other.</Body>{(actorAge >= 18 || peerAge >= 18) && <Body muted>You started seeing each other as teenagers. Spend time together or end it; new dates need both of you to be adults.</Body>}</> : !history.length ? <Body muted>Ask someone you know on a first date; they decide too.</Body> : <Body muted>Your actual first-relationship history remains.</Body>}
    {!actor.died && !peer.died && (active ? <ActionRow icon={<PersonActionArt id="end-teen-relationship" size={40} />} title="End First Relationship" subtitle="Keep your ordinary connection and shared history" disabled={busy} onPress={() => open({ type: 'end-teen-relationship', lifeId: world.id, actorId: actor.id, personId: peer.id, relationshipId: relation.id, teenRelationshipId: active.id })} /> : actorAge <= 17 && peerAge <= 17 ? <ActionRow icon={<PersonActionArt id="ask-teen-date" size={40} />} title={relation.romance === 'ex' ? 'Ask on a Date Again' : 'Ask on a First Date'} subtitle="An afternoon together · No fee · Four energy if accepted" disabled={busy} disabledReason={teenDateReason(world, peer.id)} onPress={() => { if (!teenDateReason(world, peer.id)) open({ type: 'ask-teen-date', lifeId: world.id, actorId: actor.id, personId: peer.id, relationshipId: relation.id, country: actor.country, city: actor.city }); }} /> : null)}
    {!!history.length && <><Heading size={16}>First Relationship History</Heading>{history.slice(-historyLimit).reverse().map(row => <Body key={row.id}>{row.proposed.month}/{row.proposed.year} · {fullName(world.people[row.proposerId])} asked · {row.status === 'declined' ? 'Declined; ordinary connection kept' : row.status === 'active' ? 'Both agreed; seeing each other' : row.status === 'continued-as-adults' ? 'Continued as adults in ' + row.ended!.month + '/' + row.ended!.year : 'Ended in ' + row.ended!.month + '/' + row.ended!.year + (row.endReason === 'death' ? ' after ' + fullName(world.people[row.endedById!]) + ' died' : ' by ' + fullName(world.people[row.endedById!]))}</Body>)}{history.length > historyLimit && <Button label="Earlier First Relationship History" tone="secondary" onPress={() => setHistoryLimit(historyLimit + 6)} />}</>}
    <EventModal event={event} busy={busy} error={shown ? reviewedReason(world, shown.command) ?? error : null} onCancel={() => { if (!busy && !submitting.current) setReview(null); }} onChoose={async () => {
      if (!shown || busy || submitting.current || identityRef.current !== shown.identity || reviewedReason(worldRef.current, shown.command)) return;
      submitting.current = true;
      try { if (await dispatch(shown.command) && identityRef.current === shown.identity) setReview(saved => saved === shown ? null : saved); }
      finally { submitting.current = false; }
    }} />
  </Card>;
}
