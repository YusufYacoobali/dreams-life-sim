import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
import { CultArt } from '../../src/assets/CultArt';
import { activeCult } from '../../src/game/systems/cultSchemas';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { serviceCatalog,serviceKinds } from '../../src/game/content/services';
import { creatorCatalog } from '../../src/game/content/creators';
import { creatorKinds } from '../../src/game/systems/creatorSchemas';
import { careerKinds, careerCatalog } from '../../src/game/content/careers';
import { ActionRow, Body, Card, Header, Heading, Page } from '../../src/ui/components';
import { PlatformMark } from '../../src/assets/PlatformMark';
import { CareerArt } from '../../src/assets/CareerArt';
import { FameBusinessArt } from '../../src/assets/FameBusinessArt';
import { Illustration } from '../../src/assets/Illustration';
import { useEntitlement } from '../../src/purchases/hooks';
import { requiredCareerFeature, type PremiumCareerFeature } from '../../src/purchases/access';
import { usePremiumAction } from '../../src/purchases/PurchaseUI';
import { useColors } from '../../src/ui/theme';
import type { World } from '../../src/game/model';

function PremiumCareerRow({ world, feature, title, subtitle, icon, onOpen, onRequest }: { world: World; feature: PremiumCareerFeature; title: string; subtitle: string; icon: React.ReactNode; onOpen: () => void; onRequest: (feature: PremiumCareerFeature, onOpen: () => void) => void }) {
  const owned = useEntitlement(feature), c = useColors();
  const required = requiredCareerFeature(world, feature), locked = required !== null && !owned;
  return <ActionRow title={title} subtitle={subtitle} value={locked ? 'Locked' : undefined} icon={<View>{icon}{locked && <View style={{ position: 'absolute', bottom: -2, right: -3, padding: 2, borderRadius: 8, backgroundColor: c.surface }}><Ionicons name="lock-closed" size={12} color={c.muted} /></View>}</View>} onPress={() => onRequest(feature, onOpen)} />;
}

export default function SpecialCareers() {
  const world = useGame(s => s.world)!, premium = usePremiumAction(world.id + ':' + world.activePersonId);
  useFocusEffect(useCallback(() => () => premium.cancel(), [premium.cancel]));
  const openCareer = (feature: PremiumCareerFeature, onOpen: () => void) => premium.run(requiredCareerFeature(world, feature), 'career-discovery:' + feature, onOpen, { onExplore: onOpen });
  return <Page><Header title="Special Careers" onBack={() => router.back()} />
    <Card><Heading size={18}>Performance & Public Life</Heading>
      {careerKinds.map(kind => {
        const career = world.careers.find(item => item.personId === world.activePersonId && item.kind === kind), definition = careerCatalog[kind];
        const props = { title: definition.title, subtitle: career?.status === 'active' ? career.employer : kind === 'actor' ? 'Train, audition and make your mark on screen' : kind === 'model' ? 'Castings, campaigns and a professional portfolio' : kind === 'musician' ? 'Live performances, recordings and actual royalties' : kind === 'politician' ? 'Campaign for office and serve a real term' : 'Tryouts, team contracts and recorded seasons', icon: <CareerArt id={definition.art} />, onOpen: () => router.push({ pathname: '/career/[kind]', params: { kind } }) };
        return kind === 'athlete' ? <PremiumCareerRow key={kind} world={world} onRequest={openCareer} feature="athlete" {...props} /> : <ActionRow key={kind} title={props.title} subtitle={props.subtitle} icon={props.icon} onPress={props.onOpen} />;
      })}
    </Card>
    <Card><Heading size={18}>Independent Careers</Heading>
      <ActionRow title="Business Owner" subtitle="Your real companies, employees and operating history" icon={<FameBusinessArt id="business" />} onPress={() => router.push('/business')} />
      <PremiumCareerRow world={world} onRequest={openCareer} feature="cult" title="Cult Leader" subtitle={activeCult(world)?.name ?? 'Found a movement, keep your promises and face the consequences'} icon={<CultArt />} onOpen={() => router.push('/cult')} />
      <ActionRow title="Organised Crime" subtitle="Build a crew, rise through the ranks and face real consequences" icon={<HealthLegalArt id="handcuffs" />} onPress={() => router.push('/organised-crime')} />
      {creatorKinds.map(kind => <ActionRow key={kind} title={creatorCatalog[kind].title} subtitle={creatorCatalog[kind].description} icon={<PlatformMark platform={creatorCatalog[kind].platform} />} onPress={() => router.push({ pathname: '/creator-studio/[kind]', params: { kind } })} />)}
    </Card>
    <Card><Heading size={18}>Service & Royalty</Heading>
      {serviceKinds.map(kind => <PremiumCareerRow key={kind} world={world} onRequest={openCareer} feature={kind} title={serviceCatalog[kind].title} subtitle={kind === 'astronaut' ? 'Earn your flight qualification and carry out research missions' : 'Train, serve a real term and take overseas assignments'} icon={<CareerArt id={kind} />} onOpen={() => router.push({ pathname: '/service/[kind]', params: { kind } })} />)}
      <ActionRow title="Royalty" subtitle="Your family, public duties and the line of succession" icon={<CareerArt id="royalty" />} onPress={() => router.push('/royalty')} />
    </Card>
    <Card><Heading size={18}>Qualifications & Training</Heading>
      <ActionRow title="Doctor & Lawyer" subtitle="Professional qualifications and the ordinary job board" icon={<Illustration id="education" />} onPress={() => router.push('/education')} />
      <ActionRow title="Skills & Training" subtitle="Build talent through actual monthly practice" icon={<CareerArt id="stage" />} onPress={() => router.push('/career-training')} />
      <Body muted>Qualifications and talent open opportunities. Selection, health, performance and the audience still shape the outcome.</Body>
    </Card>
    {premium.modal}
  </Page>;
}
