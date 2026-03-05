import { useRef, useState } from 'react';
import type { FileItem, SortDir, SortField, ViewMode } from '../types';

function formatSize(bytes: number): string {
  if (bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const KIND_ICONS: Record<string, string> = {
  folder: '📁',
  text: '📄',
  image: '🖼️',
  json: '{ }',
  log: '📋',
  env: '🔑',
  code: '⌨️',
  archive: '📦',
  binary: '⚙️',
};

interface ContextMenu {
  x: number;
  y: number;
  itemId: string;
}

interface FileTableProps<T extends FileItem> {
  items: T[];
  selectedIds: Set<string>;
  viewMode: ViewMode;
  sortField: SortField;
  sortDir: SortDir;
  renamingId?: string | null;
  onRowClick: (item: T, e: React.MouseEvent) => void;
  onRowDoubleClick: (item: T) => void;
  onSort: (field: SortField) => void;
  onRename?: (item: T, newName: string) => void;
  onRenameCancel?: () => void;
  onContextRename?: (item: T) => void;
  onContextDelete?: (item: T) => void;
  onContextDownload?: (item: T) => void;
  onContextCopyPath?: (item: T) => void;
  onDropFiles?: (e: React.DragEvent) => void;
  isDragOver?: boolean;
}

export function FileTable<T extends FileItem>({
  items,
  selectedIds,
  viewMode,
  sortField,
  sortDir,
  renamingId,
  onRowClick,
  onRowDoubleClick,
  onSort,
  onRename,
  onRenameCancel,
  onContextRename,
  onContextDelete,
  onContextDownload,
  onContextCopyPath,
  onDropFiles,
  isDragOver,
}: FileTableProps<T>) {
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const contextItem = contextMenu
    ? items.find((i) => i.id === contextMenu.itemId)
    : null;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="fm-sort-icon">↕</span>;
    return <span className="fm-sort-icon fm-sort-icon-active">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div
      className={`fm-files-body fm-files-body-${viewMode}${isDragOver ? ' fm-files-body-dragover' : ''}`}
      onDragOver={(e) => { e.preventDefault(); }}
      onDrop={onDropFiles}
      onClick={() => setContextMenu(null)}
      onKeyDown={(e) => e.key === 'Escape' && setContextMenu(null)}
    >
      {viewMode === 'list' && (
        <div className="fm-table-header">
          <button type="button" className="fm-th fm-th-name" onClick={() => onSort('name')}>
            Name <SortIcon field="name" />
          </button>
          <button type="button" className="fm-th fm-th-size" onClick={() => onSort('size')}>
            Size <SortIcon field="size" />
          </button>
          <button type="button" className="fm-th fm-th-modified" onClick={() => onSort('modified')}>
            Modified <SortIcon field="modified" />
          </button>
          <span className="fm-th fm-th-perms">Permissions</span>
          <span className="fm-th fm-th-owner">Owner</span>
        </div>
      )}

      {items.length === 0 && (
        <div className="fm-empty">
          <div className="fm-empty-icon">📂</div>
          <div className="fm-empty-title">Папка пуста</div>
          <div className="fm-empty-sub">Перетащите файлы сюда или нажмите Upload</div>
        </div>
      )}

      {viewMode === 'list'
        ? items.map((item) => (
            <FileRow
              key={item.id}
              item={item}
              isSelected={selectedIds.has(item.id)}
              isRenaming={renamingId === item.id}
              onClick={onRowClick}
              onDoubleClick={onRowDoubleClick}
              onRename={onRename}
              onRenameCancel={onRenameCancel}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, itemId: item.id });
              }}
            />
          ))
        : items.map((item) => (
            <GridCell
              key={item.id}
              item={item}
              isSelected={selectedIds.has(item.id)}
              onClick={onRowClick}
              onDoubleClick={onRowDoubleClick}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, itemId: item.id });
              }}
            />
          ))}

      {contextMenu && contextItem && (
        <div
          className="fm-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {onContextRename && (
            <button type="button" className="fm-ctx-item" onClick={() => { onContextRename(contextItem); setContextMenu(null); }}>
              Переименовать
            </button>
          )}
          {onContextDownload && !contextItem.isDirectory && (
            <button type="button" className="fm-ctx-item" onClick={() => { onContextDownload(contextItem); setContextMenu(null); }}>
              Скачать
            </button>
          )}
          {onContextCopyPath && (
            <button type="button" className="fm-ctx-item" onClick={() => { navigator.clipboard.writeText(contextItem.path).catch(() => {}); setContextMenu(null); }}>
              Копировать путь
            </button>
          )}
          {onContextDelete && (
            <button type="button" className="fm-ctx-item fm-ctx-item-danger" onClick={() => { onContextDelete(contextItem); setContextMenu(null); }}>
              Удалить
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface FileRowProps<T extends FileItem> {
  item: T;
  isSelected: boolean;
  isRenaming: boolean;
  onClick: (item: T, e: React.MouseEvent) => void;
  onDoubleClick: (item: T) => void;
  onRename?: (item: T, newName: string) => void;
  onRenameCancel?: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function FileRow<T extends FileItem>({
  item, isSelected, isRenaming, onClick, onDoubleClick, onRename, onRenameCancel, onContextMenu,
}: FileRowProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`fm-file-row${isSelected ? ' fm-file-row-selected' : ''}`}
      onClick={(e) => onClick(item, e)}
      onDoubleClick={() => onDoubleClick(item)}
      onContextMenu={onContextMenu}
      role="row"
      aria-selected={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onDoubleClick(item);
      }}
    >
      <div className="fm-file-name-cell">
        <span className="fm-file-icon">{KIND_ICONS[item.kind] ?? '📄'}</span>
        {isRenaming ? (
          <input
            ref={inputRef}
            className="fm-rename-input"
            defaultValue={item.name}
            autoFocus
            onBlur={(e) => onRename?.(item, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRename?.(item, (e.target as HTMLInputElement).value);
              if (e.key === 'Escape') onRenameCancel?.();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="fm-file-name">{item.name}</span>
        )}
      </div>
      <span className="fm-file-size">{formatSize(item.size)}</span>
      <span className="fm-file-modified">{formatDate(item.modified)}</span>
      <span className="fm-file-perms">{item.permissions ?? '—'}</span>
      <span className="fm-file-owner">{item.owner ?? '—'}</span>
    </div>
  );
}

interface GridCellProps<T extends FileItem> {
  item: T;
  isSelected: boolean;
  onClick: (item: T, e: React.MouseEvent) => void;
  onDoubleClick: (item: T) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function GridCell<T extends FileItem>({ item, isSelected, onClick, onDoubleClick, onContextMenu }: GridCellProps<T>) {
  return (
    <div
      className={`fm-grid-cell${isSelected ? ' fm-grid-cell-selected' : ''}`}
      onClick={(e) => onClick(item, e)}
      onDoubleClick={() => onDoubleClick(item)}
      onContextMenu={onContextMenu}
      role="gridcell"
      tabIndex={0}
    >
      <div className="fm-grid-icon">{KIND_ICONS[item.kind] ?? '📄'}</div>
      <div className="fm-grid-name">{item.name}</div>
      <div className="fm-grid-size">{formatSize(item.size)}</div>
    </div>
  );
}
