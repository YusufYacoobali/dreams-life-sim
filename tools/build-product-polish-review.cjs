// Production React Native trees laid out by a browser CSS/SVG adapter.
// This evidence is not an Android/iOS device capture.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const base = process.env.DREAMS_POLISH_TREE_BASE || '/tmp/dreams-polish';
const out = process.env.DREAMS_POLISH_REVIEW_HTML || '/tmp/dreams-polish-review.html';
const assets = {}, trees = {}, pairs = [];
function portableSources(node) {
  if (Array.isArray(node)) { node.forEach(portableSources); return node; }
  if (!node || typeof node !== 'object') return node;
  for (const object of [node.props, node.props?.svg]) {
    const source = object?.source || object?.src, marker = source?.testUri?.lastIndexOf('assets/generated/');
    if (marker >= 0) source.testUri = '../../../' + source.testUri.slice(marker);
  }
  node.children?.forEach(portableSources); return node;
}
function asset(file) {
  const bytes = fs.readFileSync(file), key = crypto.createHash('sha256').update(bytes).digest('hex');
  assets[key] ||= bytes.toString('base64'); return key;
}
function prepare(node) {
  if (Array.isArray(node)) return node.map(prepare);
  if (!node || typeof node !== 'object') return node;
  for (const obj of [node.props, node.props?.svg]) {
    const source = obj?.source || obj?.src;
    if (source?.testUri) obj.asset = asset(path.resolve(root, 'node_modules/react-native/jest', source.testUri));
  }
  if (node.type?.includes('ScrollView') && node.props?.contentContainerStyle && node.children?.[0]?.props)
    node.children[0].props.style = { ...node.children[0].props.style, ...node.props.contentContainerStyle };
  node.children = node.children?.map(prepare); return node;
}
const files = [...new Set(['before', 'after'].flatMap(version => fs.readdirSync(base + '-' + version)))].filter(file => file.endsWith('.json')).sort();
for (const file of files) {
  const name = file.slice(0, -5), versions = ['before', 'after'].filter(version => fs.existsSync(path.join(base + '-' + version, file)));
  for (const version of versions) {
    const tree = portableSources(JSON.parse(fs.readFileSync(path.join(base + '-' + version, file), 'utf8')));
    if (process.env.DREAMS_POLISH_ARCHIVE_TREES) {
      const archive = path.join(root, 'docs/verification/product-polish/trees-' + version);
      fs.mkdirSync(archive, { recursive: true }); fs.writeFileSync(path.join(archive, file), JSON.stringify(tree) + '\n');
    }
    trees[name + '-' + version] = prepare(tree);
  }
  const large = name.endsWith('dark-large');
  pairs.push({ name, versions, width: large ? 320 : 390, fontScale: large ? /^(travel|emigration|destinations|trip-companions)/.test(name) ? 1.6 : 1.4 : 1 });
}
const font = fs.readFileSync(path.join(root, 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf')).toString('base64');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Dreams · product polish review</title><style>
@font-face{font-family:Ionicons;src:url(data:font/ttf;base64,${font})}*{box-sizing:border-box}body{margin:0;background:#e9edf3;color:#0b1545;font:15px/1.5 system-ui,sans-serif}main{max-width:900px;margin:auto;padding:24px}h1{font-size:28px}h2{margin:0 0 12px;font-size:20px}h3{margin:4px 0 10px;font-size:15px}.pair{background:#fff;padding:20px;margin:24px 0;border-radius:16px;display:flow-root}.versions{display:flex;gap:20px;align-items:flex-start}.phone{height:844px;overflow:hidden;display:flex;flex-direction:column;background:#f8f7f5;outline:1px solid #d9e0e9;border-radius:10px;isolation:isolate}.rn{display:flex;flex-direction:column;position:relative;align-items:stretch;flex-shrink:0;min-width:0;border:0 solid transparent;font-family:Arial,sans-serif;line-height:normal}.rn-text{display:block;white-space:pre-wrap;overflow-wrap:break-word;max-width:100%;font-size:14px}.rn-image{display:block;object-fit:fill}.rn-scroll{overflow:auto;min-height:0;scrollbar-width:none;flex-grow:1;flex-shrink:1}.rn-modal{flex:1;min-height:0}.native-root{flex:1;min-height:0}.rn-input{display:block;min-width:0}p{max-width:90ch}.note{color:#5d6d87}.version{flex-shrink:0}
@media(max-width:760px){main{padding:12px}.pair{padding:12px}.versions{flex-wrap:wrap}.phone{max-width:calc(100vw - 48px)}}
</style><main><h1>Dreams · product polish</h1><p>Before and after, exported from the production React Native screen trees. These browser captures compare the application styles, artwork and content. They do not reproduce native text shaping, routing or GPU rendering.</p><p class="note">Light: 390 × 844. Dark: 320 × 844 with larger text (1.4×; travel 1.6×). Ionicons use their bundled font. No network assets. Android and iOS layout branches are also exercised in component checks; no simulator or physical-device capture is claimed.</p>
${pairs.map(pair => `<section class="pair" id="${escape(pair.name)}"><h2>${escape(pair.name.replaceAll('-', ' '))}</h2><div class="versions">${pair.versions.map(version => `<div class="version"><h3>${version === 'before' ? 'Before · work 8891d4d' : 'After · integrated polish'}</h3><div class="phone" style="width:${pair.width}px" data-tree="${escape(pair.name + '-' + version)}" data-font-scale="${pair.fontScale}"></div></div>`).join('')}</div></section>`).join('')}</main>
<script>const trees=${JSON.stringify(trees).replace(/</g, '\\u003c')},encodedAssets=${JSON.stringify(assets)};
const urls={};for(const[key,base64]of Object.entries(encodedAssets)){const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));urls[key]=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));}
const unitless=new Set(['flex','flexGrow','flexShrink','opacity','zIndex','fontWeight','aspectRatio']);
function applyStyles(el,style){for(let[key,value]of Object.entries(style||{})){if(value==null)continue;if(key==='paddingHorizontal'||key==='marginHorizontal'){const prefix=key.startsWith('padding')?'padding':'margin';el.style[prefix+'Left']=value+'px';el.style[prefix+'Right']=value+'px';continue;}if(key==='paddingVertical'||key==='marginVertical'){const prefix=key.startsWith('padding')?'padding':'margin';el.style[prefix+'Top']=value+'px';el.style[prefix+'Bottom']=value+'px';continue;}if(key==='flex'&&typeof value==='number'){el.style.flex=value+' 1 0%';el.style.minHeight='0';continue;}if(key==='transform'&&Array.isArray(value)){el.style.transform=value.flatMap(t=>Object.entries(t).map(([k,v])=>k+'('+v+(typeof v==='number'&&k.startsWith('translate')?'px':'')+')')).join(' ');continue;}if(key.startsWith('shadow')||key==='elevation'||key==='includeFontPadding')continue;try{el.style[key]=typeof value==='number'&&!unitless.has(key)?value+'px':String(value);}catch{}}}
let svgSerial=0;function svgNode(tree,scope,scale){const p=tree.props.svg,root=tree.type.startsWith('RNSVGSvgView'),names={RNSVGGroup:'g',RNSVGDefs:'defs',RNSVGClipPath:'clipPath',RNSVGPath:'path',RNSVGImage:'image'};if(root)scope='review-svg-'+(++svgSerial)+'-';const el=document.createElementNS('http://www.w3.org/2000/svg',root?'svg':names[tree.type]);if(root){applyStyles(el,tree.props.style);el.setAttribute('viewBox',[p.minX,p.minY,p.vbWidth,p.vbHeight].join(' '));}for(const k of ['x','y','width','height','d'])if(p[k]!=null)el.setAttribute(k,p[k]);if(p.name)el.id=scope+p.name;if(p.matrix)el.setAttribute('transform','matrix('+p.matrix.join(' ')+')');if(p.clipPath)el.setAttribute('clip-path','url(#'+scope+p.clipPath+')');if(p.asset){el.setAttribute('href',urls[p.asset]);el.setAttribute('preserveAspectRatio',p.align==='none'?'none':'xMidYMid meet');}for(const child of tree.children||[])el.append(node(child,false,scope,scale));return el;}
function node(tree,nestedText=false,scope,scale=1){if(tree?.props?.svg)return svgNode(tree,scope,scale);if(tree==null)return document.createDocumentFragment();if(Array.isArray(tree)){const f=document.createDocumentFragment();tree.forEach(t=>f.append(node(t,false,scope,scale)));return f;}if(typeof tree!=='object')return document.createTextNode(String(tree));const text=tree.type==='Text',image=!!tree.props?.asset;const el=document.createElement(image?'img':text&&nestedText?'span':'div');el.className='rn'+(text?' rn-text':'')+(image?' rn-image':'')+(tree.type?.includes('ScrollView')?' rn-scroll':'')+(tree.type==='Modal'?' rn-modal':'');el.dataset.nativeType=tree.type;if(text&&nestedText)el.style.display='inline';applyStyles(el,tree.props?.style);if(text&&scale!==1&&tree.props?.allowFontScaling!==false&&el.style.fontFamily!=='Ionicons'&&!(tree.children?.[0]==='‹')){const style=tree.props?.style||{};el.style.fontSize=(style.fontSize||14)*scale+'px';if(typeof style.lineHeight==='number')el.style.lineHeight=style.lineHeight*scale+'px';}if(tree.type==='RNCSafeAreaView'){const edges=tree.props?.edges||['top','bottom'];const hasEdge=key=>Array.isArray(edges)?edges.includes(key):edges[key]&&edges[key]!=='off';if(hasEdge('top'))el.style.paddingTop='47px';if(hasEdge('bottom'))el.style.paddingBottom='34px';}if(tree.props?.accessibilityLabel)el.setAttribute('aria-label',tree.props.accessibilityLabel);if(tree.props?.accessibilityRole)el.setAttribute('role',tree.props.accessibilityRole);if(tree.type==='TextInput'){el.classList.add('rn-input');el.textContent=tree.props?.value||tree.props?.placeholder||'Search';}if(image){el.src=urls[tree.props.asset];el.alt='';if(tree.props?.resizeMode==='contain')el.style.objectFit='contain';}else(tree.children||[]).forEach(child=>el.append(node(child,text,scope,scale)));return el;}
for(const target of document.querySelectorAll('[data-tree]')){const dom=node(trees[target.dataset.tree],false,undefined,+target.dataset.fontScale);if(dom.classList)dom.classList.add('native-root');target.append(dom);}
const svgImages=[...document.querySelectorAll('svg image')].map(svg=>{const image=new Image();image.src=svg.getAttribute('href');return image;});window.polishReviewReady=Promise.all([...document.images,...svgImages].map(image=>image.decode())).then(()=>document.fonts.ready);
</script></html>`;
fs.writeFileSync(out, html); console.log(JSON.stringify({ html: out, pairs: pairs.length, trees: Object.keys(trees).length, uniqueAssets: Object.keys(assets).length }));
