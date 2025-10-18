import { useEffect, useMemo, useState } from 'react';
import { usePlanStore } from '../store/usePlanStore';
import { TaskNode } from '../types/task';
import { flattenNodes } from '../utils/tree';
import { useCountdown } from '../hooks/useCountdown';

const presets = [5, 10, 15];

export const ActionMode = () => {
  const { currentPlanId, plans, progress, updateNodeStatus } = usePlanStore();
  const plan = currentPlanId ? plans[currentPlanId] : undefined;
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(5 * 60);
  const { secondsLeft, running, start, pause, reset } = useCountdown(selectedDuration);

  const steps = useMemo(() => {
    if (!plan) return [] as TaskNode[];
    return flattenNodes(plan.plan.nodes).filter((node) => node.type === 'step');
  }, [plan]);

  useEffect(() => {
    reset(selectedDuration);
  }, [selectedDuration, reset]);

  useEffect(() => {
    setActiveIndex(0);
  }, [currentPlanId]);

  useEffect(() => {
    if (steps.length === 0 && activeIndex !== 0) {
      setActiveIndex(0);
      return;
    }
    if (steps.length > 0 && activeIndex > steps.length - 1) {
      setActiveIndex(steps.length - 1);
    }
  }, [steps, activeIndex]);

  if (!plan || steps.length === 0) {
    return (
      <section className="panel action-panel empty">
        <h2>行动引导</h2>
        <p>准备好计划后即可开始执行模式。</p>
      </section>
    );
  }

  const currentStep = steps[activeIndex];
  const handleStart = (minutes: number) => {
    const seconds = minutes * 60;
    setSelectedDuration(seconds);
    reset(seconds);
    start();
  };

  const handleFinish = () => {
    updateNodeStatus(currentPlanId!, currentStep.id, 'done');
    if (activeIndex < steps.length - 1) {
      setActiveIndex(activeIndex + 1);
      const nextStep = steps[activeIndex + 1];
      const defaultMinutes = Math.max(3, Math.min(20, nextStep.est_minutes));
      handleStart(defaultMinutes);
    } else {
      pause();
    }
  };

  const handleSkip = () => {
    if (activeIndex < steps.length - 1) {
      setActiveIndex(activeIndex + 1);
      reset(selectedDuration);
    }
  };

  const minutesLeft = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <section className="panel action-panel">
      <h2>行动引导</h2>
      <div className="step-info">
        <div className="step-title">{currentStep.title}</div>
        <div className="instruction">{currentStep.instruction}</div>
        <div className="details">
          <span>预计 {currentStep.est_minutes} 分钟</span>
          <span>优先级 {currentStep.priority}</span>
        </div>
      </div>
      <div className="timer">
        <div className="time-display">
          {minutesLeft.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
        <div className="timer-controls">
          {presets.map((m) => (
            <button key={m} onClick={() => handleStart(m)}>
              {m} 分钟
            </button>
          ))}
          <button onClick={running ? pause : start}>{running ? '暂停' : '开始'}</button>
          <button onClick={() => reset(selectedDuration)}>重置</button>
        </div>
      </div>
      <div className="blockers">
        <h3>可能的阻碍</h3>
        <ul>
          {currentStep.blockers.length ? currentStep.blockers.map((b) => <li key={b}>{b}</li>) : <li>暂无</li>}
        </ul>
        <h3>环境检查</h3>
        <ul>
          {currentStep.check_env.length ? currentStep.check_env.map((c) => <li key={c}>{c}</li>) : <li>无特别要求</li>}
        </ul>
      </div>
      <div className="actions">
        <button onClick={handleFinish}>完成并下一步</button>
        <button onClick={handleSkip}>跳过</button>
      </div>
    </section>
  );
};
