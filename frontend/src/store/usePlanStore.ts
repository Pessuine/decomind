import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TaskPlan } from '../types/task';

type NodeStatus = 'todo' | 'doing' | 'done';

interface Settings {
  provider: 'qwen' | 'openai';
  model: string;
  timebox_hours_default: number;
}

export interface PlanState {
  plans: Record<string, TaskPlan>;
  currentPlanId?: string;
  progress: Record<string, Record<string, NodeStatus>>;
  settings: Settings;
  setCurrentPlan: (planId?: string) => void;
  setPlan: (planId: string, plan: TaskPlan) => void;
  updateNodeStatus: (planId: string, nodeId: string, status: NodeStatus) => void;
  updatePlan: (planId: string, updater: (plan: TaskPlan) => TaskPlan) => void;
  removePlan: (planId: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  importData: (data: { plans: Record<string, TaskPlan>; progress: PlanState['progress']; settings: Settings }) => void;
}

const storageKey = 'decomind-cache-v1';

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      plans: {},
      currentPlanId: undefined,
      progress: {},
      settings: {
        provider: 'qwen',
        model: 'qwen-flash',
        timebox_hours_default: 6
      },
      setCurrentPlan: (planId) => set({ currentPlanId: planId }),
      setPlan: (planId, plan) =>
        set((state) => ({
          plans: { ...state.plans, [planId]: plan },
          currentPlanId: planId,
          progress: {
            ...state.progress,
            [planId]: state.progress[planId] || {}
          }
        })),
      updateNodeStatus: (planId, nodeId, status) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [planId]: {
              ...(state.progress[planId] || {}),
              [nodeId]: status
            }
          }
        })),
      updatePlan: (planId, updater) =>
        set((state) => {
          const plan = state.plans[planId];
          if (!plan) {
            return state;
          }
          const nextPlan = updater(plan);
          return {
            plans: { ...state.plans, [planId]: nextPlan }
          };
        }),
      removePlan: (planId) =>
        set((state) => {
          const { [planId]: _, ...restPlans } = state.plans;
          const { [planId]: __, ...restProgress } = state.progress;
          const nextCurrent = state.currentPlanId === planId ? undefined : state.currentPlanId;
          return { plans: restPlans, progress: restProgress, currentPlanId: nextCurrent };
        }),
      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings }
        })),
      importData: (data) =>
        set({
          plans: data.plans,
          progress: data.progress,
          settings: data.settings,
          currentPlanId: Object.keys(data.plans)[0]
        })
    }),
    {
      name: storageKey
    }
  )
);
