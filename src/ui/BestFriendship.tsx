import React, { useEffect, useRef, useState } from 'react';
import { fullName, type World } from '../game/model';
import { bestFriendshipReason, type FriendshipCommand } from '../game/systems/friendships';
import { bestFriendshipHistory, currentBestFriendship } from '../game/systems/friendshipSchemas';
import { relationFor } from '../game/systems/relationships';
import { useGame } from '../state/useGame';
import { ActionRow, Body, Button, Card, Heading } from './components';
import { EventModal, type EventPresentation } from './EventModal';
import { FamilyArt } from '../assets/FamilyArt';
import { PolishArt } from '../assets/PolishArt';

/** Only reviewed people, place and agreement changes replace a draft; unrelated revisions do not. */
function reviewContext(world: World, personId: string) {
  const person = world.people[world.activePersonId], friend = world.people[personId], relation = friend && relationFor(world, person.id, friend.id);
  const history = relation ? bestFriendshipHistory(world, relation.id) : [], latest = history[history.length - 1];
  return JSON.stringify([world.id, person.id, personId, person.country, person.city, person.died, friend?.country, friend?.city, friend?.died, relation?.id, relation?.roles, relation?.romance, currentBestFriendship(world)?.id, currentBestFriendship(world, personId)?.id, latest?.id, latest?.status, latest?.ended]);
}
function reviewedReason(world: World, command: FriendshipCommand) {
  if (command.type === 'propose-best-friendship') return bestFriendshipReason(world, command.personId);
  const current = currentBestFriendship(world);
  if (current?.id !== command.friendshipId || current.relationshipId !== command.relationshipId) return 'Review your current best friendship before continuing';
}

export function BestFriendshipCard({ world, personId, onReviewChange }: { world: World; personId: string; onReviewChange: (open: boolean) => void }) {
  const dispatch = useGame(state => state.dispatch), busy = useGame(state => state.busy), error = useGame(state => state.error);
  const [historyLimit, setHistoryLimit] = useState(6);
  const [review, setReview] = useState<{ command: FriendshipCommand; identity: string } | null>(null);
  const person = world.people[world.activePersonId], friend = world.people[personId], relation = friend && relationFor(world, person.id, friend.id);
  const current = currentBestFriendship(world), active = current?.relationshipId === relation?.id ? current : undefined;
  const history = relation ? bestFriendshipHistory(world, relation.id) : [];
  const identity = reviewContext(world, personId), identityRef = useRef(identity), worldRef = useRef(world), submitting = useRef(false);
  identityRef.current = identity; worldRef.current = world;
  const currentReview = review?.identity === identity && !person.died && friend && !friend.died ? review : null;
  const visible = !!currentReview;
  useEffect(() => { onReviewChange(visible); }, [visible, onReviewChange]);
  useEffect(() => () => onReviewChange(false), [onReviewChange]);
  useEffect(() => { setReview(saved => saved && saved.identity !== identity ? null : saved); }, [identity]);
  if (!friend || !relation || !relation.roles.includes('friend') && !history.length) return null;
  const reason = bestFriendshipReason(world, friend.id);
  const open = (command: FriendshipCommand) => { if (!busy && !submitting.current) setReview({ identity, command }); };
  const event: EventPresentation | null = currentReview ? { id: currentReview.command.type + ':' + relation.id, kind: 'confirmation', title: currentReview.command.type === 'propose-best-friendship' ? 'Ask ' + friend.firstName + ' to be best friends?' : 'End this best friendship?', body: currentReview.command.type === 'propose-best-friendship' ? 'You each choose one current best friend. They can decline, and your existing friendship will stay as it is.' : 'You will return to being ordinary friends. Your bond, trust and shared history stay recorded.', terms: [], confirmLabel: currentReview.command.type === 'propose-best-friendship' ? 'Ask to Be Best Friends' : 'End Best Friendship' } : null;
  return <Card><Heading size={18}>Friendship</Heading>
    <Body>{active ? 'You are best friends.' : person.died || friend.died ? 'Your shared friendship history remains.' : 'Your friendship grows through the time you actually spend together.'}</Body>
    {!person.died && !friend.died && (active ? <ActionRow icon={<FamilyArt id="conversation" size={40} />} title="End Best Friendship" subtitle="Keep your ordinary friendship and shared history" disabled={busy} onPress={() => open({ type: 'end-best-friendship', lifeId: world.id, actorId: person.id, personId: friend.id, relationshipId: relation.id, friendshipId: active.id })} /> : <ActionRow icon={<PolishArt id="friends" size={40} />} title="Become Best Friends" subtitle="Ask about a closer friendship" disabled={busy} disabledReason={reason} onPress={() => { if (!reason) open({ type: 'propose-best-friendship', lifeId: world.id, actorId: person.id, personId: friend.id, relationshipId: relation.id, country: person.country, city: person.city }); }} />)}
    {!!history.length && <><Heading size={16}>Friendship History</Heading>{history.slice(-historyLimit).reverse().map(row => <Body key={row.id}>{row.proposed.month}/{row.proposed.year} · {world.people[row.proposerId].firstName} asked · {row.status === 'declined' ? 'Declined; ordinary friendship kept' : row.status === 'active' ? 'Both agreed; current best friends' : 'Both agreed; ended ' + row.ended!.month + '/' + row.ended!.year + (row.endReason === 'death' ? ' after ' + fullName(world.people[row.endedById!]) + ' died' : row.endReason === 'romance' ? ' as the relationship became romantic' : ' by ' + world.people[row.endedById!].firstName)}</Body>)}{history.length > historyLimit && <Button label="Earlier Friendship History" tone="secondary" onPress={() => setHistoryLimit(historyLimit + 6)} />}</>}
    <EventModal event={event} busy={busy} error={currentReview ? reviewedReason(world, currentReview.command) ?? error : error} onCancel={() => { if (!busy && !submitting.current) setReview(null); }} onChoose={async () => {
      if (!currentReview || busy || submitting.current || identityRef.current !== currentReview.identity || reviewedReason(worldRef.current, currentReview.command)) return;
      submitting.current = true;
      try { if (await dispatch(currentReview.command) && identityRef.current === currentReview.identity) setReview(saved => saved === currentReview ? null : saved); }
      finally { submitting.current = false; }
    }} />
  </Card>;
}
