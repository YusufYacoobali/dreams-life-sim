// Apply only the diagnostics shell to a clean, disposable 8378d0f8 checkout.
// Keep all baseline game, validators, codec/repository and projection sources.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),target=path.resolve(process.argv[2]??'');assert(process.argv[2]&&target!==root,'Pass an isolated reference checkout');
const git=(...args)=>execFileSync('git',args,{cwd:target,encoding:'utf8'}).trim();assert.equal(git('rev-parse','HEAD'),'8378d0f86be522f41b822692cf945ccade6b3f58');assert.equal(git('status','--porcelain'),'','Reference checkout must be clean');
const sha=data=>createHash('sha256').update(data).digest('hex');
const protectedFiles=git('ls-files','src/game','src/persistence/checkpoints.ts','src/persistence/repository.ts','src/persistence/archive.ts','src/ui/journalProjection.ts').split('\n');
const protectedHashes=Object.fromEntries(protectedFiles.map(file=>[file,sha(fs.readFileSync(path.join(target,file)))]));
const overlay=['app.config.cjs','eas.json','app/_layout.tsx','app/performance-diagnostics.tsx','app/(game)/(tabs)/life.tsx','src/performance/commandTiming.ts','src/performance/recorder.ts','src/performance/internalProfiler.ts','src/persistence/native.ts','src/state/useGame.ts','src/state/gameStore.ts','src/ui/GodModeAccess.tsx','src/ui/feedback.tsx'];
for(const file of overlay){fs.mkdirSync(path.dirname(path.join(target,file)),{recursive:true});fs.copyFileSync(path.join(root,file),path.join(target,file));}
// Distinct app containers prevent the reader-32 reference opening candidate data.
const configFile=path.join(target,'app.config.cjs');
fs.writeFileSync(configFile,fs.readFileSync(configFile,'utf8').replaceAll('com.yacoobali.lifesim.profile','com.yacoobali.lifesim.profile.reference').replaceAll("'dreams-life-profile'","'dreams-life-profile-reference'").replace("config.name + ' Profile'","config.name + ' Profile Reference'"));
for(const [file,hash]of Object.entries(protectedHashes))assert.equal(sha(fs.readFileSync(path.join(target,file))),hash,file+' changed');
const manifest={referenceCommit:git('rev-parse','HEAD'),diagnosticsCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),scope:'Diagnostics-only overlay. Original engine/content/RNG/validation, reader32 codec/repository and full-scan journal projection remain exact. The store adds only its publication timing span; UI additions only observe commits/layout/scroll.',overlay:Object.fromEntries(overlay.map(file=>[file,sha(fs.readFileSync(path.join(target,file)))])),protectedHashes};
fs.writeFileSync(path.join(target,'performance-reference-manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({target,overlay:overlay.length,unchangedProtectedFiles:protectedFiles.length}));
