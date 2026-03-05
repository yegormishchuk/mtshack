import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useProjectsStore } from '../../store/projectsStore';
import type { ProjectStatus, ProjectTemplate } from '../../domain/iaasTypes';
import './ProjectsPages.css';

interface SidebarProps {
  activeItem: 'projects' | 'servers' | 'billing' | 'ssh';
}

function Sidebar({ activeItem }: SidebarProps) {
  return (
    <aside className="projects-sidebar" aria-label="Навигация по проектам и серверам">
      <div className="projects-sidebar-panel">
        <nav className="projects-menu">
          <Link
            to="/projects"
            className={`projects-menu-item${
              activeItem === 'projects' ? ' projects-menu-item-active' : ''
            }`}
          >
            <span className="projects-menu-label">Проекты</span>
          </Link>
          <Link
            to="/servers"
            className={`projects-menu-item${
              activeItem === 'servers' ? ' projects-menu-item-active' : ''
            }`}
          >
            <span className="projects-menu-label">Мои сервера</span>
          </Link>
          <div className="projects-menu-section">
            <Link
              to="/billing"
              className={`projects-menu-item projects-menu-item-section${
                activeItem === 'billing' ? ' projects-menu-item-active' : ''
              }`}
            >
              <span className="projects-menu-label">Счета</span>
            </Link>
            <Link
              to="/billing?filter=unpaid"
              className="projects-menu-item projects-menu-item-sub"
            >
              <span className="projects-menu-label">Неоплаченные</span>
              <span className="projects-menu-count">1</span>
            </Link>
            <Link to="/billing?filter=paid" className="projects-menu-item projects-menu-item-sub">
              <span className="projects-menu-label">Оплаченные</span>
            </Link>
            <Link to="/billing?filter=all" className="projects-menu-item projects-menu-item-sub">
              <span className="projects-menu-label">Документы по НДС</span>
            </Link>
          </div>

          <Link
            to="/ssh-keys"
            className={`projects-menu-item${
              activeItem === 'ssh' ? ' projects-menu-item-active' : ''
            }`}
          >
            <span className="projects-menu-label">SSH Ключи</span>
          </Link>
        </nav>

        <div className="projects-balance-card">
          <p className="projects-balance-amount">Баланс: 32 BYN</p>
          <button type="button" className="projects-balance-topup-btn">
            Пополнить баланс
          </button>
        </div>
      </div>
    </aside>
  );
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

export function ProjectsListPage() {
  const navigate = useNavigate();
  const projects = useProjectsStore((state) => state.projects);
  const setSelectedProject = useProjectsStore((state) => state.setSelectedProject);

  const [search, setSearch] = useState('');
  const [template, setTemplate] = useState<ProjectTemplate | 'all'>('all');
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all');

  const filtered = useMemo(
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

  const projectCount = projects.length;

  return (
    <section className="servers-root" aria-label="Проекты">
      <div className="projects-root">
        <Sidebar activeItem="projects" />

        <section className="projects-content">
          <div className="projects-header-row">
            <div>
              <h1 className="projects-title">Проекты</h1>
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
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="projects-select"
              value={template}
              onChange={(event) =>
                setTemplate(event.target.value as ProjectTemplate | 'all')
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
              onChange={(event) =>
                setStatus(event.target.value as ProjectStatus | 'all')
              }
            >
              <option value="all">Все статусы</option>
              <option value="draft">Черновик</option>
              <option value="provisioning">Подготовка</option>
              <option value="running">Работает</option>
              <option value="error">Ошибка</option>
            </select>
          </div>

          {projectCount === 0 ? (
            <div className="projects-empty">
              <h2 className="projects-empty-title">Создайте первый проект</h2>
              <p className="projects-empty-text">
                Мы соберём инфраструктуру за вас: от виртуальных машин до сети и IP.
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
              {filtered.map((project) => {
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
                        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
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
        </section>
      </div>
    </section>
  );
}

