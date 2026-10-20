import React, { useMemo, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { useGame } from '../../src/state/useGame';
import { lifeProgress, ProgressCategory } from '../../src/progression/progress';
import { Body, Card, Header } from '../../src/ui/components';
import { EventModal } from '../../src/ui/EventModal';
import { ProgressList, ProgressPicture, ProgressSummary, progressAmount } from '../../src/ui/ProgressElements';
import { FilterTabs } from '../../src/ui/FilterTabs';

const filters = [{ id: 'all', label: 'All' }, { id: 'life', label: 'Life' }, { id: 'career', label: 'Career' }, { id: 'wealth', label: 'Wealth' }, { id: 'special', label: 'Special' }] as const;
export default function Achievements() {
  const world = useGame(s => s.world), progress = useMemo(() => world ? lifeProgress(world) : null, [world]);
  const [category, setCategory] = useState<ProgressCategory | 'all'>('all'), [selectedId, setSelectedId] = useState<string | null>(null);
  const visible = useMemo(() => progress?.achievements.filter(item => category === 'all' || item.category === category) ?? [], [progress, category]);
  if (!progress) return <Redirect href="/" />;
  const selected = progress.achievements.find(item => item.id === selectedId);
  return <ProgressList label="Achievements list" items={visible} onSelect={item => setSelectedId(item.id)} header={<><Header title="Achievements" onBack={() => router.back()} />
    <FilterTabs values={filters} selected={category} onSelect={id => { setCategory(id); setSelectedId(null); }} />
    <Card><ProgressSummary complete={progress.achievements.filter(item => item.complete).length} total={progress.achievements.length} label="Earned" /><Body muted>Milestones from this person’s life and timeline.</Body></Card>
    </>}>
    <EventModal event={selected ? { id: 'achievement-' + selected.id, kind: 'milestone', title: selected.title, body: selected.goal.label + '.', illustration: <ProgressPicture art={selected.art} size={58} />, facts: [
      { id: 'record', label: 'Your record', value: progressAmount(selected.goal.value, selected.goal.unit), tone: 'neutral' },
      { id: 'target', label: 'Goal', value: progressAmount(selected.goal.target, selected.goal.unit), tone: 'neutral' },
      { id: 'status', label: 'Status', value: selected.complete ? 'Earned' : 'In progress', tone: selected.complete ? 'positive' : 'neutral' },
    ], continueLabel: 'Close' } : null} onChoose={() => setSelectedId(null)} onClose={() => setSelectedId(null)} />
  </ProgressList>;
}
