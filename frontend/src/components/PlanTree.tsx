import { useMemo, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
import clsx from 'clsx';
import { PlanNode, TaskPlan } from '../types';
import { getAllSteps, usePlanStore } from '../store';

interface PlanTreeProps {
  planId: string;
  plan: TaskPlan;
  onStartStep: (stepId: string) => void;
}

interface EditableNode extends PlanNode {
  isEditing?: boolean;
}

const generateId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

const NodeEditor = ({ node, onChange, onCancel }: { node: EditableNode; onChange: (node: EditableNode) => void; onCancel: () => void }) => {
  const [local, setLocal] = useState({ title: node.title, instruction: node.instruction, est_minutes: node.est_minutes });

  return (
    <div className="mt-2 space-y-2 rounded border border-gray-200 bg-white p-3 text-sm">
      <div className="flex gap-2">
        <label className="flex-1">
          <span className="text-gray-500">标题</span>
          <input
            className="mt-1 w-full rounded border border-gray-200 p-2 focus:border-accent focus:outline-none"
            value={local.title}
            onChange={(event) => setLocal((prev) => ({ ...prev, title: event.target.value }))}
          />
        </label>
        <label className="w-24">
          <span className="text-gray-500">分钟</span>
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded border border-gray-200 p-2 focus:border-accent focus:outline-none"
            value={local.est_minutes}
            onChange={(event) => setLocal((prev) => ({ ...prev, est_minutes: Number(event.target.value) }))}
          />
        </label>
      </div>
      <label className="flex flex-col">
        <span className="text-gray-500">指令</span>
        <textarea
          className="mt-1 w-full rounded border border-gray-200 p-2 focus:border-accent focus:outline-none"
          rows={2}
          value={local.instruction}
          onChange={(event) => setLocal((prev) => ({ ...prev, instruction: event.target.value }))}
        />
      </label>
      <div className="flex justify-end gap-2">
        <button className="rounded border border-gray-300 px-2 py-1" onClick={onCancel} type="button">
          取消
        </button>
        <button
          className="rounded bg-accent px-3 py-1 text-white"
          onClick={() => onChange({ ...node, ...local })}
          type="button"
        >
          保存
        </button>
      </div>
    </div>
  );
};

const NodeItem = ({ planId, node, depth, onEdit }: { planId: string; node: PlanNode; depth: number; onEdit: (node: PlanNode) => void }) => {
  const toggleNode = usePlanStore((state) => state.toggleNode);
  const deleteNode = usePlanStore((state) => state.deleteNode);
  const addNode = usePlanStore((state) => state.addNode);
  const progress = usePlanStore((state) => state.cache.progress[planId] || {});

  const handleAddChild = () => {
    const newNode: PlanNode = {
      id: generateId(),
      type: depth >= 2 ? 'step' : 'subtask',
      title: '新建节点',
      instruction: '好，现在，描述具体行动',
      est_minutes: 5,
      priority: 1,
      dependencies: [],
      blockers: [],
      immediate: true,
      check_env: [],
      children: []
    };
    addNode(planId, node.id, newNode);
  };

  const isChecked = progress[node.id] === 'done';

  return (
    <div className={clsx('rounded border border-gray-200 bg-white p-3', depth > 1 && 'ml-4 mt-2')}>
      <div className="flex items-start gap-3">
        <input
          checked={isChecked}
          className="mt-1"
          onChange={() => toggleNode(planId, node.id)}
          type="checkbox"
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{node.title}</p>
              <p className="text-xs text-gray-500">{node.instruction}</p>
            </div>
            <span className="text-xs text-gray-500">约 {node.est_minutes} 分钟</span>
          </div>
          <div className="flex gap-2 text-xs text-gray-400">
            <button className="hover:text-accent" onClick={() => onEdit(node)} type="button">
              编辑
            </button>
            {node.type !== 'step' && (
              <button className="hover:text-accent" onClick={handleAddChild} type="button">
                新增子任务
              </button>
            )}
            {depth > 1 && (
              <button className="hover:text-red-500" onClick={() => deleteNode(planId, node.id)} type="button">
                删除
              </button>
            )}
          </div>
          {node.children?.length > 0 && <NodeList planId={planId} nodes={node.children} depth={depth + 1} onEdit={onEdit} parentId={node.id} />}
        </div>
      </div>
    </div>
  );
};

const NodeList = ({ planId, nodes, depth, onEdit, parentId }: { planId: string; nodes: PlanNode[]; depth: number; onEdit: (node: PlanNode) => void; parentId: string | null }) => (
  <Droppable droppableId={parentId || 'root'}>
    {(provided) => (
      <div ref={provided.innerRef} {...provided.droppableProps} className={clsx(depth === 1 ? 'space-y-3' : 'space-y-2')}>
        {nodes.map((node, index) => (
          <Draggable key={node.id} draggableId={node.id} index={index}>
            {(draggableProvided) => (
              <div ref={draggableProvided.innerRef} {...draggableProvided.draggableProps} {...draggableProvided.dragHandleProps}>
                <NodeItem planId={planId} node={node} depth={depth} onEdit={onEdit} />
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
);

export function PlanTree({ planId, plan, onStartStep }: PlanTreeProps) {
  const updateNode = usePlanStore((state) => state.updateNode);
  const reorderNodes = usePlanStore((state) => state.reorderNodes);
  const [editingNode, setEditingNode] = useState<EditableNode | null>(null);

  const steps = useMemo(() => getAllSteps(plan.plan.nodes), [plan.plan.nodes]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.droppableId !== result.source.droppableId) {
      return;
    }
    const parentId = result.source.droppableId === 'root' ? null : result.source.droppableId;
    reorderNodes(planId, parentId, result.source.index, result.destination.index);
  };

  const handleStart = () => {
    if (steps.length > 0) {
      onStartStep(steps[0].id);
    }
  };

  const handleEdit = (node: PlanNode) => {
    setEditingNode({ ...node });
  };

  const handleSave = (node: EditableNode) => {
    updateNode(planId, node);
    setEditingNode(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">任务拆解</h2>
        <button className="rounded border border-accent px-3 py-1 text-sm text-accent" onClick={handleStart} type="button">
          开始执行
        </button>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <NodeList planId={planId} nodes={plan.plan.nodes} depth={1} onEdit={handleEdit} parentId={null} />
      </DragDropContext>
      {editingNode && <NodeEditor node={editingNode} onChange={handleSave} onCancel={() => setEditingNode(null)} />}
    </div>
  );
}
