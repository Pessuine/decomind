import { useState, useMemo, useCallback } from "react";
import { v4 as uuid } from "uuid";

import { useCacheStore, useAutoSave } from "./useLocalCache";
import type { PlanNode, TaskPlan } from "../types";

export const usePlanState = () => {
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [plan, setPlan] = useState<TaskPlan | null>(null);
  const cache = useCacheStore();

  useAutoSave(activePlanId, plan);

  const progress = useMemo(() => {
    if (!activePlanId) return {};
    return cache.getProgress(activePlanId);
  }, [activePlanId, cache]);

  const setNodeStatus = useCallback(
    (nodeId: string, status: "todo" | "doing" | "done") => {
      if (!activePlanId) return;
      cache.updateProgress(activePlanId, nodeId, status);
    },
    [activePlanId, cache]
  );

  const loadPlan = useCallback(
    (id: string, nextPlan: TaskPlan) => {
      setActivePlanId(id);
      setPlan(nextPlan);
      cache.savePlan(id, nextPlan);
    },
    [cache]
  );

  const newPlan = useCallback((nextPlan: TaskPlan) => {
    const id = uuid();
    loadPlan(id, nextPlan);
    return id;
  }, [loadPlan]);

  const updatePlan = useCallback(
    (updater: (plan: TaskPlan) => TaskPlan) => {
      setPlan((current) => {
        if (!current) return current;
        const updated = updater(current);
        if (activePlanId) {
          cache.savePlan(activePlanId, updated);
        }
        return { ...updated };
      });
    },
    [activePlanId, cache]
  );

  const findNode = useCallback((nodes: PlanNode[], nodeId: string): PlanNode | null => {
    for (const node of nodes) {
      if (node.id === nodeId) return node;
      const child = findNode(node.children, nodeId);
      if (child) return child;
    }
    return null;
  }, []);

  const updateNode = useCallback(
    (nodeId: string, partial: Partial<PlanNode>) => {
      if (!plan) return;
      const updateRecursive = (nodes: PlanNode[]): PlanNode[] =>
        nodes.map((node) =>
          node.id === nodeId
            ? { ...node, ...partial, children: updateRecursive(node.children) }
            : { ...node, children: updateRecursive(node.children) }
        );
      updatePlan((current) => ({
        ...current,
        plan: {
          ...current.plan,
          nodes: updateRecursive(current.plan.nodes)
        }
      }));
    },
    [plan, updatePlan]
  );

  return {
    activePlanId,
    plan,
    progress,
    setNodeStatus,
    loadPlan,
    newPlan,
    updatePlan,
    updateNode,
    cache
  };
};
