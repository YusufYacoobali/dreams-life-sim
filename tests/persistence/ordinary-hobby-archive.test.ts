import { gunzipSync, strFromU8 } from 'fflate';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { encodeWorld } from '../../src/game/model';
import { hobbyPracticeReason } from '../../src/game/systems/leisure';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { SaveRepository } from '../../src/persistence/repository';
import { createGameStore } from '../../src/state/gameStore';
import { database } from '../support/sqlite';
import archive from '../fixtures/v28-ordinary-hobby-archive.json';
import earlier from '../fixtures/v27-responsive-archive.json';

test('the genuine eight-hobby archive preserves both codecs, nine original moments and earned reading progress through cold continuation', async () => {
  const inflate = (part: { data: string }) => JSON.parse(strFromU8(gunzipSync(Buffer.from(part.data, 'base64'))));
  const raw = (payload: string) => {
    const part = JSON.parse(payload);
    return part.format === 'dreams-checkpoint-v1' ? inflate(part) : { ...inflate(part.main), ledger: part.ledger.flatMap(inflate) };
  };
  const decoded = decodeSave(JSON.stringify(archive)), originalWorlds = [raw(archive.checkpoint), ...archive.snapshots.map(item => raw(item.payload))];
  [decoded.world, ...decoded.snapshots.map(item => unpackCheckpoint(item.payload))].forEach((world, index) => {
    const encoded = JSON.parse(encodeWorld(world));
    for (const key of Object.keys(originalWorlds[index]).filter(key => !['schemaVersion', 'engineVersion', 'contentVersion'].includes(key))) expect(encoded[key]).toEqual(originalWorlds[index][key]);
  });
  expect(originalWorlds[0]).toMatchObject({ schemaVersion: 28, engineVersion: 27, contentVersion: 4 });
  expect(archive.snapshots.map(item => JSON.parse(item.payload).format)).toEqual([...Array(4).fill('dreams-checkpoint-v1'), ...Array(5).fill('dreams-checkpoint-v2')]);
  for (const moment of earlier.snapshots) expect(archive.snapshots.find(item => item.summary.id === moment.summary.id)).toEqual(moment);
  const { sqlite, driver } = database(), repository = new SaveRepository(driver); await repository.initialise(); await repository.import(JSON.stringify(archive));
  const cold = async () => {
    const store = createGameStore({ repository: async () => repository, date: () => ({ year: 2026, month: 10, day: 19 }), id: () => 'unused' });
    expect(await store.getState().bootstrap()).toBe(true); return store;
  };
  let store = await cold(); const world = () => store.getState().world!, reading = () => world().hobbies.find(item => item.kind === 'reading')!;
  expect(world()).toEqual(decoded.world);
  expect(world()).toMatchObject({ revision: 44, date: { year: 2035, month: 10, day: 19 }, annual: null, pending: { kind: 'result', id: 'action_43', title: 'Time for reading', effects: [{ id: 'proficiency', value: '+1%', tone: 'positive' }, expect.anything(), expect.anything(), expect.anything()] } });
  expect(reading()).toMatchObject({ proficiency: 25, plans: [{ payerId: 'person_parent1', monthlyFee: 1160n, consent: { accepted: true, roll: 47, chance: 87 } }] });
  expect(reading().practices.filter(row => row.source === 'monthly')).toHaveLength(12);
  expect(reading().practices.filter(row => row.source === 'manual')).toHaveLength(1);
  expect(reading().practices.reduce((sum, row) => sum + row.paid, 0n)).toBe(13920n);
  expect(reading().practices.flatMap(row => row.effects).filter(effect => effect.stat === 'smarts').reduce((sum, effect) => sum + effect.after - effect.before, 0)).toBe(2);
  const original = world(), plan = reading().plans[0], practices = reading().practices;
  expect(hobbyPracticeReason(world(), reading(), plan)).toMatch(/already did extra practice/);
  expect(await store.getState().dispatch({ type: 'acknowledge', resultId: 'action_43' })).toBe(true);
  expect(world().accounts).toEqual(original.accounts); expect(world().ledger).toEqual(original.ledger); expect(world().random).toEqual(original.random); expect(world().hobbies).toEqual(original.hobbies);
  store = await cold();
  const acknowledged = encodeWorld(world());
  expect(await store.getState().dispatch({ type: 'practise-hobby', hobbyId: reading().id, planId: plan.id })).toBe(false);
  expect(encodeWorld(world())).toBe(acknowledged); expect(encodeWorld(await repository.load(world().id))).toBe(acknowledged);
  expect(await store.getState().dispatch({ type: 'advance' })).toBe(true);
  let guard = 0;
  while ((world().pending || world().annual) && guard++ < 150) {
    store = await cold(); const current = world();
    expect(await store.getState().dispatch(current.pending?.kind === 'decision'
      ? { type: 'choose', eventId: current.pending.id, choiceId: current.pending.choices.find(item => !choiceUnavailable(current, item))!.id }
      : current.pending ? { type: 'acknowledge', resultId: current.pending.id } : { type: 'resume' })).toBe(true);
  }
  expect(guard).toBeLessThan(150); expect(world().annual).toBeNull();
  expect(reading().practices.slice(0, practices.length)).toEqual(practices);
  expect(reading().practices.filter(row => row.source === 'monthly')).toHaveLength(24);
  expect(reading().practices.filter(row => row.source === 'manual')).toHaveLength(1);
  expect(reading().practices.reduce((sum, row) => sum + row.paid, 0n)).toBe(27840n);
  expect(reading().proficiency).toBe(49);
  expect(world().hobbies[0].practices.slice(0, original.hobbies[0].practices.length)).toEqual(original.hobbies[0].practices);
  const pet = world().pets[0]; expect(pet.periods.slice(0, 36)).toEqual(original.pets[0].periods);
  expect(pet.periods).toHaveLength(46); expect(pet.status).toBe('deceased');
  expect(pet.ended).not.toBeNull();
  expect(pet.periods.at(-1)!.month).toBe(pet.ended!.year * 12 + pet.ended!.month - 1);
  const exported = JSON.parse(await repository.export(world().id)) as typeof archive;
  for (const moment of archive.snapshots) expect(exported.snapshots.find(item => item.summary.id === moment.summary.id)).toEqual(moment);
  store = await cold(); expect(world()).toEqual(decodeSave(JSON.stringify(exported)).world);
  sqlite.close();
}, 30000);
