// Compare two independent runtimes, including exact packed bytes, never new expected hashes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
const flags={};for(let i=2;i<process.argv.length;i+=2)flags[process.argv[i]]=process.argv[i+1];
const root=path.resolve(__dirname,'..'),before=path.resolve(flags['--baseline']),after=path.resolve(flags['--candidate']);
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const load=source=>({model:require(path.join(source,'src/game/model.ts')),codec:require(path.join(source,'src/persistence/checkpoints.ts')),engine:require(path.join(source,'src/game/engine.ts'))});
const runtimes=[load(before),load(after)],sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const rows=[];
for(const group of ['ordinary','enabled','active','generations']){
 const input=JSON.parse(fs.readFileSync(path.join(flags['--inputs'],group+'.json'),'utf8'));
 for(const snapshot of input.snapshots){
  const worlds=runtimes.map(api=>api.codec.unpackCheckpoint(snapshot.payload,true));
  const canonical=runtimes.map((api,index)=>api.model.encodeWorld(worlds[index]));assert.equal(canonical[0],canonical[1]);
  const packed=runtimes.map((api,index)=>api.codec.packCheckpoint(worlds[index]));assert.equal(packed[0],packed[1]);
  for(let index=0;index<2;index++)assert.equal(runtimes[index].model.encodeWorld(runtimes[index].codec.unpackCheckpoint(packed[index],true)),canonical[0]);
  rows.push({group,age:snapshot.summary.age,generation:worlds[0].generation,schema:worlds[0].schemaVersion,canonicalSha256:sha(canonical[0]),packedSha256:sha(packed[0]),exact:true});
 }
}
const creative=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/v50-creative-polish-compat.json'),'utf8'));
for(const [name,payload]of Object.entries(creative))if(typeof payload==='string'&&payload.startsWith('{"format":"dreams-checkpoint')){
 const worlds=runtimes.map(api=>api.codec.unpackCheckpoint(payload,true));
 const canonical=runtimes.map((api,index)=>api.model.encodeWorld(worlds[index]));assert.equal(canonical[0],canonical[1]);
 const packed=runtimes.map((api,index)=>api.codec.packCheckpoint(worlds[index]));assert.equal(packed[0],packed[1]);
 rows.push({group:'enhanced-creative',name,schema:worlds[0].schemaVersion,canonicalSha256:sha(canonical[0]),packedSha256:sha(packed[0]),exact:true});
}
const historical=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/v1-refinement-compatibility.json'),'utf8'));
for(const row of historical.rows){
 const worlds=runtimes.map(api=>api.codec.unpackCheckpoint(row.payload));
 for(let index=0;index<2;index++){
  assert.equal(sha(runtimes[index].model.encodeWorld(worlds[index])),row.inputSha256);
  for(const command of row.commands)worlds[index]=runtimes[index].engine.resolveCommand(runtimes[index].model.decodeWorld(runtimes[index].model.encodeWorld(worlds[index])),command);
 }
 const canonical=runtimes.map((api,index)=>api.model.encodeWorld(worlds[index]));assert.equal(canonical[0],canonical[1]);assert.equal(sha(canonical[0]),row.outcomeSha256);
 const packed=runtimes.map((api,index)=>api.codec.packCheckpoint(worlds[index]));assert.equal(packed[0],packed[1]);
 rows.push({group:'historical-crime-prison-romance-escape',name:row.id,schema:worlds[0].schemaVersion,canonicalSha256:sha(canonical[0]),packedSha256:sha(packed[0]),exact:true});
}
fs.writeFileSync(flags['--output'],JSON.stringify({scope:'Independent archived baseline and candidate decode/canonical/packing comparison. All actual histories retained. No regenerated golden expectations or altered fixtures.',rows},null,2)+'\n');
console.log({worlds:rows.length,exactCanonicalAndPackedBytes:true});
