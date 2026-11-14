// Retain unsuccessful exploratory policies too. Replay supported commands from
// the latest captured checkpoint, then compare the unchanged boundary against
// both implementations. No benchmark timing is taken here.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{runtime,sha}=require('./scaling-runtime.cjs');
const flags={};for(let i=2;i<process.argv.length;i+=2)flags[process.argv[i]]=process.argv[i+1];
const apis=[runtime(flags['--reference'],undefined,{instrument:false}),runtime(flags['--source']??path.join(__dirname,'..'),undefined,{instrument:false})],hashes=apis.map(api=>api.digest()),results=[];
function revive(value){if(!value||typeof value!=='object')return value;if(Object.keys(value).length===1&&typeof value.$dreamsBigInt==='string')return BigInt(value.$dreamsBigInt);for(const key of Object.keys(value))value[key]=revive(value[key]);return value;}
for(const profile of ['model','mixed']){
 const inputBytes=fs.readFileSync(flags['--'+profile+'-inputs']),commandBytes=fs.readFileSync(flags['--'+profile+'-commands']),input=JSON.parse(inputBytes),life=JSON.parse(commandBytes).lives.find(l=>l.profile===profile),commands=revive(life.commands),base=input.snapshots.filter(s=>s.summary.profile===profile).at(-1);assert(base);
 let world=apis[1].codec.unpackCheckpoint(base.payload,true);for(const command of commands.slice(base.summary.commands))world=apis[1].engine.resolveCommand(world,command,true);
 const canonical=apis[1].model.encodeWorld(world),beforeSha=sha(canonical),reference=apis[0].model.decodeWorldData(JSON.parse(canonical)),inputAge=apis[1].model.ageOn(world.people[world.activePersonId],world.date);
 const outcomes=apis.map((api,side)=>{try{if(profile==='model'){const next=api.engine.resolveCommand(side?world:reference,{type:'resume'},true);return {accepted:true,sha256:sha(api.model.encodeWorld(next))};}return {accepted:true,format:JSON.parse(api.codec.packCheckpoint(side?world:reference)).format};}catch(error){return {accepted:false,error:error.message};}});
 assert.deepEqual(outcomes[0],outcomes[1]);assert.equal(sha(apis[1].model.encodeWorld(world)),beforeSha);
 results.push({profile,scope:profile==='model'?'Additional preventive-health policy, separate from retained successful original model policy':'Initial unbounded-introduction mixed policy, separate from retained successful bounded policy',age:inputAge,commands:commands.length,canonicalBytes:Buffer.byteLength(canonical),worldSha256:beforeSha,inputSha256:sha(inputBytes),commandSha256:sha(commandBytes),outcomes});
 fs.writeFileSync(flags['--output'],JSON.stringify({scope:'Unsuccessful exploratory workloads retained explicitly; no latency or universal coverage claim. Both old and current implementations receive identical fully validated inputs.',sourceHashes:hashes,results},null,2));
}
assert.deepEqual(apis.map(api=>api.digest()),hashes);
