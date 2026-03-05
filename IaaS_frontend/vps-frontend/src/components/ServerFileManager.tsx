import { useMemo, useState } from 'react';
import './ServerFileManager.css';

type FileType =
  | 'folder'
  | 'image'
  | 'json'
  | 'log'
  | 'text'
  | 'code'
  | 'env'
  | 'archive'
  | 'other';

export interface FileEntry {
  id: string;
  name: string;
  type: FileType;
  size: string;
  modified: string;
  permissions: string;
  owner: string;
  isDirectory: boolean;
  path: string;
}

interface ServerFileManagerProps {
  serverName: string;
  basePath: string;
}

type ViewMode = 'list' | 'grid';

export function ServerFileManager({ serverName, basePath }: ServerFileManagerProps) {
  const [currentPath, setCurrentPath] = useState<string[]>(basePath.split('/').filter(Boolean));
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const allFiles: FileEntry[] = useMemo(
    () => [
      {
        id: '1',
        name: 'project',
        type: 'folder',
        size: '—',
        modified: '2026-03-01 12:20',
        permissions: 'drwxr-xr-x',
        owner: 'botuser',
        isDirectory: true,
        path: '/home/botuser/project'
      },
      {
        id: '2',
        name: 'logs',
        type: 'folder',
        size: '—',
        modified: '2026-03-03 09:10',
        permissions: 'drwxr-x---',
        owner: 'botuser',
        isDirectory: true,
        path: '/home/botuser/logs'
      },
      {
        id: '3',
        name: 'app.log',
        type: 'log',
        size: '1.2 MB',
        modified: '2026-03-04 08:42',
        permissions: '-rw-r--r--',
        owner: 'botuser',
        isDirectory: false,
        path: '/home/botuser/app.log'
      },
      {
        id: '4',
        name: 'config.json',
        type: 'json',
        size: '3.4 KB',
        modified: '2026-03-02 16:05',
        permissions: '-rw-r-----',
        owner: 'botuser',
        isDirectory: false,
        path: '/home/botuser/config.json'
      },
      {
        id: '5',
        name: '.env',
        type: 'env',
        size: '512 B',
        modified: '2026-02-28 11:00',
        permissions: '-rw-------',
        owner: 'botuser',
        isDirectory: false,
        path: '/home/botuser/.env'
      },
      {
        id: '6',
        name: 'docker-compose.yml',
        type: 'code',
        size: '2.1 KB',
        modified: '2026-03-01 18:30',
        permissions: '-rw-r--r--',
        owner: 'botuser',
        isDirectory: false,
        path: '/home/botuser/docker-compose.yml'
      }
    ],
    []
  );

  const currentPathString = '/' + currentPath.join('/');

  const treeRoots = useMemo(
    () => [
      {
        label: '/',
        path: '/',
        children: [
          {
            label: 'home',
            path: '/home',
            children: [
              {
                label: 'botuser',
                path: '/home/botuser',
                children: [
                  { label: 'project', path: '/home/botuser/project', children: [] },
                  { label: 'logs', path: '/home/botuser/logs', children: [] }
                ]
              }
            ]
          },
          { label: 'var', path: '/var', children: [] },
          { label: 'etc', path: '/etc', children: [] }
        ]
      }
    ],
    []
  );

  const filesInCurrentFolder = useMemo(
    () =>
      allFiles.filter((file) => {
        const parentPath = file.path.substring(0, file.path.lastIndexOf('/')) || '/';
        return parentPath === currentPathString;
      }),
    [allFiles, currentPathString]
  );

  const filteredFiles = useMemo(
    () =>
      filesInCurrentFolder.filter(
        (file) =>
          !search ||
          file.name.toLowerCase().includes(search.toLowerCase()) ||
          file.path.toLowerCase().includes(search.toLowerCase())
      ),
    [filesInCurrentFolder, search]
  );

  const selectedFiles = filteredFiles.filter((file) => selectedIds.has(file.id));

  const handleBreadcrumbClick = (index: number) => {
    const next = currentPath.slice(0, index + 1);
    setCurrentPath(next);
    setSelectedIds(new Set());
    setPreviewId(null);
  };

  const handleRootBreadcrumbClick = () => {
    setCurrentPath([]);
    setSelectedIds(new Set());
    setPreviewId(null);
  };

  const handleRowClick = (file: FileEntry) => {
    if (file.isDirectory) {
      setCurrentPath(file.path.split('/').filter(Boolean));
      setSelectedIds(new Set());
      setPreviewId(null);
      return;
    }
    setPreviewId(file.id);
  };

  const toggleSelect = (file: FileEntry, multi: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (!multi) {
        if (next.has(file.id) && next.size === 1) {
          next.clear();
        } else {
          next.clear();
          next.add(file.id);
        }
      } else {
        if (next.has(file.id)) next.delete(file.id);
        else next.add(file.id);
      }
      return next;
    });
  };

  const onInlineRename = (file: FileEntry, value: string) => {
    if (!value || value === file.name) {
      setRenamingId(null);
      return;
    }
    setRenamingId(null);
  };

  const previewFile = filteredFiles.find((file) => file.id === previewId) ?? null;

  return (
    <div className="sfm-root">
      <div className="sfm-toolbar">
        <div className="sfm-toolbar-main">
          <div className="sfm-breadcrumb">
            <button
              type="button"
              className={`sfm-breadcrumb-item${currentPath.length === 0 ? ' sfm-breadcrumb-item-active' : ''}`}
              onClick={handleRootBreadcrumbClick}
            >
              /
            </button>
            {currentPath.map((segment, index) => (
              <div key={segment + index} className="sfm-breadcrumb-segment">
                <span className="sfm-breadcrumb-separator">/</span>
                <button
                  type="button"
                  className={`sfm-breadcrumb-item${
                    index === currentPath.length - 1 ? ' sfm-breadcrumb-item-active' : ''
                  }`}
                  onClick={() => handleBreadcrumbClick(index)}
                >
                  {segment}
                </button>
              </div>
            ))}
          </div>
          <div className="sfm-toolbar-actions">
            <button type="button" className="sfm-btn sfm-btn-primary">
              Upload
            </button>
            <button type="button" className="sfm-btn">
              New Folder
            </button>
            <button type="button" className="sfm-btn">
              New File
            </button>
            <button type="button" className="sfm-btn sfm-btn-ghost">
              Delete
            </button>
            <button type="button" className="sfm-btn sfm-btn-ghost">
              Rename
            </button>
            <button type="button" className="sfm-btn sfm-btn-ghost">
              Download
            </button>
          </div>
        </div>
        <div className="sfm-toolbar-secondary">
          <div className="sfm-server-meta">
            <span className="sfm-server-pill">Server: {serverName}</span>
            <span className="sfm-server-pill">Path: {currentPathString || '/'}</span>
          </div>
          <div className="sfm-toolbar-right">
            <div className="sfm-search">
              <input
                className="sfm-search-input"
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="sfm-view-toggle">
              <button
                type="button"
                className={`sfm-view-toggle-btn${viewMode === 'list' ? ' sfm-view-toggle-btn-active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                List
              </button>
              <button
                type="button"
                className={`sfm-view-toggle-btn${viewMode === 'grid' ? ' sfm-view-toggle-btn-active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </button>
            </div>
            <button type="button" className="sfm-btn sfm-btn-outline">
              Open terminal
            </button>
          </div>
        </div>
      </div>

      <div className="sfm-layout">
        <div className="sfm-tree-pane">
          <div className="sfm-pane-title">Directories</div>
          <div className="sfm-tree-scroll">
            {treeRoots.map((root) => (
              <TreeNode
                key={root.path}
                node={root}
                currentPath={currentPathString}
                onSelect={(path) => {
                  const segments = path.split('/').filter(Boolean);
                  setCurrentPath(segments);
                  setSelectedIds(new Set());
                  setPreviewId(null);
                }}
              />
            ))}
          </div>
        </div>

        <div className="sfm-files-pane">
          <div className="sfm-files-header">
            <div className="sfm-files-header-left">
              <span className="sfm-files-title">Files</span>
              <span className="sfm-files-subtitle">
                {filteredFiles.length} item{filteredFiles.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="sfm-files-header-columns">
              <span className="sfm-col-name">Name</span>
              <span className="sfm-col-size">Size</span>
              <span className="sfm-col-modified">Last modified</span>
              <span className="sfm-col-perms">Permissions</span>
              <span className="sfm-col-owner">Owner</span>
            </div>
          </div>

          <div
            className={`sfm-files-body sfm-files-body-${viewMode}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
            }}
          >
            {filteredFiles.length === 0 ? (
              <div className="sfm-empty">
                <div className="sfm-empty-icon">📁</div>
                <div className="sfm-empty-title">This folder is empty</div>
                <div className="sfm-empty-text">
                  Upload files or create новую папку, чтобы начать работу.
                </div>
                <div className="sfm-empty-actions">
                  <button type="button" className="sfm-btn sfm-btn-primary">
                    Upload files
                  </button>
                  <button type="button" className="sfm-btn">
                    Create folder
                  </button>
                </div>
              </div>
            ) : (
              filteredFiles.map((file) => {
                const isSelected = selectedIds.has(file.id);
                const isRenaming = renamingId === file.id;
                return (
                  <div
                    key={file.id}
                    className={`sfm-file-row${isSelected ? ' sfm-file-row-selected' : ''}`}
                    onClick={(e) => {
                      const multi = e.metaKey || e.ctrlKey;
                      toggleSelect(file, multi);
                      handleRowClick(file);
                    }}
                  >
                    <div className="sfm-file-main">
                      <div className={`sfm-file-icon sfm-file-icon-${file.type}`} />
                      {isRenaming ? (
                        <input
                          className="sfm-file-rename-input"
                          autoFocus
                          defaultValue={file.name}
                          onBlur={(e) => onInlineRename(file, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onInlineRename(file, (e.target as HTMLInputElement).value);
                            }
                            if (e.key === 'Escape') {
                              setRenamingId(null);
                            }
                          }}
                        />
                      ) : (
                        <span className="sfm-file-name">{file.name}</span>
                      )}
                      <div className="sfm-file-hover-actions">
                        <button type="button" className="sfm-link">
                          download
                        </button>
                        <button
                          type="button"
                          className="sfm-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingId(file.id);
                          }}
                        >
                          rename
                        </button>
                        <button type="button" className="sfm-link sfm-link-danger">
                          delete
                        </button>
                        <button type="button" className="sfm-link">
                          copy path
                        </button>
                      </div>
                    </div>
                    <span className="sfm-col-size">{file.size}</span>
                    <span className="sfm-col-modified">{file.modified}</span>
                    <span className="sfm-col-perms">{file.permissions}</span>
                    <span className="sfm-col-owner">{file.owner}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="sfm-preview-pane">
          <div className="sfm-pane-title">Preview</div>
          {previewFile ? (
            <div className="sfm-preview-card">
              <div className="sfm-preview-header">
                <div className={`sfm-file-icon sfm-file-icon-${previewFile.type}`} />
                <div>
                  <div className="sfm-preview-name">{previewFile.name}</div>
                  <div className="sfm-preview-meta">
                    {previewFile.size} • {previewFile.modified}
                  </div>
                </div>
              </div>
              <div className="sfm-preview-body">
                {previewFile.type === 'image' ? (
                  <div className="sfm-preview-placeholder">Image preview</div>
                ) : previewFile.type === 'json' ? (
                  <pre className="sfm-preview-code">
                    {'{\n  "example": true,\n  "file": "' + previewFile.name + '"\n}'}
                  </pre>
                ) : previewFile.type === 'log' ? (
                  <pre className="sfm-preview-code">
                    [08:42] Service started
                    {'\n'}
                    [08:45] Incoming request
                    {'\n'}
                    [08:46] OK 200 /api/health
                  </pre>
                ) : (
                  <div className="sfm-preview-placeholder">
                    Preview for this file type will appear here.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="sfm-preview-empty">
              <div className="sfm-empty-title">No file selected</div>
              <div className="sfm-empty-text">
                Выберите файл, чтобы посмотреть содержимое или детали.
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sfm-bottom-bar">
        <div className="sfm-bottom-left">
          {selectedFiles.length > 0 ? (
            <>
              <span className="sfm-bottom-title">
                Selected: {selectedFiles.length} file{selectedFiles.length === 1 ? '' : 's'}
              </span>
              <div className="sfm-bottom-actions">
                <button type="button" className="sfm-link">
                  Download
                </button>
                <button type="button" className="sfm-link">
                  Move
                </button>
                <button type="button" className="sfm-link sfm-link-danger">
                  Delete
                </button>
                <button type="button" className="sfm-link">
                  Copy path
                </button>
              </div>
            </>
          ) : (
            <span className="sfm-bottom-title">No operations in progress</span>
          )}
        </div>
        <div className="sfm-bottom-ops">
          <div className="sfm-op-item">
            <div className="sfm-op-main">
              <span className="sfm-op-name">Uploading app.log</span>
              <span className="sfm-op-meta">42% • 1.2 MB / 3.0 MB • 2.1 MB/s</span>
            </div>
            <div className="sfm-op-progress">
              <div className="sfm-op-progress-bar">
                <div className="sfm-op-progress-fill" style={{ width: '42%' }} />
              </div>
              <button type="button" className="sfm-link sfm-link-muted">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TreeNodeData {
  label: string;
  path: string;
  children: TreeNodeData[];
}

interface TreeNodeProps {
  node: TreeNodeData;
  currentPath: string;
  onSelect: (path: string) => void;
}

function TreeNode({ node, currentPath, onSelect }: TreeNodeProps) {
  const [open, setOpen] = useState(node.path === '/' || currentPath.startsWith(node.path + '/'));
  const isActive = currentPath === node.path;

  const hasChildren = node.children.length > 0;

  return (
    <div className="sfm-tree-node">
      <button
        type="button"
        className={`sfm-tree-row${isActive ? ' sfm-tree-row-active' : ''}`}
        onClick={() => {
          onSelect(node.path);
          if (hasChildren) setOpen((prev) => !prev);
        }}
      >
        {hasChildren ? (
          <span className={`sfm-tree-chevron${open ? ' sfm-tree-chevron-open' : ''}`}>›</span>
        ) : (
          <span className="sfm-tree-chevron sfm-tree-chevron-placeholder">•</span>
        )}
        <span className="sfm-tree-folder-icon" />
        <span className="sfm-tree-label">{node.label}</span>
      </button>
      {open && hasChildren && (
        <div className="sfm-tree-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              currentPath={currentPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

