import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { World } from '../../src/game/model';
import { openRepository } from '../../src/persistence/native';
import { SaveCorrupt } from '../../src/persistence/repository';
import { Body, Button, Card, Header, Page } from '../../src/ui/components';
import { LifeSummaryContent } from '../../src/ui/LifeSummaryContent';
import { useColors } from '../../src/ui/theme';
import { DisplayText as Text } from '../../src/ui/DisplayText';

type Load = { id: string; status: 'loading' } | { id: string; status: 'ready'; world: World } | { id: string; status: 'error'; message: string };
export default function SavedLife() {
  const params = useLocalSearchParams<{ id?: string | string[] }>(), id = typeof params.id === 'string' ? params.id : '', c = useColors();
  const [attempt, setAttempt] = useState(0), [load, setLoad] = useState<Load>({ id, status: 'loading' });
  useEffect(() => {
    if (!id) return;
    let mounted = true, timer: ReturnType<typeof setTimeout> | undefined;
    setLoad({ id, status: 'loading' });
    // Paint the destination before decoding a potentially long saved history.
    const frame = requestAnimationFrame(() => { timer = setTimeout(() => {
      void (async () => {
        try { const world = await (await openRepository()).previewLife(id); if (mounted) setLoad({ id, status: 'ready', world }); }
        catch (error) { if (mounted) setLoad({ id, status: 'error', message: error instanceof SaveCorrupt ? error.message : 'Could not open this saved life. Retry or return to Saved Lives.' }); }
      })();
    }, 0); });
    return () => { mounted = false; cancelAnimationFrame(frame); if (timer !== undefined) clearTimeout(timer); };
  }, [id, attempt]);
  if (id && load.id === id && load.status === 'ready') return <LifeSummaryContent world={load.world} readOnly />;
  return <Page bottomSafeArea><Header title="Saved Life" onBack={() => router.back()} /><Card>
    {!id ? <><Body>Choose a saved life to view.</Body><Button label="Saved Lives" onPress={() => router.replace('/saved-lives')} /></> : load.id === id && load.status === 'error' ? <><Text accessibilityRole="alert" style={{ color: c.ink, fontSize: 15, lineHeight: 22 }}>{load.message}</Text><Button label="Retry" onPress={() => { setLoad({ id, status: 'loading' }); setAttempt(value => value + 1); }} /></> : <><ActivityIndicator color={c.blue} accessibilityLabel="Opening saved life" /><Body>Opening your saved life…</Body></>}
  </Card></Page>;
}
