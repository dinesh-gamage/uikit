import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../utils/cx';
import { Checkbox } from '../checkbox';
import { Spinner } from '../spinner';
import { Skeleton } from '../skeleton';
import { flattenVisible, subtreeCheckState, type TreeNode, type VisibleNode } from './tree-utils';
import './tree-view.scss';

export type { TreeNode } from './tree-utils';

export interface TreeViewProps {
  nodes: TreeNode[];
  selected?: string | string[] | null;
  onSelect?: (id: string, node: TreeNode) => void;
  /** Renders checkboxes; parent checkboxes reflect the indeterminate state of their descendants. */
  multiSelect?: boolean;
  /** Controlled expanded node ids. Omit to let the tree manage its own expanded state. */
  expanded?: string[];
  defaultExpanded?: string[];
  onExpandedChange?: (ids: string[]) => void;
  /** Draw indent guide lines. Default false. */
  showLines?: boolean;
  renderLabel?: (node: TreeNode) => ReactNode;
  emptyMessage?: ReactNode;
  loading?: boolean;
  className?: string;
}

export interface TreeViewHandle {
  /** Expands every node whose children are already loaded. Does not fetch unloaded async branches. */
  expandAll: () => void;
  collapseAll: () => void;
}

function withCache(nodes: TreeNode[], cache: Map<string, TreeNode[]>): TreeNode[] {
  return nodes.map((node) => {
    if (typeof node.children === 'function') {
      const cached = cache.get(node.id);
      return cached ? { ...node, children: withCache(cached, cache) } : node;
    }
    if (Array.isArray(node.children)) {
      return { ...node, children: withCache(node.children, cache) };
    }
    return node;
  });
}

function collectExpandableIds(nodes: TreeNode[]): string[] {
  const out: string[] = [];
  for (const node of nodes) {
    if (Array.isArray(node.children) && node.children.length > 0) {
      out.push(node.id);
      out.push(...collectExpandableIds(node.children));
    }
  }
  return out;
}

export const TreeView = forwardRef<TreeViewHandle, TreeViewProps>(function TreeView(
  {
    nodes,
    selected = null,
    onSelect,
    multiSelect = false,
    expanded,
    defaultExpanded,
    onExpandedChange,
    showLines = false,
    renderLabel,
    emptyMessage = 'No items',
    loading = false,
    className,
  },
  ref,
) {
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState<string[]>(defaultExpanded ?? []);
  const isExpandedControlled = expanded !== undefined;
  const expandedIds = isExpandedControlled ? expanded! : uncontrolledExpanded;
  const expandedSet = useMemo(() => new Set(expandedIds), [expandedIds]);

  const [childrenCache, setChildrenCache] = useState<Map<string, TreeNode[]>>(new Map());
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const effectiveNodes = useMemo(() => withCache(nodes, childrenCache), [nodes, childrenCache]);
  const visible = useMemo(() => flattenVisible(effectiveNodes, expandedSet), [effectiveNodes, expandedSet]);

  useEffect(() => {
    if ((focusedId == null || !visible.some((v) => v.node.id === focusedId)) && visible.length > 0) {
      setFocusedId(visible[0].node.id);
    }
  }, [visible, focusedId]);

  const setExpandedIds = (updater: (prev: string[]) => string[]) => {
    const next = updater(expandedIds);
    if (!isExpandedControlled) setUncontrolledExpanded(next);
    onExpandedChange?.(next);
  };

  useImperativeHandle(ref, () => ({
    expandAll: () => setExpandedIds(() => collectExpandableIds(effectiveNodes)),
    collapseAll: () => setExpandedIds(() => []),
  }));

  const selectedIds = selected == null ? [] : Array.isArray(selected) ? selected : [selected];
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const expandNode = async (node: TreeNode) => {
    if (Array.isArray(node.children)) {
      setExpandedIds((prev) => (prev.includes(node.id) ? prev : [...prev, node.id]));
      return;
    }
    if (typeof node.children === 'function') {
      if (childrenCache.has(node.id)) {
        setExpandedIds((prev) => (prev.includes(node.id) ? prev : [...prev, node.id]));
        return;
      }
      setLoadingIds((prev) => new Set(prev).add(node.id));
      setExpandedIds((prev) => (prev.includes(node.id) ? prev : [...prev, node.id]));
      try {
        const kids = await node.children(node);
        setChildrenCache((prev) => new Map(prev).set(node.id, kids));
      } finally {
        setLoadingIds((prev) => {
          const next = new Set(prev);
          next.delete(node.id);
          return next;
        });
      }
    }
  };

  const collapseNode = (node: TreeNode) => {
    setExpandedIds((prev) => prev.filter((id) => id !== node.id));
  };

  const toggleExpand = (entry: VisibleNode) => {
    if (entry.node.disabled) return;
    if (expandedSet.has(entry.node.id)) collapseNode(entry.node);
    else void expandNode(entry.node);
  };

  const focusRow = (id: string) => {
    setFocusedId(id);
    rowRefs.current.get(id)?.focus();
  };

  const selectNode = (node: TreeNode) => {
    if (node.disabled) return;
    onSelect?.(node.id, node);
  };

  const onRowClick = (entry: VisibleNode) => {
    if (entry.node.disabled) return;
    focusRow(entry.node.id);
    if (!multiSelect) selectNode(entry.node);
  };

  const onTreeKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = visible.findIndex((v) => v.node.id === focusedId);
    if (idx < 0) return;
    const entry = visible[idx];

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      for (let i = idx + 1; i < visible.length; i++) {
        if (!visible[i].node.disabled) return focusRow(visible[i].node.id);
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      for (let i = idx - 1; i >= 0; i--) {
        if (!visible[i].node.disabled) return focusRow(visible[i].node.id);
      }
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      const first = visible.find((v) => !v.node.disabled);
      if (first) focusRow(first.node.id);
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      for (let i = visible.length - 1; i >= 0; i--) {
        if (!visible[i].node.disabled) return focusRow(visible[i].node.id);
      }
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (entry.hasChildren) {
        if (!expandedSet.has(entry.node.id)) {
          void expandNode(entry.node);
        } else {
          const next = visible[idx + 1];
          if (next && next.parentId === entry.node.id) focusRow(next.node.id);
        }
      }
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (entry.hasChildren && expandedSet.has(entry.node.id)) {
        collapseNode(entry.node);
      } else if (entry.parentId != null) {
        focusRow(entry.parentId);
      }
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectNode(entry.node);
    }
  };

  if (loading) {
    return (
      <div className={cx('uikit-tree-view', className)}>
        <Skeleton variant="text" count={5} />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className={cx('uikit-tree-view', className)}>
        <div className="uikit-tree-view__empty">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div role="tree" className={cx('uikit-tree-view', className)} onKeyDown={onTreeKeyDown}>
      {visible.map((entry) => {
        const { node, level, hasChildren } = entry;
        const isExpanded = expandedSet.has(node.id);
        const isLoading = loadingIds.has(node.id);
        const checkState = multiSelect ? subtreeCheckState(node, selectedSet) : null;
        const isActive = !multiSelect && selected === node.id;

        return (
          <div
            key={node.id}
            ref={(el) => {
              if (el) rowRefs.current.set(node.id, el);
              else rowRefs.current.delete(node.id);
            }}
            role="treeitem"
            id={`uikit-tree-item-${node.id}`}
            aria-level={level + 1}
            aria-expanded={hasChildren ? isExpanded : undefined}
            aria-selected={multiSelect ? checkState === 'checked' : isActive}
            aria-disabled={node.disabled || undefined}
            tabIndex={focusedId === node.id ? 0 : -1}
            className={cx('uikit-tree-view__row', {
              'uikit-tree-view__row--active': isActive,
              'uikit-tree-view__row--disabled': !!node.disabled,
            })}
            onClick={() => onRowClick(entry)}
          >
            {Array.from({ length: level }).map((_, i) => (
              <span key={i} className={cx('uikit-tree-view__indent', { 'uikit-tree-view__indent--line': showLines })} />
            ))}

            <span
              className={cx('uikit-tree-view__chevron', {
                'uikit-tree-view__chevron--expanded': isExpanded,
                'uikit-tree-view__chevron--hidden': !hasChildren,
              })}
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) toggleExpand(entry);
              }}
            >
              {isLoading ? (
                <Spinner size={12} />
              ) : hasChildren ? (
                <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true" focusable="false">
                  <path fill="currentColor" d="M5 3l6 5-6 5V3z" />
                </svg>
              ) : null}
            </span>

            {multiSelect && (
              <span className="uikit-tree-view__checkbox" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  size="sm"
                  checked={checkState === 'checked' ? true : checkState === 'indeterminate' ? 'indeterminate' : false}
                  disabled={node.disabled}
                  onChange={() => selectNode(node)}
                />
              </span>
            )}

            {node.icon != null && <span className="uikit-tree-view__icon">{node.icon}</span>}

            <span className="uikit-tree-view__label">{renderLabel ? renderLabel(node) : node.label}</span>
          </div>
        );
      })}
    </div>
  );
});
