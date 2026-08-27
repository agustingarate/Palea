import { z } from 'zod';
import * as isoCurrencies from 'dinero.js/currencies';

export const applicationStatusSchema = z.enum([
  'draft',
  'applied',
  'interview',
  'offer',
  'rejected',
]);
export const workModeSchema = z.enum([
  'remote',
  'hybrid',
  'onsite',
  'unspecified',
]);
export const commitmentSchema = z.enum([
  'full_time',
  'part_time',
  'unspecified',
]);
export const contractTypeSchema = z.enum([
  'employment',
  'freelance',
  'services',
  'internship',
  'other',
  'unspecified',
]);
export const durationTypeSchema = z.enum([
  'indefinite',
  'temporary',
  'unspecified',
]);
export const compensationKindSchema = z.enum(['expected', 'offered']);
export const compensationPeriodSchema = z.enum([
  'hour',
  'day',
  'week',
  'month',
  'year',
]);
export const descriptionSourceSchema = z.enum(['manual', 'url', 'image']);
export const captureStatusSchema = z.enum([
  'not_requested',
  'pending',
  'completed',
  'failed',
]);
export const skillAnalysisStatusSchema = captureStatusSchema;
export const currencyCodes = Object.keys(isoCurrencies).sort();
export const currencyCatalog = currencyCodes.map((code) => {
  const currency = isoCurrencies[code as keyof typeof isoCurrencies];
  return { code: currency.code, exponent: currency.exponent };
});
const currencyCodeSet = new Set(currencyCodes);
export const currencyCodeSchema = z
  .string()
  .length(3)
  .refine((value) => currencyCodeSet.has(value), 'currency.invalid');
export const applicationTimeZoneSchema = z
  .string()
  .trim()
  .min(1, 'timezone.invalid')
  .max(100, 'timezone.invalid')
  .refine((value) => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
      return true;
    } catch {
      return false;
    }
  }, 'timezone.invalid');
const POSTGRES_BIGINT_MAX = 9223372036854775807n;
const minorAmountSchema = z
  .string()
  .regex(/^[1-9]\d*$/, 'validation.salary.positive')
  .refine((value) => BigInt(value) <= POSTGRES_BIGINT_MAX, 'validation.salary.range');
export const compensationRangeSchema = z
  .object({
    minimumMinor: minorAmountSchema.nullable().default(null),
    maximumMinor: minorAmountSchema.nullable().default(null),
    currency: currencyCodeSchema,
    period: compensationPeriodSchema,
  })
  .superRefine((value, context) => {
    if (!value.minimumMinor && !value.maximumMinor) {
      context.addIssue({ code: 'custom', message: 'validation.salary.boundRequired' });
    }
    if (
      value.minimumMinor &&
      value.maximumMinor &&
      BigInt(value.minimumMinor) > BigInt(value.maximumMinor)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['maximumMinor'],
        message: 'validation.salary.maximumBeforeMinimum',
      });
    }
  });
export const manualJobDescriptionSchema = z.object({
  source: z.literal('manual'),
  html: z.string().max(100_000),
});
export const applicationIdSchema = z.object({ applicationId: z.uuid() });
export const applicationListInputSchema = z.object({
  status: applicationStatusSchema,
  search: z.string().trim().max(120).optional(),
  cursor: z.uuid().optional(),
  limit: z.number().int().min(1).max(50).default(25),
});
export const applicationSchema = z.object({
  id: z.uuid(),
  companyName: z.string().min(1),
  role: z.string().min(1),
  appliedOn: z.iso.date().nullable(),
  status: applicationStatusSchema,
  workMode: workModeSchema,
  position: z.number().int().nonnegative(),
});
export const applicationPageSchema = z.object({
  items: z.array(applicationSchema),
  nextCursor: z.uuid().nullable(),
  total: z.number().int().nonnegative(),
});
export const updateApplicationStatusInputSchema = applicationIdSchema.extend({
  status: applicationStatusSchema,
  targetIndex: z.number().int().nonnegative().optional(),
  appliedOn: z.iso.date().optional(),
  timeZone: applicationTimeZoneSchema,
});
export const createApplicationInputSchema = z.object({
  companyName: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(120),
  appliedOn: z.iso.date().nullable().default(null),
  workMode: workModeSchema.default('unspecified'),
  commitment: commitmentSchema.default('unspecified'),
  contractType: contractTypeSchema.default('unspecified'),
  durationType: durationTypeSchema.default('unspecified'),
  resumeId: z.uuid().nullable().default(null),
  jobDescription: manualJobDescriptionSchema.nullable().default(null),
  privateNotes: z.string().max(10_000).default(''),
  expectedCompensation: compensationRangeSchema.nullable().default(null),
  offeredCompensation: compensationRangeSchema.nullable().default(null),
  timeZone: applicationTimeZoneSchema,
});
export type Application = z.infer<typeof applicationSchema>;
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type ApplicationPage = z.infer<typeof applicationPageSchema>;
export type ApplicationListInput = z.infer<typeof applicationListInputSchema>;
export type CreateApplicationInput = z.infer<
  typeof createApplicationInputSchema
>;
export type CompensationRange = z.infer<typeof compensationRangeSchema>;
export type CompensationPeriod = z.infer<typeof compensationPeriodSchema>;
export type Commitment = z.infer<typeof commitmentSchema>;
export type ContractType = z.infer<typeof contractTypeSchema>;
export type DurationType = z.infer<typeof durationTypeSchema>;
export type DescriptionSource = z.infer<typeof descriptionSourceSchema>;
export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusInputSchema
>;
