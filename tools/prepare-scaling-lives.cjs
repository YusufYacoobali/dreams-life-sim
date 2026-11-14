// Same-age activity cohorts. Only supported commands; every rejection is recorded.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {runtime,sha} = require('./scaling-runtime.cjs');
const source = path.resolve(process.argv[4] ?? path.join(__dirname,'..'));
const {load,model,codec,engine,digest} = runtime(source), sourceHash = digest();
const inputs = JSON.parse(fs.readFileSync(process.argv[2])), output = process.argv[3]; assert(output);
const {choiceUnavailable} = load('src/game/choiceAvailability.ts');
const {accountFor} = load('src/game/systems/common.ts'), {personalBorrowReason} = load('src/game/systems/credit.ts');
const leisure = load('src/game/systems/leisure.ts'), pets = load('src/game/systems/pets.ts');
const {assetCatalog} = load('src/game/content/assets.ts'), {purchaseReason} = load('src/game/systems/assets.ts'), {assetPrice} = load('src/game/systems/assetPricing.ts');
const snapshots = [], crimeSnapshots = [], traces = [];
for (const input of inputs.snapshots.filter(row => [23,30,50,70].includes(row.summary.age))) {
  let world = codec.unpackCheckpoint(input.payload,true), actions = 0;
  const trace = [], rejected = {};
  const person = () => world.people[world.activePersonId];
  function act(command, activity = false) {
    world = engine.resolveCommand(world,command,true); trace.push(command); if (activity) actions++;
  }
  function finish() {
    let guard = 0;
    while (world.pending && guard++ < 100) {
      const event = world.pending;
      act(event.kind === 'decision' ? {type:'choose',eventId:event.id,choiceId:event.choices.find(choice => !choiceUnavailable(world,choice)).id} : {type:'acknowledge',resultId:event.id});
    }
    assert(guard < 100); assert.equal(model.ageOn(person(),world.date),input.summary.age);
  }
  function attempt(command) {
    try { act(command,true); finish(); return true; }
    catch (error) { rejected[command.type+': '+error.message] = (rejected[command.type+': '+error.message] ?? 0)+1; return false; }
  }
  function capture(level) {
    const payload = codec.packCheckpoint(world), text = model.encodeWorld(world);
    const captured = {summary:{age:input.summary.age,level,activityActions:actions,commands:trace.length,revision:world.revision,
      journalRows:world.journal.length,ledgerRows:world.ledger.length,relationships:world.relationships.length,people:Object.keys(world.people).length,
      npcs:Object.keys(world.people).length-1,assets:world.assets.length,pets:world.pets.length,hobbies:world.hobbies.length,
      canonicalBytes:Buffer.byteLength(text),checkpointBytes:Buffer.byteLength(payload),heapUsed:process.memoryUsage().heapUsed,rss:process.memoryUsage().rss,
      commandCounts:trace.reduce((out,cmd)=>(out[cmd.type]=(out[cmd.type]??0)+1,out),{}),sha256:sha(text)},payload};
    (level === 'crime' ? crimeSnapshots : snapshots).push(captured);
    fs.writeFileSync(output,JSON.stringify({scope:'Same-age command-built cohorts. Normal seed-42 careers/family/social progression comes from inputs. Bounded feature actions precede repeated small loan/repayment cycles; cooldowns are never bypassed. Revisions include acknowledgement commands; activityActions excludes them. This is a finance/history stress workload, not a claim of uniform feature coverage.',sourceHash,inputSha256:sha(fs.readFileSync(process.argv[2])),snapshots}));
    process.stderr.write(JSON.stringify(captured.summary)+'\n');
  }
  capture('light');
  // Exercise actual local relationships, purchases, paid hobbies, pets and outings where eligible.
  attempt({type:'meet-people',purpose:'friend',gender:'any'});
  for (const edge of world.relationships.filter(edge => edge.from === person().id || edge.to === person().id).slice(0,12)) {
    const otherId = edge.from === person().id ? edge.to : edge.from;
    if (!world.people[otherId].died) attempt({type:'interact',personId:otherId,action:'talk'});
  }
  for (const kind of ['reading','cooking']) if (!leisure.hobbyReason(world,kind,'community')) attempt({type:'hobby-plan',kind,mode:'community',reviewedPayerId:person().id,quotedMonthlyFee:leisure.hobbyFee(person().country,kind,'community')});
  for (const kind of ['park','museum','cinema']) if (!leisure.outingReason(world,kind)) attempt({type:'leisure-outing',kind,reviewedPayerId:person().id,quotedTotal:leisure.outingFee(world,kind)});
  if (!pets.petAdoptionReason(world,'milo')) attempt({type:'adopt-pet',offerId:'milo',name:'Milo',reviewedOwnerId:person().id,quotedFee:pets.petAdoptionFee(world,'milo')});
  for (const pet of world.pets.filter(pet => pet.ownerId === person().id && pet.status === 'active')) for (const activity of ['play','feed']) if (!pets.petCareReason(world,pet,activity)) attempt({type:'pet-care',petId:pet.id,activity});
  for (const kind of ['property','vehicle']) {
    const offer = assetCatalog.find(offer => offer.kind === kind && !purchaseReason(world,offer,'cash'));
    if (offer) attempt({type:'buy-asset',catalogId:offer.id,financing:'cash',depositBps:10000,termMonths:120,quotedPrice:assetPrice(world,offer)});
  }
  for (const [level,target] of [['moderate',200],['heavy',1000],['extreme',3000]]) {
    let guard = 0;
    while (actions < target && guard++ < target*3) {
      // Real reversible credit operations generate ledger and journal history without ageing.
      const debt = world.liabilities.find(debt => debt.ownerId === person().id && debt.kind === 'personal' && debt.principal > 0n);
      if (debt && accountFor(world).cash >= 1n) attempt({type:'repay',liabilityId:debt.id,amount:1n});
      else if (!personalBorrowReason(world,1n)) attempt({type:'borrow',amount:1n});
      else break;
    }
    capture(level);
  }
  // Crime is a separate terminal scenario so its legitimate restrictions cannot invalidate the credit cohort.
  attempt({type:'crime',offence:'shoplift'});
  capture('crime');
  traces.push({age:input.summary.age,commands:trace,rejected});
}
assert.equal(digest(),sourceHash,'Sources changed during cohort generation');
fs.writeFileSync(output+'.commands.json',JSON.stringify(traces,model.moneyJSON));
fs.writeFileSync(output+'.crime.json',JSON.stringify({sourceHash,snapshots:crimeSnapshots}));
