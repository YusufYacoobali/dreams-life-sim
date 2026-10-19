import React from 'react';
import { View } from 'react-native';
import { countries } from '../game/countries';
import { fullName, World } from '../game/model';
import { formatMoney } from '../game/money';
import { storyMonthNumber } from '../game/systems/storyContext';
import { Body, Card, Heading } from './components';
import { SchoolArt } from '../assets/SchoolArt';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const when = (month: number) => months[month % 12] + ' ' + Math.floor(month / 12);
const resolutions = { attend: 'Attended', decline: 'Stayed home', complete: 'Finished my section', 'ask-help': 'Completed with help', 'leave-to-peer': 'Left my section blank' };

/** A read-only view of committed plans. Opening school never advances a deadline. */
export function SchoolPlans({ world }: { world: World }) {
  const own = world.storyThreads.filter(thread => thread.personId === world.activePersonId);
  if (!own.length) return null;
  const open = own.filter(thread => thread.status === 'scheduled' || thread.status === 'offered').sort((a, b) => a.dueMonth - b.dueMonth);
  const ended = own.filter(thread => thread.status === 'resolved' || thread.status === 'cancelled').sort((a, b) => storyMonthNumber(b.ended!) - storyMonthNumber(a.ended!)).slice(0, 4);
  return <Card><Heading size={18}>School Plans</Heading>
    {open.length > 0 && <Body muted>Age Up continues to the date of each plan. You choose what to do when it is due.</Body>}
    {[...open, ...ended].map(thread => {
      const parent = thread.parentId && world.people[thread.parentId], teacher = thread.teacherId && world.people[thread.teacherId];
      const arcade = thread.kind === 'arcade-invitation', active = thread.status === 'scheduled' || thread.status === 'offered';
      return <View key={thread.id} style={{ gap: 5, paddingVertical: 9 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><SchoolArt id={arcade ? 'arcade' : 'project'} size={40} /><View style={{ flex: 1 }}><Heading size={16}>{arcade ? 'Arcade birthday' : 'Shared class project'} · {fullName(world.people[thread.peerId])}</Heading></View></View>
        <Body muted>{thread.city}, {countries[thread.country].name} · {when(thread.dueMonth)}</Body>
        {parent && <Body>{thread.permission?.accepted ? 'Permission agreed by ' : 'Permission declined by '}{fullName(parent)}</Body>}
        {teacher && <Body>Teacher: {fullName(teacher)}</Body>}
        {active ? <>
          <Body>{thread.status === 'offered' ? 'Waiting for your decision' : 'Scheduled'}</Body>
          {parent && <Body muted>{formatMoney({ minor: thread.quote.amount, currency: thread.quote.currency }, countries[thread.country].locale)} from {parent.firstName}’s available balance only if you attend. Nothing paid yet.</Body>}
        </> : thread.status === 'cancelled' ? <>
          <Body>Cancelled · {thread.cancellationReason}</Body>
          {arcade && <Body muted>No outing charge.</Body>}
        </> : <>
          <Body>{resolutions[thread.resolution!]}</Body>
          {parent && <Body muted>{thread.paidTransactionId ? 'Paid by ' + fullName(parent) + ' · ' + formatMoney({ minor: thread.quote.amount, currency: thread.quote.currency }, countries[thread.country].locale) : 'No outing charge.'}</Body>}
        </>}
      </View>;
    })}
    {own.length - open.length > ended.length && <Body muted>Showing your four most recent finished plans. Earlier entries remain in your Life journal.</Body>}
  </Card>;
}
