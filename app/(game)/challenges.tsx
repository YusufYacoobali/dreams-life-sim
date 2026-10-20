import React, { useMemo, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { lifeProgress } from '../../src/progression/progress';
import { Body, Card, Header, Page } from '../../src/ui/components';
import { ProgressFilters, ProgressRow, ProgressSummary } from '../../src/ui/ProgressElements';

const filters = [{ id: 'all', label: 'All' }, { id: 'easy', label: 'Easy' }, { id: 'medium', label: 'Medium' }, { id: 'hard', label: 'Hard' }] as const;
export default function Challenges() {
  const world = useGame(s => s.world), progress = useMemo(() => world ? lifeProgress(world) : null, [world]);
  const [difficulty, setDifficulty] = useState<typeof filters[number]['id']>('all');
  if (!progress) return <Redirect href="/" />;
  return <Page><Header title="Challenges" onBack={() => router.back()} />
    <ProgressFilters values={filters} selected={difficulty} onSelect={setDifficulty} />
    <Card><ProgressSummary complete={progress.challenges.filter(item => item.complete).length} total={progress.challenges.length} label="Completed" /><Body muted>Explore goals at your own pace. Progress follows what happens in this life.</Body></Card>
    <Card>{progress.challenges.filter(item => difficulty === 'all' || item.difficulty === difficulty).map(item => <ProgressRow key={item.id} title={item.title} description={item.description} art={item.art} complete={item.complete} progress={item.percent} onPress={() => router.push({ pathname: '/challenge/[id]', params: { id: item.id } })} />)}</Card>
  </Page>;
}
