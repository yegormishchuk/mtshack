import { useMemo, useState } from 'react';
import type { PolicyDecision, PolicyDecisionType } from '../types';

function formatSize(bytes: number): string {
  if (bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type Tab = 'all' | 'allowed' | 'warnings' | 'denied';

const DECISION_ICON: Record<PolicyDecisionType, string> = {
  ALLOW: '✓',
  WARN: '⚠',
  DENY: '✕',
};

interface UploadReviewModalProps {
  decisions: PolicyDecision[];
  targetPath: string;
  onConfirm: (filtered: PolicyDecision[]) => void;
  onCancel: () => void;
  onChange: (decisions: PolicyDecision[]) => void;
}

export function UploadReviewModal({
  decisions,
  targetPath,
  onConfirm,
  onCancel,
  onChange,
}: UploadReviewModalProps) {
  const [tab, setTab] = useState<Tab>('all');

  const counts = useMemo(
    () => ({
      all: decisions.length,
      allowed: decisions.filter((d) => d.decision === 'ALLOW').length,
      warnings: decisions.filter((d) => d.decision === 'WARN').length,
      denied: decisions.filter((d) => d.decision === 'DENY').length,
    }),
    [decisions]
  );

  const visibleDecisions = useMemo(() => {
    if (tab === 'all') return decisions;
    if (tab === 'allowed') return decisions.filter((d) => d.decision === 'ALLOW');
    if (tab === 'warnings') return decisions.filter((d) => d.decision === 'WARN');
    return decisions.filter((d) => d.decision === 'DENY');
  }, [decisions, tab]);

  const totalUploadSize = decisions
    .filter((d) => !d.excluded)
    .reduce((sum, d) => sum + (d.file.rawFile?.size ?? d.file.size), 0);

  const uploadCount = decisions.filter((d) => !d.excluded).length;

  const toggleExclude = (index: number) => {
    const d = decisions[index];
    if (d.decision === 'DENY') return; // DENY cannot be overridden
    const next = decisions.map((dec, i) =>
      i === index ? { ...dec, excluded: !dec.excluded } : dec
    );
    onChange(next);
  };

  const excludeAllWarnings = () => {
    const next = decisions.map((d) =>
      d.decision === 'WARN' ? { ...d, excluded: true } : d
    );
    onChange(next);
  };

  const includeAllWarnings = () => {
    const next = decisions.map((d) =>
      d.decision === 'WARN' ? { ...d, excluded: false } : d
    );
    onChange(next);
  };

  const handleConfirm = () => {
    onConfirm(decisions.filter((d) => !d.excluded));
  };

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'all', label: 'Все', count: counts.all },
    { id: 'allowed', label: 'Разрешено', count: counts.allowed },
    { id: 'warnings', label: 'Предупреждения', count: counts.warnings },
    { id: 'denied', label: 'Запрещено', count: counts.denied },
  ];

  return (
    <div className="fm-modal-overlay" onClick={onCancel}>
      <div className="fm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fm-modal-header">
          <div className="fm-modal-title">Проверка загрузки</div>
          <div className="fm-modal-subtitle">
            Назначение: <code>{targetPath}</code>
          </div>
          <button type="button" className="fm-modal-close" onClick={onCancel}>✕</button>
        </div>

        <div className="fm-modal-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`fm-modal-tab${tab === t.id ? ' fm-modal-tab-active' : ''}${t.count === 0 ? ' fm-modal-tab-empty' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`fm-modal-tab-badge fm-modal-tab-badge-${t.id}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'warnings' && counts.warnings > 0 && (
          <div className="fm-modal-bulk-actions">
            <button type="button" className="fm-btn fm-btn-ghost fm-btn-sm" onClick={excludeAllWarnings}>
              Исключить все предупреждения
            </button>
            <button type="button" className="fm-btn fm-btn-ghost fm-btn-sm" onClick={includeAllWarnings}>
              Включить все
            </button>
          </div>
        )}

        <div className="fm-modal-list">
          {visibleDecisions.length === 0 && (
            <div className="fm-modal-empty">Нет файлов в этой категории</div>
          )}
          {visibleDecisions.map((d) => {
            const globalIdx = decisions.indexOf(d);
            return (
              <div
                key={d.file.id}
                className={`fm-modal-row fm-modal-row-${d.decision.toLowerCase()}${d.excluded ? ' fm-modal-row-excluded' : ''}`}
              >
                <span className={`fm-modal-decision-icon fm-modal-icon-${d.decision.toLowerCase()}`}>
                  {DECISION_ICON[d.decision]}
                </span>
                <div className="fm-modal-file-info">
                  <span className="fm-modal-file-name">{d.file.name}</span>
                  <span className="fm-modal-file-path">{d.file.path}</span>
                  <span className="fm-modal-file-reason">{d.reason}</span>
                </div>
                <div className="fm-modal-file-meta">
                  <span className="fm-modal-file-size">{formatSize(d.file.rawFile?.size ?? d.file.size)}</span>
                  {d.riskScore > 0 && (
                    <span className={`fm-modal-risk fm-modal-risk-${d.riskScore >= 70 ? 'high' : d.riskScore >= 40 ? 'med' : 'low'}`}>
                      risk {d.riskScore}
                    </span>
                  )}
                </div>
                {d.decision !== 'DENY' && (
                  <button
                    type="button"
                    className={`fm-modal-toggle${d.excluded ? ' fm-modal-toggle-excluded' : ''}`}
                    onClick={() => toggleExclude(globalIdx)}
                    title={d.excluded ? 'Включить файл' : 'Исключить файл'}
                  >
                    {d.excluded ? 'Включить' : 'Исключить'}
                  </button>
                )}
                {d.decision === 'DENY' && (
                  <span className="fm-modal-deny-lock">🔒</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="fm-modal-footer">
          <div className="fm-modal-summary">
            Будет загружено: <strong>{uploadCount}</strong> файлов • <strong>{formatSize(totalUploadSize)}</strong>
            {counts.denied > 0 && (
              <span className="fm-modal-summary-denied"> • {counts.denied} запрещено</span>
            )}
          </div>
          <div className="fm-modal-footer-actions">
            <button type="button" className="fm-btn fm-btn-ghost" onClick={onCancel}>
              Отмена
            </button>
            <button
              type="button"
              className="fm-btn fm-btn-primary"
              onClick={handleConfirm}
              disabled={uploadCount === 0}
            >
              Загрузить {uploadCount > 0 ? `(${uploadCount})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
