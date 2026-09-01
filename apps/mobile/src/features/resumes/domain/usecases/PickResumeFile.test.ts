import { PickResumeFile } from './PickResumeFile';

const policy = { maxSizeBytes: 100, maxResumes: 10, usedResumes: 0 };
const pdf = new Uint8Array(100);
pdf.set(new TextEncoder().encode('%PDF-'));
const readBytes = jest.fn().mockResolvedValue(pdf);
const pick = jest.fn();
const useCase = new PickResumeFile({ pick });
beforeEach(() => {
  jest.clearAllMocks();
  readBytes.mockResolvedValue(pdf);
  pick.mockResolvedValue({
    name: 'cv.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 100,
    readBytes,
  });
});

it('accepts the exact effective limit and uses actual byte length', async () => {
  expect(await useCase.execute(policy)).toMatchObject({
    name: 'cv.pdf',
    sizeBytes: 100,
  });
});
it('does not read a known oversized file', async () => {
  pick.mockResolvedValue({ name: 'large.pdf', sizeBytes: 101, readBytes });
  await expect(useCase.execute(policy)).rejects.toThrow('resume.maxSize');
  expect(readBytes).not.toHaveBeenCalled();
});
it('rejects bytes that exceed the limit even when metadata lies', async () => {
  readBytes.mockResolvedValue(new Uint8Array(101));
  await expect(useCase.execute(policy)).rejects.toThrow('resume.maxSize');
});
it('rejects a forged PDF and does not depend solely on MIME', async () => {
  readBytes.mockResolvedValue(new TextEncoder().encode('not a PDF'));
  await expect(useCase.execute(policy)).rejects.toThrow('resume.invalidFile');
});
it('does not open the picker when reservations fill the library', async () => {
  await expect(useCase.execute({ ...policy, usedResumes: 10 })).rejects.toThrow(
    'resume.library_full',
  );
  expect(pick).not.toHaveBeenCalled();
});
it('treats selection cancellation as no operation', async () => {
  pick.mockResolvedValue(null);
  expect(await useCase.execute(policy)).toBeNull();
});
