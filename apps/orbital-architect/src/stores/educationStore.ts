'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { EducationalEntry, ContentCategory } from '@/lib/education';

export interface TerminalLogEntry {
  id: string;
  timestamp: number;
  category: ContentCategory;
  title: string;
  body: string;
  detail?: string;
}

interface EducationState {
  // Persisted across sessions
  seenContentIds: string[];
  contentMinimized: boolean;

  // Session-only
  terminalLog: TerminalLogEntry[];
}

interface EducationActions {
  pushContent: (entries: EducationalEntry[]) => void;
  markSeen: (id: string) => void;
  clearTerminalLog: () => void;
  toggleMinimized: () => void;
  getSeenSet: () => Set<string>;
  getSeenCount: () => number;
  getUniqueCategories: () => ContentCategory[];
}

type EducationStore = EducationState & EducationActions;

export const useEducationStore = create<EducationStore>()(
  devtools(persist(
    (set, get) => ({
      seenContentIds: [],
      contentMinimized: false,
      terminalLog: [],

      pushContent: (entries) => {
        if (entries.length === 0) return;

        const state = get();
        const newLogEntries: TerminalLogEntry[] = entries.map(entry => ({
          id: entry.id,
          timestamp: Date.now(),
          category: entry.category,
          title: entry.title,
          body: entry.body,
          detail: entry.detail,
        }));

        // Mark showOnce entries as seen
        const newSeenIds = [...state.seenContentIds];
        for (const entry of entries) {
          if (entry.showOnce && !newSeenIds.includes(entry.id)) {
            newSeenIds.push(entry.id);
          }
        }

        set({
          terminalLog: [...state.terminalLog, ...newLogEntries],
          seenContentIds: newSeenIds,
        });
      },

      markSeen: (id) => {
        const state = get();
        if (!state.seenContentIds.includes(id)) {
          set({ seenContentIds: [...state.seenContentIds, id] });
        }
      },

      clearTerminalLog: () => {
        set({ terminalLog: [] });
      },

      toggleMinimized: () => {
        set({ contentMinimized: !get().contentMinimized });
      },

      getSeenSet: () => {
        return new Set(get().seenContentIds);
      },

      getSeenCount: () => {
        return get().seenContentIds.length;
      },

      getUniqueCategories: () => {
        const categories = new Set<ContentCategory>();
        for (const entry of get().terminalLog) {
          categories.add(entry.category);
        }
        return Array.from(categories);
      },
    }),
    {
      name: 'orbital-architect-education',
      partialize: (state) => ({
        seenContentIds: state.seenContentIds,
        contentMinimized: state.contentMinimized,
      }),
    }
  ), { name: 'EducationStore' })
);
