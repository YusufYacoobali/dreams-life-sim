import { creativeReceptionLabel } from '../../src/game/content/creativeReception';
import { countries } from '../../src/game/countries';
import { copyWorld, decodeWorld, encodeWorld, immutableWorld, validateWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { refreshActorOpportunities, actorProductionCost } from '../../src/game/systems/actor';
import { refreshModelOpportunities } from '../../src/game/systems/modelCareer';
import { creativeMonthNumber } from '../../src/game/systems/creativeSchemas';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import { SaveRepository } from '../../src/persistence/repository';
import { database } from '../support/sqlite';
import { creativeAct, creativeBook, creativeCareer, creativeFixture, creativeIndustry, creativePeriod, drainCreative } from '../support/creativeCareer';

const refresh = { actor: refreshActorOpportunities, model: refreshModelOpportunities };
test.each(['actor', 'model'] as const)('%s updates at a gameplay boundary, archives answered casting and preserves the RNG stream', async kind => {
  let world = creativeFixture(kind);
  const offer = creativeIndustry(world, kind).board.find(row => row.category === (kind === 'actor' ? 'commercial' : 'advertising'))!;
  offer.auditionRoll = 100;
  world = creativeAct(world, kind === 'actor' ? { type: 'actor-audition', offerId: offer.id, quotedAnnualPay: offer.annualPay, negotiate: false } : { type: 'model-casting', offerId: offer.id, quotedAnnualPay: offer.annualPay });
  const answered = { ...creativeIndustry(world, kind).board.find(row => row.id === offer.id)! };
  expect(answered.status).toBe('rejected');
  for (let i = 0; i < 3; i++) world = drainCreative(creativePeriod(world));
  const previous = immutableWorld(world), encoded = encodeWorld(previous), random = { ...world.random };
  world = resolveCommand(previous, kind === 'actor' ? { type: 'actor-style', style: 'craft' } : { type: 'model-specialise', specialisations: ['editorial'] });
  const state = creativeIndustry(world, kind);
  expect(state.boardSeason).toBe(Math.floor(creativeMonthNumber(world) / 3));
  expect(state.board.every(row => row.status === 'open')).toBe(true);
  expect(state.castingHistory).toContainEqual({ country: 'US', season: Math.floor((creativeMonthNumber(world) - 3) / 3), offer: answered });
  expect(world.random).toEqual(random); expect(encodeWorld(previous)).toBe(encoded);
  const stable = encodeWorld(world); refresh[kind](world); expect(encodeWorld(world)).toBe(stable);
  const { sqlite, driver } = database();
  try {
    const repository = new SaveRepository(driver); await repository.initialise(); await repository.create(world);
    const cold = await new SaveRepository(driver).load(world.id);
    expect(encodeWorld(cold)).toBe(stable); expect(encodeWorld(unpackCheckpoint(packCheckpoint(world)))).toBe(stable);
  } finally { sqlite.close(); }
});

test.each(['actor', 'model'] as const)('%s returns to exactly the same answered country board without rerolling', kind => {
  const world = creativeFixture(kind), person = world.people[world.activePersonId], state = creativeIndustry(world, kind);
  state.board[0].status = 'rejected'; const saved = structuredClone(state.board), random = { ...world.random };
  person.country = 'GB'; person.city = countries.GB.cities[0]; refresh[kind](world);
  expect(creativeCareer(world, kind)[kind === 'actor' ? 'actor' : 'modelCareer']!.boardCountry).toBe('GB');
  person.country = 'US'; person.city = countries.US.cities[0]; refresh[kind](world);
  expect(state.board).toEqual(saved); expect(world.random).toEqual(random);
  expect(state.castingHistory!.filter(row => row.offer.id === saved[0].id)).toHaveLength(1);
});

test('automatic casting does not change the currency or upkeep quote of a signed foreign production', () => {
  const world = creativeBook(creativeFixture('actor'), 'actor'), cost = actorProductionCost(world, 'reshoot');
  world.people[world.activePersonId].country = 'JP'; world.people[world.activePersonId].city = 'Tokyo';
  refreshActorOpportunities(world);
  expect(creativeCareer(world, 'actor').currency).toBe('USD'); expect(actorProductionCost(world, 'reshoot')).toBe(cost); expect(() => validateWorld(world)).not.toThrow();
});

test.each(['actor', 'model'] as const)('%s legacy board decoding stays read-only and does not invent casting history', kind => {
  const old = creativeFixture(kind), text = encodeWorld(old), restored = decodeWorld(text);
  expect(creativeIndustry(restored, kind).castingHistory).toBeUndefined(); expect(encodeWorld(restored)).toBe(text);
});


test.each([
  ['studio-film', 'Blockbuster'], ['independent-film', 'Blockbuster'], ['series', 'Breakout series'],
  ['commercial', 'Major campaign success'], ['advertising', 'Major campaign success'], ['theatre', 'Standout production'], ['runway', 'Major success'],
])('%s success wording fits its medium while retaining the saved tier', (category, expected) => {
  expect(creativeReceptionLabel(category, 'blockbuster')).toBe(expected);
});


test.each(['actor', 'model'] as const)('%s rejects forged open, future, duplicate and malformed archived casting', kind => {
  const world = creativeFixture(kind), state = creativeIndustry(world, kind);
  state.board[0].status = 'rejected';
  state.castingHistory = [{ country: 'US', season: state.boardSeason, offer: { ...state.board[0] } }];
  expect(() => validateWorld(world)).not.toThrow();
  for (const forgery of ['open', 'future', 'duplicate', 'category']) {
    const bad = copyWorld(world), industry = creativeIndustry(bad, kind), row = industry.castingHistory![0];
    if (forgery === 'open') row.offer.status = 'open';
    if (forgery === 'future') row.season += 10;
    if (forgery === 'duplicate') industry.castingHistory!.push(structuredClone(row));
    if (forgery === 'category') row.offer.category = 'invented-category';
    expect(() => validateWorld(bad)).toThrow();
  }
});
