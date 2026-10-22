// Offline visual inspection of the production illustration plan.
// Run: node tools/preview-portraits.cjs
require('./build-avatar-v2-review.cjs');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const directory = path.resolve(__dirname,'../docs/verification/avatar-v2-implementation');
http.createServer((request,response)=>{
  const name = request.url === '/' ? 'index.html' : request.url.slice(1);
  // Only report files directly inside the review directory are served.
  if (!/^[a-zA-Z0-9_.-]+$/.test(name)) { response.writeHead(404); response.end(); return; }
  const file = path.join(directory,name);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { response.writeHead(404); response.end(); return; }
  response.setHeader('Content-Type',name.endsWith('.png')?'image/png':name.endsWith('.json')?'application/json':name.endsWith('.html')?'text/html; charset=utf-8':'text/plain; charset=utf-8');
  response.end(fs.readFileSync(file));
}).listen(8094,'127.0.0.1',()=>process.stdout.write('Portrait review listening on http://127.0.0.1:8094\n'));
