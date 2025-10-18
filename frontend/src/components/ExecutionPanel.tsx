import { useEffect, useMemo, useState } from "react";

import type { PlanNode, TaskPlan } from "../types";
import { useCacheStore } from "../hooks/useLocalCache";

interface Props {
  plan: TaskPlan | null;
  activePlanId: string | null;
}

const flattenSteps = (nodes: PlanNode[]): PlanNode[] => {
  const result: PlanNode[] = [];
  const traverse = (list: PlanNode[]) => {
    list.forEach((node) => {
      if (node.type === "step") {
        result.push(node);
      }
      if (node.children.length > 0) {
        traverse(node.children);
      }
    });
  };
  traverse(nodes);
  return result;
};

const formatTime = (value: number) => {
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const ExecutionPanel = ({ plan, activePlanId }: Props) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const progressStore = useCacheStore();

  const steps = useMemo(() => (plan ? flattenSteps(plan.plan.nodes) : []), [plan]);
  const activeStep = steps[activeIndex];

  useEffect(() => {
    let timer: number | null = null;
    if (running && remaining > 0) {
      timer = window.setInterval(() => {
        setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (!running && remaining === 0 && activeStep) {
      setRemaining(activeStep.est_minutes * 60);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [running, remaining, activeStep]);

  useEffect(() => {
    setActiveIndex(0);
    setRemaining(0);
    setRunning(false);
  }, [plan?.meta.generated_at]);

  const handleComplete = () => {
    if (!plan || !activeStep) return;
    if (activePlanId) {
      progressStore.updateProgress(activePlanId, activeStep.id, "done");
    }
    const nextIndex = activeIndex + 1;
    if (nextIndex < steps.length) {
      setActiveIndex(nextIndex);
      setRemaining(steps[nextIndex].est_minutes * 60);
    } else {
      setRunning(false);
      setRemaining(0);
    }
  };

  if (!plan || steps.length === 0) {
    return (
      <section className="panel">
        <h2>行动引导</h2>
        <p style={{ color: "#6b7280" }}>生成任务后可进入行动引导模式。</p>
      </section>
    );
  }

  return (
    <section className="panel execution-panel">
      <h2>行动引导</h2>
      <div>
        <h3 style={{ marginBottom: "4px" }}>{activeStep.title}</h3>
        <p style={{ color: "#374151" }}>{activeStep.instruction}</p>
        <div style={{ color: "#6b7280" }}>
          {activeStep.blockers.length > 0 && <div>可能阻碍：{activeStep.blockers.join("、")}</div>}
          {activeStep.dependencies.length > 0 && <div>依赖：{activeStep.dependencies.join("、")}</div>}
          {activeStep.check_env.length > 0 && <div>先确认：{activeStep.check_env.join("、")}</div>}
        </div>
      </div>
      <div className="timer">{formatTime(remaining)}</div>
      <div className="timer-controls">
        <button className="secondary" onClick={() => setRemaining(activeStep.est_minutes * 60)}>
          重设
        </button>
        <button className="primary" onClick={() => setRunning((prev) => !prev)}>
          {running ? "暂停" : "开始"}
        </button>
        <button className="secondary" onClick={handleComplete}>
          完成并下一步
        </button>
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        {[5, 10, 15].map((minutes) => (
          <button key={minutes} className="secondary" onClick={() => setRemaining(minutes * 60)}>
            {minutes} 分钟
          </button>
        ))}
      </div>
    </section>
  );
};

export default ExecutionPanel;
