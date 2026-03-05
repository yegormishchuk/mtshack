import { useState } from 'react';
import type { TreeNode } from '../types';

interface TreeNodeProps {
  node: TreeNode;
  currentPath: string;
  depth: number;
  onNavigate: (path: string) => void;
}

function TreeNodeItem({ node, currentPath, depth, onNavigate }: TreeNodeProps) {
  const [open, setOpen] = useState(node.isOpen ?? depth === 0);
  const isActive = currentPath === node.path;
  const hasChildren = node.children.length > 0;

  return (
    <div className="fm-tree-node">
      <button
        type="button"
        className={`fm-tree-row${isActive ? ' fm-tree-row-active' : ''}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => {
          onNavigate(node.path);
          if (hasChildren) setOpen((v) => !v);
        }}
      >
        <span className={`fm-tree-chevron${open ? ' fm-tree-chevron-open' : ''}`}>
          {hasChildren ? '›' : ' '}
        </span>
        <span className="fm-tree-icon">📁</span>
        <span className="fm-tree-label">{node.label}</span>
      </button>
      {open && hasChildren && (
        <div className="fm-tree-children">
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              currentPath={currentPath}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface DirectoryTreeProps {
  tree: TreeNode[];
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function DirectoryTree({ tree, currentPath, onNavigate }: DirectoryTreeProps) {
  return (
    <div className="fm-tree-scroll">
      {tree.map((root) => (
        <TreeNodeItem
          key={root.path}
          node={root}
          currentPath={currentPath}
          depth={0}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}
