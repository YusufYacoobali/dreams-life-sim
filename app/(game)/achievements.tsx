import React, { useMemo, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { lifeProgress, ProgressCategory } from '../../src/progression/progress';
import { Body, Card, Header, Page } from '../../src/ui/components';
import { EventModal } from '../../src/ui/EventModal';
import { ProgressFilters, ProgressPicture, ProgressRow, ProgressSummary, progressAmount } from '../../src/ui/ProgressElements';

const filters = [{ id: 'all', label: 'All' }, { id: 'life', label: 'Life' }, { id: 'career', label: 'Career' }, { id: 'wealth', label: 'Wealth' }, { id: 'special', label: 'Special' }] as const;
export default function Achievements() {
  const world = useGame(s => s.world), progress = useMemo(() => world ? lifeProgress(world) : null, [world]);
  const [category, setCategory] = useState<ProgressCategory | 'all'>('all'), [selectedId, setSelectedId] = useState<string | null>(null);
  if (!progress) return <Redirect href="/" />;
  const selected = progress.achievements.find(item => item.id === selectedId);
  return <Page><Header title="Achievements" onBack={() => router.back()} />
    <ProgressFilters values={filters} selected={category} onSelect={id => { setCategory(id); setSelectedId(null); }} />
    <Card><ProgressSummary complete={progress.achievements.filter(item => item.complete).length} total={progress.achievements.length} label="Earned" /><Body muted>Milestones from this person’s life and timeline.</Body></Card>
    <Card>{progress.achievements.filter(item => category === 'all' || item.category === category).map(item => <ProgressRow key={item.id} title={item.title} description={item.description} art={item.art} complete={item.complete} onPress={() => setSelectedId(item.id)} />)}</Card>
    <EventModal event={selected ? { id: 'achievement-' + selected.id, kind: 'milestone', title: selected.title, body: selected.goal.label + '.', illustration: <ProgressPicture art={selected.art} size={58} />, facts: [
      { id: 'record', label: 'Your record', value: progressAmount(selected.goal.value, selected.goal.unit), tone: 'neutral' },
      { id: 'target', label: 'Goal', value: progressAmount(selected.goal.target, selected.goal.unit), tone: 'neutral' },
      { id: 'status', label: 'Status', value: selected.complete ? 'Earned' : 'In progress', tone: selected.complete ? 'positive' : 'neutral' },
    ], continueLabel: 'Close' } : null} onChoose={() => setSelectedId(null)} onClose={() => setSelectedId(null)} />
  </Page>;
}
