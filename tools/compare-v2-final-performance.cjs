const fs=require('node:fs'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const [beforeFile,afterFile,output]=process.argv.slice(2);assert(beforeFile&&afterFile&&output);
const before=JSON.parse(fs.readFileSync(beforeFile)),after=JSON.parse(fs.readFileSync(afterFile));
assert.equal(before.inputFileSha256,after.inputFileSha256);assert.equal(before.driverHash,after.driverHash);
assert.equal(before.samples,after.samples);assert.equal(before.results.length,after.results.length);
const sha=value=>createHash('sha256').update(value).digest('hex');
const quantile=(values,p)=>[...values].sort((a,b)=>a-b)[Math.ceil(values.length*p)-1];
const nonValidationResolve=result=>{
  const values=result.trials.map(trial=>trial.resolveMs-(trial.phases.validateWorld?.inclusiveMs??0));
  return {medianMs:quantile(values,.5),p95Ms:quantile(values,.95)};
};
const results=before.results.map((original,index)=>{
  const optimized=after.results[index];assert.equal(original.age,optimized.age);assert.equal(original.kind,optimized.kind);
  assert.deepEqual(original.commands,optimized.commands);assert.equal(original.inputSha256,optimized.inputSha256);
  assert.deepEqual(original.outcome,optimized.outcome);assert.equal(original.checkpointBytes,optimized.checkpointBytes);
  return {age:original.age,kind:original.kind,inputSha256:original.inputSha256,outcome:original.outcome,
    completeOutcomeSha256:sha(JSON.stringify(original.outcome)),commands:original.commands,
    before:original.timingsMs,after:optimized.timingsMs,
    beforeResolveExcludingValidation:nonValidationResolve(original),afterResolveExcludingValidation:nonValidationResolve(optimized),
    medianReductionPercent:100*(original.timingsMs.totalMs.median-optimized.timingsMs.totalMs.median)/original.timingsMs.totalMs.median,
    beforePhases:original.phases,afterPhases:optimized.phases};
});
fs.writeFileSync(output,JSON.stringify({scope:before.scope,samples:before.samples,node:before.node,inputFileSha256:before.inputFileSha256,
  driverHash:before.driverHash,historicalDriverSha256:before.historicalDriverSha256,
  beforeSourceHash:before.sourceHash,afterSourceHash:after.sourceHash,results},null,2));
console.log({output,cases:results.length,exactOutcomeEquality:true,exactCommandEquality:true,exactCheckpointBytes:true});
