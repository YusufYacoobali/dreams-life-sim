import { gunzipSync, gzipSync, strFromU8, strToU8 } from 'fflate';
import { createLife, randomCreation } from '../../src/game/createLife';
import { copyWorld, encodeWorld, immutableWorld, moneyJSON, validateWorld, type World } from '../../src/game/model';
import { decodeBase64, encodeBase64 } from '../../src/persistence/base64';
import { decodeSave } from '../../src/persistence/archive';
import { packCheckpoint, unpackCheckpoint } from '../../src/persistence/checkpoints';
import archive from '../fixtures/v27-leisure-archive.json';

function verifyCanonical(world: World, payload: string) {
  const packed = JSON.parse(payload);
  const verify = (part: { data: string }, text: string) => {
    expect(strFromU8(gunzipSync(decodeBase64(part.data)))).toBe(text);
    expect(part.data).toBe(encodeBase64(gzipSync(strToU8(text), { level: 4, mtime: 0 })));
  };
  if (packed.format === 'dreams-checkpoint-v1') verify(packed, encodeWorld(world));
  else {
    expect(['dreams-checkpoint-v4','dreams-checkpoint-v5']).toContain(packed.format);
    const { ledger: _ledger, people: _people, ...body } = world;
    verify(packed.main, JSON.stringify(packed.format==='dreams-checkpoint-v5'?{...body,journal:[],relationships:[]}:body, moneyJSON));
    if(packed.history) for(const key of ['journal','relationships'] as const) for(let index=0;index<packed.history[key].length;index++) verify(packed.history[key][index],JSON.stringify(world[key].slice(index*128,(index+1)*128),moneyJSON));
    const entries = Object.entries(world.people);
    for (let index = 0; index < packed.people.length; index++) verify(packed.people[index], JSON.stringify(Object.fromEntries(entries.slice(index * 32, (index + 1) * 32)), moneyJSON));
  }
  expect(unpackCheckpoint(payload)).toEqual(world);
}

test.each(['small', 'chunked'] as const)('%s warm fragment caches never hide mutable non-ledger changes, Unicode, bigint or optional fields', kind => {
  const fresh = createLife('life_json_fragments', 42, { ...randomCreation(42), firstName: 'Zoë "雪" \\ 🐈', lastName: 'O’Connor' }, { year: 2026, month: 10, day: 24 });
  const before = immutableWorld(kind === 'small' ? fresh : decodeSave(JSON.stringify(archive)).world);
  const original = encodeWorld(before), warm = packCheckpoint(before);
  verifyCanonical(before, warm);
  const mutable = copyWorld(before), player = mutable.people[mutable.activePersonId];
  player.firstName = 'Mañana 🎈'; delete player.appearance.identity;
  mutable.journal[0].text = 'Quotes: "hello". Backslash: \\. Snow: 雪.\nNext line\twith a tab.';
  const account = mutable.accounts.find(item => item.ownerId === player.id)!;
  account.cash += 12345678901234567890n; account.openingCash += 12345678901234567890n;
  const expected = validateWorld(mutable), changed = packCheckpoint(mutable);
  expect(changed).not.toBe(warm); verifyCanonical(expected, changed);
  const certified = immutableWorld(mutable); verifyCanonical(certified, packCheckpoint(certified));
  expect(encodeWorld(before)).toBe(original); expect(packCheckpoint(before)).toBe(warm);
});
