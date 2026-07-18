import type { ReactNode } from 'react';

export interface TreeNode {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  children?: TreeNode[] | ((node: TreeNode) => Promise<TreeNode[]>);
  disabled?: boolean;
  data?: any;
}

export interface VisibleNode {
  node: TreeNode;
  level: number;
  parentId: string | null;
  hasChildren: boolean;
}

function staticChildren(node: TreeNode): TreeNode[] | null {
  return Array.isArray(node.children) ? node.children : null;
}

/** Does this node look like it can have children (static array or a not-yet-loaded async loader)? */
export function isExpandable(node: TreeNode): boolean {
  if (Array.isArray(node.children)) return node.children.length > 0;
  return typeof node.children === 'function';
}

/** Flattens the tree into the ordered list of currently visible rows, given the set of expanded node ids. */
export function flattenVisible(nodes: TreeNode[], expandedSet: Set<string>, level = 0, parentId: string | null = null): VisibleNode[] {
  const out: VisibleNode[] = [];
  for (const node of nodes) {
    const hasChildren = isExpandable(node);
    out.push({ node, level, parentId, hasChildren });
    if (hasChildren && expandedSet.has(node.id)) {
      const kids = staticChildren(node);
      if (kids) out.push(...flattenVisible(kids, expandedSet, level + 1, node.id));
    }
  }
  return out;
}

/** Collects the ids of all descendants of a node (not including the node itself). Only walks loaded (array) children. */
export function collectDescendantIds(node: TreeNode): string[] {
  const kids = staticChildren(node);
  if (!kids) return [];
  const out: string[] = [];
  for (const child of kids) {
    out.push(child.id);
    out.push(...collectDescendantIds(child));
  }
  return out;
}

export type CheckState = 'checked' | 'unchecked' | 'indeterminate';

/**
 * Determines a node's checkbox state. Leaves are checked/unchecked based on selectedSet membership;
 * parents derive their state purely from their (loaded) descendants, so they're checked only when
 * every descendant leaf is checked, indeterminate when some are, unchecked when none are.
 */
export function subtreeCheckState(node: TreeNode, selectedSet: Set<string>): CheckState {
  const kids = staticChildren(node);
  if (!kids || kids.length === 0) {
    return selectedSet.has(node.id) ? 'checked' : 'unchecked';
  }

  const states = kids.map((child) => subtreeCheckState(child, selectedSet));
  if (states.every((s) => s === 'checked')) return 'checked';
  if (states.every((s) => s === 'unchecked')) return 'unchecked';
  return 'indeterminate';
}

/** Finds a node by id within a tree of (possibly nested, loaded) nodes. */
export function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const kids = staticChildren(node);
    if (kids) {
      const found = findNode(kids, id);
      if (found) return found;
    }
  }
  return null;
}
