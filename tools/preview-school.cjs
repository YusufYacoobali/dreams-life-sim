// Browser clipping/alpha inspection only; this is not native UI acceptance.
const fs = require('node:fs'), http = require('node:http'), path = require('node:path'), ts = require('typescript');
const layout = { exports: {} };
new Function('module', 'exports', ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/assets/schoolLayout.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(layout, layout.exports);
const { schoolRects, schoolAtlasSize: [atlasWidth, atlasHeight] } = layout.exports;
let html = '<!doctype html><meta charset="utf-8"><title>School artwork inspection</title><style>body{margin:20px;font:14px system-ui;background:#eceff4}h1{font-size:22px}h2{font-size:16px}.grid{display:grid;grid-template-columns:repeat(6,154px);gap:8px;margin-bottom:14px}.card{border-radius:14px;text-align:center;padding:8px}.frame{display:flex;align-items:center;justify-content:center;margin:auto}</style><h1>School artwork — original PNG clipping and alpha</h1>';
for (const [theme, background, ink] of [['light', '#fff', '#0b1545'], ['dark', '#111b2b', '#f3f5fa']]) for (const size of [128, 48]) {
  html += '<h2>' + theme + ' cards · ' + size + 'px</h2><div class="grid">';
  for (const [id, [x, y, width, height]] of Object.entries(schoolRects)) {
    const scale = size / Math.max(width, height);
    html += `<div class="card" style="background:${background};color:${ink}"><div class="frame" style="width:${size}px;height:${size}px"><div style="position:relative;overflow:hidden;width:${width * scale}px;height:${height * scale}px"><img src="/atlas.png" style="position:absolute;width:${atlasWidth * scale}px;height:${atlasHeight * scale}px;left:${-x * scale}px;top:${-y * scale}px"></div></div><p>${id}</p></div>`;
  }
  html += '</div>';
}
const port = Number(process.argv[2] ?? 8094);
http.createServer((request, response) => {
  if (request.url === '/atlas.png') { response.setHeader('Content-Type', 'image/png'); response.end(fs.readFileSync(path.join(__dirname, '../assets/generated/school-atlas.png'))); }
  else { response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(html); }
}).listen(port, '127.0.0.1', () => process.stdout.write('School artwork inspection listening on 127.0.0.1:' + port + '\n'));
