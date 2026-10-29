import { z } from 'zod';
import { dateSchema } from '../calendar';
import { countryCodes } from '../countries';
import { fields } from './schemas';
import { studyPrograms } from './scholarshipSchemas';

export const studyCourseSchema = z.object({
  id: z.string().max(200), personId: z.string(),
  origin: z.enum(['enrolment', 'legacy-current', 'legacy-incomplete']),
  status: z.enum(['active', 'withdrawn', 'completed', 'failed', 'died', 'observed-incomplete']),
  program: z.enum(studyPrograms).nullable(), field: z.enum(fields), school: z.string().min(1).max(120),
  country: z.enum(countryCodes).nullable(), city: z.string().min(1).max(80).nullable(), currency: z.enum(['USD', 'CAD', 'GBP', 'AUD', 'EUR', 'BRL', 'INR', 'JPY', 'ZAR']).nullable(),
  recorded: dateSchema, started: dateSchema.nullable(), ended: dateSchema.nullable(),
  months: z.number().int().nonnegative(), requiredMonths: z.number().int().positive(),
  grades: z.number().int().min(0).max(100), funding: z.enum(['public', 'cash', 'loan']), annualTuition: z.bigint().nonnegative(), tuitionPaidMonths: z.number().int().nonnegative(),
  admissionId: z.string().nullable(),
  firstPayment: z.object({
    funding: z.enum(['cash', 'loan']), scholarshipId: z.string().nullable(), billed: z.bigint().nonnegative(), waived: z.bigint().nonnegative(), transactionId: z.string().nullable(), loanTransactionId: z.string().nullable(),
  }).nullable(),
});
export type StudyCourse = z.infer<typeof studyCourseSchema>;
