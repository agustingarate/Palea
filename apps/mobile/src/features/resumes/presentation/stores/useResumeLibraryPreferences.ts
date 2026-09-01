import { create } from 'zustand';

// Only client preferences survive route changes. Documents and signed access
// belong exclusively to TanStack Query, never to this session-only store.
export const useResumeLibraryPreferences = create<{
  view: 'grid' | 'list' | null;
  scrollOffset: number;
  setView: (view: 'grid' | 'list') => void;
  setScrollOffset: (value: number) => void;
  clear: () => void;
}>((set) => ({
  view: null,
  scrollOffset: 0,
  setView: (view) => set({ view }),
  setScrollOffset: (scrollOffset) => set({ scrollOffset }),
  clear: () => set({ view: null, scrollOffset: 0 }),
}));
