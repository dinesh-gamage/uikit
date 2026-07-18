import { describe, expect, it } from 'vitest';
import { collectDescendantIds, findNode, flattenVisible, subtreeCheckState, type TreeNode } from './tree-utils';

const sampleTree: TreeNode[] = [
  {
    id: 'a',
    label: 'A',
    children: [
      { id: 'a1', label: 'A1' },
      {
        id: 'a2',
        label: 'A2',
        children: [
          { id: 'a2a', label: 'A2a' },
          { id: 'a2b', label: 'A2b' },
        ],
      },
    ],
  },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C', children: async () => [{ id: 'c1', label: 'C1' }] },
];

describe('flattenVisible', () => {
  it('shows only top-level nodes when nothing is expanded', () => {
    const visible = flattenVisible(sampleTree, new Set());
    expect(visible.map((v) => v.node.id)).toEqual(['a', 'b', 'c']);
    expect(visible.every((v) => v.level === 0)).toBe(true);
  });

  it('expands one level', () => {
    const visible = flattenVisible(sampleTree, new Set(['a']));
    expect(visible.map((v) => v.node.id)).toEqual(['a', 'a1', 'a2', 'b', 'c']);
    expect(visible.find((v) => v.node.id === 'a1')?.level).toBe(1);
    expect(visible.find((v) => v.node.id === 'a1')?.parentId).toBe('a');
  });

  it('expands nested levels', () => {
    const visible = flattenVisible(sampleTree, new Set(['a', 'a2']));
    expect(visible.map((v) => v.node.id)).toEqual(['a', 'a1', 'a2', 'a2a', 'a2b', 'b', 'c']);
    expect(visible.find((v) => v.node.id === 'a2a')?.level).toBe(2);
  });

  it('does not expand an unloaded async node', () => {
    const visible = flattenVisible(sampleTree, new Set(['c']));
    expect(visible.map((v) => v.node.id)).toEqual(['a', 'b', 'c']);
    expect(visible.find((v) => v.node.id === 'c')?.hasChildren).toBe(true);
  });
});

describe('collectDescendantIds', () => {
  it('collects all nested descendant ids', () => {
    expect(collectDescendantIds(sampleTree[0])).toEqual(['a1', 'a2', 'a2a', 'a2b']);
  });

  it('returns empty array for a leaf node', () => {
    expect(collectDescendantIds(sampleTree[1])).toEqual([]);
  });

  it('returns empty array for an unloaded async node', () => {
    expect(collectDescendantIds(sampleTree[2])).toEqual([]);
  });
});

describe('subtreeCheckState', () => {
  it('is unchecked when nothing selected', () => {
    expect(subtreeCheckState(sampleTree[0], new Set())).toBe('unchecked');
  });

  it('is checked when the leaf itself is selected', () => {
    expect(subtreeCheckState(sampleTree[1], new Set(['b']))).toBe('checked');
  });

  it('is indeterminate when only some descendants are selected', () => {
    expect(subtreeCheckState(sampleTree[0], new Set(['a1']))).toBe('indeterminate');
  });

  it('is checked when all descendants are selected', () => {
    expect(subtreeCheckState(sampleTree[0], new Set(['a1', 'a2a', 'a2b']))).toBe('checked');
  });

  it('is indeterminate when a nested subtree is partially selected', () => {
    expect(subtreeCheckState(sampleTree[0], new Set(['a1', 'a2a']))).toBe('indeterminate');
  });
});

describe('findNode', () => {
  it('finds a top-level node', () => {
    expect(findNode(sampleTree, 'b')?.id).toBe('b');
  });

  it('finds a nested node', () => {
    expect(findNode(sampleTree, 'a2b')?.id).toBe('a2b');
  });

  it('returns null when not found', () => {
    expect(findNode(sampleTree, 'zzz')).toBeNull();
  });
});
