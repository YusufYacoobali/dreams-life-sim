import React, { useState } from 'react';
import { useGame } from '../state/useGame';
import { outingContent, outingKinds, type OutingKind } from '../game/content/leisure';
import { leisurePayer } from '../game/systems/leisure';
import { localContactReason } from '../game/systems/lifestyleCommon';
import { rules } from '../game/rules';
import { countries } from '../game/countries';
import { formatMoney } from '../game/money';
import { fullName } from '../game/personHelpers';
import { ActionRow, Body, Card, Heading } from './components';
import { useLifestyleReview } from './LifestyleReview';
import { LifestyleEnable } from './PropertyLifestyle';
export function SharedLeisure() { const world = useGame(s => s.world)!, { ask, modal, busy } = useLifestyleReview(), [kind, setKind] = useState<OutingKind>('park'), [open, setOpen] = useState(false), person = world.people[world.activePersonId], payer = leisurePayer(world); if (!world.lifestyle)
    return <LifestyleEnable />; return <Card><Heading size={18}>Go with Someone</Heading><ActionRow title="Invite a Friend or Family Member" onPress={() => setOpen(!open)}/>{open && <>{outingKinds.map(value => <ActionRow key={value} title={outingContent[value].name} value={value === kind ? 'Selected' : undefined} onPress={() => setKind(value)}/>)}<Body muted>The player pays the reviewed tickets. Children attend with an actual available parent. Everyone must agree; refusals cost nothing.</Body>{world.relationships.filter(edge => edge.from === person.id || edge.to === person.id).map(edge => world.people[edge.from === person.id ? edge.to : edge.from]).filter(contact => !localContactReason(world, contact.id, true)).slice(0, 12).map(contact => { const participants = new Set([person.id, contact.id, payer?.id ?? person.id]), fee = rules[person.country].baseWage * BigInt(outingContent[kind].feeBps) / 10000n * BigInt(participants.size); return <ActionRow key={contact.id} title={fullName(contact)} value={formatMoney({ minor: fee, currency: countries[person.country].currency })} disabled={busy} disabledReason={!payer ? 'An actual available parent must accompany you' : undefined} onPress={() => payer && ask({ type: 'shared-leisure-outing', kind, contactId: contact.id, reviewedPayerId: payer.id, quotedFee: fee }, 'Invite ' + fullName(contact) + '?', 'Review ' + participants.size + ' tickets for ' + formatMoney({ minor: fee, currency: countries[person.country].currency }) + ', paid by ' + fullName(payer) + ' only if everyone agrees. A refusal still uses this month’s venue opportunity.')}/>; })}</>}{modal}</Card>; }
