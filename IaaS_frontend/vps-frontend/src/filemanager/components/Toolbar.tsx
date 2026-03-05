import type { ViewMode } from '../types';

interface ToolbarProps {
  mode: 'local' | 'remote';
  currentPath: string;
  selectedCount: number;
  viewMode: ViewMode;
  search: string;
  canDelete: boolean;
  canRename: boolean;
  canDownload: boolean;
  onUpload?: () => void;
  onNewFolder?: () => void;
  onNewFile?: () => void;
  onDelete?: () => void;
  onRename?: () => void;
  onDownload?: () => void;
  onRefresh?: () => void;
  onTerminal?: () => void;
  onSelectFiles?: () => void;
  onSelectFolder?: () => void;
  onSetViewMode: (mode: ViewMode) => void;
  onSearch: (s: string) => void;
  breadcrumbs: string[];
  onBreadcrumbClick: (index: number) => void;
}

export function Toolbar({
  mode,
  currentPath,
  selectedCount,
  viewMode,
  search,
  canDelete,
  canRename,
  canDownload,
  onUpload,
  onNewFolder,
  onNewFile,
  onDelete,
  onRename,
  onDownload,
  onRefresh,
  onTerminal,
  onSelectFiles,
  onSelectFolder,
  onSetViewMode,
  onSearch,
  breadcrumbs,
  onBreadcrumbClick,
}: ToolbarProps) {
  return (
    <div className="fm-toolbar">
      <div className="fm-toolbar-top">
        <div className="fm-breadcrumb">
          <button
            type="button"
            className={`fm-breadcrumb-btn${currentPath === '/' ? ' fm-breadcrumb-btn-active' : ''}`}
            onClick={() => onBreadcrumbClick(-1)}
          >
            /
          </button>
          {breadcrumbs.map((seg, i) => (
            <span key={seg + i} className="fm-breadcrumb-segment">
              <span className="fm-breadcrumb-sep">/</span>
              <button
                type="button"
                className={`fm-breadcrumb-btn${i === breadcrumbs.length - 1 ? ' fm-breadcrumb-btn-active' : ''}`}
                onClick={() => onBreadcrumbClick(i)}
              >
                {seg}
              </button>
            </span>
          ))}
        </div>

        <div className="fm-toolbar-actions">
          {mode === 'local' ? (
            <>
              <button type="button" className="fm-btn fm-btn-primary" onClick={onSelectFiles}>
                + Файлы
              </button>
              <button type="button" className="fm-btn" onClick={onSelectFolder}>
                + Папка
              </button>
            </>
          ) : (
            <>
              <button type="button" className="fm-btn fm-btn-primary" onClick={onUpload} disabled={!onUpload}>
                Upload
              </button>
              <button type="button" className="fm-btn" onClick={onNewFolder} disabled={!onNewFolder}>
                New Folder
              </button>
              <button type="button" className="fm-btn" onClick={onNewFile} disabled={!onNewFile}>
                New File
              </button>
            </>
          )}
          <button type="button" className="fm-btn fm-btn-ghost" onClick={onDelete} disabled={!canDelete}>
            Delete {selectedCount > 1 ? `(${selectedCount})` : ''}
          </button>
          <button type="button" className="fm-btn fm-btn-ghost" onClick={onRename} disabled={!canRename}>
            Rename
          </button>
          {mode === 'remote' && (
            <button type="button" className="fm-btn fm-btn-ghost" onClick={onDownload} disabled={!canDownload}>
              Download
            </button>
          )}
          {mode === 'remote' && (
            <button type="button" className="fm-btn fm-btn-ghost" onClick={onRefresh}>
              ↻
            </button>
          )}
        </div>
      </div>

      <div className="fm-toolbar-bottom">
        <div className="fm-search-wrap">
          <input
            className="fm-search-input"
            placeholder="Поиск файлов…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <div className="fm-view-toggle">
          <button
            type="button"
            className={`fm-view-btn${viewMode === 'list' ? ' fm-view-btn-active' : ''}`}
            onClick={() => onSetViewMode('list')}
            title="Список"
          >
            ☰
          </button>
          <button
            type="button"
            className={`fm-view-btn${viewMode === 'grid' ? ' fm-view-btn-active' : ''}`}
            onClick={() => onSetViewMode('grid')}
            title="Сетка"
          >
            ⊞
          </button>
        </div>
        {mode === 'remote' && (
          <button type="button" className="fm-btn fm-btn-outline" onClick={onTerminal}>
            Terminal
          </button>
        )}
      </div>
    </div>
  );
}
