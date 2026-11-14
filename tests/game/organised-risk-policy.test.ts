import { organisedAssignmentRisk } from '../../src/game/systems/organisedRisk';
import { organisedMissions, organisedMissionProfiles } from '../../src/game/content/organisedCrime';

const introductory = organisedMissions.find(mission => mission.id === 'missing-envelope')!;
const advanced = organisedMissions.find(mission => mission.id === 'organisation-crisis')!;
test('v4 reduces both initial detection and quiet evidence, while harder work, seniority and complications add exposure', () => {
  const policy = (mission = introductory as typeof organisedMissions[number], skill = 0, rank = mission.rank, complication = false) => organisedAssignmentRisk(mission, 'street-syndicate', 'cautious', skill, organisedMissionProfiles[mission.id].pressure, complication, rank);
  const rookie = policy(), experienced = policy(introductory, 60), senior = policy(introductory, 0, 3), hard = policy(advanced);
  expect(rookie.riskBps).toBeLessThan(hard.riskBps);
  expect(rookie.evidenceDelta).toBeLessThan(hard.evidenceDelta);
  expect(experienced.riskBps).toBeLessThan(rookie.riskBps);
  expect(experienced.evidenceScaleBps).toBeLessThan(rookie.evidenceScaleBps);
  expect(senior.riskBps).toBeGreaterThan(rookie.riskBps);
  expect(senior.evidenceDelta).toBeGreaterThan(rookie.evidenceDelta);
  expect(policy(introductory, 0, 0, true).evidenceDelta).toBeGreaterThan(rookie.evidenceDelta);
  expect(hard.reportEvidenceFloor).toBeGreaterThan(rookie.reportEvidenceFloor);
});
test('every mission and experience cohort retains exposure and a clear cautious/crew/bold risk tradeoff', () => {
  for (const mission of organisedMissions) for (const skill of [0, 30, 100]) {
    const [cautious, crew, bold] = (['cautious', 'crew-led', 'bold'] as const).map(approach => organisedAssignmentRisk(mission, 'smuggling-ring', approach, skill, organisedMissionProfiles[mission.id].pressure, false));
    expect(cautious.riskBps).toBeGreaterThan(0);
    expect(cautious.evidenceScaleBps).toBeGreaterThan(0);
    expect(cautious.riskBps).toBeLessThan(crew.riskBps);
    expect(crew.riskBps).toBeLessThan(bold.riskBps);
    expect(cautious.evidenceScaleBps).toBeLessThan(crew.evidenceScaleBps);
    expect(crew.evidenceScaleBps).toBeLessThan(bold.evidenceScaleBps);
    expect(cautious.reportEvidenceFloor).toBeGreaterThan(cautious.evidenceDelta + Math.round(95 * cautious.evidenceScaleBps / 10000));
    expect(cautious.reportEvidenceFloor).toBeLessThan(bold.reportEvidenceFloor);
  }
});
