import { RegisterAccount } from './RegisterAccount';
import type { AuthRepository } from '../repositories/AuthRepository';
import type { OnboardingRepository } from '../repositories/OnboardingRepository';

it('creates Auth before completing the personal profile', async () => {
  const signUp = jest.fn();
  const completeRegistration = jest.fn();
  const auth = { signUp } as unknown as AuthRepository;
  const onboarding = {
    completeRegistration,
  } as unknown as OnboardingRepository;
  const useCase = new RegisterAccount(auth, onboarding);

  await useCase.execute({
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'Password1',
    birthDate: '1990-01-01',
    nationality: 'AR',
  });

  expect(signUp.mock.invocationCallOrder[0]!).toBeLessThan(
    completeRegistration.mock.invocationCallOrder[0]!,
  );
  expect(completeRegistration).toHaveBeenCalledWith({
    fullName: 'Ada Lovelace',
    birthDate: '1990-01-01',
    nationality: 'AR',
  });
});
