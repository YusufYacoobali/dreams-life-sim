import { countryCodes } from '../../src/game/countries';
import { ageOn, encodeWorld, type World } from '../../src/game/model';
import { minimumSchoolLeavingAge, rules } from '../../src/game/rules';
import { currentSchool } from '../../src/game/systems/schoolSchemas';
import { schoolWithdrawalReason } from '../../src/game/systems/school';
import { createCriminalLife, criminalMilestones, runCriminalPolicy } from '../support/criminalPolicy';

test('actual saved birth and ordinary childhood preserve the input, enforce compulsory school and never create an underage offence', async () => {
  const initial = await createCriminalLife('US', 900), payload = encodeWorld(initial);
  expect(initial.revision).toBe(1); expect(initial.birthAcknowledged).toBe(true); expect(Object.isFrozen(initial)).toBe(true);
  const { world, trace, report } = runCriminalPolicy(initial, { maxYears: 8 });
  expect(encodeWorld(initial)).toBe(payload); expect(world.activePersonId).toBe(initial.activePersonId); expect(report.ageAtEnd).toBe(8); expect(report.naturallyDied).toBe(false);
  expect(report.milestones.schoolAttendance.status).toBe('reached'); expect(report.milestones.compulsoryLeaveGuard.status).toBe('reached'); expect(report.incidents).toHaveLength(0);
  expect(trace.some(command => command.type === 'crime')).toBe(false); expect(report.milestones.conviction.status).toBe('unreached-at-policy-bound'); expect(report.milestones.death.status).toBe('unreached-at-policy-bound');
  expect(report.scenarioBComplete).toBe(false); expect(report.explicitGaps.some(reason => reason.includes('No compulsory-school dropout command'))).toBe(false); expect(Object.keys(report.milestones)).toEqual([...criminalMilestones]); expect(report.commandsAttempted).toBe(trace.length); expect(report.commandsCommitted).toBe(world.revision - initial.revision);
  expect(report.coldChecks.length).toBeGreaterThan(0); expect(report.coldChecks.every(row => row.format === 'dreams-checkpoint-v4' && row.canonicalBytes > row.checkpointBytes && row.checkpointBytes > 0)).toBe(true);
  expect(() => runCriminalPolicy(world)).toThrow();
}, 30000);

test('ordinary adult policy records genuine school exit, bounded real offences, victims and judicial outcomes without choosing hidden rolls', async () => {
  const initial = await createCriminalLife('US', 900), { world, trace, report } = runCriminalPolicy(initial, { maxYears: 22 });
  const crimes = trace.filter(command => command.type === 'crime');
  expect(report.policyVersion).toBe(2); expect(report.milestones.schoolExit).toMatchObject({ status: 'reached', age: minimumSchoolLeavingAge.US, evidence: { exit: 'voluntary-secondary-withdrawal', withdrawal: report.schoolWithdrawals[0] } });
  expect(report.schoolWithdrawals).toHaveLength(1); expect(report.schoolCompletions).toEqual([]);
  const withdrawalIndex = trace.map(command => command.type).lastIndexOf('school-withdraw');
  expect(withdrawalIndex).toBeGreaterThanOrEqual(0); expect(withdrawalIndex).toBeLessThan(trace.findIndex(command => command.type === 'crime'));
  expect(crimes.length).toBeGreaterThan(0); expect(crimes.length).toBeLessThanOrEqual(3); expect(crimes.map(command => command.offence)).toEqual(['shoplift', 'pickpocket', 'burglary'].slice(0, crimes.length));
  expect(report.incidents.length).toBe(crimes.length); expect(report.incidents.every(row => row.date.year - initial.people[initial.activePersonId].born.year >= 18)).toBe(true);
  for (const crime of crimes) if (crime.offence === 'pickpocket') { expect(crime.victimId).toBeDefined(); expect(world.people[crime.victimId!]).toBeDefined(); }
  expect(report.cases.every(row => row.plea === null || row.plea === 'not-guilty')).toBe(true); expect(report.cases.every(row => row.juvenile === false)).toBe(true);
  expect(report.commandsAttempted).toBe(trace.length); expect(report.commandsCommitted).toBe(world.revision - initial.revision); expect(report.scenarioBComplete).toBe(false); expect(report.coldChecks.some(row => row.reason === 'actual offence')).toBe(true);
}, 30000);


test.each(['US', 'IN', 'JP'] as const)('%s policy withdraws at its first real eligible action window without granting qualifications, income, employment or random draws', async country => {
  const seed = 900 + countryCodes.indexOf(country), initial = await createCriminalLife(country, seed), minimum = minimumSchoolLeavingAge[country];
  let previous = initial, firstEligible: { world: World; nextCommandIndex: number } | undefined, withdrawalCommands = 0;
  const { world, trace, report } = runCriminalPolicy(initial, { maxYears: minimum + 1, onStep: (current, commands) => {
    const command = commands.at(-1);
    if (command?.type === 'school-withdraw' && current.revision > previous.revision) {
      withdrawalCommands++;
      expect(firstEligible).toBeDefined(); expect(commands.length - 1).toBe(firstEligible!.nextCommandIndex);
      expect(encodeWorld(previous)).toBe(encodeWorld(firstEligible!.world));
      const school = currentSchool(previous)!;
      expect(command).toEqual({ type: 'school-withdraw', communityId: school.id, country: school.country, city: school.city, school: school.school });
      expect(previous.pending).toBeNull(); expect(!previous.annual || previous.annual.pausedForPlanning).toBe(true);
      expect(schoolWithdrawalReason(previous, school)).toBeUndefined(); expect(ageOn(previous.people[previous.activePersonId], previous.date)).toBe(minimum);
      for (const field of ['random', 'accounts', 'ledger', 'liabilities', 'workHistory', 'hourlyContracts', 'schoolCompletions'] as const) expect(current[field]).toEqual(previous[field]);
      expect(current.people[current.activePersonId].education.qualifications).toEqual(previous.people[previous.activePersonId].education.qualifications);
      expect(current.people[current.activePersonId].employment).toEqual(previous.people[previous.activePersonId].employment);
      expect(current.schoolWithdrawals[0]).toMatchObject({ personId: current.activePersonId, communityId: school.id, country, city: school.city, school: school.school, date: previous.date, age: minimum, ruleVersion: 1, minimumLeavingAge: minimum, recordedAttendanceMonths: school.periods.length });
      expect(current.schoolCommunities.find(row => row.id === school.id)).toEqual({ ...school, ended: previous.date, endReason: 'withdrawn' });
      expect(current.pending).toMatchObject({ kind: 'result', title: 'Secondary school withdrawn' });
    }
    if (!firstEligible && !current.pending && (!current.annual || current.annual.pausedForPlanning) && currentSchool(current)?.stage === 'secondary' && !schoolWithdrawalReason(current)) firstEligible = { world: current, nextCommandIndex: commands.length };
    previous = current;
  } });
  expect(withdrawalCommands).toBe(1); expect(report.schoolWithdrawals).toHaveLength(1); expect(report.milestones.schoolExit).toMatchObject({ status: 'reached', age: minimum });
  const guard = report.observations.filter(row => row.stage === 'schoolExitMinimumGuard');
  expect(guard).toHaveLength(1); expect(guard[0].outcome).toBe('rejected-without-state-or-rng-change'); expect(guard[0].age).toBeLessThan(minimum);
  expect(trace.filter(command => command.type === 'school-withdraw')).toHaveLength(2); // One real refusal, one real committed exit.
  expect(report.observations.some(row => row.stage === 'schoolExit' && row.outcome === 'ineligible' && String(row.detail.reason).includes('withdrawal from age ' + minimum))).toBe(true);
  const left = report.schoolWithdrawals[0], closed = world.schoolCommunities.find(row => row.id === left.communityId)!;
  expect(closed.periods).toHaveLength(left.recordedAttendanceMonths); expect(currentSchool(world)).toBeUndefined(); expect(report.schoolCompletions).toEqual([]);
  expect(report.coldChecks.some(row => row.reason === 'schoolExit')).toBe(true); expect(report.scenarioBComplete).toBe(false);
}, 30000);

test('unavailable school exit retains the actual minimum restriction without claiming normal completion or a future withdrawal', async () => {
  const initial = await createCriminalLife('US', 900), { report, trace } = runCriminalPolicy(initial, { maxYears: minimumSchoolLeavingAge.US - 1 });
  expect(report.schoolWithdrawals).toEqual([]); expect(report.schoolCompletions).toEqual([]);
  expect(report.milestones.schoolExit).toMatchObject({ status: 'unreached-at-policy-bound', lastObservedRestriction: { stage: 'schoolExit', outcome: 'ineligible', age: 15, detail: { reason: "This game's school rules allow withdrawal from age 16" } } });
  expect(trace.filter(command => command.type === 'school-withdraw')).toHaveLength(1); // Actual refused probe is not a milestone.
  expect(report.milestones.offence.status).toBe('unreached-at-policy-bound'); expect(report.milestones.death.status).toBe('unreached-at-policy-bound'); expect(report.scenarioBComplete).toBe(false);
}, 30000);
