import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { evaluateSession } from '../core/evaluation';
import { consequenceText } from '../core/scoring';
import type { MiniGameSession } from '../core/types';
import { GameButton } from './GameButton';
import { gameStyles as s, palette as c } from './gameStyles';
export function MiniGameResult({
  session,
  practice,
  reducedMotion,
  saving,
  error,
  onRetry,
  onExit,
  onRestart,
}: {
  session: MiniGameSession;
  practice: boolean;
  reducedMotion: boolean;
  saving: boolean;
  error: string | null;
  onRetry: () => void;
  onExit: () => void;
  onRestart?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const result = evaluateSession(session),
    score = session.score ?? result.score,
    saved = session.status !== 'active';
  return (
    <View
      style={[
        s.overlay,
        {
          top: insets.top,
          bottom: insets.bottom,
          justifyContent: 'flex-end',
          backgroundColor: '#02091444',
        },
      ]}
      accessibilityViewIsModal
    >
      <ScrollView
        style={{ width: '100%', maxWidth: 460, maxHeight: '75%', flexGrow: 0 }}
        contentContainerStyle={[
          s.card,
          { gap: 10, backgroundColor: '#091829F5' },
        ]}
      >
        <Text style={s.eyebrow}>
          {practice
            ? 'PRACTICE RESULT'
            : saved
              ? 'CHALLENGE SAVED'
              : saving
                ? 'SAVING CHALLENGE'
                : 'RESULT NOT SAVED'}
        </Text>
        <Text
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          style={[s.title, { fontSize: 28 }]}
        >
          {session.status === 'forfeited'
            ? 'Forfeited'
            : result.detail === 'Time expired'
              ? 'Time up'
              : session.kind === 'sports'
                ? score >= 85
                  ? 'Perfect!'
                  : score >= 30
                    ? 'Good shot!'
                    : result.detail === 'The keeper makes the save'
                      ? 'Saved!'
                      : 'Missed!'
                : session.kind === 'crime'
                  ? score >= 30
                    ? 'Safe opened'
                    : 'Safe locked'
                  : score >= 60
                    ? 'Docked!'
                    : score >= 30
                      ? 'Rough docking'
                      : 'Approach aborted'}
        </Text>
        <Text style={{ color: c.blue, fontSize: 30, fontWeight: '800' }}>
          {score}
          <Text style={{ fontSize: 15 }}> / 100</Text>
        </Text>
        <Text style={s.text}>
          {session.status === 'forfeited'
            ? 'This attempt has been used.'
            : result.detail}
        </Text>
        <Text style={s.muted}>
          {practice
            ? 'Practice only. No saved life, money, skills or records are changed.'
            : consequenceText(session.kind, score)}
        </Text>
        {error && (
          <Text accessibilityRole="alert" style={[s.text, { color: c.red }]}>
            {error}
          </Text>
        )}
        {!saved && (
          <GameButton
            label={saving ? 'Saving…' : 'Retry saving result'}
            disabled={saving}
            onPress={onRetry}
          />
        )}
        <GameButton
          label={saved ? 'Continue' : 'Exit & retry later'}
          disabled={saving}
          onPress={onExit}
        />
        {practice && onRestart && (
          <GameButton
            label="Play again"
            disabled={saving}
            onPress={onRestart}
          />
        )}
      </ScrollView>
    </View>
  );
}
