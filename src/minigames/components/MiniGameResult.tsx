import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { evaluateSession } from '../core/evaluation';
import { consequenceText, ratingFor } from '../core/scoring';
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
    rating = ratingFor(score),
    saved = session.status !== 'active';
  return (
    <View
      style={[s.overlay, { top: insets.top, bottom: insets.bottom }]}
      accessibilityViewIsModal
    >
      <ScrollView
        style={{ width: '100%', maxWidth: 460, maxHeight: '95%' }}
        contentContainerStyle={s.card}
      >
        {!reducedMotion && saved && score >= 60 && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: -80,
              height: 300,
            }}
          >
            <LottieView
              source={require('../../../assets/minigames/success.json')}
              autoPlay
              loop={false}
              renderMode="HARDWARE"
              style={{ width: '100%', height: '100%' }}
            />
          </View>
        )}
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
          style={[s.title, { fontSize: 32 }]}
        >
          {session.status === 'forfeited'
            ? 'Forfeited'
            : rating === 'perfect'
              ? 'Perfect'
              : rating === 'good'
                ? 'Well played'
                : rating === 'poor'
                  ? 'A tough finish'
                  : 'Challenge failed'}
        </Text>
        <Text style={{ color: c.gold, fontSize: 56, fontWeight: '800' }}>
          {score}
          <Text style={{ fontSize: 22 }}> / 100</Text>
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
          label={saved ? 'Return' : 'Exit & retry later'}
          disabled={saving}
          secondary
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
