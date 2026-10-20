import { encodeWorld } from '../../src/game/model';
import { rules } from '../../src/game/rules';
import { createCriminalLife, criminalMilestones, runCriminalPolicy } from '../support/criminalPolicy';

test('actual saved birth and ordinary childhood preserve the input, enforce compulsory school and never create an underage offence', async () => {
  const initial = await createCriminalLife('US', 900), payload = encodeWorld(initial);
  expect(initial.revision).toBe(1); expect(initial.birthAcknowledged).toBe(true); expect(Object.isFrozen(initial)).toBe(true);
  const { world, trace, report } = runCriminalPolicy(initial, { maxYears: 8 });
  expect(encodeWorld(initial)).toBe(payload); expect(world.activePersonId).toBe(initial.activePersonId); expect(report.ageAtEnd).toBe(8); expect(report.naturallyDied).toBe(false);
  expect(report.milestones.schoolAttendance.status).toBe('reached'); expect(report.milestones.compulsoryLeaveGuard.status).toBe('reached'); expect(report.incidents).toHaveLength(0);
  expect(trace.some(command => command.type === 'crime')).toBe(false); expect(report.milestones.conviction.status).toBe('unreached-at-policy-bound'); expect(report.milestones.death.status).toBe('unreached-at-policy-bound');
  expect(report.scenarioBComplete).toBe(false); expect(report.explicitGaps.some(reason => reason.includes('dropout'))).toBe(true); expect(Object.keys(report.milestones)).toEqual([...criminalMilestones]); expect(report.commandsAttempted).toBe(trace.length); expect(report.commandsCommitted).toBe(world.revision - initial.revision);
  expect(report.coldChecks.length).toBeGreaterThan(0); expect(report.coldChecks.every(row => row.format === 'dreams-checkpoint-v4' && row.canonicalBytes > row.checkpointBytes && row.checkpointBytes > 0)).toBe(true);
  expect(() => runCriminalPolicy(world)).toThrow();
}, 30000);

test('ordinary adult policy records genuine school exit, bounded real offences, victims and judicial outcomes without choosing hidden rolls', async () => {
  const initial = await createCriminalLife('US', 900), { world, trace, report } = runCriminalPolicy(initial, { maxYears: 22 });
  const crimes = trace.filter(command => command.type === 'crime');
  expect(report.milestones.schoolExit.status).toBe('reached'); expect(report.schoolCompletions[0].date.year - initial.people[initial.activePersonId].born.year).toBeGreaterThanOrEqual(rules.US.schoolEnd);
  expect(crimes.length).toBeGreaterThan(0); expect(crimes.length).toBeLessThanOrEqual(3); expect(crimes.map(command => command.offence)).toEqual(['shoplift', 'pickpocket', 'burglary'].slice(0, crimes.length));
  expect(report.incidents.length).toBe(crimes.length); expect(report.incidents.every(row => row.date.year - initial.people[initial.activePersonId].born.year >= 18)).toBe(true);
  for (const crime of crimes) if (crime.offence === 'pickpocket') { expect(crime.victimId).toBeDefined(); expect(world.people[crime.victimId!]).toBeDefined(); }
  expect(report.cases.every(row => row.plea === null || row.plea === 'not-guilty')).toBe(true); expect(report.cases.every(row => row.juvenile === false)).toBe(true);
  expect(report.commandsAttempted).toBe(trace.length); expect(report.commandsCommitted).toBe(world.revision - initial.revision); expect(report.scenarioBComplete).toBe(false); expect(report.coldChecks.some(row => row.reason === 'actual offence')).toBe(true);
}, 30000);
