// Visual inspection harness for the same measured clipping/tint layout as native.
// Run with node tools/preview-portraits.cjs; no production web build is implied.
const fs = require('node:fs');
const http = require('node:http');
const ts = require('typescript');
const path = require('node:path');
const moduleForLayout = { exports: {} };
new Function('module', 'exports', ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/assets/portraitLayout.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(moduleForLayout, moduleForLayout.exports);
const { headRects, hairRects, skinTones, hairColors, faceScales, portraitAgeStage, ageingHairColor } = moduleForLayout.exports;
function layer(rect, color, width, left, top) {
  const [x, y, w, h] = rect; const scale = width / w;
  const image = `position:absolute;width:${1254 * scale}px;height:${1254 * scale}px;left:${-x * scale}px;top:${-y * scale}px;`;
  return `<div style="position:absolute;left:${left}px;top:${top}px;width:${width}px;height:${h * scale}px;overflow:hidden;isolation:isolate"><div style="${image}background:${color};mask:url(/atlas.png) 0 0/100% 100%"></div><img src="/atlas.png" style="${image}mix-blend-mode:multiply"></div>`;
}
function portrait(age, skin, hair, face = 0) {
  const size = 120; const [scaleX, scaleY] = faceScales[face];
  return `<div><div style="position:relative;width:${size}px;height:${size}px;background:#EAF0F8;border-radius:50%;overflow:hidden"><div style="position:absolute;width:${size}px;height:${size}px;transform:scale(${scaleX},${scaleY})">${layer(headRects[portraitAgeStage(age)], skinTones[skin], size * .69, size * .155, size * .14)}${age >= 3 && hair ? layer(hairRects[hair], ageingHairColor(hairColors[hair % 5], age), size * (hair >= 4 ? .9 : .78), size * (hair >= 4 ? .05 : .11), size * (hair === 6 ? -.03 : .06)) : ''}</div></div><p>Age ${age}, tone ${skin}, hair ${hair}</p></div>`;
}
const html = `<!doctype html><meta charset="utf-8"><title>Dreams portrait layer inspection</title><body style="background:#F8F7F5;color:#0B1545;font:13px system-ui;padding:24px"><h1>Generated layer feasibility — 120px</h1><h2>Same DNA through eight ages</h2><div style="display:flex;gap:18px">${[1,6,15,25,45,65,85,100].map(age => portrait(age,2,3)).join('')}</div><h2>Skin and hair coverage</h2><div style="display:grid;grid-template-columns:repeat(8,145px);gap:15px">${Array.from({length:24}, (_,i)=>portrait(25,i%6,i%8,i%4)).join('')}</div>`;
http.createServer((request,response)=>{
  if(request.url === '/atlas.png') {response.setHeader('Content-Type','image/png');response.end(fs.readFileSync(path.join(__dirname,'../assets/generated/portrait-layers.png')));}
  else {response.setHeader('Content-Type','text/html');response.end(html);}
}).listen(8094,'127.0.0.1',()=>process.stdout.write('Portrait inspection listening on 127.0.0.1:8094\n'));
