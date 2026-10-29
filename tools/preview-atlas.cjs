// Browser sprite clipping review only; not app/native UI acceptance.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const manifestPath = path.resolve(process.argv[2] ?? 'docs/planning/drafts/pets-leisure-art.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')), atlas = path.resolve(path.dirname(manifestPath), manifest.image), [width, height] = manifest.atlasSize;
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
let html = '<!doctype html><meta charset="utf-8"><title>' + escape(manifest.title) + '</title><style>body{margin:20px;font:14px system-ui;background:#e8ecf2}h1{font-size:22px}h2{font-size:16px}.grid{display:grid;grid-template-columns:repeat(8,154px);gap:8px;margin-bottom:14px}.card{border-radius:14px;text-align:center;padding:8px}.frame{display:flex;align-items:center;justify-content:center;margin:auto}p{margin:8px 0 2px}</style><h1>' + escape(manifest.title) + ' — browser alpha/clipping review</h1>';
for (const [theme, background, ink] of [['light', '#FFFFFF', '#0B1545'], ['dark', '#253247', '#F6F8FF']]) for (const size of [128, 48]) {
  html += '<h2>' + theme + ' cards · ' + size + 'px</h2><div class="grid">';
  for (const [id, [x, y, w, h]] of Object.entries(manifest.rects)) {
    const scale = size / Math.max(w, h);
    html += `<div class="card" style="background:${background};color:${ink}"><div class="frame" style="width:${size}px;height:${size}px"><div style="position:relative;overflow:hidden;width:${w * scale}px;height:${h * scale}px"><img src="/atlas.png" style="position:absolute;width:${width * scale}px;height:${height * scale}px;left:${-x * scale}px;top:${-y * scale}px"></div></div><p>${escape(id)}</p></div>`;
  }
  html += '</div>';
}
const port = Number(process.argv[3] ?? 8095);
http.createServer((request, response) => {
  if (request.url === '/atlas.png') { response.setHeader('Content-Type', 'image/png'); response.end(fs.readFileSync(atlas)); }
  else { response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(html); }
}).listen(port, '127.0.0.1', () => process.stdout.write('Atlas inspection on 127.0.0.1:' + port + '\n'));
