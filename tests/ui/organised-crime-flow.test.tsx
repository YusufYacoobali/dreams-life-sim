import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { createGameStore } from "../../src/state/gameStore";
import { decodeWorld, encodeWorld } from "../../src/game/model";
import { SaveRepository } from "../../src/persistence/repository";
import { database } from "../support/sqlite";
import { ThemeProvider } from "../../src/ui/theme";
import { PendingEvent } from "../../src/ui/PendingEvent";
import { activeOrganisation } from "../../src/game/systems/organisedCrime";
import fixture from "../fixtures/v3-employed-graduate.json";
let mockStore: ReturnType<typeof createGameStore>;
jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
jest.mock("../../src/state/useGame", () => ({
  useGame: (selector: unknown) =>
    require("zustand").useStore(mockStore, selector),
}));
import Dashboard from "../../app/(game)/organised-crime";
import SpecialCareers from "../../app/(game)/special-careers";
import Crime from "../../app/(game)/crime";
import { router } from "expo-router";
const frame = (children: React.ReactNode) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 47, bottom: 34, left: 0, right: 0 },
    }}
  >
    <ThemeProvider>{children}</ThemeProvider>
  </SafeAreaProvider>
);
async function setup() {
  const { sqlite, driver } = database(),
    repository = new SaveRepository(driver);
  await repository.initialise();
  const world = decodeWorld(JSON.stringify(fixture));
  world.people[world.activePersonId].stats.energy = 100;
  await repository.create(world);
  mockStore = createGameStore({
    repository: async () => repository,
    date: () => world.date,
    id: () => "life_unused",
  });
  await mockStore.getState().bootstrap();
  return { sqlite, driver, repository, world };
}
test("both existing career and crime routes reach the same organisation dashboard without a save", async () => {
  const { sqlite, repository, world } = await setup(),
    before = encodeWorld(world);
  const view = render(frame(<SpecialCareers />));
  fireEvent.press(screen.getByRole("button", { name: /^Organised Crime\./ }));
  expect(router.push).toHaveBeenLastCalledWith("/organised-crime");
  view.rerender(frame(<Crime />));
  fireEvent.press(screen.getByRole("button", { name: /^Organised Crime\./ }));
  expect(router.push).toHaveBeenLastCalledWith("/organised-crime");
  expect(encodeWorld(await repository.load(world.id))).toBe(before);
  view.unmount();
  sqlite.close();
});
test("joining reviews terms, rolls back SQLite failure, retries once and cold-opens the same crew", async () => {
  const { sqlite, driver, repository, world } = await setup();
  const view = render(
    frame(
      <>
        <Dashboard />
        <PendingEvent />
      </>,
    ),
  );
  fireEvent.press(screen.getByRole("button", { name: /^Street Syndicate\./ }));
  expect(screen.getByText("Join The Night Exchange?")).toBeOnTheScreen();
  expect(activeOrganisation(mockStore.getState().world!)).toBeUndefined();
  sqlite.exec(
    "CREATE TRIGGER fail_organisation BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END",
  );
  await act(async () => {
    fireEvent.press(screen.getByRole("button", { name: "Join Organisation" }));
  });
  await waitFor(() =>
    expect(screen.getAllByText(/couldn't be saved/).length).toBeGreaterThan(0),
  );
  expect(await repository.load(world.id)).toEqual(world);
  sqlite.exec("DROP TRIGGER fail_organisation");
  await act(async () => {
    fireEvent.press(screen.getByRole("button", { name: "Join Organisation" }));
  });
  await waitFor(() =>
    expect(screen.getByText("A place at the table")).toBeOnTheScreen(),
  );
  const saved = mockStore.getState().world!,
    gang = activeOrganisation(saved)!;
  expect(saved.gangs).toHaveLength(1);
  expect(gang.organised!.members).toHaveLength(3);
  const cold = new SaveRepository(driver);
  await cold.initialise();
  expect(encodeWorld(await cold.load(world.id))).toBe(encodeWorld(saved));
  await act(async () => {
    fireEvent.press(screen.getByRole("button", { name: "Continue" }));
  });
  expect(screen.getByText("Recruit")).toBeOnTheScreen();
  expect(
    screen.getByRole("button", { name: /^The Missing Envelope\./ }),
  ).toBeOnTheScreen();
  fireEvent.press(
    screen.getByRole("button", { name: /^The Missing Envelope\./ }),
  );
  expect(
    screen.getByText("Cautious · smaller reward, less exposure"),
  ).toBeOnTheScreen();
  fireEvent.press(screen.getByRole("button", { name: "Never mind" }));
  expect(
    activeOrganisation(mockStore.getState().world!)!.organised!.jobs,
  ).toHaveLength(0);
  view.unmount();
  sqlite.close();
});

test('the approach picker disables unavailable Crew-led while leaving Cautious and Bold selectable', async () => {
  const { resolveCommand } = require('../../src/game/engine') as typeof import('../../src/game/engine');
  const { sqlite, world } = await setup();
  let joined = resolveCommand(world, { type: 'organised-join', style: 'street-syndicate' });
  joined = resolveCommand(joined, { type: 'acknowledge', resultId: joined.pending!.id });
  for (const member of activeOrganisation(joined)!.organised!.members) member.loyalty = 44;
  mockStore.setState({ world: joined });
  const view = render(frame(<Dashboard />));
  fireEvent.press(screen.getByRole('button', { name: /^The Missing Envelope\./ }));
  const crew = screen.getByRole('radio', { name: /Crew-led.*trusted, available crew member/ });
  expect(crew).toBeDisabled();
  expect(screen.getByRole('radio', { name: 'Cautious · smaller reward, less exposure' })).not.toBeDisabled();
  expect(screen.getByRole('radio', { name: 'Bold · more reward, more risk' })).not.toBeDisabled();
  expect(screen.getByText('You need a trusted, available crew member')).toBeOnTheScreen();
  view.unmount(); sqlite.close();
});
