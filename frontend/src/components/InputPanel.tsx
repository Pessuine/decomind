import { FormEvent, useEffect, useMemo, useState } from 'react';
import { requestDecompose } from '../api';
import { Preferences } from '../types';
import { usePlanStore } from '../store';

const TEMPLATE_OPTIONS = [
  { label: '更快', value: 'faster' },
  { label: '更清晰', value: 'clearer' },
  { label: '更省心', value: 'easier' },
  { label: '其他', value: 'other' }
];

interface InputPanelProps {
  onGenerated: () => void;
}

export function InputPanel({ onGenerated }: InputPanelProps) {
  const [mode, setMode] = useState<'free_text' | 'template'>('free_text');
  const [freeText, setFreeText] = useState('');
  const [template, setTemplate] = useState({ where_am_i: '', what_to_do: '', optimize_for: 'clearer', deadline_hint: '' });
  const defaultTimebox = usePlanStore((state) => state.cache.settings.timebox_hours_default);
  const [preferences, setPreferences] = useState<Preferences>({
    language: 'zh',
    max_depth: 3,
    style: 'action_guidance',
    timebox_hours: defaultTimebox
  });
  const setLoading = usePlanStore((state) => state.setLoading);
  const setError = usePlanStore((state) => state.setError);
  const savePlan = usePlanStore((state) => state.savePlan);

  const submitDisabled = useMemo(() => {
    if (mode === 'free_text') {
      return !freeText.trim();
    }
    return !template.what_to_do.trim();
  }, [mode, freeText, template.what_to_do]);

  useEffect(() => {
    setPreferences((prev) => ({ ...prev, timebox_hours: defaultTimebox }));
  }, [defaultTimebox]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitDisabled) return;
    setLoading(true);
    setError(null);

    try {
      const plan = await requestDecompose({
        mode,
        input_text: mode === 'free_text' ? freeText : undefined,
        template:
          mode === 'template'
            ? {
                where_am_i: template.where_am_i,
                what_to_do: template.what_to_do,
                optimize_for: template.optimize_for as any,
                deadline_hint: template.deadline_hint
              }
            : undefined,
        preferences
      });
      savePlan(plan);
      onGenerated();
    } catch (error) {
      setError(error instanceof Error ? error.message : '生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">输入任务</h2>
      <div className="flex gap-3">
        <button
          className={`rounded border px-3 py-1 text-sm ${mode === 'free_text' ? 'border-accent text-accent' : 'border-gray-300'}`}
          onClick={() => setMode('free_text')}
          type="button"
        >
          自由输入
        </button>
        <button
          className={`rounded border px-3 py-1 text-sm ${mode === 'template' ? 'border-accent text-accent' : 'border-gray-300'}`}
          onClick={() => setMode('template')}
          type="button"
        >
          模板填空
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'free_text' ? (
          <textarea
            className="w-full rounded border border-gray-200 bg-white p-3 text-sm focus:border-accent focus:outline-none"
            placeholder="例如：今晚完成课程报告中的无菌检查移液器部分"
            rows={6}
            value={freeText}
            onChange={(event) => setFreeText(event.target.value)}
          />
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">我现在在...</label>
              <input
                className="mt-1 w-full rounded border border-gray-200 bg-white p-2 text-sm focus:border-accent focus:outline-none"
                value={template.where_am_i}
                onChange={(event) => setTemplate((prev) => ({ ...prev, where_am_i: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">我想完成...</label>
              <textarea
                className="mt-1 w-full rounded border border-gray-200 bg-white p-2 text-sm focus:border-accent focus:outline-none"
                rows={4}
                value={template.what_to_do}
                onChange={(event) => setTemplate((prev) => ({ ...prev, what_to_do: event.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">优化方向</label>
              <select
                className="mt-1 w-full rounded border border-gray-200 bg-white p-2 text-sm focus:border-accent focus:outline-none"
                value={template.optimize_for}
                onChange={(event) => setTemplate((prev) => ({ ...prev, optimize_for: event.target.value }))}
              >
                {TEMPLATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">截止提示（可选）</label>
              <input
                className="mt-1 w-full rounded border border-gray-200 bg-white p-2 text-sm focus:border-accent focus:outline-none"
                value={template.deadline_hint}
                onChange={(event) => setTemplate((prev) => ({ ...prev, deadline_hint: event.target.value }))}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-gray-600">最大层级</span>
            <input
              type="number"
              min={2}
              max={5}
              className="rounded border border-gray-200 bg-white p-2 focus:border-accent focus:outline-none"
              value={preferences.max_depth}
              onChange={(event) => setPreferences((prev) => ({ ...prev, max_depth: Number(event.target.value) }))}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-gray-600">总时限（小时）</span>
            <input
              type="number"
              min={1}
              max={24}
              className="rounded border border-gray-200 bg-white p-2 focus:border-accent focus:outline-none"
              value={preferences.timebox_hours}
              onChange={(event) => setPreferences((prev) => ({ ...prev, timebox_hours: Number(event.target.value) }))}
            />
          </label>
        </div>

        <button
          className="w-full rounded bg-accent py-2 text-sm font-medium text-white disabled:bg-gray-300"
          disabled={submitDisabled}
          type="submit"
        >
          生成任务计划
        </button>
      </form>
    </div>
  );
}
