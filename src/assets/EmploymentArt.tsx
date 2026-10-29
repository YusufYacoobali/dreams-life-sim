import React from 'react';
import { jobs } from '../game/content/jobs';
import { JobArt } from './JobArt';
import { CareerArt, type CareerArtId } from './CareerArt';
import { Illustration } from './Illustration';

const specialArt: Record<string, CareerArtId> = {
  'screen-actor': 'actor', 'fashion-model': 'model', 'professional-athlete': 'athlete',
  'performing-musician': 'musician', 'space-program': 'astronaut', 'military-service': 'military',
  'elected-councillor': 'politician',
};
const ordinaryIds = new Set(jobs.filter(role => !role.specialCareer).map(role => role.id));

/** Stable role IDs select the same art on listings, details and saved employment. */
export function EmploymentArt({ roleId, size = 48 }: { roleId?: string; size?: number }) {
  if (roleId && ordinaryIds.has(roleId)) return <JobArt id={roleId} size={size} />;
  const special = roleId && Object.hasOwn(specialArt, roleId) ? specialArt[roleId] : undefined;
  return special ? <CareerArt id={special} size={size} /> : <Illustration id="career" size={size} />;
}
