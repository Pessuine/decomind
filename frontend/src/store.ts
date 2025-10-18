import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';
import { CacheModel, PlanNode, ProgressState, TaskPlan } from './types';

const DEFAULT_CACHE: CacheModel = {
  plans: {},
  progress: {},
  settings: {
    provider: 'qwen',
    model: 'qwen-flash',
    timebox_hours_default: 6
  }
};

interface PlanState {
  cache: CacheModel;
  currentPlanId: string | null;
  loading: boolean;
  error: string | null;
  actionMode: {
    active: boolean;
    currentStepId: string | null;
    remainingSeconds: number;
    timerRunning: boolean;
  };
  setLoading: (state: boolean) => void;
  setError: (message: string | null) => void;
  savePlan: (plan: TaskPlan) => void;
  setCurrentPlan: (planId: string | null) => void;
  toggleNode: (planId: string, nodeId: string) => void;
  updateNode: (planId: string, updated: PlanNode) => void;
  deleteNode: (planId: string, nodeId: string) => void;
  addNode: (planId: string, parentId: string | null, node: PlanNode) => void;
  reorderNodes: (planId: string, parentId: string | null, startIndex: number, endIndex: number) => void;
  setActionMode: (stepId: string | null) => void;
  tickTimer: () => void;
  toggleTimer: () => void;
  resetTimer: (seconds: number) => void;
  importPlan: (planId: string, plan: TaskPlan, progress: Record<string, ProgressState>) => void;
  clearCurrentPlan: () => void;
  updateSettings: (settings: Partial<CacheModel['settings']>) => void;
}

const findAndUpdate = (nodes: PlanNode[], updated: PlanNode): PlanNode[] =>
  nodes.map((node) => {
    if (node.id === updated.id) {
      return { ...updated };
    }
    if (node.children?.length) {
      return { ...node, children: findAndUpdate(node.children, updated) };
    }
    return node;
  });

const findAndRemove = (nodes: PlanNode[], nodeId: string): PlanNode[] =>
  nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => ({ ...node, children: node.children ? findAndRemove(node.children, nodeId) : [] }));

const findAndInsert = (nodes: PlanNode[], parentId: string | null, node: PlanNode): PlanNode[] => {
  if (!parentId) {
    return [...nodes, node];
  }
  return nodes.map((item) => {
    if (item.id === parentId) {
      return { ...item, children: [...item.children, node] };
    }
    if (item.children?.length) {
      return { ...item, children: findAndInsert(item.children, parentId, node) };
    }
    return item;
  });
};

const findParent = (nodes: PlanNode[], parentId: string | null): PlanNode[] => {
  if (!parentId) {
    return nodes;
  }
  for (const node of nodes) {
    if (node.id === parentId) {
      return node.children;
    }
    if (node.children?.length) {
      const result = findParent(node.children, parentId);
      if (result) {
        return result;
      }
    }
  }
  return nodes;
};

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      cache: DEFAULT_CACHE,
      currentPlanId: null,
      loading: false,
      error: null,
      actionMode: {
        active: false,
        currentStepId: null,
        remainingSeconds: 0,
        timerRunning: false
      },
      setLoading: (state) => set({ loading: state }),
      setError: (message) => set({ error: message }),
      savePlan: (plan) =>
        set((prev) => {
          const planId = plan.plan.nodes[0]?.id || dayjs().valueOf().toString();
          const plans = { ...prev.cache.plans, [planId]: plan };
          const progress = { ...prev.cache.progress };
          if (!progress[planId]) {
            progress[planId] = {};
          }
          return { cache: { ...prev.cache, plans, progress }, currentPlanId: planId };
        }),
      setCurrentPlan: (planId) => set({ currentPlanId: planId }),
      clearCurrentPlan: () => set({ currentPlanId: null }),
      toggleNode: (planId, nodeId) =>
        set((prev) => {
          const progress = { ...prev.cache.progress };
          const planProgress = { ...(progress[planId] || {}) };
          const current = planProgress[nodeId];
          const nextState: ProgressState = current === 'done' ? 'todo' : 'done';
          planProgress[nodeId] = nextState;
          progress[planId] = planProgress;
          return { cache: { ...prev.cache, progress } };
        }),
      updateNode: (planId, updated) =>
        set((prev) => {
          const plan = prev.cache.plans[planId];
          if (!plan) return prev;
          const nodes = findAndUpdate(plan.plan.nodes, updated);
          const updatedPlan: TaskPlan = { ...plan, plan: { ...plan.plan, nodes } };
          return { cache: { ...prev.cache, plans: { ...prev.cache.plans, [planId]: updatedPlan } } };
        }),
      deleteNode: (planId, nodeId) =>
        set((prev) => {
          const plan = prev.cache.plans[planId];
          if (!plan) return prev;
          const nodes = findAndRemove(plan.plan.nodes, nodeId);
          const updatedPlan: TaskPlan = { ...plan, plan: { ...plan.plan, nodes } };
          const progress = { ...prev.cache.progress };
          if (progress[planId]) {
            delete progress[planId][nodeId];
          }
          return {
            cache: { ...prev.cache, plans: { ...prev.cache.plans, [planId]: updatedPlan }, progress }
          };
        }),
      addNode: (planId, parentId, node) =>
        set((prev) => {
          const plan = prev.cache.plans[planId];
          if (!plan) return prev;
          const nodes = findAndInsert(plan.plan.nodes, parentId, node);
          const updatedPlan: TaskPlan = { ...plan, plan: { ...plan.plan, nodes } };
          return { cache: { ...prev.cache, plans: { ...prev.cache.plans, [planId]: updatedPlan } } };
        }),
      reorderNodes: (planId, parentId, startIndex, endIndex) =>
        set((prev) => {
          const plan = prev.cache.plans[planId];
          if (!plan || startIndex === endIndex) return prev;
          const parentList = parentId ? findParent(plan.plan.nodes, parentId) : plan.plan.nodes;
          const reordered = Array.from(parentList);
          const [moved] = reordered.splice(startIndex, 1);
          if (!moved) return prev;
          reordered.splice(endIndex, 0, moved);

          const cloneNodes = (list: PlanNode[]): PlanNode[] =>
            list.map((node) => ({ ...node, children: cloneNodes(node.children ?? []) }));

          const applyReorder = (nodes: PlanNode[]): PlanNode[] =>
            nodes.map((node) => {
              if (parentId === null) {
                return { ...node, children: cloneNodes(node.children || []) };
              }
              if (node.id === parentId) {
                return { ...node, children: cloneNodes(reordered) };
              }
              return { ...node, children: applyReorder(node.children || []) };
            });

          const nodes = parentId === null ? cloneNodes(reordered) : applyReorder(plan.plan.nodes);
          const updatedPlan: TaskPlan = { ...plan, plan: { ...plan.plan, nodes } };
          return { cache: { ...prev.cache, plans: { ...prev.cache.plans, [planId]: updatedPlan } } };
        }),
      setActionMode: (stepId) =>
        set((prev) => ({
          actionMode: {
            active: Boolean(stepId),
            currentStepId: stepId,
            remainingSeconds: stepId ? prev.actionMode.remainingSeconds || 300 : 0,
            timerRunning: Boolean(stepId)
          }
        })),
      tickTimer: () =>
        set((prev) => {
          if (!prev.actionMode.timerRunning || prev.actionMode.remainingSeconds <= 0) {
            return prev;
          }
          if (prev.actionMode.remainingSeconds <= 1) {
            return {
              actionMode: {
                ...prev.actionMode,
                remainingSeconds: 0,
                timerRunning: false
              }
            };
          }
          return {
            actionMode: {
              ...prev.actionMode,
              remainingSeconds: prev.actionMode.remainingSeconds - 1
            }
          };
        }),
      toggleTimer: () =>
        set((prev) => ({
          actionMode: {
            ...prev.actionMode,
            timerRunning: !prev.actionMode.timerRunning
          }
        })),
      resetTimer: (seconds) =>
        set((prev) => ({
          actionMode: {
            ...prev.actionMode,
            remainingSeconds: seconds,
            timerRunning: seconds > 0
          }
        })),
      importPlan: (planId, plan, progressMap) =>
        set((prev) => ({
          cache: {
            ...prev.cache,
            plans: { ...prev.cache.plans, [planId]: plan },
            progress: { ...prev.cache.progress, [planId]: progressMap }
          },
          currentPlanId: planId
        })),
      updateSettings: (settings) =>
        set((prev) => ({
          cache: {
            ...prev.cache,
            settings: { ...prev.cache.settings, ...settings }
          }
        }))
    }),
    {
      name: 'decomind-cache'
    }
  )
);

export const getAllSteps = (nodes: PlanNode[]): PlanNode[] => {
  const steps: PlanNode[] = [];
  nodes.forEach((node) => {
    if (node.type === 'step') {
      steps.push(node);
    }
    if (node.children?.length) {
      steps.push(...getAllSteps(node.children));
    }
  });
  return steps;
};
