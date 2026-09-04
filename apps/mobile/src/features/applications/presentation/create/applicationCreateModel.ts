import {
  createApplicationInputSchema,
  currencyCatalog,
  type CompensationRange,
  type CreateApplicationInput,
  type UpdateApplicationInput,
  updateApplicationInputSchema,
} from '@palea/contracts';
import { z } from 'zod';

const optionalAmount = z
  .string()
  .trim()
  .regex(/^\d+(?:[.,]\d+)?$/, 'validation.salary.format')
  .or(z.literal(''));

export const applicationEditableFormSchema = z
  .object({
    companyName: z
      .string()
      .trim()
      .min(1, 'validation.company.required')
      .max(120, 'validation.company.max'),
    role: z
      .string()
      .trim()
      .min(1, 'validation.role.required')
      .max(120, 'validation.role.max'),
    appliedOn: z.iso.date('validation.date.invalid').nullable(),
    url: z
      .string()
      .trim()
      .max(2048, 'validation.url.max')
      .refine(
        (value) => !value || /^https?:\/\//i.test(value),
        'validation.url.invalid',
      ),
    location: z.string().trim().max(200, 'validation.location.max'),
    schedule: z.string().trim().max(200, 'validation.schedule.max'),
    jobDescriptionHtml: z.string().max(100_000, 'validation.description.max'),
    workMode: z.enum(['remote', 'hybrid', 'onsite', 'unspecified']),
    commitment: z.enum(['full_time', 'part_time', 'unspecified']),
    contractType: z.enum([
      'employment',
      'freelance',
      'services',
      'internship',
      'other',
      'unspecified',
    ]),
    durationType: z.enum(['indefinite', 'temporary', 'unspecified']),
    resumeId: z.uuid().nullable(),
    expectedMinimum: optionalAmount,
    expectedMaximum: optionalAmount,
    expectedCurrency: z.string().length(3),
    expectedPeriod: z.enum(['hour', 'day', 'week', 'month', 'year']),
    offeredMinimum: optionalAmount,
    offeredMaximum: optionalAmount,
    offeredCurrency: z.string().length(3),
    offeredPeriod: z.enum(['hour', 'day', 'week', 'month', 'year']),
  })
  .superRefine((values, context) => {
    const record = values as Record<string, string>;
    for (const kind of ['expected', 'offered'] as const) {
      const exponent = currencyExponent.get(record[`${kind}Currency`] ?? '');
      if (exponent === undefined) continue;
      const parsed: Partial<Record<'minimum' | 'maximum', string>> = {};
      for (const bound of ['minimum', 'maximum'] as const) {
        const field = `${kind}${bound.charAt(0).toUpperCase()}${bound.slice(1)}`;
        const value = record[field] ?? '';
        if (!value.trim()) continue;
        try {
          parsed[bound] = majorToMinor(value, exponent);
        } catch (error) {
          context.addIssue({
            code: 'custom',
            path: [field],
            message:
              error instanceof Error
                ? error.message
                : 'validation.salary.format',
          });
        }
      }
      if (
        parsed.minimum &&
        parsed.maximum &&
        BigInt(parsed.minimum) > BigInt(parsed.maximum)
      ) {
        context.addIssue({
          code: 'custom',
          path: [`${kind}Maximum`],
          message: 'validation.salary.maximumBeforeMinimum',
        });
      }
    }
  });

export const applicationCreateFormSchema = applicationEditableFormSchema.extend({
  privateNotes: z.string().max(10_000, 'validation.notes.max'),
});

export type ApplicationCreateFormValues = z.infer<
  typeof applicationCreateFormSchema
>;
export type ApplicationEditableFormValues = z.infer<
  typeof applicationEditableFormSchema
>;

export const applicationCreateDefaults: ApplicationCreateFormValues = {
  companyName: '',
  role: '',
  appliedOn: null,
  url: '',
  location: '',
  schedule: '',
  jobDescriptionHtml: '',
  workMode: 'unspecified',
  commitment: 'unspecified',
  contractType: 'unspecified',
  durationType: 'unspecified',
  resumeId: null,
  expectedMinimum: '',
  expectedMaximum: '',
  expectedCurrency: 'USD',
  expectedPeriod: 'month',
  offeredMinimum: '',
  offeredMaximum: '',
  offeredCurrency: 'USD',
  offeredPeriod: 'month',
  privateNotes: '',
};

const currencyExponent = new Map<string, number>(
  currencyCatalog.map((currency) => [currency.code, currency.exponent]),
);

export function toCreateApplicationInput(
  values: ApplicationCreateFormValues,
): CreateApplicationInput {
  return createApplicationInputSchema.parse({
    companyName: values.companyName,
    role: values.role,
    appliedOn: values.appliedOn,
    url: values.url || null,
    location: values.location || null,
    schedule: values.schedule || null,
    workMode: values.workMode,
    commitment: values.commitment,
    contractType: values.contractType,
    durationType: values.durationType,
    resumeId: values.resumeId,
    jobDescription: values.jobDescriptionHtml.trim()
      ? { source: 'manual', html: values.jobDescriptionHtml }
      : null,
    privateNotes: values.privateNotes,
    expectedCompensation: toCompensation(
      values.expectedMinimum,
      values.expectedMaximum,
      values.expectedCurrency,
      values.expectedPeriod,
    ),
    offeredCompensation: toCompensation(
      values.offeredMinimum,
      values.offeredMaximum,
      values.offeredCurrency,
      values.offeredPeriod,
    ),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}

export function toUpdateApplicationInput(
  applicationId: string,
  values: ApplicationEditableFormValues,
): UpdateApplicationInput {
  return updateApplicationInputSchema.parse({
    applicationId,
    companyName: values.companyName,
    role: values.role,
    appliedOn: values.appliedOn,
    url: values.url || null,
    location: values.location || null,
    schedule: values.schedule || null,
    workMode: values.workMode,
    commitment: values.commitment,
    contractType: values.contractType,
    durationType: values.durationType,
    resumeId: values.resumeId,
    jobDescription: values.jobDescriptionHtml.trim()
      ? { source: 'manual', html: values.jobDescriptionHtml }
      : null,
    expectedCompensation: toCompensation(
      values.expectedMinimum,
      values.expectedMaximum,
      values.expectedCurrency,
      values.expectedPeriod,
    ),
    offeredCompensation: toCompensation(
      values.offeredMinimum,
      values.offeredMaximum,
      values.offeredCurrency,
      values.offeredPeriod,
    ),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}

function toCompensation(
  minimum: string,
  maximum: string,
  currency: string,
  period: CompensationRange['period'],
): CompensationRange | null {
  if (!minimum.trim() && !maximum.trim()) return null;
  const exponent = currencyExponent.get(currency);
  if (exponent === undefined) throw new Error('validation.currency.invalid');
  return {
    minimumMinor: minimum.trim() ? majorToMinor(minimum, exponent) : null,
    maximumMinor: maximum.trim() ? majorToMinor(maximum, exponent) : null,
    currency,
    period,
  };
}

export function majorToMinor(value: string, exponent: number) {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(normalized))
    throw new Error('validation.salary.format');
  const [whole, fraction = ''] = normalized.split('.');
  if (fraction.length > exponent)
    throw new Error('validation.salary.precision');
  const minor = `${whole}${fraction.padEnd(exponent, '0')}`.replace(
    /^0+(?=\d)/,
    '',
  );
  if (/^0+$/.test(minor)) throw new Error('validation.salary.positive');
  if (BigInt(minor) > 9223372036854775807n)
    throw new Error('validation.salary.range');
  return minor;
}

export function minorToMajor(value: string | null, exponent: number) {
  if (!value) return '';
  const digits = value.padStart(exponent + 1, '0');
  if (!exponent) return digits;
  const whole = digits.slice(0, -exponent);
  const fraction = digits.slice(-exponent).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole;
}

export function todayLocal(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
