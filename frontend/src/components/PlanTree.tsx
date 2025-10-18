import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { usePlanStore } from '../store/usePlanStore';
import { TaskNode } from '../types/task';
import { rewriteTaskPlan } from '../utils/api';
import { findNode, flattenNodes, moveNode, removeNode, updateNode } from '../utils/tree';

const droppableId = (parentId: string | null) => (parentId ? `list:${parentId}` : 'list:root');

interface NodeItemProps {
  node: TaskNode;
  parentId: string | null;
  depth: number;
  onChange: (nodeId: string, field: keyof TaskNode, value: string | number | boolean) => void;
  onAddChild: (parentId: string) => void;
  onRemove: (nodeId: string) => void;
  checked: boolean;
  onToggle: (nodeId: string, done: boolean) => void;
}

const NodeItem = ({ node, parentId, depth, onChange, onAddChild, onRemove, checked, onToggle }: NodeItemProps) => {
  const isStep = node.type === 'step';
  return (
    <div className={clsx('node-card', `depth-${depth}`)}>
      <div className="node-header">
        <input type="checkbox" checked={checked} onChange={(e) => onToggle(node.id, e.target.checked)} />
        <input
          className="node-title"
          value={node.title}
          onChange={(e) => onChange(node.id, 'title', e.target.value)}
        />
        <span className="node-type">{node.type}</span>
        <button className="delete" onClick={() => onRemove(node.id)}>
          删除
        </button>
      </div>
      <textarea
        className="node-instruction"
        value={node.instruction}
        onChange={(e) => onChange(node.id, 'instruction', e.target.value)}
        rows={2}
      />
      <div className="node-meta">
        <label>
          时长
          <input
            type="number"
            min={1}
            value={node.est_minutes}
            onChange={(e) => onChange(node.id, 'est_minutes', Number(e.target.value))}
          />
        </label>
        <label>
          优先级
          <input
            type="number"
            value={node.priority}
            onChange={(e) => onChange(node.id, 'priority', Number(e.target.value))}
          />
        </label>
        <label className="immediate">
          可立即执行
          <input type="checkbox" checked={node.immediate} onChange={(e) => onChange(node.id, 'immediate', e.target.checked)} />
        </label>
      </div>
      {!isStep && (
        <button className="add-child" onClick={() => onAddChild(node.id)}>
          添加子步骤
        </button>
      )}
    </div>
  );
};

export const PlanTree = () => {
  const { currentPlanId, plans, updatePlan, updateNodeStatus, progress, setPlan } = usePlanStore();
  const plan = currentPlanId ? plans[currentPlanId] : undefined;
  const planProgress = currentPlanId ? progress[currentPlanId] || {} : {};
  const [editHint, setEditHint] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const totals = useMemo(() => {
    if (!plan) return 0;
    return flattenNodes(plan.plan.nodes).reduce((sum, node) => sum + node.est_minutes, 0);
  }, [plan]);

  if (!plan) {
    return (
      <section className="panel plan-panel empty">
        <h2>任务清单</h2>
        <p>请先生成任务计划。</p>
      </section>
    );
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const sourceParent = result.source.droppableId === 'list:root' ? null : result.source.droppableId.split(':')[1];
    const destinationParent =
      result.destination.droppableId === 'list:root' ? null : result.destination.droppableId.split(':')[1];

    updatePlan(currentPlanId!, (current) => ({
      ...current,
      plan: {
        ...current.plan,
        nodes: moveNode(current.plan.nodes, sourceParent, result.source.index, destinationParent, result.destination!.index)
      }
    }));
  };

  const handleFieldChange = (nodeId: string, field: keyof TaskNode, value: string | number | boolean) => {
    updatePlan(currentPlanId!, (current) => ({
      ...current,
      plan: {
        ...current.plan,
        nodes: updateNode(current.plan.nodes, nodeId, (node) => ({
          ...node,
          [field]: value
        }))
      }
    }));
  };

  const handleAddChild = (parentId: string) => {
    updatePlan(currentPlanId!, (current) => {
      const parent = findNode(current.plan.nodes, parentId);
      if (!parent) return current;
      const newNode: TaskNode = {
        id: crypto.randomUUID(),
        type: parent.type === 'task' ? 'subtask' : 'step',
        title: parent.type === 'task' ? '新子任务' : '新步骤',
        instruction: '好，现在，描述行动',
        est_minutes: 5,
        priority: 3,
        dependencies: [],
        blockers: [],
        immediate: true,
        check_env: [],
        children: []
      };
      return {
        ...current,
        plan: {
          ...current.plan,
          nodes: updateNode(current.plan.nodes, parentId, (node) => ({
            ...node,
            children: [...node.children, newNode]
          }))
        }
      };
    });
  };

  const handleRemove = (nodeId: string) => {
    updatePlan(currentPlanId!, (current) => ({
      ...current,
      plan: {
        ...current.plan,
        nodes: removeNode(current.plan.nodes, nodeId)
      }
    }));
  };

  const handleToggle = (nodeId: string, done: boolean) => {
    updateNodeStatus(currentPlanId!, nodeId, done ? 'done' : 'todo');
  };

  const handleRewrite = async () => {
    if (!plan) return;
    setOptimizing(true);
    setMessage(null);
    try {
      const updated = await rewriteTaskPlan({ original_plan: plan, edit_hint: editHint });
      setPlan(currentPlanId!, updated);
      setMessage('已根据提示优化');
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setOptimizing(false);
    }
  };

  const renderNodeList = (nodes: TaskNode[], parentId: string | null, depth: number) => (
    <Droppable droppableId={droppableId(parentId)} type={`NODE-${depth}`}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps} className="node-list">
          {nodes.map((node, index) => (
            <Draggable key={node.id} draggableId={node.id} index={index}>
              {(dragProvided) => (
                <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}>
                  <NodeItem
                    node={node}
                    parentId={parentId}
                    depth={depth}
                    onChange={handleFieldChange}
                    onAddChild={handleAddChild}
                    onRemove={handleRemove}
                    checked={planProgress[node.id] === 'done'}
                    onToggle={handleToggle}
                  />
                  {node.children.length > 0 && renderNodeList(node.children, node.id, depth + 1)}
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );

  return (
    <section className="panel plan-panel">
      <h2>任务清单</h2>
      <div className="rewrite-bar">
        <input
          value={editHint}
          onChange={(e) => setEditHint(e.target.value)}
          placeholder="例如：压缩成2小时完成、合并重复步骤"
        />
        <button onClick={handleRewrite} disabled={optimizing}>
          {optimizing ? '优化中…' : 'AI优化'}
        </button>
      </div>
      {message && <div className="info-text">{message}</div>}
      <div className="plan-meta">
        <div>目标：{plan.plan.objective}</div>
        <div>总时长：约 {totals} 分钟</div>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>{renderNodeList(plan.plan.nodes, null, 0)}</DragDropContext>
    </section>
  );
};
