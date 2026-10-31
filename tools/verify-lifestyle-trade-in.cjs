// A funded financial eligibility scenario, not a natural gameplay journey.
// Exercise the composite sale/purchase against real closed-connection SQLite.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite'), { createHash } = require('node:crypto'), ts = require('typescript');
const root = path.resolve(__dirname, '..'), output = process.argv[2];
assert(output, 'Usage: node tools/verify-lifestyle-trade-in.cjs REPORT_JSON');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, file);
const load = relative => require(path.join(root, relative));
const { decodeWorld, encodeWorld } = load('src/game/model.ts'), { resolveCommand } = load('src/game/engine.ts');
const { assetCatalog } = load('src/game/content/assets.ts'), { assetPrice, saleQuote } = load('src/game/systems/assets.ts');
const { SaveRepository } = load('src/persistence/repository.ts'), { encodeSave, decodeSave } = load('src/persistence/archive.ts');
const { accountFor } = load('src/game/systems/common.ts');
const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'dreams-lifestyle-trade-')), file = path.join(folder, 'life.db');
let sqlite, repository;
function open() {
  sqlite = new DatabaseSync(file); sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON');
  const session = { run: async (sql, values = []) => { sqlite.prepare(sql).run(...values); }, get: async (sql, values = []) => sqlite.prepare(sql).get(...values) ?? null, all: async (sql, values = []) => sqlite.prepare(sql).all(...values) };
  repository = new SaveRepository({ ...session, exec: async sql => sqlite.exec(sql), transaction: async action => { sqlite.exec('BEGIN IMMEDIATE'); try { const result = await action(session); sqlite.exec('COMMIT'); return result; } catch (error) { sqlite.exec('ROLLBACK'); throw error; } } }, () => '2026-10-31T00:00:00.000Z');
}
const tables = ['lives', 'preferences', 'receipts', 'snapshots', 'backups', 'snapshot_metadata', 'branches', 'restore_receipts'];
const rows = () => Object.fromEntries(tables.map(table => [table, sqlite.prepare('SELECT * FROM ' + table).all().map(row => JSON.stringify(row)).sort()]));
const act = (world, command) => { const next = resolveCommand(world, command, true); return next.pending?.kind === 'result' ? resolveCommand(next, { type: 'acknowledge', resultId: next.pending.id }, true) : next; };
(async () => {
  let world = decodeWorld(fs.readFileSync(path.join(root, 'tests/fixtures/v3-employed-graduate.json'), 'utf8'));
  accountFor(world).cash += 1000000000n; accountFor(world).openingCash += 1000000000n;
  world = act(world, { type: 'enable-lifestyle' });
  const oldOffer = assetCatalog.find(row => row.id === 'used-compact'), replacement = assetCatalog.find(row => row.id === 'family-car');
  assert(oldOffer && replacement);
  world = act(world, { type: 'buy-asset', catalogId: oldOffer.id, financing: 'cash', depositBps: 10000, termMonths: 120, quotedPrice: assetPrice(world, oldOffer) });
  const oldId = world.assets.at(-1).id; world = act(world, { type: 'enable-vehicle-activities', assetId: oldId });
  const beforeCash = accountFor(world).cash, sale = saleQuote(world, world.assets.at(-1)), price = assetPrice(world, replacement);
  const command = { type: 'trade-in-vehicle', assetId: oldId, catalogId: replacement.id, quotedSale: sale.price, quotedPrice: price };
  const expected = resolveCommand(world, command, true);
  assert.equal(accountFor(expected).cash, beforeCash + sale.proceeds - price);
  assert.equal(expected.assets.find(row => row.id === oldId).ownerId, null);
  assert.equal(expected.assets.filter(row => row.ownerId === expected.activePersonId && row.kind === 'vehicle').length, 1);
  assert.equal(expected.assets.at(-1).catalogId, replacement.id);
  assert.equal(expected.assets.at(-1).vehicleLife, undefined, 'A replacement must be reviewed separately');
  assert.throws(() => resolveCommand(world, { ...command, quotedPrice: price + 1n }, true), /prices/);
  assert.equal(encodeWorld(decodeSave(encodeSave({ world: expected, snapshots: [], branch: null })).world), encodeWorld(expected));
  open(); await repository.initialise(); await repository.create(world); const beforeRows = rows();
  sqlite.exec("CREATE TRIGGER fail_trade_receipt BEFORE INSERT ON receipts BEGIN SELECT RAISE(ABORT,'controlled trade-in failure'); END");
  await assert.rejects(repository.commit(expected, world.revision, 'trade-in:once', false), /controlled trade-in failure/);
  assert.deepEqual(rows(), beforeRows); sqlite.close(); open(); await repository.initialise();
  assert.deepEqual(await repository.load(world.id), world); assert.deepEqual(rows(), beforeRows);
  sqlite.exec('DROP TRIGGER fail_trade_receipt');
  await repository.commit(expected, world.revision, 'trade-in:once', false);
  assert.deepEqual(await repository.commit(expected, world.revision, 'trade-in:once', false), expected);
  sqlite.close(); open(); await repository.initialise(); assert.deepEqual(await repository.load(world.id), expected);
  const settled = act(expected, { type: 'acknowledge', resultId: expected.pending.id });
  assert.throws(() => resolveCommand(settled, command, true), /Choose your own vehicle/);
  const sha = value => createHash('sha256').update(value).digest('hex');
  const report = { scope: 'Explicitly funded unit financial scenario using genuine graduate world, actual commands and real on-disk WAL SQLite. No natural journey claim.', passed: true, driverSha256: sha(fs.readFileSync(__filename)), inputSha256: sha(encodeWorld(world)), outcomeSha256: sha(encodeWorld(expected)), actualCashMinor: { before: beforeCash.toString(), netSale: sale.proceeds.toString(), replacement: price.toString(), after: accountFor(expected).cash.toString() }, assertions: ['actual same original title sold', 'exact net sale minus replacement payment', 'one actually owned replacement', 'replacement requires its own activity review', 'stale quote rejected', 'archive round-trip exact', 'failed receipt preserves all eight tables', 'cold failure recovery', 'retry commits once', 'duplicate receipt idempotent', 'cold successful outcome exact', 'old title cannot be traded twice'] };
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n'); console.log({ output, passed: true });
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { if (sqlite?.isOpen) sqlite.close(); fs.rmSync(folder, { recursive: true, force: true }); });
