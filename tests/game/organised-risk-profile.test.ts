import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { organisedMissions } from '../../src/game/content/organisedCrime';
import { activeOrganisation, promotionReason } from '../../src/game/systems/organisedCrime';
import { legalMonth } from '../../src/game/systems/legal';
import { monthFrom } from '../../src/game/calendar';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import fixture from '../fixtures/v3-employed-graduate.json';
const styles = ['street-syndicate', 'fraud-network', 'smuggling-ring'] as const;
const approaches = ['cautious', 'bold', 'crew-led'] as const;
const trialOutcomes = createHash('sha256'), careerOutcomes = createHash('sha256');
const fullProfile = !!process.env.DREAMS_CRIME_PROFILE_OUTPUT;
const joinedCache = new Map<string, World>();
function joined(style: typeof styles[number], seed: number) {
  const key = style + ':' + seed, cached = joinedCache.get(key);
  if (cached) return structuredClone(cached);
  const world = decodeWorld(JSON.stringify(fixture));
  world.random.outcomes = (seed + 1) * 104729 >>> 0;
  world.random.npcs = (seed + 1) * 65537 >>> 0;
  world.people[world.activePersonId].stats.energy = world.people[world.activePersonId].stats.health = 100;
  const next = resolveCommand(world, { type: 'organised-join', style });
  const result = resolveCommand(next, { type: 'acknowledge', resultId: next.pending!.id }); joinedCache.set(key, result); return structuredClone(result);
}
function trial(style: typeof styles[number], mission: typeof organisedMissions[number], approach: typeof approaches[number], rank: number, seed: number) {
  const initial = joined(style, seed), gang = activeOrganisation(initial)!;
  // Independent rank cohorts isolate mission exposure; progression below earns ranks normally.
  gang.organised!.rank = rank; gang.rank = Math.min(rank, 3);
  initial.people[initial.activePersonId].legal.crimeSkill = rank * 15;
  const next = resolveCommand(initial, { type: 'organised-mission', gangId: gang.id, mission: mission.id, approach });
  const incident = next.incidents.at(-1)!, immediate = !!incident.caseId;
  next.date = monthFrom(next.date, 6); legalMonth(next);
  if (fullProfile) trialOutcomes.update(encodeWorld(next)).update('\n');
  return { immediate, eventual: !!incident.caseId, evidence: incident.evidence, riskBps: incident.riskBps, success: activeOrganisation(next)!.organised!.jobs.at(-1)!.success };
}
function progression(style: typeof styles[number], approach: 'cautious' | 'bold', seed: number) {
  let world = joined(style, seed), jobs = 0, rank = 0;
  const outcome = (arrested: boolean) => {
    if (fullProfile) careerOutcomes.update(encodeWorld(world)).update('\n');
    return { jobs, rank, arrested };
  };
  const drain = () => {
    for (let guard = 0; guard < 150 && (world.pending || world.annual); guard++) {
      if (world.cases.some(item => world.incidents.find(source => source.id === item.incidentId)?.organisedMission)) return false;
      const pending = world.pending;
      const command: GameCommand = pending?.kind === 'result' ? { type: 'acknowledge', resultId: pending.id } : pending?.kind === 'decision' ? { type: 'choose', eventId: pending.id, choiceId: pending.choices.find(choice => !choiceUnavailable(world, choice))!.id } : { type: 'resume' };
      world = resolveCommand(world, command);
    }
    return !world.people[world.activePersonId].died;
  };
  for (let year = 0; year < 6; year++) {
    const gang = activeOrganisation(world); if (!gang?.organised || world.people[world.activePersonId].stats.energy < 24) break;
    for (let job = 0; job < 2; job++) {
      world = resolveCommand(world, { type: 'organised-mission', gangId: gang.id, mission: 'missing-envelope', approach }); jobs++; if (!drain()) return outcome(world.cases.some(item => world.incidents.find(source => source.id === item.incidentId)?.organisedMission));
    }
    if (!world.actionCounts[world.activePersonId + ':organised:' + world.date.year + ':decision'] && !promotionReason(world, activeOrganisation(world)!)) { world = resolveCommand(world, { type: 'organised-promotion', gangId: gang.id }); if (!drain()) break; }
    rank = Math.max(rank, activeOrganisation(world)?.organised?.rank ?? 0);
    world = resolveCommand(world, { type: 'advance' }); if (!drain()) return outcome(world.cases.some(item => world.incidents.find(source => source.id === item.incidentId)?.organisedMission));
  }
  return outcome(false);
}
test('seeded mission exposure and earned-rank progression stay riskier for bold approaches', () => {
  const full = !!process.env.DREAMS_CRIME_PROFILE_OUTPUT, samples = full ? 256 : 32;
  const rows: { style: typeof styles[number]; mission: string; rank: number; approach: typeof approaches[number]; samples: number; immediate: number; eventual: number; success: number; evidence: number; riskBps: number }[] = [];
  for (const style of styles) for (const mission of organisedMissions.filter(item => (item.styles as readonly string[]).includes(style))) for (const rank of [...new Set([mission.rank, 3])]) for (const approach of approaches) {
    const totals = { immediate: 0, eventual: 0, success: 0, evidence: 0, riskBps: 0 };
    for (let seed = 0; seed < samples; seed++) { const sample = trial(style, mission, approach, rank, seed); for (const key of Object.keys(totals) as (keyof typeof totals)[]) totals[key] += Number(sample[key]); }
    rows.push({ style, mission: mission.id, rank, approach, samples, ...totals });
  }
  if (process.env.DREAMS_CRIME_PROFILE_OUTPUT) writeFileSync(process.env.DREAMS_CRIME_PROFILE_OUTPUT, JSON.stringify({ rows, careers: [], partial: true }, null, 2));
  const careers = styles.flatMap(style => (['cautious', 'bold'] as const).map(approach => {
    const outcomes = Array.from({ length: full ? 128 : 16 }, (_, seed) => progression(style, approach, seed));
    return { style, approach, samples: outcomes.length, reachedRank1: outcomes.filter(row => row.rank >= 1).length, reachedRank2: outcomes.filter(row => row.rank >= 2).length, reachedFourJobs: outcomes.filter(row => row.jobs >= 4).length, arrests: outcomes.filter(row => row.arrested).length, jobs: outcomes.reduce((sum, row) => sum + row.jobs, 0), outcomes };
  }));
  if (process.env.DREAMS_CRIME_PROFILE_OUTPUT) writeFileSync(process.env.DREAMS_CRIME_PROFILE_OUTPUT, JSON.stringify({ rows, careers, trialOutcomesSha256: trialOutcomes.digest('hex'), careerOutcomesSha256: careerOutcomes.digest('hex') }, null, 2));
  for (const style of styles) {
    const average = (approach: typeof approaches[number]) => rows.filter(row => row.style === style && row.approach === approach).reduce((sum, row) => sum + row.immediate, 0);
    expect(average('cautious')).toBeLessThan(average('bold')); expect(average('cautious')).toBeGreaterThan(0);
  }
}, 300000);
