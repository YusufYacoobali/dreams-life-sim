import { decodeWorld } from '../../src/game/model';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import newborn from '../../tests/fixtures/v1-newborn.json';
import memorial from '../../tests/fixtures/v30-family-year91-checkpoint.json';

const kind = new URLSearchParams(location.search).get('kind') || 'welcome';
const world = kind === 'welcome' ? null : kind === 'birth' ? decodeWorld(JSON.stringify(newborn)) : { ...unpackCheckpoint(JSON.stringify(memorial), true), activePersonId: 'person_player' };
const state = { world, ready: true, busy: false, error: null, acknowledgeBirth: async () => false };
export const useGame = (selector: (value: typeof state) => unknown) => selector(state);
export const freshSeed = () => 42;
export const router = { push() {}, replace() {}, back() {} };
export const useFocusEffect = () => {};
export const Redirect = () => null;
