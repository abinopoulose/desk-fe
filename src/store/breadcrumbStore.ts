import { create } from 'zustand';

interface BreadcrumbState {
  labels: Record<string, string>;
  setLabel: (key: string, label: string) => void;
  setLabels: (entries: Record<string, string>) => void;
  clearLabel: (key: string) => void;
}

export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  labels: {},
  setLabel: (key, label) =>
    set((state) => {
      if (!key || state.labels[key] === label) return state;
      return { labels: { ...state.labels, [key]: label } };
    }),
  setLabels: (entries) =>
    set((state) => ({
      labels: { ...state.labels, ...entries },
    })),
  clearLabel: (key) =>
    set((state) => {
      const next = { ...state.labels };
      delete next[key];
      return { labels: next };
    }),
}));
