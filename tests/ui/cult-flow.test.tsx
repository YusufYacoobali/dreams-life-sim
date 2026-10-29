import { displayText } from '../../src/ui/displayNumbers';
import React from 'react';
import * as Native from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import writingFixture from '../fixtures/v48-cult-writing-before.json';
import voiceFixture from '../fixtures/v48-cult-voice-before.json';
import { arrangeCultWritingCase, refreshCultWritingOffer, type CultWritingCase } from '../support/cultWriting';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { fullName } from '../../src/game/personHelpers';
import { accountFor } from '../../src/game/systems/common';
import { activeCult } from '../../src/game/systems/cultSchemas';
import {
  cultCeremonyQuote,
  cultFeeOptions,
  cultMoney,
  cultRecruitQuote,
  cultRewardQuote,
  cultStartupQuote,
  cultUpgradeQuote,
} from '../../src/game/systems/cultCore';
import { cultHeadquarters, cultLeaderTitles, cultRoleTitles, cultUpgrades } from '../../src/game/content/cults';
import { CultArt, cultArtCatalog, cultHeadquartersArt, cultUpgradeArt } from '../../src/assets/CultArt';
import {
  cultReplacementCandidates,
  cultReplacementQuote,
  cultVacancyRoles,
} from '../../src/game/systems/cultRoster';
import { relationFor } from '../../src/game/systems/relationshipQueries';
import { rules } from '../../src/game/rules';
import {
  SaveRepository,
  type SqlDatabase,
  type SqlSession,
} from '../../src/persistence/repository';
import { ThemeProvider } from '../../src/ui/theme';
import { PendingEvent } from '../../src/ui/PendingEvent';
import { EventModal } from '../../src/ui/EventModal';
import {
  cultCommand,
  cultFixture,
  cultPeriod,
  foundCult,
} from '../support/cults';

let mockStore: ReturnType<typeof createGameStore>;
const mockPush = jest.fn(),
  mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    back: () => mockBack(),
    push: (...args: unknown[]) => mockPush(...args),
    replace: jest.fn(),
  },
}));
jest.mock('../../src/state/useGame', () => ({
  useGame: (selector: unknown) =>
    require('zustand').useStore(mockStore, selector),
}));
import CultCareer from '../../app/(game)/cult';
import CultHeadquarters from '../../app/(game)/cult/headquarters';

const world = () => mockStore.getState().world!;
const frame = (headquarters = false, dark = false) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: dark ? 320 : 390, height: 844 },
      insets: { top: 47, bottom: 34, left: 0, right: 0 },
    }}
  >
    <ThemeProvider appearance={dark ? 'dark' : 'light'}>
      {headquarters ? <CultHeadquarters /> : <CultCareer />}
      <PendingEvent />
    </ThemeProvider>
  </SafeAreaProvider>
);
const press = async (
  name: string | RegExp,
  role: 'button' | 'radio' = 'button',
) => {
  await act(async () => {
    fireEvent.press(screen.getByRole(role, { name }));
  });
};
const select = async (name: string | RegExp) => {
  await press(name, 'radio');
  await press('Choose');
};
const modal = () => within(screen.UNSAFE_getByType(Native.Modal));

async function setup(initial: World) {
  // Explicit funded adult scenario. These tests exercise the production store,
  // command engine and SQLite transactions; they do not claim a natural life.
  const directory = mkdtempSync(join(tmpdir(), 'dreams-cult-ui-')),
    path = join(directory, 'dreams.db');
  let sqlite!: DatabaseSync;
  const connect = (): SqlDatabase => {
    sqlite = new DatabaseSync(path);
    sqlite.exec('PRAGMA foreign_keys=ON');
    const connection = sqlite;
    const session: SqlSession = {
      run: async (sql, values = []) => {
        connection.prepare(sql).run(...values);
      },
      get: async <T,>(sql: string, values: (string | number | null)[] = []) =>
        (connection.prepare(sql).get(...values) as T) ?? null,
      all: async <T,>(sql: string, values: (string | number | null)[] = []) =>
        connection.prepare(sql).all(...values) as T[],
    };
    return {
      ...session,
      exec: async (sql) => {
        connection.exec(sql);
      },
      transaction: async (action) => {
        connection.exec('BEGIN IMMEDIATE');
        try {
          const result = await action(session);
          connection.exec('COMMIT');
          return result;
        } catch (error) {
          connection.exec('ROLLBACK');
          throw error;
        }
      },
    };
  };
  const repository = new SaveRepository(connect());
  await repository.initialise();
  await repository.create(initial);
  let nextYield: Promise<void> | undefined;
  const bootstrap = async (repo: SaveRepository) => {
    mockStore = createGameStore({
      repository: async () => repo,
      date: () => initial.date,
      id: () => 'life_unused',
      yieldToUI: async () => {
        const pause = nextYield;
        nextYield = undefined;
        if (pause) await pause;
      },
    });
    expect(await mockStore.getState().bootstrap()).toBe(true);
  };
  await bootstrap(repository);
  const rows = () =>
    Object.fromEntries(
      sqlite
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        )
        .all()
        .map((row) => [
          row.name,
          sqlite.prepare('SELECT * FROM ' + row.name + ' ORDER BY 1,2').all(),
        ]),
    );
  return {
    get sqlite() {
      return sqlite;
    },
    rows,
    pauseNextSave: () => {
      let release!: () => void;
      nextYield = new Promise<void>((resolve) => {
        release = resolve;
      });
      return release;
    },
    cold: async () => {
      sqlite.close();
      await bootstrap(new SaveRepository(connect()));
    },
    close: () => {
      sqlite.close();
      rmSync(directory, { recursive: true, force: true });
    },
  };
}

type Action =
  | 'found'
  | 'recruit'
  | 'ceremony'
  | 'reward'
  | 'claim'
  | 'contribute'
  | 'replacement'
  | 'upgrade';
async function review(
  action: Action,
): Promise<{ command: GameCommand; title: string }> {
  const current = world(),
    cult = activeCult(current)!;
  if (action === 'found') {
    fireEvent.changeText(screen.getByLabelText('Cult name'), 'The Other Door');
    await press('Review Founding');
    const fee = cultFeeOptions(
      current.people[current.activePersonId].country,
    )[2];
    return {
      title: 'Found The Other Door?',
      command: {
        type: 'found-cult',
        name: 'The Other Door',
        leaderTitle: cultLeaderTitles[0],
        philosophy: 'dream-archive',
        doctrines: ['borrowed-dreams', 'public-answers'],
        rules: ['family-day', 'open-books'],
        headquarters: 'meeting-room',
        method: 'gathering',
        joiningFee: fee.joining,
        recurringFee: fee.recurring,
        quotedCost: cultStartupQuote(current, 'meeting-room').total,
      },
    };
  }
  if (action === 'recruit') {
    await press(/^Recruit Followers\./);
    await select(/^Street Invitations/);
    return {
      title: 'Street Invitations?',
      command: {
        type: 'cult-recruit',
        cultId: cult.id,
        method: 'street',
        quotedCost: cultRecruitQuote(cult, 'street'),
      },
    };
  }
  if (action === 'ceremony') {
    await press(/^Hold Ceremony\./);
    await select(/^Dream Circle/);
    return {
      title: 'Dream Circle?',
      command: {
        type: 'cult-ceremony',
        cultId: cult.id,
        ceremony: 'dream-circle',
        quotedCost: cultCeremonyQuote(cult, 'dream-circle'),
      },
    };
  }
  if (action === 'reward') {
    const member = cult.members[0],
      name = fullName(current.people[member.personId]);
    await press(/^Manage Followers\./);
    await select(new RegExp('^' + name));
    await select(/^Reward/);
    return {
      title: 'Reward ' + name + '?',
      command: {
        type: 'cult-member',
        cultId: cult.id,
        personId: member.personId,
        action: 'reward',
        quotedCost: cultRewardQuote(cult),
      },
    };
  }
  if (action === 'claim') {
    await press(/^Make a Wild Claim\./);
    await select(/^A Green Moon/);
    await select(/^Leave room for doubt/);
    return {
      title: 'Make this promise?',
      command: {
        type: 'cult-claim',
        cultId: cult.id,
        claim: 'green-moon',
        approach: 'explain',
      },
    };
  }
  if (action === 'contribute') {
    await press(/^Treasury\./);
    await select('Contribute personal funds');
    await select(displayText(cultMoney(cult, rules[cult.country].baseWage / 100n)));
    return {
      title: 'Contribute these funds?',
      command: {
        type: 'cult-contribute',
        cultId: cult.id,
        amount: rules[cult.country].baseWage / 100n,
      },
    };
  }
  if (action === 'replacement') {
    const candidate =
        cultReplacementCandidates(current, cult).find((person) =>
          cult.members.some(
            (member) =>
              member.personId === person.id && member.status !== 'active',
          ),
        ) ?? cultReplacementCandidates(current, cult)[0],
      role = cultVacancyRoles(cult)[0];
    await press(/^Manage Followers\./);
    await select(/^Fill a vacancy/);
    await select(cultRoleTitles[role]);
    await select(new RegExp('^' + fullName(candidate)));
    return {
      title: 'Invite ' + fullName(candidate) + '?',
      command: {
        type: 'cult-fill-vacancy',
        cultId: cult.id,
        personId: candidate.id,
        role,
        quotedCost: cultReplacementQuote(cult),
      },
    };
  }
  await press(/^Meditation Garden\./);
  return {
    title: 'Add Meditation Garden?',
    command: {
      type: 'cult-upgrade',
      cultId: cult.id,
      upgrade: 'garden',
      quotedCost: cultUpgradeQuote(cult, 'garden'),
    },
  };
}

function repairedFormerMember() {
  let initial = foundCult(),
    member = initial.cults[0].members[0];
  initial = cultCommand(initial, {
    type: 'cult-member',
    cultId: initial.cults[0].id,
    personId: member.personId,
    action: 'expel',
  });
  // Explicit repaired-relationship scenario; the UI still makes the actual
  // invitation, retains the same NPC and commits its communal cost.
  relationFor(initial, initial.activePersonId, member.personId)!.strength = 75;
  return validateWorld(initial);
}

test.each([
  'found',
  'recruit',
  'ceremony',
  'reward',
  'claim',
  'contribute',
  'replacement',
  'upgrade',
] as Action[])(
  '%s review cancels without writes and retains failed save terms, then cold-resumes one result',
  async (action) => {
    const context = await setup(
      action === 'found'
        ? cultFixture()
        : action === 'replacement'
          ? repairedFormerMember()
          : foundCult(),
    );
    try {
      const initial = world(),
        before = encodeWorld(initial),
        beforeRows = context.rows();
      let view = render(frame(action === 'upgrade'));
      let terms = await review(action);
      expect(modal().getByText(terms.title)).toBeOnTheScreen();
      const cancelled =
        screen.UNSAFE_getAllByType(EventModal)[0].props.onChoose;
      await press('Never mind');
      await act(async () => {
        await cancelled('confirm');
      });
      expect(encodeWorld(world())).toBe(before);
      expect(context.rows()).toEqual(beforeRows);
      terms = await review(action);
      const expected = resolveCommand(initial, terms.command, true);
      expect(expected.pending).not.toBeNull();
      context.sqlite.exec(
        "CREATE TRIGGER fail_cult_review BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END",
      );
      await press('Confirm');
      await waitFor(() =>
        expect(modal().getByRole('alert')).toHaveTextContent(
          /couldn't be saved/,
        ),
      );
      expect(modal().getByText(terms.title)).toBeOnTheScreen();
      expect(screen.getAllByText(/couldn't be saved/)).toHaveLength(1);
      expect(encodeWorld(world())).toBe(before);
      expect(context.rows()).toEqual(beforeRows);
      context.sqlite.exec('DROP TRIGGER fail_cult_review');
      await press('Confirm');
      expect(world()).toEqual(expected);
      expect(screen.queryByText(terms.title)).toBeNull();
      const savedRows = context.rows();
      view.unmount();
      await context.cold();
      view = render(frame(action === 'upgrade'));
      expect(world()).toEqual(expected);
      expect(context.rows()).toEqual(savedRows);
      expect(screen.getByText(expected.pending!.title)).toBeOnTheScreen();
      await press('Continue');
      const done = resolveCommand(
        expected,
        { type: 'acknowledge', resultId: expected.pending!.id },
        true,
      );
      expect(world()).toEqual(done);
      expect(world().accounts).toEqual(expected.accounts);
      expect(world().ledger).toEqual(expected.ledger);
      expect(world().cults).toEqual(expected.cults);
      if (action === 'replacement') {
        expect(Object.keys(world().people)).toEqual(
          Object.keys(initial.people),
        );
        expect(world().cults[0].members).toHaveLength(
          initial.cults[0].members.length,
        );
        const restored = world().cults[0].members.find(
          (member) =>
            member.personId ===
            (
              terms.command as Extract<
                GameCommand,
                { type: 'cult-fill-vacancy' }
              >
            ).personId,
        )!;
        expect(restored.status).toBe('active');
        expect(
          restored.memories.some((memory) => memory.kind === 'expel'),
        ).toBe(true);
        expect(
          restored.memories.some((memory) => memory.kind === 'rejoined'),
        ).toBe(true);
      }
      const doneRows = context.rows();
      await act(async () => {
        expect(
          await mockStore
            .getState()
            .dispatch({ type: 'acknowledge', resultId: expected.pending!.id }),
        ).toBe(false);
      });
      expect(world()).toEqual(done);
      expect(context.rows()).toEqual(doneRows);
      view.unmount();
    } finally {
      context.close();
    }
  },
);

test.each(['found', 'replacement'] as const)(
  'a held %s ignores duplicate confirm, cancellation and Android Back until one durable transaction finishes',
  async (action) => {
    const context = await setup(
      action === 'found' ? cultFixture() : repairedFormerMember(),
    );
    try {
      const initial = world(),
        beforeRows = context.rows(),
        view = render(frame()),
        terms = await review(action),
        expected = resolveCommand(initial, terms.command, true),
        release = context.pauseNextSave();
      const retainedConfirm =
        screen.UNSAFE_getAllByType(EventModal)[0].props.onChoose;
      await press('Confirm');
      expect(mockStore.getState().busy).toBe(true);
      expect(modal().getByRole('button', { name: 'Confirm' })).toHaveProp(
        'accessibilityState',
        { disabled: true, busy: true },
      );
      if (action === 'found')
        expect(screen.getByLabelText('Cult name')).toBeDisabled();
      else
        expect(
          screen.getByRole('button', { name: /^Manage Followers\./ }),
        ).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
      await press('Confirm');
      await press('Never mind');
      await press('Back');
      await act(async () => {
        screen.UNSAFE_getByType(Native.Modal).props.onRequestClose();
        await retainedConfirm('confirm');
      });
      expect(modal().getByText(terms.title)).toBeOnTheScreen();
      expect(world()).toEqual(initial);
      expect(context.rows()).toEqual(beforeRows);
      expect(mockBack).not.toHaveBeenCalled();
      await act(async () => {
        release();
      });
      await waitFor(() => expect(mockStore.getState().busy).toBe(false));
      expect(world()).toEqual(expected);
      expect(world().cults).toHaveLength(1);
      await act(async () => {
        await retainedConfirm('confirm');
      });
      expect(world()).toEqual(expected);
      if (action === 'found')
        expect(
          world().ledger.filter((row) => row.category === 'cult-capital'),
        ).toHaveLength(1);
      else {
        expect(Object.keys(world().people)).toEqual(
          Object.keys(initial.people),
        );
        expect(world().cults[0].members).toHaveLength(
          initial.cults[0].members.length,
        );
      }
      view.unmount();
    } finally {
      context.close();
    }
  },
);

test.each(['recruit', 'replacement'] as const)(
  'a switched life invalidates retained %s confirmation and selection callbacks without altering either organisation',
  async (action) => {
    const context = await setup(foundCult());
    try {
      const view = render(frame());
      await review(action);
      const old = screen.UNSAFE_getAllByType(EventModal)[0].props.onChoose;
      const other = foundCult(cultFixture('GB'));
      await act(async () => {
        mockStore.setState({ world: other, error: null });
      });
      expect(screen.queryByText('Street Invitations?')).toBeNull();
      const before = encodeWorld(world()),
        rows = context.rows();
      await act(async () => {
        await old('confirm');
      });
      expect(encodeWorld(world())).toBe(before);
      expect(context.rows()).toEqual(rows);
      await press(/^Manage Followers\./);
      const selection =
        screen.UNSAFE_getAllByType(EventModal)[0].props.onChoose;
      await act(async () => {
        mockStore.setState({ world: foundCult(), error: null });
      });
      await act(async () => {
        await selection(other.cults[0].members[0].personId);
      });
      expect(screen.queryByText('Assign responsibility')).toBeNull();
      expect(context.rows()).toEqual(rows);
      view.unmount();
    } finally {
      context.close();
    }
  },
);

function capture(name: string, tree: unknown) {
  const directory = process.env.DREAMS_CULT_REVIEW_TREES;
  if (!directory) return;
  const clean = (node: any): any =>
    Array.isArray(node)
      ? node.map(clean)
      : !node || typeof node !== 'object'
        ? node
        : {
            type: node.type,
            props: {
              style: Native.StyleSheet.flatten(node.props?.style),
              source: node.props?.source,
              svg: node.type?.startsWith('RNSVG')
                ? Object.fromEntries(
                    [
                      'd',
                      'name',
                      'clipPath',
                      'matrix',
                      'x',
                      'y',
                      'width',
                      'height',
                      'minX',
                      'minY',
                      'vbWidth',
                      'vbHeight',
                      'src',
                      'align',
                    ]
                      .filter((key) => node.props?.[key] !== undefined)
                      .map((key) => [key, node.props[key]]),
                  )
                : undefined,
              contentContainerStyle: Native.StyleSheet.flatten(
                node.props?.contentContainerStyle,
              ),
              edges: node.props?.edges,
              accessibilityRole: node.props?.accessibilityRole,
              accessibilityLabel: node.props?.accessibilityLabel,
              allowFontScaling: node.props?.allowFontScaling,
              resizeMode: node.props?.resizeMode,
              placeholder: node.props?.placeholder,
              value: node.props?.value,
            },
            children: node.children?.map(clean),
          };
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, name + '.json'), JSON.stringify(clean(tree)));
}

test('current deputy and responsibility remain disabled, while former members stay accessible through history', async () => {
  const initial = repairedFormerMember(),
    context = await setup(initial);
  try {
    const view = render(frame()),
      before = encodeWorld(world()),
      rows = context.rows(),
      dispatch = jest.spyOn(mockStore.getState(), 'dispatch'),
      cult = initial.cults[0],
      member = cult.members.find((row) => row.status === 'active')!;
    // The first remaining role is assigned as the actual deputy through the
    // engine, then the persisted current responsibility is reviewed read-only.
    await act(async () => {
      expect(
        await mockStore
          .getState()
          .dispatch({
            type: 'cult-member',
            cultId: cult.id,
            personId: member.personId,
            action: 'promote',
          }),
      ).toBe(true);
    });
    await press('Continue');
    dispatch.mockClear();
    const current = encodeWorld(world()),
      currentRows = context.rows();
    await press(/^Manage Followers\./);
    await select(new RegExp('^' + fullName(world().people[member.personId])));
    expect(
      screen.getByRole('radio', {
        name: /^Promote to second-in-command.*already holds/,
      }),
    ).toBeDisabled();
    await press(/^Promote to second-in-command/, 'radio');
    expect(screen.getByRole('button', { name: 'Choose' })).toBeDisabled();
    await select('Assign responsibility');
    expect(
      screen.getByRole('radio', { name: /^Second-in-command.*already holds/ }),
    ).toBeDisabled();
    await press(/^Second-in-command/, 'radio');
    expect(screen.getByRole('button', { name: 'Choose' })).toBeDisabled();
    await press('Never mind');
    await press(/^Manage Followers\./);
    const former = cult.members.find((row) => row.status !== 'active')!,
      formerName = fullName(initial.people[former.personId]);
    expect(
      screen.queryByRole('radio', { name: new RegExp('^' + formerName) }),
    ).toBeNull();
    await select(/^Former members/);
    await select(new RegExp('^' + formerName));
    expect(
      modal().getByText(new RegExp('expelled.*Loyalty')),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('radio', {
        name: /^Promote to second-in-command.*left the organisation/,
      }),
    ).toBeDisabled();
    await press('Never mind');
    expect(dispatch).not.toHaveBeenCalled();
    expect(encodeWorld(world())).toBe(current);
    expect(context.rows()).toEqual(currentRows);
    expect(current).not.toBe(before);
    expect(currentRows).not.toEqual(rows);
    view.unmount();
  } finally {
    jest.restoreAllMocks();
    context.close();
  }
});

test.each([
  ['recruit', 'publicity', false], ['recruit', 'publicity', true],
  ['preach', 'final-update', false], ['preach', 'final-update', true],
  ['ceremony', 'dream-circle', false], ['ceremony', 'dream-circle', true],
] as const)('routine %s / %s keeps its named payoff and figures through cold save (dark=%s)', async (kind, key, dark) => {
  const base = JSON.parse(inflateSync(Buffer.from(writingFixture.data, 'base64')).toString()) as { baseWorld: unknown };
  const voice = JSON.parse(inflateSync(Buffer.from(voiceFixture.data, 'base64')).toString()) as { ordinaryCases: Exclude<CultWritingCase, { kind: 'member' }>[] };
  const item = voice.ordinaryCases.find(row => row.kind === kind && (row.kind === 'recruit' ? row.method : row.kind === 'preach' ? row.philosophy : row.ceremony) === key)!;
  const initial = decodeWorld(JSON.stringify(base.baseWorld)), command = arrangeCultWritingCase(initial, item);
  const role = kind === 'ceremony' ? 'organiser' : kind === 'recruit' ? 'recruiter' : 'adviser';
  const speaker = initial.cults[0].members.find(member => member.role === role) ?? initial.cults[0].members[0];
  speaker.personality = kind === 'preach' ? 'opportunist' : 'showy';
  const context = await setup(initial);
  try {
    jest.spyOn(Native, 'useWindowDimensions').mockReturnValue({ width: dark ? 320 : 390, height: 844, scale: 2, fontScale: dark ? 1.4 : 1 });
    let view = render(frame(false, dark));
    await act(async () => { expect(await mockStore.getState().dispatch(command)).toBe(true); });
    expect(world()).toEqual(resolveCommand(initial, command, true));
    const body = world().pending!.body;
    expect(screen.getByText(displayText(body))).toBeOnTheScreen();
    capture('cult-voice-' + kind + '-result-' + (dark ? 'dark-large' : 'light'), view.toJSON());
    const saved = encodeWorld(world()), rows = context.rows(); view.unmount();
    await context.cold(); view = render(frame(false, dark));
    expect(encodeWorld(world())).toBe(saved); expect(context.rows()).toEqual(rows);
    expect(screen.getByText(displayText(body))).toBeOnTheScreen();
    await press('Continue'); expect(world().pending).toBeNull(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});

test.each([false, true])(
  'founding, dashboard and management use the current Dreams components and remain read-only (dark=%s)',
  async (dark) => {
    const context = await setup(cultFixture());
    try {
      jest.spyOn(Native, 'useWindowDimensions').mockReturnValue({
        width: dark ? 320 : 390,
        height: 844,
        scale: 2,
        fontScale: dark ? 1.4 : 1,
      });
      const suffix = dark ? 'dark-large' : 'light';
      let view = render(frame(false, dark));
      const before = encodeWorld(world()),
        rows = context.rows();
      capture('cult-founding-' + suffix, view.toJSON());
      await review('found');
      capture('cult-founding-review-' + suffix, view.toJSON());
      await press('Never mind');
      expect(encodeWorld(world())).toBe(before);
      expect(context.rows()).toEqual(rows);
      const initial = foundCult();
      await act(async () => {
        mockStore.setState({ world: initial, error: null });
      });
      capture('cult-dashboard-' + suffix, view.toJSON());
      expect(
        screen.getByLabelText(
          'Followers: ' + initial.cults[0].followers.toLocaleString('en-US'),
        ),
      ).toBeOnTheScreen();
      expect(
        screen.getByLabelText(
          'Treasury: ' + displayText(cultMoney(initial.cults[0], initial.cults[0].cash)),
        ),
      ).toBeOnTheScreen();
      expect(screen.getByRole('progressbar', { name: 'Loyalty' })).toHaveProp(
        'accessibilityValue',
        { min: 0, max: 100, now: initial.cults[0].loyalty },
      );
      expect(
        screen.getByRole('progressbar', { name: 'Public Heat' }),
      ).toHaveProp('accessibilityValue', {
        min: 0,
        max: 100,
        now: initial.cults[0].heat,
      });
      expect(
        screen.getByText(/Capacity .*Satisfaction .*Reputation/),
      ).toBeOnTheScreen();
      await press(/^Manage Beliefs\./);
      await press('Borrowed Dreams');
      expect(
        screen.getByRole('radio', { name: /^Borrowed Dreams/ }),
      ).toBeChecked();
      await act(async () => {
        fireEvent.changeText(screen.getByLabelText('Search doctrines'), 'moon');
      });
      expect(screen.getAllByRole('radio')).toHaveLength(2);
      capture('cult-belief-search-' + suffix, view.toJSON());
      await press(/^Lunar Intelligence/, 'radio');
      await act(async () => {
        fireEvent.changeText(
          screen.getByLabelText('Search doctrines'),
          'no such doctrine',
        );
      });
      expect(screen.getAllByRole('radio')).toHaveLength(1);
      expect(
        screen.getByRole('radio', { name: /^Lunar Intelligence/ }),
      ).toBeChecked();
      expect(
        screen.getByText(
          /No matching options. Your selected option is kept below/,
        ),
      ).toBeOnTheScreen();
      await press('Clear Search');
      expect(
        screen.getByRole('radio', { name: /^Lunar Intelligence/ }),
      ).toBeChecked();
      await press('Never mind');
      expect(
        screen.getByRole('button', { name: 'Borrowed Dreams' }),
      ).toBeOnTheScreen();
      await press('Close Belief Editor');
      await press(/^Manage Followers\./);
      await select(/^Fill a vacancy/);
      capture('cult-vacancy-' + suffix, view.toJSON());
      await select(cultRoleTitles[cultVacancyRoles(initial.cults[0])[0]]);
      const candidate = cultReplacementCandidates(initial, initial.cults[0])[0];
      await select(new RegExp('^' + fullName(candidate)));
      capture('cult-replacement-review-' + suffix, view.toJSON());
      await press('Never mind');
      await press(/^Recruit Followers\./);
      capture('cult-recruitment-' + suffix, view.toJSON());
      await press('Never mind');
      await press(/^Treasury\./);
      capture('cult-treasury-' + suffix, view.toJSON());
      await select('Financial records');
      capture('cult-treasury-records-' + suffix, view.toJSON());
      await press('Close');
      await press(/^Manage Followers\./);
      await select(
        new RegExp(
          '^' + fullName(world().people[initial.cults[0].members[0].personId]),
        ),
      );
      capture('cult-member-' + suffix, view.toJSON());
      await press('Never mind');
      await press(/^Manage Headquarters\./);
      expect(mockPush).toHaveBeenCalledWith('/cult/headquarters');
      view.unmount();
      view = render(frame(true, dark));
      capture('cult-headquarters-' + suffix, view.toJSON());
      expect(world()).toEqual(initial);
      expect(context.rows()).toEqual(rows);
      expect(accountFor(world()).cash).toBe(accountFor(initial).cash);
      view.unmount();
    } finally {
      jest.restoreAllMocks();
      context.close();
    }
  },
);

test('stored annual reports show recorded loyalty and reputation changes with leadership events without writing', async () => {
  let initial = foundCult();
  initial = cultCommand(initial, {
    type: 'cult-preach',
    cultId: initial.cults[0].id,
  });
  for (let month = 0; month < 12; month++) initial = cultPeriod(initial);
  const cult = initial.cults[0],
    report = cult.years[0];
  expect(report.year).toBe(2026);
  expect(report.loyalty).not.toBe(report.loyaltyStart);
  expect(report.events.length).toBeGreaterThan(0);
  const context = await setup(initial);
  try {
    await context.cold();
    const before = encodeWorld(world()),
      rows = context.rows(),
      view = render(frame());
    await press(/^Treasury\./);
    await select('Annual reports');
    expect(
      modal().getByText(
        new RegExp(
          'Loyalty ' +
            report.loyaltyStart +
            '% → ' +
            report.loyalty +
            '%\\. Reputation ' +
            report.reputationStart +
            '% → ' +
            report.reputation +
            '%\\.',
        ),
      ),
    ).toBeOnTheScreen();
    const body = screen.UNSAFE_getAllByType(EventModal)[0].props.event.body;
    expect(body).toContain(cultMoney(cult, report.revenue));
    expect(body).toContain(cultMoney(cult, report.expenses));
    expect(body).toContain(cultMoney(cult, report.treasury));
    for (const event of report.events.slice(-2)) expect(body).toContain(event);
    await press('Close');
    expect(encodeWorld(world())).toBe(before);
    expect(context.rows()).toEqual(rows);
    view.unmount();
  } finally {
    context.close();
  }
});

test('headquarters choices, navigation and upgrade reviews use their own feature art without changing the save', async () => {
  const context = await setup(cultFixture());
  try {
    let view = render(frame());
    const beforeFounding = encodeWorld(world()), rows = context.rows();
    await press(/^Starting Headquarters\./);
    for (const row of cultHeadquarters) {
      const option = screen.getByRole('radio', { name: new RegExp('^' + row.title) });
      expect(within(option).UNSAFE_getByType(CultArt).props.id).toBe(cultHeadquartersArt[row.id]);
    }
    await select(/^Woodland Retreat/);
    expect(within(screen.getByRole('button', { name: /^Starting Headquarters\./ })).UNSAFE_getByType(CultArt).props.id).toBe('cabin');
    expect(encodeWorld(world())).toBe(beforeFounding);
    expect(context.rows()).toEqual(rows);

    let funded = foundCult();
    funded = cultCommand(funded, { type: 'cult-contribute', cultId: funded.cults[0].id, amount: 5000000000n });
    await act(async () => { mockStore.setState({ world: funded, error: null }); });
    const beforeManagement = encodeWorld(world());
    await press(/^Manage Headquarters\./);
    expect(mockPush).toHaveBeenCalledWith('/cult/headquarters');
    view.unmount();
    view = render(frame(true));
    for (const row of cultHeadquarters) {
      const button = screen.getByRole('button', { name: new RegExp('^' + row.title + '\\.') }),
        expected = cultHeadquartersArt[row.id];
      expect(within(button).UNSAFE_getByType(CultArt).props.id).toBe(expected);
      if (row.id === 'meeting-room') continue;
      await press(new RegExp('^' + row.title + '\\.'));
      expect(modal().getByText('Move to ' + row.title + '?')).toBeOnTheScreen();
      expect(String(modal().UNSAFE_getByType(Native.Image).props.source.testUri)).toContain('/' + cultArtCatalog[expected].file);
      await press('Never mind');
    }
    for (const row of cultUpgrades) {
      const button = screen.getByRole('button', { name: new RegExp('^' + row.title + '\\.') }),
        expected = cultUpgradeArt[row.id];
      expect(within(button).UNSAFE_getByType(CultArt).props.id).toBe(expected);
      await press(new RegExp('^' + row.title + '\\.'));
      expect(modal().getByText('Add ' + row.title + '?')).toBeOnTheScreen();
      expect(String(modal().UNSAFE_getByType(Native.Image).props.source.testUri)).toContain('/' + cultArtCatalog[expected].file);
      await press('Never mind');
    }
    expect(encodeWorld(world())).toBe(beforeManagement);
    expect(context.rows()).toEqual(rows);
    view.unmount();
  } finally { context.close(); }
});

test.each([
  ['second-microphone', 'expel', false], ['second-microphone', 'expel', true],
  ['activity-street-question', 'answer', false], ['activity-street-question', 'answer', true],
  ['green-moon', 'admit', false], ['green-moon', 'admit', true],
] as const)('%s / %s reads in the real popup and cold-resumes its exact payoff (dark=%s)', async (id, choiceId, dark) => {
  const data = JSON.parse(inflateSync(Buffer.from(writingFixture.data, 'base64')).toString()) as { contexts: { id: string; world: unknown }[] };
  const initial = refreshCultWritingOffer(decodeWorld(JSON.stringify(data.contexts.find(row => row.id === id)!.world)), id);
  const context = await setup(initial);
  try {
    jest.spyOn(Native, 'useWindowDimensions').mockReturnValue({ width: dark ? 320 : 390, height: 844, scale: 2, fontScale: dark ? 1.4 : 1 });
    const event = initial.pending;
    if (event?.kind !== 'decision') throw Error('Expected new cult writing');
    const choice = event.choices.find(row => row.id === choiceId)!;
    const suffix = dark ? 'dark-large' : 'light';
    let view = render(frame(false, dark));
    expect(screen.getByText(displayText(event.body))).toBeOnTheScreen();
    capture('cult-writing-' + id + '-decision-' + suffix, view.toJSON());
    await press(displayText(choice.label));
    expect(world()).toEqual(resolveCommand(initial, { type: 'choose', eventId: event.id, choiceId }, true));
    expect(screen.getByText(displayText(choice.resultBody))).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeOnTheScreen();
    capture('cult-writing-' + id + '-result-' + suffix, view.toJSON());
    const saved = encodeWorld(world()), rows = context.rows(); view.unmount();
    await context.cold(); view = render(frame(false, dark));
    expect(encodeWorld(world())).toBe(saved); expect(context.rows()).toEqual(rows);
    expect(screen.getByText(displayText(choice.resultBody))).toBeOnTheScreen();
    await press('Continue'); expect(world().pending).toBeNull(); view.unmount();
  } finally { jest.restoreAllMocks(); context.close(); }
});
