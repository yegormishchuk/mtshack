import { useEffect, useState } from 'react';
import { useAdminStore } from '../store/adminStore';
import type { RawSnapshot } from '../store/adminStore';
import './SnapshotsPage.css';

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

interface SnapshotEntry extends RawSnapshot {
  instanceName: string;
  projectId: string;
}

export function SnapshotsPage() {
  const metrics = useAdminStore((s) => s.metrics);
  const rawInstances = useAdminStore((s) => s.rawInstances);
  const snapshotsByInstance = useAdminStore((s) => s.snapshotsByInstance);
  const snapshotsLoading = useAdminStore((s) => s.snapshotsLoading);
  const loading = useAdminStore((s) => s.loading);
  const loadAll = useAdminStore((s) => s.loadAll);
  const loadSnapshots = useAdminStore((s) => s.loadSnapshots);
  const [search, setSearch] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!metrics) loadAll();
  }, [metrics, loadAll]);

  const handleLoad = async () => {
    if (rawInstances.length === 0) {
      await loadAll();
    }
    await loadSnapshots();
    setLoaded(true);
  };

  const allSnapshots: SnapshotEntry[] = [];
  const instances = metrics?.instances ?? [];

  for (const [instanceName, snaps] of Object.entries(snapshotsByInstance)) {
    const inst = instances.find((i) => i.name === instanceName);
    for (const snap of snaps) {
      allSnapshots.push({
        ...snap,
        instanceName,
        projectId: inst?.projectId ?? '',
      });
    }
  }

  const projects = metrics?.projects ?? [];

  const filtered = allSnapshots.filter((s) => {
    if (!search) return true;
    return (
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.instanceName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalSnapshots = allSnapshots.length;
  const statefulCount = allSnapshots.filter((s) => s.stateful).length;

  // Group by instance for the count summary
  const instancesWithSnaps = Object.entries(snapshotsByInstance).filter(
    ([, snaps]) => snaps.length > 0
  ).length;

  return (
    <div className="snaps-root">
      <div className="page-header">
        <div>
          <h1 className="page-title">Снапшоты</h1>
          <p className="page-subtitle">
            {loaded
              ? `${totalSnapshots} снапшотов · ${instancesWithSnaps} инстансов с резервными копиями`
              : 'Загрузите снапшоты для просмотра'}
          </p>
        </div>
        <div className="snaps-header-actions">
          <button className="refresh-btn" onClick={() => loadAll()} disabled={loading}>
            {loading ? 'Загрузка…' : '↻ Обновить'}
          </button>
          <button
            className="load-snaps-btn"
            onClick={handleLoad}
            disabled={snapshotsLoading || loading}
          >
            {snapshotsLoading ? (
              <>
                <div className="btn-spinner" />
                Загрузка…
              </>
            ) : loaded ? (
              '↻ Перезагрузить снапшоты'
            ) : (
              '⬇ Загрузить снапшоты'
            )}
          </button>
        </div>
      </div>

      {/* Stats row */}
      {loaded && (
        <div className="snaps-stats-row">
          <div className="snaps-stat-card">
            <div className="snaps-stat-val">{totalSnapshots}</div>
            <div className="snaps-stat-label">Всего снапшотов</div>
          </div>
          <div className="snaps-stat-card">
            <div className="snaps-stat-val">{instancesWithSnaps}</div>
            <div className="snaps-stat-label">Инстансов охвачено</div>
          </div>
          <div className="snaps-stat-card">
            <div className="snaps-stat-val">{statefulCount}</div>
            <div className="snaps-stat-label">Stateful снапшотов</div>
          </div>
          <div className="snaps-stat-card">
            <div className="snaps-stat-val">
              {instances.length > 0
                ? `${Math.round((instancesWithSnaps / instances.length) * 100)}%`
                : '—'}
            </div>
            <div className="snaps-stat-label">Покрытие резервным копированием</div>
          </div>
        </div>
      )}

      {/* Instance coverage grid */}
      {loaded && instances.length > 0 && (
        <div className="snaps-coverage-card">
          <h2 className="snaps-card-title">Покрытие по инстансам</h2>
          <div className="snaps-coverage-grid">
            {instances.map((inst) => {
              const count = (snapshotsByInstance[inst.name] ?? []).length;
              const hasCoverage = count > 0;
              return (
                <div
                  key={inst.name}
                  className={`coverage-item ${hasCoverage ? 'covered' : 'uncovered'}`}
                  title={`${inst.name}: ${count} снапшотов`}
                >
                  <div className="coverage-icon">{hasCoverage ? '✓' : '!'}</div>
                  <div className="coverage-name">{inst.name}</div>
                  <div className="coverage-count">{count} снапш.</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loaded && !snapshotsLoading && (
        <div className="snaps-prompt">
          <div className="snaps-prompt-icon">📸</div>
          <div className="snaps-prompt-title">Снапшоты не загружены</div>
          <div className="snaps-prompt-sub">
            Нажмите «Загрузить снапшоты», чтобы получить данные по всем инстансам.
            <br />
            Это выполнит запрос для каждого инстанса в системе.
          </div>
          <button
            className="load-snaps-btn"
            onClick={handleLoad}
            disabled={snapshotsLoading || loading}
          >
            ⬇ Загрузить снапшоты
          </button>
        </div>
      )}

      {snapshotsLoading && (
        <div className="page-loading">
          <div className="page-spinner" />
          <span>Загрузка снапшотов для {rawInstances.length} инстансов…</span>
        </div>
      )}

      {loaded && !snapshotsLoading && (
        <>
          <div className="snaps-toolbar">
            <input
              className="search-input"
              type="text"
              placeholder="Поиск по имени снапшота или инстанса…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="snaps-count-label">
              Найдено: {filtered.length}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="page-empty">
              {search
                ? `Снапшоты по запросу «${search}» не найдены`
                : 'Снапшоты не созданы ни на одном инстансе'}
            </div>
          ) : (
            <div className="snaps-table-wrap">
              <div className="snaps-table-header">
                <div className="snaps-th">Снапшот</div>
                <div className="snaps-th">Инстанс</div>
                <div className="snaps-th">Проект</div>
                <div className="snaps-th">Тип</div>
                <div className="snaps-th">Создан</div>
              </div>
              <div className="snaps-table-body">
                {filtered.map((snap, idx) => {
                  const project = projects.find((p) => p.id === snap.projectId);
                  return (
                    <div key={`${snap.instanceName}-${snap.name}-${idx}`} className="snaps-row">
                      <div className="snaps-name-cell">
                        <div className="snaps-icon">📸</div>
                        <span className="snaps-name">{snap.name}</span>
                      </div>
                      <div className="snaps-inst-cell">
                        <code className="snaps-inst-name">{snap.instanceName}</code>
                      </div>
                      <div className="snaps-proj-cell">
                        {project ? (
                          <span className="snaps-proj-tag">{project.name}</span>
                        ) : snap.projectId ? (
                          <span className="snaps-proj-tag snaps-proj-orphan">{snap.projectId}</span>
                        ) : (
                          <span className="snaps-no-proj">—</span>
                        )}
                      </div>
                      <div className="snaps-type-cell">
                        <span className={`snaps-type-badge ${snap.stateful ? 'stateful' : 'stateless'}`}>
                          {snap.stateful ? 'Stateful' : 'Stateless'}
                        </span>
                      </div>
                      <div className="snaps-date-cell">
                        {formatDate(snap.created_at)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
