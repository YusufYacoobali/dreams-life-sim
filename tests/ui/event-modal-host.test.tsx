import React, { useState } from 'react';
import { AccessibilityInfo, Modal, Platform } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationRouteContext } from 'expo-router/react-navigation';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import {
  EventModal,
  EventModalProvider,
  type EventPresentation,
} from '../../src/ui/EventModal';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { hasAppModal } from '../../src/ui/modalPresence';
import { useHealthReview } from '../../src/ui/HealthReview';
import { Button } from '../../src/ui/components';
import { HobbyRoutine } from '../../src/ui/HobbyRoutine';
import graduate from '../fixtures/v3-employed-graduate.json';

let mockStore: ReturnType<typeof createGameStore>;
const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    navigate: (...args: unknown[]) => mockNavigate(...args),
    back: jest.fn(),
    push: jest.fn(),
  },
}));
jest.mock('../../src/state/useGame', () => ({
  useGame: (selector: unknown) =>
    require('zustand').useStore(mockStore, selector),
}));
import Work from '../../app/(game)/work';
import Bank from '../../app/(game)/bank';

const world = () => mockStore.getState().world!;
const press = async (
  name: string | RegExp,
  role: 'button' | 'radio' = 'button',
) => {
  await act(async () => {
    fireEvent.press(screen.getByRole(role, { name }));
  });
};
const route = (key: string, children: React.ReactNode) => (
  <NavigationRouteContext.Provider value={{ key, name: key }}>
    {children}
  </NavigationRouteContext.Provider>
);
function frame(
  children: React.ReactNode,
  leaf = 'work',
  identity = 'employee',
  active = ['game', leaf],
  blocked = false,
) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, bottom: 34, left: 0, right: 0 },
      }}
    >
      <ThemeProvider>
        <EventModalProvider
          routeKey={leaf}
          activeRouteKeys={active}
          identity={identity}
          blocked={blocked}
        >
          {children}
        </EventModalProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
async function setup(initial = decodeWorld(JSON.stringify(graduate))) {
  const db = database(),
    repository = new SaveRepository(db.driver);
  await repository.initialise();
  await repository.create(initial);
  let pause: Promise<void> | undefined;
  mockStore = createGameStore({
    repository: async () => repository,
    date: () => ({ year: 2026, month: 1, day: 1 }),
    id: () => 'unused',
    yieldToUI: async () => {
      const current = pause;
      pause = undefined;
      if (current) await current;
    },
  });
  expect(await mockStore.getState().bootstrap()).toBe(true);
  return {
    ...db,
    repository,
    hold: () => {
      let release!: () => void;
      pause = new Promise((resolve) => {
        release = resolve;
      });
      return release;
    },
    rows: () =>
      db.sqlite
        .prepare('SELECT * FROM receipts ORDER BY life_id,command_id')
        .all(),
  };
}
afterEach(() => {
  jest.restoreAllMocks();
  mockNavigate.mockReset();
});

test.each(['android', 'ios'] as const)(
  '%s shares one surface during committed selection/result overlap, navigates home and never revives the source review',
  async (platform) => {
    jest.replaceProperty(Platform, 'OS', platform);
    const context = await setup();
    try {
      const initial = world(),
        command = { type: 'work-effort' as const, effort: 'hard' as const },
        predicted = resolveCommand(initial, command, true),
        dispatch = mockStore.getState().dispatch;
      let finish!: () => void;
      const retained = new Promise<void>((resolve) => {
        finish = resolve;
      });
      mockStore.setState({
        dispatch: async (action) => {
          const saved = await dispatch(action);
          if (action.type === 'work-effort' && saved) await retained;
          return saved;
        },
      });
      const content = (
        <>
          {route('work', <Work />)}
          {route('game', <PendingEvent />)}
        </>
      );
      const view = render(frame(content));
      await press('Work routine. balanced');
      await press('Work hard', 'radio');
      const stale = screen
        .UNSAFE_getAllByType(EventModal)
        .find((node) => node.props.event?.kind === 'selection')!.props.onChoose;
      const sourceSurface =
        platform === 'android'
          ? screen.UNSAFE_getByType(Modal)
          : screen.UNSAFE_getByType(FullWindowOverlay);
      const staleBack = sourceSurface.props.onRequestClose;
      await press('Set Routine');
      await waitFor(() =>
        expect(screen.getByText('Work routine updated')).toBeOnTheScreen(),
      );
      expect(world()).toEqual(predicted);
      expect(await context.repository.load(initial.id)).toEqual(predicted);
      expect(screen.queryByRole('button', { name: 'Set Routine' })).toBeNull();
      expect(hasAppModal()).toBe(true);
      if (platform === 'android') {
        expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(1);
        expect(screen.UNSAFE_getByType(Modal)).toBe(sourceSurface);
      } else {
        expect(screen.UNSAFE_queryAllByType(Modal)).toHaveLength(0);
        expect(screen.UNSAFE_getAllByType(FullWindowOverlay)).toHaveLength(1);
      }
      view.rerender(frame(content, 'life'));
      expect(screen.getByText('Work routine updated')).toBeOnTheScreen();
      await act(async () => {
        await stale('hard');
        staleBack?.();
        finish();
      });
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/life'));
      expect(world()).toEqual(predicted);
      await press('Continue');
      expect(world().pending).toBeNull();
      expect(hasAppModal()).toBe(false);
      view.rerender(frame(content, 'work'));
      expect(screen.queryByRole('button', { name: 'Set Routine' })).toBeNull();
      await press('Work routine. hard');
      await press('Take it easy', 'radio');
      await press('Never mind');
      expect(world().revision).toBe(initial.revision + 2);
      view.unmount();
    } finally {
      context.sqlite.close();
    }
  },
);

test('failed save retains the checked selection and retry; navigating away during a held failure retires it and permits reopening', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  const context = await setup();
  try {
    const initial = world(),
      before = encodeWorld(initial),
      beforeRows = context.rows(),
      content = (
        <>
          {route('work', <Work />)}
          {route('game', <PendingEvent />)}
        </>
      ),
      view = render(frame(content));
    await press('Work routine. balanced');
    await press('Work hard', 'radio');
    context.sqlite.exec(
      "CREATE TRIGGER fail_host_save BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END",
    );
    await press('Set Routine');
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/),
    );
    expect(
      screen.getByRole('radio', { name: 'Work hard', checked: true }),
    ).toBeOnTheScreen();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(encodeWorld(world())).toBe(before);
    expect(context.rows()).toEqual(beforeRows);
    const retainedBack = screen.UNSAFE_getByType(Modal).props.onRequestClose;
    const release = context.hold();
    await press('Set Routine');
    expect(mockStore.getState().busy).toBe(true);
    await act(async () => {
      retainedBack();
    });
    expect(
      screen.getByRole('button', { name: 'Set Routine' }),
    ).toBeOnTheScreen();
    view.rerender(frame(content, 'life'));
    expect(screen.queryByRole('button', { name: 'Set Routine' })).toBeNull();
    await act(async () => {
      release();
    });
    await waitFor(() => expect(mockStore.getState().busy).toBe(false));
    view.rerender(frame(content, 'work'));
    await press('Work routine. balanced');
    expect(screen.getByRole('button', { name: 'Set Routine' })).toBeDisabled();
    await press('Work hard', 'radio');
    context.sqlite.exec('DROP TRIGGER fail_host_save');
    await press('Set Routine');
    expect(world().people[world().activePersonId].employment?.effort).toBe(
      'hard',
    );
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    view.unmount();
  } finally {
    context.sqlite.close();
  }
});

test('same-path owners, stack visibility, identity and retired native callbacks cannot act on a replacement card', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  const chooseA = jest.fn(),
    chooseB = jest.fn(),
    cancelA = jest.fn(),
    cancelB = jest.fn();
  const selection: EventPresentation = {
    id: 'shared',
    kind: 'selection',
    title: 'First owner',
    body: 'Choose',
    choices: [{ id: 'a', label: 'Choice A' }],
    confirmLabel: 'Apply',
  };
  const second: EventPresentation = {
    ...selection,
    title: 'Second owner',
    choices: [{ id: 'b', label: 'Choice B' }],
  };
  const view = render(
    frame(
      route(
        'person:a',
        <EventModal event={selection} onChoose={chooseA} onCancel={cancelA} />,
      ),
      'person:a',
    ),
  );
  await press('Choice A', 'radio');
  const oldBack = screen.UNSAFE_getByType(Modal).props.onRequestClose;
  view.rerender(
    frame(
      <>
        {route(
          'person:a',
          <EventModal
            event={selection}
            onChoose={chooseA}
            onCancel={cancelA}
          />,
        )}
        {route(
          'person:b',
          <EventModal event={second} onChoose={chooseB} onCancel={cancelB} />,
        )}
      </>,
      'person:b',
    ),
  );
  expect(screen.getByText('Second owner')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  await act(async () => {
    oldBack();
  });
  expect(cancelB).not.toHaveBeenCalled();
  expect(chooseA).not.toHaveBeenCalled();
  const pending: EventPresentation = {
    id: 'saved-result',
    kind: 'result',
    title: 'Saved outcome',
    body: 'Persistent',
    effects: [],
  };
  view.rerender(
    frame(
      route(
        'game',
        <EventModal scope="stack" event={pending} onChoose={chooseB} />,
      ),
      'life',
    ),
  );
  expect(screen.getByText('Saved outcome')).toBeOnTheScreen();
  view.rerender(
    frame(
      route(
        'game',
        <EventModal scope="stack" event={pending} onChoose={chooseB} />,
      ),
      'settings',
      'employee',
      ['settings'],
    ),
  );
  expect(screen.queryByText('Saved outcome')).toBeNull();
  expect(hasAppModal()).toBe(false);
  view.rerender(
    frame(
      route(
        'game',
        <EventModal scope="stack" event={pending} onChoose={chooseB} />,
      ),
      'life',
    ),
  );
  expect(screen.getByText('Saved outcome')).toBeOnTheScreen();
  view.rerender(
    frame(
      route(
        'game',
        <EventModal scope="stack" event={pending} onChoose={chooseB} />,
      ),
      'life',
      'another-person',
    ),
  );
  expect(screen.queryByText('Saved outcome')).toBeNull();
  view.unmount();
});

test('cinematic cover hides hosted cards and review ownership never blocks itself', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  const choose = jest.fn(),
    review: EventPresentation = {
      id: 'review',
      kind: 'decision',
      title: 'Enjoying Dreams?',
      body: 'A review',
      choices: [{ id: 'later', label: 'Later' }],
    };
  const content = route(
      'game',
      <EventModal
        scope="stack"
        modalOwner="review"
        event={review}
        onChoose={choose}
      />,
    ),
    view = render(frame(content, 'life'));
  expect(screen.getByText('Enjoying Dreams?')).toBeOnTheScreen();
  expect(hasAppModal()).toBe(false);
  view.rerender(frame(content, 'life', 'employee', ['game', 'life'], true));
  expect(screen.queryByText('Enjoying Dreams?')).toBeNull();
  view.rerender(frame(content, 'life'));
  await press('Later');
  expect(choose).toHaveBeenCalledWith('later');
  view.unmount();
});

function GuardedReview() {
  const review = useHealthReview('host-regression');
  return (
    <>
      <Button
        label="Review a Walk"
        onPress={() =>
          review.confirm(
            { type: 'exercise', activity: 'walk' },
            'Begin a walk?',
            'Review this activity.',
            [],
            'exercise',
            'Begin Walk',
          )
        }
      />
      {review.modal}
    </>
  );
}

test.each(['health', 'hobby', 'bank'] as const)(
  'a retired guarded %s review can reopen the same command after its held failed submit settles',
  async (kind) => {
    jest.replaceProperty(Platform, 'OS', 'android');
    let initial = decodeWorld(JSON.stringify(graduate));
    if (kind === 'bank') {
      initial = resolveCommand(
        initial,
        { type: 'borrow', amount: 100000n },
        true,
      );
      initial = resolveCommand(
        initial,
        { type: 'acknowledge', resultId: initial.pending!.id },
        true,
      );
    }
    const context = await setup(initial);
    try {
      const dispatch = mockStore.getState().dispatch;
      let settle!: () => void;
      const settling = new Promise<void>((resolve) => {
        settle = resolve;
      });
      // busy=false is published before the returned dispatch promise settles.
      // Hold that legitimate boundary so retirement sees the hook's still-active
      // submitting guard, rather than relying on native/React microtask timing.
      mockStore.setState({
        dispatch: async (command) => {
          const saved = await dispatch(command);
          if (!saved) await settling;
          return saved;
        },
      });
      const open =
          kind === 'health'
            ? 'Review a Walk'
            : kind === 'hobby'
              ? 'Review Hobby Routine'
              : 'Review Repayment',
        confirm =
          kind === 'health'
            ? 'Begin Walk'
            : kind === 'hobby'
              ? 'Set Hobby Routine'
              : 'Repay',
        title =
          kind === 'health'
            ? 'Begin a walk?'
            : kind === 'hobby'
              ? 'Reading Routine'
              : 'Make this repayment?';
      const content = route(
          'exercise',
          kind === 'health' ? (
            <GuardedReview />
          ) : kind === 'hobby' ? (
            <HobbyRoutine kind="reading" />
          ) : (
            <Bank />
          ),
        ),
        view = render(frame(content, 'exercise'));
      if (kind === 'bank') {
        await press(/^Personal debt\./);
        await act(async () => {
          fireEvent.changeText(
            screen.getByLabelText('Repayment amount in USD'),
            '10.17',
          );
        });
      }
      await press(open);
      context.sqlite.exec(
        "CREATE TRIGGER fail_guarded_host BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END",
      );
      const release = context.hold();
      await press(confirm);
      view.rerender(frame(content, 'life'));
      await act(async () => {
        release();
      });
      await waitFor(() => expect(mockStore.getState().busy).toBe(false));
      await act(async () => {
        settle();
      });
      view.rerender(frame(content, 'exercise'));
      await press(open);
      expect(screen.getByText(title)).toBeOnTheScreen();
      await press('Never mind');
      expect(world().pending).toBeNull();
      view.unmount();
    } finally {
      context.sqlite.close();
    }
  },
);

test('settling a retired submit cannot cancel a newer owner with the same event ID', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  let finish!: () => void;
  const held = new Promise<void>((resolve) => {
      finish = resolve;
    }),
    cancelled = jest.fn();
  const event: EventPresentation = {
    kind: 'confirmation',
    id: 'reused-command',
    title: 'First review',
    body: 'Original',
    terms: [],
    confirmLabel: 'Submit',
  };
  const view = render(
    frame(
      route(
        'first',
        <EventModal
          key="first"
          event={event}
          onChoose={() => held}
          onCancel={() => {}}
        />,
      ),
      'first',
    ),
  );
  await press('Submit');
  view.rerender(
    frame(
      route(
        'second',
        <EventModal
          key="second"
          event={{ ...event, title: 'Replacement review' }}
          onChoose={() => {}}
          onCancel={cancelled}
        />,
      ),
      'second',
    ),
  );
  await act(async () => {
    finish();
  });
  expect(screen.getByText('Replacement review')).toBeOnTheScreen();
  expect(cancelled).not.toHaveBeenCalled();
  view.unmount();
});
