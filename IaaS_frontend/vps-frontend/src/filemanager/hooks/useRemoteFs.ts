import { useCallback, useEffect, useRef, useState } from 'react';
import { mockApi } from '../api';
import type { RemoteItem, SortDir, SortField, TreeNode } from '../types';

function sortItems(items: RemoteItem[], field: SortField, dir: SortDir): RemoteItem[] {
  return [...items].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    let cmp = 0;
    if (field === 'name') cmp = a.name.localeCompare(b.name);
    else if (field === 'size') cmp = a.size - b.size;
    else cmp = a.modified.localeCompare(b.modified);
    return dir === 'asc' ? cmp : -cmp;
  });
}

const STATIC_TREE: TreeNode[] = [
  {
    label: '/',
    path: '/',
    isOpen: true,
    children: [
      {
        label: 'home',
        path: '/home',
        isOpen: false,
        children: [
          {
            label: 'ubuntu',
            path: '/home/ubuntu',
            isOpen: false,
            children: [
              { label: 'app', path: '/home/ubuntu/app', isOpen: false, children: [
                { label: 'src', path: '/home/ubuntu/app/src', isOpen: false, children: [] },
                { label: 'dist', path: '/home/ubuntu/app/dist', isOpen: false, children: [] },
              ]},
              { label: '.ssh', path: '/home/ubuntu/.ssh', isOpen: false, children: [] },
            ],
          },
        ],
      },
      {
        label: 'etc',
        path: '/etc',
        isOpen: false,
        children: [
          { label: 'nginx', path: '/etc/nginx', isOpen: false, children: [
            { label: 'sites-enabled', path: '/etc/nginx/sites-enabled', isOpen: false, children: [] },
          ]},
        ],
      },
      { label: 'var', path: '/var', isOpen: false, children: [
        { label: 'log', path: '/var/log', isOpen: false, children: [] },
      ]},
      { label: 'opt', path: '/opt', isOpen: false, children: [
        { label: 'backups', path: '/opt/backups', isOpen: false, children: [] },
      ]},
      { label: 'tmp', path: '/tmp', isOpen: false, children: [] },
    ],
  },
];

export type RemoteFsStatus = 'idle' | 'loading' | 'error';

export interface UseRemoteFsReturn {
  items: RemoteItem[];
  currentPath: string;
  tree: TreeNode[];
  status: RemoteFsStatus;
  errorMsg: string;
  selectedIds: Set<string>;
  sortField: SortField;
  sortDir: SortDir;
  search: string;
  previewContent: string;
  previewLoading: boolean;
  previewPath: string;
  navigateTo: (path: string) => void;
  refresh: () => void;
  mkdir: (name: string) => Promise<void>;
  rename: (oldPath: string, newPath: string) => Promise<void>;
  deleteItems: (paths: string[]) => Promise<void>;
  download: (path: string) => Promise<void>;
  loadPreview: (path: string) => void;
  setSearch: (s: string) => void;
  toggleSelect: (id: string, multi: boolean, range: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setSortField: (f: SortField) => void;
  setSortDir: (d: SortDir) => void;
}

export function useRemoteFs(serverId: string, initialPath = '/'): UseRemoteFsReturn {
  const [rawItems, setRawItems] = useState<RemoteItem[]>([]);
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [status, setStatus] = useState<RemoteFsStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [search, setSearch] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPath, setPreviewPath] = useState('');
  const lastSelected = useRef<string | null>(null);

  const loadDir = useCallback(
    async (path: string) => {
      setStatus('loading');
      setErrorMsg('');
      try {
        const data = await mockApi.listRemote(serverId, path);
        setRawItems(data);
        setStatus('idle');
      } catch (e) {
        setErrorMsg(String(e));
        setStatus('error');
      }
    },
    [serverId]
  );

  useEffect(() => {
    loadDir(currentPath);
  }, [loadDir, currentPath]);

  const filtered = rawItems.filter(
    (i) => !search || i.name.toLowerCase().includes(search.toLowerCase())
  );
  const sorted = sortItems(filtered, sortField, sortDir);

  const navigateTo = useCallback((path: string) => {
    setCurrentPath(path);
    setSelectedIds(new Set());
    setPreviewPath('');
    setPreviewContent('');
  }, []);

  const refresh = useCallback(() => loadDir(currentPath), [loadDir, currentPath]);

  const mkdir = useCallback(
    async (name: string) => {
      const path = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
      await mockApi.mkdirRemote(serverId, path);
      await loadDir(currentPath);
    },
    [serverId, currentPath, loadDir]
  );

  const rename = useCallback(
    async (oldPath: string, newPath: string) => {
      await mockApi.renameRemote(serverId, oldPath, newPath);
      await loadDir(currentPath);
    },
    [serverId, currentPath, loadDir]
  );

  const deleteItems = useCallback(
    async (paths: string[]) => {
      await mockApi.deleteRemote(serverId, paths);
      setSelectedIds(new Set());
      await loadDir(currentPath);
    },
    [serverId, currentPath, loadDir]
  );

  const download = useCallback(
    async (path: string) => {
      const blob = await mockApi.downloadRemote(serverId, path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = path.split('/').pop() ?? 'download';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    [serverId]
  );

  const loadPreview = useCallback(
    (path: string) => {
      setPreviewPath(path);
      setPreviewLoading(true);
      setPreviewContent('');
      mockApi
        .previewRemote(serverId, path, 0, 65536)
        .then((text) => {
          setPreviewContent(text);
          setPreviewLoading(false);
        })
        .catch(() => {
          setPreviewContent('');
          setPreviewLoading(false);
        });
    },
    [serverId]
  );

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

  return {
    items: sorted,
    currentPath,
    tree: STATIC_TREE,
    status,
    errorMsg,
    selectedIds,
    sortField,
    sortDir,
    search,
    previewContent,
    previewLoading,
    previewPath,
    navigateTo,
    refresh,
    mkdir,
    rename,
    deleteItems,
    download,
    loadPreview,
    setSearch,
    toggleSelect,
    selectAll,
    clearSelection,
    setSortField,
    setSortDir,
  };
}
