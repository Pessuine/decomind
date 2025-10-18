import { TaskNode } from '../types/task';

export const findNode = (nodes: TaskNode[], nodeId: string): TaskNode | undefined => {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    const found = findNode(node.children, nodeId);
    if (found) return found;
  }
  return undefined;
};

export const updateNode = (
  nodes: TaskNode[],
  nodeId: string,
  updater: (node: TaskNode) => TaskNode
): TaskNode[] => {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return updater(node);
    }
    if (node.children.length > 0) {
      return { ...node, children: updateNode(node.children, nodeId, updater) };
    }
    return node;
  });
};

export const removeNode = (nodes: TaskNode[], nodeId: string): TaskNode[] => {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => ({ ...node, children: removeNode(node.children, nodeId) }));
};

export const flattenNodes = (nodes: TaskNode[]): TaskNode[] => {
  const list: TaskNode[] = [];
  const walk = (nodeList: TaskNode[]) => {
    for (const node of nodeList) {
      list.push(node);
      if (node.children.length) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return list;
};

export const totalMinutes = (nodes: TaskNode[]): number => {
  return flattenNodes(nodes).reduce((acc, node) => acc + node.est_minutes, 0);
};

export const reorderNodes = <T,>(list: T[], startIndex: number, endIndex: number): T[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

export const replaceChildren = (nodes: TaskNode[], parentId: string | null, nextChildren: TaskNode[]): TaskNode[] => {
  if (parentId === null) {
    return nextChildren;
  }
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: nextChildren };
    }
    if (node.children.length > 0) {
      return { ...node, children: replaceChildren(node.children, parentId, nextChildren) };
    }
    return node;
  });
};

export const getChildren = (nodes: TaskNode[], parentId: string | null): TaskNode[] => {
  if (parentId === null) {
    return nodes;
  }
  const parent = findNode(nodes, parentId);
  return parent ? parent.children : [];
};

const cloneNodes = (nodes: TaskNode[]): TaskNode[] =>
  nodes.map((node) => ({ ...node, children: cloneNodes(node.children) }));

export const moveNode = (
  nodes: TaskNode[],
  sourceParentId: string | null,
  sourceIndex: number,
  destinationParentId: string | null,
  destinationIndex: number
): TaskNode[] => {
  const cloned = cloneNodes(nodes);
  const getList = (parentId: string | null): TaskNode[] => {
    if (parentId === null) return cloned;
    const parent = findNode(cloned, parentId);
    if (!parent) {
      throw new Error('Parent node not found');
    }
    return parent.children;
  };

  const sourceList = getList(sourceParentId);
  const [item] = sourceList.splice(sourceIndex, 1);
  const destinationList = getList(destinationParentId);
  destinationList.splice(destinationIndex, 0, item);
  return cloned;
};
