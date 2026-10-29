// Reproducible content review; creates sample worlds in memory, never saved lives.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const ts = require('typescript'), { createHash } = require('node:crypto');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, file);
const { createLife, randomCreation } = require('../src/game/createLife.ts');
const { encodeWorld } = require('../src/game/model.ts');
const { birthFamily, selectBirthStory } = require('../src/game/birthJournal.ts');
const output = path.resolve(process.argv[2] || path.join(os.tmpdir(), 'dreams-birth-journal-review'));
const samples = [], stories = new Set(), countries = new Set(), genders = new Set(), hash = createHash('sha256');
const counts = { ordinary: 0, funny: 0, unusual: 0, bizarre: 0 }, families = { single: 0, two: 0, royal: 0 };
for (let seed = 0; seed < 512; seed++) {
  const input = randomCreation(seed);
  input.background = seed % 4 === 0 && ['GB', 'ES', 'JP'].includes(input.country) ? 'royal' : 'ordinary';
  const world = createLife('life_birth_sample_' + seed, seed, input, { year: 2026, month: 10, day: 22 });
  const family = birthFamily(world), story = selectBirthStory(seed, family.context);
  countries.add(input.country); genders.add(input.gender); if (story) stories.add(story.id);
  counts[story?.tone ?? 'ordinary']++; families[family.parents.length === 1 ? 'single' : 'two']++; if (family.royal) families.royal++;
  hash.update(encodeWorld({ ...world, journal: [] }) + '\n');
  samples.push({ seed, country: input.country, gender: input.gender, royal: !!family.royal, parents: family.parents.length, story: story?.id ?? null, tone: story?.tone ?? 'ordinary', entries: world.journal.map(entry => entry.text) });
}
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'samples.json'), JSON.stringify(samples, null, 2) + '\n');
fs.writeFileSync(path.join(output, 'samples.txt'), samples.map(sample => sample.seed + ' | ' + sample.country + ' | ' + sample.gender + ' | ' + sample.parents + ' parent(s) | ' + (sample.story ?? 'ordinary') + '\n' + sample.entries.join('\n')).join('\n\n') + '\n');
const summary = { samples: samples.length, countries: countries.size, genders: genders.size, distinctAnecdotes: stories.size, counts, families, nonJournalSha256: hash.digest('hex'), output };
fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary));
