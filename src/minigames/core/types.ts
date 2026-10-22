import { z } from 'zod';
import { dateSchema } from '../../game/calendar';

export const gameKinds = ['sports', 'crime', 'astronaut'] as const;
export type MiniGameKind = (typeof gameKinds)[number];
export const titles = {
  sports: 'Clutch Shot',
  crime: 'Safe Cracker',
  astronaut: 'Orbital Docking',
} as const;
export const durationMs = {
  sports: 10000,
  crime: 12000,
  astronaut: 14000,
} as const;
export const actionSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('shot'),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    power: z.number().min(0).max(1).optional(),
  }),
  z.strictObject({
    type: z.literal('lock'),
    angle: z.number().min(0).max(360).optional(),
  }),
  z.strictObject({
    type: z.literal('thrust'),
    direction: z.enum(['left', 'right', 'up', 'down', 'coast']),
  }),
]);
export type MiniGameAction = z.infer<typeof actionSchema>;
export const inputSchema = z.strictObject({
  at: z.number().int().min(0).max(14000),
  action: actionSchema,
});
export type MiniGameInput = z.infer<typeof inputSchema>;
export const ratingSchema = z.enum(['perfect', 'good', 'poor', 'failed']);
export type MiniGameRating = z.infer<typeof ratingSchema>;
export const miniGameSessionSchema = z.object({
  id: z.string().min(1).max(240),
  lifeId: z.string(),
  personId: z.string(),
  kind: z.enum(gameKinds),
  contextId: z.string(),
  ownerId: z.string(),
  started: dateSchema,
  startedRevision: z.number().int().nonnegative(),
  difficulty: z.number().int().min(1).max(5),
  seed: z.number().int().min(0).max(0xffffffff),
  assisted: z.boolean(),
  status: z.enum(['active', 'completed', 'forfeited']),
  paused: z.boolean(),
  elapsedMs: z.number().int().min(0).max(14000),
  inputs: z.array(inputSchema).max(120),
  score: z.number().int().min(0).max(100).nullable(),
  rating: ratingSchema.nullable(),
  settled: dateSchema.nullable(),
  appliedMonth: z.number().int().nullable(),
});
export type MiniGameSession = z.infer<typeof miniGameSessionSchema>;
export type Challenge = Pick<
  MiniGameSession,
  'kind' | 'difficulty' | 'seed' | 'assisted'
>;
export type GameEvaluation = {
  finished: boolean;
  score: number;
  detail: string;
};
export const miniGameCommandSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('mini-game-start'),
    kind: z.enum(gameKinds),
    contextId: z.string(),
    ownerId: z.string(),
    assisted: z.boolean(),
  }),
  z.strictObject({
    type: z.literal('mini-game-input'),
    sessionId: z.string(),
    index: z.number().int().min(0).max(119),
    input: inputSchema,
  }),
  z.strictObject({
    type: z.literal('mini-game-pause'),
    sessionId: z.string(),
    elapsedMs: z.number().int().min(0).max(14000),
  }),
  z.strictObject({
    type: z.literal('mini-game-resume'),
    sessionId: z.string(),
  }),
  z.strictObject({
    type: z.literal('mini-game-complete'),
    sessionId: z.string(),
  }),
  z.strictObject({
    type: z.literal('mini-game-forfeit'),
    sessionId: z.string(),
  }),
]);
export type MiniGameCommand = z.infer<typeof miniGameCommandSchema>;
