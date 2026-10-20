import type { Person, World } from '../model';
import { ageOn } from '../model';
import { rules, monthlyAmount } from '../rules';
import { roundRatio } from '../money';
import { jobs, type JobRole } from '../content/jobs';
import type { CountryCode } from '../countries';
import type { HourlyContract, HourlyTerms } from './hourlyWorkSchemas';

export const hourlyAnnual = (terms: HourlyTerms) => terms.hourlyRate * BigInt(terms.weeklyHours * terms.paidWeeks);
/** Authored 12-hour baseline, not a claim about national minimum wages. */
export function hourlyQuote(country: CountryCode, role: JobRole, weeklyHours: HourlyTerms['weeklyHours'] = 12): HourlyTerms {
  if (!role.partTime || !['shop-assistant-part', 'cafe-part'].includes(role.id)) throw new Error('This role uses an annual salary');
  const rate = roundRatio(rules[country].baseWage * BigInt(role.wageBps), 10000n * 12n * 52n);
  return { hourlyRate: rate > 0n ? rate : 1n, weeklyHours, paidWeeks: 52 };
}
export function hourlyStudentReason(world: World, hours: number, person = world.people[world.activePersonId]): string | undefined {
  const schoolAge = ageOn(person, world.date) < rules[person.country].schoolEnd && !person.education.qualifications.some(q => q.level === 'secondary');
  if (hours > 16 && (person.education.stage !== 'none' || schoolAge)) return 'Students can work at most 16 contracted hours each week';
}
export const hourlyContract = (world: World, employmentId = world.people[world.activePersonId].employment?.id) => world.hourlyContracts.find(item => item.employmentId === employmentId);
export const currentHourlyRate = (contract: HourlyContract) => contract.rates.at(-1)?.hourlyRateAfter ?? contract.terms.hourlyRate;
export const currentHourlyTerms = (contract: HourlyContract): HourlyTerms => ({ ...contract.terms, hourlyRate: currentHourlyRate(contract) });
export function hourlyEnrollmentReason(world: World, person = world.people[world.activePersonId]): string | undefined {
  const contract = hourlyContract(world, person.employment?.id);
  if (contract && contract.terms.weeklyHours > 16) return 'Leave your 20-hour contract before starting full-time study; student work is limited to 16 hours a week';
}
export const hourlyPeriodGross = (terms: HourlyTerms, firstPeriod: number, periods = 1, factorBps: 5000 | 10000 = 10000) => {
  const annual = roundRatio(hourlyAnnual(terms) * BigInt(factorBps), 10000n);
  return periods === 1 ? monthlyAmount(annual, firstPeriod) : roundRatio(annual * BigInt(firstPeriod + periods), 12n) - roundRatio(annual * BigInt(firstPeriod), 12n);
};
export function recordHourlyPeriod(contract: HourlyContract, date: World['date'], firstPeriod: number, periods: number, hourlyRate: bigint, attendance: HourlyContract['periods'][number]['attendance'], gross: bigint, transactionId: string | null, factorBps: 5000 | 10000 = 10000) {
  const paidMinutes = contract.terms.weeklyHours * contract.terms.paidWeeks * 5 * periods * factorBps / 10000;
  contract.periods.push({ date: { ...date }, firstPeriod, periods, hourlyRate, factorBps, attendance, paidMinutes, workedMinutes: attendance === 'worked' || attendance === 'background' ? paidMinutes : 0, gross, transactionId });
}
export function updateHourlyRate(world: World, person: Person, kind: 'raise' | 'promotion', rankAfter: number, raiseId: string | null = null) {
  const job = person.employment!, contract = hourlyContract(world, job.id);
  if (!contract) return;
  const before = currentHourlyRate(contract), after = kind === 'raise' ? roundRatio(before * 10500n, 10000n) : roundRatio(before * BigInt(100 + rankAfter * 25), BigInt(100 + job.rank * 25));
  contract.rates.push({ kind, date: { ...world.date }, firstPeriod: job.paidMonths, hourlyRateBefore: before, hourlyRateAfter: after, rankBefore: job.rank, rankAfter, raiseId });
  job.annualPay = hourlyAnnual({ ...contract.terms, hourlyRate: after });
}
export const ordinaryHourlyRole = (id: string) => jobs.find(role => role.id === id && role.partTime && !role.specialCareer);
