/** Prospective assignment policy. Stored incidents retain literal risk and evidence. */
export function organisedAssignmentRisk(mission: { rank: number; risk: number }, style: string, approach: 'cautious' | 'bold' | 'crew-led', skill: number, pressure: number, complication: boolean) {
  const exposure = 900 + mission.rank * 700 + Math.round((mission.risk + 1200) / 4) + (style === 'smuggling-ring' ? 300 : style === 'fraud-network' ? 100 : 0);
  return {
    riskBps: Math.max(300, Math.min(9000, exposure + (approach === 'cautious' ? -350 : approach === 'bold' ? 2400 : 600) - skill * 12)),
    evidenceDelta: (approach === 'cautious' ? -30 : approach === 'bold' ? 12 : -12) + (complication ? pressure : 0),
  };
}
