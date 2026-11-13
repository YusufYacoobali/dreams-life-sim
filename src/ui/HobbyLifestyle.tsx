import { useLifestyleWorld } from './useLifestyleWorld';
import React, { useState } from 'react';
import { hobbyContent, type HobbyKind } from '../game/content/leisure';
import { personHobbies } from '../game/systems/leisureSchemas';
import { leisurePayer } from '../game/systems/leisure';
import { competitionFee, competitionReason, hobbyMilestone } from '../game/systems/hobbyAccomplishments';
import { lifestyleReason, localContactReason } from '../game/systems/lifestyleCommon';
import { formatMoney } from '../game/money';
import { countries } from '../game/countries';
import { fullName } from '../game/personHelpers';
import { ActionRow, Body, Button, Card, Heading } from './components';
import { useLifestyleReview } from './LifestyleReview';
import { PersonPicker } from './PersonPicker';
import { HobbyArt } from '../assets/HobbyArt';
import { HobbyProjects } from './HobbyProjects';
export function HobbyLifestyle({ kind }: {
    kind: HobbyKind;
}) {
    const world = useLifestyleWorld()!, { ask, modal, busy } = useLifestyleReview('hobby:' + kind), [approach, setApproach] = useState<'steady' | 'bold' | 'social'>('steady'), [section, setSection] = useState<'competition' | 'friends' | null>(null), person = world.people[world.activePersonId], payer = leisurePayer(world), profile = personHobbies(world).find(row => row.kind === kind);
    if (!world.lifestyle)
        return null;
    const reason = lifestyleReason(world, false, 0), money = (minor: bigint) => formatMoney({ minor, currency: countries[person.country].currency });
    return <><Card><Heading size={18}>Make It Your Own</Heading><Body>{hobbyMilestone(profile?.proficiency ?? 0)} · {profile?.proficiency ?? 0}/100 proficiency</Body><ActionRow icon={<HobbyArt kind={kind} />} title="Competitions" subtitle="One entry per year" onPress={() => setSection(section === 'competition' ? null : 'competition')}/><ActionRow icon={<HobbyArt kind={kind} />} title="Practise with Someone" subtitle="Invite a friend or family member" onPress={() => setSection(section === 'friends' ? null : 'friends')}/>{!['swimming', 'pottery', 'fishing', 'cooking'].includes(kind) && <ActionRow title="Enjoy a Free Casual Session" subtitle="4 energy · no routine required" disabled={busy} disabledReason={reason ?? (person.stats.energy < 4 ? 'Rest before this activity' : undefined)} onPress={() => ask({ type: 'casual-hobby', kind }, 'Some time for ' + hobbyContent[kind].name.toLowerCase() + '?', 'Take some time to enjoy yourself. One casual session per month; four energy.')}/>}</Card>
  {section === 'competition' && <Card><Heading size={18}>A Local Competition</Heading><Body muted>Requires 20 proficiency and six attended months. Choose how you want to compete.</Body>{(['steady', 'bold', 'social'] as const).map(value => <ActionRow key={value} title={value === 'steady' ? 'Use Your Strongest Skills' : value === 'bold' ? 'Take a Creative Risk' : 'Focus on the People'} subtitle={value === 'steady' ? 'Higher chance · prize up to twice the entry fee' : value === 'bold' ? 'Lower chance · prize up to four times the entry fee' : 'Shared enjoyment · recognition without a cash prize'} value={approach === value ? 'Selected' : undefined} onPress={() => setApproach(value)}/>)}<Body>Entry fee if agreed: {money(competitionFee(world, kind))}</Body>{competitionReason(world, kind) && <Body muted>{competitionReason(world, kind)}</Body>}<Button label="Review Competition Entry" disabled={busy || !!competitionReason(world, kind) || !payer} onPress={() => payer && ask({ type: 'hobby-competition', kind, approach, reviewedPayerId: payer.id, quotedFee: competitionFee(world, kind) }, 'Enter a local competition?', 'Try your skills against another local enthusiast.', [{ id: 'payer', label: 'Paid by', value: fullName(payer), tone: 'neutral' }, { id: 'fee', label: 'Entry if agreed', value: money(competitionFee(world, kind)), tone: 'negative' }], <HobbyArt kind={kind} size={64} />)}/></Card>}
  <HobbyProjects kind={kind} />
  {section === 'friends' && <PersonPicker world={world} title="Practise with Someone" personIds={world.relationships.filter(edge => edge.from === person.id || edge.to === person.id).map(edge => edge.from === person.id ? edge.to : edge.from)} busy={busy} eligibility={id => localContactReason(world, id, true) ?? reason ?? (!profile ? 'Arrange and attend a routine first' : undefined)} onCancel={() => setSection(null)} onChoose={id => { setSection(null); if (profile) ask({ type: 'shared-hobby-practice', hobbyId: profile.id, contactId: id }, 'Invite ' + fullName(world.people[id]) + '?', 'Share a practice session together. Your invitation may be declined.'); }} />}

  {profile && world.lifestyle.records.some(row => row.subjectId === profile.id) && <Card><Heading size={18}>Life Beyond Practice</Heading>{world.lifestyle.records.filter(row => row.subjectId === profile.id).slice(-4).reverse().map(row => <Body key={row.id} muted>{row.date.year} · {row.body}</Body>)}</Card>}{modal}</>;
}
