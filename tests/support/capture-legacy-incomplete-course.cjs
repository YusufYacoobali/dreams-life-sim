// Explicit producer only; never run by Jest. Run after root's benchmark quiet
// window, against a detached exact source worktree and its independently captured
// `git ls-tree -r COMMIT -- src package.json package-lock.json FIXTURE` manifest.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { createHash } = require('node:crypto');
const project = path.resolve(__dirname, '../..'), sourceRoot = process.argv[2], manifestPath = process.argv[3];
const sourceCommit = '6f4b34c40005f5fba8eeee540bada9e0787ccbb0';
const inputPath = 'tests/fixtures/v24-university-loan-archive.json';
const sha = value => createHash('sha256').update(value).digest('hex');
const blob = value => createHash('sha1').update('blob ' + value.length + '\0').update(value).digest('hex');
assert(sourceRoot && manifestPath, 'Pass detached old source worktree and its exact ls-tree manifest');
const manifestBytes = fs.readFileSync(manifestPath), entries = manifestBytes.toString('utf8').trim().split('\n').map(line => {
  const match = /^100644 blob ([a-f0-9]{40})\t(.+)$/.exec(line); assert(match, 'Unexpected tree manifest row'); return { path: match[2], gitBlob: match[1] };
});
assert(entries.length > 100); assert(new Set(entries.map(item => item.path)).size === entries.length);
const gitPointer = fs.readFileSync(path.join(sourceRoot, '.git'), 'utf8').trim(); assert(gitPointer.startsWith('gitdir: '));
const gitDirectory = path.resolve(sourceRoot, gitPointer.slice(8));
function digest(dirs, base) {
  const hash = createHash('sha256');
  function visit(directory) { for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) { const file = path.join(directory, entry.name); if (entry.isDirectory()) visit(file); else if (/\.tsx?$/.test(file)) hash.update(path.relative(base, file)).update('\0').update(fs.readFileSync(file)).update('\0'); } }
  dirs.forEach(visit); return hash.digest('hex');
}
function pins() {
  assert.equal(fs.readFileSync(path.join(gitDirectory, 'HEAD'), 'utf8').trim(), sourceCommit, 'Source worktree must remain detached at the exact approved old commit');
  const files = entries.map(item => { const bytes = fs.readFileSync(path.join(sourceRoot, item.path)); assert.equal(blob(bytes), item.gitBlob, 'Source differs from old Git blob: ' + item.path); return { ...item, bytes: bytes.length, sha256: sha(bytes) }; });
  const game = digest([path.join(sourceRoot, 'src/game')], path.join(sourceRoot, 'src/game')), gameAndPersistence = digest([path.join(sourceRoot, 'src/game'), path.join(sourceRoot, 'src/persistence')], sourceRoot);
  assert.equal(game, '24a5a40521b31fa94eca4c4d161bbbd74e24c460a08bc675afcd340e392e7ba5'); assert.equal(gameAndPersistence, '34cc89201f1da71c8c118c09a78025c94161e69afae15ed5354cd413fdeca7e1');
  return { gitRevision: sourceCommit, treeManifestSha256: sha(manifestBytes), game, gameAndPersistence, files };
}
const sourceBefore = pins(), input = fs.readFileSync(path.join(sourceRoot, inputPath));
assert.equal(input.length, 223408); assert.equal(sha(input), 'ac41f013cbda20115f32456ca88373411ee66bf4d6653dc6b30e8e8e5d5503a6');
assert.deepEqual(fs.readFileSync(path.join(project, inputPath)), input); assert.deepEqual(fs.readFileSync(path.join(project, 'package-lock.json')), fs.readFileSync(path.join(sourceRoot, 'package-lock.json')));
const ts = require(path.join(project, 'node_modules/typescript')), loaded = new Set();
require.extensions['.ts'] = (module, file) => { assert(file.startsWith(sourceRoot + path.sep), 'Unexpected TypeScript dependency outside frozen old source'); assert(entries.some(item => path.join(sourceRoot, item.path) === file), 'Unpinned TypeScript dependency'); loaded.add(path.relative(sourceRoot, file)); module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, file); };
const { resolveCommand } = require(path.join(sourceRoot, 'src/game/engine.ts'));
const { encodeWorld } = require(path.join(sourceRoot, 'src/game/model.ts'));
const { unpackCheckpoint, packCheckpoint } = require(path.join(sourceRoot, 'src/persistence/checkpoints.ts'));
const archive = JSON.parse(input.toString('utf8')), before = unpackCheckpoint(archive.checkpoint), personId = before.activePersonId;
assert.equal(before.people[personId].education.stage, 'university'); assert.equal(before.people[personId].education.months, 12); assert.equal(before.pending, null); assert(!Object.hasOwn(before, 'studyCourses')); assert(!Object.hasOwn(before, 'universityApplications'));
const leave = { type: 'leave-school' }, left = resolveCommand(before, leave, true); assert.equal(left.pending.kind, 'result');
const acknowledge = { type: 'acknowledge', resultId: left.pending.id }, after = resolveCommand(left, acknowledge, true);
assert.equal(after.people[personId].education.stage, 'none'); assert.equal(after.people[personId].education.paused, false); assert.equal(after.people[personId].education.months, 12); assert.equal(after.people[personId].education.requiredMonths, 48); assert.equal(after.pending, null);
assert.deepEqual(after.people[personId].education, { ...before.people[personId].education, stage: 'none', paused: false });
for (const key of ['random', 'accounts', 'liabilities', 'ledger', 'date']) assert.deepEqual(after[key], before[key]);
const point = world => { const checkpoint = packCheckpoint(world); return { checkpoint, checkpointSha256: sha(checkpoint), canonicalSha256: sha(encodeWorld(world)), revision: world.revision }; };
const sourceAfter = pins(); assert.deepEqual(sourceAfter, sourceBefore);
const fixture = { format: 'dreams-legacy-incomplete-course-v1', scope: 'New producer trace: unchanged v24 current archive, exact frozen C36 old runtime, only original leave-school and its result acknowledgement. No state, date, money, RNG or qualification edits. It is not a newly simulated natural dropout life.', sourceBefore, sourceAfter, input: { path: inputPath, bytes: input.length, sha256: sha(input) }, captureToolSha256: sha(fs.readFileSync(__filename)), loadedSourcePaths: [...loaded].sort(), commands: [leave, acknowledge], before: point(before), leftResult: { canonicalSha256: sha(encodeWorld(left)), pending: left.pending }, after: point(after) };
const output = path.join(project, 'tests/fixtures/v35-legacy-incomplete-course.json'); fs.writeFileSync(output, JSON.stringify(fixture) + '\n', { flag: 'wx' });
process.stdout.write(JSON.stringify({ output, bytes: fs.statSync(output).size, sha256: sha(fs.readFileSync(output)), before: fixture.before.canonicalSha256, after: fixture.after.canonicalSha256, sourceBefore: { game: sourceBefore.game, gameAndPersistence: sourceBefore.gameAndPersistence }, sourceAfter: { game: sourceAfter.game, gameAndPersistence: sourceAfter.gameAndPersistence }, commandCount: fixture.commands.length }) + '\n');
