const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', 'docs', 'verification', 'event-writing');
const data = JSON.parse(fs.readFileSync(path.join(root, 'catalogue-review.json'), 'utf8'));
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const paragraph = value => `<p>${escape(value)}</p>`;
function choice(value) {
  return `<section class="choice"><h4>${escape(value.label)}</h4><p class="result-title">${escape(value.title)}</p>${paragraph(value.result)}<p class="journal">Journal: ${escape(value.journal)}</p></section>`;
}
function version(title, story) {
  return `<div><h3>${title}</h3><h4>${escape(story.title)}</h4>${paragraph(story.body)}${story.choices.map(choice).join('')}</div>`;
}
const revised = data.events.filter(event => event.changed);
const cards = revised.map(event => `<article data-search="${escape([event.id, event.after.title, event.reason, ...event.after.choices.map(row => row.result)].join(' ').toLowerCase())}">
<header><h2>${escape(event.after.title)}</h2><code>${escape(event.id)}</code><p>${escape(event.classification)} · ${escape(event.source)}${event.stronger ? ' · larger immediate stakes' : ''}</p></header>
${paragraph(event.reason)}<div class="comparison">${version('Before', event.before)}${version('After', event.after)}</div></article>`).join('\n');
const audit = data.events.map(event => `<tr><td><code>${escape(event.id)}</code></td><td>${escape(event.classification)}${event.changed ? ' · completed' : event.classification === 'Improve' ? ' · candidate outside this batch' : ''}</td><td>${escape(event.reason)}</td></tr>`).join('');
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Dreams — Event and payoff review</title>
<style>body{margin:0;background:#f7f7f5;color:#101c4b;font:16px/1.5 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:28px 20px}h1{line-height:1.15}a{color:#006be6}input{font:inherit;box-sizing:border-box;width:100%;padding:14px;border:1px solid #a4aec2;border-radius:10px;margin:12px 0 24px}article{background:white;padding:24px;border-radius:18px;margin:0 0 28px}header p,.journal{font-size:14px;color:#566580}h2{margin:0 0 8px}h3{padding-bottom:8px;border-bottom:2px solid #dce8fa}h4{margin-bottom:6px}p{margin-top:6px}.comparison{display:grid;grid-template-columns:1fr 1fr;gap:28px}.choice{border-top:1px solid #e5e8ee;padding:8px 0}.result-title{font-weight:700}.journal{font-style:italic}code{overflow-wrap:anywhere;font-size:13px}table{border-collapse:collapse;width:100%;background:white}td{padding:10px;border-bottom:1px solid #e5e8ee;vertical-align:top}summary{cursor:pointer;font-weight:700;margin-bottom:20px}[hidden]{display:none}@media(max-width:700px){.comparison{grid-template-columns:1fr}article{padding:18px}td{font-size:13px}}</style>
<main><h1>Every choice needs a payoff.</h1><p>${data.counts.audited} events audited. ${data.counts.revised} revised events, ${data.counts.revisedResults} reviewed result branches, ${data.counts.stronger} larger immediate-consequence upgrades. All existing event and choice IDs remain.</p>
<p>Baseline: <code>${escape(data.baseline)}</code>. Ordinary scenes show authored live-binding tokens such as {friend} and {money}. Dramatic scenes show actual resolved fixture outcomes, including their real financial and legal terms. This is an editorial report; the game’s popup design is unchanged.</p>
<p><a href="README.md">Verification and scope</a> · <a href="catalogue-review.json">Complete audit data</a></p>
<label for="search">Find a situation or result</label><input id="search" type="search" placeholder="Search titles, writing or event IDs"><p id="count">${revised.length} revised events</p>${cards}
<details><summary>All ${data.counts.audited} audit decisions</summary><table><thead><tr><th>Event</th><th>Decision</th><th>Reason</th></tr></thead><tbody>${audit}</tbody></table></details></main>
<script>const search=document.querySelector('#search'),cards=[...document.querySelectorAll('article')];search.addEventListener('input',()=>{const value=search.value.trim().toLowerCase();let count=0;for(const card of cards){card.hidden=!card.dataset.search.includes(value);if(!card.hidden)count++;}document.querySelector('#count').textContent=count+' revised events';});</script></html>`;
fs.writeFileSync(path.join(root, 'index.html'), html);
process.stdout.write(JSON.stringify(data.counts) + '\n');
