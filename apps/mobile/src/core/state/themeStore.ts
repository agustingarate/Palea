import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';
interface ThemeState {
  preference: ThemePreference;
  setPreference(value: ThemePreference): void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'system',
  setPreference: (preference) => set({ preference }),
}));
