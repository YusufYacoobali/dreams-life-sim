import { PetsLeisureArt } from '../../../src/assets/PetsLeisureArt';
import React from 'react';
import { router } from 'expo-router';
import { ActionRow, Card, Header, Heading, Page } from '../../../src/ui/components';
import { Illustration } from '../../../src/assets/Illustration';
import { HealthLegalArt } from '../../../src/assets/HealthLegalArt';
import { useGame } from '../../../src/state/useGame';
import { isConfined } from '../../../src/game/systems/legalSchemas';
import { PolishArt } from '../../../src/assets/PolishArt';
import { FameBusinessArt } from '../../../src/assets/FameBusinessArt';
import { EndLifeAction } from '../../../src/ui/EndLifeAction';

export default function Activities() {
  const world = useGame(s => s.world)!, confined = isConfined(world);
  return <Page><Header title="Activities" />
    <Card><Heading size={18}>Study & Work</Heading>
      <ActionRow title={confined ? 'Prison Study & Work' : 'Education'} subtitle={confined ? 'Permitted routines while in custody' : 'Study, qualifications and tuition'} icon={<Illustration id="education" />} onPress={() => router.push(confined ? '/prison' : ['primary', 'secondary'].includes(world.people[world.activePersonId].education.stage) ? '/school' : '/education')} />
      <ActionRow title={confined ? 'Custody' : 'Occupation'} subtitle={confined ? 'Sentence, remand and permitted activities' : 'Jobs, performance and retirement'} icon={<Illustration id="career" />} onPress={() => router.push(confined ? '/prison' : '/work')} />
      <ActionRow title="Special Careers" subtitle="Try the spotlight, the stage or public service" icon={<FameBusinessArt id="trophy" />} onPress={() => router.push('/special-careers')} />
      <ActionRow title="Business" subtitle="Start a company and hire a team" icon={<FameBusinessArt id="business" />} onPress={() => router.push('/business')} />
    </Card>
    <Card><Heading size={18}>Everyday Life</Heading>
      <ActionRow title="Family" subtitle="Children, parents and the next generation" icon={<PolishArt id="family-life" />} onPress={() => router.push('/family')} />
      <ActionRow title="Health" subtitle="Checkups, treatment and feeling better" icon={<PolishArt id="health-check" />} onPress={() => router.push('/health')} />
      <ActionRow title="Mind & Body" subtitle="Diet, sleep, exercise and meditation" icon={<HealthLegalArt id="meditation" />} onPress={() => router.push('/lifestyle')} />
      <ActionRow title="Household Pets" subtitle="Companions, adoption and care" icon={<PetsLeisureArt id="paw" size={40} />} onPress={() => router.push({ pathname: '/pets', params: { tab: 'activities' } })} />
      <ActionRow title="Hobbies" subtitle="Practice, lessons and personal interests" icon={<PetsLeisureArt id="guitar" size={40} />} onPress={() => router.push('/hobbies')} />
      <ActionRow title="Entertainment" subtitle="Movies, concerts, exhibitions and dancing" icon={<PetsLeisureArt id="cinema" size={40} />} onPress={() => router.push('/entertainment')} />
      <ActionRow title="Travel" subtitle="Holidays, new homes and life abroad" icon={<Illustration id="travel" />} onPress={() => router.push('/travel')} />
    </Card>
    <Card><Heading size={18}>Public Life & Legal</Heading>
      <ActionRow title="Crime & Legal" subtitle="Bad ideas, court dates and consequences" icon={<Illustration id="crime" />} onPress={() => router.push('/crime')} />
      <ActionRow title="Social Media" subtitle="Profiles, posts and creator connections" icon={<FameBusinessArt id="social" />} onPress={() => router.push('/social-media')} />
      <ActionRow title="Fame" subtitle="Your public image, opportunities and brand work" icon={<FameBusinessArt id="fame" />} onPress={() => router.push('/fame')} />
    </Card>
    <Card><Heading size={18}>Your Life</Heading>
      <ActionRow title="My Life" subtitle="Your identity and personal profile" icon={<Illustration id="journal" />} onPress={() => router.push({ pathname: '/profile', params: { tab: 'activities' } })} />
      <ActionRow title="Extras" subtitle="Achievements, challenges and heirlooms" icon={<PolishArt id="life-star" />} onPress={() => router.push('/extras')} />
      <ActionRow title="Saved Lives" subtitle="Pick up a life or revisit an old one" icon={<PolishArt id="archive" />} onPress={() => router.push('/saved-lives')} />
      <ActionRow title="Settings" subtitle="Appearance, sound and saved lives" icon={<PolishArt id="settings" />} onPress={() => router.push('/settings')} />
      <ActionRow title="Time Machine" subtitle="Return to an earlier moment in a new save" icon={<HealthLegalArt id="rewind" />} onPress={() => router.push('/time-machine')} />
      <EndLifeAction />
    </Card>
  </Page>;
}
