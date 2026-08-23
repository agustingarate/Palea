import { create } from 'zustand';
import type { ExperienceBand } from '@palea/contracts';

interface OnboardingDraftState {
  profile: {
    roleDescription: string;
    experienceBand: ExperienceBand;
    interestIds: string[];
  };
  work: {
    companyName: string;
    role: string;
    startedOn: string;
    endedOn: string | null;
    isCurrent: boolean;
  };
  skills: string[];
  setProfile(value: OnboardingDraftState['profile']): void;
  setWork(value: OnboardingDraftState['work']): void;
  setSkills(value: string[]): void;
  clear(): void;
}

const initial = {
  profile: {
    roleDescription: '',
    experienceBand: 'zero_to_one' as ExperienceBand,
    interestIds: [],
  },
  work: {
    companyName: '',
    role: '',
    startedOn: '',
    endedOn: null,
    isCurrent: false,
  },
  skills: [],
};

export const useOnboardingDraftStore = create<OnboardingDraftState>((set) => ({
  ...initial,
  setProfile: (profile) => set({ profile }),
  setWork: (work) => set({ work }),
  setSkills: (skills) => set({ skills }),
  clear: () => set(initial),
}));
