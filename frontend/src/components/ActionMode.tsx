import { useEffect, useMemo } from 'react';
import { getAllSteps, usePlanStore } from '../store';
import { PlanNode, TaskPlan } from '../types';

interface ActionModeProps {
  planId: string;
  plan: TaskPlan;
}

const formatSeconds = (seconds: number) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
};

const findStep = (nodes: PlanNode[], targetId: string | null): PlanNode | null => {
  if (!targetId) return null;
  for (const node of nodes) {
    if (node.id === targetId) return node;
    if (node.children?.length) {
      const result = findStep(node.children, targetId);
      if (result) return result;
    }
  }
  return null;
};

export function ActionMode({ planId, plan }: ActionModeProps) {
  const actionMode = usePlanStore((state) => state.actionMode);
  const setActionMode = usePlanStore((state) => state.setActionMode);
  const toggleTimer = usePlanStore((state) => state.toggleTimer);
  const tickTimer = usePlanStore((state) => state.tickTimer);
  const resetTimer = usePlanStore((state) => state.resetTimer);
  const toggleNode = usePlanStore((state) => state.toggleNode);

  const steps = useMemo(() => getAllSteps(plan.plan.nodes), [plan.plan.nodes]);

  const currentStep = useMemo(() => findStep(plan.plan.nodes, actionMode.currentStepId), [plan.plan.nodes, actionMode.currentStepId]);

  useEffect(() => {
    const timer = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(timer);
  }, [tickTimer]);

  useEffect(() => {
    if (!actionMode.active && steps.length) {
      setActionMode(steps[0].id);
    }
  }, [actionMode.active, setActionMode, steps]);

  useEffect(() => {
    if (currentStep) {
      resetTimer(currentStep.est_minutes * 60);
    }
  }, [currentStep?.id, currentStep?.est_minutes, resetTimer]);

  const gotoStep = (offset: number) => {
    if (!currentStep) return;
    const index = steps.findIndex((step) => step.id === currentStep.id);
    const next = steps[index + offset];
    if (next) {
      setActionMode(next.id);
    }
  };

  const handleComplete = () => {
    if (!currentStep) return;
    toggleNode(planId, currentStep.id);
    gotoStep(1);
  };

  if (!currentStep) {
    return (
      <div className="rounded border border-dashed border-gray-300 p-6 text-sm text-gray-500">
        生成计划后可在此进入行动引导模式。
      </div>
    );
  }

  const blockerHint = currentStep.blockers?.length ? currentStep.blockers.join('；') : '若遇阻塞，可尝试把步骤拆得更小或暂时跳过。';

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">行动引导</h2>
      <div className="rounded border border-gray-200 bg-white p-4">
        <p className="text-sm font-medium text-gray-600">当前步骤</p>
        <p className="mt-1 text-lg font-semibold">{currentStep.title}</p>
        <p className="mt-2 text-sm text-gray-600">{currentStep.instruction}</p>
        <p className="mt-2 text-xs text-gray-400">优先级 {currentStep.priority} ｜ 建议 {currentStep.est_minutes} 分钟</p>
        {currentStep.check_env?.length > 0 && (
          <div className="mt-3 rounded bg-fog p-3 text-xs text-gray-500">
            <p className="font-medium text-gray-600">先决条件</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {currentStep.check_env.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2 text-xs">
            {[300, 600, 900].map((seconds) => (
              <button
                key={seconds}
                className="rounded border border-gray-300 px-2 py-1"
                onClick={() => resetTimer(seconds)}
                type="button"
              >
                {seconds / 60} 分钟
              </button>
            ))}
          </div>
          <p className="text-2xl font-mono text-accent">{formatSeconds(actionMode.remainingSeconds || currentStep.est_minutes * 60)}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <button className="rounded bg-accent px-4 py-2 text-white" onClick={() => toggleTimer()} type="button">
            {actionMode.timerRunning ? '暂停' : '开始'}
          </button>
          <button className="rounded border border-accent px-4 py-2 text-accent" onClick={handleComplete} type="button">
            完成并下一步
          </button>
          <button className="rounded border border-gray-300 px-4 py-2" onClick={() => gotoStep(1)} type="button">
            跳过
          </button>
          <button className="rounded border border-gray-300 px-4 py-2" onClick={() => gotoStep(-1)} type="button">
            上一步
          </button>
        </div>
      </div>
      <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-700">遇到阻塞？</p>
        <p className="mt-2">{blockerHint}</p>
      </div>
    </div>
  );
}
