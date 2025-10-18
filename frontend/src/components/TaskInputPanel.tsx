import { FormEvent, useEffect, useState } from 'react';
import { decomposeTask } from '../utils/api';
import { Preferences } from '../types/task';
import { usePlanStore } from '../store/usePlanStore';

const defaultTemplate = {
  where_am_i: '',
  what_to_do: '',
  optimize_for: 'faster' as Preferences['optimize_for'],
  deadline_hint: ''
};

export const TaskInputPanel = () => {
  const [mode, setMode] = useState<'free_text' | 'template'>('free_text');
  const [inputText, setInputText] = useState('');
  const [template, setTemplate] = useState(defaultTemplate);
  const [preferences, setPreferences] = useState<Preferences>({
    language: 'zh',
    max_depth: 3,
    style: 'action_guidance',
    timebox_hours: 6,
    optimize_for: 'faster'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setPlan = usePlanStore((state) => state.setPlan);
  const settings = usePlanStore((state) => state.settings);

  useEffect(() => {
    setPreferences((prev) => ({ ...prev, timebox_hours: settings.timebox_hours_default }));
  }, [settings.timebox_hours_default]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        mode,
        input_text: mode === 'free_text' ? inputText : undefined,
        template: mode === 'template' ? template : undefined,
        preferences
      };
      const plan = await decomposeTask(payload);
      const planId = plan.plan.nodes[0]?.id || crypto.randomUUID();
      setPlan(planId, plan);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel input-panel">
      <h2>输入</h2>
      <div className="mode-switch">
        <button className={mode === 'free_text' ? 'active' : ''} onClick={() => setMode('free_text')}>
          自由输入
        </button>
        <button className={mode === 'template' ? 'active' : ''} onClick={() => setMode('template')}>
          模板填空
        </button>
      </div>
      <form onSubmit={handleSubmit} className="task-form">
        {mode === 'free_text' ? (
          <textarea
            placeholder="例如：做课程报告（无菌检查移液器部分），今晚交"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={6}
            required
          />
        ) : (
          <div className="template-form">
            <label>
              我现在在
              <input value={template.where_am_i} onChange={(e) => setTemplate({ ...template, where_am_i: e.target.value })} />
            </label>
            <label>
              我要做
              <input value={template.what_to_do} onChange={(e) => setTemplate({ ...template, what_to_do: e.target.value })} />
            </label>
            <label>
              我想让任务更
              <select
                value={template.optimize_for}
                onChange={(e) => setTemplate({ ...template, optimize_for: e.target.value as Preferences['optimize_for'] })}
              >
                <option value="faster">更快</option>
                <option value="clearer">更清晰</option>
                <option value="easier">更省心</option>
                <option value="other">其他</option>
              </select>
            </label>
            <label>
              截止提示
              <input value={template.deadline_hint} onChange={(e) => setTemplate({ ...template, deadline_hint: e.target.value })} />
            </label>
          </div>
        )}
        <div className="preferences">
          <label>
            时间盒(小时)
            <input
              type="number"
              min={1}
              max={12}
              value={preferences.timebox_hours}
              onChange={(e) => setPreferences({ ...preferences, timebox_hours: Number(e.target.value) })}
            />
          </label>
          <label>
            优化目标
            <select value={preferences.optimize_for} onChange={(e) => setPreferences({ ...preferences, optimize_for: e.target.value as Preferences['optimize_for'] })}>
              <option value="faster">更快</option>
              <option value="clearer">更清晰</option>
              <option value="easier">更省心</option>
              <option value="other">其他</option>
            </select>
          </label>
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? '生成中…' : '生成任务'}
        </button>
      </form>
    </section>
  );
};
