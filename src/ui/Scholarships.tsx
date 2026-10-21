import React, { useState } from 'react';
import type { World } from '../game/model';
import { formatMoney } from '../game/money';
import { Scholarship, scholarshipPolicies } from '../game/systems/scholarshipSchemas';
import { scholarshipOfferReason } from '../game/systems/scholarships';
import { enrollmentReason } from '../game/systems/education';
import { matchingAdmission, universityApplicationReason, universityPlaceReason } from '../game/systems/universityAdmissions';
import { ActionRow, Body, Button, Card, Heading } from './components';

export function Scholarships({ world, onUse, busy = false }: { world: World; onUse?: (item: Scholarship) => void; busy?: boolean }) {
  const [earlier, setEarlier] = useState(false), items = world.scholarships.filter(item => item.personId === world.activePersonId).slice().reverse();
  if (!items.length) return null;
  return <><Heading size={18}>Your scholarship applications</Heading>{(earlier ? items : items.slice(0, 4)).map(item => {
    const admission = item.status === 'offered' && item.program === 'university' ? matchingAdmission(world, item.field) : undefined;
    const courseReason = item.status !== 'offered' ? undefined : item.program !== 'university' ? enrollmentReason(world, item.program, item.field) : admission?.status === 'waitlisted' ? 'Your university application is waiting for its final decision' : admission ? universityPlaceReason(world, admission.id, undefined, item.id) : universityApplicationReason(world, item.field);
    const policy = scholarshipPolicies[item.kind], money = (minor: bigint) => formatMoney({ minor, currency: item.currency }), useReason = item.status === 'offered' ? courseReason ?? scholarshipOfferReason(world, item, item.program, item.field) : undefined;
    return <Card key={item.id}><Heading size={18}>{policy.label}</Heading><Body>{item.program} · {item.field} · {item.city}</Body><Body>{item.status[0].toUpperCase() + item.status.slice(1)}{item.lossReason ? ' · ' + (item.lossReason === 'grades' ? 'renewal grade not met' : 'resource limit exceeded') : ''}</Body>
      {item.status === 'offered' && <><Body muted>{policy.coverageBps / 100}% of tuition waived. Use before {item.expires.day}/{item.expires.month}/{item.expires.year}; admission is separate.</Body>{onUse && <Button label="Review Course With This Offer" disabled={busy || !!useReason} onPress={() => onUse(item)} />}{useReason && <Body muted>{useReason}</Body>}</>}
      {item.status === 'active' && <Body muted>Renewal needs {policy.renewalGrade}% grades{item.kind === 'access' ? ' and assessed resources no greater than one year of tuition' : ''}. Living costs are separate.</Body>}
      {item.periods.length > 0 && <><Body>Total tuition waived: {money(item.periods.reduce((sum, period) => sum + period.waived, 0n))}</Body>{item.periods.map(period => <Body key={period.studyMonth} muted>Study year {period.studyMonth / 12 + 1}: {money(period.waived)} waived · {money(period.billed)} billed{period.billed ? period.funding === 'loan' ? ' through a student loan' : ' from your balance' : ''}</Body>)}</>}
    </Card>;
  })}{items.length > 4 && <ActionRow title={earlier ? 'Show Recent Applications' : 'Show Earlier Applications'} onPress={() => setEarlier(!earlier)} />}</>;
}
