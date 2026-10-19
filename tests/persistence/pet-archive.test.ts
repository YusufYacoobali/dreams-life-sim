import { gunzipSync, strFromU8 } from 'fflate';
import { encodeWorld } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import archive from '../fixtures/v26-household-pet-archive.json';

test('the genuine world-26 pet archive preserves current care/payments, original adoption and all three real prior moments without retroactive progress', () => {
  const raw = (payload: string) => JSON.parse(strFromU8(gunzipSync(Buffer.from(JSON.parse(payload).data, 'base64')))), originals = [raw(archive.checkpoint), ...archive.snapshots.map(item => raw(item.payload))], save = decodeSave(JSON.stringify(archive)), worlds = [save.world, ...save.snapshots.map(item => unpackCheckpoint(item.payload))];
  worlds.forEach((world, index) => { const encoded = JSON.parse(encodeWorld(world)); expect(originals[index]).toMatchObject({ schemaVersion: 26, engineVersion: 25, contentVersion: 4 }); for (const key of Object.keys(originals[index]).filter(key => !['schemaVersion', 'engineVersion', 'contentVersion'].includes(key))) expect(encoded[key]).toEqual(originals[index][key]); });
  const world = save.world, pet = world.pets[0]; expect(pet).toMatchObject({ name: 'Biscuit', ownerId: 'person_parent1', adoptionFee: 58000n, adoptionCurrency: 'AUD', consent: { roll: 47, chance: 86 }, health: 93 }); expect(pet.periods).toHaveLength(12); expect(pet.periods.reduce((sum, item) => sum + item.paid, 0n)).toBe(69600n); expect(pet.visits[0].paid).toBe(5800n); expect(world.annual?.monthsProcessed).toBe(12);
  expect(worlds[1].pets).toEqual([]); expect(worlds[2].pets[0].periods).toEqual([]); expect(worlds[2].pending?.kind === 'result' && worlds[2].pending.title).toBe('Welcome, Biscuit'); expect(worlds[3].pets[0].visits).toHaveLength(1); expect(worlds[3].pets[0].periods).toEqual([]);
  if (world.pending?.kind !== 'decision') throw new Error('Expected original school choice'); const choice = world.pending.choices.find(item => !choiceUnavailable(world, item))!;
  let finished = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: choice.id }); if (finished.pending?.kind !== 'result') throw new Error('Expected school result'); finished = resolveCommand(finished, { type: 'acknowledge', resultId: finished.pending.id });
  expect(finished.pets).toEqual(world.pets); expect(finished.petAdoptions).toEqual(world.petAdoptions); expect(finished.accounts).toEqual(world.accounts); expect(finished.ledger).toEqual(world.ledger); expect(finished.random).toEqual(world.random); expect(finished.annual).toBeNull();
});
