import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import { careerKinds, skillIds } from '../content/careers';
import type { World } from '../model';
const percent = z.number().int().min(0).max(100), currency = z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']);
export const skillsSchema = z.object({ acting: percent, music: percent, sport: percent, politics: percent, modeling: percent, content: percent, science: percent, service: percent });
export const newSkills = (): z.infer<typeof skillsSchema> => ({ acting: 0, music: 0, sport: 0, politics: 0, modeling: 0, content: 0, science: 0, service: 0 });
export const trainingSchema = z.object({ skill: z.enum(skillIds), mode: z.enum(['self', 'coached']), started: dateSchema, lastMonth: z.number().int(), months: z.number().int().nonnegative(), fees: z.bigint().nonnegative(), currency });
export const careerSchema = z.object({
    id: z.string(), personId: z.string(), kind: z.enum(careerKinds), country: z.enum(countryCodes), currency, started: dateSchema, ended: dateSchema.nullable(), status: z.enum(['active', 'between', 'left', 'retired', 'deceased']),
    rank: z.number().int().min(0).max(3), reputation: percent, focus: z.enum(['craft', 'balanced', 'publicity']), employmentId: z.string().nullable(), employer: z.string(), contractMonthsRemaining: z.number().int().nonnegative(), lastMonth: z.number().int(), contacts: z.array(z.string()),
    projects: z.array(z.object({ id: z.string(), name: z.string(), currency, started: dateSchema, ended: dateSchema.nullable(), status: z.enum(['active', 'completed', 'cancelled']), targetMonths: z.number().int().positive(), months: z.number().int().nonnegative(), employmentId: z.string(), grossAtStart: z.bigint().nonnegative(), grossEarned: z.bigint().nonnegative(), responseRoll: z.number().int().min(1).max(100), quality: percent, award: z.string().nullable(), periods: z.array(z.object({ month: z.number().int(), score: percent, attended: z.boolean(), success: z.boolean() })) })),
});
/** Keep actual contract/project references coherent when ordinary/legal actions end work. */
export function careerContractEnded(world: World, employmentId: string) {
    for (const career of world.careers.filter(item => item.employmentId === employmentId)) {
        const history = world.workHistory.find(item => item.id === employmentId)!;
        for (const project of career.projects.filter(item => item.status === 'active')) {
            project.grossEarned = history.grossEarned - project.grossAtStart;
            project.status = 'cancelled';
            project.ended = { ...world.date };
        }
        career.employmentId = null;
        career.contractMonthsRemaining = 0;
        if (career.status === 'active')
            career.status = 'between';
    }
}
