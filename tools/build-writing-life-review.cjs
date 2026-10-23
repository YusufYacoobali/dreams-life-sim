const fs = require('node:fs');
const path = require('node:path');
const input = process.argv[2];
const revision = process.argv[3];
if (!input || !/^[0-9a-f]{7,40}$/.test(revision ?? '')) throw new Error('Usage: node tools/build-writing-life-review.cjs <recorded-lives-directory> <runtime-revision>');
const root = path.resolve(__dirname, '..', 'docs', 'verification', 'event-writing');
const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'catalogue-review.json'), 'utf8'));
const ids = new Set(catalogue.events.map(row => row.id));
const revised = new Set(catalogue.events.filter(row => row.changed).map(row => row.id));
const lives = fs.readdirSync(input).filter(name => /^seed-\d+\.json$/.test(name)).map(name => JSON.parse(fs.readFileSync(path.join(input, name), 'utf8'))).sort((a, b) => a.seed - b.seed);
if (lives.length !== 36 || lives.some((life, seed) => life.seed !== seed || !life.completed)) throw new Error('Expected all 36 distinct, completed natural lives');
const encounters = {}, repeats = [], unresolved = [], missingResults = [];
for (const life of lives) {
  const previous = new Map();
  for (const event of life.decisions) {
    if (!event.result && !event.died) missingResults.push({ seed: life.seed, id: event.eventId });
    for (const text of [event.situation, ...event.choices.map(row => row.label), event.result?.body ?? '', ...event.journal.map(row => row.text)]) if (/\{[A-Za-z]+\}|\bundefined\b/.test(text)) unresolved.push({ seed: life.seed, id: event.eventId, text });
    if (!ids.has(event.templateId)) continue;
    const last = previous.get(event.templateId);
    if (last !== undefined && event.date.year - last < 5) repeats.push({ seed: life.seed, id: event.templateId, previous: last, year: event.date.year });
    previous.set(event.templateId, event.date.year);
    encounters[event.templateId] = (encounters[event.templateId] ?? 0) + 1;
  }
}
if (repeats.length || unresolved.length || missingResults.length) throw new Error(JSON.stringify({ repeats, unresolved, missingResults }));
const output = path.join(root, 'natural-lives');
fs.mkdirSync(output, { recursive: true });
for (const life of lives) fs.writeFileSync(path.join(output, 'seed-' + life.seed + '.json'), JSON.stringify(life, null, 2) + '\n');
const summary = { runtimeRevision: revision, lives: lives.length, allCompleted: true,
  strategy: 'Existing engine lifetime test: first currently available choice, no manually configured employment or relationships. Other branch/domain paths use focused fixtures.',
  countries: [...new Set(lives.map(row => row.country))].sort(), genders: [...new Set(lives.map(row => row.gender))].sort(),
  ageRange: [Math.min(...lives.map(row => row.ageAtDeath)), Math.max(...lives.map(row => row.ageAtDeath))],
  decisions: lives.reduce((count, life) => count + life.decisions.length, 0), catalogueEncounters: Object.values(encounters).reduce((a, b) => a + b, 0),
  revisedEncounters: Object.entries(encounters).filter(([id]) => revised.has(id)).reduce((count, [, n]) => count + n, 0),
  distinctRevisedEncounters: Object.keys(encounters).filter(id => revised.has(id)).length,
  cooldownViolations: repeats, unresolvedTokens: unresolved, missingNonfatalResults: missingResults,
  perLife: lives.map(life => ({ seed: life.seed, country: life.country, gender: life.gender, ageAtDeath: life.ageAtDeath,
    decisions: life.decisions.length, revisedEncounters: life.decisions.filter(row => revised.has(row.templateId)).length,
    journalEntries: life.journal.length, file: 'natural-lives/seed-' + life.seed + '.json' })), encounters };
fs.writeFileSync(path.join(root, 'lifetime-summary.json'), JSON.stringify(summary, null, 2) + '\n');
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pages = lives.map(life => `<details><summary>Seed ${life.seed} · ${escape(life.country)} · ${escape(life.gender)} · age ${life.ageAtDeath} · ${life.decisions.length} choices</summary><p><a href="seed-${life.seed}.json">Complete recorded journal and decisions</a></p>${life.decisions.map(event => `<article><p>Age ${event.age} · ${escape(event.templateId)}${revised.has(event.templateId) ? ' · revised' : ''}</p><h3>${escape(event.title)}</h3><p>${escape(event.situation)}</p><ul>${event.choices.map(choice => `<li>${choice.id === event.selected ? '<strong>' : ''}${escape(choice.label)}${choice.id === event.selected ? '</strong> — chosen' : ''}</li>`).join('')}</ul>${event.result ? `<h4>${escape(event.result.title)}</h4><p>${escape(event.result.body)}</p><ul>${event.result.effects.map(row => `<li>${escape(row.label)}: ${escape(row.value)}</li>`).join('')}</ul>` : '<p>This choice ended the life; no ordinary result popup followed.</p>'}<p><em>${event.journal.map(row => escape(row.text)).join(' ')}</em></p></article>`).join('')}</details>`).join('');
fs.writeFileSync(path.join(output, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Dreams — Natural lifetime writing review</title><style>body{font:16px/1.5 system-ui;color:#101c4b;background:#f7f7f5;margin:auto;max-width:900px;padding:24px}summary{cursor:pointer;font-weight:700;padding:12px 0}article{padding:20px;background:white;border-radius:14px;margin-bottom:16px}h3,h4{margin-bottom:6px}p{margin-top:6px}a{color:#006be6}</style><h1>36 complete natural lives</h1><p>${summary.decisions} decisions; ${summary.revisedEncounters} revised-story encounters across ${summary.distinctRevisedEncounters} different revised situations. Every life completed. No five-year cooldown violation, missing nonfatal result or unresolved binding token.</p><p>These are actual commands, results and journals from the engine lifetime tests at ${escape(revision)}. The strategy always takes the first available choice; it does not manually create careers, relationships or hobbies. Focused tests exercise every revised alternative and its required domain context.</p><p><a href="../README.md">Verification</a> · <a href="../lifetime-summary.json">Summary data</a></p>${pages}</html>`);
process.stdout.write(JSON.stringify({ lives: summary.lives, countries: summary.countries.length, genders: summary.genders.length, decisions: summary.decisions, revisedEncounters: summary.revisedEncounters, distinctRevisedEncounters: summary.distinctRevisedEncounters }) + '\n');
