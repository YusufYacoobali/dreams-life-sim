import { decodeWorld, type World } from '../../src/game/model';
import { resolveCommand } from '../../src/game/engine';
import { accountFor } from '../../src/game/systems/common';
import { assetCatalog } from '../../src/game/content/assets';
import { assetPrice } from '../../src/game/systems/assets';
import fixture from '../fixtures/v3-employed-graduate.json';
export function lifestyleFixture() { let world = decodeWorld(JSON.stringify(fixture)); const account = accountFor(world); account.cash += 1000000000n; account.openingCash += 1000000000n; return act(world, { type: 'enable-lifestyle' }); }
export function act(world: World, command: Parameters<typeof resolveCommand>[1]) { const next = resolveCommand(world, command); return next.pending?.kind === 'result' ? resolveCommand(next, { type: 'acknowledge', resultId: next.pending.id }) : next; }
export function buyLifestyle(world: World, catalogId: string) { return act(world, { type: 'buy-asset', catalogId, financing: 'cash', depositBps: 10000, termMonths: 120, quotedPrice: assetPrice(world, assetCatalog.find(row => row.id === catalogId)!) }); }
