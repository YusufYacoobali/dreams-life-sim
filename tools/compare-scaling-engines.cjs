// Every-command full canonical/RNG comparison on an actual retained activity trace.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {runtime,sha}=require('./scaling-runtime.cjs');
const flags={};for(let i=2;i<process.argv.length;i+=2)flags[process.argv[i]]=process.argv[i+1];
const original=runtime(flags['--reference']),candidate=runtime(flags['--source']??path.join(__dirname,'..'));
const hashes=[original.digest(),candidate.digest()],input=JSON.parse(fs.readFileSync(flags['--inputs']));
const trace=JSON.parse(fs.readFileSync(flags['--commands'])),results=[];
function money(value){if(!value||typeof value!=='object')return value;if(Object.keys(value).length===1&&typeof value.$dreamsBigInt==='string')return BigInt(value.$dreamsBigInt);for(const key of Object.keys(value))value[key]=money(value[key]);return value;}
for(const row of trace.filter(row=>!flags['--ages']||flags['--ages'].split(',').includes(String(row.age)))) {
  const snapshot=input.snapshots.find(s=>s.summary.age===row.age);assert(snapshot);
  let before=original.codec.unpackCheckpoint(snapshot.payload,true),after=candidate.codec.unpackCheckpoint(snapshot.payload,true),count=0;
  for(const command of money(row.commands)) {
    before=original.engine.resolveCommand(before,command,true);after=candidate.engine.resolveCommand(after,command,true);count++;
    assert.equal(sha(original.model.encodeWorld(before)),sha(candidate.model.encodeWorld(after)),`Canonical world differs at age ${row.age}, command ${count} (${command.type})`);
    assert.deepEqual(before.random,after.random);
    if(flags['--codec']!=='versioned')assert.equal(sha(original.codec.packCheckpoint(before)),sha(candidate.codec.packCheckpoint(after)),`Checkpoint differs at ${count}`);
    else assert.deepEqual(candidate.codec.unpackCheckpoint(candidate.codec.packCheckpoint(after)),after);
    if(count%200===0)process.stderr.write(`age ${row.age}: ${count}/${row.commands.length} exact command outcomes\n`);
  }
  results.push({age:row.age,commands:count,worldSha256:sha(candidate.model.encodeWorld(after)),random:after.random,revision:after.revision,journal:after.journal.length,ledger:after.ledger.length});
}
assert.equal(original.digest(),hashes[0]);assert.equal(candidate.digest(),hashes[1]);
fs.writeFileSync(flags['--output'],JSON.stringify({referenceSourceHash:hashes[0],candidateSourceHash:hashes[1],comparison:flags['--codec']==='versioned'?'canonical world, RNG and every versioned round-trip':'canonical world, RNG and packed checkpoint SHA after EVERY command',results},null,2));
console.log(results);
