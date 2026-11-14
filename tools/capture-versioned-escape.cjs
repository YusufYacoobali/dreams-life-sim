// Capture started attempts using a real archived executable, never by patching session versions.
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript'), { createHash } = require('node:crypto');
const source = path.resolve(process.argv[2]), output = process.argv[3], sourceCommit = process.argv[4];
if (!output || !sourceCommit) throw Error('Usage: node tools/capture-versioned-escape.cjs SOURCE OUTPUT.json SOURCE_COMMIT');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, f);
const load = file => require(path.join(source, file)), { escapePrisoner } = load('tests/support/prisonEscape.ts'), { resolveCommand } = load('src/game/engine.ts'), { activeSentence } = load('src/game/systems/legalSchemas.ts'), { escapeContext } = load('src/minigames/core/eligibility.ts'), { escapeSequence, escapeRounds } = load('src/minigames/escape/escapeLogic.ts'), { encodeWorld } = load('src/game/model.ts'), { packCheckpoint } = load('src/persistence/checkpoints.ts');
const hash = world => createHash('sha256').update(encodeWorld(world)).digest('hex'), rows = [];
for (const assisted of [false, true]) {
  const initial = escapePrisoner(); let world = resolveCommand(initial, { type: 'mini-game-start', kind: 'escape', ownerId: activeSentence(initial).id, contextId: escapeContext(initial), assisted });
  const session = world.miniGames.at(-1), solution = [];
  for (let round = 0; round < (session.escapeVersion === 2 ? escapeRounds(session.difficulty) : 1); round++) {
    if (session.escapeVersion === 2) solution.push({ type: 'escape-recall' });
    solution.push(...escapeSequence(session, round).map(symbol => ({ type: 'stamp', symbol })));
  }
  const commands = solution.map((action, index) => ({ type: 'mini-game-input', sessionId: session.id, index, input: { at: (index + 1) * 100, action } }));
  const start = world;
  let completed = world; for (const command of commands) completed = resolveCommand(completed, command); completed = resolveCommand(completed, { type: 'mini-game-complete', sessionId: session.id });
  rows.push({ id: 'start-' + assisted, assisted, payload: packCheckpoint(start), inputSha256: hash(start), commands: [...commands, { type: 'mini-game-complete', sessionId: session.id }], outcomeSha256: hash(completed) });
  for (let index = 0; index < 2; index++) world = resolveCommand(world, commands[index]);
  world = resolveCommand(world, { type: 'mini-game-pause', sessionId: session.id, elapsedMs: world.miniGames.at(-1).elapsedMs });
  const pausedCommands = [{ type: 'mini-game-resume', sessionId: session.id }, ...commands.slice(2), { type: 'mini-game-complete', sessionId: session.id }];
  let resumed = world; for (const command of pausedCommands) resumed = resolveCommand(resumed, command);
  rows.push({ id: 'paused-' + assisted, assisted, payload: packCheckpoint(world), inputSha256: hash(world), commands: pausedCommands, outcomeSha256: hash(resumed) });
}
fs.writeFileSync(output, JSON.stringify({ sourceCommit, method: 'Actual archived engine, reserved start and paused transcript, with original complete-result hashes. No saved session field was patched.', rows }, null, 2));
process.stdout.write(JSON.stringify({ output, rows: rows.length }) + '\n');
