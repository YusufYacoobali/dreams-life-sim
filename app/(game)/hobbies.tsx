import React from 'react';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { hobbyContent, hobbyKinds } from '../../src/game/content/leisure';
import { activeHobbyPlan, personHobbies } from '../../src/game/systems/leisureSchemas';
import { ActionRow, Body, Card, Header, Page } from '../../src/ui/components';
import { HobbyArt } from '../../src/assets/HobbyArt';

export default function Hobbies() {
  const world = useGame(s => s.world)!, hobbies = personHobbies(world);
  return <Page><Header title="Hobbies" onBack={() => router.back()} />
    <Card><Body muted>Keep up to two routines. Age Up continues actual monthly practice; extra practice is optional. School and work can continue alongside your hobbies.</Body>
      {hobbyKinds.map(kind => {
        const hobby = hobbies.find(item => item.kind === kind), plan = hobby && activeHobbyPlan(hobby);
        return <ActionRow key={kind} title={hobbyContent[kind].name} subtitle={plan ? (plan.mode === 'lessons' ? 'Guided lessons' : 'Community access') + ' · ' + hobby!.proficiency + '% proficiency' : hobbyContent[kind].description} icon={<HobbyArt kind={kind} size={40} />} onPress={() => router.push({ pathname: '/hobby/[kind]', params: { kind } })} />;
      })}
      <ActionRow title="Work Out" subtitle="Your existing exercise and fitness routines" onPress={() => router.push('/exercise')} />
    </Card>
  </Page>;
}
