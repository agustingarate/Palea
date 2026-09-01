import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ResumePdfValidator } from './resume-pdf.validator';

const validator = new ResumePdfValidator();
const fixture = (name: string) =>
  new Uint8Array(readFileSync(join(__dirname, '../../test/fixtures', name)));

describe('real PDF structural validation', () => {
  it('parses all pages of a valid PDF', async () => {
    await expect(validator.validate(fixture('resume-valid.pdf'))).resolves.toBe(
      true,
    );
  });
  it.each(['resume-password.pdf', 'resume-encrypted-empty.pdf'])(
    'rejects protected documents: %s',
    async (name) => {
      await expect(validator.validate(fixture(name))).resolves.toBe(false);
    },
  );
  it('rejects a forged signature and truncated document', async () => {
    await expect(
      validator.validate(new TextEncoder().encode('%PDF-1.7\ninvalid')),
    ).resolves.toBe(false);
    await expect(
      validator.validate(fixture('resume-valid.pdf').slice(0, 100)),
    ).resolves.toBe(false);
  });
});
