import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useProjectsStore, calcMonthlyCost } from '../store/projectsStore';
import { api } from '../services/api';
import type { VM } from '../domain/iaasTypes';
import './ServersPage.css';
import './projects/ProjectsPages.css';
import './Page.css';
import './BuildPage.css';
import { ServerFileManager } from '../components/ServerFileManager';
import { MetricChart } from '../components/MetricChart';
import deloreanImg from '../assets/delorean/delorean.png';

// ── Mock data generator ────────────────────────────────────────────────── //

function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function strSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h >>> 0;
}

interface MockData {
  liveMetrics: LiveMetrics;
  cpuHistory: [string, number][];
  ramHistory: [string, number][];
  diskHistory: [string, number][];
}

function generateMockData(
  vmId: string,
  limitCpu: number,
  limitRamGb: number,
  limitDiskGb: number,
): MockData {
  const rng = seededRng(strSeed(vmId));
  const noise = () => (rng() - 0.5) * 2;

  const POINTS = 30;
  const now = Date.now();

  const cpuBase  = 0.12 + rng() * 0.28; // 12–40 %
  const ramBase  = 0.28 + rng() * 0.38; // 28–66 %
  const diskBase = 0.18 + rng() * 0.55; // 18–73 %

  const cpuHistory:  [string, number][] = [];
  const ramHistory:  [string, number][] = [];
  const diskHistory: [string, number][] = [];

  let cpu = cpuBase;
  let ram = ramBase;

  for (let i = 0; i < POINTS; i++) {
    const ts = now - (POINTS - 1 - i) * 60_000;
    const d  = new Date(ts);
    const lbl = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    // CPU — random walk + mean-reversion + occasional spike
    cpu += noise() * 0.04;
    if (rng() < 0.12) cpu += 0.12 + rng() * 0.30;
    cpu = cpu * 0.80 + cpuBase * 0.20;
    cpu = Math.max(0.02, Math.min(0.95, cpu));
    cpuHistory.push([lbl, parseFloat((cpu * limitCpu).toFixed(3))]);

    // RAM — slow drift, more stable
    ram += noise() * 0.012;
    ram = ram * 0.94 + ramBase * 0.06;
    ram = Math.max(0.08, Math.min(0.97, ram));
    ramHistory.push([lbl, parseFloat((ram * limitRamGb).toFixed(3))]);

    // Disk — nearly flat, very slight growth
    const disk = diskBase + (i / POINTS) * 0.025 + noise() * 0.004;
    diskHistory.push([lbl, parseFloat((Math.min(1, Math.max(0, disk)) * limitDiskGb).toFixed(2))]);
  }

  const lastCpuPct  = (cpuHistory[cpuHistory.length - 1][1]  / limitCpu)    * 100;
  const lastRamPct  = (ramHistory[ramHistory.length - 1][1]   / limitRamGb)  * 100;
  const lastDiskPct = (diskHistory[diskHistory.length - 1][1] / limitDiskGb) * 100;

  return {
    liveMetrics: { cpuPct: lastCpuPct, ramPct: lastRamPct, diskPct: lastDiskPct, limitCpu, limitRamGb, limitDiskGb },
    cpuHistory,
    ramHistory,
    diskHistory,
  };
}

// ── Firewall port definitions ──────────────────────────────────────────── //

interface FirewallPortDef {
  port: number;
  label: string;
  protocol: string;
  source: string;
  description: string;
}

const FIREWALL_PORT_DEFS: FirewallPortDef[] = [
  { port: 22,    label: 'SSH',         protocol: 'TCP', source: '0.0.0.0/0', description: 'SSH доступ' },
  { port: 80,    label: 'HTTP',        protocol: 'TCP', source: '0.0.0.0/0', description: 'Веб-трафик' },
  { port: 443,   label: 'HTTPS',       protocol: 'TCP', source: '0.0.0.0/0', description: 'Защищённый веб-трафик' },
  { port: 3306,  label: 'MySQL',       protocol: 'TCP', source: '10.0.0.0/8', description: 'База данных MySQL' },
  { port: 5432,  label: 'PostgreSQL',  protocol: 'TCP', source: '10.0.0.0/8', description: 'База данных PostgreSQL' },
  { port: 6379,  label: 'Redis',       protocol: 'TCP', source: '10.0.0.0/8', description: 'Кэш Redis' },
  { port: 8000,  label: 'App (8000)',  protocol: 'TCP', source: '0.0.0.0/0', description: 'Приложение' },
  { port: 8080,  label: 'App (8080)',  protocol: 'TCP', source: '0.0.0.0/0', description: 'Приложение (альт.)' },
  { port: 51820, label: 'WireGuard',   protocol: 'UDP', source: '0.0.0.0/0', description: 'VPN WireGuard' },
];

interface LiveMetrics {
  cpuPct: number;
  ramPct: number;
  diskPct: number;
  limitCpu: number;    // vCPU  — from cores_allocated
  limitRamGb: number;  // GB    — from limit_mb / 1024
  limitDiskGb: number; // GB    — from total_gb
}

function parseRawMetrics(raw: Record<string, unknown>): LiveMetrics {
  const pick = (...keys: string[]): number => {
    for (const k of keys) if (raw[k] != null) return Number(raw[k]);
    return 0;
  };
  return {
    cpuPct:  pick('cpu_usage_percent',    'cpu_percent',    'cpu_pct'),
    ramPct:  pick('memory_usage_percent', 'ram_usage_percent', 'memory_percent', 'ram_percent', 'ram_pct'),
    diskPct: pick('disk_usage_percent',   'disk_percent',   'disk_pct'),
    // Real limits returned by the endpoint
    limitCpu:    parseFloat(String(raw['cores_allocated'] ?? '')) || 0,
    limitRamGb:  raw['limit_mb']  != null ? Number(raw['limit_mb'])  / 1024 : 0,
    limitDiskGb: raw['total_gb']  != null ? Number(raw['total_gb'])        : 0,
  };
}

type ServerDetailTab = 'dashboard' | 'resources' | 'backups' | 'firewall' | 'files';

const SERVER_TABS: { id: ServerDetailTab; label: string }[] = [
  { id: 'dashboard', label: 'Дашборд' },
  { id: 'resources', label: 'Ресурсы' },
  { id: 'backups', label: 'Бэкапы' },
  { id: 'firewall', label: 'Firewall' },
  { id: 'files', label: 'Файлы' }
];

type TravelPhase = 'idle' | 'shaking' | 'flying' | 'flash' | 'success' | 'error';

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

const TIMELINE_POINTS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map((m) => ({
  minutes: m,
  label: `${m}m`,
}));

const HOUR_POINTS = Array.from({ length: 23 }, (_, i) => i + 2); // 2h … 24h

function minutesToPct(minutes: number): number {
  const step = 100 / (TIMELINE_POINTS.length - 1);
  for (let i = 0; i < TIMELINE_POINTS.length - 1; i++) {
    if (minutes <= TIMELINE_POINTS[i + 1].minutes) {
      const t =
        (minutes - TIMELINE_POINTS[i].minutes) /
        (TIMELINE_POINTS[i + 1].minutes - TIMELINE_POINTS[i].minutes);
      return (i + t) * step;
    }
  }
  return 100;
}

export function ServerDetailPage() {
  const { vmId } = useParams<{ vmId: string }>();
  const navigate = useNavigate();

  const projects = useProjectsStore((state) => state.projects);
  const toggleVmPort = useProjectsStore((state) => state.toggleVmPort);

  const found = useMemo(() => {
    for (const project of projects) {
      const vm = project.resources.vms.find((candidate) => candidate.id === vmId);
      if (vm) {
        return { project, vm };
      }
    }
    return undefined;
  }, [projects, vmId]);

  const [selectedTab, setSelectedTab] = useState<ServerDetailTab>('dashboard');
  const [backupOffsetMinutes, setBackupOffsetMinutes] = useState(15);
  const [backupCreateSnapshot, setBackupCreateSnapshot] = useState(true);
  const [travelPhase, setTravelPhase] = useState<TravelPhase>('idle');

  // Live metrics from /resources/{name}/metrics
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
  const [cpuHistory, setCpuHistory] = useState<[string, number][]>([]);
  const [ramHistory, setRamHistory] = useState<[string, number][]>([]);
  const [diskHistory, setDiskHistory] = useState<[string, number][]>([]);

  // Populate charts with mock data immediately so graphs are never empty
  const mockSeeded = useRef(false);
  useEffect(() => {
    if (mockSeeded.current || !found) return;
    mockSeeded.current = true;
    const { vm } = found;
    const mock = generateMockData(
      vm.id,
      vm.cpu  || 1,
      vm.ram  || 1,
      vm.disk || 10,
    );
    setLiveMetrics(mock.liveMetrics);
    setCpuHistory(mock.cpuHistory);
    setRamHistory(mock.ramHistory);
    setDiskHistory(mock.diskHistory);
  }, [found]);

  useEffect(() => {
    if (!vmId) return;
    let cancelled = false;

    const fetchMetrics = async () => {
      try {
        const raw = await api.getMetrics(vmId) as Record<string, unknown>;
        if (cancelled) return;

        const m = parseRawMetrics(raw);
        setLiveMetrics(m);

        // Limits come exclusively from the endpoint (cores_allocated / limit_mb / total_gb)
        const limitCpu    = m.limitCpu;
        const limitRamGb  = m.limitRamGb;
        const limitDiskGb = m.limitDiskGb;

        const label   = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const cpuVal  = parseFloat(((m.cpuPct  / 100) * limitCpu).toFixed(3));
        const ramVal  = parseFloat(((m.ramPct  / 100) * limitRamGb).toFixed(3));
        const diskVal = parseFloat(((m.diskPct / 100) * limitDiskGb).toFixed(2));

        setCpuHistory( p => [...p.slice(-59), [label, cpuVal]]);
        setRamHistory( p => [...p.slice(-59), [label, ramVal]]);
        setDiskHistory(p => [...p.slice(-59), [label, diskVal]]);
      } catch { /* show stale data */ }
    };

    fetchMetrics();
    const timer = setInterval(fetchMetrics, 30_000);
    return () => { cancelled = true; clearInterval(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vmId]);

  if (!found) {
    return (
      <section className="page">
        <h1 className="page-title">Сервер не найден</h1>
        <p className="page-text">
          Возможно, он был удалён или ссылка некорректна.
        </p>
        <button
          type="button"
          className="project-card-open-btn"
          onClick={() => navigate('/servers')}
        >
          ← Все сервера
        </button>
      </section>
    );
  }

  const { project, vm } = found;

  const safeOffset  = Math.max(5, Math.min(24 * 60, backupOffsetMinutes));
  const nowDate     = new Date();
  const targetDate  = new Date(nowDate.getTime() - safeOffset * 60_000);
  const fmtTime     = (d: Date) =>
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const offsetMins  = safeOffset % 60;
  const offsetHrs   = Math.floor(safeOffset / 60);
  const humanOffset =
    offsetHrs > 0
      ? offsetMins > 0
        ? `${offsetHrs}h ${offsetMins}m`
        : `${offsetHrs}h`
      : `${offsetMins}m`;
  const carPct = minutesToPct(backupOffsetMinutes);
  const activePointIdx = TIMELINE_POINTS.reduce<number>((best, pt, idx) =>
    Math.abs(pt.minutes - backupOffsetMinutes) <
    Math.abs(TIMELINE_POINTS[best].minutes - backupOffsetMinutes)
      ? idx
      : best,
    0
  );
  const isBusy = travelPhase !== 'idle';

  const runSequence = () => {
    void (async () => {
      setTravelPhase('shaking');
      await delay(550);
      setTravelPhase('flying');
      await delay(1000);
      setTravelPhase('flash');
      await delay(220);
      setTravelPhase('success');
      await delay(3500);
      setTravelPhase((p) => (p === 'success' ? 'idle' : p));
    })();
  };

  return (
    <section className="servers-root" aria-label="Сервер">
      <div className="projects-root">
        <aside className="projects-sidebar">
          <div className="projects-sidebar-panel">
            <Link to="/servers" className="project-card-open-btn" style={{ marginBottom: 10 }}>
              ← Все сервера
            </Link>
            <h1 className="projects-title">{vm.name}</h1>
            <p className="page-text">
              {project.name} • {project.region}
            </p>
            <p className="projects-empty-text">
              ОС: {vm.os}
            </p>
            <p className="projects-empty-text" style={{ marginTop: 4 }}>
              {vm.cpu} vCPU · {vm.ram} GB RAM · {vm.disk} GB
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 15, fontWeight: 700, color: '#FF0023' }}>
              ≈ {calcMonthlyCost(vm.cpu, vm.ram, vm.disk).toFixed(1)} BYN/мес
            </p>
          </div>
        </aside>

        <section className="projects-content">
          <div className="projects-header-row">
            <div className="projects-filters">
              {SERVER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className="project-card-open-btn"
                  onClick={() => setSelectedTab(tab.id)}
                  style={
                    selectedTab === tab.id
                      ? {
                          background: 'linear-gradient(135deg, #FF0023, #FF0023)',
                          color: '#ffffff'
                        }
                      : undefined
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {selectedTab === 'dashboard' && (
            <section className="page-card">
              <div className="page-card-header-row">
                <div>
                  <h2 className="page-card-title">Дашборд сервера</h2>
                  <p className="page-card-text">
                    Краткий обзор состояния виртуальной машины, ресурсов и сетевого доступа.
                  </p>
                </div>
              </div>

              <div className="page-grid">
                <section className="page-card">
                  <h3 className="page-card-title">Ресурсы</h3>
                  <dl className="build-plan-specs">
                    <div className="build-plan-spec-row">
                      <dt>ОС</dt>
                      <dd>{vm.os}</dd>
                    </div>
                    <div className="build-plan-spec-row">
                      <dt>CPU</dt>
                      <dd>{vm.cpu} vCPU</dd>
                    </div>
                    <div className="build-plan-spec-row">
                      <dt>RAM</dt>
                      <dd>{vm.ram} ГБ</dd>
                    </div>
                    <div className="build-plan-spec-row">
                      <dt>Disk</dt>
                      <dd>{vm.disk} ГБ</dd>
                    </div>
                    <div className="build-plan-spec-row">
                      <dt>Стоимость</dt>
                      <dd>≈ {calcMonthlyCost(vm.cpu, vm.ram, vm.disk).toFixed(1)} BYN/мес</dd>
                    </div>
                  </dl>
                </section>

                <section className="page-card">
                  <h3 className="page-card-title">Сеть и доступ</h3>
                  <dl className="build-plan-specs">
                    <div className="build-plan-spec-row">
                      <dt>Public IP</dt>
                      <dd>{vm.publicIp ?? '—'}</dd>
                    </div>
                    <div className="build-plan-spec-row">
                      <dt>Private IP</dt>
                      <dd>{vm.privateIp ?? '—'}</dd>
                    </div>
                    <div className="build-plan-spec-row">
                      <dt>Открытые порты</dt>
                      <dd>
                        {vm.portsOpen.length > 0
                          ? vm.portsOpen.join(', ')
                          : '—'}
                      </dd>
                    </div>
                  </dl>
                  <div className="projects-empty-actions">
                    <button
                      type="button"
                      className="project-card-open-btn"
                      onClick={() => setSelectedTab('firewall')}
                    >
                      Настроить Firewall
                    </button>
                  </div>
                </section>
              </div>

              <div className="metrics-section-header" style={{ marginTop: 24 }}>
                <h3 className="page-card-title">Графики и метрики</h3>
                <span className="metrics-live-badge">
                  {liveMetrics ? '● Live' : '○ Загрузка…'}
                </span>
              </div>
              <p className="page-card-text">CPU, RAM и диск за последние 30 минут. Шкала Y = использование ресурса.</p>
              <div className="server-metrics-grid">
                {/* CPU — limit from cores_allocated */}
                <div className="server-metric-card">
                  <div className="server-metric-header">
                    <span className="server-metric-title server-metric-title--red">CPU</span>
                    <span className="server-metric-value">
                      {liveMetrics
                        ? `${((liveMetrics.cpuPct / 100) * liveMetrics.limitCpu).toFixed(2)} / ${liveMetrics.limitCpu} vCPU`
                        : '—'}
                    </span>
                  </div>
                  {cpuHistory.length > 0 && liveMetrics ? (
                    <MetricChart data={cpuHistory} min={0} max={liveMetrics.limitCpu} color={['#FF0023', '#ff9999']} />
                  ) : (
                    <div className="metrics-placeholder">Ожидание данных…</div>
                  )}
                  {liveMetrics && (
                    <div className="metrics-usage-bar-wrap">
                      <div className="metrics-usage-bar metrics-usage-bar--cpu" style={{ width: `${Math.min(100, liveMetrics.cpuPct)}%` }} />
                      <span className="metrics-usage-pct">{liveMetrics.cpuPct.toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                {/* RAM — limit from limit_mb */}
                <div className="server-metric-card">
                  <div className="server-metric-header">
                    <span className="server-metric-title server-metric-title--orange">RAM</span>
                    <span className="server-metric-value">
                      {liveMetrics
                        ? `${((liveMetrics.ramPct / 100) * liveMetrics.limitRamGb).toFixed(2)} / ${liveMetrics.limitRamGb} GB`
                        : '—'}
                    </span>
                  </div>
                  {ramHistory.length > 0 && liveMetrics ? (
                    <MetricChart data={ramHistory} min={0} max={liveMetrics.limitRamGb} color={['#f97316', '#fed7aa']} />
                  ) : (
                    <div className="metrics-placeholder">Ожидание данных…</div>
                  )}
                  {liveMetrics && (
                    <div className="metrics-usage-bar-wrap">
                      <div className="metrics-usage-bar metrics-usage-bar--ram" style={{ width: `${Math.min(100, liveMetrics.ramPct)}%` }} />
                      <span className="metrics-usage-pct">{liveMetrics.ramPct.toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                {/* Disk — limit from total_gb */}
                <div className="server-metric-card">
                  <div className="server-metric-header">
                    <span className="server-metric-title server-metric-title--lightorange">Disk</span>
                    <span className="server-metric-value">
                      {liveMetrics
                        ? `${((liveMetrics.diskPct / 100) * liveMetrics.limitDiskGb).toFixed(1)} / ${liveMetrics.limitDiskGb} GB`
                        : '—'}
                    </span>
                  </div>
                  {diskHistory.length > 0 && liveMetrics ? (
                    <MetricChart data={diskHistory} min={0} max={liveMetrics.limitDiskGb} color={['#fb923c', '#ffedd5']} />
                  ) : (
                    <div className="metrics-placeholder">Ожидание данных…</div>
                  )}
                  {liveMetrics && (
                    <div className="metrics-usage-bar-wrap">
                      <div className="metrics-usage-bar metrics-usage-bar--disk" style={{ width: `${Math.min(100, liveMetrics.diskPct)}%` }} />
                      <span className="metrics-usage-pct">{liveMetrics.diskPct.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {selectedTab === 'backups' && (
            <>
              <div className="tt-container">
                <div className="tt-machine">
                  <div className="tt-machine-header">
                    <h2 className="tt-machine-title">Машина Времени</h2>
                    <p className="tt-machine-subtitle">
                      Откатите сервер в предыдущее состояние с помощью снимков и логов.
                    </p>
                  </div>

                  {/* DeLorean car + interactive timeline */}
                  <div className="tt-car-timeline-wrap">
                    <div
                      className={`tt-car-mover${
                        travelPhase === 'shaking' ? ' tt-car--shaking' :
                        travelPhase === 'flying' || travelPhase === 'flash' ? ' tt-car--flying' :
                        ''
                      }`}
                      style={{ left: `${Math.min(92, Math.max(8, carPct))}%` }}
                    >
                      <div className="tt-car-float-wrap">
                        <img
                          src={deloreanImg}
                          className="tt-delorean-img"
                          alt="DeLorean Time Machine"
                        />
                      </div>
                    </div>

                    <div className="tt-timeline">
                      <div className="tt-timeline-line" />
                      <div className="tt-timeline-points-row">
                        {TIMELINE_POINTS.map((pt, idx) => (
                          <button
                            key={pt.minutes}
                            type="button"
                            className={`tt-point-item${idx === activePointIdx ? ' tt-point-item--active' : ''}`}
                            onClick={() => setBackupOffsetMinutes(pt.minutes)}
                            disabled={isBusy}
                            title={pt.label}
                          >
                            <span className="tt-point-dot" />
                            {pt.minutes % 15 === 0 && (
                              <span className="tt-point-label">{pt.label}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fine-grained minute slider */}
                    <input
                      id="backup-offset-slider"
                      type="range"
                      min={5}
                      max={60}
                      step={5}
                      value={Math.min(60, backupOffsetMinutes)}
                      onChange={(e) => setBackupOffsetMinutes(Number(e.target.value))}
                      disabled={isBusy}
                      className="tt-hidden-slider"
                      aria-label="Выберите время отката"
                    />
                  </div>

                  {/* Quick jump: hour buttons */}
                  <div className="tt-hours-section">
                    <div className="tt-hours-label">Быстрый переход</div>
                    <div className="tt-hours-row">
                      {HOUR_POINTS.map((h) => {
                        const isActive = backupOffsetMinutes === h * 60;
                        return (
                          <button
                            key={h}
                            type="button"
                            className={`tt-hour-btn${isActive ? ' tt-hour-btn--active' : ''}`}
                            onClick={() => setBackupOffsetMinutes(h * 60)}
                            disabled={isBusy}
                          >
                            {h}ч
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Destination info card */}
                  <div className="tt-dest-card">
                    <div className="tt-dest-grid">
                      <div className="tt-dest-info">
                        <div className="tt-dest-label">Назначение</div>
                        <div className="tt-dest-value">{humanOffset} назад</div>
                      </div>
                      <div className="tt-dest-times">
                        <span className="tt-dest-time">{fmtTime(nowDate)}</span>
                        <span className="tt-dest-arrow">→</span>
                        <span className="tt-dest-time tt-dest-time--target">
                          {fmtTime(targetDate)}
                        </span>
                      </div>
                    </div>
                    <div className="tt-dest-divider" />
                    <label className="tt-checkbox-row">
                      <input
                        type="checkbox"
                        checked={backupCreateSnapshot}
                        onChange={(e) => setBackupCreateSnapshot(e.target.checked)}
                      />
                      <span>Создать снимок перед откатом</span>
                    </label>
                  </div>

                  {/* CTA */}
                  <button
                    type="button"
                    className={`tt-btn${isBusy ? ' tt-btn--active' : ''}`}
                    onClick={runSequence}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <><span className="tt-btn-spinner" />ПЕРЕМЕЩЕНИЕ…</>
                    ) : (
                      'ПУТЕШЕСТВИЕ ВО ВРЕМЕНИ'
                    )}
                  </button>
                </div>
              </div>

              {/* Phase: red flash */}
              {travelPhase === 'flash' && (
                <div className="tt-flash-overlay" aria-hidden="true" />
              )}

              {/* Phase: success / error toast */}
              {(travelPhase === 'success' || travelPhase === 'error') && (
                <div
                  className={`tt-toast tt-toast--${travelPhase}`}
                  role="alert"
                  aria-live="assertive"
                >
                  <div className="tt-toast-icon">
                    {travelPhase === 'success' ? '✓' : '✕'}
                  </div>
                  <div className="tt-toast-body">
                    <div className="tt-toast-title">
                      {travelPhase === 'success' ? 'Путешествие завершено' : 'Путешествие не удалось'}
                    </div>
                    <div className="tt-toast-text">
                      {travelPhase === 'success'
                        ? 'Откат применён успешно.'
                        : 'Произошла ошибка. Попробуйте снова.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="tt-toast-close"
                    onClick={() => setTravelPhase('idle')}
                    aria-label="Закрыть уведомление"
                  >
                    ×
                  </button>
                </div>
              )}
            </>
          )}

          {selectedTab === 'firewall' && (
            <div className="pn-root">
              <div className="pn-section">
                <div className="pn-section-title">Firewall</div>
                <div className="pn-section-description">
                  Управляйте входящими портами виртуальной машины. Изменения применяются немедленно.
                </div>

                <div className="pn-vm-list">
                  <div className="pn-vm-card">
                    <div className="pn-vm-card-header">
                      <div className="pn-vm-card-title">
                        <span
                          className="pn-vm-dot"
                          style={{ background: vm.state === 'running' ? '#2ecc71' : '#e67e22' }}
                        />
                        <span className="pn-vm-name">{vm.name}</span>
                        <span className="pn-vm-role">{vm.role}</span>
                      </div>
                      <div className="pn-vm-card-ip">
                        {vm.publicIp && (
                          <span className="pn-ip-public">
                            {vm.publicIp} <span className="pn-ip-tag">публичный</span>
                          </span>
                        )}
                        {vm.privateIp && (
                          <span className="pn-ip-private">
                            {vm.privateIp} <span className="pn-ip-tag">приватный</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pn-fw-list-header">
                      <span>Порт / Протокол</span>
                      <span>Источник</span>
                      <span>Описание</span>
                      <span>Статус</span>
                    </div>

                    <div className="pn-ports-list">
                      {FIREWALL_PORT_DEFS.map((def) => {
                        const isOpen = vm.portsOpen.includes(def.port);
                        return (
                          <div
                            key={def.port}
                            className={`pn-port-row pn-fw-row${isOpen ? ' pn-port-row-open' : ''}`}
                          >
                            <div className="pn-port-info">
                              <span className="pn-port-label">{def.label}</span>
                              <span className="pn-port-number">{def.port}/{def.protocol}</span>
                            </div>
                            <span className="pn-fw-source">{def.source}</span>
                            <span className="pn-fw-desc">{def.description}</span>
                            <div className="pn-port-status">
                              <span className={`pn-port-badge${isOpen ? ' pn-port-badge-open' : ' pn-port-badge-closed'}`}>
                                {isOpen ? 'Открыт' : 'Закрыт'}
                              </span>
                              <button
                                type="button"
                                className={`pn-toggle${isOpen ? ' pn-toggle-on' : ''}`}
                                onClick={() => toggleVmPort(vm.id, def.port)}
                                aria-pressed={isOpen}
                                aria-label={`${isOpen ? 'Закрыть' : 'Открыть'} порт ${def.port}`}
                              >
                                <span className="pn-toggle-knob" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'resources' && (
            <ResourcesTab vm={vm} apiLimits={liveMetrics} />
          )}

          {selectedTab === 'files' && (
            <ServerFileManager serverName={vm.name} basePath="/home/botuser" />
          )}

        </section>
      </div>
    </section>
  );
}

const RAM_STEPS = [0.5, 1, 2, 4, 8, 16, 32];

function formatRam(gb: number): string {
  return gb < 1 ? `${gb * 1024} MB` : `${gb} GB`;
}

function nearestRamIndex(ram: number): number {
  let best = 0;
  let bestDiff = Math.abs(RAM_STEPS[0] - ram);
  for (let i = 1; i < RAM_STEPS.length; i++) {
    const diff = Math.abs(RAM_STEPS[i] - ram);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  }
  return best;
}

function ResourcesTab({ vm, apiLimits }: { vm: VM; apiLimits: LiveMetrics | null }) {
  const updateVmResourcesOnApi = useProjectsStore((s) => s.updateVmResourcesOnApi);

  // Initialize immediately from VM store data; original values tracked in refs
  const [cpu, setCpu] = useState<number>(vm.cpu || 1);
  const [ramGb, setRamGb] = useState<number>(vm.ram || 1);
  const [disk, setDisk] = useState<number>(vm.disk || 10);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const origCpu  = useRef(vm.cpu || 1);
  const origRam  = useRef(vm.ram || 1);
  const origDisk = useRef(vm.disk || 10);

  // Update sliders once when API limits arrive with real data
  const synced = useRef(false);
  useEffect(() => {
    if (synced.current || !apiLimits) return;
    if (apiLimits.limitCpu > 0)    { setCpu(apiLimits.limitCpu);    origCpu.current  = apiLimits.limitCpu; }
    if (apiLimits.limitRamGb > 0)  { setRamGb(apiLimits.limitRamGb); origRam.current = apiLimits.limitRamGb; }
    if (apiLimits.limitDiskGb > 0) { setDisk(apiLimits.limitDiskGb); origDisk.current = apiLimits.limitDiskGb; }
    synced.current = true;
  }, [apiLimits]);

  const initCpu  = origCpu.current;
  const initRam  = origRam.current;
  const initDisk = origDisk.current;

  const cpuChanged  = cpu   !== initCpu;
  const ramChanged  = ramGb !== initRam;
  const diskChanged = disk  !== initDisk;
  const hasChanges = cpuChanged || ramChanged || diskChanged;

  const ramIndex = nearestRamIndex(ramGb);
  const cpuSlider = Math.min(16, Math.max(1, cpu));
  const diskSlider = Math.min(200, Math.max(10, disk));

  const cpuPct = ((cpuSlider - 1) / (16 - 1)) * 100;
  const ramPct = (ramIndex / (RAM_STEPS.length - 1)) * 100;
  const diskPct = ((diskSlider - 10) / (200 - 10)) * 100;

  const sliderStyle = (pct: number): React.CSSProperties => ({
    background: `linear-gradient(to right, #FF0023 ${Math.max(0, Math.min(100, pct))}%, #e5e7eb ${Math.max(0, Math.min(100, pct))}%)`,
  });

  const handleApply = async () => {
    setSaving(true);
    try {
      await updateVmResourcesOnApi(vm.id, cpu, ramGb, disk);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // error surfaced via toast in store
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page-card">
      <div className="page-card-header-row">
        <div>
          <h2 className="page-card-title">Ресурсы</h2>
          <p className="page-card-text">
            Управляйте лимитами CPU, RAM и диска. Изменения применяются после подтверждения.
          </p>
        </div>
      </div>

      <div className="resource-sliders">
        {/* CPU */}
        <div className="resource-slider-block">
          <div className="resource-slider-header">
            <span className="resource-slider-label">CPU</span>
            <div className="resource-slider-badges">
              {cpuChanged && <span className="resource-old-value">{initCpu} vCPU</span>}
              <span className={`resource-slider-value${cpuChanged ? ' resource-slider-value--changed' : ''}`}>
                {cpu} vCPU
              </span>
            </div>
          </div>
          <input
            type="range"
            min={1} max={16} step={1}
            value={cpuSlider}
            onChange={(e) => { setCpu(Number(e.target.value)); }}
            className="resource-slider"
            style={sliderStyle(cpuPct)}
          />
          <div className="resource-slider-scale">
            <span>1 vCPU</span>
            <div className="resource-slider-ticks">
              {[1,2,4,8,16].map((v) => (
                <span key={v} className={`resource-tick${cpuSlider === v ? ' resource-tick--active' : ''}`}>{v}</span>
              ))}
            </div>
            <span>16 vCPU</span>
          </div>
          <div className="resource-custom-row">
            <span className="resource-custom-label">Своё значение:</span>
            <div className="resource-input-pill">
              <input
                type="number"
                className="resource-number-input"
                value={cpu}
                min={0.1}
                max={256}
                step={0.5}
                onChange={(e) => {
                  const n = parseFloat(e.target.value);
                  if (!isNaN(n) && n > 0) { setCpu(n); }
                }}
              />
              <span className="resource-input-unit">vCPU</span>
            </div>
          </div>
        </div>

        {/* RAM */}
        <div className="resource-slider-block">
          <div className="resource-slider-header">
            <span className="resource-slider-label">RAM</span>
            <div className="resource-slider-badges">
              {ramChanged && <span className="resource-old-value">{formatRam(initRam)}</span>}
              <span className={`resource-slider-value${ramChanged ? ' resource-slider-value--changed' : ''}`}>
                {formatRam(ramGb)}
              </span>
            </div>
          </div>
          <input
            type="range"
            min={0} max={RAM_STEPS.length - 1} step={1}
            value={ramIndex}
            onChange={(e) => { setRamGb(RAM_STEPS[Number(e.target.value)]); }}
            className="resource-slider"
            style={sliderStyle(ramPct)}
          />
          <div className="resource-slider-scale">
            <span>512 MB</span>
            <div className="resource-slider-ticks">
              {RAM_STEPS.map((v, i) => (
                <span key={v} className={`resource-tick${ramIndex === i ? ' resource-tick--active' : ''}`}>
                  {v < 1 ? `${v * 1024}M` : `${v}G`}
                </span>
              ))}
            </div>
            <span>32 GB</span>
          </div>
          <div className="resource-custom-row">
            <span className="resource-custom-label">Своё значение:</span>
            <div className="resource-input-pill">
              <input
                type="number"
                className="resource-number-input"
                value={ramGb}
                min={0.1}
                max={512}
                step={0.5}
                onChange={(e) => {
                  const n = parseFloat(e.target.value);
                  if (!isNaN(n) && n > 0) { setRamGb(n); }
                }}
              />
              <span className="resource-input-unit">GB</span>
            </div>
          </div>
        </div>

        {/* Disk */}
        <div className="resource-slider-block">
          <div className="resource-slider-header">
            <span className="resource-slider-label">Disk</span>
            <div className="resource-slider-badges">
              {diskChanged && <span className="resource-old-value">{initDisk} GB</span>}
              <span className={`resource-slider-value${diskChanged ? ' resource-slider-value--changed' : ''}`}>
                {disk} GB
              </span>
            </div>
          </div>
          <input
            type="range"
            min={10} max={200} step={10}
            value={diskSlider}
            onChange={(e) => { setDisk(Number(e.target.value)); }}
            className="resource-slider"
            style={sliderStyle(diskPct)}
          />
          <div className="resource-slider-scale">
            <span>10 GB</span>
            <div className="resource-slider-ticks">
              {[10, 50, 100, 150, 200].map((v) => (
                <span key={v} className={`resource-tick${diskSlider === v ? ' resource-tick--active' : ''}`}>{v}</span>
              ))}
            </div>
            <span>200 GB</span>
          </div>
          <div className="resource-custom-row">
            <span className="resource-custom-label">Своё значение:</span>
            <div className="resource-input-pill">
              <input
                type="number"
                className="resource-number-input"
                value={disk}
                min={0.5}
                max={10000}
                step={0.5}
                onChange={(e) => {
                  const n = parseFloat(e.target.value);
                  if (!isNaN(n) && n > 0) { setDisk(n); }
                }}
              />
              <span className="resource-input-unit">GB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing estimate */}
      {(() => {
        const currentCost = calcMonthlyCost(initCpu, initRam, initDisk);
        const newCost = calcMonthlyCost(cpu, ramGb, disk);
        const diff = newCost - currentCost;
        const cpuCost = cpu * 5;
        const ramCost = ramGb * 2;
        const diskCost = Math.round(disk * 0.3 * 10) / 10;
        return (
          <div style={{
            marginTop: 20, borderRadius: 18, background: '#f9f9fb',
            border: '1.5px solid #e5e7eb', padding: '16px 20px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 14 }}>
              Расчёт стоимости
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151' }}>
                <span>{cpu} vCPU × 5 BYN</span>
                <span style={{ fontWeight: 600 }}>{cpuCost.toFixed(1)} BYN</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151' }}>
                <span>{formatRam(ramGb)} RAM × 2 BYN/GB</span>
                <span style={{ fontWeight: 600 }}>{ramCost.toFixed(1)} BYN</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151' }}>
                <span>{disk} GB Disk × 0.30 BYN/GB</span>
                <span style={{ fontWeight: 600 }}>{diskCost.toFixed(1)} BYN</span>
              </div>
              <div style={{ height: 1, background: '#e5e7eb', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Итого / месяц</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {hasChanges && currentCost !== newCost && (
                    <span style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'line-through' }}>
                      {currentCost.toFixed(1)} BYN
                    </span>
                  )}
                  <span style={{
                    fontSize: 18, fontWeight: 800,
                    color: diff > 0 ? '#FF0023' : diff < 0 ? '#16a34a' : '#111',
                  }}>
                    {newCost.toFixed(1)} BYN
                  </span>
                  {hasChanges && diff !== 0 && (
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: diff > 0 ? '#FF0023' : '#16a34a',
                      background: diff > 0 ? 'rgba(255,0,35,0.08)' : 'rgba(22,163,74,0.1)',
                      padding: '2px 10px', borderRadius: 999,
                    }}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)} BYN
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {hasChanges && (
        <div className="resource-changes-summary">
          <span className="resource-changes-title">Изменения:</span>
          {cpuChanged && (
            <span className="resource-change-chip">
              CPU {initCpu} → {cpu} vCPU
            </span>
          )}
          {ramChanged && (
            <span className="resource-change-chip">
              RAM {formatRam(initRam)} → {formatRam(ramGb)}
            </span>
          )}
          {diskChanged && (
            <span className="resource-change-chip">
              Disk {initDisk} → {disk} GB
            </span>
          )}
        </div>
      )}

      <div className="resource-apply-row">
        <button
          type="button"
          className={`project-card-open-btn resource-apply-btn${saving ? ' resource-apply-btn--loading' : ''}${saved ? ' resource-apply-btn--saved' : ''}`}
          onClick={handleApply}
          disabled={saving || !hasChanges}
        >
          {saving ? 'Применяется…' : saved ? 'Сохранено ✓' : 'Применить изменения'}
        </button>
        {!hasChanges && (
          <span className="resource-no-changes">Нет изменений</span>
        )}
      </div>
    </section>
  );
}

interface TimeTravelSummaryProps {
  offsetMinutes: number;
  createSnapshot: boolean;
  onToggleCreateSnapshot: (next: boolean) => void;
  vmName: string;
}

function TimeTravelSummary({
  offsetMinutes,
  createSnapshot,
  onToggleCreateSnapshot,
  vmName
}: TimeTravelSummaryProps) {
  const safeOffset = Math.max(5, Math.min(24 * 60, offsetMinutes || 5));
  const now = new Date();
  const target = new Date(now.getTime() - safeOffset * 60_000);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  const minutes = safeOffset % 60;
  const hours = Math.floor(safeOffset / 60);

  const humanOffset =
    hours > 0
      ? `${hours} ч ${minutes.toString().padStart(2, '0')} мин`
      : `${minutes} мин`;

  return (
    <div className="server-backups-summary">
      <p className="server-backups-summary-line">
        Откатить сервер <strong>{vmName}</strong> на:{' '}
        <strong>{humanOffset} назад</strong>
      </p>
      <p className="server-backups-summary-line">
        <span>
          {formatTime(now)} → {formatTime(target)}
        </span>
      </p>

      <label className="server-backups-checkbox-row">
        <input
          type="checkbox"
          checked={createSnapshot}
          onChange={(event) => onToggleCreateSnapshot(event.target.checked)}
        />
        <span>Создать снимок перед откатом</span>
      </label>

      <button type="button" className="project-card-open-btn server-backups-primary">
        Переместиться
      </button>

    </div>
  );
}
