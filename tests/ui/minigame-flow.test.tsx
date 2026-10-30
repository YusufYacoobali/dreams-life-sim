import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { AccessibilityInfo, AppState } from 'react-native';
import * as Native from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from 'zustand';
import { Redirect } from 'expo-router';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { ThemeProvider } from '../../src/ui/theme';
import { FeedbackProvider } from '../../src/ui/feedback';
import { database } from '../support/sqlite';
import { athleteFixture, miniGameFixture } from '../support/miniGames';
import { encodeWorld } from '../../src/game/model';
import { burglaryContext, escapeContext } from '../../src/minigames/core/eligibility';
import { activeSentence } from '../../src/game/systems/legalSchemas';
import { escapeSequence } from '../../src/minigames/escape/escapeLogic';
import { escapePrisoner } from '../support/prisonEscape';

let mockStore: ReturnType<typeof createGameStore>,
  mockParams: { kind: string; ownerId: string; contextId: string },
  mockAllowed = true;
let mockRoute = '/mini-game';
const mockBack = jest.fn(),
  mockHaptic = jest.fn(async () => {}),
  mockSound = jest.fn(async () => {});
jest.mock('expo-router', () => {
  const Stack = ({ children }: any) =>
    require('react').createElement(
      require('react-native').View,
      null,
      children,
    );
  Stack.Screen = () => null;
  return {
    router: { back: () => mockBack(), push: jest.fn() },
    Stack,
    Redirect: () => null,
    useLocalSearchParams: () => mockParams,
    useGlobalSearchParams: () => ({}),
    usePathname: () => mockRoute,
    useFocusEffect: (callback: () => void) =>
      require('react').useEffect(callback, [callback]),
  };
});
jest.mock('../../src/ui/GameShell', () => ({ BottomNavigation: () => null }));
jest.mock('../../src/ui/PendingEvent', () => ({
  PendingEvent: () => {
    const pending = require('zustand').useStore(
      mockStore,
      (state: any) => state.world?.pending,
    );
    return pending
      ? require('react').createElement(
          require('react-native').Text,
          null,
          'Saved legal scene',
        )
      : null;
  },
}));
jest.mock('../../src/state/useGame', () => ({
  gameStore: { getState: () => mockStore.getState() },
  useGame: (selector: Function) =>
    require('zustand').useStore(mockStore, selector),
}));
jest.mock('../../src/state/usePreferences', () => ({
  usePreferences: (select: Function) =>
    select({
      ready: true,
      loadFailed: false,
      settings: { soundEffects: false },
    }),
}));
jest.mock('../../src/ui/GodModeAccess', () => ({
  useInternalGodModeAccess: () => mockAllowed,
}));
jest.mock('lottie-react-native', () => () => null);
jest.mock('expo-asset', () => ({ Asset: { loadAsync: jest.fn(async () => []) } }));
jest.mock('../../assets/minigames/sports.wav', () => 101);
jest.mock('../../assets/minigames/crime.wav', () => 102);
jest.mock('../../assets/minigames/astronaut.wav', () => 103);
jest.mock('react-native-reanimated', () => {
  const React = require('react'),
    createAnimatedComponent = (Component: any) =>
      React.forwardRef((props: any, ref: any) => {
        const { animatedProps, ...rest } = props;
        return React.createElement(Component, {
          ...rest,
          ...animatedProps,
          ref,
        });
      });
  return {
    __esModule: true,
    default: { createAnimatedComponent },
    createAnimatedComponent,
    useSharedValue: (value: any) => React.useRef({ value }).current,
    useAnimatedProps: (calculate: Function) => calculate(),
    useAnimatedReaction: () => {},
    useDerivedValue: (calculate: Function) => ({ value: calculate() }),
    withTiming: (value: any) => value,
    withSequence: (...values: any[]) => values.at(-1),
    cancelAnimation: jest.fn(),
    Easing: {
      linear: (value: number) => value,
      cubic: (value: number) => value ** 3,
      out: (easing: Function) => easing,
    },
  };
});
jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn: Function, ...args: any[]) => fn(...args),
}));
import { LiveMiniGame } from '../../src/minigames/LiveMiniGame';
import { MiniGamePlayground } from '../../src/minigames/MiniGamePlayground';
import { MiniGameScreen } from '../../src/minigames/components/MiniGameScreen';
import { GameButton } from '../../src/minigames/components/GameButton';
import type { MiniGameAction, MiniGameSession } from '../../src/minigames/core/types';
import GameLayout from '../../app/(game)/_layout';

const frame = (children: React.ReactNode, haptics = false) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 400, height: 900 },
      insets: { top: 24, bottom: 24, left: 0, right: 0 },
    }}
  >
    <ThemeProvider appearance="dark">
      <FeedbackProvider
        reducedMotion
        haptics={haptics}
        onButtonFeedback={mockHaptic}
        soundEffects={false}
        onButtonSound={mockSound}
      >
        {children}
      </FeedbackProvider>
    </ThemeProvider>
  </SafeAreaProvider>
);
const show = async (children: React.ReactNode) => {
  const view = render(frame(children));
  await act(async () => {});
  return view;
};
let sqlite: ReturnType<typeof database>['sqlite'], repository: SaveRepository;
async function setup(kind: 'sports' | 'crime' | 'escape' = 'sports') {
  const db = database();
  sqlite = db.sqlite;
  repository = new SaveRepository(db.driver);
  await repository.initialise();
  const world = kind === 'sports' ? athleteFixture() : kind === 'escape' ? escapePrisoner() : miniGameFixture();
  await repository.create(world);
  mockStore = createGameStore({
    repository: async () => repository,
    date: () => world.date,
    id: () => 'life_ui_minigame',
  });
  await mockStore.getState().bootstrap();
  mockParams = {
    kind,
    ownerId: kind === 'sports' ? world.careers[0].id : kind === 'escape' ? activeSentence(world)!.id : world.activePersonId,
    contextId:
      kind === 'sports'
        ? world.careers[0].projects[0].id
        : kind === 'escape'
          ? escapeContext(world)
        : burglaryContext(world),
  };
  return world;
}
beforeEach(() => {
  mockRoute = '/mini-game';
  jest.useFakeTimers();
  mockAllowed = true;
  mockBack.mockClear();
  mockHaptic.mockClear();
  mockSound.mockClear();
  jest
    .spyOn(AccessibilityInfo, 'isScreenReaderEnabled')
    .mockResolvedValue(false);
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockResolvedValue(true);
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  if (sqlite?.isOpen) sqlite.close();
});
const play = async () => {
  fireEvent.press(screen.getByRole('button', { name: 'Play' }));
  await waitFor(() =>
    expect(mockStore.getState().world!.miniGames).toHaveLength(1),
  );
  act(() => jest.advanceTimersByTime(1100));
};

test('the live assisted stamp board saves each choice and escapes the actual sentence once', async () => {
  await setup('escape');
  await show(<LiveMiniGame />);
  await play();
  const session = mockStore.getState().world!.miniGames[0], sequence = escapeSequence(session);
  for (let index = 0; index < sequence.length; index++) {
    fireEvent.press(screen.getByRole('button', { name: `Choose ${sequence[index]} gate` }));
    await waitFor(() => expect(mockStore.getState().world!.miniGames[0].inputs).toHaveLength(index + 1));
    await act(async () => {});
  }
  act(() => jest.advanceTimersByTime(100));
  await waitFor(() => expect(mockStore.getState().world!.miniGames[0].status).toBe('completed'));
  const world = mockStore.getState().world!;
  expect(world.sentences.find(row => row.id === session.ownerId)?.state).toBe('escaped');
  expect(world.people[world.activePersonId].legal.wanted).toBe(true);
  expect(world.incidents.filter(row => row.personId === world.activePersonId && row.offence === 'escape')).toHaveLength(1);
  expect(screen.getByText('Out of custody')).toBeOnTheScreen();
});

function practiceFlight(assisted = true): MiniGameSession {
  return {
    id: 'practice_controls', lifeId: 'practice', personId: 'practice',
    kind: 'astronaut', ownerId: 'practice', contextId: 'practice',
    started: { year: 2026, month: 1, day: 1 }, startedRevision: 0,
    difficulty: 5, seed: 42, assisted, status: 'active', paused: false,
    elapsedMs: 0, inputs: [], score: null, rating: null, settled: null, appliedMonth: null,
  };
}
const flightProps = (session: MiniGameSession) => ({
  kind: 'astronaut' as const, session, difficulty: session.difficulty,
  practice: true, error: null as string | null, busy: false,
  onStart: jest.fn(async () => true), onInput: jest.fn(async (_action: MiniGameAction, _at: number) => true),
  onPause: jest.fn(async () => true), onResume: jest.fn(async () => true),
  onComplete: jest.fn(async () => true), onForfeit: jest.fn(async () => true),
  onExit: jest.fn(), onSkip: jest.fn(async () => true),
});

test('docking uses four circular 48dp+ directions around Coast at large text, including unassisted play', async () => {
  jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({ width: 320, height: 568, scale: 2, fontScale: 1.6 });
  const props = flightProps(practiceFlight(false));
  await show(<MiniGameScreen {...props} />);
  act(() => jest.advanceTimersByTime(1100));
  expect(screen.queryByText(/LEVEL|Difficulty/)).toBeNull();
  const disc = Native.StyleSheet.flatten(screen.getByTestId('docking-control-disc').props.style);
  expect(disc.width).toBe(disc.height);
  expect(disc.borderRadius).toBe(disc.width / 2);
  for (const name of ['Thrust left', 'Thrust up', 'Thrust right', 'Thrust down to brake', 'Coast']) {
    const button = screen.getByRole('button', { name });
    const style = Native.StyleSheet.flatten(button.props.style);
    expect(style.width).toBeGreaterThanOrEqual(48);
    expect(style.height).toBeGreaterThanOrEqual(48);
    expect(style.width).toBe(style.height);
    expect(style.borderRadius).toBe(style.width / 2);
    expect(button).toBeEnabled();
  }
  expect(screen.getByRole('button', { name: 'Coast' })).toHaveProp('accessibilityHint', 'Keep drifting without thrust');
  expect(Native.StyleSheet.flatten(screen.getByRole('button', { name: 'Coast' }).props.style).width).toBe(88);
  fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Resume' })).toBeOnTheScreen());
  expect(props.onPause).toHaveBeenCalledTimes(1);
});

test('rapid docking callbacks persist one typed input and paused or unmounted controls cannot send or buzz', async () => {
  let release!: (accepted: boolean) => void;
  const props = flightProps(practiceFlight());
  props.onInput = jest.fn((_action: MiniGameAction, _at: number) => new Promise<boolean>(resolve => { release = resolve; }));
  const view = render(frame(<MiniGameScreen {...props} />, true));
  await act(async () => {});
  act(() => jest.advanceTimersByTime(1100));
  const left = screen.UNSAFE_getAllByType(GameButton).find(node => node.props.accessibilityLabel === 'Thrust left')!.props.onPress;
  const right = screen.UNSAFE_getAllByType(GameButton).find(node => node.props.accessibilityLabel === 'Thrust right')!.props.onPress;
  act(() => { left(); right(); left(); });
  expect(props.onInput).toHaveBeenCalledTimes(1);
  expect(props.onInput).toHaveBeenCalledWith({ type: 'thrust', direction: 'left' }, 400);
  expect(mockHaptic).toHaveBeenCalledTimes(1);
  await act(async () => release(true));
  fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Resume' })).toBeOnTheScreen());
  act(() => { right(); left(); });
  expect(props.onInput).toHaveBeenCalledTimes(1);
  expect(mockHaptic).toHaveBeenCalledTimes(1);
  view.unmount();
  act(() => right());
  expect(props.onInput).toHaveBeenCalledTimes(1);
  expect(mockHaptic).toHaveBeenCalledTimes(1);
});

test('a failed docking move retries its exact original input without changing the saved level', async () => {
  const props = flightProps(practiceFlight());
  props.error = 'The move could not be saved.';
  props.onInput.mockResolvedValueOnce(false).mockResolvedValue(true);
  await show(<MiniGameScreen {...props} />);
  act(() => jest.advanceTimersByTime(1100));
  fireEvent.press(screen.getByRole('button', { name: 'Thrust left' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Retry save & resume' })).toBeEnabled());
  fireEvent.press(screen.getByRole('button', { name: 'Retry save & resume' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Thrust right' })).toBeEnabled());
  expect(props.onInput.mock.calls).toEqual([
    [{ type: 'thrust', direction: 'left' }, 400],
    [{ type: 'thrust', direction: 'left' }, 400],
  ]);
  expect(screen.UNSAFE_getByType(MiniGameScreen).props.session.difficulty).toBe(5);
  expect(mockHaptic).not.toHaveBeenCalled();
});

test('screen-reader detection enables assisted controls before Play and keeps the choice adjustable', async () => {
  let announce!: (enabled: boolean) => void;
  jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockReturnValue(new Promise<boolean>(resolve => { announce = resolve; }));
  await setup();
  await show(<LiveMiniGame />);
  const toggle = screen.getByRole('switch', { name: 'Assisted controls' });
  fireEvent(toggle, 'valueChange', false);
  expect(toggle).toHaveProp('value', false);
  await act(async () => announce(true));
  expect(screen.getByRole('switch', { name: 'Assisted controls' })).toHaveProp('value', true);
  fireEvent(screen.getByRole('switch', { name: 'Assisted controls' }), 'valueChange', false);
  expect(screen.getByRole('switch', { name: 'Assisted controls' })).toHaveProp('value', false);
  expect(mockStore.getState().world!.miniGames).toHaveLength(0);
});

test('assisted football uses real controls, commits a derived result and honours disabled audio/haptic preferences', async () => {
  const original = await setup();
  await show(<LiveMiniGame />);
  expect(screen.getByRole('switch', { name: 'Assisted controls' })).toHaveProp(
    'value',
    true,
  );
  await play();
  fireEvent.press(screen.getByRole('button', { name: 'Aim higher' }));
  fireEvent.press(screen.getByRole('button', { name: 'Shoot' }));
  await waitFor(() =>
    expect(mockStore.getState().world!.miniGames[0].status).toBe('completed'),
  );
  const world = mockStore.getState().world!;
  expect(world.miniGames[0].score).toBeGreaterThanOrEqual(85);
  expect(world.careers[0].projects[0].periods).toHaveLength(0);
  expect(world.random).toEqual(original.random);
  expect(mockHaptic).not.toHaveBeenCalled();
  expect(mockSound).not.toHaveBeenCalled();
  expect(screen.getByText('CHALLENGE SAVED')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  expect(mockBack).toHaveBeenCalledTimes(1);
});

test('choosing normal burglary before Play uses only the existing crime action', async () => {
  await setup('crime');
  await show(<LiveMiniGame />);
  fireEvent.press(screen.getByRole('button', { name: 'Use normal burglary' }));
  await waitFor(() => expect(mockBack).toHaveBeenCalled());
  expect(mockStore.getState().world!.miniGames).toEqual([]);
  expect(mockStore.getState().world!.incidents).toHaveLength(1);
});

test('exit and reopen preserve a paused burglary; explicit forfeit resolves its reserved attempt and cannot be replayed', async () => {
  await setup('crime');
  const view = await show(<LiveMiniGame />);
  await play();
  const id = mockStore.getState().world!.miniGames[0].id;
  fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
  await waitFor(() =>
    expect(mockStore.getState().world!.miniGames[0].paused).toBe(true),
  );
  fireEvent.press(screen.getByRole('button', { name: 'Save & exit' }));
  await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  view.unmount();
  await show(<LiveMiniGame />);
  expect(screen.getByRole('button', { name: 'Resume' })).toBeOnTheScreen();
  expect(mockStore.getState().world!.miniGames[0].id).toBe(id);
  fireEvent.press(screen.getByRole('button', { name: 'Resume' }));
  await waitFor(() =>
    expect(mockStore.getState().world!.miniGames[0].paused).toBe(false),
  );
  fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Forfeit attempt' }),
    ).toBeEnabled(),
  );
  fireEvent.press(screen.getByRole('button', { name: 'Forfeit attempt' }));
  fireEvent.press(screen.getByRole('button', { name: 'Confirm forfeit' }));
  await waitFor(() =>
    expect(mockStore.getState().world!.miniGames[0].status).toBe('forfeited'),
  );
  expect(mockStore.getState().world!.incidents).toHaveLength(1);
  expect(mockStore.getState().world!.incidents[0].gain.minor).toBe(0n);
  expect(screen.getByText('Forfeited')).toBeOnTheScreen();
});

test('fixed playground controls, forfeit and replay never dispatch a live command or modify SQLite', async () => {
  const initial = await setup(),
    before = encodeWorld(initial),
    dispatch = jest.spyOn(mockStore.getState(), 'dispatch');
  await show(<MiniGamePlayground />);
  expect(screen.queryAllByRole('radio')).toHaveLength(0);
  expect(screen.queryByText(/Difficulty|Level \d|LEVEL \d/)).toBeNull();
  fireEvent.press(screen.getByText('Orbital Docking', { exact: true }));
  fireEvent.press(await screen.findByRole('button', { name: 'Play' }));
  await act(async () => {});
  act(() => jest.advanceTimersByTime(1100));
  expect(screen.queryByText(/LEVEL \d/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Coast' })).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Thrust left' }));
  await act(async () => {});
  fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
  await act(async () => {});
  fireEvent.press(screen.getByRole('button', { name: 'Forfeit attempt' }));
  fireEvent.press(screen.getByRole('button', { name: 'Confirm forfeit' }));
  await act(async () => {});
  expect(screen.getByText('PRACTICE RESULT')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Play again' }));
  await act(async () => {});
  act(() => jest.advanceTimersByTime(1100));
  expect(
    screen.getByRole('button', { name: 'Thrust right' }),
  ).toBeOnTheScreen();
  expect(dispatch).not.toHaveBeenCalled();
  expect(encodeWorld(mockStore.getState().world!)).toBe(before);
  expect(encodeWorld(await repository.load(initial.id))).toBe(before);
});

test('switched-off God Mode cannot open the playground', async () => {
  await setup();
  mockAllowed = false;
  await show(<MiniGamePlayground />);
  expect(screen.UNSAFE_getByType(Redirect).props.href).toBe('/settings');
  expect(screen.queryByRole('header', { name: 'Mini-Game Playground' })).toBeNull();
  expect(screen.queryByText(/Enable God Mode/)).toBeNull();
  expect(screen.queryByRole('button', { name: 'Play' })).toBeNull();
});

test('the result Retry action reuses a lost completion receipt instead of inserting an intervening pause', async () => {
  const original = await setup(),
    current = mockStore.getState().world!;
  let lost = true;
  const wrapped = {
    active: () => repository.active(),
    list: () => repository.list(),
    commit: async (...args: Parameters<SaveRepository['commit']>) => {
      const result = await repository.commit(...args);
      if (lost && args[0].miniGames[0]?.status === 'completed') {
        lost = false;
        throw Error('Lost acknowledgement');
      }
      return result;
    },
  } as SaveRepository;
  mockStore = createGameStore({
    repository: async () => wrapped,
    date: () => current.date,
    id: () => 'unused',
  });
  await mockStore.getState().bootstrap();
  await show(<LiveMiniGame />);
  await play();
  fireEvent.press(screen.getByRole('button', { name: 'Aim higher' }));
  fireEvent.press(screen.getByRole('button', { name: 'Shoot' }));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Retry saving result' }),
    ).toBeEnabled(),
  );
  expect(mockStore.getState().world!.miniGames[0].status).toBe('active');
  expect((await repository.load(original.id)).miniGames[0].status).toBe(
    'completed',
  );
  fireEvent.press(screen.getByRole('button', { name: 'Retry saving result' }));
  await waitFor(() =>
    expect(mockStore.getState().world!.miniGames[0].status).toBe('completed'),
  );
  expect(
    mockStore
      .getState()
      .world!.journal.filter(
        (row) => row.id.endsWith('_result') && row.id.startsWith('mini_'),
      ),
  ).toHaveLength(1);
});

test('reloading a move with a lost save acknowledgement recovers its transcript and completes it once', async () => {
  const original = await setup();
  let lost = true;
  const wrapped = {
    active: () => repository.active(),
    list: () => repository.list(),
    commit: async (...args: Parameters<SaveRepository['commit']>) => {
      const result = await repository.commit(...args);
      if (lost && args[0].miniGames[0]?.inputs.length === 1) {
        lost = false;
        throw Error('Lost move acknowledgement');
      }
      return result;
    },
  } as SaveRepository;
  mockStore = createGameStore({
    repository: async () => wrapped,
    date: () => original.date,
    id: () => 'unused',
  });
  await mockStore.getState().bootstrap();
  await show(<LiveMiniGame />);
  await play();
  fireEvent.press(screen.getByRole('button', { name: 'Aim higher' }));
  fireEvent.press(screen.getByRole('button', { name: 'Shoot' }));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Reload saved progress' }),
    ).toBeEnabled(),
  );
  expect(mockStore.getState().world!.miniGames[0].inputs).toHaveLength(0);
  expect((await repository.load(original.id)).miniGames[0].inputs).toHaveLength(
    1,
  );
  fireEvent.press(
    screen.getByRole('button', { name: 'Reload saved progress' }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Retry saving result' }),
    ).toBeEnabled(),
  );
  fireEvent.press(screen.getByRole('button', { name: 'Retry saving result' }));
  await waitFor(() =>
    expect(mockStore.getState().world!.miniGames[0].status).toBe('completed'),
  );
  expect(mockStore.getState().world!.miniGames[0].inputs).toHaveLength(1);
  expect(
    mockStore
      .getState()
      .world!.journal.filter(
        (row) => row.id.endsWith('_result') && row.id.startsWith('mini_'),
      ),
  ).toHaveLength(1);
});

test('backgrounding pauses a live attempt and reopening continues the saved attempt', async () => {
  await setup('crime');
  const listener = jest.spyOn(AppState, 'addEventListener');
  await show(<LiveMiniGame />);
  await play();
  const id = mockStore.getState().world!.miniGames[0].id,
    background = listener.mock.calls.at(-1)![1];
  act(() => background('background'));
  await waitFor(() =>
    expect(mockStore.getState().world!.miniGames[0].paused).toBe(true),
  );
  fireEvent.press(screen.getByRole('button', { name: 'Resume' }));
  await waitFor(() =>
    expect(mockStore.getState().world!.miniGames[0].paused).toBe(false),
  );
  expect(mockStore.getState().world!.miniGames[0].id).toBe(id);
});

test('a start save that finishes after backgrounding opens the same attempt paused', async () => {
  const original = await setup('crime');
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const wrapped = {
    active: () => repository.active(),
    list: () => repository.list(),
    commit: async (...args: Parameters<SaveRepository['commit']>) => {
      await held;
      return repository.commit(...args);
    },
  } as SaveRepository;
  mockStore = createGameStore({
    repository: async () => wrapped,
    date: () => original.date,
    id: () => 'unused',
  });
  await mockStore.getState().bootstrap();
  const listener = jest.spyOn(AppState, 'addEventListener');
  await show(<LiveMiniGame />);
  fireEvent.press(screen.getByRole('button', { name: 'Play' }));
  await waitFor(() => expect(mockStore.getState().busy).toBe(true));
  const previous = AppState.currentState;
  AppState.currentState = 'background';
  try {
    act(() => listener.mock.calls.at(-1)![1]('background'));
    await act(async () => release());
    await waitFor(() =>
      expect(mockStore.getState().world!.miniGames[0]?.paused).toBe(true),
    );
    expect(mockStore.getState().world!.miniGames).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Resume' })).toBeOnTheScreen();
  } finally {
    AppState.currentState = previous;
  }
});

test('burglary consequences remain saved behind the challenge and present only after returning to the game', async () => {
  await setup('crime');
  const view = await show(
    <>
      <GameLayout />
      <LiveMiniGame />
    </>,
  );
  await play();
  fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
  await waitFor(() =>
    expect(mockStore.getState().world!.miniGames[0].paused).toBe(true),
  );
  fireEvent.press(screen.getByRole('button', { name: 'Forfeit attempt' }));
  fireEvent.press(screen.getByRole('button', { name: 'Confirm forfeit' }));
  await waitFor(() =>
    expect(mockStore.getState().world!.miniGames[0].status).toBe('forfeited'),
  );
  const world = mockStore.getState().world!,
    pending = world.pending;
  expect(pending).not.toBeNull();
  expect(world.incidents).toHaveLength(1);
  expect(screen.queryByText('Saved legal scene')).toBeNull();
  mockRoute = '/crime';
  view.rerender(frame(<GameLayout />));
  expect(screen.getByText('Saved legal scene')).toBeOnTheScreen();
  expect(mockStore.getState().world).toBe(world);
  expect(mockStore.getState().world!.pending).toBe(pending);
});

test('forfeiting escape in custody keeps its actual charge behind the result, then returns to the saved legal decision', async () => {
  const initial = await setup('escape'), sentenceId = activeSentence(initial)!.id;
  const view = await show(<><GameLayout /><LiveMiniGame /></>);
  await play();
  fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
  await waitFor(() => expect(mockStore.getState().world!.miniGames[0].paused).toBe(true));
  fireEvent.press(screen.getByRole('button', { name: 'Forfeit attempt' }));
  expect(screen.getByText(/Forfeiting fails this escape attempt/)).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Confirm forfeit' }));
  await waitFor(() => expect(mockStore.getState().world!.miniGames[0].status).toBe('forfeited'));
  const saved = mockStore.getState().world!, pending = saved.pending;
  expect(activeSentence(saved)?.id).toBe(sentenceId);
  expect(saved.miniGames[0].score).toBe(0);
  expect(saved.incidents.filter(row => row.personId === saved.activePersonId && row.offence === 'escape')).toHaveLength(1);
  expect(pending?.kind === 'decision' && pending.templateId).toBe('arrest');
  expect(screen.getByText('Forfeited')).toBeOnTheScreen();
  expect(screen.queryByText('Saved legal scene')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
  mockRoute = '/prison-activities';
  view.rerender(frame(<GameLayout />));
  expect(screen.getByText('Saved legal scene')).toBeOnTheScreen();
  expect(mockStore.getState().world!.pending).toBe(pending);
  expect(mockStore.getState().world).toBe(saved);
  expect(encodeWorld(await repository.load(initial.id))).toBe(encodeWorld(saved));
});


test('artwork must preload before a saved attempt starts and a failed preload can be retried', async () => {
  await setup();
  const load = jest.requireMock('expo-asset').Asset.loadAsync as jest.Mock;
  load.mockRejectedValueOnce(Error('Local asset unavailable'));
  await show(<LiveMiniGame />);
  expect(screen.getByRole('button', { name: 'Preparing scene…' })).toBeDisabled();
  expect(mockStore.getState().world!.miniGames).toHaveLength(0);
  fireEvent.press(screen.getByRole('button', { name: 'Reload artwork' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled());
  expect(mockStore.getState().world!.miniGames).toHaveLength(0);
  await play();
  expect(mockStore.getState().world!.miniGames).toHaveLength(1);
});

test('standard football confirms aim before showing power and submits the original typed shot', async () => {
  await setup();
  await show(<LiveMiniGame />);
  fireEvent(screen.getByRole('switch', { name: 'Assisted controls' }), 'valueChange', false);
  await play();
  expect(screen.queryByRole('button', { name: 'Shoot' })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Set aim' }));
  expect(screen.getByRole('button', { name: 'Shoot' })).toBeEnabled();
  fireEvent.press(screen.getByRole('button', { name: 'Adjust aim' }));
  expect(screen.queryByRole('button', { name: 'Shoot' })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Set aim' }));
  fireEvent.press(screen.getByRole('button', { name: 'Shoot' }));
  await waitFor(() => expect(mockStore.getState().world!.miniGames[0].inputs).toHaveLength(1));
  expect(mockStore.getState().world!.miniGames[0].inputs[0].action).toEqual({ type: 'shot', x: 0.8, y: 0.25 });
  act(() => jest.advanceTimersByTime(1200));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled());
  expect(mockStore.getState().world!.miniGames[0].status).toBe('completed');
});


test('a restored attempt can retry missing artwork before its paused controls become available', async () => {
  await setup('crime');
  const view = await show(<LiveMiniGame />);
  await play();
  fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
  await waitFor(() => expect(mockStore.getState().world!.miniGames[0].paused).toBe(true));
  const id = mockStore.getState().world!.miniGames[0].id;
  view.unmount();
  jest.requireMock('expo-asset').Asset.loadAsync.mockRejectedValueOnce(Error('Local asset unavailable'));
  await show(<LiveMiniGame />);
  expect(screen.queryByRole('button', { name: 'Resume' })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Reload artwork' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Resume' })).toBeEnabled());
  expect(mockStore.getState().world!.miniGames).toHaveLength(1);
  expect(mockStore.getState().world!.miniGames[0].id).toBe(id);
});
