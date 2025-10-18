import { useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "react-beautiful-dnd";

import type { PlanNode, TaskPlan } from "../types";
import { useCacheStore } from "../hooks/useLocalCache";

interface Props {
  plan: TaskPlan | null;
  plans: [string, TaskPlan][];
  loading: boolean;
  onSelectPlan: (id: string) => void;
  onRewrite: (hint: string) => void;
  onReorder: (sourceIndex: number, destinationIndex: number) => void;
  activePlanId: string | null;
}

const NodeView = ({
  node,
  depth = 0,
  planId,
}: {
  node: PlanNode;
  depth?: number;
  planId: string | null;
}) => {
  const [expanded, setExpanded] = useState(true);
  const progressStore = useCacheStore();
  const progress = planId ? progressStore.getProgress(planId) : {};
  const status = progress[node.id] || "todo";

  return (
    <div className="node" style={{ marginLeft: depth * 12 }}>
      <div className="node-header">
        <div className="node-title">
          {node.children.length > 0 && (
            <button className="secondary" onClick={() => setExpanded((prev) => !prev)}>
              {expanded ? "-" : "+"}
            </button>
          )}
          <input
            type="checkbox"
            checked={status === "done"}
            onChange={(event) => {
              if (!planId) return;
              progressStore.updateProgress(
                planId,
                node.id,
                event.target.checked ? "done" : "todo"
              );
            }}
          />
          <span>{node.title}</span>
          <span className="badge">{node.est_minutes} 分钟</span>
        </div>
      </div>
      <p style={{ marginTop: "8px", marginBottom: "4px" }}>{node.instruction}</p>
      <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
        {node.blockers.length > 0 && <div>阻碍：{node.blockers.join("、")}</div>}
        {node.check_env.length > 0 && <div>先决条件：{node.check_env.join("、")}</div>}
      </div>
      {expanded &&
        node.children.map((child) => (
          <NodeView key={child.id} node={child} depth={depth + 1} planId={planId} />
        ))}
    </div>
  );
};

const PlanPanel = ({
  plan,
  plans,
  loading,
  onSelectPlan,
  onRewrite,
  onReorder,
  activePlanId,
}: Props) => {
  const [rewriteHint, setRewriteHint] = useState("");

  const totalMinutes = useMemo(() => {
    if (!plan) return 0;
    const iterate = (nodes: PlanNode[]): number =>
      nodes.reduce((acc, node) => acc + node.est_minutes + iterate(node.children), 0);
    return iterate(plan.plan.nodes);
  }, [plan]);

  return (
    <section className="panel">
      <h2>任务计划</h2>
      {loading && <div className="success-banner">生成中，请稍候...</div>}
      {plans.length > 1 && (
        <div className="section">
          <label>历史计划</label>
          <select
            value={activePlanId ?? (plans[0] ? plans[0][0] : "")}
            onChange={(event) => onSelectPlan(event.target.value)}
          >
            {plans.map(([id, p]) => (
              <option key={id} value={id}>
                {p.plan.title}
              </option>
            ))}
          </select>
        </div>
      )}
      {plan ? (
        <>
          <div className="section">
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>{plan.plan.title}</h3>
              <span className="badge">总计 {totalMinutes} 分钟</span>
              <span className="badge">生成于 {new Date(plan.meta.generated_at).toLocaleString()}</span>
            </div>
            <p style={{ color: "#4b5563" }}>{plan.plan.objective}</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {plan.plan.constraints.map((constraint) => (
                <span key={constraint} className="badge">
                  {constraint}
                </span>
              ))}
            </div>
          </div>
          <div className="section list">
            <DragDropContext
              onDragEnd={(result: DropResult) => {
                if (!result.destination) return;
                if (result.destination.index === result.source.index) return;
                onReorder(result.source.index, result.destination.index);
              }}
            >
              <Droppable droppableId="plan-root">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {plan.plan.nodes.map((node, index) => (
                      <Draggable key={node.id} draggableId={node.id} index={index}>
                        {(draggableProvided) => (
                          <div
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            {...draggableProvided.dragHandleProps}
                          >
                            <NodeView node={node} planId={activePlanId} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
          <div className="section">
            <label>请求 AI 重新调整</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="例如：压缩到 2 小时内完成"
                value={rewriteHint}
                onChange={(event) => setRewriteHint(event.target.value)}
              />
              <button className="secondary" onClick={() => onRewrite(rewriteHint)}>
                重新生成
              </button>
            </div>
          </div>
        </>
      ) : (
        <div style={{ color: "#6b7280" }}>暂无计划，请先生成任务。</div>
      )}
    </section>
  );
};

export default PlanPanel;
