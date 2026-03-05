import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';
import type { ProjectSummary } from '../store/adminStore';
import './DashboardPage.css';

function StatusBar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="status-bar-wrap">
      <div className="status-bar-track">
        <div
          className="status-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="status-bar-pct">{pct}%</span>
    </div>
  );
}

function ResourceBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="res-bar-track">
      <div className="res-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function KpiCard({
  label,
  value,
  unit,
  accent,
  sub,
}: {
  label: string;
  value: number | string;
  unit?: string;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="kpi-card" style={{ '--accent': accent } as React.CSSProperties}>
      <div className="kpi-card-accent" style={{ background: accent }} />
      <div className="kpi-card-label">{label}</div>
      <div className="kpi-card-value-row">
        <span className="kpi-card-value">{value}</span>
        {unit && <span className="kpi-card-unit">{unit}</span>}
      </div>
      {sub && <div className="kpi-card-sub">{sub}</div>}
    </div>
  );
}

function ProjectRow({ project, maxVms }: { project: ProjectSummary; maxVms: number }) {
  return (
    <div className="proj-table-row">
      <div className="proj-table-name">
        <span className="proj-table-dot" />
        <span>{project.name}</span>
        {project.description && (
          <span className="proj-table-desc">{project.description}</span>
        )}
      </div>
      <div className="proj-table-cell">
        <span className="proj-cell-val">{project.vmCount}</span>
        <ResourceBar value={project.vmCount} max={Math.max(maxVms, 1)} color="#3B82F6" />
      </div>
      <div className="proj-table-cell">
        <span className="proj-cell-val running">{project.runningCount}</span>
        <ResourceBar value={project.runningCount} max={Math.max(project.vmCount, 1)} color="#22C55E" />
      </div>
      <div className="proj-table-cell">
        <span className="proj-cell-val">{project.totalCpu}</span>
        <ResourceBar value={project.totalCpu} max={Math.max(...[8, project.totalCpu])} color="#F97316" />
      </div>
      <div className="proj-table-cell">
        <span className="proj-cell-val">{(project.totalRamMB / 1024).toFixed(1)}</span>
        <span className="proj-cell-unit"> GB</span>
      </div>
      <div className="proj-table-cidr">{project.cidr}</div>
    </div>
  );
}

export function DashboardPage() {
  const metrics = useAdminStore((s) => s.metrics);
  const loading = useAdminStore((s) => s.loading);
  const error = useAdminStore((s) => s.error);
  const loadAll = useAdminStore((s) => s.loadAll);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const maxVms = metrics
    ? Math.max(...metrics.projects.map((p) => p.vmCount), 1)
    : 1;

  return (
    <div className="dash-root">
      {/* Page header */}
      <div className="dash-page-header">
        <div>
          <h1 className="dash-title">Обзор платформы</h1>
          <p className="dash-subtitle">Агрегированная статистика по всем проектам и ресурсам</p>
        </div>
        <button
          className="dash-refresh-btn"
          onClick={() => loadAll()}
          disabled={loading}
        >
          {loading ? 'Загрузка…' : '↻ Обновить'}
        </button>
      </div>

      {error && (
        <div className="dash-error">
          <span>Ошибка: {error}</span>
          <button onClick={() => loadAll()}>Повторить</button>
        </div>
      )}

      {loading && !metrics && (
        <div className="dash-loading">
          <div className="dash-spinner" />
          <span>Загрузка данных платформы…</span>
        </div>
      )}

      {metrics && (
        <>
          {/* KPI Cards */}
          <section className="dash-kpi-grid">
            <KpiCard
              label="Всего проектов"
              value={metrics.totalProjects}
              accent="#FF0023"
              sub="активных сетей"
            />
            <KpiCard
              label="Всего инстансов"
              value={metrics.totalVMs}
              accent="#3B82F6"
              sub="виртуальных машин"
            />
            <KpiCard
              label="Активные ВМ"
              value={metrics.runningVMs}
              accent="#22C55E"
              sub={`${metrics.totalVMs > 0 ? Math.round((metrics.runningVMs / metrics.totalVMs) * 100) : 0}% от общего числа`}
            />
            <KpiCard
              label="Ядра CPU"
              value={metrics.totalCpuCores}
              unit="cores"
              accent="#F97316"
              sub="выделено всего"
            />
            <KpiCard
              label="Память RAM"
              value={metrics.totalRamGB}
              unit="GB"
              accent="#8B5CF6"
              sub="выделено всего"
            />
            <KpiCard
              label="Диск"
              value={metrics.totalDiskGB}
              unit="GB"
              accent="#06B6D4"
              sub={`~${metrics.totalVMs} × 20 GB`}
            />
          </section>

          {/* Middle section */}
          <section className="dash-mid-grid">
            {/* VM Status Distribution */}
            <div className="dash-card">
              <h2 className="dash-card-title">Статусы инстансов</h2>
              <div className="status-list">
                <div className="status-item">
                  <div className="status-item-header">
                    <span className="status-dot" style={{ background: '#22C55E' }} />
                    <span className="status-name">Running</span>
                    <span className="status-count">{metrics.runningVMs}</span>
                  </div>
                  <StatusBar value={metrics.runningVMs} total={metrics.totalVMs} color="#22C55E" />
                </div>
                <div className="status-item">
                  <div className="status-item-header">
                    <span className="status-dot" style={{ background: '#6B7280' }} />
                    <span className="status-name">Stopped</span>
                    <span className="status-count">{metrics.stoppedVMs}</span>
                  </div>
                  <StatusBar value={metrics.stoppedVMs} total={metrics.totalVMs} color="#6B7280" />
                </div>
                <div className="status-item">
                  <div className="status-item-header">
                    <span className="status-dot" style={{ background: '#F97316' }} />
                    <span className="status-name">Provisioning</span>
                    <span className="status-count">{metrics.provisioningVMs}</span>
                  </div>
                  <StatusBar value={metrics.provisioningVMs} total={metrics.totalVMs} color="#F97316" />
                </div>
              </div>

              {metrics.totalVMs === 0 && (
                <div className="dash-empty-small">Нет инстансов</div>
              )}

              <div className="status-legend">
                <div className="status-legend-item">
                  <span style={{ color: '#22C55E' }}>●</span> Доступность:&nbsp;
                  <strong>
                    {metrics.totalVMs > 0
                      ? `${Math.round((metrics.runningVMs / metrics.totalVMs) * 100)}%`
                      : '—'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Top Projects by VMs */}
            <div className="dash-card">
              <h2 className="dash-card-title">
                Топ проектов по ВМ
                <Link to="/projects" className="dash-card-link">Все →</Link>
              </h2>
              {metrics.projects.length === 0 ? (
                <div className="dash-empty-small">Проекты не найдены</div>
              ) : (
                <div className="top-projects-list">
                  {[...metrics.projects]
                    .sort((a, b) => b.vmCount - a.vmCount)
                    .slice(0, 6)
                    .map((p) => (
                      <div key={p.id} className="top-proj-item">
                        <div className="top-proj-name">{p.name}</div>
                        <div className="top-proj-bar-wrap">
                          <div className="top-proj-bar-track">
                            <div
                              className="top-proj-bar-fill"
                              style={{
                                width: `${maxVms > 0 ? (p.vmCount / maxVms) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="top-proj-count">{p.vmCount} ВМ</span>
                        </div>
                        <div className="top-proj-meta">
                          <span className="badge-running">{p.runningCount} running</span>
                          <span className="top-proj-cpu">{p.totalCpu} CPU</span>
                          <span className="top-proj-ram">{(p.totalRamMB / 1024).toFixed(0)} GB RAM</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </section>

          {/* Resource usage overview */}
          <section className="dash-card dash-resource-card">
            <h2 className="dash-card-title">
              Использование ресурсов по проектам
              <Link to="/instances" className="dash-card-link">Все инстансы →</Link>
            </h2>
            {metrics.projects.length === 0 ? (
              <div className="dash-empty-small">Нет данных</div>
            ) : (
              <>
                <div className="proj-table-header">
                  <div className="proj-th">Проект</div>
                  <div className="proj-th">ВМ</div>
                  <div className="proj-th">Running</div>
                  <div className="proj-th">CPU</div>
                  <div className="proj-th">RAM</div>
                  <div className="proj-th">Подсеть</div>
                </div>
                <div className="proj-table-body">
                  {[...metrics.projects]
                    .sort((a, b) => b.vmCount - a.vmCount)
                    .map((p) => (
                      <ProjectRow key={p.id} project={p} maxVms={maxVms} />
                    ))}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
