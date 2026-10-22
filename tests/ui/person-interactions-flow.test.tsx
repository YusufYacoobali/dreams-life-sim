import React from 'react';
import * as Native from 'react-native';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, encodeWorld, fullName, validateWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { accountFor, post } from '../../src/game/systems/common';
import { personActionOptions } from '../../src/game/systems/personInteractions';
import { otherPerson, partnerRelation } from '../../src/game/systems/relationships';
import { supportAmountOptions } from '../../src/game/systems/personSupport';
import { SaveRepository } from '../../src/persistence/repository';
import { EventModal } from '../../src/ui/EventModal';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { ThemeProvider } from '../../src/ui/theme';
import { database } from '../support/sqlite';
import { pupil } from '../support/pupil';
import graduate from '../fixtures/v3-employed-graduate.json';
import marriage from '../fixtures/v5-marriage-result.json';

let mockStore: ReturnType<typeof createGameStore>, mockPersonId = 'person_parent1';
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, useLocalSearchParams: () => ({ id: mockPersonId }) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react'), { Text } = require('react-native');
  const glyphs = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
  return ({ name, size, color, style, ...props }: any) => <Text {...props} allowFontScaling={false} style={[{ fontFamily: 'Ionicons', fontSize: size, color }, style]}>{String.fromCodePoint(glyphs[name] || glyphs['ellipse-outline'])}</Text>;
});
import Person from '../../app/(game)/person/[id]';
const frame = (width = 390, dark = false) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider appearance={dark ? 'dark' : 'light'}><Person /><PendingEvent /></ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp) => { await act(async () => fireEvent.press(screen.getByRole('button', { name }))); };
const world = () => mockStore.getState().world!;
const selection = () => screen.UNSAFE_getAllByType(EventModal).find(item => item.props.event?.id.startsWith('person-support:'))!;
const pressSelection = async (name: string) => { await act(async () => fireEvent.press(within(selection()).getByRole('button', { name }))); };

async function setup(initial: World) {
  const context = database(), repository = new SaveRepository(context.driver); await repository.initialise(); await repository.create(initial);
  const cold = async () => { mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'unused' }); expect(await mockStore.getState().bootstrap()).toBe(true); };
  await cold();
  return { ...context, repository, cold };
}
function loanFixture() {
  const initial = decodeWorld(JSON.stringify(graduate)), target = initial.people[mockPersonId];
  post(initial, 1000000000n, 0n, 'fixture-funding', 'Lender fixture funding', null, target);
  // Configure an admitted consent fixture, then use the real support command.
  // The UI and repository never fabricate or alter the lender’s saved answer.
  for (let seed = 1; seed <= 1000; seed++) {
    const candidate = decodeWorld(encodeWorld(initial)); candidate.random.outcomes = seed; candidate.random.npcs = seed;
    const option = supportAmountOptions(candidate, target.id, 'loan').find(item => item.id === 'small')!;
    const predicted = resolveCommand(candidate, { type: 'ask-person-support', lifeId: candidate.id, actorId: candidate.activePersonId, personId: target.id, kind: 'loan', amount: option.amount, currency: option.currency });
    if (predicted.personSupportRequests.at(-1)?.status === 'offered') return { initial: validateWorld(candidate), option, predicted };
  }
  throw new Error('Expected a valid loan consent fixture');
}

beforeEach(() => { mockPersonId = 'person_parent1'; jest.clearAllMocks(); });
afterEach(() => jest.restoreAllMocks());

test('a parent profile keeps its real actions, groups support and money, and hides family romance', async () => {
  let initial = pupil('US', 8);
  while (initial.pending?.kind === 'result') initial = resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending.id });
  const context = await setup(initial);
  try {
    const view = render(frame());
    expect(screen.getByRole('header', { name: 'Relationship & Wellbeing' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Time together' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Family Support' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Money & Gifts' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Disagreements' })).toBeOnTheScreen();
    for (const label of ['Have a Conversation', 'Give a Compliment', 'Spend Time Together', 'Give Money', 'Argue']) expect(screen.getByRole('button', { name: new RegExp('^' + label) })).toBeOnTheScreen();
    for (const option of personActionOptions(initial, mockPersonId)) expect(screen.getByRole('button', { name: new RegExp('^' + option.label) })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: /^Ask on a Date/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Ask for a Loan/ })).toBeNull();
    expect(encodeWorld(world())).toBe(encodeWorld(initial)); expect(await context.repository.load(initial.id)).toEqual(initial);
    view.unmount();
  } finally { context.sqlite.close(); }
});

test('requesting a loan saves the real offer and only explicit acceptance creates debt, including failed saves and reloads', async () => {
  const { initial, option, predicted } = loanFixture(), context = await setup(initial);
  try {
    const view = render(frame()), before = encodeWorld(world());
    await press(/^Ask for a Loan\./); const cancelled = selection().props;
    await press('Never mind'); await act(async () => { await cancelled.onChoose('small'); });
    expect(encodeWorld(world())).toBe(before);
    await press(/^Ask for a Loan\./);
    await act(async () => fireEvent.press(screen.getByRole('radio', { name: /^Small\b/ })));
    context.sqlite.exec("CREATE TRIGGER fail_person_request BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await pressSelection('Ask for a Loan'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(encodeWorld(world())).toBe(before); expect(encodeWorld(await context.repository.load(initial.id))).toBe(before);
    expect(screen.getByRole('radio', { name: /^Small\b/, checked: true })).toBeOnTheScreen();
    context.sqlite.exec('DROP TRIGGER fail_person_request'); await pressSelection('Ask for a Loan');
    expect(encodeWorld(world())).toBe(encodeWorld(predicted)); const offer = world().personSupportRequests.at(-1)!;
    expect(offer.status).toBe('offered'); expect(offer.offered).toBeGreaterThan(0n); expect(offer.requested).toBe(option.amount);
    expect(world().liabilities).toEqual(initial.liabilities);
    expect(accountFor(world()).cash).toBe(accountFor(initial).cash);
    expect(world().ledger.filter(item => item.category === 'person-loan')).toHaveLength(0);
    await act(async () => { await context.cold(); }); view.rerender(frame());
    expect(world().personSupportRequests.at(-1)).toEqual(offer); await press('Continue');
    expect(screen.getByRole('button', { name: 'Accept Loan' })).toBeOnTheScreen();
    const beforeAccept = encodeWorld(world()), lenderCash = accountFor(world(), world().people[mockPersonId], offer.currency).cash;
    context.sqlite.exec("CREATE TRIGGER fail_person_accept BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press('Accept Loan'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(encodeWorld(world())).toBe(beforeAccept); expect(encodeWorld(await context.repository.load(initial.id))).toBe(beforeAccept);
    context.sqlite.exec('DROP TRIGGER fail_person_accept'); await press('Accept Loan');
    const accepted = world().personSupportRequests.at(-1)!;
    expect(accepted.status).toBe('accepted'); expect(world().liabilities.filter(item => item.id === accepted.liabilityId)).toHaveLength(1);
    expect(world().liabilities.find(item => item.id === accepted.liabilityId)).toMatchObject({ principal: offer.offered, creditorId: mockPersonId, interestBps: 0 });
    expect(accountFor(world(), world().people[mockPersonId], offer.currency).cash).toBe(lenderCash - offer.offered);
    const saved = encodeWorld(world()); await act(async () => { await context.cold(); }); view.rerender(frame()); expect(encodeWorld(world())).toBe(saved);
    await press('Continue'); expect(screen.queryByRole('button', { name: 'Accept Loan' })).toBeNull();
    await press(new RegExp('^Loan from ' + world().people[mockPersonId].firstName)); expect(router.push).toHaveBeenCalledWith('/bank');
    view.unmount();
  } finally { context.sqlite.close(); }
});

test('declining a saved loan offer spends nothing and leaves no debt after reloading', async () => {
  const { predicted } = loanFixture();
  const initial = resolveCommand(predicted, { type: 'acknowledge', resultId: predicted.pending!.id }), context = await setup(initial);
  try {
    const view = render(frame()), accounts = structuredClone(world().accounts), liabilities = structuredClone(world().liabilities);
    await press('Decline Loan'); expect(world().personSupportRequests.at(-1)?.status).toBe('declined');
    expect(world().accounts).toEqual(accounts); expect(world().liabilities).toEqual(liabilities);
    const saved = encodeWorld(world()); await act(async () => { await context.cold(); }); view.rerender(frame()); expect(encodeWorld(world())).toBe(saved);
    expect(screen.queryByRole('button', { name: 'Accept Loan' })).toBeNull(); view.unmount();
  } finally { context.sqlite.close(); }
});

test('a captured money-request callback cannot send to a former profile after changing people', async () => {
  const { initial } = loanFixture(), context = await setup(initial);
  try {
    const view = render(frame()); await press(/^Ask for Money\./); const stale = selection().props;
    const before = encodeWorld(world()); mockPersonId = 'person_parent2'; view.rerender(frame());
    await act(async () => { await stale.onChoose('small'); stale.onCancel(); });
    expect(encodeWorld(world())).toBe(before); expect(encodeWorld(await context.repository.load(initial.id))).toBe(before);
    expect(screen.getByRole('header', { name: fullName(world().people[mockPersonId]) })).toBeOnTheScreen();
    expect(screen.UNSAFE_getAllByType(EventModal).filter(item => item.props.event?.id.startsWith('person-support:'))).toHaveLength(0); view.unmount();
  } finally { context.sqlite.close(); }
});

test('a role-specific advice action saves the core result once after a failed write and retains it on reload', async () => {
  let initial = pupil('US', 8);
  while (initial.pending?.kind === 'result') initial = resolveCommand(initial, { type: 'acknowledge', resultId: initial.pending.id });
  const advice = personActionOptions(initial, mockPersonId).find(option => option.id === 'ask-advice')!;
  const command = { type: 'person-action' as const, lifeId: initial.id, actorId: initial.activePersonId, personId: mockPersonId, action: 'ask-advice' as const };
  const predicted = resolveCommand(initial, command), context = await setup(initial);
  try {
    const view = render(frame()), before = encodeWorld(world());
    context.sqlite.exec("CREATE TRIGGER fail_person_advice BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
    await press(new RegExp('^' + advice.label)); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
    expect(encodeWorld(world())).toBe(before); expect(encodeWorld(await context.repository.load(initial.id))).toBe(before);
    context.sqlite.exec('DROP TRIGGER fail_person_advice'); await press(new RegExp('^' + advice.label));
    expect(encodeWorld(world())).toBe(encodeWorld(predicted)); expect(screen.getByText(predicted.pending!.body)).toBeOnTheScreen();
    const saved = encodeWorld(world()); await act(async () => { await context.cold(); }); view.rerender(frame());
    expect(encodeWorld(world())).toBe(saved); expect(screen.getByText(predicted.pending!.body)).toBeOnTheScreen();
    await press('Continue'); expect(screen.getByRole('button', { name: new RegExp('^' + advice.label) })).toBeDisabled();
    view.unmount();
  } finally { context.sqlite.close(); }
});

function capture(name: string, tree: ReturnType<ReturnType<typeof render>['toJSON']>) {
  const directory = process.env.DREAMS_POLISH_CAPTURE_DIR;
  if (!directory) return;
  const clean = (node: any): any => Array.isArray(node) ? node.map(clean) : !node || typeof node !== 'object' ? node : ({
    type: node.type, props: { style: Native.StyleSheet.flatten(node.props?.style), source: node.props?.source,
      svg: node.type?.startsWith('RNSVG') ? Object.fromEntries(['d', 'name', 'clipPath', 'matrix', 'x', 'y', 'width', 'height', 'minX', 'minY', 'vbWidth', 'vbHeight', 'src', 'align'].filter(key => node.props?.[key] !== undefined).map(key => [key, node.props[key]])) : undefined,
      contentContainerStyle: Native.StyleSheet.flatten(node.props?.contentContainerStyle), edges: node.props?.edges,
      accessibilityRole: node.props?.accessibilityRole, accessibilityLabel: node.props?.accessibilityLabel,
      allowFontScaling: node.props?.allowFontScaling, resizeMode: node.props?.resizeMode, placeholder: node.props?.placeholder, value: node.props?.value }, children: node.children?.map(clean) });
  mkdirSync(directory, { recursive: true }); writeFileSync(join(directory, name + '.json'), JSON.stringify(clean(tree)));
}

test.each([false, true])('parent, partner and saved loan-offer profiles keep their data and export portable trees, dark=%s', async dark => {
  const width = dark ? 320 : 390, fontScale = dark ? 1.4 : 1;
  jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({ width, height: 844, scale: 2, fontScale });
  const parent = decodeWorld(JSON.stringify(graduate)), { predicted } = loanFixture();
  let partner = decodeWorld(JSON.stringify(marriage));
  while (partner.pending?.kind === 'result') partner = resolveCommand(partner, { type: 'acknowledge', resultId: partner.pending.id });
  const spouseId = otherPerson(partner, partnerRelation(partner)!).id;
  const loan = resolveCommand(predicted, { type: 'acknowledge', resultId: predicted.pending!.id });
  for (const state of [{ name: 'parent', world: parent, target: 'person_parent1' }, { name: 'partner', world: partner, target: spouseId }, { name: 'loan-offer', world: loan, target: 'person_parent1' }]) {
    mockPersonId = state.target; const context = await setup(state.world);
    try {
      const before = encodeWorld(world()), view = render(frame(width, dark));
      expect(screen.getByRole('header', { name: 'Person Profile' })).toBeOnTheScreen();
      expect(screen.getByRole('header', { name: 'Money & Gifts' })).toBeOnTheScreen();
      if (state.name === 'loan-offer') expect(screen.getByRole('button', { name: 'Accept Loan' })).toBeOnTheScreen();
      if (state.name === 'partner') expect(screen.getByRole('button', { name: /^Go on a Date/ })).toBeOnTheScreen();
      capture('person-' + state.name + '-' + (dark ? 'dark-large' : 'light'), view.toJSON());
      expect(encodeWorld(world())).toBe(before); expect(encodeWorld(await context.repository.load(world().id))).toBe(before);
      view.unmount();
    } finally { context.sqlite.close(); }
  }
});
