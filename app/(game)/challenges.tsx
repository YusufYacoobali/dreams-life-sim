import React, { useMemo, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { lifeProgress } from '../../src/progression/progress';
import { Body, Card, Header } from '../../src/ui/components';
import { ProgressList, ProgressSummary } from '../../src/ui/ProgressElements';
import { FilterTabs } from '../../src/ui/FilterTabs';

const filters = [{ id: 'all', label: 'All' }, { id: 'easy', label: 'Easy' }, { id: 'medium', label: 'Medium' }, { id: 'hard', label: 'Hard' }] as const;
export default function Challenges() {
  const world = useGame(s => s.world), progress = useMemo(() => world ? lifeProgress(world) : null, [world]);
  const [difficulty, setDifficulty] = useState<typeof filters[number]['id']>('all');
  const visible = useMemo(() => progress?.challenges.filter(item => difficulty === 'all' || item.difficulty === difficulty) ?? [], [progress, difficulty]);
  if (!progress) return <Redirect href="/" />;
  return <ProgressList label="Challenges list" items={visible} showProgress onSelect={item => router.push({ pathname: '/challenge/[id]', params: { id: item.id } })} header={<><Header title="Challenges" onBack={() => router.back()} />
    <FilterTabs values={filters} selected={difficulty} onSelect={setDifficulty} />
    <Card><ProgressSummary complete={progress.challenges.filter(item => item.complete).length} total={progress.challenges.length} label="Completed" /><Body muted>Explore goals at your own pace. Progress follows what happens in this life.</Body><Body>{visible.length} shown · {visible.filter(item => item.complete).length} completed in this view</Body></Card>
    </>} />;
}
