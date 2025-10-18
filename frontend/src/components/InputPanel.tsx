import { useState } from "react";

import type { GenerationRequest } from "../types";

interface Props {
  request: GenerationRequest;
  onChange: (payload: GenerationRequest) => void;
  onSubmit: (payload: GenerationRequest) => void;
  loading: boolean;
  error: string | null;
}

const InputPanel = ({ request, onChange, onSubmit, loading, error }: Props) => {
  const [mode, setMode] = useState<"free_text" | "template">(request.mode || "free_text");

  const handleSubmit = () => {
    onSubmit({ ...request, mode });
  };

  return (
    <section className="panel">
      <h2>输入任务</h2>
      <div className="section" style={{ display: "flex", gap: "8px" }}>
        <button
          className={mode === "free_text" ? "primary" : "secondary"}
          onClick={() => setMode("free_text")}
        >
          自由输入
        </button>
        <button
          className={mode === "template" ? "primary" : "secondary"}
          onClick={() => setMode("template")}
        >
          模板填空
        </button>
      </div>
      {mode === "free_text" ? (
        <div className="section">
          <label htmlFor="free-text">任务描述</label>
          <textarea
            id="free-text"
            placeholder="例如：完成课程报告（无菌检查移液器部分），今晚交"
            value={request.input_text}
            onChange={(event) => onChange({ ...request, input_text: event.target.value })}
          />
        </div>
      ) : (
        <div className="section">
          <label>填空模板</label>
          <input
            type="text"
            placeholder="我现在在..."
            value={request.template?.where_am_i || ""}
            onChange={(event) =>
              onChange({
                ...request,
                template: {
                  ...request.template,
                  where_am_i: event.target.value
                }
              })
            }
          />
          <input
            type="text"
            placeholder="我要做..."
            style={{ marginTop: "8px" }}
            value={request.template?.what_to_do || ""}
            onChange={(event) =>
              onChange({
                ...request,
                template: {
                  ...request.template,
                  what_to_do: event.target.value
                }
              })
            }
          />
          <select
            style={{ marginTop: "8px" }}
            value={request.template?.optimize_for || "clearer"}
            onChange={(event) =>
              onChange({
                ...request,
                template: {
                  ...request.template,
                  optimize_for: event.target.value as any
                }
              })
            }
          >
            <option value="faster">更快</option>
            <option value="clearer">更清晰</option>
            <option value="easier">更省心</option>
            <option value="other">其他</option>
          </select>
          <input
            type="text"
            placeholder="截止提示（可选）"
            style={{ marginTop: "8px" }}
            value={request.template?.deadline_hint || ""}
            onChange={(event) =>
              onChange({
                ...request,
                template: {
                  ...request.template,
                  deadline_hint: event.target.value
                }
              })
            }
          />
        </div>
      )}
      <div className="section">
        <label>时间盒（小时）</label>
        <input
          type="number"
          min={1}
          max={12}
          value={request.preferences?.timebox_hours || 6}
          onChange={(event) =>
            onChange({
              ...request,
              preferences: {
                ...request.preferences,
                timebox_hours: Number(event.target.value)
              }
            })
          }
        />
      </div>
      {error && <div className="error-banner">{error}</div>}
      <button className="primary" onClick={handleSubmit} disabled={loading}>
        {loading ? "生成中..." : "生成任务"}
      </button>
    </section>
  );
};

export default InputPanel;
