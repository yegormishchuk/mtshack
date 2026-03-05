import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './ServersPage.css';
import './projects/ProjectsPages.css';
import { useProjectsStore } from '../store/projectsStore';
import { useAssistantStore } from '../assistant/store';
import type { ProjectStatus, ProjectTemplate } from '../domain/iaasTypes';
import iconProjects from '../assets/symbols/point.3.connected.trianglepath.dotted.svg';
import iconServers from '../assets/symbols/server.rack.svg';
import iconKey from '../assets/symbols/key.svg';

type ViewMode = 'projects' | 'servers';

interface FlattenedVmRow {
  id: string;
  vmName: string;
  projectId: string;
  projectName: string;
  region: string;
  os: string;
  ipDisplay: string;
  monthlyCost: number;
}

function formatStatusBadge(status: ProjectStatus): string {
  switch (status) {
    case 'running':
      return 'project-status-pill project-status-pill-running';
    case 'provisioning':
      return 'project-status-pill project-status-pill-provisioning';
    case 'draft':
      return 'project-status-pill project-status-pill-draft';
    case 'error':
    default:
      return 'project-status-pill project-status-pill-error';
  }
}

export function ServersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const view: ViewMode =
    (searchParams.get('view') as ViewMode) === 'projects' ? 'projects' : 'servers';

  const projects = useProjectsStore((state) => state.projects);
  const addToast = useProjectsStore((state) => state.addToast);
  const setSelectedProject = useProjectsStore((state) => state.setSelectedProject);
  const loadProjects = useProjectsStore((state) => state.loadProjects);
  const loading = useProjectsStore((state) => state.loading);
  const error = useProjectsStore((state) => state.error);
  const clearError = useProjectsStore((state) => state.clearError);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [template, setTemplate] = useState<ProjectTemplate | 'all'>('all');
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all');
  const [isProjectsDropdownOpen, setIsProjectsDropdownOpen] = useState(false);
  const [isServersDropdownOpen, setIsServersDropdownOpen] = useState(false);
  const rows = useMemo<FlattenedVmRow[]>(
    () =>
      projects.flatMap((project) =>
        project.resources.vms.map((vm) => ({
          id: vm.id,
          vmName: vm.name,
          projectId: project.id,
          projectName: project.name,
          region: project.region,
          os: vm.os,
          ipDisplay: vm.publicIp ?? vm.privateIp ?? '—',
          monthlyCost: vm.monthlyCost
        }))
      ),
    [projects]
  );

  const filteredRows =
    projectFilter === 'all'
      ? rows
      : rows.filter((row) => row.projectId === projectFilter);

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const matchesSearch =
          !search ||
          project.name.toLowerCase().includes(search.toLowerCase()) ||
          project.description.toLowerCase().includes(search.toLowerCase());
        const matchesTemplate = template === 'all' || project.template === template;
        const matchesStatus = status === 'all' || project.status === status;
        return matchesSearch && matchesTemplate && matchesStatus;
      }),
    [projects, search, template, status]
  );

  const setView = (v: ViewMode) => {
    if (v === 'projects') setSearchParams({ view: 'projects' });
    else setSearchParams({});
  };

  const handleCopySsh = (row: FlattenedVmRow) => {
    const ip = row.ipDisplay === '—' ? '0.0.0.0' : row.ipDisplay;
    const ssh = `ssh clouduser@${ip}`;
    void navigator.clipboard.writeText(ssh);
    addToast('SSH команда скопирована');
  };

  const handleView = (row: FlattenedVmRow) => {
    navigate(`/servers/${row.id}`);
  };

  return (
    <section className="servers-root" aria-labelledby="servers-title">
      <div className="projects-root">
        <aside
          className="servers-sidebar projects-sidebar"
          aria-label="Навигация по серверам и проектам"
        >
          <div className="servers-sidebar-panel projects-sidebar-panel">
            <nav className="servers-menu projects-menu sidebar-tabs">
              <button
                type="button"
                className={`servers-menu-item projects-menu-item sidebar-menu-item${
                  view === 'projects' ? ' servers-menu-item-active projects-menu-item-active sidebar-menu-item-active' : ''
                }`}
                onClick={() => {
                  setView('projects');
                  setIsProjectsDropdownOpen((prev) => !prev);
                }}
              >
                <img src={iconProjects} alt="" className="sidebar-menu-icon" aria-hidden />
                <span className="servers-menu-label projects-menu-label sidebar-menu-label">
                  Мои проекты
                </span>
                <span className="servers-menu-count projects-menu-count">{projects.length}</span>
              </button>
              {isProjectsDropdownOpen && (
                <div className="servers-menu-dropdown">
                  {projects.length === 0 ? (
                    <button
                      type="button"
                      className="servers-menu-dropdown-item"
                      onClick={() => navigate('/projects/new')}
                    >
                      <span className="servers-menu-dropdown-label">Создать первый проект</span>
                    </button>
                  ) : (
                    projects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        className="servers-menu-dropdown-item"
                        onClick={() => {
                          setSelectedProject(project.id);
                          navigate(`/projects/${project.id}`);
                        }}
                      >
                        <span className="servers-menu-dropdown-label">{project.name}</span>
                        <span className="servers-menu-dropdown-meta">
                          {project.template} • {project.region}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
              <button
                type="button"
                className={`servers-menu-item projects-menu-item sidebar-menu-item${
                  view === 'servers'
                    ? ' servers-menu-item-active projects-menu-item-active sidebar-menu-item-active'
                    : ''
                }`}
                onClick={() => {
                  setView('servers');
                  setIsServersDropdownOpen((prev) => !prev);
                }}
              >
                <img src={iconServers} alt="" className="sidebar-menu-icon" aria-hidden />
                <span className="servers-menu-label projects-menu-label sidebar-menu-label">
                  Мои сервера
                </span>
                <span className="servers-menu-count projects-menu-count">{rows.length}</span>
              </button>
              {isServersDropdownOpen && (
                <div className="servers-menu-dropdown">
                  {rows.length === 0 ? (
                    <div className="servers-menu-dropdown-empty">
                      Нет активных серверов. Создайте проект, чтобы запустить сервер.
                    </div>
                  ) : (
                    rows.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        className="servers-menu-dropdown-item"
                        onClick={() => navigate(`/servers/${row.id}`)}
                      >
                        <span className="servers-menu-dropdown-label">{row.vmName}</span>
                        <span className="servers-menu-dropdown-meta">
                          {row.projectName} • {row.region}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}

              <Link
                to="/ssh-keys"
                className="servers-menu-item projects-menu-item sidebar-menu-item"
              >
                <img src={iconKey} alt="" className="sidebar-menu-icon" aria-hidden />
                <span className="servers-menu-label projects-menu-label sidebar-menu-label">
                  SSH Ключи
                </span>
              </Link>
            </nav>

            <div className="servers-balance-card projects-balance-card sidebar-balance">
              <p className="servers-balance-summary projects-balance-summary">
                Сумма: 69 BYN
              </p>
              <p className="servers-balance-amount projects-balance-amount">
                Баланс: 32 BYN
              </p>
              <button
                type="button"
                className="servers-balance-topup-btn projects-balance-topup-btn sidebar-balance-btn"
                onClick={() => navigate('/billing')}
              >
                Пополнить баланс
              </button>
            </div>
          </div>
        </aside>

        <section className="servers-content projects-content">
          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #FF3B30', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#FF3B30', fontSize: 14 }}>Ошибка API: {error}</span>
              <button type="button" onClick={clearError} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF3B30', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
          )}
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#55585f', fontSize: 14 }}>
              Загрузка данных…
            </div>
          )}
          {view === 'projects' ? (
            <>
              <div className="projects-header-row">
                <div>
                  <h1 id="servers-title" className="projects-title">
                    Проекты
                  </h1>
                  <p className="page-text">
                    Управляйте своими приложениями и инфраструктурой через проекты.
                  </p>
                </div>
                <button
                  type="button"
                  className="projects-create-btn"
                  onClick={() => navigate('/projects/new')}
                >
                  Создать проект
                </button>
              </div>

              <div className="projects-filters">
                <input
                  className="projects-search-input"
                  placeholder="Поиск по имени или описанию"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="projects-select"
                  value={template}
                  onChange={(e) =>
                    setTemplate(e.target.value as ProjectTemplate | 'all')
                  }
                >
                  <option value="all">Все шаблоны</option>
                  <option value="Backend API">Backend API</option>
                  <option value="SaaS">SaaS</option>
                  <option value="VPN">VPN</option>
                  <option value="AI Inference">AI Inference</option>
                  <option value="Static Site">Static Site</option>
                  <option value="Custom">Custom</option>
                </select>
                <select
                  className="projects-select"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as ProjectStatus | 'all')
                  }
                >
                  <option value="all">Все статусы</option>
                  <option value="draft">Черновик</option>
                  <option value="provisioning">Подготовка</option>
                  <option value="running">Работает</option>
                  <option value="error">Ошибка</option>
                </select>
              </div>

              {projects.length === 0 ? (
                <div className="projects-empty">
                  <h2 className="projects-empty-title">Создайте первый проект</h2>
                  <p className="projects-empty-text">
                    Мы соберём инфраструктуру за вас: от виртуальных машин до сети и
                    IP.
                  </p>
                  <div className="projects-empty-actions">
                    <button
                      type="button"
                      className="projects-create-btn"
                      onClick={() => navigate('/projects/new')}
                    >
                      Начать с мастера
                    </button>
                  </div>
                </div>
              ) : (
                <div className="projects-list-grid">
                  {filteredProjects.map((project) => {
                    const vmCount = project.resources.vms.length;
                    const monthlyCost = project.resources.vms.reduce(
                      (sum, vm) => sum + vm.monthlyCost,
                      0
                    );
                    return (
                      <article key={project.id} className="project-card">
                        <div className="project-card-header">
                          <div>
                            <h2 className="project-card-title">{project.name}</h2>
                            <p className="project-card-subtitle">
                              {project.template} • {project.region}
                            </p>
                          </div>
                          <span className={formatStatusBadge(project.status)}>
                            {project.status === 'running'
                              ? 'Работает'
                              : project.status === 'provisioning'
                                ? 'Подготавливается'
                                : project.status === 'draft'
                                  ? 'Черновик'
                                  : 'Ошибка'}
                          </span>
                        </div>
                        <div className="project-card-meta">
                          <span className="project-card-meta-item">
                            <span>VM:</span>
                            <strong>{vmCount}</strong>
                          </span>
                          <span className="project-card-meta-item">
                            <span>Создан:</span>
                            <span>
                              {new Date(project.createdAt).toLocaleDateString()}
                            </span>
                          </span>
                        </div>
                        <div className="project-card-footer">
                          <span className="project-card-cost">
                            ≈ {monthlyCost.toFixed(0)} BYN/мес
                          </span>
                          <button
                            type="button"
                            className="project-card-open-btn"
                            onClick={() => {
                              setSelectedProject(project.id);
                              navigate(`/projects/${project.id}`);
                            }}
                          >
                            Открыть
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <h1 id="servers-title" className="servers-title">
                Мои сервера
              </h1>

              <div className="projects-filters" style={{ marginBottom: 8 }}>
                <select
                  className="projects-select"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                >
                  <option value="all">Все проекты</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="servers-list" data-tour="server-status">
                {filteredRows.map((row) => (
                  <article key={row.id} className="server-card" role="row">
                    <div className="server-row">
                      <div className="server-col server-col-server">
                        <div className="server-label">Сервер</div>
                        <div className="server-divider" />
                        <div className="server-value server-value-name">
                          {row.vmName}
                        </div>
                      </div>

                      <div className="server-col server-col-project">
                        <div className="server-label">Проект</div>
                        <div className="server-divider" />
                        <div className="server-value">
                          {row.projectName}
                        </div>
                      </div>

                      <div className="server-col server-col-location">
                        <div className="server-label">Локация</div>
                        <div className="server-divider" />
                        <div className="server-value server-location-value">
                          {row.region}
                        </div>
                      </div>

                      <div className="server-col server-col-os">
                        <div className="server-label">Операционная система</div>
                        <div className="server-divider" />
                        <div className="server-value server-os-text">
                          {row.os}
                        </div>
                      </div>

                      <div className="server-col server-col-ip">
                        <div className="server-label">IP-адреса</div>
                        <div className="server-divider" />
                        <div className="server-value server-ip-text server-value-mono">
                          {row.ipDisplay}
                        </div>
                      </div>

                      <div className="server-col server-col-price">
                        <div className="server-label">Стоимость</div>
                        <div className="server-divider" />
                        <div className="server-value server-price">
                          {row.monthlyCost.toFixed(0)} BYN/месяц
                        </div>
                      </div>
                    </div>
                    <div className="server-actions">
                      <button
                        type="button"
                        className="server-btn server-btn-primary"
                        onClick={() => handleView(row)}
                      >
                        Смотреть
                      </button>
                      <button
                        type="button"
                        className="server-btn server-btn-secondary"
                        onClick={() => handleCopySsh(row)}
                      >
                        SSH
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
      <SecurityTourSection />
    </section>
  );
}

function SecurityTourSection() {
  const { currentStepId } = useAssistantStore();
  const navigate = useNavigate();
  if (currentStepId !== 'security-tour') return null;

  return (
    <section style={{ padding: '24px', borderTop: '2px solid #FF0023', marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#FF0023', animation: 'pulse 1.5s infinite' }} />
        <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0', fontFamily: 'Unbounded, system-ui, sans-serif' }}>
          Тур по продукту
        </h2>
        <span style={{ fontSize: '10px', background: '#FF0023', color: '#fff', borderRadius: '4px', padding: '2px 8px', fontFamily: 'Unbounded, system-ui, sans-serif', fontWeight: '700' }}>
          ОЛЕГ ВЕДЁТ
        </span>
      </div>

      {/* Quick-access cards for Console & Files — tour targets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <button
          type="button"
          data-tour="open-console"
          onClick={() => navigate('/console')}
          style={{
            background: '#fff',
            border: '1px solid #e5e5e5',
            borderRadius: '12px',
            padding: '16px',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <span style={{ fontSize: '20px' }}>🖥️</span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'Unbounded, system-ui, sans-serif' }}>Консоль</div>
            <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>SSH из браузера</div>
          </div>
        </button>
        <button
          type="button"
          data-tour="open-files"
          onClick={() => navigate('/files')}
          style={{
            background: '#fff',
            border: '1px solid #e5e5e5',
            borderRadius: '12px',
            padding: '16px',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <span style={{ fontSize: '20px' }}>📁</span>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'Unbounded, system-ui, sans-serif' }}>Файлы</div>
            <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>Менеджер файлов</div>
          </div>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
        <SecurityCard
          tourKey="tour-firewall"
          icon="🔥"
          title="Firewall / Порты"
          status="Активен"
          statusColor="#16a34a"
          details={['Порт 22 (SSH): открыт', 'Порт 80 (HTTP): открыт', 'Порт 443 (HTTPS): открыт', 'Все остальные: закрыты']}
        />
        <SecurityCard
          tourKey="tour-ssh"
          icon="🔑"
          title="SSH Ключи"
          status="Защищено"
          statusColor="#16a34a"
          details={['Вход по паролю: отключён', 'Публичный ключ: добавлен', 'Root login: только ключ', 'Fail2Ban: активен']}
        />
        <SecurityCard
          tourKey="tour-updates"
          icon="🛡️"
          title="Обновления"
          status="Актуально"
          statusColor="#16a34a"
          details={['Ubuntu: 22.04.3 LTS', 'Последнее обновление: сегодня', 'Security patches: авто', 'Unattended-upgrades: вкл']}
        />
        <SecurityCard
          tourKey="tour-monitoring"
          icon="📊"
          title="Мониторинг"
          status="Работает"
          statusColor="#16a34a"
          details={['CPU: 12%', 'RAM: 34% / 4 ГБ', 'Disk: 8.2 ГБ / 50 ГБ', 'Uptime: 99.98%']}
        />
        <SecurityCard
          tourKey="tour-logs"
          icon="📋"
          title="Логи"
          status="Ведутся"
          statusColor="#16a34a"
          details={['Последний вход: только что', 'Неудачные попытки: 0', 'Системные события: норма', 'Хранение: 30 дней']}
        />
        <SecurityCard
          tourKey="tour-backups"
          icon="💾"
          title="Резервные копии"
          status="Настроено"
          statusColor="#16a34a"
          details={['Снапшоты: каждые 24ч', 'Хранятся: 7 дней', 'Последний: только что', 'Размер: 6.4 ГБ']}
        />
      </div>
    </section>
  );
}

interface SecurityCardProps {
  tourKey: string;
  icon: string;
  title: string;
  status: string;
  statusColor: string;
  details: string[];
}

function SecurityCard({ tourKey, icon, title, status, statusColor, details }: SecurityCardProps) {
  return (
    <div
      data-tour={tourKey}
      style={{
        background: '#fff',
        border: '1px solid #e5e5e5',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>{icon}</span>
          <span style={{ fontSize: '12px', fontWeight: '700', fontFamily: 'Unbounded, system-ui, sans-serif' }}>{title}</span>
        </div>
        <span style={{
          fontSize: '10px',
          fontWeight: '700',
          color: statusColor,
          background: `${statusColor}15`,
          padding: '2px 8px',
          borderRadius: '20px',
          fontFamily: 'Unbounded, system-ui, sans-serif',
        }}>
          {status}
        </span>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {details.map((d) => (
          <li key={d} style={{ fontSize: '11px', color: '#55585f', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#e5e5e5', flexShrink: 0 }} />
            {d}
          </li>
        ))}
      </ul>
    </div>
  );
}
