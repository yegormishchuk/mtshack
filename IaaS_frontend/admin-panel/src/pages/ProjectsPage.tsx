import { useEffect, useState } from 'react';
import { useAdminStore } from '../store/adminStore';
import type { ProjectSummary } from '../store/adminStore';
import './ProjectsPage.css';

function ProjectActions({ project }: { project: ProjectSummary }) {
  const stopProject = useAdminStore((s) => s.stopProject);
  const deleteProject = useAdminStore((s) => s.deleteProject);
  const [deleting, setDeleting] = useState(false);

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopProject(project.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Удалить проект «${project.name}» и все его инстансы (${project.vmCount} шт.)? Это необратимо.`)) return;
    setDeleting(true);
    await deleteProject(project.id);
    setDeleting(false);
  };

  return (
    <div className="proj-actions">
      <button className="proj-action-btn proj-action-stop" onClick={handleStop} title="Остановить проект">
        ■ Стоп
      </button>
      <button
        className="proj-action-btn proj-action-delete"
        onClick={(e) => { void handleDelete(e); }}
        disabled={deleting}
        title="Удалить проект"
      >
        {deleting ? '...' : '✕ Удалить'}
      </button>
    </div>
  );
}

type SortKey = 'name' | 'vmCount' | 'runningCount' | 'totalCpu' | 'totalRamMB';

function VmBar({ running, stopped, provisioning }: { running: number; stopped: number; provisioning: number }) {
  const total = running + stopped + provisioning;
  if (total === 0) return <div className="vm-bar-empty">—</div>;
  return (
    <div className="vm-bar-track" title={`${running} running, ${stopped} stopped, ${provisioning} provisioning`}>
      {running > 0 && (
        <div
          className="vm-bar-seg"
          style={{ width: `${(running / total) * 100}%`, background: '#22C55E' }}
        />
      )}
      {provisioning > 0 && (
        <div
          className="vm-bar-seg"
          style={{ width: `${(provisioning / total) * 100}%`, background: '#F97316' }}
        />
      )}
      {stopped > 0 && (
        <div
          className="vm-bar-seg"
          style={{ width: `${(stopped / total) * 100}%`, background: '#E5E7EB' }}
        />
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectSummary }) {
  const healthPct =
    project.vmCount > 0
      ? Math.round((project.runningCount / project.vmCount) * 100)
      : 0;

  const healthColor =
    healthPct === 100 ? '#22C55E' : healthPct >= 50 ? '#F97316' : '#EF4444';

  return (
    <div className="proj-card">
      <div className="proj-card-top">
        <div className="proj-card-name-row">
          <div className="proj-card-icon">
            {project.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="proj-card-name">{project.name}</div>
            {project.description && (
              <div className="proj-card-desc">{project.description}</div>
            )}
          </div>
        </div>
        <div
          className="proj-health-badge"
          style={{ color: healthColor, borderColor: healthColor, background: healthColor + '18' }}
        >
          {healthPct}% up
        </div>
      </div>

      <div className="proj-card-stats">
        <div className="proj-stat">
          <span className="proj-stat-val">{project.vmCount}</span>
          <span className="proj-stat-label">ВМ</span>
        </div>
        <div className="proj-stat">
          <span className="proj-stat-val" style={{ color: '#22C55E' }}>{project.runningCount}</span>
          <span className="proj-stat-label">Running</span>
        </div>
        <div className="proj-stat">
          <span className="proj-stat-val">{project.totalCpu}</span>
          <span className="proj-stat-label">CPU</span>
        </div>
        <div className="proj-stat">
          <span className="proj-stat-val">{(project.totalRamMB / 1024).toFixed(1)}</span>
          <span className="proj-stat-label">GB RAM</span>
        </div>
      </div>

      <VmBar
        running={project.runningCount}
        stopped={project.stoppedCount}
        provisioning={project.vmCount - project.runningCount - project.stoppedCount}
      />

      <div className="proj-card-footer">
        <span className="proj-card-cidr">{project.cidr}</span>
        <div className="proj-status-pills">
          {project.runningCount > 0 && (
            <span className="pill-running">{project.runningCount} running</span>
          )}
          {project.stoppedCount > 0 && (
            <span className="pill-stopped">{project.stoppedCount} stopped</span>
          )}
        </div>
      </div>
      <ProjectActions project={project} />
    </div>
  );
}

export function ProjectsPage() {
  const metrics = useAdminStore((s) => s.metrics);
  const loading = useAdminStore((s) => s.loading);
  const loadAll = useAdminStore((s) => s.loadAll);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('vmCount');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    if (!metrics) loadAll();
  }, [metrics, loadAll]);

  const projects = metrics?.projects ?? [];

  const filtered = projects
    .filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      return b[sortKey] - a[sortKey];
    });

  return (
    <div className="projects-root">
      <div className="page-header">
        <div>
          <h1 className="page-title">Проекты</h1>
          <p className="page-subtitle">
            {projects.length} проектов · {projects.reduce((s, p) => s + p.vmCount, 0)} инстансов
          </p>
        </div>
        <button className="refresh-btn" onClick={() => loadAll()} disabled={loading}>
          {loading ? 'Загрузка…' : '↻ Обновить'}
        </button>
      </div>

      <div className="projects-toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Поиск проектов…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="toolbar-right">
          <select
            className="sort-select"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            <option value="vmCount">По кол-ву ВМ</option>
            <option value="runningCount">По активным</option>
            <option value="totalCpu">По CPU</option>
            <option value="totalRamMB">По RAM</option>
            <option value="name">По имени</option>
          </select>
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Сетка"
            >
              ⊞
            </button>
            <button
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Таблица"
            >
              ≡
            </button>
          </div>
        </div>
      </div>

      {loading && !metrics && (
        <div className="page-loading">
          <div className="page-spinner" />
          <span>Загрузка…</span>
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="page-empty">
          {search ? `Проекты по запросу «${search}» не найдены` : 'Проекты отсутствуют'}
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="projects-grid">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <div className="projects-table-wrap">
          <div className="ptable-header">
            <div className="ptable-th">Проект</div>
            <div className="ptable-th">ВМ</div>
            <div className="ptable-th">Running</div>
            <div className="ptable-th">Stopped</div>
            <div className="ptable-th">CPU</div>
            <div className="ptable-th">RAM (GB)</div>
            <div className="ptable-th">Подсеть</div>
            <div className="ptable-th">Доступность</div>
            <div className="ptable-th">Действия</div>
          </div>
          {filtered.map((p) => {
            const healthPct =
              p.vmCount > 0 ? Math.round((p.runningCount / p.vmCount) * 100) : 0;
            const healthColor =
              healthPct === 100 ? '#22C55E' : healthPct >= 50 ? '#F97316' : '#EF4444';
            return (
              <div key={p.id} className="ptable-row">
                <div className="ptable-name">
                  <div className="ptable-icon">{p.name.slice(0, 1).toUpperCase()}</div>
                  <div>
                    <div className="ptable-name-text">{p.name}</div>
                    {p.description && (
                      <div className="ptable-desc">{p.description}</div>
                    )}
                  </div>
                </div>
                <div className="ptable-cell ptable-bold">{p.vmCount}</div>
                <div className="ptable-cell" style={{ color: '#16a34a', fontWeight: 700 }}>{p.runningCount}</div>
                <div className="ptable-cell" style={{ color: '#6B7280' }}>{p.stoppedCount}</div>
                <div className="ptable-cell ptable-bold">{p.totalCpu}</div>
                <div className="ptable-cell ptable-bold">{(p.totalRamMB / 1024).toFixed(1)}</div>
                <div className="ptable-cell ptable-mono">{p.cidr}</div>
                <div className="ptable-cell">
                  <span style={{ color: healthColor, fontWeight: 700 }}>{healthPct}%</span>
                </div>
                <div className="ptable-cell">
                  <ProjectActions project={p} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
