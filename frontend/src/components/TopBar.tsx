import { ChangeEvent, useRef } from 'react';
import { usePlanStore } from '../store/usePlanStore';

interface TopBarProps {
  onNewTask: () => void;
}

const fileReader = () => new FileReader();

export const TopBar = ({ onNewTask }: TopBarProps) => {
  const { plans, currentPlanId, settings, updateSettings, importData } = usePlanStore();
  const fileInput = useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    if (!currentPlanId) return;
    const payload = {
      plans,
      progress: usePlanStore.getState().progress,
      settings
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plan-${currentPlanId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = fileReader();
    reader.onload = () => {
      try {
        const content = JSON.parse(reader.result as string);
        if (content.plans && content.progress && content.settings) {
          importData(content);
        }
      } catch (error) {
        console.error('导入失败', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="topbar">
      <div className="logo">事情分解工具</div>
      <div className="actions">
        <button onClick={onNewTask}>新建任务</button>
        <button onClick={handleExport} disabled={!currentPlanId}>
          导出JSON
        </button>
        <button onClick={() => fileInput.current?.click()}>导入JSON</button>
        <label className="settings">
          AI供应商
          <select value={settings.provider} onChange={(e) => updateSettings({ provider: e.target.value as 'qwen' | 'openai' })}>
            <option value="qwen">通义千问</option>
            <option value="openai">OpenAI兼容</option>
          </select>
        </label>
        <label className="settings">
          默认时间盒
          <input
            type="number"
            min={1}
            max={12}
            value={settings.timebox_hours_default}
            onChange={(e) => updateSettings({ timebox_hours_default: Number(e.target.value) })}
          />
        </label>
      </div>
      <input ref={fileInput} type="file" accept="application/json" style={{ display: 'none' }} onChange={handleImport} />
    </header>
  );
};
