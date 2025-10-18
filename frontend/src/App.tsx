import { useEffect } from 'react';
import { InputPanel } from './components/InputPanel';
import { PlanTree } from './components/PlanTree';
import { ActionMode } from './components/ActionMode';
import { Toolbar } from './components/Toolbar';
import { getAllSteps, usePlanStore } from './store';

function LoadingMask() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 text-sm text-gray-500">
      正在生成计划...
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{message}</div>
  );
}

export default function App() {
  const loading = usePlanStore((state) => state.loading);
  const error = usePlanStore((state) => state.error);
  const currentPlanId = usePlanStore((state) => state.currentPlanId);
  const cache = usePlanStore((state) => state.cache);
  const setActionMode = usePlanStore((state) => state.setActionMode);

  const plan = currentPlanId ? cache.plans[currentPlanId] : null;

  useEffect(() => {
    if (plan) {
      const steps = getAllSteps(plan.plan.nodes);
      if (steps.length > 0) {
        setActionMode(steps[0].id);
      }
    }
  }, [plan, setActionMode]);

  return (
    <div className="min-h-screen bg-fog">
      <Toolbar />
      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
        {error && <ErrorBanner message={error} />}
        <div className="relative">
          {loading && <LoadingMask />}
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="rounded border border-gray-200 bg-white p-4">
              <InputPanel onGenerated={() => null} />
            </section>
            <section className="rounded border border-gray-200 bg-white p-4 lg:col-span-1">
              {plan ? <PlanTree planId={currentPlanId!} plan={plan} onStartStep={(stepId) => setActionMode(stepId)} /> : <p className="text-sm text-gray-500">生成后可查看任务树。</p>}
            </section>
            <section className="rounded border border-gray-200 bg-white p-4 lg:col-span-1">
              {plan ? <ActionMode planId={currentPlanId!} plan={plan} /> : <p className="text-sm text-gray-500">等待计划生成后开始执行。</p>}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
