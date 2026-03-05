import { useCallback, useRef, useState } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, X, FolderOpen } from 'lucide-react';
import { useAssistantStore } from '../assistant/store';
import { eventBus, EVENTS } from '../assistant/eventBus';
import type { UploadedFile } from '../assistant/types';
import './FilesPage.css';

const DANGEROUS_PATTERNS = ['.env', '.pem', 'id_rsa', '.key', '.p12', '.pfx', 'credentials.json', '.secret'];
const JUNK_PATTERNS = ['node_modules', '.git', '.DS_Store', 'Thumbs.db', 'dist', '__pycache__', '.cache'];

function analyzeFile(name: string): { flagged: boolean; flagReason?: string } {
  const lower = name.toLowerCase();
  if (DANGEROUS_PATTERNS.some((p) => lower.includes(p))) {
    return { flagged: true, flagReason: 'Секреты / ключи' };
  }
  if (JUNK_PATTERNS.some((p) => lower.includes(p))) {
    return { flagged: true, flagReason: 'Лишние данные' };
  }
  return { flagged: false };
}

const MOCK_PROJECT_FILES: UploadedFile[] = [
  { name: 'package.json', size: 1240, ext: 'json', flagged: false, removed: false },
  { name: 'index.ts', size: 4820, ext: 'ts', flagged: false, removed: false },
  { name: 'server.ts', size: 8930, ext: 'ts', flagged: false, removed: false },
  { name: '.env', size: 342, ext: 'env', flagged: true, flagReason: 'Секреты / ключи', removed: false },
  { name: 'node_modules', size: 98000000, ext: 'dir', flagged: true, flagReason: 'Лишние данные', removed: false },
  { name: '.gitignore', size: 120, ext: 'gitignore', flagged: false, removed: false },
  { name: 'README.md', size: 2400, ext: 'md', flagged: false, removed: false },
  { name: '.DS_Store', size: 6148, ext: 'DS_Store', flagged: true, flagReason: 'Лишние данные', removed: false },
  { name: 'id_rsa.pub', size: 740, ext: 'pub', flagged: true, flagReason: 'Секреты / ключи', removed: false },
];

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} МБ`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} КБ`;
  return `${bytes} Б`;
}

export function FilesPage() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { appState, setUploadedFiles, removeFile, removeFlaggedFiles, sendEvent } = useAssistantStore();
  const files = appState.uploadedFiles;

  const processFiles = useCallback((rawFiles: File[]) => {
    const processed: UploadedFile[] = rawFiles.map((f) => {
      const ext = f.name.split('.').pop() ?? '';
      const analysis = analyzeFile(f.name);
      return { name: f.name, size: f.size, ext, ...analysis, removed: false };
    });
    setUploadedFiles(processed);
    setUploaded(true);
    eventBus.emit(EVENTS.FILES_UPLOADED, { files: processed });
    sendEvent('FILES_UPLOADED', undefined, 'Файлы загружены');
  }, [setUploadedFiles, sendEvent]);

  const loadMockFiles = () => {
    setUploadedFiles(MOCK_PROJECT_FILES);
    setUploaded(true);
    eventBus.emit(EVENTS.FILES_UPLOADED, { files: MOCK_PROJECT_FILES });
    sendEvent('FILES_UPLOADED', undefined, 'Файлы загружены (демо)');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const fileList = Array.from(e.dataTransfer.files);
    if (fileList.length > 0) processFiles(fileList);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files ?? []);
    if (fileList.length > 0) processFiles(fileList);
  };

  const handleRemoveFlagged = () => {
    removeFlaggedFiles();
    eventBus.emit(EVENTS.FILES_CLEANED);
    sendEvent('FILES_CLEAN', undefined, 'Лишние файлы удалены');
  };

  const visibleFiles = files.filter((f) => !f.removed);
  const flaggedFiles = visibleFiles.filter((f) => f.flagged);
  const cleanFiles = visibleFiles.filter((f) => !f.flagged);

  return (
    <div className="files-root">
      <div className="files-header">
        <h1 className="files-title">Файловый менеджер</h1>
        <p className="files-subtitle">Загрузи файлы проекта — Олег проверит что безопасно</p>
      </div>

      {/* Dropzone */}
      <div
        className={`files-dropzone${isDragOver ? ' files-dropzone-active' : ''}${uploaded ? ' files-dropzone-done' : ''}`}
        data-tour="files-dropzone"
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploaded && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
        {uploaded ? (
          <div className="files-dropzone-done-content">
            <CheckCircle size={28} className="files-dropzone-check" />
            <span>Файлы загружены</span>
          </div>
        ) : (
          <>
            <div className="files-dropzone-icon">
              <Upload size={28} />
            </div>
            <div className="files-dropzone-text">
              <strong>Перетащи файлы проекта сюда</strong>
              <span>или нажми для выбора</span>
            </div>
            <button
              type="button"
              className="files-mock-btn"
              onClick={(e) => { e.stopPropagation(); loadMockFiles(); }}
            >
              <FolderOpen size={14} />
              Загрузить демо-проект
            </button>
          </>
        )}
      </div>

      {/* File list */}
      {visibleFiles.length > 0 && (
        <div className="files-list-section" data-tour="files-list">
          {/* Flagged files warning */}
          {flaggedFiles.length > 0 && (
            <div className="files-warning-banner">
              <AlertTriangle size={16} className="files-warning-icon" />
              <div className="files-warning-text">
                <strong>Олег нашёл {flaggedFiles.length} проблемных файлов</strong>
                <span>Рекомендуется их не загружать на сервер</span>
              </div>
              <button type="button" className="files-remove-all-btn" onClick={handleRemoveFlagged}>
                Удалить все ({flaggedFiles.length})
              </button>
            </div>
          )}

          {flaggedFiles.length === 0 && (
            <div className="files-clean-banner">
              <CheckCircle size={16} />
              <span>Все файлы безопасны — можно загружать!</span>
            </div>
          )}

          {/* Flagged files */}
          {flaggedFiles.length > 0 && (
            <>
              <h3 className="files-section-label">⚠️ Проблемные файлы</h3>
              <div className="files-table">
                {flaggedFiles.map((f) => (
                  <FileRow key={f.name} file={f} onRemove={() => removeFile(f.name)} isFlagged />
                ))}
              </div>
            </>
          )}

          {/* Clean files */}
          {cleanFiles.length > 0 && (
            <>
              <h3 className="files-section-label">✓ Файлы проекта</h3>
              <div className="files-table">
                {cleanFiles.map((f) => (
                  <FileRow key={f.name} file={f} onRemove={() => removeFile(f.name)} isFlagged={false} />
                ))}
              </div>
            </>
          )}

          {/* Stats */}
          <div className="files-stats">
            <span>{visibleFiles.length} файлов</span>
            <span>•</span>
            <span>{formatSize(visibleFiles.reduce((s, f) => s + f.size, 0))}</span>
            {flaggedFiles.length > 0 && (
              <>
                <span>•</span>
                <span className="files-stats-warn">{flaggedFiles.length} требуют внимания</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface FileRowProps {
  file: UploadedFile;
  onRemove: () => void;
  isFlagged: boolean;
}

function FileRow({ file, onRemove, isFlagged }: FileRowProps) {
  return (
    <div className={`files-row${isFlagged ? ' files-row-flagged' : ''}`}>
      <div className="files-row-icon">
        {isFlagged ? (
          <AlertTriangle size={14} className="files-icon-warn" />
        ) : (
          <FileText size={14} className="files-icon-ok" />
        )}
      </div>
      <div className="files-row-name">
        <span className="files-name">{file.name}</span>
        {file.flagReason && (
          <span className="files-flag-reason">{file.flagReason}</span>
        )}
      </div>
      <span className="files-row-ext">.{file.ext}</span>
      <span className="files-row-size">{formatSize(file.size)}</span>
      <button
        type="button"
        className="files-remove-btn"
        onClick={onRemove}
        title="Удалить из списка"
      >
        <X size={12} />
      </button>
    </div>
  );
}
