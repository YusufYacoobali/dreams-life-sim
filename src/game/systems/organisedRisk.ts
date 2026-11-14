/** Prospective v4 assignment policy. Stored incidents retain literal risk and evidence. */
export function organisedAssignmentRisk(mission: { rank: number; risk: number }, style: string, approach: 'cautious' | 'bold' | 'crew-led', skill: number, pressure: number, complication: boolean, rank = mission.rank) {
  const experience = Math.max(0, Math.min(100, skill));
  const stakes = mission.rank * 700 + Math.round((mission.risk + 1200) * .35) + pressure * 10;
  const visibility = rank * 140 + (style === 'smuggling-ring' ? 180 : style === 'fraud-network' ? 80 : 0);
  const exposure = stakes + visibility + (approach === 'cautious' ? 350 : approach === 'bold' ? 3200 : 1100);
  // Caution limits the traces left behind as well as the initial chance of detection.
  // Experience helps with familiar work; a senior position and harder work add exposure.
  const evidenceScaleBps = Math.round((approach === 'cautious' ? 1200 : approach === 'bold' ? 9000 : 4500) * (1 - experience / 200));
  const evidenceDelta = mission.rank * 3 + Math.round((mission.risk + 1200) / 200) + rank + (complication ? Math.round(pressure * (approach === 'cautious' ? .5 : 1)) : 0);
  return {
    riskBps: Math.max(250, Math.min(9000, Math.round(exposure * (1 - experience / 200)))),
    evidenceScaleBps,
    evidenceDelta,
    // A report is a lead, with stronger corroboration on larger assignments.
    reportEvidenceFloor: Math.min(95, (approach === 'cautious' ? 32 : approach === 'bold' ? 70 : 55) + mission.rank * 8 + Math.round((mission.risk + 1200) / 150)),
  };
}
