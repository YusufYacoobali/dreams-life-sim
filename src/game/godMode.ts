import { z } from 'zod';
import { copyWorld, immutableWorld, statsSchema, type World } from './model';
import { IneligibleAction } from './errors';
import { parseMoney } from './money';
import { skillsSchema } from './systems/careerSchemas';
import { active, post } from './systems/common';
import { audienceFame } from './systems/social';

export const godModeStats = statsSchema.keyof().options;
export const godModeSkills = skillsSchema.keyof().options;
export const godModeAttributes = ['fertility', 'grades', 'publicImage'] as const;
const percent = z.number().int().min(0).max(100);
export const godModeCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('money'), accountId: z.string(), operation: z.enum(['set', 'add', 'subtract']), amount: z.string().min(1).max(40) }).strict(),
  z.object({ type: z.literal('stat'), stat: statsSchema.keyof(), value: percent }).strict(),
  z.object({ type: z.literal('skill'), skill: skillsSchema.keyof(), value: percent }).strict(),
  z.object({ type: z.literal('attribute'), attribute: z.enum(godModeAttributes), value: percent }).strict(),
  z.object({ type: z.literal('relationship'), relationshipId: z.string(), field: z.enum(['strength', 'trust']), value: percent }).strict(),
]);
export type GodModeCommand = z.infer<typeof godModeCommandSchema>;
export type GodModeEdit = { lifeId: string; personId: string; expectedRevision: number; commands: GodModeCommand[] };
const editSchema = z.object({ lifeId: z.string(), personId: z.string(), expectedRevision: z.number().int().nonnegative(), commands: z.array(godModeCommandSchema).min(1).max(1000) }).strict();
export const godModeMoneyCategory = 'god-mode-adjustment';

/** Pure working-copy transformation; the caller owns authorization and persistence. */
export function applyGodModeEdits(before: World, input: GodModeEdit): World {
  const parsed = editSchema.safeParse(input);
  if (!parsed.success) throw new IneligibleAction('Choose valid fields and whole-number percentages from 0 to 100.');
  const edit = parsed.data;
  if (before.id !== edit.lifeId || before.activePersonId !== edit.personId || before.revision !== edit.expectedRevision) throw new IneligibleAction('This life changed while the editor was open. Reload the values before saving.');
  if (active(before).died || !before.birthAcknowledged) throw new IneligibleAction('Open a living character before using God Mode.');
  if (before.miniGames.some(row => row.personId === before.activePersonId && row.status === 'active')) throw new IneligibleAction('Resume or forfeit your saved mini-game before editing this life.');
  const world = copyWorld(before), person = active(world);
  world.revision++;
  for (const command of edit.commands) {
    if (command.type === 'money') {
      const account = world.accounts.find(item => item.id === command.accountId && item.ownerId === person.id);
      if (!account) throw new IneligibleAction('Choose an existing account belonging to this character.');
      let amount: bigint;
      try { amount = parseMoney(command.amount, account.currency).minor; }
      catch (error) { throw new IneligibleAction(error instanceof Error ? error.message : 'Enter a valid amount.'); }
      const delta = command.operation === 'set' ? amount - account.cash : command.operation === 'add' ? amount : -amount;
      if (account.cash + delta < account.lockedCash) throw new IneligibleAction('The balance cannot be negative or fall below inheritance held in trust.');
      if (delta) post(world, delta, 0n, godModeMoneyCategory, 'God Mode adjustment', null, person, account.currency);
    } else if (command.type === 'stat') {
      person.stats[command.stat] = command.value;
      // Fame is recalculated from audience and earned fame during normal play.
      // Preserve a useful base without rewriting actual follower history.
      if (command.stat === 'fame') {
        person.publicLife.earnedFame = Math.max(0, command.value - audienceFame(world, person));
        person.publicLife.peakFame = Math.max(person.publicLife.peakFame, command.value);
      }
    } else if (command.type === 'skill') person.skills[command.skill] = command.value;
    else if (command.type === 'attribute') {
      if (command.attribute === 'fertility') person.biology.fertility = command.value;
      else if (command.attribute === 'publicImage') person.publicLife.image = command.value;
      else {
        person.education.grades = command.value;
        // The current-course mirror must agree; historical results stay intact.
        const course = world.studyCourses.find(item => item.personId === person.id && item.status === 'active');
        if (course) course.grades = command.value;
      }
    } else {
      const relationship = world.relationships.find(item => item.id === command.relationshipId && (item.from === person.id || item.to === person.id));
      if (!relationship) throw new IneligibleAction('Choose an existing relationship with this character.');
      relationship[command.field] = command.value;
    }
  }
  // No command resolution, time advancement, random draws or pending-event work.
  return immutableWorld(world);
}
