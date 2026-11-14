// Extend the retained synchronous interleaved driver; do not mutate gameplay sources.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
let driver=fs.readFileSync(path.join(__dirname,'benchmark-performance-pairs.cjs'),'utf8');
function replace(before,after){if(driver.split(before).length!==2)throw Error('Review paired driver: '+before);driver=driver.replace(before,after);}
replace("command(kind === 'routine' ?", "command(kind === 'finance' ? {type:'borrow',amount:1n} : kind === 'routine' ?");
replace("} : { type: 'advance' });", "} : { type: world.annual ? 'resume' : 'advance' });\n  if(kind === 'routine' || kind === 'finance') command({type:'acknowledge',resultId:world.pending.id});");
replace("row => !ages || ages.includes(row.summary.age)", "row => (!ages || ages.includes(row.summary.age)) && (!flags['--levels'] || flags['--levels'].split(',').includes(row.summary.level))");
replace("['routine', 'firstAgeUp', 'fullYear']", "['routine', 'finance', 'fullYear']");
replace("'age ' + result.age + ' ' + kind", "'age ' + result.age + '/' + result.input.level + ' ' + kind");
replace("kind, input: input.summary", "kind, input: input.summary");
const compiled=new Module(__filename,module);compiled.filename=__filename;compiled.paths=Module._nodeModulePaths(__dirname);compiled._compile(driver,__filename);
