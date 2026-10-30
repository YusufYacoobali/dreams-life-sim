import { progressFacts } from '../../src/progression/facts';
import { terminalBiography } from '../../src/ui/terminalBiography';
import { recordDeath } from '../../src/game/engine';
import { relationFor } from '../../src/game/systems/relationshipQueries';
import { copyWorld, decodeWorld, encodeWorld, validateWorld, type World } from '../../src/game/model';
import { monthFrom } from '../../src/game/calendar';
import { countries, type CountryCode } from '../../src/game/countries';
import { convertMoney, roundRatio } from '../../src/game/money';
import { monthlyAmount } from '../../src/game/rules';
import { actorCareer, actorMonth, resolveActor } from '../../src/game/systems/actor';
import type { ActorCommand } from '../../src/game/systems/actorSchemas';
import { compactCreativeHistory } from '../../src/game/systems/creativeArchive';
import { creativeMonthNumber } from '../../src/game/systems/creativeSchemas';
import { accountFor } from '../../src/game/systems/common';
import { careerMonth, careerPayQuote, startCareerContract } from '../../src/game/systems/careers';
import { settleTax } from '../../src/game/systems/finance';
import { endEmployment, workMonth } from '../../src/game/systems/work';
import graduate from '../fixtures/v3-employed-graduate.json';

function clear(world: World) { world.pending = null; world.pendingPriority = 0; world.deferred = []; }
function fixture() {
  const world = decodeWorld(JSON.stringify(graduate)), person = world.people[world.activePersonId], bank = accountFor(world);
  endEmployment(world); clear(world); person.skills.acting = 100;
  person.stats.health = person.stats.fitness = person.stats.smarts = person.stats.discipline = person.stats.energy = 100;
  bank.cash += 100000000n; bank.openingCash += 100000000n;
  return world;
}
function command(world: World, value: ActorCommand) {
  resolveActor(world, value); clear(world); validateWorld(world); return world;
}
function enter(world = fixture()) { return command(world, { type: 'actor-enter' }); }
function book(world: World, category = 'commercial') {
  const career = actorCareer(world)!, state = career.actor!;
  if (state.industry.boardSeason !== Math.floor(creativeMonthNumber(world) / 3) || state.boardCountry !== world.people[world.activePersonId].country) command(world, { type: 'actor-refresh-offers' });
  const offer = state.industry.board.find(item => item.category === category)!; offer.auditionRoll = 1;
  command(world, { type: 'actor-audition', offerId: offer.id, quotedAnnualPay: offer.annualPay, negotiate: false });
  return world;
}
function period(world: World) {
  world.date = monthFrom(world.date, 1); const person = world.people[world.activePersonId]; person.stats.energy = 100;
  workMonth(world, person); careerMonth(world); actorMonth(world); person.lastEconomicMonth = creativeMonthNumber(world); clear(world); validateWorld(world);
  return world;
}
function finish(world: World) { let guard = 0; while (actorCareer(world)!.status === 'active' && guard++ < 13) period(world); expect(guard).toBeLessThan(14); return world; }
function reside(world: World, country: CountryCode) {
  // A financial unit crossing, like foreign-earnings.test.ts. Normal workMonth below
  // produces the actual immutable FX receipts; relocation itself has separate journeys.
  const person = world.people[world.activePersonId]; endEmployment(world); settleTax(world);
  person.country = country; person.city = countries[country].cities[0];
  const currency = countries[country].currency;
  if (!world.accounts.some(item => item.ownerId === person.id && item.currency === currency)) world.accounts.push({ id: 'creative_bank_' + currency, ownerId: person.id, currency, cash: 1000000n, openingCash: 1000000n, lockedCash: 0n });
  clear(world);
}

test('real payroll pays no upfront fee and one monthly wage funds one reconcilable agency commission', () => {
  const world = enter(); command(world, { type: 'actor-agency', tier: 'boutique', negotiate: false });
  const person = world.people[world.activePersonId], initial = accountFor(world).cash, initialLifetime = person.finance.lifetimeGross, cursor = world.ledger.length;
  book(world, 'independent-film'); const project = actorCareer(world)!.projects.at(-1)!, history = world.workHistory.find(item => item.id === project.employmentId)!, annual = person.employment!.annualPay;
  expect(accountFor(world).cash).toBe(initial); expect(project.grossEarned).toBe(0n); expect(history.grossEarned).toBe(0n); expect(world.ledger).toHaveLength(cursor);
  period(world); const meta = project.creative!, rows = world.ledger.slice(cursor).filter(row => row.personId === person.id), wages = rows.filter(row => row.category === 'income'), commission = rows.filter(row => row.category === 'career-agency-commission');
  expect(wages).toHaveLength(1); expect(wages[0].cashDelta).toBe(monthlyAmount(annual, 0)); expect(history.grossEarned).toBe(wages[0].cashDelta); expect(project.grossEarned).toBe(history.grossEarned);
  expect(commission).toHaveLength(1); expect(-commission[0].cashDelta).toBe(roundRatio(wages[0].cashDelta * 1200n, 10000n)); expect(meta.commissionTransactions).toEqual([commission[0].id]);
  expect(accountFor(world).cash - initial).toBe(rows.reduce((sum, row) => sum + row.cashDelta, 0n));
  const encoded = encodeWorld(world); careerMonth(world); actorMonth(world); expect(encodeWorld(world)).toBe(encoded);
  expect(person.finance.lifetimeGross - initialLifetime).toBe(history.normalizedGross);
  expect(actorCareer(world)!.actor!.industry.totalGross).toBe(history.normalizedGross); expect(actorCareer(world)!.actor!.industry.totalCommission).toBe(meta.normalizedCommission);
});

test('leaving an agency during a production changes future representation but never signed commission on that contract', () => {
  const world = enter(); command(world, { type: 'actor-agency', tier: 'boutique', negotiate: false }); book(world, 'independent-film');
  const project = actorCareer(world)!.projects.at(-1)!, agent = project.creative!.agentId;
  for (let month = 0; month < 3; month++) period(world);
  command(world, { type: 'actor-agency', tier: 'independent', negotiate: false }); finish(world);
  const career = actorCareer(world)!, meta = project.creative!;
  expect(career.actor!.industry.representation.commissionBps).toBe(0); expect(meta.commissionBps).toBe(1200); expect(meta.agentId).toBe(agent);
  expect(meta.commissionPaid).toBe(roundRatio(project.grossEarned * 1200n, 10000n)); expect(meta.commissionTransactions).toHaveLength(project.months);
  expect(world.ledger.filter(row => meta.commissionTransactions.includes(row.id)).reduce((sum, row) => sum - row.cashDelta, 0n)).toBe(meta.commissionPaid);
  const before = encodeWorld(world); actorMonth(world); expect(encodeWorld(world)).toBe(before);
});

test.each(['GB', 'JP'] as const)('moving to %s records actual per-payment historical FX for wages and fees without revaluing earlier work', country => {
  const world = enter(), initialLifetime = world.people[world.activePersonId].finance.lifetimeGross; command(world, { type: 'actor-agency', tier: 'boutique', negotiate: false }); book(world); finish(world);
  const career = actorCareer(world)!, first = career.projects.at(-1)!, firstReference = first.creative!.normalizedGross, firstFees = first.creative!.normalizedCommission;
  const currency = countries[country].currency, rates = country === 'JP' ? [[120n, 1n], [135n, 1n], [140n, 1n]] : [[3n, 4n], [2n, 3n], [9n, 10n]];
  expect(first.currency).toBe('USD'); reside(world, country); world.market.fx[currency] = { numerator: rates[0][0], denominator: rates[0][1] }; book(world);
  const project = career.projects.at(-1)!, meta = project.creative!; expect(project.currency).toBe(currency); expect(meta.referenceCurrency).toBe('USD'); period(world);
  const firstConversion = { ...meta.commissionConversions[0] }; expect(firstConversion.numerator).not.toBe(firstConversion.denominator);
  world.market.fx[currency] = { numerator: rates[1][0], denominator: rates[1][1] }; period(world); finish(world);
  const job = world.workHistory.find(item => item.id === project.employmentId)!;
  expect(job.conversions).toHaveLength(project.months); expect(meta.commissionConversions).toHaveLength(project.months);
  expect(new Set(meta.commissionConversions.map(row => row.numerator + '/' + row.denominator)).size).toBe(2);
  for (const receipt of job.conversions) expect(receipt.reference).toBe(convertMoney({ minor: receipt.native, currency: job.currency }, meta.referenceCurrency, receipt.rate.numerator, receipt.rate.denominator).minor);
  const fees = meta.commissionConversions.reduce((sum, receipt) => {
    const txn = world.ledger.find(row => row.id === receipt.transactionId)!;
    const reference = convertMoney({ minor: -txn.cashDelta, currency: txn.currency }, meta.referenceCurrency, receipt.numerator, receipt.denominator).minor;
    expect(receipt.reference).toBe(reference); return sum + reference;
  }, 0n);
  expect(meta.normalizedGross).toBe(job.normalizedGross); expect(meta.normalizedCommission).toBe(fees);
  expect(career.actor!.industry.totalGross).toBe(firstReference + job.normalizedGross); expect(career.actor!.industry.totalCommission).toBe(firstFees + fees);
  expect(world.people[world.activePersonId].finance.lifetimeGross - initialLifetime).toBe(career.actor!.industry.totalGross);
  world.market.fx[currency] = { numerator: rates[2][0], denominator: rates[2][1] };
  const cold = decodeWorld(encodeWorld(world)), restored = actorCareer(cold)!;
  expect(restored.projects[0].creative!.normalizedGross).toBe(firstReference); expect(restored.projects[0].creative!.normalizedCommission).toBe(firstFees);
  expect(restored.projects.at(-1)!.creative!.commissionConversions[0]).toEqual(firstConversion);
});

test('compact history retains every legacy credit, award, new contract and ledger link after more than 48 completed new projects', () => {
  const world = fixture(); startCareerContract(world, 'actor', careerPayQuote(world, 'actor'), undefined, false); clear(world);
  const legacy = actorCareer(world)!.projects[0]; legacy.responseRoll = 1;
  for (let month = 0; month < 6; month++) period(world);
  expect(legacy.status).toBe('completed'); expect(legacy.award).toBeTruthy(); const legacyBytes = JSON.stringify(legacy, (_, value) => typeof value === 'bigint' ? value.toString() : value);
  enter(world); command(world, { type: 'actor-agency', tier: 'boutique', negotiate: false });
  const career = actorCareer(world)!, contacts = { ...career.actor!.industry.contacts }, npcCount = Object.keys(world.people).length, created: string[] = [];
  for (let index = 0; index < 51; index++) {
    // One award-winning independent film followed by three-month commercials
    // respects the audition cap while retaining an award in the compact archive.
    book(world, index === 0 ? 'independent-film' : 'commercial');
    if (index === 0) {
      const first = career.projects.at(-1)!; first.responseRoll = 1; first.creative!.criticRoll = 1;
      command(world, { type: 'actor-production', action: 'prepare' });
      command(world, { type: 'actor-production', action: 'cooperate' });
    }
    created.push(career.projects.at(-1)!.id); clear(world); finish(world); compactCreativeHistory(career); validateWorld(world);
  }
  expect(career.projects.filter(project => project.creative)).toHaveLength(48); expect(career.creativeArchives).toHaveLength(3); expect(career.actor!.industry.archivedProjects).toBe(3);
  expect(new Set(created).size).toBe(51); expect(career.actor!.industry.completed).toBe(52);
  expect(career.creativeArchives!.find(project => project.id === created[0])!.award).toBe('Lantern Acting Award');
  const facts = progressFacts(world)!; expect(facts.actorProjects).toBe(52); expect(facts.awardedProjects).toBe(2);
  expect(terminalBiography(world)!.accomplishments).toContain('52 completed career projects, including 2 recorded awards');
  expect(JSON.stringify(career.projects.find(project => project.id === legacy.id), (_, value) => typeof value === 'bigint' ? value.toString() : value)).toBe(legacyBytes);
  expect(Object.keys(world.people)).toHaveLength(npcCount); expect(career.actor!.industry.contacts).toEqual(contacts);
  const all = [...career.projects, ...(career.creativeArchives ?? [])], allNew = all.filter(project => project.creative);
  expect(new Set(all.map(project => project.id)).size).toBe(52); expect(new Set(allNew.map(project => project.id))).toEqual(new Set(created));
  for (const project of all) expect(world.workHistory.find(job => job.id === project.employmentId)!.grossEarned).toBe(project.grossEarned);
  expect(allNew.reduce((sum, project) => sum + project.creative!.normalizedGross, 0n)).toBe(career.actor!.industry.totalGross);
  expect(allNew.reduce((sum, project) => sum + project.creative!.normalizedCommission, 0n)).toBe(career.actor!.industry.totalCommission);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});

test.each(['missing-contact', 'wrong-currency', 'duplicate-receipt', 'forged-reference'] as const)('import rejects creative financial corruption: %s', mutation => {
  const source = enter(); command(source, { type: 'actor-agency', tier: 'boutique', negotiate: false }); book(source, 'independent-film'); period(source);
  const world = copyWorld(source), career = actorCareer(world)!, project = career.projects.at(-1)!, meta = project.creative!, industry = career.actor!.industry;
  if (mutation === 'missing-contact') industry.contacts.director = 'person_missing_finance';
  if (mutation === 'wrong-currency') project.currency = project.currency === 'USD' ? 'GBP' : 'USD';
  if (mutation === 'duplicate-receipt') {
    meta.commissionTransactions.push(meta.commissionTransactions[0]); meta.commissionConversions.push({ ...meta.commissionConversions[0] });
    meta.commissionPaid *= 2n; meta.normalizedCommission *= 2n; industry.totalCommission *= 2n;
  }
  if (mutation === 'forged-reference') { meta.commissionConversions[0].reference++; meta.normalizedCommission++; industry.totalCommission++; }
  expect(() => decodeWorld(JSON.stringify(world, (_, value) => typeof value === 'bigint' ? { $dreamsBigInt: value.toString() } : value))).toThrow();
});


test('a dead professional can be replaced explicitly without deleting the former agent or their representation history', () => {
  const world = enter(); command(world, { type: 'actor-agency', tier: 'boutique', negotiate: false });
  const career = actorCareer(world)!, state = career.actor!, oldAgent = state.industry.representation.agentId!;
  recordDeath(world, oldAgent, 'natural causes'); clear(world);
  const deadRecord = JSON.stringify(world.people[oldAgent], (_, value) => typeof value === 'bigint' ? value.toString() : value), oldRelationship = JSON.stringify(relationFor(world, career.personId, oldAgent)), people = Object.keys(world.people).length;
  world.date = monthFrom(world.date, 3);
  command(world, { type: 'actor-agency', tier: 'boutique', negotiate: true });
  const nextAgent = state.industry.representation.agentId!;
  expect(nextAgent).not.toBe(oldAgent); expect(world.people[nextAgent].died).toBeNull(); expect(state.industry.contacts.agent).toBe(nextAgent);
  expect(career.contacts).toContain(oldAgent); expect(career.contacts).toContain(nextAgent); expect(Object.keys(world.people)).toHaveLength(people + 1);
  expect(JSON.stringify(world.people[oldAgent], (_, value) => typeof value === 'bigint' ? value.toString() : value)).toBe(deadRecord);
  expect(JSON.stringify(relationFor(world, career.personId, oldAgent))).toBe(oldRelationship);
  expect(state.industry.representation.history[0].agentId).toBe(oldAgent); expect(state.industry.representation.history[0].ended).toEqual(world.date); expect(state.industry.representation.history.at(-1)!.agentId).toBe(nextAgent);
  expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
