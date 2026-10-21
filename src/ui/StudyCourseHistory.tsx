import React, { useState } from 'react';
import type { World } from '../game/model';
import { ActionRow, Body, Card, Heading } from './components';

const date = (value: World['date']) => value.day + '/' + value.month + '/' + value.year;
export function StudyCourseHistory({ world }: { world: World }) {
  const [limit, setLimit] = useState(4), history = world.studyCourses.filter(item => item.personId === world.activePersonId && item.status !== 'active').slice().reverse();
  if (!history.length) return null;
  return <Card><Heading size={18}>Previous courses</Heading>{history.slice(0, limit).map(item => <React.Fragment key={item.id}>
    <Body>{item.school} · {item.field}</Body>
    <Body>{item.status === 'observed-incomplete' ? 'Earlier incomplete course observed' : item.status === 'withdrawn' ? 'Left the course' : item.status === 'completed' ? 'Completed' : item.status === 'failed' ? 'Passing grade not met' : 'Ended at death'}</Body>
    <Body muted>{item.months} of {item.requiredMonths} study months recorded · {item.tuitionPaidMonths} months of tuition coverage recorded</Body>
    <Body muted>{item.started ? 'Started ' + date(item.started) : 'Start date unrecorded'} · {item.ended ? 'Ended ' + date(item.ended) : 'Historical end date unrecorded'}</Body>
    {item.origin !== 'enrolment' && <Body muted>Observed {date(item.recorded)}. Earlier payment amounts and course currency were not reconstructed.</Body>}
  </React.Fragment>)}{history.length > limit && <ActionRow title="Show Earlier Courses" onPress={() => setLimit(limit + 4)} />}</Card>;
}
