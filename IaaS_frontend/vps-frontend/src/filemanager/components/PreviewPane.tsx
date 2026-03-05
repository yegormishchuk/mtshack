import { useState } from 'react';
import type { FileItem } from '../types';

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'json', 'jsonc', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf',
  'sh', 'bash', 'py', 'ts', 'tsx', 'js', 'jsx', 'go', 'rs', 'sql', 'html', 'css',
  'xml', 'log', 'env', 'dockerfile', 'gitignore', 'editorconfig',
]);

function isTextFile(name: string): boolean {
  if (name.startsWith('.env')) return true;
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return TEXT_EXTENSIONS.has(ext);
}

function isImageFile(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico'].includes(ext);
}

function formatSize(bytes: number): string {
  if (bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface PreviewPaneProps {
  item: FileItem | null;
  content: string;
  loading: boolean;
  onLoadMore?: () => void;
}

export function PreviewPane({ item, content, loading, onLoadMore }: PreviewPaneProps) {
  const [showAll, setShowAll] = useState(false);

  if (!item) {
    return (
      <div className="fm-preview-empty">
        <div className="fm-preview-empty-icon">👁️</div>
        <div className="fm-preview-empty-title">Файл не выбран</div>
        <div className="fm-preview-empty-sub">Нажмите на файл для просмотра</div>
      </div>
    );
  }

  if (item.isDirectory) {
    return (
      <div className="fm-preview-dir">
        <div className="fm-preview-dir-icon">📁</div>
        <div className="fm-preview-dir-name">{item.name}</div>
        <div className="fm-preview-dir-path">{item.path}</div>
        <div className="fm-preview-meta-list">
          {item.permissions && <div className="fm-preview-meta-row"><span>Права</span><code>{item.permissions}</code></div>}
          {item.owner && <div className="fm-preview-meta-row"><span>Владелец</span><code>{item.owner}</code></div>}
        </div>
      </div>
    );
  }

  const DISPLAY_LINES = 80;

  return (
    <div className="fm-preview-card">
      <div className="fm-preview-header">
        <div className="fm-preview-title">{item.name}</div>
        <div className="fm-preview-info">
          <span>{formatSize(item.size)}</span>
          {item.permissions && <code>{item.permissions}</code>}
          {item.owner && <span>{item.owner}</span>}
        </div>
      </div>

      <div className="fm-preview-body">
        {loading && (
          <div className="fm-preview-loading">
            <div className="fm-spinner" />
            <span>Загрузка…</span>
          </div>
        )}

        {!loading && isImageFile(item.name) && (
          <div className="fm-preview-binary">
            <span>🖼️ Image preview unavailable in mock mode</span>
          </div>
        )}

        {!loading && !isImageFile(item.name) && !isTextFile(item.name) && content === '' && (
          <div className="fm-preview-binary">
            <span>⚙️ Binary file — preview not available</span>
            <div className="fm-preview-meta-list">
              <div className="fm-preview-meta-row"><span>Путь</span><code>{item.path}</code></div>
              <div className="fm-preview-meta-row"><span>Размер</span><span>{formatSize(item.size)}</span></div>
              {item.permissions && <div className="fm-preview-meta-row"><span>Права</span><code>{item.permissions}</code></div>}
            </div>
          </div>
        )}

        {!loading && content !== '' && (
          <>
            <pre className="fm-preview-code">
              {(() => {
                const lines = content.split('\n');
                const displayed = showAll ? lines : lines.slice(0, DISPLAY_LINES);
                return displayed.join('\n');
              })()}
            </pre>
            {content.split('\n').length > DISPLAY_LINES && !showAll && (
              <button
                type="button"
                className="fm-preview-load-more"
                onClick={() => { setShowAll(true); onLoadMore?.(); }}
              >
                Показать весь файл ({content.split('\n').length} строк)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
