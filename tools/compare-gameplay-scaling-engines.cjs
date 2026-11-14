// Full canonical world/RNG after every supported lifetime command. Encoded
// checkpoints are compared through legacy bytes and current round trips at
// every captured age, without changing the reference engine or input trace.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{runtime,sha}=require('./scaling-runtime.cjs');
const flags={};for(let i=2;i<process.argv.length;i+=2)flags[process.argv[i]]=process.argv[i+1];
const apis=[runtime(flags['--reference'],undefined,{instrument:false}),runtime(flags['--source']??path.join(__dirname,'..'),undefined,{instrument:false})],hashes=apis.map(api=>api.digest());
const bytes=fs.readFileSync(flags['--commands']),input=JSON.parse(bytes),snapshots=JSON.parse(fs.readFileSync(flags['--inputs'])).snapshots,results=[];
function revive(value){if(!value||typeof value!=='object')return value;if(Object.keys(value).length===1&&typeof value.$dreamsBigInt==='string')return BigInt(value.$dreamsBigInt);for(const key of Object.keys(value))value[key]=revive(value[key]);return value;}
for(const life of input.lives.filter(l=>!flags['--profiles']||flags['--profiles'].split(',').includes(l.profile))){
 const commands=revive(life.commands);let worlds=apis.map(api=>api.codec.unpackCheckpoint(life.initialPayload,true));const checkpoints=[];
 for(let i=0;i<commands.length;i++){
  worlds=apis.map((api,side)=>api.engine.resolveCommand(worlds[side],commands[i],true));
  const canonical=apis.map((api,side)=>sha(api.model.encodeWorld(worlds[side])));assert.equal(canonical[0],canonical[1],life.profile+' command '+(i+1));assert.deepEqual(worlds[0].random,worlds[1].random);
  const captured=snapshots.find(s=>s.summary.profile===life.profile&&s.summary.commands===i+1);
  if(captured){assert.equal(canonical[1],captured.summary.sha256);const packed=apis[1].codec.packCheckpoint(worlds[1]);assert.equal(sha(apis[1].model.encodeWorld(apis[1].codec.unpackCheckpoint(packed,true))),canonical[1]);assert.equal(sha(apis[0].codec.packCheckpoint(worlds[0])),sha(apis[1].codec.packCheckpointV4(worlds[1])));checkpoints.push({age:captured.summary.age,sha256:canonical[1],format:JSON.parse(packed).format});}
  if((i+1)%100===0)process.stderr.write(life.profile+': '+(i+1)+'/'+commands.length+' exact worlds/RNG\n');
 }
 results.push({profile:life.profile,commands:commands.length,finalCanonicalSha256:sha(apis[1].model.encodeWorld(worlds[1])),random:worlds[1].random,checkpoints});
 fs.writeFileSync(flags['--output'],JSON.stringify({comparison:'Complete canonical world and RNG after every command; exact legacy checkpoint bytes and current round trips at each captured age.',sourceHashes:hashes,commandsSha256:sha(bytes),results},null,2));
}
assert.deepEqual(apis.map(api=>api.digest()),hashes);
