// A genuine saved pet scene produces the same interrupted-year boundary as the UI regression.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto'),ts=require('typescript');
const source=path.resolve(__dirname,'..'),output=process.argv[2];assert(output);
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const load=file=>require(path.join(source,file)),{decodeSave}=load('src/persistence/archive.ts'),{packCheckpoint}=load('src/persistence/checkpoints.ts'),{resolveCommand}=load('src/game/engine.ts'),{ageOn,encodeWorld}=load('src/game/model.ts');
const file=path.join(source,'tests/fixtures/v28-ordinary-hobby-archive.json'),bytes=fs.readFileSync(file),sha=value=>createHash('sha256').update(value).digest('hex');
let world=decodeSave(bytes.toString()).world;const commands=[];
function act(command){commands.push(command);world=resolveCommand(world,command,true);}
act({type:'acknowledge',resultId:world.pending.id});act({type:'advance'});
const scene=world.pending;assert(scene?.kind==='decision'&&scene.choices.some(choice=>choice.id==='stay'));
act({type:'choose',eventId:scene.id,choiceId:'stay'});act({type:'acknowledge',resultId:world.pending.id});
assert(world.annual?.pausedForPlanning&&!world.pending&&!world.people[world.activePersonId].died);
fs.writeFileSync(output,JSON.stringify({scope:'Real archived pet scene followed by accepted acknowledgement, advance, stay and acknowledgement. No world/date/health/money/RNG patches.',fixture:path.relative(source,file),fixtureSha256:sha(bytes),commands,snapshots:[{summary:{age:ageOn(world.people[world.activePersonId],world.date),revision:world.revision,date:world.date,people:Object.keys(world.people).length,ledgerRows:world.ledger.length,journalRows:world.journal.length,sha256:sha(encodeWorld(world))},payload:packCheckpoint(world)}]}));
console.log({output,commands,age:ageOn(world.people[world.activePersonId],world.date),worldSha256:sha(encodeWorld(world))});
