// Produce ordinary V4 Dreams archives readable by both device builds. The
// original identity, canonical world, RNG and all history remain literal.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{runtime,sha}=require('./scaling-runtime.cjs');
const flags={};for(let i=2;i<process.argv.length;i+=2)flags[process.argv[i]]=process.argv[i+1];
const api=runtime(flags['--source']??path.join(__dirname,'..'),undefined,{instrument:false}),{decodeSave}=api.load('src/persistence/archive.ts'),sourceHash=api.digest();
const bytes=fs.readFileSync(flags['--inputs']),inputs=JSON.parse(bytes),directory=path.resolve(flags['--directory']);
fs.mkdirSync(directory,{recursive:false});const files=[];
for(const row of inputs.snapshots){
 const world=api.codec.unpackCheckpoint(row.payload,true),checkpoint=JSON.parse(row.payload);assert(['dreams-checkpoint-v1','dreams-checkpoint-v2','dreams-checkpoint-v3','dreams-checkpoint-v4'].includes(checkpoint.format));
 const text=JSON.stringify({format:'dreams-save-archive',version:2,checkpoint:row.payload,snapshots:[],branch:null});
 assert.equal(sha(api.model.encodeWorld(decodeSave(text).world)),row.summary.sha256);
 const name=[row.summary.profile??'history','age-'+row.summary.age,row.summary.level??'continue'].join('-').replace(/[^a-zA-Z0-9_-]/g,'_')+'.dreams.json';
 fs.writeFileSync(path.join(directory,name),text,{flag:'wx'});files.push({name,bytes:Buffer.byteLength(text),sha256:sha(text),worldSha256:row.summary.sha256,input:row.summary});
}
assert.equal(api.digest(),sourceHash);fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify({scope:'Identical supported V4 archives for isolated reference/current profiling apps. No Time Machine history was fabricated; complete checkpoint world histories are retained.',sourceHash,inputSha256:sha(bytes),files},null,2)+'\n');
console.log(JSON.stringify({directory,files:files.length}));
