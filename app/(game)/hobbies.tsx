import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { hobbyContent, hobbyKinds } from '../../src/game/content/leisure';
import { activeHobbyPlan, personHobbies } from '../../src/game/systems/leisureSchemas';
import { formatMoney } from '../../src/game/money';
import { ActionRow, Body, Card, Header, Heading, Page, StatBar } from '../../src/ui/components';
import { HobbyArt } from '../../src/assets/HobbyArt';
import { HealthLegalArt } from '../../src/assets/HealthLegalArt';
import { useColors } from '../../src/ui/theme';

export default function Hobbies() {
  const world = useGame(s => s.world)!, hobbies = personHobbies(world), current = hobbies.filter(hobby => activeHobbyPlan(hobby)), c = useColors();
  return <Page><Header title="Hobbies" onBack={() => router.back()} />
    <Card><Body muted>Keep up to two routines. Practice continues as months pass; extra practice is optional. School and work can continue alongside your hobbies.</Body></Card>
    {current.length > 0 && <Card><Heading size={18}>Your routines</Heading>{current.map(hobby => {
      const plan = activeHobbyPlan(hobby)!;
      return <View key={hobby.id} style={{ gap: 8 }}>
        <ActionRow title={hobbyContent[hobby.kind].name} subtitle={(plan.mode === 'lessons' ? 'Guided lessons' : 'Community access') + ' · ' + formatMoney({ minor: plan.monthlyFee, currency: plan.currency }) + ' per attended month'} icon={<HobbyArt kind={hobby.kind} size={40} />} onPress={() => router.push({ pathname: '/hobby/[kind]', params: { kind: hobby.kind } })} />
        <StatBar label={hobbyContent[hobby.kind].name + ' proficiency'} value={hobby.proficiency} color={c.green} />
      </View>;
    })}</Card>}
    <Card><Heading size={18}>Explore hobbies</Heading>
      {hobbyKinds.filter(kind => !current.some(hobby => hobby.kind === kind)).map(kind => {
        const hobby = hobbies.find(item => item.kind === kind);
        return <ActionRow key={kind} title={hobbyContent[kind].name} subtitle={hobbyContent[kind].description} value={hobby && hobby.proficiency > 0 ? hobby.proficiency + '% proficiency' : undefined} icon={<HobbyArt kind={kind} size={40} />} onPress={() => router.push({ pathname: '/hobby/[kind]', params: { kind } })} />;
      })}
    </Card>
    <Card><ActionRow title="Work Out" subtitle="Exercise sessions and fitness routines" icon={<HealthLegalArt id="exercise" size={40} />} onPress={() => router.push('/exercise')} /></Card>
  </Page>;
}
