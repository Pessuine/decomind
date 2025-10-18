import { useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CacheState, TaskPlan } from "../types";

const DEFAULT_CACHE: CacheState = {
  plans: {},
  progress: {},
  settings: {
    provider: "qwen",
    model: "qwen-flash",
    timebox_hours_default: 6
  }
};

interface CacheActions {
  savePlan: (id: string, plan: TaskPlan) => void;
  removePlan: (id: string) => void;
  updateProgress: (planId: string, nodeId: string, status: "todo" | "doing" | "done") => void;
  updateSettings: (settings: CacheState["settings"]) => void;
  loadPlan: (id: string) => TaskPlan | undefined;
  getProgress: (planId: string) => Record<string, "todo" | "doing" | "done">;
}

export const useCacheStore = create<CacheState & CacheActions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_CACHE,
      savePlan: (id, plan) =>
        set((state) => ({ plans: { ...state.plans, [id]: plan } })),
      removePlan: (id) =>
        set((state) => {
          const { [id]: _, ...rest } = state.plans;
          const { [id]: __, ...progressRest } = state.progress;
          return { plans: rest, progress: progressRest };
        }),
      updateProgress: (planId, nodeId, status) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [planId]: {
              ...(state.progress[planId] || {}),
              [nodeId]: status
            }
          }
        })),
      updateSettings: (settings) => set(() => ({ settings })),
      loadPlan: (id) => get().plans[id],
      getProgress: (planId) => get().progress[planId] || {}
    }),
    {
      name: "decomind-cache"
    }
  )
);

export const useAutoSave = (planId: string | null, plan: TaskPlan | null) => {
  const savePlan = useCacheStore((state) => state.savePlan);
  useEffect(() => {
    if (planId && plan) {
      const timer = setTimeout(() => savePlan(planId, plan), 500);
      return () => clearTimeout(timer);
    }
    return;
  }, [planId, plan, savePlan]);
};
