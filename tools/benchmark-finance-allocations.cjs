// Separate V8 allocation sampling run; no latency claim under sampling.
const fs=require('node:fs'),path=require('node:path'),inspector=require('node:inspector'),assert=require('node:assert/strict'),{runtime,sha}=require('./scaling-runtime.cjs');
const flags={};for(let i=2;i<process.argv.length;i+=2)flags[process.argv[i]]=process.argv[i+1];
const apis=[runtime(flags['--reference'],undefined,{instrument:false}),runtime(flags['--source']??path.join(__dirname,'..'),undefined,{instrument:false})],hashes=apis.map(api=>api.digest()),input=JSON.parse(fs.readFileSync(flags['--inputs'])),results=[];
const session=new inspector.Session();session.connect();const post=(name,params={})=>new Promise((resolve,reject)=>session.post(name,params,(error,result)=>error?reject(error):resolve(result)));
async function main(){for(const row of input.snapshots.filter(s=>[30,50].includes(s.summary.age)&&s.summary.level==='extreme')){
 const sides=[];for(const [side,api]of apis.entries()){
  let world=api.codec.unpackCheckpoint(row.payload,true);function pair(){world=api.engine.resolveCommand(world,{type:'borrow',amount:1n},true);api.codec.packCheckpoint(world);world=api.engine.resolveCommand(world,{type:'acknowledge',resultId:world.pending.id},true);api.codec.packCheckpoint(world);}
  pair();global.gc?.();await post('HeapProfiler.startSampling',{samplingInterval:65536,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});for(let n=0;n<100;n++)pair();const {profile}=await post('HeapProfiler.stopSampling'),sites=[];
  function visit(node){if(node.selfSize)sites.push({bytes:node.selfSize,function:node.callFrame.functionName,url:node.callFrame.url,line:node.callFrame.lineNumber+1});for(const child of node.children??[])visit(child);}visit(profile.head);sites.sort((a,b)=>b.bytes-a.bytes);
  sides.push({side:side?'candidate':'reference',sampledAllocationBytes:sites.reduce((sum,s)=>sum+s.bytes,0),samples:profile.samples.length,commands:200,topSites:sites.slice(0,40),canonicalSha256:sha(api.model.encodeWorld(world)),journal:world.journal.length,ledger:world.ledger.length});
 }assert.equal(sides[0].canonicalSha256,sides[1].canonicalSha256);results.push({age:row.summary.age,sides});fs.writeFileSync(flags['--output'],JSON.stringify({scope:'Separate Node/V8 64KiB allocation sampling including collected objects, 100 real borrow/acknowledge pairs per side after one warm-up. Estimated bytes, not exact allocations or native peak. No timings from this sampled run are used.',sourceHashes:hashes,results},null,2));}
 assert.deepEqual(apis.map(api=>api.digest()),hashes);
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>session.disconnect());
