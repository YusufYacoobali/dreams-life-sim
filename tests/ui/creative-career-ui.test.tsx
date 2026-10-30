import React from 'react';
import { Modal } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { copyWorld, decodeWorld, encodeWorld } from '../../src/game/model';
import { endEmployment } from '../../src/game/systems/work';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { EventModal } from '../../src/ui/EventModal';
import { ThemeProvider } from '../../src/ui/theme';
import { CreativeHistory, creativeSettlementPayments } from '../../src/ui/CreativeCareerUI';
import { creativeMonthLabel, creativeMonthNumber } from '../../src/game/systems/creativeSchemas';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import historicalCreative from '../fixtures/v50-creative-polish-compat.json';
import { creativeBook, creativeCareer, creativeFinish, experiencedCreative } from '../support/creativeCareer';
import { useCreativeCareerDialog } from '../../src/ui/CreativeCareerDialog';
import { Button, Page } from '../../src/ui/components';
import { ActorDashboard } from '../../src/ui/ActorDashboard';
import { ModelCareerDashboard } from '../../src/ui/ModelCareerDashboard';
import { actorOfferReason } from '../../src/game/systems/actor';
import { modelOfferReason, modelBrandTerm } from '../../src/game/systems/modelCareer';
import { formatMoney, roundRatio } from '../../src/game/money';
import { countries } from '../../src/game/countries';
import { offerGross } from '../../src/ui/CreativeCareerUI';
import { noOwnership } from '../../src/purchases/catalog';
import { purchases } from '../../src/purchases/native';
import graduate from '../fixtures/v3-employed-graduate.json';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));
const frame = (child: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, bottom: 0, left: 0, right: 0 } }}><ThemeProvider>{child}</ThemeProvider></SafeAreaProvider>;
const press = async (name: string | RegExp, role: 'button' | 'radio' = 'button') => { await act(async () => { fireEvent.press(screen.getByRole(role, { name })); }); };
async function setup() {
  purchases.setState({ ownership: noOwnership() });
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise();
  const world = decodeWorld(JSON.stringify(graduate)); endEmployment(world);
  const person = world.people[world.activePersonId]; person.skills.acting = person.skills.modeling = 90; person.stats.health = person.stats.fitness = person.stats.looks = person.stats.smarts = 90;
  const account = world.accounts.find(item => item.ownerId === person.id && item.currency === person.finance.earningsCurrency)!; account.cash += 100000000n; account.openingCash += 100000000n;
  await repository.create(world);
  mockStore = createGameStore({ repository: async () => repository, date: () => world.date, id: () => 'life_creative_ui', premiumAccess: () => false });
  await mockStore.getState().bootstrap();
  return { sqlite, repository, world };
}
async function acknowledge() {
  await act(async () => {
    const pending = mockStore.getState().world!.pending;
    if (pending?.kind === 'result') expect(await mockStore.getState().dispatch({ type: 'acknowledge', resultId: pending.id })).toBe(true);
  });
}
test('a Model can draft three specialisations, review them once and retry one atomic twelve-month commitment', async () => {
  const { sqlite, repository } = await setup(); await mockStore.getState().dispatch({ type: 'model-enter' }); await acknowledge();
  const view = render(frame(<ModelCareerDashboard />)), original = encodeWorld(mockStore.getState().world!);
  await press('Choose Specialisations');
  await press(/^Editorial & Magazine/, 'radio'); await press('Choose');
  await press(/^Runway & High Fashion/, 'radio'); await press('Choose');
  expect(encodeWorld(mockStore.getState().world!)).toBe(original);
  await press('Review Specialisations', 'radio'); await press('Choose');
  sqlite.exec("CREATE TRIGGER fail_specialisations BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press('Set Specialisations'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
  expect(encodeWorld((await repository.active())!)).toBe(original);
  sqlite.exec('DROP TRIGGER fail_specialisations'); await press('Set Specialisations');
  const world = mockStore.getState().world!, state = world.careers[0].modelCareer!;
  expect(state.specialisations).toEqual(['commercial', 'editorial', 'runway']); expect(state.lastSpecialisationMonth).toBe(creativeMonthNumber(world));
  expect(screen.getByRole('button', { name: 'Choose Specialisations' })).toBeDisabled();
  expect(screen.getByText('Next specialisation change: ' + creativeMonthLabel(state.lastSpecialisationMonth! + 12) + '.')).toBeOnTheScreen();
  expect((await repository.load(world.id)).careers[0].modelCareer).toEqual(state);
  view.unmount(); sqlite.close();
});

test('Actor identity shows the next change date and disables another approach after committing', async () => {
  const { sqlite, repository } = await setup(); await mockStore.getState().dispatch({ type: 'actor-enter' }); await acknowledge();
  const view = render(frame(<ActorDashboard />));
  await press(/^Character & Craft\./, 'radio'); await press('Set Acting Approach');
  const world = mockStore.getState().world!, state = world.careers[0].actor!;
  expect(screen.getByRole('radio', { name: /^Audience Favourite\./ })).toBeDisabled();
  expect(screen.getByText('Next style change: ' + creativeMonthLabel(state.lastStyleMonth! + 12) + '.')).toBeOnTheScreen();
  expect((await repository.load(world.id)).careers[0].actor!.lastStyleMonth).toBe(state.lastStyleMonth);
  view.unmount(); sqlite.close();
});

test.each(['cancelledActor', 'cancelledModel'] as const)('%s history labels old interrupted work accurately without rewriting its saved outcome or inventing reviews', key => {
  const world = unpackCheckpoint(historicalCreative[key]), project = world.careers[0].projects[0], saved = encodeWorld(world);
  const view = render(frame(<CreativeHistory career={world.careers[0]} title="Work History" />));
  expect(screen.getByText(key === 'cancelledModel' ? /Unfinished booking/ : /Unfinished production/)).toBeOnTheScreen();
  expect(screen.getByText('Earlier saved outcome')).toBeOnTheScreen(); expect(screen.getByText(project.creative!.release!.summary)).toBeOnTheScreen();
  expect(screen.queryByText(/Critical reception|Industry reception|Audience reception/)).toBeNull();
  expect(encodeWorld(world)).toBe(saved); view.unmount();
});

test.each(['model', 'actor'] as const)('%s history uses industry-appropriate success wording without rewriting the saved classification', kind => {
  let world = creativeBook(experiencedCreative(kind), kind, kind === 'model' ? 'runway' : 'studio-film');
  const metadata = creativeCareer(world, kind).projects.at(-1)!.creative!;
  metadata.publicity = 50; metadata.audienceRoll = 1; // A strong saved reception fixture for the display boundary.
  world = creativeFinish(world, kind);
  const project = creativeCareer(world, kind).projects.at(-1)!, saved = encodeWorld(world);
  expect(project.creative!.release!.commercial).toBe('blockbuster');
  const view = render(frame(<CreativeHistory career={creativeCareer(world, kind)} title="Work History" />));
  expect(screen.getByText(kind === 'model' ? /Major success/ : /Blockbuster/)).toBeOnTheScreen();
  if (kind === 'model') expect(screen.queryByText(/blockbuster/i)).toBeNull();
  expect(encodeWorld(world)).toBe(saved); view.unmount();
});
test.each(['actor', 'model'] as const)('%s career entry is free, confirms before writing and retries a failed save without multiplying contacts', async kind => {
  const { sqlite, repository, world } = await setup(), before = await repository.export(world.id), originalPeople = Object.keys(world.people).length;
  const view = render(frame(kind === 'actor' ? <ActorDashboard /> : <ModelCareerDashboard />));
  expect(screen.queryByRole('button', { name: /Buy|Restore Purchases/ })).toBeNull();
  await press(kind === 'actor' ? 'Explore Acting Opportunities' : 'Explore Modelling Opportunities'); expect(await repository.export(world.id)).toBe(before);
  const confirm = kind === 'actor' ? 'Explore Acting' : 'Explore Modelling';
  sqlite.exec("CREATE TRIGGER fail_creative_ui BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press(confirm); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
  expect(await repository.export(world.id)).toBe(before); expect(Object.keys(mockStore.getState().world!.people)).toHaveLength(originalPeople);
  sqlite.exec('DROP TRIGGER fail_creative_ui'); await press(confirm);
  await waitFor(() => expect(screen.getByRole('header', { name: 'Agency & Representation' })).toBeTruthy());
  const saved = mockStore.getState().world!, career = saved.careers.find(item => item.kind === kind)!;
  const industry = kind === 'actor' ? career.actor!.industry : career.modelCareer!.industry;
  expect(industry.board.length).toBeGreaterThan(3); expect(Object.keys(industry.contacts)).toHaveLength(4);
  expect(Object.keys(saved.people).length).toBeLessThanOrEqual(originalPeople + 4); expect(purchases.getState().ownership).toEqual(noOwnership());
  expect(await repository.load(world.id)).toEqual(saved); view.unmount(); sqlite.close();
});
test('the model portfolio shoot keeps its reviewed cost through nested popups and a transactional retry', async () => {
  const { sqlite, repository } = await setup(); await mockStore.getState().dispatch({ type: 'model-enter' }); await acknowledge();
  const view = render(frame(<ModelCareerDashboard />));
  await press('Develop Portfolio'); await press(/^Editorial & Magazine/, 'radio'); await press('Choose');
  await press(/^Professional shoot/, 'radio'); await press('Choose');
  const before = encodeWorld(mockStore.getState().world!), initialPortfolio = mockStore.getState().world!.careers.find(item => item.kind === 'model')!.modelCareer!.portfolio.editorial;
  sqlite.exec("CREATE TRIGGER fail_portfolio_ui BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
  await press('Arrange Portfolio Shoot'); await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
  expect(encodeWorld((await repository.active())!)).toBe(before);
  sqlite.exec('DROP TRIGGER fail_portfolio_ui'); await press('Arrange Portfolio Shoot');
  expect(mockStore.getState().world!.careers.find(item => item.kind === 'model')!.modelCareer!.portfolio.editorial).toBeGreaterThan(initialPortfolio);
  expect(mockStore.getState().world!.ledger.filter(item => item.category === 'career-portfolio')).toHaveLength(1);
  view.unmount(); sqlite.close();
});
function ReviewHarness() {
  const dialog = useCreativeCareerDialog('actor');
  return <Page><Button label="Review Industry Entry" onPress={() => dialog.confirm({ type: 'actor-enter' }, 'Enter the industry?', 'Choose your opportunities next.', [], 'Confirm Industry Entry')} />{dialog.modal}</Page>;
}
test.each(['life', 'revision'] as const)('a retained review cannot write after its %s changes', async change => {
  const { sqlite } = await setup(); const view = render(frame(<ReviewHarness />)); await press('Review Industry Entry');
  const retainedConfirm = screen.UNSAFE_getByType(EventModal).props.onChoose as (id: string) => Promise<void>;
  const original = mockStore.getState().world!, replacement = change === 'life' ? { ...original, id: original.id + '_other' } : { ...original, revision: original.revision + 1 };
  await act(async () => { mockStore.setState({ world: replacement }); });
  expect(screen.queryByRole('button', { name: 'Confirm Industry Entry' })).toBeNull();
  await act(async () => { await retainedConfirm('confirm'); });
  expect(mockStore.getState().world!.careers).toHaveLength(0); view.unmount(); sqlite.close();
});

test('a held industry-entry save ignores duplicate confirmation and cancel callbacks', async () => {
  const { sqlite, repository } = await setup(); let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; }), original = repository.commit.bind(repository);
  const commit = jest.spyOn(repository, 'commit').mockImplementationOnce(async (...args: Parameters<SaveRepository['commit']>) => { await gate; return original(...args); });
  const view = render(frame(<ReviewHarness />)); await press('Review Industry Entry');
  const modal = screen.UNSAFE_getByType(EventModal), confirm = modal.props.onChoose as (id: string) => Promise<void>, cancel = modal.props.onCancel as () => void;
  let first!: Promise<void>;
  await act(async () => { first = confirm('confirm'); });
  expect(mockStore.getState().busy).toBe(true); expect(commit).toHaveBeenCalledTimes(1);
  await act(async () => { await confirm('confirm'); cancel(); });
  expect(commit).toHaveBeenCalledTimes(1); expect(screen.getByRole('header', { name: 'Enter the industry?' })).toBeTruthy();
  await act(async () => { release(); await first; });
  expect(commit).toHaveBeenCalledTimes(1); expect(screen.queryByRole('header', { name: 'Enter the industry?' })).toBeNull();
  expect(mockStore.getState().world!.careers.find(item => item.kind === 'actor')!.actor).toBeDefined();
  view.unmount(); commit.mockRestore(); sqlite.close();
});

test.each(['actor', 'model'] as const)('%s reviews the selected saved opportunity and records one casting without upfront pay', async kind => {
  const { sqlite, repository } = await setup();
  expect(await mockStore.getState().dispatch(kind === 'actor' ? { type: 'actor-enter' } : { type: 'model-enter' })).toBe(true); await acknowledge();
  const initial = mockStore.getState().world!, career = initial.careers.find(item => item.kind === kind)!, industry = kind === 'actor' ? career.actor!.industry : career.modelCareer!.industry;
  const offer = industry.board.find(item => !(kind === 'actor' ? actorOfferReason(initial, item) : modelOfferReason(initial, item)))!;
  expect(offer).toBeDefined();
  const originalRevision = initial.revision, accounts = initial.accounts.map(account => ({ id: account.id, cash: account.cash }));
  const view = render(frame(kind === 'actor' ? <ActorDashboard /> : <ModelCareerDashboard />));
  await press((kind === 'actor' ? 'Review Audition for ' : 'Review Casting for ') + offer.title);
  expect(screen.getByRole('header', { name: kind === 'actor' ? 'Audition for ' + offer.title + '?' : 'Attend the casting for ' + offer.title + '?' })).toBeTruthy();
  expect(mockStore.getState().world!.revision).toBe(originalRevision);
  await press(kind === 'actor' ? 'Attend Audition' : 'Attend Casting');
  const saved = mockStore.getState().world!, savedCareer = saved.careers.find(item => item.kind === kind)!, savedIndustry = kind === 'actor' ? savedCareer.actor!.industry : savedCareer.modelCareer!.industry;
  expect(savedIndustry.board.find(item => item.id === offer.id)!.status).not.toBe('open');
  expect(savedIndustry.board.find(item => item.id === offer.id)!.auditionRoll).toBe(offer.auditionRoll);
  expect(saved.accounts.map(account => ({ id: account.id, cash: account.cash }))).toEqual(accounts);
  expect(await repository.load(saved.id)).toEqual(saved); expect(purchases.getState().ownership).toEqual(noOwnership());
  view.unmount(); sqlite.close();
});

test('agency terms display fractional commission exactly instead of rounding the contract rate', async () => {
  const { sqlite } = await setup(); await mockStore.getState().dispatch({ type: 'model-enter' }); await acknowledge();
  await mockStore.getState().dispatch({ type: 'model-agency', tier: 'boutique', negotiate: false }); await acknowledge();
  // This is a valid representation amendment such as the authored -150bps incident.
  const amended = copyWorld(mockStore.getState().world!);
  amended.careers.find(item => item.kind === 'model')!.modelCareer!.industry.representation.commissionBps = 1050;
  amended.careers.find(item => item.kind === 'model')!.modelCareer!.industry.representation.history.at(-1)!.commissionBps = 1050;
  mockStore.setState({ world: amended });
  const view = render(frame(<ModelCareerDashboard />));
  expect(screen.getByLabelText('Commission on future contracts: 10.5%')).toHaveTextContent('10.5%');
  await press(/^Agency History/); expect(screen.getByText(/1,050 basis points/)).toBeTruthy();
  view.unmount(); sqlite.close();
});

test('new representation shows the standard and possible negotiated commission before signing', async () => {
  const { sqlite, repository } = await setup(); await mockStore.getState().dispatch({ type: 'model-enter' }); await acknowledge();
  const before = await repository.export(mockStore.getState().world!.id), view = render(frame(<ModelCareerDashboard />));
  await press('Review Representation'); await press(/^Boutique Fashion Agency · Negotiate from 12% towards 10%/, 'radio'); await press('Choose');
  expect(screen.getByRole('header', { name: 'Negotiate your representation?' })).toBeTruthy();
  const terms = within(screen.UNSAFE_getByType(Modal));
  expect(terms.getByText('Rate if the request is declined')).toBeTruthy(); expect(terms.getByText('12%')).toBeTruthy();
  expect(terms.getByText('Rate if better terms are accepted')).toBeTruthy(); expect(terms.getByText('10%')).toBeTruthy();
  expect(await repository.export(mockStore.getState().world!.id)).toBe(before);
  view.unmount(); sqlite.close();
});
test('exclusive casting and leaving an unfinished booking disclose the actual settlement before writing', async () => {
  const { sqlite, repository } = await setup(); await mockStore.getState().dispatch({ type: 'model-enter' }); await acknowledge();
  await mockStore.getState().dispatch({ type: 'model-agency', tier: 'boutique', negotiate: false }); await acknowledge();
  const prepared = copyWorld(mockStore.getState().world!), career = prepared.careers.find(item => item.kind === 'model')!;
  career.reputation = 90;
  career.modelCareer!.portfolio.commercial = 30;
  const offer = career.modelCareer!.industry.board.find(item => item.category === 'ambassador')!;
  offer.auditionRoll = 1;
  expect(modelOfferReason(prepared, offer)).toBeUndefined();
  mockStore.setState({ world: prepared });
  const before = await repository.export(prepared.id), view = render(frame(<ModelCareerDashboard />));
  await press('Review Casting for ' + offer.title);
  const terms = screen.UNSAFE_getByType(EventModal).props.event.terms;
  const settlement = formatMoney({ minor: roundRatio(offerGross(offer), 5n), currency: countries[career.modelCareer!.boardCountry].currency });
  expect(terms).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: 'rights', value: modelBrandTerm(offer) + ' months' }),
    expect.objectContaining({ id: 'appearances', value: String(Math.ceil(modelBrandTerm(offer) / 3)) }),
    expect.objectContaining({ id: 'claim', value: settlement }),
    expect.objectContaining({ id: 'restrictions', value: expect.stringContaining('Style and fitness sponsorships, including Social') }),
  ]));
  expect(screen.getByText(/Abandoning the booking, breaching exclusivity or leaving required appearances unfulfilled/)).toBeTruthy();
  expect(await repository.export(prepared.id)).toBe(before);
  await press('Attend Casting'); await acknowledge();
  expect(mockStore.getState().world!.careers.find(item => item.kind === 'model')!.status).toBe('active');
  await press('Leave This Modelling Career');
  const leave = screen.UNSAFE_getByType(EventModal).props.event;
  expect(leave.terms).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'claim', value: settlement })]));
  expect(leave.body).toContain('creates the quoted settlement debt');
  expect(mockStore.getState().world!.careers.find(item => item.kind === 'model')!.status).toBe('active');
  view.unmount(); sqlite.close();
});
test('contract settlement display sums actual cash repayments and excludes estate write-offs', () => {
  const world = decodeWorld(JSON.stringify(graduate)), sample = world.ledger[0];
  const payments = creativeSettlementPayments([
    { ...sample, id: 'direct', liabilityId: 'brand_claim', cashDelta: -100n, debtDelta: -100n },
    { ...sample, id: 'automatic', liabilityId: 'brand_claim', cashDelta: -50n, debtDelta: -50n },
    { ...sample, id: 'estate', liabilityId: 'brand_claim', cashDelta: 0n, debtDelta: -400n },
    { ...sample, id: 'interest', liabilityId: 'brand_claim', cashDelta: -10n, debtDelta: 0n },
  ]);
  expect(payments.get('brand_claim')).toBe(150n);
});
