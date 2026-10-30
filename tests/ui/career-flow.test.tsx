import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createGameStore } from '../../src/state/gameStore';
import { decodeWorld, encodeWorld } from '../../src/game/model';
import { endEmployment } from '../../src/game/systems/work';
import { actorOfferReason } from '../../src/game/systems/actor';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { ThemeProvider } from '../../src/ui/theme';
import fixture from '../fixtures/v3-employed-graduate.json';
let mockStore: ReturnType<typeof createGameStore>;
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() }, useLocalSearchParams: () => ({ kind: 'actor' }) }));
jest.mock('../../src/state/useGame', () => ({ useGame: (selector: unknown) => require('zustand').useStore(mockStore, selector) }));
import CareerDashboard from '../../app/(game)/career/[kind]';
import { PendingEvent } from '../../src/ui/PendingEvent';
const frame = (content: React.ReactNode) => <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, bottom: 34, left: 0, right: 0 } }}><ThemeProvider>{content}<PendingEvent /></ThemeProvider></SafeAreaProvider>;
test('native audition rollback/retry creates exactly one contract and team; focus and a cold SQLite load preserve the same project response', async () => {
    const { sqlite, driver } = database(), repository = new SaveRepository(driver);
    await repository.initialise();
    const initial = decodeWorld(JSON.stringify(fixture)), person = initial.people[initial.activePersonId];
    endEmployment(initial);
    person.skills.acting = 80;
    person.stats.health = 100;
    person.stats.looks = 100;
    initial.random.outcomes = 1;
    await repository.create(initial);
    mockStore = createGameStore({ repository: async () => repository, date: () => initial.date, id: () => 'life_unused' });
    await mockStore.getState().bootstrap();
    let view = render(frame(<CareerDashboard />));
    const world = () => mockStore.getState().world!;
    const press = async (name: string | RegExp, role: 'button' | 'radio' = 'button') => { await act(async () => { fireEvent.press(screen.getByRole(role, { name })); }); };
    const acknowledge = async () => { expect(world().pending?.kind).toBe('result'); await press('Continue'); };
    const retry = async (launch: string, confirm: string) => {
        const before = world(), encoded = encodeWorld(before), people = Object.keys(before.people);
        await press(launch);
        sqlite.exec("CREATE TRIGGER fail_audition BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'storage failure'); END");
        await press(confirm);
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be saved/));
        expect(await repository.load(initial.id)).toEqual(before);
        expect(encodeWorld(world())).toBe(encoded); expect(Object.keys(world().people)).toEqual(people);
        sqlite.exec('DROP TRIGGER fail_audition');
        // The reviewed command stays open after rollback, so retrying it cannot
        // manufacture another team, contract, saved casting or response.
        await press(confirm); await acknowledge();
    };
    expect(encodeWorld(mockStore.getState().world!)).toBe(encodeWorld(initial));
    await retry('Explore Acting Opportunities', 'Explore Acting');
    await press(/^Character & Craft\./, 'radio'); await press('Set Acting Approach');
    await waitFor(() => expect(screen.getByRole('header', { name: 'An acting approach' })).toBeOnTheScreen());
    await acknowledge();
    expect(world().careers).toHaveLength(1); expect(world().careers[0].projects).toHaveLength(0); expect(world().people[world().activePersonId].employment).toBeNull();
    const contacts = world().careers[0].contacts, enteredPeople = Object.keys(world().people);
    expect(contacts).toHaveLength(4); expect(Object.keys(world().careers[0].actor!.industry.contacts)).toHaveLength(4);
    let retriedAudition = false, years = 0;
    while (world().careers[0].status !== 'active') {
        const offer = world().careers[0].actor!.industry.board.find(item => !actorOfferReason(world(), item));
        if (!offer) {
            if (++years > 2) throw Error('No acting role after three ordinary saved casting boards');
            await act(async () => { expect(await mockStore.getState().dispatch({ type: 'advance' })).toBe(true); });
            for (let guard = 0; world().pending || world().annual; guard++) {
                if (guard > 100) throw Error('Bounded ordinary actor continuation stopped');
                const pending = world().pending, choice = pending?.kind === 'decision' ? pending.choices.find(item => !choiceUnavailable(world(), item)) : undefined;
                await act(async () => { expect(await mockStore.getState().dispatch(pending?.kind === 'decision' ? { type: 'choose', eventId: pending.id, choiceId: choice!.id } : pending ? { type: 'acknowledge', resultId: pending.id } : { type: 'resume' })).toBe(true); });
            }
            await press('Review New Casting List'); await press('Review Casting List'); await acknowledge(); continue;
        }
        const before = world(), launch = 'Review Audition for ' + offer.title;
        if (!retriedAudition) { await retry(launch, 'Attend Audition'); retriedAudition = true; }
        else { await press(launch); await press('Attend Audition'); await acknowledge(); }
        expect(world().accounts).toEqual(before.accounts); expect(world().ledger).toEqual(before.ledger);
        expect(world().careers[0].actor!.industry.board.find(item => item.id === offer.id)!.auditionRoll).toBe(offer.auditionRoll);
        expect(world().careers[0].actor!.industry.board.find(item => item.id === offer.id)!.status).not.toBe('open');
    }
    const selected = world(), career = selected.careers[0], project = career.projects[0];
    expect(selected.careers).toHaveLength(1);
    expect(career.projects).toHaveLength(1); expect(career.contacts).toEqual(contacts); expect(Object.keys(selected.people)).toEqual(enteredPeople);
    expect(project.grossEarned).toBe(0n); expect(project.periods).toHaveLength(0); expect(project.creative).toBeDefined();
    expect(selected.people[selected.activePersonId].employment!.id).toBe(project.employmentId);
    expect(selected.workHistory.filter(item => item.id === project.employmentId)).toHaveLength(1);
    const saved = world();
    expect(saved.careers[0].focus).toBe('craft');
    expect(saved.careers[0].actor!.style).toBe('craft');
    expect((await repository.load(initial.id)).careers).toEqual(saved.careers);
    expect(saved.careers[0].projects[0]).toEqual(project);
    expect(saved.careers[0].contacts).toEqual(career.contacts);
    view.unmount();
    const coldRepository = new SaveRepository(driver); await coldRepository.initialise();
    mockStore = createGameStore({ repository: async () => coldRepository, date: () => initial.date, id: () => 'life_unused' });
    expect(await mockStore.getState().bootstrap()).toBe(true);
    expect(world()).toEqual(saved);
    view = render(frame(<CareerDashboard />));
    expect(screen.getByRole('radio', { name: /^Character & Craft\./ })).toBeDisabled();
    expect(world().careers[0].projects[0].creative!.criticRoll).toBe(project.creative!.criticRoll);
    expect(world().careers[0].projects[0].creative!.audienceRoll).toBe(project.creative!.audienceRoll);
    expect(world().careers[0].projects[0].responseRoll).toBe(project.responseRoll);
    view.unmount();
    sqlite.close();
});
