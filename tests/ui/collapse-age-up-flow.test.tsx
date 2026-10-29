import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { resolveCommand } from '../../src/game/engine';
import { encodeWorld, validateWorld, type World } from '../../src/game/model';
import { businessBook } from '../../src/game/systems/businessCore';
import { businessStartupQuote } from '../../src/game/systems/businesses';
import {
  cultChangeFollowers,
  cultSpend,
} from '../../src/game/systems/cultCore';
import { endEmployment } from '../../src/game/systems/work';
import { SaveRepository } from '../../src/persistence/repository';
import { createGameStore } from '../../src/state/gameStore';
import { EventModalProvider } from '../../src/ui/EventModal';
import { ThemeProvider } from '../../src/ui/theme';
import { cultFixture, drainCult, foundCult } from '../support/cults';
import { database } from '../support/sqlite';

let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
  Redirect: () => null,
}));
jest.mock('../../src/state/useGame', () => ({
  useGame: (selector: unknown) =>
    require('zustand').useStore(mockStore, selector),
}));
import Life from '../../app/(game)/(tabs)/life';
import { PendingEvent } from '../../src/ui/PendingEvent';

function frame() {
  const world = mockStore.getState().world!;
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, bottom: 34, left: 0, right: 0 },
      }}
    >
      <ThemeProvider>
        <EventModalProvider
          routeKey="life"
          activeRouteKeys={['game', 'life']}
          identity={world.id + ':' + world.activePersonId}
        >
          <Life />
          <PendingEvent />
        </EventModalProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

async function press(name: string) {
  await act(async () => fireEvent.press(screen.getByRole('button', { name })));
  await waitFor(() => expect(mockStore.getState().busy).toBe(false));
  expect(mockStore.getState().error).toBeNull();
}

async function continueVisibleYear() {
  const world = mockStore.getState().world!,
    event = world.pending;
  if (!event) return press('Continue This Year');
  if (event.kind === 'result') return press('Continue');
  const choice =
    event.choices.find(
      (row) => row.id === 'withdraw' && !choiceUnavailable(world, row),
    ) ?? event.choices.find((row) => !choiceUnavailable(world, row));
  if (!choice) throw Error('Expected an available Age Up choice');
  return press(choice.label);
}

function prepared(domain: 'cult' | 'business') {
  if (domain === 'cult') {
    const world = foundCult(undefined, { joiningFee: 0n, recurringFee: 0n }),
      cult = world.cults[0];
    cultSpend(
      world,
      cult,
      cult.cash,
      'communal-cost',
      'Committed communal costs',
    );
    cultChangeFollowers(cult, 3 - cult.followers);
    cult.loyalty = 0;
    return validateWorld(world);
  }
  let world = cultFixture();
  world = drainCult(
    resolveCommand(world, {
      type: 'start-business',
      kind: 'software',
      name: 'Last Light',
      operation: 'manager',
      quotedCapital: businessStartupQuote(world, 'software').capital,
    }),
  );
  const company = world.businesses[0];
  for (const member of [...company.staff])
    endEmployment(world, member.personId);
  businessBook(
    world,
    company,
    -company.cash,
    0n,
    'test-loss',
    'Working capital lost',
  );
  company.equipment = 0n;
  return validateWorld(world);
}

test.each(['cult', 'business'] as const)(
  'Life Age Up displays the actual %s collapse information, restores it cold and continues the same year without another collapse popup',
  async (domain) => {
    const initial = prepared(domain),
      { sqlite, driver } = database(),
      repository = new SaveRepository(driver);
    await repository.initialise();
    await repository.create(initial);
    const boot = async () => {
      const coldRepository = new SaveRepository(driver);
      mockStore = createGameStore({
        repository: async () => coldRepository,
        date: () => initial.date,
        id: () => 'unused',
      });
      await mockStore.getState().bootstrap();
    };
    await boot();
    let view = render(frame());
    const id =
        domain === 'cult'
          ? 'cult_collapse_' + initial.cults[0].id
          : 'business_failure_' + initial.businesses[0].id,
      title =
        domain === 'cult'
          ? 'Your organisation has collapsed'
          : 'The business has closed',
      active = (world: World) =>
        domain === 'cult'
          ? world.cults[0].status === 'active'
          : world.businesses[0].status === 'active';
    await press('Age Up');
    let guard = 0;
    while (active(mockStore.getState().world!) && guard++ < 100)
      await continueVisibleYear();
    expect(guard).toBeLessThan(100);
    await waitFor(() =>
      expect(screen.getByRole('header', { name: title })).toBeOnTheScreen(),
    );
    const collapsed = mockStore.getState().world!;
    expect(collapsed.pending).toMatchObject({
      kind: 'result',
      id,
      title,
      effects: [],
    });
    expect(collapsed.annual).toMatchObject({
      monthsProcessed: domain === 'cult' ? 4 : 3,
      pausedForPlanning: true,
    });
    expect(screen.getByText(collapsed.pending!.body)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
    expect(await repository.load(collapsed.id)).toEqual(collapsed);
    const saved = encodeWorld(collapsed);
    view.unmount();
    await boot();
    view = render(frame());
    expect(encodeWorld(mockStore.getState().world!)).toBe(saved);
    expect(screen.getByRole('header', { name: title })).toBeOnTheScreen();
    expect(screen.getByText(collapsed.pending!.body)).toBeOnTheScreen();
    await press('Continue');
    const acknowledged = mockStore.getState().world!;
    expect(acknowledged).toEqual(
      resolveCommand(collapsed, { type: 'acknowledge', resultId: id }, true),
    );
    expect(acknowledged.date).toEqual(collapsed.date);
    expect(acknowledged.annual?.pausedForPlanning).toBe(true);
    expect(screen.queryByRole('header', { name: title })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Continue This Year' }),
    ).toBeEnabled();
    await press('Continue This Year');
    guard = 0;
    while (
      (mockStore.getState().world!.pending ||
        mockStore.getState().world!.annual) &&
      guard++ < 100
    ) {
      const world = mockStore.getState().world!;
      expect(world.pending?.id).not.toBe(id);
      expect(world.deferred.some((row) => row.event.id === id)).toBe(false);
      expect(screen.queryByRole('header', { name: title })).toBeNull();
      await continueVisibleYear();
    }
    expect(guard).toBeLessThan(100);
    expect(mockStore.getState().world!.date).toEqual(
      collapsed.annual!.targetDate,
    );
    expect(await repository.load(collapsed.id)).toEqual(
      mockStore.getState().world,
    );
    view.unmount();
    sqlite.close();
  },
);
