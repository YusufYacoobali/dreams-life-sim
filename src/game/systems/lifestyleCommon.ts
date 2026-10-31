import type { Person, World } from '../model';
import type { LifestyleRecord } from './lifestyleSchemas';
import { IneligibleAction } from '../errors';
import { ageOn, fullName } from '../personHelpers';
import { countries } from '../countries';
import { active, accountFor, availableCash, bounded, charge, draw, fact, post, result } from './common';
import { activeTrip } from './travelSchemas';
import { serviceAway } from './serviceSchemas';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
const relationFor = (world: World, a: string, b: string) => world.relationships.find(row => row.from === a && row.to === b || row.to === a && row.from === b);
export const lifestyleMonthNumber = (world: World) => world.date.year * 12 + world.date.month - 1;
export function newLifestyle(date: World['date']): NonNullable<World['lifestyle']> { return { version: 1, enabled: { ...date }, licences: [], applications: [], tenancies: [], records: [], projects: [], offers: [] }; }
export function lifestyleState(world: World) { if (!world.lifestyle)
    throw new IneligibleAction('Review and enable the lifestyle expansion first'); return world.lifestyle; }
export function presentAtHome(world: World, person = active(world)) { return !person.died && !person.legal.wanted && !activeTrip(world, person.id) && !serviceAway(world, person.id) && !hospitalized(world, person) && !isConfined(world, person); }
export function lifestyleReason(world: World, adult = true) { const person = active(world); if (!world.lifestyle)
    return 'Review and enable the lifestyle expansion first'; if (!presentAtHome(world))
    return 'Return home and resolve your current restrictions first'; if (adult && ageOn(person, world.date) < 18)
    return 'Available to adults'; if (person.stats.health < 25 || person.stats.energy < 4)
    return 'Rest and recover first'; }
export function requireLifestyle(world: World, adult = true) { const reason = lifestyleReason(world, adult); if (reason)
    throw new IneligibleAction(reason); }
export function localContactReason(world: World, id: string, allowChild = false) { const person = world.people[id], player = active(world); if (!person || id === player.id || !relationFor(world, player.id, id) || !presentAtHome(world, person) || person.country !== player.country || person.city !== player.city)
    return 'Choose an available actual local contact'; if (!allowChild && ageOn(person, world.date) < 18)
    return 'Choose an adult contact'; }
export function contactConsent(world: World, person: Person) { const edge = relationFor(world, world.activePersonId, person.id), chance = Math.min(95, 35 + Math.floor((edge?.strength ?? 0) / 2)), roll = draw(world, 'npcs', 1, 100); return { chance, roll, accepted: roll <= chance }; }
export function sharedMemory(world: World, id: string, text: string, delta: number) { const edge = relationFor(world, world.activePersonId, id); if (!edge)
    return; edge.strength = bounded(edge.strength + delta); edge.memories.push(text); if (edge.memories.length > 100)
    edge.memories.splice(0, edge.memories.length - 100); }
export function recordLifestyle(world: World, input: Pick<LifestyleRecord, 'kind' | 'subjectId' | 'body'> & Partial<Omit<LifestyleRecord, 'id' | 'date' | 'personId' | 'kind' | 'subjectId' | 'body'>>) { const person = active(world), state = lifestyleState(world); if (state.records.length >= 4096)
    throw new IneligibleAction('This life has reached its lifestyle activity history limit'); const record: LifestyleRecord = { id: 'lifestyle_' + world.revision + '_' + state.records.length, personId: person.id, date: { ...world.date }, country: person.country, city: person.city, currency: countries[person.country].currency, participants: [person.id], accepted: true, chance: null, roll: null, paid: 0n, received: 0n, paymentIds: [], before: null, after: null, distance: 0, ...input }; state.records.push(record); fact(world, record.body, 'lifestyle'); return record; }
export function lifestylePayment(world: World, cost: bigint, body: string, currency = accountFor(world).currency, person = active(world)) { if (cost < 0n || availableCash(accountFor(world, person, currency)) < cost)
    throw new IneligibleAction('Insufficient available funds'); if (!cost)
    return []; charge(world, cost, 'lifestyle-cost', body, undefined, currency, person); return [world.ledger.at(-1)!.id]; }
export function transferLifestyle(world: World, from: Person, to: Person, amount: bigint, currency: LifestyleRecord['currency'], description: string) { if (amount <= 0n)
    return []; post(world, -amount, 0n, 'lifestyle-transfer', description, null, from, currency); const debit = world.ledger.at(-1)!.id; post(world, amount, 0n, 'lifestyle-transfer', description, null, to, currency); return [debit, world.ledger.at(-1)!.id]; }
export function lifestyleResult(world: World, title: string, record: LifestyleRecord, illustration = 'property') { result(world, title, record.body, illustration, [{ id: 'paid', label: 'Paid', value: record.paid.toString() + ' minor units · ' + record.currency, tone: record.paid ? 'negative' : 'neutral' }]); }
export const nameOf = (world: World, id: string) => fullName(world.people[id]);
