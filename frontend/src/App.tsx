import { useState, useMemo, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { saveAs } from "file-saver";

import { usePlanState } from "./hooks/usePlanState";
import type { GenerationRequest, TaskPlan } from "./types";
import InputPanel from "./components/InputPanel";
import PlanPanel from "./components/PlanPanel";
import ExecutionPanel from "./components/ExecutionPanel";

const DEFAULT_REQUEST: GenerationRequest = {
  mode: "free_text",
  input_text: "",
  preferences: {
    language: "zh",
    max_depth: 3,
    style: "action_guidance",
    timebox_hours: 6,
    optimize_for: "clearer"
  }
};

const App = () => {
  const [request, setRequest] = useState<GenerationRequest>(DEFAULT_REQUEST);
  const [error, setError] = useState<string | null>(null);
  const { plan, newPlan, updatePlan, activePlanId, cache, loadPlan } = usePlanState();

  useEffect(() => {
    const entries = Object.entries(cache.plans);
    if (!plan && entries.length > 0) {
      const [id, storedPlan] = entries[0];
      loadPlan(id, storedPlan);
    }
  }, [cache.plans, loadPlan, plan]);

  const mutation = useMutation({
    mutationFn: async (payload: GenerationRequest) => {
      const response = await axios.post<TaskPlan>("/api/decompose", payload);
      return response.data;
    },
    onSuccess: (data) => {
      newPlan(data);
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error || "生成失败，请稍后再试");
    }
  });

  const handleGenerate = (payload: GenerationRequest) => {
    setRequest(payload);
    mutation.mutate(payload);
  };

  const handleRewrite = async (hint: string) => {
    if (!plan) return;
    try {
      const response = await axios.post<TaskPlan>("/api/rewrite", {
        original_plan: plan,
        edit_hint: hint
      });
      updatePlan(() => response.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "调整失败，请稍后重试");
    }
  };

  const handleImport = (file: File) => {
    file.text().then((content) => {
      try {
        const parsed = JSON.parse(content) as TaskPlan;
        newPlan(parsed);
      } catch (err) {
        setError("导入失败，JSON 不合法");
      }
    });
  };

  const handleReorder = (sourceIndex: number, destinationIndex: number) => {
    if (!plan) return;
    updatePlan((current) => {
      const nodes = [...current.plan.nodes];
      const [moved] = nodes.splice(sourceIndex, 1);
      nodes.splice(destinationIndex, 0, moved);
      return {
        ...current,
        plan: {
          ...current.plan,
          nodes
        }
      };
    });
  };

  const handleExport = () => {
    if (!plan || !activePlanId) return;
    const blob = new Blob([JSON.stringify(plan, null, 2)], {
      type: "application/json;charset=utf-8"
    });
    saveAs(blob, `decomind-plan-${activePlanId}.json`);
  };

  const plans = useMemo(() => Object.entries(cache.plans), [cache.plans]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>事情分解工具</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="secondary" onClick={handleExport} disabled={!plan}>
            导出 JSON
          </button>
          <label className="secondary" style={{ padding: "8px 12px", cursor: "pointer" }}>
            导入 JSON
            <input
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleImport(file);
              }}
            />
          </label>
        </div>
      </header>
      <main className="app-main">
        <InputPanel
          request={request}
          onChange={setRequest}
          onSubmit={handleGenerate}
          loading={mutation.isPending}
          error={error}
        />
        <PlanPanel
          plan={plan}
          plans={plans}
          loading={mutation.isPending}
          onSelectPlan={(id) => {
            const cached = cache.loadPlan(id);
            if (cached) {
              loadPlan(id, cached);
            }
          }}
          onRewrite={handleRewrite}
          onReorder={handleReorder}
          activePlanId={activePlanId}
        />
        <ExecutionPanel plan={plan} activePlanId={activePlanId} />
      </main>
    </div>
  );
};

export default App;
