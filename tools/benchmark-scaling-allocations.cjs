// V8's sampled allocations, including collected objects. Not exact allocation
// counts or native-device memory. Timing under this profiler is not reported.
const fs=require('node:fs'),path=require('node:path'),inspector=require('node:inspector'),assert=require('node:assert/strict');
const {runtime,sha}=require('./scaling-runtime.cjs'),flags={};for(let i=2;i<process.argv.length;i+=2)flags[process.argv[i]]=process.argv[i+1];
const apis=[runtime(flags['--reference']),runtime(flags['--source']??path.join(__dirname,'..'))],hashes=apis.map(api=>api.digest());
const input=JSON.parse(fs.readFileSync(flags['--inputs'])).snapshots.find(row=>row.summary.age===70&&row.summary.level==='extreme');
const session=new inspector.Session();session.connect();const post=(name,params={})=>new Promise((resolve,reject)=>session.post(name,params,(error,result)=>error?reject(error):resolve(result)));
async function main(){const results=[];
 for(const [side,api]of apis.entries()){
  let world=api.codec.unpackCheckpoint(input.payload,true);
  function pair(){world=api.engine.resolveCommand(world,{type:'health-routine',routine:{...world.people[world.activePersonId].health.routine,mindfulness:!world.people[world.activePersonId].health.routine.mindfulness}},true);api.codec.packCheckpoint(world);world=api.engine.resolveCommand(world,{type:'acknowledge',resultId:world.pending.id},true);api.codec.packCheckpoint(world);}
  pair();if(global.gc)global.gc();
  await post('HeapProfiler.startSampling',{samplingInterval:65536,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});
  for(let i=0;i<120;i++)pair();
  const {profile}=await post('HeapProfiler.stopSampling'),sites=[];
  function visit(node){if(node.selfSize)sites.push({bytes:node.selfSize,function:node.callFrame.functionName,url:node.callFrame.url,line:node.callFrame.lineNumber+1});for(const child of node.children??[])visit(child);}
  visit(profile.head);sites.sort((a,b)=>b.bytes-a.bytes);
  results.push({side:side?'candidate':'reference',commands:240,sampledAllocationBytes:sites.reduce((sum,row)=>sum+row.bytes,0),sampleCount:profile.samples.length,topSites:sites.slice(0,30),finalCanonicalSha256:sha(api.model.encodeWorld(world)),journal:world.journal.length,ledger:world.ledger.length});
 }
 assert.equal(results[0].finalCanonicalSha256,results[1].finalCanonicalSha256);assert.deepEqual(apis.map(api=>api.digest()),hashes);
 fs.writeFileSync(flags['--output'],JSON.stringify({scope:'Node/V8 64KiB allocation sampling, including objects collected by minor/major GC. 120 actual routine/acknowledgement pairs per side, encoding each result, after one warm-up pair. Sampling estimates bytes; it is not an exact allocation count or native peak measurement.',sourceHashes:hashes,results},null,2));
 console.log(results.map(({topSites,...summary})=>summary));
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>session.disconnect());
