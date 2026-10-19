import { z } from 'zod';
import { ageOn, compareDates, fullName, Person, World } from '../model';
import { countries } from '../countries';
import { DestinationId, destinationIds, destinations } from '../content/travel';
import { jobs } from '../content/jobs';
import { monthFrom } from '../calendar';
import { convertMoney, roundRatio, Currency } from '../money';
import { fxRate } from '../valuation';
import { incomeTax, rules } from '../rules';
import { IneligibleAction } from '../errors';
import { fields, newEducation } from './schemas';
import { Relocation, moveQuoteSchema, relocationPrograms, relocationRoutes } from './relocationSchemas';
import { accountFor, active, availableCash, charge, draw, fact, post, result } from './common';
import { approvals, homeCareReason, parentOf } from './travel';
import { activeTrip, samePhysicalPlace } from './travelSchemas';
import { serviceAway } from './serviceSchemas';
import { hospitalized } from './healthSchemas';
import { isConfined } from './legalSchemas';
import { visibleConvictions } from './legal';
import { publicRoyalDuty } from './royaltySchemas';
import { fullTimeCreator } from './creatorSchemas';
import { recordingCommitment } from './musicSchemas';
import { campaignCommitment } from './politicsSchemas';
import { businessManager } from './businesses';
import { endEmployment, salaryForPerson } from './work';
import { courseMonths, startCourse, tuitionFor } from './education';
import { exchangeQuote, settleTax } from './finance';
import { ownHousehold } from './households';
import { newWorkEarnings } from './earningsSchemas';
import { currentRecovery } from './educationRecoverySchemas';

export const relocationCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('apply-relocation'), destinationId: z.enum(destinationIds), route: z.enum(relocationRoutes), roleId: z.string().nullable(), program: z.enum(relocationPrograms).nullable(), field: z.enum(fields).nullable(), quotedFee: z.bigint().positive() }),
  z.object({ type: z.literal('relocate'), applicationId: z.string(), companionIds: z.array(z.string()).max(11), reserveMonths: z.union([z.literal(3), z.literal(6)]), reviewedQuote: moveQuoteSchema }),
]);
export type RelocationCommand = z.infer<typeof relocationCommandSchema>;
export type RelocationChoice = Pick<Extract<RelocationCommand, { type: 'apply-relocation' }>, 'destinationId' | 'route' | 'roleId' | 'program' | 'field'>;
export const relocationFee = (world: World) => roundRatio(rules[active(world).country].baseWage, 200n);
const applicationKey = (world: World, choice: RelocationChoice) => active(world).id + ':relocation:' + world.date.year + ':' + destinations[choice.destinationId].country + ':' + choice.route;
const consentKey = (world: World, personId: string, childId: string) => world.activePersonId + ':move-consent:' + world.date.year + ':' + personId + ':' + childId;

function personalMoveReason(world: World, person: Person): string | undefined {
  if (person.died || isConfined(world, person) || person.legal.wanted) return 'Moving requires being alive, outside custody and free of active pursuit';
  if (activeTrip(world, person.id) || serviceAway(world, person.id)) return 'Return from the trip or assignment before moving';
  if (hospitalized(world, person) || person.stats.health < 35) return 'Recover your health before moving';
  if (world.pregnancies.some(item => item.carrierId === person.id && item.status === 'pregnant')) return 'Wait until after the pregnancy before moving abroad';
  if (world.cases.some(item => item.personId === person.id && item.status === 'awaiting-trial')) return 'Resolve the current court case before moving';
  if (publicRoyalDuty(world, person.id)) return 'Choose a private royal life before moving';
  if (recordingCommitment(world, person.id) || campaignCommitment(world, person.id)) return 'Finish or cancel the recording or campaign before moving';
  if (!['none', 'primary', 'secondary'].includes(person.education.stage)) return 'Finish or leave the current course before moving; existing qualifications stay yours';
  if (currentRecovery(world, person.id)) return 'Finish or leave the evening course before moving abroad';
}
function offerReason(world: World, choice: RelocationChoice): string | undefined {
  const person = active(world), country = destinations[choice.destinationId].country, rule = rules[country];
  if (choice.route === 'work') {
    const role = jobs.find(item => item.id === choice.roleId);
    if (!role || role.specialCareer || role.partTime || choice.program || choice.field) return 'Choose an ordinary full-time job offer';
    if (fullTimeCreator(world)) return 'Switch your studio to part-time before accepting full-time work abroad';
    if (ageOn(person, world.date) < rule.adultAge || person.stats.smarts < role.smarts) return 'You do not meet this job’s age or skill requirements';
    if (role.qualification && !person.education.qualifications.some(item => item.level === role.qualification && (!role.field || item.field === role.field))) return 'This offer requires ' + role.qualification + (role.field ? ' in ' + role.field : '');
    if (['doctor', 'lawyer', 'teacher', 'police'].includes(role.id) && visibleConvictions(world, person).length) return 'This job requires a clear current background check';
  } else if (choice.route === 'study') {
    if (!choice.program || !choice.field || choice.roleId) return 'Choose a course and subject';
    if (fullTimeCreator(world)) return 'Switch your studio to part-time before studying abroad';
    if (ageOn(person, world.date) < rule.schoolEnd || !person.education.qualifications.some(item => item.level === 'secondary')) return 'Complete secondary education before studying abroad';
    if (choice.program !== 'trade' && person.education.grades < 55) return 'Grades of at least 55% are required';
    if (choice.program === 'graduate' && (!['medicine', 'law'].includes(choice.field) || !person.education.qualifications.some(item => item.level === 'degree'))) return 'Professional study requires a degree and a medicine or law course';
    const level = choice.program === 'trade' ? 'trade' : choice.program === 'university' ? 'degree' : choice.field;
    if (person.education.qualifications.some(item => item.level === level && item.field === choice.field)) return 'You already hold this qualification';
  } else if (choice.roleId || choice.program || choice.field) return 'Settlement does not include a job or course';
}
export function relocationReason(world: World, choice: RelocationChoice): string | undefined {
  const person = active(world);
  if (ageOn(person, world.date) < 18) return 'Apply to move abroad from age eighteen';
  if (destinations[choice.destinationId].country === person.country) return 'Choose a country outside your current residence';
  if (world.date.year >= 999999) return 'This offer extends beyond the supported calendar';
  const reason = personalMoveReason(world, person) ?? offerReason(world, choice); if (reason) return reason;
  if (world.actionCounts[applicationKey(world, choice)]) return 'You already applied for this route to this country this calendar year';
  if (availableCash(accountFor(world)) < relocationFee(world)) return 'Your available balance cannot cover the non-refundable application fee';
}

function taxQuote(world: World, person: Person) {
  return { personId: person.id, currency: countries[person.country].currency, gross: person.finance.cycleGross, withheld: person.finance.cycleWithheld, adjustment: incomeTax(person.finance.cycleGross, rules[person.country]) - person.finance.cycleWithheld };
}
function targetCash(world: World, person: Person, currency: Currency) {
  const account = world.accounts.find(item => item.ownerId === person.id && item.currency === currency), adjustment = countries[person.country].currency === currency ? taxQuote(world, person).adjustment : 0n;
  return (account ? availableCash(account) : 0n) - adjustment;
}
/** The smallest real source debit covering a target amount, including the rounded FX fee. */
export function sourceForNet(world: World, required: bigint, from: Currency, to: Currency) {
  if (required <= 0n || from === to) return 0n;
  let high = 1n;
  while (exchangeQuote(world, high, from, to).net < required) high *= 2n;
  let low = 0n;
  while (low < high) { const mid = (low + high) / 2n; if (exchangeQuote(world, mid, from, to).net >= required) high = mid; else low = mid + 1n; }
  return low;
}
export function moveQuote(world: World, application: Relocation, companionIds: string[] = [], reserveMonths: 3 | 6 = 3) {
  const person = active(world), destination = destinations[application.destinationId], currency = countries[person.country].currency, destinationCurrency = countries[destination.country].currency, ids = [person.id, ...companionIds], rule = rules[destination.country];
  const adults = ids.filter(id => { const member = world.people[id]; return ageOn(member, world.date) >= rule.adultAge && !(ageOn(member, world.date) < rule.schoolEnd && ['primary', 'secondary'].includes(member.education.stage)); }).sort();
  const total = roundRatio(rule.livingCost * BigInt(10000 + Math.max(0, adults.length - 1) * 5000 + (ids.length - adults.length) * 2500), 10000n), count = BigInt(adults.length || 1);
  const tuition = application.course?.tuition ?? 0n;
  const reserves = ids.map(id => {
    const index = adults.indexOf(id), monthly = index < 0 ? 0n : total / count + (BigInt(index) < total % count ? 1n : 0n), required = monthly * BigInt(reserveMonths) + (id === person.id ? tuition : 0n), available = targetCash(world, world.people[id], destinationCurrency);
    return { personId: id, monthly, required, transfer: id !== person.id && required > available ? required - available : 0n };
  });
  const transport = roundRatio(rules[person.country].baseWage * BigInt(ids.reduce((sum, id) => sum + (ageOn(world.people[id], world.date) < 18 ? 7500 : 10000), 0)), 250000n);
  const needed = reserves[0].required + reserves.reduce((sum, item) => sum + item.transfer, 0n) + (currency === destinationCurrency ? transport : 0n) - targetCash(world, person, destinationCurrency), sourceDebit = sourceForNet(world, needed, currency, destinationCurrency), exchange = sourceDebit ? exchangeQuote(world, sourceDebit, currency, destinationCurrency) : { gross: 0n, fee: 0n, net: 0n };
  return { currency, destinationCurrency, reserveMonths, transport, tuition, sourceDebit, ...exchange, rate: fxRate(world, currency, destinationCurrency), reserves, taxes: ids.map(id => taxQuote(world, world.people[id])) };
}
export function moveReason(world: World, application: Relocation, companionIds: string[] = [], reserveMonths: 3 | 6 = 3): string | undefined {
  const person = active(world), ids = [person.id, ...companionIds];
  if (application.personId !== person.id || application.status !== 'approved') return 'Choose your approved move offer';
  if (compareDates(world.date, application.expires) >= 0) return 'This offer has expired; apply again';
  if (person.country !== application.originCountry || person.city !== application.originCity) return 'Your home changed since this offer; apply from your current residence';
  if (new Set(ids).size !== ids.length || ids.length > 12) return 'Choose each household companion once, with at most twelve movers';
  const choice = { destinationId: application.destinationId, route: application.route, roleId: application.job?.roleId ?? null, program: application.course?.program ?? null, field: application.course?.field ?? null };
  const offer = offerReason(world, choice); if (offer) return offer;
  for (const id of ids) {
    const member = world.people[id]; if (!member) return 'Choose existing household members';
    if (id !== person.id && (member.householdId !== person.householdId || !samePhysicalPlace(world, person.id, id))) return 'Companions must share your current household and home city';
    const reason = personalMoveReason(world, member); if (reason) return member.firstName + ': ' + reason;
    if (ageOn(member, world.date) < 18 && !parentOf(world, person.id, id)) return 'Only your existing children or wards can move as minors';
    if (taxQuote(world, member).adjustment > availableCash(accountFor(world, member))) return member.firstName + ' needs to cover existing income tax before moving';
    for (const company of world.businesses.filter(item => item.status === 'active' && item.ownerId === id && item.ownerOperated)) {
      const manager = businessManager(world, company); if (!manager || ids.includes(manager.personId) || hospitalized(world, world.people[manager.personId]) || activeTrip(world, manager.personId) || serviceAway(world, manager.personId)) return 'Keep an available manager at home before moving away from your company';
    }
  }
  const care = homeCareReason(world, person, ids); if (care) return care;
  for (const approval of approvals(world, ids)) if (world.actionCounts[consentKey(world, approval.personId, approval.forPersonId)]) return 'This person’s moving consent has already been requested this calendar year';
  const quote = moveQuote(world, application, companionIds, reserveMonths), source = availableCash(accountFor(world)) - quote.taxes[0].adjustment;
  if (source < quote.transport + quote.sourceDebit || quote.currency === quote.destinationCurrency && source < quote.transport + quote.reserves[0].required + quote.reserves.reduce((sum, item) => sum + item.transfer, 0n)) return 'Your existing cash cannot cover the move, income tax, tuition and household reserve';
}
function ensureAccount(world: World, person: Person, currency: Currency) {
  if (!world.accounts.some(item => item.ownerId === person.id && item.currency === currency)) world.accounts.push({ id: 'account_' + person.id + '_' + currency, ownerId: person.id, currency, cash: 0n, openingCash: 0n, lockedCash: 0n });
}
export function resolveRelocation(world: World, command: RelocationCommand) {
  const person = active(world);
  if (command.type === 'apply-relocation') {
    const reason = relocationReason(world, command); if (reason) throw new IneligibleAction(reason);
    const fee = relocationFee(world); if (fee !== command.quotedFee) throw new IneligibleAction('Review the current application fee');
    const destination = destinations[command.destinationId], local = { ...person, country: destination.country, city: destination.city };
    const chance = command.route === 'study' ? Math.min(95, 20 + Math.round((person.education.grades + person.stats.smarts) / 2)) : command.route === 'work' ? Math.max(15, Math.min(95, 40 + Math.round((person.stats.smarts + person.stats.respect + person.stats.discipline) / 6) - visibleConvictions(world, person).length * 10)) : person.nationality === destination.country ? 100 : Math.min(95, 60 + Math.floor(person.stats.respect / 5) + Math.floor(person.stats.health / 10));
    charge(world, fee, 'relocation-application', 'Application to move to ' + destination.city); world.actionCounts[applicationKey(world, command)] = 1;
    const roll = draw(world, 'outcomes', 1, 100), role = jobs.find(item => item.id === command.roleId);
    const application: Relocation = { id: 'relocation_' + world.revision + '_' + world.relocations.length, personId: person.id, destinationId: command.destinationId, originCountry: person.country, originCity: person.city, route: command.route, applied: { ...world.date }, anchorDay: world.calendarAnchorDay, expires: monthFrom(world.date, 12, world.calendarAnchorDay), status: roll <= chance ? 'approved' : 'declined', roll, chance, applicationFee: fee, applicationTransactionId: world.ledger.at(-1)!.id, job: role ? { roleId: role.id, employer: destination.city + ' ' + role.sector, annualPay: salaryForPerson(local, role) } : null, course: command.program && command.field ? { program: command.program, field: command.field, school: destination.city + (command.program === 'trade' ? ' Technical College' : ' University'), tuition: tuitionFor(local, command.program), requiredMonths: courseMonths(command.program, command.field) } : null, attempts: [], move: null };
    world.relocations.push(application);
    fact(world, 'My application to move to ' + destination.city + ' was ' + application.status + '.', 'relocation-application');
    result(world, application.status === 'approved' ? 'Your move is approved' : 'Application declined', application.status === 'approved' ? 'Your offer is available for twelve calendar months. Review your household, moving costs and funds before departing. Your current home, work and study are unchanged.' : 'The application fee was spent. Your home, work and study are unchanged. You can apply for this route again next calendar year.', 'travel'); return;
  }
  const application = world.relocations.find(item => item.id === command.applicationId); if (!application) throw new IneligibleAction('Choose an existing move offer');
  const reason = moveReason(world, application, command.companionIds, command.reserveMonths); if (reason) throw new IneligibleAction(reason);
  const quote = moveQuote(world, application, command.companionIds, command.reserveMonths);
  const serialiseQuote = (value: typeof quote) => JSON.stringify(moveQuoteSchema.parse(value), (_key, item) => typeof item === 'bigint' ? item.toString() : item);
  if (serialiseQuote(quote) !== serialiseQuote(command.reviewedQuote)) throw new IneligibleAction('Review the current moving and exchange quote');
  const participantIds = [person.id, ...command.companionIds], consents: Relocation['attempts'][number]['consents'] = [{ personId: person.id, forPersonId: person.id, roll: 100, chance: 100, accepted: true }];
  for (const approval of approvals(world, participantIds)) {
    world.actionCounts[consentKey(world, approval.personId, approval.forPersonId)] = 1;
    const relation = world.relationships.find(item => [item.from, item.to].includes(person.id) && [item.from, item.to].includes(approval.personId)), roll = draw(world, 'npcs', 1, 100), chance = isConfined(world, world.people[approval.personId]) || world.people[approval.personId].legal.wanted ? 0 : Math.min(95, 40 + Math.floor((relation?.strength ?? 20) / 2));
    consents.push({ ...approval, roll, chance, accepted: roll <= chance });
  }
  const accepted = consents.every(item => item.accepted); application.attempts.push({ date: { ...world.date }, participantIds, consents, accepted });
  if (!accepted) { const names = [...new Set(consents.filter(item => !item.accepted).map(item => fullName(world.people[item.personId])))].join(', '); fact(world, 'My proposed household move was declined by ' + names + '.', 'relocation-consent'); result(world, 'The household did not agree', names + ' did not consent. Nobody moved and no departure costs were charged. The application fee remains spent. Your offer remains available for a different eligible party.', 'travel'); return; }
  const destination = destinations[application.destinationId], ledgerStart = world.ledger.length, employmentIds: string[] = [], support: NonNullable<Relocation['move']>['support'] = [];
  for (const id of participantIds) {
    const member = world.people[id]; if (member.employment) employmentIds.push(member.employment.id);
    endEmployment(world, id); settleTax(world, member); ensureAccount(world, member, quote.destinationCurrency);
    const rate = fxRate(world, countries[member.country].currency, quote.destinationCurrency), before = member.finance.supportIncomeDue, after = convertMoney({ minor: before, currency: countries[member.country].currency }, quote.destinationCurrency, rate.numerator, rate.denominator).minor;
    support.push({ personId: id, before, after, rate }); member.finance.supportIncomeDue = after;
  }
  charge(world, quote.transport, 'relocation-transport', 'Move to ' + destination.city);
  if (quote.sourceDebit) { post(world, -quote.sourceDebit, 0n, 'relocation-exchange', 'Moving funds exchanged from ' + quote.currency, null, person, quote.currency); post(world, quote.net, 0n, 'relocation-exchange', 'Moving funds received after FX fee', null, person, quote.destinationCurrency); }
  for (const reserve of quote.reserves.filter(item => item.transfer > 0n)) { post(world, -reserve.transfer, 0n, 'relocation-household', 'Initial household reserve for ' + fullName(world.people[reserve.personId]), null, person, quote.destinationCurrency); post(world, reserve.transfer, 0n, 'relocation-household', 'Initial household reserve from ' + fullName(person), null, world.people[reserve.personId], quote.destinationCurrency); }
  for (const asset of world.assets) if (asset.ownerId && participantIds.includes(asset.ownerId) && asset.primaryHome) asset.primaryHome = false;
  const householdId = ownHousehold(world, person, command.companionIds);
  for (const id of participantIds) {
    const member = world.people[id]; member.country = destination.country; member.city = destination.city; member.lastEconomicMonth = world.date.year * 12 + world.date.month - 1; member.training = null;
    if (['primary', 'secondary'].includes(member.education.stage)) { const previous = member.education; member.education = { ...newEducation(), grades: previous.grades, qualifications: previous.qualifications, effort: previous.effort }; const age = ageOn(member, world.date), rule = rules[member.country]; if (!previous.qualifications.some(item => item.level === 'secondary') && age >= rule.schoolStart && age < rule.schoolEnd) { member.education.stage = age < rule.secondaryStart ? 'primary' : 'secondary'; member.education.school = member.city + (member.education.stage === 'primary' ? ' Primary School' : ' Secondary School'); } }
    fact(world, 'I moved from ' + application.originCity + ' to ' + destination.city + ', ' + countries[destination.country].name + '. My nationality remains ' + countries[member.nationality].name + '.', 'relocation', '', id);
  }
  let newEmploymentId: string | null = null;
  if (application.job) { const job = application.job; newEmploymentId = 'employment_move_' + world.revision; person.employment = { id: newEmploymentId, roleId: job.roleId, employer: job.employer, companyId: null, currency: quote.destinationCurrency, rank: 0, annualPay: job.annualPay, paidMonths: 0, performance: 55, effort: 'balanced' }; world.workHistory.push({ id: newEmploymentId, personId: person.id, roleId: job.roleId, employer: job.employer, companyId: null, started: { ...world.date }, ended: null, monthsWorked: 0, grossEarned: 0n, ...newWorkEarnings(quote.destinationCurrency) }); }
  if (application.course) startCourse(world, application.course.program, application.course.field, 'cash', application.course.school);
  application.status = 'moved'; application.move = { date: { ...world.date }, participantIds, householdId, quote, transactionIds: world.ledger.slice(ledgerStart).map(item => item.id), employmentIds, newEmploymentId, support };
  result(world, 'Welcome home to ' + destination.city, 'Your household has moved. The old jobs have ended, existing tax was settled, and your existing cash funded the departure and local reserve. ' + (application.job ? 'Your confirmed job starts now; the first salary is earned next month. ' : application.course ? 'Your first year of tuition is paid; study progress starts next month. ' : 'No job or course is included. ') + 'Your nationality, existing qualifications, debts, foreign accounts, property and earned pension rights stay yours. Former homes are retained as unoccupied property; the new household pays local living costs.', 'travel');
}
