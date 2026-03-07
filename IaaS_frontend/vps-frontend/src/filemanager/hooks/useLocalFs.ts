import { useCallback, useRef, useState } from 'react';
import type { LocalFileItem, SortDir, SortField, TreeNode } from '../types';

let _idLocal = 1;
const uid = () => `loc-${_idLocal++}`;

function kindFromName(name: string): LocalFileItem['kind'] {
  if (name.startsWith('.env')) return 'env';
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
  if (['json', 'jsonc'].includes(ext)) return 'json';
  if (['log'].includes(ext)) return 'log';
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'sh', 'yml', 'yaml', 'toml', 'sql', 'dockerfile'].includes(ext)) return 'code';
  if (['zip', 'tar', 'gz', 'bz2', '7z', 'rar'].includes(ext)) return 'archive';
  if (['exe', 'bin', 'so', 'dll'].includes(ext)) return 'binary';
  if (['txt', 'md', 'csv', 'ini', 'cfg', 'conf'].includes(ext)) return 'text';
  return 'text';
}

function fileToItem(file: File, relativePath: string): LocalFileItem {
  const parts = relativePath.split('/').filter(Boolean);
  const name = parts.pop() ?? file.name;
  const dir = '/' + parts.join('/');
  return {
    id: uid(),
    name,
    path: dir === '/' ? `/${name}` : `${dir}/${name}`,
    size: file.size,
    modified: new Date(file.lastModified).toISOString(),
    isDirectory: false,
    kind: kindFromName(name),
    rawFile: file,
  };
}

function buildTree(items: LocalFileItem[]): TreeNode[] {
  const roots: TreeNode[] = [{ label: 'Local', path: '/', children: [], isOpen: true }];
  const nodeMap = new Map<string, TreeNode>();
  nodeMap.set('/', roots[0]);

  for (const item of items) {
    if (!item.isDirectory) {
      const parts = item.path.split('/').filter(Boolean);
      parts.pop(); // remove filename
      let current = '/';
      for (const part of parts) {
        const childPath = current === '/' ? `/${part}` : `${current}/${part}`;
        if (!nodeMap.has(childPath)) {
          const node: TreeNode = { label: part, path: childPath, children: [], isOpen: false };
          nodeMap.get(current)!.children.push(node);
          nodeMap.set(childPath, node);
        }
        current = childPath;
      }
    }
  }
  return roots;
}

function sortItems(items: LocalFileItem[], field: SortField, dir: SortDir): LocalFileItem[] {
  return [...items].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    let cmp = 0;
    if (field === 'name') cmp = a.name.localeCompare(b.name);
    else if (field === 'size') cmp = a.size - b.size;
    else cmp = a.modified.localeCompare(b.modified);
    return dir === 'asc' ? cmp : -cmp;
  });
}

export interface UseLocalFsReturn {
  allItems: LocalFileItem[];
  currentPath: string;
  items: LocalFileItem[];
  tree: TreeNode[];
  selectedIds: Set<string>;
  sortField: SortField;
  sortDir: SortDir;
  search: string;
  isDragOver: boolean;
  navigateTo: (path: string) => void;
  setSearch: (s: string) => void;
  toggleSelect: (id: string, multi: boolean, range: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setSortField: (f: SortField) => void;
  setSortDir: (d: SortDir) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  openFilePicker: () => void;
  openDirPicker: () => void;
  clear: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  dirInputRef: React.RefObject<HTMLInputElement>;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function useLocalFs(): UseLocalFsReturn {
  const [allItems, setAllItems] = useState<LocalFileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [search, setSearch] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const lastSelected = useRef<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const newItems: LocalFileItem[] = arr.map((f) => {
      const rel = (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;
      return fileToItem(f, rel);
    });
    setAllItems((prev) => {
      const existing = new Set(prev.map((i) => i.path));
      return [...prev, ...newItems.filter((i) => !existing.has(i.path))];
    });
    setCurrentPath('/');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      if (files.length) addFiles(files);
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const openFilePicker = useCallback(() => {
    if (fileInputRef.current) fileInputRef.current.click();
  }, []);

  const openDirPicker = useCallback(() => {
    if (dirInputRef.current) dirInputRef.current.click();
  }, []);

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        addFiles(e.target.files);
        e.target.value = '';
      }
    },
    [addFiles]
  );

  const navigateTo = useCallback((path: string) => {
    setCurrentPath(path);
    setSelectedIds(new Set());
  }, []);

  const dirItems = allItems.filter((item) => {
    const parent = item.path.substring(0, item.path.lastIndexOf('/')) || '/';
    return parent === currentPath;
  });

  const filtered = dirItems.filter(
    (i) => !search || i.name.toLowerCase().includes(search.toLowerCase())
  );
  const sorted = sortItems(filtered, sortField, sortDir);
  const tree = buildTree(allItems);

  const toggleSelect = useCallback(
    (id: string, multi: boolean, range: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (range && lastSelected.current) {
          const ids = sorted.map((i) => i.id);
          const a = ids.indexOf(lastSelected.current);
          const b = ids.indexOf(id);
          const [lo, hi] = a < b ? [a, b] : [b, a];
          ids.slice(lo, hi + 1).forEach((i) => next.add(i));
        } else if (multi) {
          if (next.has(id)) next.delete(id);
          else next.add(id);
        } else {
          if (next.has(id) && next.size === 1) next.clear();
          else { next.clear(); next.add(id); }
        }
        lastSelected.current = id;
        return next;
      });
    },
    [sorted]
  );

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(sorted.map((i) => i.id)));
  }, [sorted]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const clear = useCallback(() => {
    setAllItems([]);
    setCurrentPath('/');
    setSelectedIds(new Set());
  }, []);

  return {
    allItems,
    currentPath,
    items: sorted,
    tree,
    selectedIds,
    sortField,
    sortDir,
    search,
    isDragOver,
    navigateTo,
    setSearch,
    toggleSelect,
    selectAll,
    clearSelection,
    setSortField,
    setSortDir,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    openFilePicker,
    openDirPicker,
    clear,
    fileInputRef,
    dirInputRef,
    onFileInputChange,
  };
}
