import { healthSchema, projectDtoSchema } from './index';

it('parses public boundary contracts', () => {
  expect(healthSchema.parse({ status: 'ok' })).toEqual({ status: 'ok' });
  expect(() =>
    projectDtoSchema.parse({
      id: '',
      name: '',
      company: '',
      status: 'unknown',
      updatedAt: 'today',
    }),
  ).toThrow();
});
