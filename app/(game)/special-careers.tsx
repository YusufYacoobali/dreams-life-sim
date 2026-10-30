import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
import { CultArt } from '../../src/assets/CultArt';
import { activeCult } from '../../src/game/systems/cultSchemas';
import React from 'react';
import { router } from 'expo-router';
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

export default function SpecialCareers() {
  const world = useGame(s => s.world)!;
  return <Page><Header title="Special Careers" onBack={() => router.back()} />
    <Card><Heading size={18}>Performance & Public Life</Heading>
      {careerKinds.map(kind => {
        const career = world.careers.find(item => item.personId === world.activePersonId && item.kind === kind), definition = careerCatalog[kind];
        return <ActionRow key={kind} title={definition.title} subtitle={career?.status === 'active' ? career.employer : kind === 'actor' ? 'Train, audition and make your mark on screen' : kind === 'model' ? 'Castings, campaigns and a professional portfolio' : kind === 'musician' ? 'Live performances, recordings and actual royalties' : kind === 'politician' ? 'Campaign for office and serve a real term' : 'Tryouts, team contracts and recorded seasons'} icon={<CareerArt id={definition.art} />} onPress={() => router.push({ pathname: '/career/[kind]', params: { kind } })} />;
      })}
    </Card>
    <Card><Heading size={18}>Independent Careers</Heading>
      <ActionRow title="Business Owner" subtitle="Your real companies, employees and operating history" icon={<FameBusinessArt id="business" />} onPress={() => router.push('/business')} />
      <ActionRow title="Organised Crime" subtitle="Build a crew, rise through the ranks and face real consequences" icon={<HealthLegalArt id="handcuffs" />} onPress={() => router.push('/organised-crime')} />
      <ActionRow title="Cult Leader" subtitle={activeCult(world)?.name ?? 'Found a movement, keep your promises and face the consequences'} icon={<CultArt />} onPress={() => router.push('/cult')} />
      {creatorKinds.map(kind => <ActionRow key={kind} title={creatorCatalog[kind].title} subtitle={creatorCatalog[kind].description} icon={<PlatformMark platform={creatorCatalog[kind].platform} />} onPress={() => router.push({ pathname: '/creator-studio/[kind]', params: { kind } })} />)}
    </Card>
    <Card><Heading size={18}>Service & Royalty</Heading>
      {serviceKinds.map(kind => <ActionRow key={kind} title={serviceCatalog[kind].title} subtitle={kind === 'astronaut' ? 'Earn your flight qualification and carry out research missions' : 'Train, serve a real term and take overseas assignments'} icon={<CareerArt id={kind} />} onPress={() => router.push({ pathname: '/service/[kind]', params: { kind } })} />)}
      <ActionRow title="Royalty" subtitle="Your family, public duties and the line of succession" icon={<CareerArt id="royalty" />} onPress={() => router.push('/royalty')} />
    </Card>
    <Card><Heading size={18}>Qualifications & Training</Heading>
      <ActionRow title="Doctor & Lawyer" subtitle="Professional qualifications and the ordinary job board" icon={<Illustration id="education" />} onPress={() => router.push('/education')} />
      <ActionRow title="Skills & Training" subtitle="Build talent through actual monthly practice" icon={<CareerArt id="stage" />} onPress={() => router.push('/career-training')} />
      <Body muted>Qualifications and talent open opportunities. Selection, health, performance and the audience still shape the outcome.</Body>
    </Card>
  </Page>;
}
