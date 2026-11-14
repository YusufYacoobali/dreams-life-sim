// Cold legacy/current decode and cold/warm encoding, separately from hot commands.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {runtime,sha}=require('./scaling-runtime.cjs'),flags={};
for(let i=2;i<process.argv.length;i+=2)flags[process.argv[i]]=process.argv[i+1];
const apis=[runtime(flags['--reference']),runtime(flags['--source']??path.join(__dirname,'..'))],hashes=apis.map(api=>api.digest());
const inputs=JSON.parse(fs.readFileSync(flags['--inputs'])),samples=Number(flags['--samples']??7);assert(samples>=5);
const stats=values=>{const sorted=[...values].sort((a,b)=>a-b);return {p50:sorted[Math.ceil(values.length*.5)-1],p95:sorted[Math.ceil(values.length*.95)-1],max:sorted.at(-1)}};
const results=[];
for(const row of inputs.snapshots){
 const expected=apis[0].model.encodeWorld(apis[0].codec.unpackCheckpoint(row.payload,true)),sides=[];
 for(const [side,api]of apis.entries()){
  const trials=[];let packed;
  for(let trial=0;trial<=samples;trial++){
   if(global.gc)global.gc();
   const a=performance.now(),world=api.codec.unpackCheckpoint(row.payload,true),b=performance.now();
   packed=api.codec.packCheckpoint(world);const c=performance.now();
   const warm=api.codec.packCheckpoint(world),d=performance.now();assert.equal(warm,packed);
   const restored=api.codec.unpackCheckpoint(packed,true),e=performance.now();
   assert.equal(api.model.encodeWorld(world),expected);assert.equal(api.model.encodeWorld(restored),expected);
   if(trial)trials.push({legacyDecode:b-a,firstPack:c-b,warmPack:d-c,currentDecode:e-d,heapAfter:process.memoryUsage().heapUsed});
  }
  sides.push({side:side?'candidate':'reference',format:JSON.parse(packed).format,checkpointBytes:Buffer.byteLength(packed),canonicalBytes:Buffer.byteLength(expected),timingMs:Object.fromEntries(['legacyDecode','firstPack','warmPack','currentDecode'].map(name=>[name,stats(trials.map(trial=>trial[name]))])),trials});
 }
 results.push({input:row.summary,canonicalSha256:sha(expected),sides});
 process.stderr.write(`${row.summary.age}/${row.summary.level}: cold codec equality\n`);
 fs.writeFileSync(flags['--output'],JSON.stringify({scope:'Node cold legacy/current checkpoint decode, first encode after legacy load, then same-world warm encode. One warm-up; nearest-rank p50/p95/max. Existing content LRU may be warm; object identities are new on each decode. No device latency claim.',sourceHashes:hashes,samples,results},null,2));
}
assert.deepEqual(apis.map(api=>api.digest()),hashes);
