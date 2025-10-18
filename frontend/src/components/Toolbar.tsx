import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { usePlanStore } from '../store';

export function Toolbar() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cache = usePlanStore((state) => state.cache);
  const currentPlanId = usePlanStore((state) => state.currentPlanId);
  const clearCurrentPlan = usePlanStore((state) => state.clearCurrentPlan);
  const importPlan = usePlanStore((state) => state.importPlan);
  const updateSettings = usePlanStore((state) => state.updateSettings);
  const setActionMode = usePlanStore((state) => state.setActionMode);
  const [showSettings, setShowSettings] = useState(false);

  const handleNew = () => {
    clearCurrentPlan();
    setActionMode(null);
  };

  const handleExport = () => {
    if (!currentPlanId) return;
    const plan = cache.plans[currentPlanId];
    const progress = cache.progress[currentPlanId] || {};
    const data = { plan, progress };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${plan.plan.title || 'plan'}-${dayjs().format('YYYYMMDD-HHmm')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result as string);
        if (!payload.plan) throw new Error('缺少计划数据');
        const planId = payload.plan.plan?.nodes?.[0]?.id || payload.planId || dayjs().valueOf().toString();
        importPlan(planId, payload.plan, payload.progress || {});
      } catch (error) {
        alert(error instanceof Error ? error.message : '导入失败');
      }
    };
    reader.readAsText(file);
  };

  const handleSettingsSave = (event: FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    updateSettings({
      provider: formData.get('provider') as 'qwen' | 'openai',
      model: formData.get('model') as string,
      timebox_hours_default: Number(formData.get('timebox') || 6)
    });
    setShowSettings(false);
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
      <div className="text-lg font-semibold">事情分解工具</div>
      <div className="flex flex-wrap gap-2 text-sm">
        <button className="rounded border border-gray-300 px-3 py-1" onClick={handleNew} type="button">
          新建任务
        </button>
        <button className="rounded border border-gray-300 px-3 py-1" onClick={handleExport} disabled={!currentPlanId} type="button">
          导出 JSON
        </button>
        <button
          className="rounded border border-gray-300 px-3 py-1"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          导入 JSON
        </button>
        <button className="rounded border border-gray-300 px-3 py-1" onClick={() => setShowSettings((prev) => !prev)} type="button">
          设置
        </button>
        <input ref={fileInputRef} className="hidden" type="file" accept="application/json" onChange={handleImport} />
      </div>
      {showSettings && (
        <form onSubmit={handleSettingsSave} className="w-full rounded border border-gray-200 bg-fog p-4 text-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-gray-600">提供商</span>
              <select
                className="rounded border border-gray-200 bg-white p-2"
                name="provider"
                defaultValue={cache.settings.provider}
              >
                <option value="qwen">通义千问</option>
                <option value="openai">OpenAI 兼容</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-gray-600">模型</span>
              <input className="rounded border border-gray-200 bg-white p-2" name="model" defaultValue={cache.settings.model} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-gray-600">默认时限（小时）</span>
              <input
                className="rounded border border-gray-200 bg-white p-2"
                name="timebox"
                type="number"
                min={1}
                max={24}
                defaultValue={cache.settings.timebox_hours_default}
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="rounded border border-gray-300 px-3 py-1" onClick={() => setShowSettings(false)} type="button">
              取消
            </button>
            <button className="rounded bg-accent px-3 py-1 text-white" type="submit">
              保存
            </button>
          </div>
        </form>
      )}
    </header>
  );
}
