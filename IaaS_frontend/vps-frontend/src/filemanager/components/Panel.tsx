import { useRef, useState } from 'react';
import type { FileItem, LocalFileItem, PolicyDecision, RemoteItem, UploadTask, ViewMode } from '../types';
import { analyzeFiles } from '../policy';
import type { UseLocalFsReturn } from '../hooks/useLocalFs';
import type { UseRemoteFsReturn } from '../hooks/useRemoteFs';
import { DirectoryTree } from './DirectoryTree';
import { FileTable } from './FileTable';
import { PreviewPane } from './PreviewPane';
import { Toolbar } from './Toolbar';
import { UploadReviewModal } from './UploadReviewModal';

// ── Local Panel ───────────────────────────────────────────────────
interface LocalPanelProps {
  fs: UseLocalFsReturn;
  onDragStart: (files: LocalFileItem[]) => void;
}

export function LocalPanel({ fs, onDragStart }: LocalPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<LocalFileItem | null>(null);

  const breadcrumbs = fs.currentPath === '/'
    ? []
    : fs.currentPath.split('/').filter(Boolean);

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) { fs.navigateTo('/'); return; }
    const parts = fs.currentPath.split('/').filter(Boolean);
    fs.navigateTo('/' + parts.slice(0, index + 1).join('/'));
  };

  const handleRowClick = (item: LocalFileItem, e: React.MouseEvent) => {
    fs.toggleSelect(item.id, e.metaKey || e.ctrlKey, e.shiftKey);
    if (!item.isDirectory) setPreviewItem(item);
  };

  const handleRowDoubleClick = (item: LocalFileItem) => {
    if (item.isDirectory) {
      fs.navigateTo(item.path);
    }
  };

  const selectedItems = fs.items.filter((i) => fs.selectedIds.has(i.id));

  const handleDragStartRow = () => {
    if (selectedItems.length > 0) onDragStart(selectedItems);
  };

  const handleSort = (field: typeof fs.sortField) => {
    if (fs.sortField === field) {
      fs.setSortDir(fs.sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      fs.setSortField(field);
      fs.setSortDir('asc');
    }
  };

  return (
    <div
      className={`fm-panel fm-panel-local${fs.isDragOver ? ' fm-panel-dragover' : ''}`}
      onDragOver={fs.handleDragOver}
      onDragLeave={fs.handleDragLeave}
      onDrop={fs.handleDrop}
    >
      <div className="fm-panel-label">LOCAL</div>

      {/* Hidden file inputs */}
      <input
        ref={fs.fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={fs.onFileInputChange}
      />
      <input
        ref={fs.dirInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={fs.onFileInputChange}
        {...({ webkitdirectory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
      />

      <Toolbar
        mode="local"
        currentPath={fs.currentPath}
        selectedCount={fs.selectedIds.size}
        viewMode={viewMode}
        search={fs.search}
        canDelete={fs.selectedIds.size > 0}
        canRename={fs.selectedIds.size === 1}
        canDownload={false}
        onSelectFiles={fs.openFilePicker}
        onSelectFolder={fs.openDirPicker}
        onDelete={() => { /* local delete */ }}
        onRename={() => setRenamingId([...fs.selectedIds][0] ?? null)}
        onSetViewMode={setViewMode}
        onSearch={fs.setSearch}
        breadcrumbs={breadcrumbs}
        onBreadcrumbClick={handleBreadcrumbClick}
      />

      {fs.allItems.length === 0 ? (
        <div className="fm-panel-drop-zone">
          <div className="fm-drop-icon">⬆️</div>
          <div className="fm-drop-title">Перетащите файлы или папки сюда</div>
          <div className="fm-drop-sub">либо используйте кнопки выше</div>
          <div className="fm-drop-actions">
            <button type="button" className="fm-btn fm-btn-primary" onClick={fs.openFilePicker}>
              Выбрать файлы
            </button>
            <button type="button" className="fm-btn" onClick={fs.openDirPicker}>
              Выбрать папку
            </button>
          </div>
        </div>
      ) : (
        <div className="fm-panel-body" draggable={selectedItems.length > 0} onDragStart={handleDragStartRow}>
          <div className="fm-pane-tree">
            <div className="fm-pane-label">Дерево</div>
            <DirectoryTree
              tree={fs.tree}
              currentPath={fs.currentPath}
              onNavigate={fs.navigateTo}
            />
          </div>
          <div className="fm-pane-files">
            <div className="fm-pane-label">
              Файлы
              <span className="fm-pane-count">{fs.items.length}</span>
            </div>
            <FileTable
              items={fs.items}
              selectedIds={fs.selectedIds}
              viewMode={viewMode}
              sortField={fs.sortField}
              sortDir={fs.sortDir}
              renamingId={renamingId}
              onRowClick={handleRowClick}
              onRowDoubleClick={handleRowDoubleClick}
              onSort={handleSort}
              onRename={(item, newName) => {
                console.info('local rename', item.path, newName);
                setRenamingId(null);
              }}
              onRenameCancel={() => setRenamingId(null)}
              onContextCopyPath={() => {}}
              isDragOver={fs.isDragOver}
            />
          </div>
          <div className="fm-pane-preview">
            <div className="fm-pane-label">Просмотр</div>
            <PreviewPane
              item={previewItem as FileItem | null}
              content={previewItem?.rawFile ? '' : ''}
              loading={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Remote Panel ──────────────────────────────────────────────────
interface RemotePanelProps {
  fs: UseRemoteFsReturn;
  serverId: string;
  onUploadFiles: (files: LocalFileItem[], targetPath: string) => void;
  draggedFiles: LocalFileItem[] | null;
  onClearDrag: () => void;
}

export function RemotePanel({ fs, onUploadFiles, draggedFiles, onClearDrag }: RemotePanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [reviewDecisions, setReviewDecisions] = useState<PolicyDecision[] | null>(null);
  const pendingUploadRef = useRef<LocalFileItem[]>([]);

  const breadcrumbs = fs.currentPath === '/'
    ? []
    : fs.currentPath.split('/').filter(Boolean);

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) { fs.navigateTo('/'); return; }
    const parts = fs.currentPath.split('/').filter(Boolean);
    fs.navigateTo('/' + parts.slice(0, index + 1).join('/'));
  };

  const handleRowClick = (item: RemoteItem, e: React.MouseEvent) => {
    fs.toggleSelect(item.id, e.metaKey || e.ctrlKey, e.shiftKey);
    if (!item.isDirectory) fs.loadPreview(item.path);
  };

  const handleRowDoubleClick = (item: RemoteItem) => {
    if (item.isDirectory) fs.navigateTo(item.path);
    else fs.loadPreview(item.path);
  };

  const handleSort = (field: typeof fs.sortField) => {
    if (fs.sortField === field) fs.setSortDir(fs.sortDir === 'asc' ? 'desc' : 'asc');
    else { fs.setSortField(field); fs.setSortDir('asc'); }
  };

  const selectedItems = fs.items.filter((i) => fs.selectedIds.has(i.id));

  const handleDelete = async () => {
    if (selectedItems.length === 0) return;
    if (!confirm(`Удалить ${selectedItems.length} элемент(ов)?`)) return;
    await fs.deleteItems(selectedItems.map((i) => i.path));
  };

  const handleNewFolder = async () => {
    const name = prompt('Имя папки:');
    if (name?.trim()) await fs.mkdir(name.trim());
  };

  const handleRenameConfirm = async (item: RemoteItem, newName: string) => {
    setRenamingId(null);
    if (!newName || newName === item.name) return;
    const dir = item.path.substring(0, item.path.lastIndexOf('/')) || '/';
    const newPath = dir === '/' ? `/${newName}` : `${dir}/${newName}`;
    await fs.rename(item.path, newPath);
  };

  const startReview = (files: LocalFileItem[]) => {
    const decisions = analyzeFiles(files);
    pendingUploadRef.current = files;
    setReviewDecisions(decisions);
  };

  const handlePanelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTarget(false);
    if (draggedFiles && draggedFiles.length > 0) {
      startReview(draggedFiles);
      onClearDrag();
    }
  };

  const handleUploadClick = () => {
    // Trigger from local panel selection via prop drill — here just a placeholder
    if (draggedFiles && draggedFiles.length > 0) {
      startReview(draggedFiles);
      onClearDrag();
    }
  };

  const handleConfirmUpload = (filtered: PolicyDecision[]) => {
    setReviewDecisions(null);
    const files = filtered.map((d) => d.file);
    onUploadFiles(files, fs.currentPath);
  };

  const previewItem = fs.items.find((i) => i.path === fs.previewPath) ?? null;

  return (
    <>
      <div
        className={`fm-panel fm-panel-remote${isDropTarget ? ' fm-panel-dragover' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDropTarget(true); }}
        onDragLeave={() => setIsDropTarget(false)}
        onDrop={handlePanelDrop}
      >
        <div className="fm-panel-label">REMOTE</div>

        <Toolbar
          mode="remote"
          currentPath={fs.currentPath}
          selectedCount={fs.selectedIds.size}
          viewMode={viewMode}
          search={fs.search}
          canDelete={selectedItems.length > 0}
          canRename={selectedItems.length === 1}
          canDownload={selectedItems.length === 1 && !selectedItems[0]?.isDirectory}
          onUpload={handleUploadClick}
          onNewFolder={handleNewFolder}
          onNewFile={() => {}}
          onDelete={handleDelete}
          onRename={() => setRenamingId(selectedItems[0]?.id ?? null)}
          onDownload={() => selectedItems[0] && fs.download(selectedItems[0].path)}
          onRefresh={fs.refresh}
          onSetViewMode={setViewMode}
          onSearch={fs.setSearch}
          breadcrumbs={breadcrumbs}
          onBreadcrumbClick={handleBreadcrumbClick}
        />

        {fs.status === 'loading' && (
          <div className="fm-loading">
            <div className="fm-skeleton fm-skeleton-row" />
            <div className="fm-skeleton fm-skeleton-row" />
            <div className="fm-skeleton fm-skeleton-row" />
            <div className="fm-skeleton fm-skeleton-row fm-skeleton-short" />
          </div>
        )}

        {fs.status === 'error' && (
          <div className="fm-error-state">
            <div className="fm-error-icon">⚠️</div>
            <div className="fm-error-title">Ошибка подключения</div>
            <div className="fm-error-msg">{fs.errorMsg}</div>
            <button type="button" className="fm-btn fm-btn-primary" onClick={fs.refresh}>
              Повторить
            </button>
          </div>
        )}

        {fs.status === 'idle' && (
          <div className="fm-panel-body">
            <div className="fm-pane-tree">
              <div className="fm-pane-label">Дерево</div>
              <DirectoryTree
                tree={fs.tree}
                currentPath={fs.currentPath}
                onNavigate={fs.navigateTo}
              />
            </div>

            <div className="fm-pane-files">
              <div className="fm-pane-label">
                Файлы
                <span className="fm-pane-count">{fs.items.length}</span>
              </div>
              <FileTable
                items={fs.items}
                selectedIds={fs.selectedIds}
                viewMode={viewMode}
                sortField={fs.sortField}
                sortDir={fs.sortDir}
                renamingId={renamingId}
                onRowClick={handleRowClick}
                onRowDoubleClick={handleRowDoubleClick}
                onSort={handleSort}
                onRename={handleRenameConfirm}
                onRenameCancel={() => setRenamingId(null)}
                onContextRename={(item) => setRenamingId(item.id)}
                onContextDelete={(item) => fs.deleteItems([item.path])}
                onContextDownload={(item) => fs.download(item.path)}
                onContextCopyPath={(item) => navigator.clipboard.writeText(item.path).catch(() => {})}
                onDropFiles={handlePanelDrop}
                isDragOver={isDropTarget}
              />
            </div>

            <div className="fm-pane-preview">
              <div className="fm-pane-label">Просмотр</div>
              <PreviewPane
                item={previewItem as FileItem | null}
                content={fs.previewContent}
                loading={fs.previewLoading}
              />
            </div>
          </div>
        )}
      </div>

      {reviewDecisions && (
        <UploadReviewModal
          decisions={reviewDecisions}
          targetPath={fs.currentPath}
          onConfirm={handleConfirmUpload}
          onCancel={() => setReviewDecisions(null)}
          onChange={setReviewDecisions}
        />
      )}
    </>
  );
}

// ── Shared upload trigger ─────────────────────────────────────────
export function useUploadTrigger() {
  const [draggedFiles, setDraggedFiles] = useState<LocalFileItem[] | null>(null);
  return {
    draggedFiles,
    setDraggedFiles,
    clearDrag: () => setDraggedFiles(null),
  };
}

// ── Type re-exports ───────────────────────────────────────────────
export type { FileItem, LocalFileItem, RemoteItem, UploadTask };
