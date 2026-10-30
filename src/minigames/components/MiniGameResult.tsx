import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
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
        style={{ width: '100%', maxWidth: 460, maxHeight: '90%', flexGrow: 0 }}
        contentContainerStyle={[
          s.card,
          { gap: 14 },
        ]}
      >
        <View accessible={false} style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#C9CDD4', alignSelf: 'center' }} />
        {saved && score >= 60 && (
          <View style={[s.row, { gap: 18 }]} accessible={false}>
            {[24, 32, 24].map((size, index) => (
              <Svg key={index} width={size} height={size} viewBox="0 0 24 24" accessible={false}>
                <Path d="m12 1 3.2 6.5 7.2 1-5.2 5.1 1.2 7.2L12 17.4l-6.4 3.4 1.2-7.2-5.2-5.1 7.2-1Z" fill="#E6AF35" />
              </Svg>
            ))}
          </View>
        )}
        <Text style={[s.eyebrow, { textAlign: 'center' }]}>
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
          style={[s.title, { fontSize: 30, textAlign: 'center' }]}
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
                : session.kind === 'escape'
                  ? score >= 60 ? 'Out of custody' : 'Escape failed'
                : session.kind === 'crime'
                  ? score >= 30
                    ? 'Cracked it!'
                    : 'Safe locked'
                  : score >= 60
                    ? 'Docked!'
                    : score >= 30
                      ? 'Rough docking'
                      : 'Approach aborted'}
        </Text>
        <Text accessibilityLabel={'Score ' + score + ' out of 100'} style={{ color: c.action, fontSize: 44, fontWeight: '800', textAlign: 'center' }}>
          {score}
          <Text style={{ color: c.ink, fontSize: 20 }}> / 100</Text>
        </Text>
        <Text style={[s.text, { textAlign: 'center' }]}>
          {session.status === 'forfeited'
            ? 'This attempt has been used.'
            : result.detail}
        </Text>
        <Text style={[s.muted, { textAlign: 'center' }]}>
          {practice
            ? 'Practice round. Your saved life stays unchanged.'
            : consequenceText(session.kind, score)}
        </Text>
        {error && (
          <Text accessibilityRole="alert" style={[s.text, { color: '#B12E43' }]}>
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
            secondary
            disabled={saving}
            onPress={onRestart}
          />
        )}
      </ScrollView>
    </View>
  );
}
