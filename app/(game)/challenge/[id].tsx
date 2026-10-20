import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../../src/state/useGame';
import { lifeProgress } from '../../../src/progression/progress';
import { challengeMilestones } from '../../../src/progression/connections';
import { progressDestinations } from '../../../src/progression/routes';
import { Body, Button, Card, Header, Heading, Page, StatBar } from '../../../src/ui/components';
import { ProgressPicture, progressAmount } from '../../../src/ui/ProgressElements';
import { useColors } from '../../../src/ui/theme';

export default function ChallengeDetails() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>(), world = useGame(s => s.world), c = useColors();
  const progress = useMemo(() => world ? lifeProgress(world) : null, [world]);
  const challenge = typeof id === 'string' ? progress?.challenges.find(item => item.id === id) : undefined;
  const milestones = useMemo(() => challenge && progress ? challengeMilestones(challenge, progress.achievements) : [], [challenge, progress]);
  if (!world) return <Redirect href="/" />;
  if (!challenge) return <Page><Header title="Challenge" onBack={() => router.back()} /><Card><Body>This challenge is unavailable.</Body><Button label="View Challenges" onPress={() => router.replace('/challenges')} /></Card></Page>;
  return <Page><Header title="Challenge" onBack={() => router.back()} />
    <Card><View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}><ProgressPicture art={challenge.art} size={64} /><View style={{ flex: 1 }}><Heading size={22}>{challenge.title}</Heading><Body muted>{challenge.difficulty[0].toUpperCase() + challenge.difficulty.slice(1)}</Body></View></View>
      <Body>{challenge.description}</Body><StatBar label="Overall progress" value={challenge.percent} color={c.green} /><Body>{challenge.goals.filter(item => item.complete).length} / {challenge.goals.length} goals completed</Body>
    </Card>
    {milestones.length > 0 && <Card><Heading size={19}>Milestones earned</Heading>{milestones.map(item => <Body key={item.id}>{item.title}</Body>)}<Body muted>Already recorded in this person’s life.</Body></Card>}
    {challenge.goals.map(goal => <Card key={goal.id}><Heading size={17}>{goal.label}</Heading><Body>{goal.complete ? 'Completed' : 'In progress'} · {Math.min(goal.value, goal.target)} / {goal.target}</Body><StatBar label="Goal progress" value={goal.percent} color={goal.complete ? c.green : c.blue} /><Body muted>Your record: {progressAmount(goal.value, goal.unit)}.</Body><Button label={'View ' + progressDestinations[goal.route]} tone="secondary" onPress={() => router.push(goal.route)} /></Card>)}
    <Body muted>Each goal uses this person’s history. Switching lives or restoring an earlier timeline changes the progress shown here.</Body>
  </Page>;
}
