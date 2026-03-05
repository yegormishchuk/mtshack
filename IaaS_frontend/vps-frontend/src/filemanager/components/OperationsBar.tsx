import type { UploadTask } from '../types';

function formatSpeed(bps: number): string {
  if (bps < 1024) return `${bps} B/s`;
  if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(0)} KB/s`;
  return `${(bps / 1024 / 1024).toFixed(1)} MB/s`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const STATUS_LABEL: Record<UploadTask['status'], string> = {
  pending: 'Ожидание',
  uploading: 'Загрузка',
  done: 'Готово',
  error: 'Ошибка',
  cancelled: 'Отменено',
};

interface OperationsBarProps {
  tasks: UploadTask[];
  onCancel: (id: string) => void;
  onClearCompleted: () => void;
}

export function OperationsBar({ tasks, onCancel, onClearCompleted }: OperationsBarProps) {
  const active = tasks.filter((t) => t.status === 'uploading' || t.status === 'pending');
  const completed = tasks.filter((t) => t.status === 'done' || t.status === 'error' || t.status === 'cancelled');

  if (tasks.length === 0) {
    return (
      <div className="fm-ops-bar fm-ops-bar-empty">
        <span className="fm-ops-idle">Нет активных операций</span>
      </div>
    );
  }

  return (
    <div className="fm-ops-bar">
      <div className="fm-ops-header">
        <span className="fm-ops-title">
          {active.length > 0 ? `Операции (${active.length} активных)` : 'Операции завершены'}
        </span>
        {completed.length > 0 && (
          <button type="button" className="fm-ops-clear" onClick={onClearCompleted}>
            Очистить
          </button>
        )}
      </div>
      <div className="fm-ops-list">
        {tasks.map((task) => {
          const pct = task.size > 0 ? Math.round((task.uploaded / task.size) * 100) : 0;
          return (
            <div key={task.id} className={`fm-op-row fm-op-row-${task.status}`}>
              <div className="fm-op-info">
                <span className="fm-op-name">{task.name}</span>
                <span className={`fm-op-badge fm-op-badge-${task.status}`}>
                  {STATUS_LABEL[task.status]}
                </span>
              </div>
              {task.status === 'uploading' && (
                <div className="fm-op-progress-row">
                  <div className="fm-op-bar">
                    <div className="fm-op-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="fm-op-meta">
                    {pct}% • {formatSize(task.uploaded)}/{formatSize(task.size)} • {formatSpeed(task.speed)}
                  </span>
                  <button
                    type="button"
                    className="fm-op-cancel"
                    onClick={() => onCancel(task.id)}
                  >
                    ✕
                  </button>
                </div>
              )}
              {task.status === 'error' && (
                <div className="fm-op-error">{task.error ?? 'Неизвестная ошибка'}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
