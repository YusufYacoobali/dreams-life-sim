import { activeCult } from './cultSchemas';
import type { Person, World } from '../model';
import { ageOn } from '../personHelpers';
import { rules } from '../rules';
import { jobs } from '../content/jobs';
import { active } from './common';
import { hourlyEnrollmentReason } from './hourlyWork';
import { activeTrip } from './travelSchemas';
import { publicRoyalDuty } from './royaltySchemas';
import { fullTimeCreator } from './creatorSchemas';
import { isConfined } from './legalSchemas';
import { recordingCommitment } from './musicSchemas';
import { campaignCommitment } from './politicsSchemas';
import { currentRecovery } from './educationRecoverySchemas';
import { activeUniversityApplication } from './universityAdmissionSchemas';

export function tuitionFor(person: Person, program: 'university' | 'trade' | 'graduate'): bigint {
  const rule = rules[person.country]; return program === 'trade' ? rule.tradeTuition : rule.universityTuition * (program === 'graduate' ? 2n : 1n);
}
/** Current course requirements, without consuming or testing an application attempt. */
export function coursePrerequisiteReason(world: World, program: 'university' | 'trade' | 'graduate', field: string): string | undefined {
  if (activeCult(world)) return 'Disband your cult before taking another full-time commitment';
  if (activeTrip(world)) return 'Return from your trip before enrolling';
  const person = active(world); const education = person.education;
  if (isConfined(world)) return 'Courses outside custody are unavailable';
  if (ageOn(person, world.date) < rules[person.country].schoolEnd) return 'Finish secondary education first';
  if (education.stage !== 'none') return 'You are already enrolled';
  if (currentRecovery(world)) return 'Finish or leave your evening course before full-time study';
  if(publicRoyalDuty(world))return 'Choose a private royal life before full-time study';
  if(fullTimeCreator(world))return 'Switch your studio to part-time before full-time study';
  if(campaignCommitment(world))return 'Finish or withdraw from your campaign before full-time study';
  if (recordingCommitment(world)) return 'Finish or cancel your recording before full-time study';
  if (person.employment && !jobs.find(job => job.id === person.employment!.roleId)?.partTime) return 'Resign from full-time work before starting this course';
  const workload = hourlyEnrollmentReason(world, person); if (workload) return workload;
  if (!education.qualifications.some(q => q.level === 'secondary')) return 'A secondary qualification is required';
  if (program !== 'trade' && education.grades < 55) return 'Grades of at least 55% are required';
  if (program === 'graduate' && !education.qualifications.some(q => q.level === 'degree')) return 'A university degree is required';
  if (program === 'graduate' && field !== 'medicine' && field !== 'law') return 'Choose medicine or law for professional study';
  if (education.qualifications.some(q => q.level === (program === 'university' ? 'degree' : program === 'graduate' ? field : 'trade') && q.field === field)) return 'You already hold this qualification';
}
export function enrollmentReason(world: World, program: 'university' | 'trade' | 'graduate', field: string): string | undefined {
  const reason = coursePrerequisiteReason(world, program, field); if (reason) return reason;
  const person = active(world);
  if (world.actionCounts[person.id + ':education:' + world.date.year + ':' + program + ':' + field]) return 'You already applied for this course this year';
  if (program === 'university' && activeUniversityApplication(world)) return 'Use or withdraw your existing university application first';
}
