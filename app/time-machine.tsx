import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGame } from '../src/state/useGame';
import { ActionRow, Body, Button, Card, Header, Heading, Page } from '../src/ui/components';
import { EventModal } from '../src/ui/EventModal';
import { GameShell } from '../src/ui/GameShell';
import { SnapshotSummary } from '../src/persistence/archive';
import { HealthLegalArt } from '../src/assets/HealthLegalArt';

export default function TimeMachine() {
  const world = useGame(s => s.world), snapshots = useGame(s => s.snapshots), load = useGame(s => s.loadSnapshots), save = useGame(s => s.saveSnapshot), restore = useGame(s => s.restoreSnapshot);
  const busy = useGame(s => s.busy), error = useGame(s => s.error), lives = useGame(s => s.lives);
  const [selected, setSelected] = useState<SnapshotSummary | null>(null);
  const loaded = useRef<string | null>(null);
  useFocusEffect(useCallback(() => { const key = world && world.id + ':' + world.revision; if (key && !busy && loaded.current !== key) { loaded.current = key; void load(); } }, [world?.id, world?.revision, busy, load]));
  if (!world) return <Redirect href="/" />;
  const branch = lives.find(item => item.id === world.id)?.branch, size = snapshots.reduce((sum, item) => sum + item.size, 0), deceased = !!world.people[world.activePersonId].died;
  const content = <Page bottomSafeArea={deceased}><Header title="Time Machine" onBack={() => router.back()} /><Card><HealthLegalArt id="rewind" size={88} /><Heading size={20}>Another way things could go</Heading><Body>Each Age Up keeps the exact moment before the year began. Restore a checkpoint to open a new saved branch; your current future stays in Saved Lives.</Body>{branch && <Body muted>This branch began with {branch.name} at age {branch.age} in {branch.date.year}.</Body>}<Body muted>{snapshots.length} checkpoints · {(size / 1048576).toFixed(2)} MB compressed · Free and offline</Body><Button label="Save This Moment" tone="secondary" busy={busy} onPress={() => void save()} /></Card>
    {error && <Body>{error}</Body>}{busy && <ActivityIndicator accessibilityLabel="Working with local history" />}
    {snapshots.length === 0 && <Card><Body muted>No historical checkpoints yet. Save this moment or Age Up to begin your history.</Body></Card>}
    <Card>{snapshots.map(point => <ActionRow key={point.id} title={point.name + ' · Age ' + point.age} subtitle={point.date.year + '-' + String(point.date.month).padStart(2, '0') + '-' + String(point.date.day).padStart(2, '0') + ' · ' + point.label} disabled={busy} disabledReason={undefined} onPress={() => setSelected(point)} />)}</Card>
    <EventModal event={selected ? { id: 'restore:' + selected.id, kind: 'confirmation', title: 'Open a new branch?', body: 'You will return to ' + selected.name + ' at age ' + selected.age + '. The complete saved world, money, relationships, outcomes and random state will be restored. Only history at or before this moment follows the branch. Your current future stays available in Saved Lives.', terms: [{ id: 'date', label: 'Return to', value: selected.date.year + '-' + String(selected.date.month).padStart(2, '0'), tone: 'neutral' }, { id: 'label', label: 'Moment', value: selected.label, tone: 'neutral' }], confirmLabel: 'Restore as New Branch' } : null} busy={busy} onCancel={() => setSelected(null)} onChoose={() => { if (selected) { const id = selected.id; setSelected(null); void restore(id).then(success => { if (success) router.replace('/life'); }); } }} />
  </Page>;
  const icons = { life: 'home', assets: 'wallet', relationships: 'heart', activities: 'ellipsis-horizontal' } as const;
  return deceased ? content : <GameShell activeTab="activities" onSelectTab={tab => router.navigate('/' + tab)} renderIcon={(tab, color) => <Ionicons name={icons[tab]} color={color} size={26} />}>{content}</GameShell>;
}
