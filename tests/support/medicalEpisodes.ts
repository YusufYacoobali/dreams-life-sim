import { resolveCommand } from '../../src/game/engine';
import { decodeWorld, type World } from '../../src/game/model';
import { addCondition } from '../../src/game/systems/health';
import { post } from '../../src/game/systems/common';
import graduate from '../fixtures/v3-employed-graduate.json';
import type { ConditionId } from '../../src/game/content/health';

/** Declared controlled medical scenarios, not natural-play or native evidence.
 * The patient is a real old graduate fixture; the added concern, care budget
 * and explicit diagnosis roll are test setup. All visits, bills, programme
 * outcomes and admission transitions run through production commands. */
export function medicalPatient(severity = 42, type: ConditionId = 'asthma') {
  const world = decodeWorld(JSON.stringify(graduate));
  post(world, 2_000_000n, 0n, 'fixture-medical-budget', 'Declared test care budget');
  const condition = addCondition(world, world.people[world.activePersonId], type, severity);
  return { world, conditionId: condition.id };
}
export function chooseMedical(world: World, choiceId: string) {
  if (world.pending?.kind !== 'decision') throw new Error('Expected medical decision');
  return resolveCommand(world, { type: 'choose', eventId: world.pending.id, choiceId }, true);
}
export function medicalEpisodeScenarios() {
  const initial = medicalPatient(), symptoms = resolveCommand(initial.world, { type: 'advance' });
  if (symptoms.pending?.kind !== 'decision' || symptoms.pending.templateId !== 'medical-symptoms') throw new Error('Expected actual symptom notice');
  // Mulberry32 seed zero gives a successful real 80% symptom-assessment roll.
  symptoms.random.outcomes = 0;
  const diagnosis = chooseMedical(symptoms, 'doctor');
  if (diagnosis.pending?.kind !== 'decision' || diagnosis.pending.templateId !== 'medical-diagnosis') throw new Error('Expected actual diagnosis');
  const treated = chooseMedical(diagnosis, 'treat');
  const severe = medicalPatient(95), admitted = resolveCommand(severe.world, { type: 'advance' }, true);
  if (admitted.pending?.kind !== 'result' || admitted.pending.title !== 'Rushed to Hospital') throw new Error('Expected actual urgent admission');
  return { initial: initial.world, conditionId: initial.conditionId, symptoms, diagnosis, treated, admitted, urgentConditionId: severe.conditionId };
}
