// Actual production RN components rendered with react-native-web. No device claim.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'..'),source=process.env.DREAMS_REVIEW_SOURCE_ROOT||root;
const toolRoot=process.env.DREAMS_REVIEW_TOOLS||'/tmp/dreams-polish3-tools';
const requireTool=createRequire(path.join(toolRoot,'package.json'));
const esbuild=requireTool('esbuild'),{chromium}=requireTool('playwright');
const output=path.resolve(process.argv[2]||'/tmp/dreams-polish3-review');fs.mkdirSync(output,{recursive:true});fs.rmSync(path.join(output,'browser.json'),{force:true});
async function main(){
 await esbuild.build({entryPoints:[path.join(root,'tools/polish3-review/scene.tsx')],bundle:true,outfile:path.join(output,'scene.js'),platform:'browser',format:'iife',
  banner:{js:'var process={env:{NODE_ENV:"development"}};var global=globalThis;'},define:{'process.env.NODE_ENV':'"development"',__DEV__:'true','process.env.EXPO_OS':'"web"'},
  resolveExtensions:['.web.tsx','.web.ts','.web.jsx','.web.js','.tsx','.ts','.jsx','.js','.json'],
  alias:{'review-native-web':path.join(toolRoot,'node_modules/react-native-web'),react:path.join(root,'node_modules/react'),'react-dom':path.join(root,'node_modules/react-dom')},
  plugins:[{name:'isolated-polish-review',setup(build){
   build.onResolve({filter:/^react-native$/},()=>({path:path.join(root,'tools/polish3-review/native.tsx')}));
   build.onResolve({filter:/state\/useGame$/},()=>({path:path.join(root,'tools/polish3-review/state.ts')}));
   build.onResolve({filter:/ui\/GodModeAccess$/},()=>({path:'access',namespace:'review'}));
   build.onResolve({filter:/state\/usePreferences$/},()=>({path:'preferences',namespace:'review'}));
   build.onResolve({filter:/^expo-router$/},()=>({path:'router',namespace:'review'}));
   build.onResolve({filter:/^@expo\/vector-icons\/Ionicons$/},()=>({path:'icons',namespace:'review'}));
   build.onResolve({filter:/^node:async_hooks$/},()=>({path:'server',namespace:'review'}));
   build.onLoad({filter:/.*/,namespace:'review'},({path:name})=>({contents:
    name==='access'?'export const useGodModeAccess=()=>false;export const GodModeShortcut=()=>null;export const GodModeSettings=()=>null;':
    name==='preferences'?'export const usePreferences=select=>select({ready:true,loadFailed:false,settings:{soundEffects:false,reducedMotion:true,godModeEnabled:false}});':
    name==='router'?`import{useEffect}from 'react';import{reviewParams}from '${path.join(root,'tools/polish3-review/state.ts')}';export const useLocalSearchParams=()=>reviewParams;export const useGlobalSearchParams=()=>reviewParams;export const usePathname=()=>location.pathname;export const useFocusEffect=cb=>useEffect(cb,[cb]);const go=href=>{const p=typeof href==='string'?href:href.pathname;const map={'/jobs':'jobs','/assets':'assets','/profile':'profile','/finances':'finances','/offer/[id]':'offer','/shopping/[kind]':'shopping','/rental/[id]':'rental','/person/[id]':'person','/rentals':'shopping'};if(map[p]){const q=new URLSearchParams({screen:map[p],...(href.params||{})});location.search=q.toString();}};export const router={push:go,replace:go,navigate:go,back(){history.back();}};export const Redirect=()=>null;`:
    name==='icons'?`import React from '${path.join(root,'node_modules/react')}';import{Text}from 'react-native';import glyphs from '${path.join(root,'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json')}';export default function Icon({name,size,color,style,...props}){return React.createElement(Text,{...props,style:[{fontFamily:'Ionicons',fontSize:size,color},style]},String.fromCodePoint(glyphs[name]||glyphs['ellipse-outline']));}`:
    'export class AsyncLocalStorage{constructor(){throw Error("No server context in review")}}',loader:'jsx',resolveDir:root}));
   if(source!==root)build.onResolve({filter:/^\.\.?\//},args=>{const candidate=path.resolve(path.dirname(args.importer),args.path);for(const folder of ['src','app'])if(candidate.startsWith(path.join(root,folder)+path.sep))return{path:resolveFile(path.join(source,path.relative(root,candidate)))};});
  }}],loader:{'.js':'jsx','.ttf':'file','.png':'file','.webp':'file','.wav':'file'},logLevel:'warning'});
 const font=fs.readFileSync(path.join(root,'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf')).toString('base64');
 fs.writeFileSync(path.join(output,'index.html'),`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>@font-face{font-family:Ionicons;src:url(data:font/ttf;base64,${font})}html,body,#root{margin:0;width:100%;height:100%;overflow:hidden}#root{display:flex}#root>div{flex:1}</style><div id="root"></div><script src="/scene.js"></script>`);
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname,file=path.join(output,pathname==='/'?'index.html':pathname);if(!file.startsWith(output+path.sep))return res.writeHead(403).end();res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.png')?'image/png':file.endsWith('.webp')?'image/webp':'text/html');fs.createReadStream(file).on('error',()=>res.writeHead(404).end()).pipe(res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={renderer:'Chromium/react-native-web; actual production components; ephemeral review state',sourceRevision:process.env.DREAMS_REVIEW_REVISION||'working tree',nativeDevice:false,captures:[],errors:[],requests:[]};
 try{
  const cases=[['assets',''],['profile',''],['finances',''],['person-teacher','screen=person&role=teacher'],['person-father','screen=person&role=father'],['person-spouse','screen=person&role=spouse'],['person-child','screen=person&role=child'],['money-result','screen=support&role=father&variant=money'],['loan-offer','screen=support&role=father&variant=loan'],['loan-accepted','screen=support&role=father&variant=accepted'],['jobs',''],['jobs-all','screen=jobs&all=1'],['job-details','screen=jobs&all=1&job=Barista'],['property-catalogue','screen=shopping&kind=property'],['property-cash','screen=offer&id=studio'],['property-mortgage','screen=offer&id=studio&method=mortgage'],['property-rent',source===root?'screen=offer&id=studio&method=rent':'screen=rental&id=studio'],['vehicle','screen=offer&id=used-compact']];
  for(const mode of [{name:'light',width:390,height:844,theme:'light',large:'0'},{name:'dark-large',width:320,height:844,theme:'dark',large:'1'}]){
   const page=await browser.newPage({viewport:{width:mode.width,height:mode.height},deviceScaleFactor:1});
   page.on('pageerror',error=>{report.errors.push({view:mode.name,message:String(error)});console.error(String(error));});page.on('request',req=>{if(!req.url().startsWith('http://127.0.0.1:')&&!req.url().startsWith('data:'))report.requests.push(req.url());});
   for(const [name,args]of cases.filter(([name])=>!process.env.DREAMS_REVIEW_CASES||process.env.DREAMS_REVIEW_CASES.split(',').includes(name))){
    console.log('Capturing',name,mode.name);
    await page.goto('http://127.0.0.1:'+server.address().port+'/?'+(args||'screen='+name)+'&theme='+mode.theme+'&large='+mode.large);
    await page.waitForFunction(()=>!!window.polish3);await page.waitForTimeout(350);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
    if(source!==root&&name==='property-mortgage'){await page.getByText('Mortgage',{exact:true}).click();await page.waitForTimeout(100);}
    if(name==='jobs-all'||name==='job-details'){await page.getByRole('button',{name:'Show All Requirements',exact:true}).click();await page.waitForTimeout(150);}
    if(name==='job-details'){await page.getByText('Barista',{exact:true}).click();await page.waitForTimeout(150);}
    const file=name+'-'+mode.name+'.png';await page.screenshot({path:path.join(output,file)});report.captures.push(file);
    const broken=await page.evaluate(()=>[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));if(broken.length)report.errors.push({view:file,broken});
    const scrolled=await page.evaluate(()=>{const scrollers=[...document.querySelectorAll('div')].filter(n=>n.scrollHeight>n.clientHeight+10&&['auto','scroll'].includes(getComputedStyle(n).overflowY));scrollers.forEach(n=>n.scrollTop=n.scrollHeight);return scrollers.length>0;});
    if(scrolled){await page.waitForTimeout(150);const bottom=name+'-'+mode.name+'-bottom.png';await page.screenshot({path:path.join(output,bottom)});report.captures.push(bottom);}
   }
   await page.close();
  }
  const page=await browser.newPage({viewport:{width:1168,height:1900},deviceScaleFactor:1});
  await page.goto('http://127.0.0.1:'+server.address().port+'/?screen=portraits');await page.waitForFunction(()=>window.polish3?.galleryPeople?.length===112);await page.waitForTimeout(700);
  await page.evaluate(()=>{const root=document.querySelector('#root');root.style.height='auto';root.style.minHeight='100vh';document.body.style.overflow='auto';document.documentElement.style.overflow='auto';});
  await page.screenshot({path:path.join(output,'portrait-defaults.png'),fullPage:true});report.captures.push('portrait-defaults.png');
  fs.writeFileSync(path.join(output,'browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
  if(report.errors.length||report.requests.length)throw Error('Visual review had errors');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
function resolveFile(candidate){for(const suffix of ['.tsx','.ts','.js','.json','/index.tsx','/index.ts'])if(fs.existsSync(candidate+suffix))return candidate+suffix;if(fs.existsSync(candidate))return candidate;throw Error('Cannot resolve '+candidate);}
main().catch(error=>{console.error(error);process.exitCode=1;});
