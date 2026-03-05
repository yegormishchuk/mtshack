import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useProjectsStore } from '../store/projectsStore';
import './ServersPage.css';
import './projects/ProjectsPages.css';
import './Page.css';
import './BuildPage.css';
import { ServerFileManager } from '../components/ServerFileManager';
import { MetricChart } from '../components/MetricChart';

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

function generateMetricData(
  points: number,
  baseValue: number,
  spread: number
): [string, number][] {
  const result: [string, number][] = [];
  const now = Date.now();
  let value = baseValue;
  for (let i = points - 1; i >= 0; i--) {
    const ts = new Date(now - i * 60_000);
    const label = ts.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    value = Math.max(0, value + (Math.random() - 0.5) * spread);
    result.push([label, Math.round(value)]);
  }
  return result;
}

const CPU_DATA = generateMetricData(60, 23, 10);
const RAM_DATA = generateMetricData(60, 58, 8);
const DISK_DATA = generateMetricData(60, 120, 40);
const NET_DATA = generateMetricData(60, 8, 5);

type ServerDetailTab = 'dashboard' | 'backups' | 'firewall' | 'files';

const SERVER_TABS: { id: ServerDetailTab; label: string }[] = [
  { id: 'dashboard', label: 'Дашборд' },
  { id: 'backups', label: 'Бэкапы' },
  { id: 'firewall', label: 'Firewall' },
  { id: 'files', label: 'Файлы' }
];

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
              ОС: {vm.os} • ≈ {vm.monthlyCost.toFixed(0)} BYN/мес
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
                      <dd>≈ {vm.monthlyCost.toFixed(0)} BYN/мес</dd>
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

              <h3 className="page-card-title" style={{ marginTop: 24 }}>Графики и метрики</h3>
              <p className="page-card-text">CPU, RAM, диск и сеть за последний час.</p>
              <div className="server-metrics-grid">
                <div className="server-metric-card">
                  <div className="server-metric-header">
                    <span className="server-metric-title server-metric-title--red">CPU</span>
                    <span className="server-metric-value">23%</span>
                  </div>
                  <MetricChart data={CPU_DATA} min={0} max={100} color={['#FF0023', '#ff9999']} />
                </div>
                <div className="server-metric-card">
                  <div className="server-metric-header">
                    <span className="server-metric-title server-metric-title--orange">RAM</span>
                    <span className="server-metric-value">58%</span>
                  </div>
                  <MetricChart data={RAM_DATA} min={0} max={100} color={['#f97316', '#fed7aa']} />
                </div>
                <div className="server-metric-card">
                  <div className="server-metric-header">
                    <span className="server-metric-title server-metric-title--lightorange">Disk I/O</span>
                    <span className="server-metric-value">120 ops/s</span>
                  </div>
                  <MetricChart data={DISK_DATA} min={0} max={300} color={['#fb923c', '#ffedd5']} />
                </div>
                <div className="server-metric-card">
                  <div className="server-metric-header">
                    <span className="server-metric-title server-metric-title--yellow">Network</span>
                    <span className="server-metric-value">8.4 Mbit/s</span>
                  </div>
                  <MetricChart data={NET_DATA} min={0} max={30} color={['#eab308', '#fef9c3']} />
                </div>
              </div>
            </section>
          )}

          {selectedTab === 'backups' && (
            <section className="page-card">
              <h2 className="page-card-title">Откат на точку во времени</h2>
              <p className="page-card-text">
                Быстро верните виртуальную машину в предыдущее состояние, используя снапшоты и
                журналы изменений.
              </p>

              <div className="server-backups-layout">
                <div className="server-backups-main">
                  <div className="server-backups-slider-block">
                    <label
                      htmlFor="backup-offset-slider"
                      className="server-backups-subtitle"
                    >
                      Откат по времени
                    </label>
                    <input
                      id="backup-offset-slider"
                      type="range"
                      min={5}
                      max={24 * 60}
                      step={5}
                      value={backupOffsetMinutes}
                      onChange={(event) =>
                        setBackupOffsetMinutes(Number(event.target.value))
                      }
                      className="server-backups-slider"
                    />
                    <div className="server-backups-slider-scale">
                      <span>−5 мин</span>
                      <span>−24 часа</span>
                    </div>
                  </div>

                  <TimeTravelSummary
                    offsetMinutes={backupOffsetMinutes}
                    createSnapshot={backupCreateSnapshot}
                    onToggleCreateSnapshot={setBackupCreateSnapshot}
                    vmName={vm.name}
                  />
                </div>
              </div>
            </section>
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

          {selectedTab === 'files' && (
            <ServerFileManager serverName={vm.name} basePath="/home/botuser" />
          )}

        </section>
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


