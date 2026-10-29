import { decodeSave } from '../../src/persistence/archive';
import { decodeWorld, encodeWorld, type World } from '../../src/game/model';
import { resolveCommand, type GameCommand } from '../../src/game/engine';
import { choiceUnavailable } from '../../src/game/choiceAvailability';
import { lifeProgress } from '../../src/progression/progress';
import { achievementContinuation, challengeMilestones } from '../../src/progression/connections';
import { investmentQuote } from '../../src/game/systems/markets';
import reading from '../fixtures/v28-ordinary-hobby-archive.json';
import graduate from '../fixtures/v3-employed-graduate.json';

function finish(input: World) {
  let world = input, guard = 0;
  while ((world.pending || world.annual) && !world.people[world.activePersonId].died && guard++ < 100) {
    const command: GameCommand = world.pending?.kind === 'decision'
      ? { type: 'choose', eventId: world.pending.id, choiceId: world.pending.choices.find(choice => !choiceUnavailable(world, choice))!.id }
      : world.pending ? { type: 'acknowledge', resultId: world.pending.id } : { type: 'resume' };
    world = resolveCommand(world, command, true);
  }
  expect(guard).toBeLessThan(100); return world;
}

test('a genuinely earned care milestone points to its unfinished challenge, then stops when normal months finish it', () => {
  const original = decodeSave(JSON.stringify(reading)).world, before = encodeWorld(original), progress = lifeProgress(original)!;
  const care = progress.achievements.find(item => item.id === 'pet-year')!, rhythm = progress.achievements.find(item => item.id === 'hobby-fifty')!;
  expect(achievementContinuation(care, progress.challenges)).toMatchObject({ id: 'care-and-craft', percent: 98, complete: false });
  expect(achievementContinuation(rhythm, progress.challenges)).toBeNull();
  expect(challengeMilestones(progress.challenges.find(item => item.id === 'care-and-craft')!, progress.achievements).map(item => item.id)).toEqual(['pet-year']);
  const later = lifeProgress(finish(resolveCommand(finish(original), { type: 'advance' }, true)))!;
  expect(later.facts.hobbyProficiency).toBe(72);
  expect(achievementContinuation(later.achievements.find(item => item.id === 'pet-year')!, later.challenges)).toBeNull();
  expect(achievementContinuation(later.achievements.find(item => item.id === 'hobby-fifty')!, later.challenges)?.id).toBe('work-and-life');
  expect(challengeMilestones(later.challenges.find(item => item.id === 'care-and-craft')!, later.achievements).map(item => item.id)).toEqual(['hobby-fifty', 'pet-year']);
  expect(encodeWorld(original)).toBe(before);
});

test('first work leads to the nearest existing work challenge, without substituting broader or already completed goals', () => {
  const world = decodeWorld(JSON.stringify(graduate)), progress = lifeProgress(world)!;
  const firstJob = progress.achievements.find(item => item.id === 'first-job')!;
  expect(achievementContinuation(firstJob, progress.challenges)?.id).toBe('working-confidence');
  expect(challengeMilestones(progress.challenges.find(item => item.id === 'working-confidence')!, progress.achievements).map(item => item.id)).toEqual(['first-job']);
  expect(achievementContinuation(progress.achievements.find(item => item.id === 'secondary-graduate')!, progress.challenges)).toBeNull();
  expect(achievementContinuation(firstJob, [])).toBeNull();
});

test('a real paid investment contributes recognition before dividends, preserving the exact same connection after cold decoding', () => {
  const original = decodeWorld(JSON.stringify(graduate));
  const world = finish(resolveCommand(original, { type: 'buy-investment', instrumentId: 'GROVE', quantity: 2n, quotedMinor: investmentQuote(original, 'GROVE', 2n).value }, true));
  const before = encodeWorld(world), progress = lifeProgress(world)!;
  const purchase = progress.achievements.find(item => item.id === 'first-investment')!;
  const challenge = achievementContinuation(purchase, progress.challenges)!;
  expect(challenge).toMatchObject({ id: 'patient-investor', complete: false, percent: 50 });
  expect(challengeMilestones(challenge, progress.achievements).map(item => item.id)).toEqual(['first-investment']);
  expect(progress.facts).toMatchObject({ investmentPurchases: 1, dividendMonths: 0 });
  const loaded = lifeProgress(decodeWorld(before))!;
  expect(achievementContinuation(loaded.achievements.find(item => item.id === 'first-investment')!, loaded.challenges)).toEqual(challenge);
  expect(encodeWorld(world)).toBe(before);
  expect(achievementContinuation(lifeProgress(original)!.achievements.find(item => item.id === 'first-investment')!, lifeProgress(original)!.challenges)).toBeNull();
});

test('another person cannot borrow the child’s earned milestones or continuation', () => {
  const world = decodeSave(JSON.stringify(reading)).world;
  const outsider = Object.keys(world.people).find(id => id !== world.activePersonId)!, progress = lifeProgress(world, outsider)!;
  const care = progress.achievements.find(item => item.id === 'pet-year')!;
  expect(care.complete).toBe(false);
  expect(achievementContinuation(care, progress.challenges)).toBeNull();
  expect(challengeMilestones(progress.challenges.find(item => item.id === 'care-and-craft')!, progress.achievements)).toEqual([]);
});
