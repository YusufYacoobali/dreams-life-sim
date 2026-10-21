import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { activeSentence, isConfined } from '../../src/game/systems/legal';
import { ActionRow, Body, Button, Card, Header, Heading, Page, StatBar } from '../../src/ui/components';
import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
import { useColors } from '../../src/ui/theme';
import { LegalReviewError } from '../../src/ui/LegalReview';
export default function Prison() {
  const world = useGame(s => s.world)!, sentence = activeSentence(world), c = useColors(), busy = useGame(s => s.busy), dispatch = useGame(s => s.dispatch), error = useGame(s => s.error), confined = isConfined(world);
  const failure = <LegalReviewError error={world.pending ? null : error} />;
  return <Page footer={confined ? <>{failure}<Button label={world.annual ? 'Continue This Year' : 'Age Up'} busy={busy} disabled={!!world.pending} onPress={() => void dispatch({ type: world.annual ? 'resume' : 'advance' })} /></> : undefined}>
    <Header title={sentence ? 'Prison' : 'Custody'} onBack={() => router.back()} />
    {!confined && failure}
    <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><HealthLegalArt id="prison" size={56} /><View style={{ flex: 1 }}><Heading size={20}>{sentence?.facility ?? (confined ? 'Held on remand' : 'Outside custody')}</Heading></View></View>{sentence ? <><Heading size={18}>{Math.max(0, sentence.totalMonths - sentence.servedMonths - sentence.creditedMonths)} months remaining</Heading><Body muted>{sentence.servedMonths} served · {sentence.creditedMonths} remand credit · {sentence.totalMonths} total</Body><StatBar label="Conduct" value={sentence.behavior} color={c.teal} /></> : <Body muted>{confined ? 'Your hearing and representation are listed in Cases & Court.' : 'You have no active custody order.'}</Body>}</Card>
    <Card><Heading size={18}>{confined ? 'While in Custody' : 'Support & Legal Options'}</Heading>{sentence && <ActionRow title="Prison Activities" subtitle="Work, study, exercise, appeals and parole" icon={<HealthLegalArt id="prison-meal" size={36} />} onPress={() => router.push('/prison-activities')} />}<ActionRow title="Cases & Court" subtitle="Charges, bail and counsel" icon={<HealthLegalArt id="court" size={36} />} onPress={() => router.push('/cases')} /><ActionRow title="Clinical Care" subtitle="Essential care is provided in custody" icon={<HealthLegalArt id="doctor" size={36} />} onPress={() => router.push('/doctor')} /><ActionRow title="Family & Contacts" subtitle="Talk with family and friends" icon={<HealthLegalArt id="prison-visit" size={36} />} onPress={() => router.push('/relationships')} /></Card>
  </Page>;
}
