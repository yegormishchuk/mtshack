import { useEffect, useState } from 'react';
import { useAdminStore } from '../store/adminStore';
import type { InstanceSummary, VmStatus } from '../store/adminStore';
import './InstancesPage.css';

function InstanceActions({ inst }: { inst: InstanceSummary }) {
  const stopInstance = useAdminStore((s) => s.stopInstance);
  const deleteInstance = useAdminStore((s) => s.deleteInstance);
  const [stopping, setStopping] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleStop = async () => {
    setStopping(true);
    await stopInstance(inst.name);
    setStopping(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Удалить инстанс «${inst.name}»? Это действие необратимо.`)) return;
    setDeleting(true);
    await deleteInstance(inst.name);
    setDeleting(false);
  };

  return (
    <div className="inst-actions">
      <button
        className="inst-action-btn inst-action-stop"
        disabled={stopping || deleting || inst.status === 'stopped'}
        onClick={() => { void handleStop(); }}
        title="Остановить"
      >
        {stopping ? '...' : '■ Стоп'}
      </button>
      <button
        className="inst-action-btn inst-action-delete"
        disabled={stopping || deleting}
        onClick={() => { void handleDelete(); }}
        title="Удалить"
      >
        {deleting ? '...' : '✕ Удалить'}
      </button>
    </div>
  );
}

const STATUS_COLOR: Record<VmStatus, string> = {
  running: '#22C55E',
  stopped: '#6B7280',
  provisioning: '#F97316',
};

const STATUS_LABEL: Record<VmStatus, string> = {
  running: 'Running',
  stopped: 'Stopped',
  provisioning: 'Provisioning',
};

function StatusBadge({ status }: { status: VmStatus }) {
  return (
    <span
      className="inst-status-badge"
      style={{
        color: STATUS_COLOR[status],
        background: STATUS_COLOR[status] + '18',
        borderColor: STATUS_COLOR[status] + '40',
      }}
    >
      <span
        className="inst-status-dot"
        style={{ background: STATUS_COLOR[status] }}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

function CpuRamBar({ cpu, ram }: { cpu: number; ram: number }) {
  const maxCpu = 8;
  const maxRamGB = 8;
  const ramGB = ram / 1024;
  return (
    <div className="res-mini-bars">
      <div className="res-mini-row">
        <span className="res-mini-label">CPU</span>
        <div className="res-mini-track">
          <div
            className="res-mini-fill"
            style={{
              width: `${Math.min(100, (cpu / maxCpu) * 100)}%`,
              background: '#F97316',
            }}
          />
        </div>
        <span className="res-mini-val">{cpu}</span>
      </div>
      <div className="res-mini-row">
        <span className="res-mini-label">RAM</span>
        <div className="res-mini-track">
          <div
            className="res-mini-fill"
            style={{
              width: `${Math.min(100, (ramGB / maxRamGB) * 100)}%`,
              background: '#8B5CF6',
            }}
          />
        </div>
        <span className="res-mini-val">{ramGB.toFixed(1)}G</span>
      </div>
    </div>
  );
}

export function InstancesPage() {
  const metrics = useAdminStore((s) => s.metrics);
  const loading = useAdminStore((s) => s.loading);
  const loadAll = useAdminStore((s) => s.loadAll);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VmStatus | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  useEffect(() => {
    if (!metrics) loadAll();
  }, [metrics, loadAll]);

  const instances: InstanceSummary[] = metrics?.instances ?? [];
  const projects = metrics?.projects ?? [];

  const filtered = instances.filter((inst) => {
    if (search && !inst.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && inst.status !== statusFilter) return false;
    if (projectFilter !== 'all' && inst.projectId !== projectFilter) return false;
    return true;
  });

  const runningCount = instances.filter((i) => i.status === 'running').length;
  const stoppedCount = instances.filter((i) => i.status === 'stopped').length;
  const provCount = instances.filter((i) => i.status === 'provisioning').length;

  return (
    <div className="instances-root">
      <div className="page-header">
        <div>
          <h1 className="page-title">Инстансы</h1>
          <p className="page-subtitle">
            {instances.length} всего &nbsp;·&nbsp;
            <span style={{ color: '#22C55E' }}>{runningCount} running</span> &nbsp;·&nbsp;
            <span style={{ color: '#6B7280' }}>{stoppedCount} stopped</span>
            {provCount > 0 && (
              <> &nbsp;·&nbsp; <span style={{ color: '#F97316' }}>{provCount} provisioning</span></>
            )}
          </p>
        </div>
        <button className="refresh-btn" onClick={() => loadAll()} disabled={loading}>
          {loading ? 'Загрузка…' : '↻ Обновить'}
        </button>
      </div>

      {/* Filters */}
      <div className="inst-toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Поиск по имени…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="inst-filters">
          <div className="filter-chips">
            {(['all', 'running', 'stopped', 'provisioning'] as const).map((s) => (
              <button
                key={s}
                className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
                style={
                  statusFilter === s && s !== 'all'
                    ? {
                        background: STATUS_COLOR[s as VmStatus] + '20',
                        color: STATUS_COLOR[s as VmStatus],
                        borderColor: STATUS_COLOR[s as VmStatus] + '60',
                      }
                    : undefined
                }
              >
                {s === 'all' ? 'Все' : STATUS_LABEL[s as VmStatus]}
                <span className="chip-count">
                  {s === 'all'
                    ? instances.length
                    : instances.filter((i) => i.status === s).length}
                </span>
              </button>
            ))}
          </div>
          <select
            className="sort-select"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="all">Все проекты</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value="">Без проекта</option>
          </select>
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
          {search || statusFilter !== 'all' || projectFilter !== 'all'
            ? 'Инстансы по заданным фильтрам не найдены'
            : 'Инстансы отсутствуют'}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="inst-table-wrap">
          <div className="inst-table-header">
            <div className="inst-th">Имя</div>
            <div className="inst-th">Проект</div>
            <div className="inst-th">Статус</div>
            <div className="inst-th">IP адрес</div>
            <div className="inst-th">Ресурсы</div>
            <div className="inst-th">Диск</div>
            <div className="inst-th">Действия</div>
          </div>
          <div className="inst-table-body">
            {filtered.map((inst) => {
              const project = projects.find((p) => p.id === inst.projectId);
              return (
                <div key={inst.name} className="inst-row">
                  <div className="inst-name-cell">
                    <div className="inst-avatar" style={{ background: inst.status === 'running' ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.1)' }}>
                      <span style={{ color: STATUS_COLOR[inst.status] }}>⬡</span>
                    </div>
                    <div>
                      <div className="inst-name">{inst.name}</div>
                      <div className="inst-os">Ubuntu 22.04</div>
                    </div>
                  </div>
                  <div className="inst-project-cell">
                    {project ? (
                      <span className="inst-project-tag">{project.name}</span>
                    ) : inst.projectId ? (
                      <span className="inst-project-tag inst-project-orphan">{inst.projectId}</span>
                    ) : (
                      <span className="inst-no-project">—</span>
                    )}
                  </div>
                  <div className="inst-status-cell">
                    <StatusBadge status={inst.status} />
                  </div>
                  <div className="inst-ip-cell">
                    {inst.privateIp ? (
                      <code className="inst-ip">{inst.privateIp}</code>
                    ) : (
                      <span className="inst-no-ip">—</span>
                    )}
                  </div>
                  <div className="inst-res-cell">
                    <CpuRamBar cpu={inst.cpu} ram={inst.ramMB} />
                  </div>
                  <div className="inst-disk-cell">
                    <span className="inst-disk">20 GB</span>
                  </div>
                  <div className="inst-actions-cell">
                    <InstanceActions inst={inst} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary footer */}
      {filtered.length > 0 && (
        <div className="inst-summary">
          Показано {filtered.length} из {instances.length} инстансов
          {filtered.length > 0 && (
            <> · Итого: {filtered.reduce((s, i) => s + i.cpu, 0)} CPU ·{' '}
            {(filtered.reduce((s, i) => s + i.ramMB, 0) / 1024).toFixed(1)} GB RAM</>
          )}
        </div>
      )}
    </div>
  );
}
