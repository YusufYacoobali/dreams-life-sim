import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { AccessibilityInfo, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useStore } from 'zustand';
import { createGameStore } from '../../src/state/gameStore';
import { SaveRepository } from '../../src/persistence/repository';
import { ThemeProvider } from '../../src/ui/theme';
import { FeedbackProvider } from '../../src/ui/feedback';
import { database } from '../support/sqlite';
import { athleteFixture, miniGameFixture } from '../support/miniGames';
import { encodeWorld } from '../../src/game/model';
import { burglaryContext } from '../../src/minigames/core/eligibility';

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
  useGodModeAccess: () => mockAllowed,
}));
jest.mock('lottie-react-native', () => () => null);
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
import GameLayout from '../../app/(game)/_layout';

const frame = (children: React.ReactNode) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 400, height: 900 },
      insets: { top: 24, bottom: 24, left: 0, right: 0 },
    }}
  >
    <ThemeProvider appearance="dark">
      <FeedbackProvider
        reducedMotion
        haptics={false}
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
async function setup(kind: 'sports' | 'crime' = 'sports') {
  const db = database();
  sqlite = db.sqlite;
  repository = new SaveRepository(db.driver);
  await repository.initialise();
  const world = kind === 'sports' ? athleteFixture() : miniGameFixture();
  await repository.create(world);
  mockStore = createGameStore({
    repository: async () => repository,
    date: () => world.date,
    id: () => 'life_ui_minigame',
  });
  await mockStore.getState().bootstrap();
  mockParams = {
    kind,
    ownerId: kind === 'sports' ? world.careers[0].id : world.activePersonId,
    contextId:
      kind === 'sports'
        ? world.careers[0].projects[0].id
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
  sqlite?.close();
});
const play = async () => {
  fireEvent.press(screen.getByRole('button', { name: 'Play' }));
  await waitFor(() =>
    expect(mockStore.getState().world!.miniGames).toHaveLength(1),
  );
  act(() => jest.advanceTimersByTime(1100));
};

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
  fireEvent.press(screen.getByRole('button', { name: 'Return' }));
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

test('playground difficulty, input, forfeit and replay never dispatch a live command or modify SQLite', async () => {
  const initial = await setup(),
    before = encodeWorld(initial),
    dispatch = jest.spyOn(mockStore.getState(), 'dispatch');
  await show(<MiniGamePlayground />);
  fireEvent.press(screen.getByRole('radio', { name: 'Level 5' }));
  fireEvent.press(screen.getByText('Orbital Docking', { exact: true }));
  fireEvent.press(screen.getByRole('button', { name: 'Play' }));
  act(() => jest.advanceTimersByTime(1100));
  fireEvent.press(screen.getByRole('button', { name: 'Thrust left' }));
  await act(async () => {});
  fireEvent.press(screen.getByRole('button', { name: 'Pause' }));
  await act(async () => {});
  fireEvent.press(screen.getByRole('button', { name: 'Forfeit attempt' }));
  fireEvent.press(screen.getByRole('button', { name: 'Confirm forfeit' }));
  await act(async () => {});
  expect(screen.getByText('PRACTICE RESULT')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: 'Play again' }));
  act(() => jest.advanceTimersByTime(1100));
  expect(
    screen.getByRole('button', { name: 'Thrust right' }),
  ).toBeOnTheScreen();
  expect(dispatch).not.toHaveBeenCalled();
  expect(encodeWorld(mockStore.getState().world!)).toBe(before);
  expect(encodeWorld(await repository.load(initial.id))).toBe(before);
});

test('ordinary builds and switched-off God Mode cannot open the playground', async () => {
  await setup();
  mockAllowed = false;
  await show(<MiniGamePlayground />);
  expect(screen.getByText(/internal\/developer builds/)).toBeOnTheScreen();
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
