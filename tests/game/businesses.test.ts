import { decodeWorld, encodeWorld, validateWorld, World } from '../../src/game/model';
import { recordDeath, resolveCommand } from '../../src/game/engine';
import { accountFor } from '../../src/game/systems/common';
import { businessStartupQuote, staffPayQuote, availableBusinessProfit, agencyFee, improvementQuote, expansionQuote } from '../../src/game/systems/businesses';
import { businessMonth } from '../../src/game/systems/businessMonth';
import { businessBook, businessCost, settleBusinessPayables } from '../../src/game/systems/businessCore';
import { businessSaleQuote, businessValue, companyClaimValue } from '../../src/game/businessValuation';
import { employmentBackPay, endEmployment, workMonth } from '../../src/game/systems/work';
import { netWorth } from '../../src/game/valuation';
import { monthFrom } from '../../src/game/calendar';
import { addChild } from '../../src/game/systems/family';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { decodeSave } from '../../src/persistence/archive';
import { unpackCheckpoint } from '../../src/persistence/checkpoints';
import { countryCodes, countries } from '../../src/game/countries';
import { businessKinds, BusinessKind } from '../../src/game/content/businesses';
import { settleTax } from '../../src/game/systems/finance';
import { roundRatio } from '../../src/game/money';
import { monthlyAmount } from '../../src/game/rules';
import graduateFixture from '../fixtures/v3-employed-graduate.json';
import marriageFixture from '../fixtures/v5-marriage-result.json';
import creatorArchive from '../fixtures/v10-creator-archive.json';

function fixture() { const world = decodeWorld(JSON.stringify(graduateFixture)), account = accountFor(world); account.cash += 100000000n; account.openingCash += 100000000n; return world; }
function drain(input: World): World { let world = input, guard = 0; while (world.pending && guard++ < 100) { if (world.pending.kind === 'result') world = resolveCommand(world, { type: 'acknowledge', resultId: world.pending.id }); else { const choice = world.pending.choices.find(item => !choiceUnavailable(world, item)); if (!choice) throw new Error('No available decision'); world = resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId: choice.id }); } } return world; }
function start(input = fixture(), kind: BusinessKind = 'cafe', operation: 'owner' | 'manager' = 'manager') { return drain(resolveCommand(input, { type: 'start-business', kind, name: 'Little Dreams', operation, quotedCapital: businessStartupQuote(input, kind).capital })); }
function month(input: World) { const world = decodeWorld(encodeWorld(input)); world.date = monthFrom(world.date, 1); businessMonth(world); return validateWorld(world); }
function year(input: World) { let world = resolveCommand(input, { type: 'advance' }), guard = 0; while ((world.pending || world.annual) && !world.people[world.activePersonId].died && guard++ < 200) world = world.pending ? drain(world) : resolveCommand(world, { type: 'resume' }); if (guard >= 200) throw new Error('Company year stalled'); return world; }

test('capital creates equity once; startup fees and an immediate sale cannot manufacture wealth', () => {
  const initial = fixture(), quote = businessStartupQuote(initial, 'cafe'), before = netWorth(initial).minor;
  let world = start(initial); const company = world.businesses[0];
  expect(netWorth(world).minor).toBe(before - quote.registration - agencyFee(company) * 2n);
  expect(company.staff).toHaveLength(2); expect(company.staff.every(member => world.people[member.personId].employment?.companyId === company.id)).toBe(true);
  expect(company.months).toHaveLength(0); expect(company.monthsOperated).toBe(0); expect(availableBusinessProfit(world, company)).toBe(0n);
  expect(() => resolveCommand(world, { type: 'withdraw-business-profit', businessId: company.id, amount: 1n })).toThrow(/distributable/);
  const sale = businessSaleQuote(world, company), cash = accountFor(world).cash;
  world = drain(resolveCommand(world, { type: 'sell-business', businessId: company.id, mode: 'sale', quotedProceeds: sale.proceeds }));
  expect(accountFor(world).cash).toBe(cash + sale.proceeds); expect(world.businesses[0].status).toBe('sold'); expect(netWorth(world).minor).toBeLessThan(before);
  expect(world.businesses[0].staff.every(member => member.ended && world.people[member.personId].employment?.companyId === null)).toBe(true);
  validateWorld(world);
});
test('an owner works a real funded contract; pay, withholding, gross history and service are recorded once', () => {
  const input = fixture(); endEmployment(input); let world = start(input, 'cafe', 'owner'); const ownerId = world.activePersonId, companyId = world.businesses[0].id, employmentId = world.people[ownerId].employment!.id, beforeService = world.people[ownerId].finance.serviceMonths;
  expect(world.workHistory.find(item => item.id === employmentId)!.grossEarned).toBe(0n); world = month(world);
  const company = world.businesses[0], record = world.workHistory.find(item => item.id === employmentId)!;
  expect(record.monthsWorked).toBe(1); expect(record.grossEarned).toBeGreaterThan(0n); expect(world.people[ownerId].finance.serviceMonths).toBe(beforeService + 1);
  const funded = -world.businessLedger.filter(item => item.businessId === companyId && item.employmentId === employmentId && item.category === 'payroll').reduce((sum, item) => sum + item.cashDelta, 0n);
  expect(funded).toBe(record.grossEarned); const cash = accountFor(world).cash; workMonth(world); expect(accountFor(world).cash).toBe(cash);
  expect(company.months[0].profit).toBe(company.months[0].revenue - company.months[0].expenses); validateWorld(world);
});
test('part-paid wages remain a real claim and later payment increases original earnings without extra service', () => {
  let world = start(); const company = world.businesses[0], member = company.staff[0], person = world.people[member.personId], contract = person.employment!, before = world.workHistory.find(item => item.id === contract.id)!.grossEarned, service = person.finance.serviceMonths;
  businessBook(world, company, -company.cash, 0n, 'test-loss', 'Isolated lost working capital'); businessBook(world, company, 7n, 0n, 'test-recovery', 'Recovered cash');
  const wages = businessCost(world, company, 1000n, 'payroll', 'Part-paid wages', 'wages', person.id, contract.id); employmentBackPay(world, person, contract.id, wages.paid);
  expect(wages).toEqual({ paid: 7n, unpaid: 993n }); expect(companyClaimValue(world, world.businessPayables[0])).toBe(993n); validateWorld(world);
  const earned = world.workHistory.find(item => item.id === contract.id)!.grossEarned; businessBook(world, company, 993n, 0n, 'test-recovery', 'Recovered receivable'); settleBusinessPayables(world, company);
  expect(world.businessPayables[0].principal).toBe(0n); expect(world.workHistory.find(item => item.id === contract.id)!.grossEarned).toBe(before + 1000n); expect(earned).toBe(before + 7n); expect(person.finance.serviceMonths).toBe(service); validateWorld(world);
});
test('an insolvent wage claim is capped by recoverable assets and equal-priority creditors share liquidation exactly', () => {
  let world = start(); const company = world.businesses[0]; businessBook(world, company, -company.cash, 0n, 'test-loss', 'Working capital lost'); company.equipment = 0n;
  for (const member of company.staff) businessCost(world, company, 1000000n, 'payroll', 'Unpaid wages', 'wages', member.personId, member.employmentId);
  expect(world.businessPayables.every(item => companyClaimValue(world, item) === 0n)).toBe(true); expect(businessValue(world, company)).toBe(0n);
  businessBook(world, company, 101n, 0n, 'test-recovery', 'Liquidation recovery'); const price = businessSaleQuote(world, company, 'close');
  const before = company.staff.map(member => world.workHistory.find(item => item.id === member.employmentId)!.grossEarned);
  world = drain(resolveCommand(world, { type: 'sell-business', businessId: company.id, mode: 'close', quotedProceeds: price.proceeds }));
  const recovered = company.staff.map((member, index) => world.workHistory.find(item => item.id === member.employmentId)!.grossEarned - before[index]); expect(recovered.sort((a,b) => Number(a-b))).toEqual([50n, 51n]);
  expect(world.businessPayables.reduce((sum, item) => sum + item.writtenOff, 0n)).toBe(1999899n); expect(world.businessPayables.every(item => item.principal === 0n)).toBe(true); validateWorld(world);
});
test('prices, promotion, facilities and real staffing affect delivered orders and cost real money', () => {
  const world = start(); const id = world.businesses[0].id;
  const low = month(drain(resolveCommand(world, { type: 'business-prices', businessId: id, priceBps: 7500 }))), high = month(drain(resolveCommand(world, { type: 'business-prices', businessId: id, priceBps: 15000 })));
  expect(low.businesses[0].months[0].customers).toBeGreaterThan(high.businesses[0].months[0].customers);
  const oldValue = businessValue(world, world.businesses[0]), cost = improvementQuote(world.businesses[0]); const improved = drain(resolveCommand(world, { type: 'improve-business', businessId: id, quotedCost: cost }));
  expect(improved.businesses[0].facilities).toBe(1); expect(businessValue(improved, improved.businesses[0])).toBeLessThan(oldValue); expect(improved.businesses[0].pendingExpenses).toBeGreaterThan(0n);
  const expand = expansionQuote(world.businesses[0]); expect(() => resolveCommand(world, { type: 'expand-business', businessId: id, quotedCost: expand + 1n })).toThrow(/quote/);
  const advertised = month(drain(resolveCommand(world, { type: 'business-marketing', businessId: id, marketing: 'regional' })));
  expect(advertised.businessLedger.some(item => item.category === 'marketing' && item.cashDelta < 0n)).toBe(true); validateWorld(advertised);
});
test('staff hires match the quote, severance is funded or owed, and the founder cannot farm self-severance', () => {
  let world = start(); const company = world.businesses[0], annualPay = staffPayQuote(world, company, 'worker');
  expect(() => resolveCommand(world, { type: 'hire-business-staff', businessId: company.id, role: 'worker', quotedPay: annualPay + 1n })).toThrow(/salary quote/);
  world = drain(resolveCommand(world, { type: 'hire-business-staff', businessId: company.id, role: 'worker', quotedPay: annualPay })); const worker = world.businesses[0].staff.at(-1)!; expect(world.people[worker.personId].employment!.annualPay).toBe(annualPay);
  const before = world.people[worker.personId].finance.serviceMonths; world = drain(resolveCommand(world, { type: 'dismiss-business-staff', businessId: company.id, employmentId: worker.employmentId }));
  expect(world.people[worker.personId].employment).toBeNull(); expect(world.people[worker.personId].finance.serviceMonths).toBe(before); expect(world.workHistory.find(item => item.id === worker.employmentId)!.grossEarned).toBeGreaterThan(0n); validateWorld(world);
  const input = fixture(); endEmployment(input); const owner = start(input, 'cafe', 'owner'); expect(() => resolveCommand(owner, { type: 'dismiss-business-staff', businessId: owner.businesses[0].id, employmentId: owner.people[owner.activePersonId].employment!.id })).toThrow(/another current/);
});
test('an owner can delegate to an actual available manager and later return to the same company', () => {
  const input = fixture(); endEmployment(input); let world = start(input, 'cafe', 'owner'), company = world.businesses[0];
  expect(() => resolveCommand(world, { type: 'operate-business', businessId: company.id, operated: false })).toThrow(/manager/);
  world = drain(resolveCommand(world, { type: 'hire-business-staff', businessId: company.id, role: 'manager', quotedPay: staffPayQuote(world, company, 'manager') })); world = drain(resolveCommand(world, { type: 'operate-business', businessId: company.id, operated: false }));
  expect(world.people[world.activePersonId].employment).toBeNull(); expect(world.businesses[0].ownerOperated).toBe(false);
  world = drain(resolveCommand(world, { type: 'operate-business', businessId: company.id, operated: true })); expect(world.businesses[0].id).toBe(company.id); expect(world.businesses[0].staff.filter(item => !item.ended)).toHaveLength(2); validateWorld(world);
});
test('three unpaid months liquidate a failed firm, write off shortages and never create owner debt', () => {
  let world = start(fixture(), 'software'); const company = world.businesses[0];
  for (const member of [...company.staff]) endEmployment(world, member.personId); businessBook(world, company, -company.cash, 0n, 'test-loss', 'Working capital lost'); company.equipment = 0n;
  const ownerDebts = world.liabilities.filter(item => item.ownerId === world.activePersonId).map(item => [item.id, item.principal]);
  world = month(world); expect(world.pending?.title).toBe('Cash flow under pressure'); world = drain(world); world = month(world); world = drain(world); world = month(world);
  expect(world.businesses[0].status).toBe('failed'); expect(world.businesses[0].cash).toBe(0n); expect(world.businessPayables.every(item => item.principal === 0n && item.writtenOff > 0n)).toBe(true); expect(world.liabilities.filter(item => item.ownerId === world.activePersonId).map(item => [item.id, item.principal])).toEqual(ownerDebts); validateWorld(world);
});
test('company payroll and performance cannot be imported with fabricated cash or duplicated gross earnings', () => {
  const world = month(start()), badCash = decodeWorld(encodeWorld(world)), badPay = decodeWorld(encodeWorld(world)); badCash.businesses[0].cash++; expect(() => validateWorld(badCash)).toThrow(/company state/);
  const employmentId = badPay.businesses[0].staff[0].employmentId; badPay.workHistory.find(item => item.id === employmentId)!.grossEarned++; expect(() => validateWorld(badPay)).toThrow();
});
test('distributions use actual earned profit and enter taxable/support income; fresh capital cannot be withdrawn as profit', () => {
  const input = fixture(), ownerId = input.activePersonId, gross = input.people[ownerId].finance.cycleGross, support = input.people[ownerId].finance.supportIncomeDue;
  let world = month(start(input)), company = world.businesses[0]; expect(company.dividends).toBeGreaterThan(0n); expect(world.people[ownerId].finance.cycleGross).toBe(gross + company.dividends); expect(world.people[ownerId].finance.supportIncomeDue).toBe(support + company.dividends);
  const beforeProfit = availableBusinessProfit(world, company); world = drain(resolveCommand(world, { type: 'fund-business', businessId: company.id, amount: 1000000n })); company = world.businesses[0]; expect(availableBusinessProfit(world, company)).toBe(beforeProfit); const before = accountFor(world).cash;
  world = drain(resolveCommand(world, { type: 'withdraw-business-profit', businessId: company.id, amount: beforeProfit })); expect(accountFor(world).cash).toBe(before + beforeProfit); expect(availableBusinessProfit(world, world.businesses[0])).toBe(0n); validateWorld(world);
});
test('hospital leave pays half actual company wages and supplies no customer capacity for that person', () => {
  const input = fixture(); endEmployment(input); let world = start(input, 'cafe', 'owner'); const owner = world.people[world.activePersonId], annualPay = owner.employment!.annualPay; owner.health.hospitalizedUntil = world.date.year * 12 + world.date.month + 1;
  world = month(world); expect(world.businesses[0].months[0].customers).toBe(0); expect(world.businesses[0].months[0].payroll).toBe(monthlyAmount(roundRatio(annualPay, 2n), 0)); expect(world.people[world.activePersonId].employment!.paidMonths).toBe(1); validateWorld(world);
});
test('a remanded owner earns no company wages; remote funding remains possible while operating is blocked', () => {
  const input = fixture(); endEmployment(input); const initial = start(input, 'cafe', 'owner'); let arrested: World | undefined;
  for (let seed = 1; seed < 100; seed++) { const candidate = validateWorld(initial); candidate.random.outcomes = seed; const next = resolveCommand(candidate, { type: 'crime', offence: 'vandalism' }); if (next.pending?.kind === 'decision') { arrested = next; break; } }
  if (!arrested || arrested.pending?.kind !== 'decision') throw new Error('Expected a saved arrest'); let world = drain(resolveCommand(arrested, { type: 'choose', eventId: arrested.pending.id, choiceId: 'remand' }));
  const companyId = world.businesses[0].id, service = world.people[world.activePersonId].finance.serviceMonths; world = month(world); expect(world.businesses[0].months[0].payroll).toBe(0n); expect(world.businesses[0].months[0].customers).toBe(0); expect(world.people[world.activePersonId].finance.serviceMonths).toBe(service);
  world = drain(resolveCommand(world, { type: 'fund-business', businessId: companyId, amount: 1000n })); expect(() => resolveCommand(world, { type: 'operate-business', businessId: companyId, operated: true })).toThrow(/custody/); validateWorld(world);
});
test('recent monthly detail rolls into exact annual archives while total profit, payroll and period counts remain reconciled', () => {
  let world = start(); for (let index = 0; index < 73 && world.businesses[0].status === 'active'; index++) world = month(world);
  const company = world.businesses[0]; expect(company.status).toBe('active'); expect(company.months).toHaveLength(60); expect(company.archives.reduce((sum,item) => sum + item.months, 0)).toBe(13);
  expect([...company.months, ...company.archives].reduce((sum,item) => sum + item.profit, 0n)).toBe(company.cumulativeProfit); validateWorld(world);
});
test('necessary income tax can be paid from a minor inheritance without unlocking voluntary spending', () => {
  const world = fixture(), owner = world.people[world.activePersonId], account = accountFor(world); owner.born = { ...world.date, year: world.date.year - 10 }; endEmployment(world); account.lockedCash = account.cash; owner.finance.cycleGross = 10000000n; owner.finance.cycleWithheld = 0n; const before = account.cash; settleTax(world);
  expect(account.cash).toBeLessThan(before); expect(account.lockedCash).toBe(account.cash); expect(world.liabilities.some(item => item.ownerId === owner.id && item.kind === 'tax' && item.principal > 0n)).toBe(false);
});
test.each(businessKinds)('%s has actual qualified people, local expenses and a complete first operating period', kind => { const world = month(start(fixture(), kind)); expect(world.businesses[0].months).toHaveLength(1); expect(world.businesses[0].months[0].customers).toBeGreaterThan(0); expect(world.businesses[0].staff.every(member => world.people[member.personId].employment?.companyId === world.businesses[0].id)).toBe(true); validateWorld(world); });
test.each(countryCodes)('%s startup and payroll reconcile in the country currency', country => {
  const initial = fixture(), owner = initial.people[initial.activePersonId], currency = countries[country].currency; owner.country = country; owner.city = countries[country].cities[0]; endEmployment(initial);
  if (!initial.accounts.some(item => item.ownerId === owner.id && item.currency === currency)) initial.accounts.push({ id: 'company_local_' + country, ownerId: owner.id, currency, cash: 100000000n, openingCash: 100000000n, lockedCash: 0n });
  const world = month(start(initial)); expect(world.businessLedger.every(item => item.currency === currency)).toBe(true); expect(world.businesses[0].months[0].payroll).toBeGreaterThan(0n); validateWorld(world);
});
test('a real minor inherits the same managed company, keeps its staff and receives protected distributions', () => {
  let world = drain(decodeWorld(JSON.stringify(marriageFixture))); const owner = world.people[world.activePersonId], spouse = world.people[world.marriages[0].a === owner.id ? world.marriages[0].b : world.marriages[0].a], account = accountFor(world); account.cash += 100000000n; account.openingCash += 100000000n;
  const child = addChild(world, [owner, spouse], 'biological'); world = start(world); const company = world.businesses[0], team = company.staff.map(item => item.personId);
  world = drain(resolveCommand(world, { type: 'save-will', executorId: spouse.id, shares: [{ personId: spouse.id, bps: 5000 }, { personId: child.id, bps: 5000 }], bequests: [{ assetId: company.id, personId: child.id }] }));
  recordDeath(world, owner.id, 'test fixture'); expect(world.businesses[0].ownerId).toBe(child.id); expect(world.businesses[0].staff.map(item => item.personId)).toEqual(team); expect(world.estates.at(-1)!.distributions.find(item => item.personId === child.id)!.assets).toContain(company.id);
  world = drain(resolveCommand(world, { type: 'continue-child', personId: child.id })); expect(world.activePersonId).toBe(child.id); expect(() => resolveCommand(world, { type: 'fund-business', businessId: company.id, amount: 1n })).toThrow(/minor/); world = month(world); expect(world.businesses[0].ownerId).toBe(child.id); expect(accountFor(world).lockedCash).toBe(accountFor(world).cash); validateWorld(world);
});
test('an unstaffed owner-operated company must be sold by the estate instead of becoming a pretend managed bequest', () => {
  let world = drain(decodeWorld(JSON.stringify(marriageFixture))); const owner = world.people[world.activePersonId], spouseId = world.marriages[0].a === owner.id ? world.marriages[0].b : world.marriages[0].a, account = accountFor(world); account.cash += 100000000n; account.openingCash += 100000000n; endEmployment(world); world = start(world, 'cafe', 'owner');
  world = drain(resolveCommand(world, { type: 'save-will', executorId: spouseId, shares: [{ personId: spouseId, bps: 10000 }], bequests: [{ assetId: world.businesses[0].id, personId: spouseId }] })); recordDeath(world, world.activePersonId, 'test fixture'); expect(world.businesses[0].status).toBe('sold'); expect(world.estates[0].notes.some(note => note.includes('continuing manager'))).toBe(true); validateWorld(world);
});
test('a deceased employee’s recoverable wage claim is assigned once; future payment never credits the deceased', () => {
  const world = start(), company = world.businesses[0], member = company.staff[0], person = world.people[member.personId]; businessBook(world, company, -company.cash, 0n, 'test-loss', 'Cash lost'); businessCost(world, company, 1000n, 'payroll', 'Outstanding wages', 'wages', person.id, member.employmentId);
  recordDeath(world, person.id, 'test fixture'); const claim = world.businessPayables[0]; expect(claim.creditorId).toBeNull(); expect(world.estates.find(item => item.personId === person.id)!.notes.some(note => note.includes('recoverable'))).toBe(true);
  businessBook(world, company, 1000n, 0n, 'test-recovery', 'Recovered cash'); settleBusinessPayables(world, company); expect(world.accounts.filter(item => item.ownerId === person.id).every(item => item.cash === 0n)).toBe(true); expect(claim.principal).toBe(0n); validateWorld(world);
});
test.each([17, 93])('seed %i runs connected company years with deterministic reloads and real annual payroll', seed => {
  let world = start(); world.random.economy = seed; for (let index = 0; index < 3 && !world.people[world.activePersonId].died; index++) { const replay = year(decodeWorld(encodeWorld(world))); world = year(world); expect(world).toEqual(replay); }
  expect(world.businesses[0].monthsOperated).toBeGreaterThan(0); expect(world.businessLedger.some(item => item.category === 'payroll')).toBe(true); validateWorld(world);
});
test('the genuine v10 creator archive migrates without resetting accrued support, offers, posts, history or RNG', () => {
  const archive = decodeSave(JSON.stringify(creatorArchive)), world = archive.world; expect(world.schemaVersion).toBe(24); expect(world.businesses).toEqual([]); expect(world.businessLedger).toEqual([]); expect(world.businessPayables).toEqual([]);
  expect(world.people[world.activePersonId].finance.supportIncomeDue).toBe(119n); expect(world.socialAccounts[0].totalPosts).toBe(8); expect(world.socialAccounts[0].followers).toBe(5346); expect(world.pending?.kind === 'decision' && world.pending.templateId).toBe('brand-offer'); expect(archive.snapshots).toHaveLength(1);
  const historical = unpackCheckpoint(archive.snapshots[0].payload); expect(historical.schemaVersion).toBe(24); expect(historical.businesses).toEqual([]); expect(decodeWorld(encodeWorld(world))).toEqual(world);
});
