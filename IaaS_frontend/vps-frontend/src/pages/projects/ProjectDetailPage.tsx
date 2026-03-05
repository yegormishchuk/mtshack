import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { ProjectTab, VM } from '../../domain/iaasTypes';
import { useProjectsStore } from '../../store/projectsStore';
import type { SnapshotInfo } from '../../store/projectsStore';
import { api } from '../../services/api';
import './ProjectsPages.css';
import '../ServersPage.css';
import { ProjectGraphTab } from './ProjectGraphTab';
import { ProjectFilesTab } from './ProjectFilesTab';
import { ProjectLaunchTab } from './ProjectLaunchTab';
import { ProjectNetworkTab } from './ProjectNetworkTab';
import { AIAssistantWidget } from '../../components/AIAssistantWidget';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const TABS: { id: ProjectTab; label: string }[] = [
  { id: 'overview', label: 'Обзор' },
  { id: 'graph', label: 'Граф' },
  { id: 'files', label: 'Файлы' },
  { id: 'launch', label: 'Запуск' },
  { id: 'network', label: 'Сеть' }
];

// ---------- Snapshot sub-component ----------

interface VmSnapshotPanelProps {
  vm: VM;
}

function VmSnapshotPanel({ vm }: VmSnapshotPanelProps) {
  const snapshots = useProjectsStore((s) => s.snapshots[vm.id] ?? null);
  const loadSnapshots = useProjectsStore((s) => s.loadSnapshots);
  const createSnapshotOnApi = useProjectsStore((s) => s.createSnapshotOnApi);
  const restoreSnapshotOnApi = useProjectsStore((s) => s.restoreSnapshotOnApi);
  const deleteSnapshotOnApi = useProjectsStore((s) => s.deleteSnapshotOnApi);
  const addToast = useProjectsStore((s) => s.addToast);

  const [newSnapName, setNewSnapName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadSnapshots(vm.id);
  }, [vm.id, loadSnapshots]);

  const handleCreate = async () => {
    const name = newSnapName.trim();
    if (!name) return;
    setBusy(true);
    try {
      await createSnapshotOnApi(vm.id, name);
      setNewSnapName('');
    } catch (err) {
      addToast(`Ошибка: ${err instanceof Error ? err.message : 'snapshot'}`);
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (snap: SnapshotInfo) => {
    if (!confirm(`Восстановить из снапшота «${snap.name}»?`)) return;
    setBusy(true);
    try {
      await restoreSnapshotOnApi(vm.id, snap.name);
    } catch (err) {
      addToast(`Ошибка: ${err instanceof Error ? err.message : 'restore'}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (snap: SnapshotInfo) => {
    if (!confirm(`Удалить снапшот «${snap.name}»?`)) return;
    setBusy(true);
    try {
      await deleteSnapshotOnApi(vm.id, snap.name);
    } catch (err) {
      addToast(`Ошибка: ${err instanceof Error ? err.message : 'delete snap'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 12, padding: '12px 16px', background: 'rgba(0,0,0,0.03)', borderRadius: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#55585f' }}>Снапшоты</div>
      {snapshots === null && <div style={{ fontSize: 13, color: '#55585f' }}>Загрузка…</div>}
      {snapshots !== null && snapshots.length === 0 && (
        <div style={{ fontSize: 13, color: '#55585f' }}>Снапшотов нет</div>
      )}
      {snapshots !== null && snapshots.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
          {snapshots.map((snap) => (
            <div key={snap.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, flex: 1, fontFamily: 'monospace' }}>{snap.name}</span>
              {snap.created_at && (
                <span style={{ fontSize: 11, color: '#55585f' }}>
                  {new Date(snap.created_at).toLocaleDateString()}
                </span>
              )}
              <button
                type="button"
                className="server-btn server-btn-secondary"
                style={{ padding: '3px 10px', fontSize: 12 }}
                disabled={busy}
                onClick={() => { void handleRestore(snap); }}
              >
                Восстановить
              </button>
              <a
                href={api.getSnapshotDownloadUrl(vm.id, snap.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="server-btn server-btn-secondary"
                style={{ padding: '3px 10px', fontSize: 12, textDecoration: 'none' }}
              >
                Скачать
              </a>
              <button
                type="button"
                className="server-btn"
                style={{ padding: '3px 10px', fontSize: 12, color: '#FF3B30', background: 'transparent', border: '1px solid #FF3B30' }}
                disabled={busy}
                onClick={() => { void handleDelete(snap); }}
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={newSnapName}
          onChange={(e) => setNewSnapName(e.target.value)}
          placeholder="Имя снапшота"
          style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid #e0e0e5', fontSize: 13 }}
          onKeyDown={(e) => { if (e.key === 'Enter') { void handleCreate(); } }}
        />
        <button
          type="button"
          className="server-btn server-btn-primary"
          style={{ padding: '6px 14px', fontSize: 13 }}
          disabled={busy || !newSnapName.trim()}
          onClick={() => { void handleCreate(); }}
        >
          {busy ? '…' : '+ Снапшот'}
        </button>
      </div>
    </div>
  );
}

// ---------- Main page ----------

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const query = useQuery();

  const projects = useProjectsStore((state) => state.projects);
  const toggleChecklistStep = useProjectsStore((state) => state.toggleChecklistStep);
  const addChecklistStep = useProjectsStore((state) => state.addChecklistStep);
  const selectedTab = (query.get('tab') as ProjectTab) ?? 'overview';
  const setVmPorts = useProjectsStore((state) => state.setVmPorts);
  const vmAction = useProjectsStore((state) => state.vmAction);
  const deleteVmOnApi = useProjectsStore((state) => state.deleteVmOnApi);
  const deleteProjectOnApi = useProjectsStore((state) => state.deleteProjectOnApi);
  const addToast = useProjectsStore((state) => state.addToast);

  const project = useMemo(
    () => projects.find((p) => p.id === id),
    [projects, id]
  );

  const setSelectedProject = useProjectsStore((state) => state.setSelectedProject);

  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStepLabel, setNewStepLabel] = useState('');
  const [newStepDescription, setNewStepDescription] = useState('');
  const [vmBusy, setVmBusy] = useState<Record<string, boolean>>({});
  const [showSnapshotsFor, setShowSnapshotsFor] = useState<Record<string, boolean>>({});
  const [deletingProject, setDeletingProject] = useState(false);

  const handleVmAction = async (vmId: string, action: 'start' | 'stop' | 'restart') => {
    setVmBusy((prev) => ({ ...prev, [vmId]: true }));
    try {
      await vmAction(vmId, action);
    } finally {
      setVmBusy((prev) => ({ ...prev, [vmId]: false }));
    }
  };

  const handleDeleteVm = async (vmId: string, projectId: string) => {
    if (!confirm(`Удалить инстанс «${vmId}»? Это действие необратимо.`)) return;
    setVmBusy((prev) => ({ ...prev, [vmId]: true }));
    try {
      await deleteVmOnApi(vmId, projectId);
    } finally {
      setVmBusy((prev) => ({ ...prev, [vmId]: false }));
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (!confirm(`Удалить проект «${project.name}» и все его инстансы? Это необратимо.`)) return;
    setDeletingProject(true);
    try {
      await deleteProjectOnApi(project.id);
      navigate('/servers?view=projects');
    } catch (err) {
      addToast(`Ошибка удаления: ${err instanceof Error ? err.message : 'неизвестно'}`);
      setDeletingProject(false);
    }
  };

  if (!project) {
    return (
      <section className="page">
        <h1 className="page-title">Проект не найден</h1>
        <p className="page-text">
          Возможно, он был удалён или ссылка некорректна.
        </p>
      </section>
    );
  }

  const vmCount = project.resources.vms.length;
  const monthlyCost = project.resources.vms.reduce(
    (sum, vm) => sum + vm.monthlyCost,
    0
  );

  const changeTab = (tab: ProjectTab) => {
    const searchParams = new URLSearchParams(query);
    searchParams.set('tab', tab);
    navigate({ pathname: `/projects/${project.id}`, search: searchParams.toString() });
  };

  const handleToggleStep = (stepId: string) => {
    toggleChecklistStep(project.id, stepId);
  };

  const handleStartAddingStep = () => {
    setIsAddingStep(true);
  };

  const handleSubmitNewStep: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const trimmedLabel = newStepLabel.trim();
    const trimmedDescription = newStepDescription.trim();

    if (!trimmedLabel) {
      return;
    }

    addChecklistStep(project.id, {
      label: trimmedLabel,
      description: trimmedDescription || 'Описание шага'
    });

    setNewStepLabel('');
    setNewStepDescription('');
    setIsAddingStep(false);
  };

  return (
    <section className="servers-root" aria-label="Проект">
      <div className="projects-root">
        <aside className="projects-sidebar">
          <div className="projects-sidebar-panel">
            <Link
              to="/projects"
              className="project-card-open-btn"
              style={{ marginBottom: 10 }}
              onClick={() => setSelectedProject(undefined)}
            >
              ← Все проекты
            </Link>
            <h1 className="projects-title">{project.name}</h1>
            <p className="page-text">
              {project.template} • {project.region}
            </p>
            <p className="projects-empty-text">
              VM: {vmCount} • ≈ {monthlyCost.toFixed(0)} BYN/мес
            </p>
            <p className="projects-empty-text" style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
              Сеть: {project.id}
            </p>
            <button
              type="button"
              onClick={() => { void handleDeleteProject(); }}
              disabled={deletingProject}
              style={{
                marginTop: 16,
                width: '100%',
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid #FF3B30',
                background: 'transparent',
                color: '#FF3B30',
                fontSize: 14,
                fontWeight: 600,
                cursor: deletingProject ? 'wait' : 'pointer',
                opacity: deletingProject ? 0.6 : 1,
              }}
            >
              {deletingProject ? 'Удаление…' : 'Удалить проект'}
            </button>
          </div>
        </aside>

        <section className="projects-content">
          <div className="projects-header-row">
            <div className="servers-title">Чеклист запуска</div>
          </div>

          <div className="project-checklist">
            {project.checklist.map((step) => (
              <button
                key={step.id}
                type="button"
                className="project-checklist-item project-checklist-item-button"
                aria-label={step.label}
                aria-pressed={step.done}
                onClick={() => handleToggleStep(step.id)}
              >
                <div
                  className={
                    step.done
                      ? 'project-checklist-bullet project-checklist-bullet-done'
                      : 'project-checklist-bullet'
                  }
                  aria-hidden="true"
                />
                <div className="project-checklist-text">
                  <div
                    className={
                      step.done
                        ? 'project-checklist-label project-checklist-label-done'
                        : 'project-checklist-label'
                    }
                  >
                    {step.label}
                  </div>
                  <div className="project-checklist-description">
                    {step.description}
                  </div>
                </div>
                <div
                  className={
                    step.done
                      ? 'project-checklist-status project-checklist-status-done'
                      : 'project-checklist-status project-checklist-status-todo'
                  }
                >
                  {step.done ? 'Готово' : 'Сделать'}
                </div>
              </button>
            ))}

            {isAddingStep ? (
              <form
                className="project-checklist-add-form"
                onSubmit={handleSubmitNewStep}
              >
                <div className="project-checklist-bullet" aria-hidden="true" />
                <div className="project-checklist-text">
                  <input
                    className="project-checklist-input"
                    placeholder="Новый шаг"
                    value={newStepLabel}
                    onChange={(event) => setNewStepLabel(event.target.value)}
                    autoFocus
                  />
                  <input
                    className="project-checklist-input project-checklist-input-secondary"
                    placeholder="Краткое описание (опционально)"
                    value={newStepDescription}
                    onChange={(event) => setNewStepDescription(event.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="project-checklist-status project-checklist-status-todo"
                >
                  Добавить
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="project-checklist-add-btn"
                onClick={handleStartAddingStep}
              >
                + Добавить шаг
              </button>
            )}
          </div>

          <div className="projects-header-row">
            <div className="projects-filters">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className="project-card-open-btn"
                  onClick={() => changeTab(tab.id)}
                    style={
                      selectedTab === tab.id
                        ? {
                            background:
                              'linear-gradient(135deg, #FF0023, #FF0023)',
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

          {selectedTab === 'overview' && (
            <div className="servers-list">
              {project.resources.vms.map((vm) => {
                const isBusy = vmBusy[vm.id] ?? false;
                const snapsOpen = showSnapshotsFor[vm.id] ?? false;
                const stateColor =
                  vm.state === 'running'
                    ? '#34c759'
                    : vm.state === 'provisioning'
                    ? '#FF9500'
                    : '#8e8e93';
                return (
                  <article key={vm.id} className="server-card" role="row">
                    <div className="server-row">
                      <div className="server-col server-col-server">
                        <div className="server-label">Сервер</div>
                        <div className="server-divider" />
                        <div className="server-value server-value-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: stateColor, flexShrink: 0 }} />
                          {vm.name}
                        </div>
                      </div>

                      <div className="server-col server-col-project">
                        <div className="server-label">Роль / Статус</div>
                        <div className="server-divider" />
                        <div className="server-value">
                          {vm.role} · {vm.state}
                        </div>
                      </div>

                      <div className="server-col server-col-os">
                        <div className="server-label">CPU / RAM</div>
                        <div className="server-divider" />
                        <div className="server-value server-os-text">
                          {vm.cpu} vCPU · {vm.ram} GB
                        </div>
                      </div>

                      <div className="server-col server-col-ip">
                        <div className="server-label">IP-адрес</div>
                        <div className="server-divider" />
                        <div className="server-value server-ip-text server-value-mono">
                          {vm.publicIp ?? vm.privateIp ?? '—'}
                        </div>
                      </div>
                    </div>

                    <div className="server-actions" style={{ flexWrap: 'wrap', gap: 6 }}>
                      {vm.state !== 'running' && (
                        <button
                          type="button"
                          className="server-btn server-btn-primary"
                          disabled={isBusy}
                          onClick={() => { void handleVmAction(vm.id, 'start'); }}
                        >
                          {isBusy ? '…' : 'Запустить'}
                        </button>
                      )}
                      {vm.state === 'running' && (
                        <>
                          <button
                            type="button"
                            className="server-btn server-btn-secondary"
                            disabled={isBusy}
                            onClick={() => { void handleVmAction(vm.id, 'stop'); }}
                          >
                            {isBusy ? '…' : 'Остановить'}
                          </button>
                          <button
                            type="button"
                            className="server-btn server-btn-secondary"
                            disabled={isBusy}
                            onClick={() => { void handleVmAction(vm.id, 'restart'); }}
                          >
                            {isBusy ? '…' : 'Перезапуск'}
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="server-btn server-btn-secondary"
                        onClick={() =>
                          setShowSnapshotsFor((prev) => ({ ...prev, [vm.id]: !snapsOpen }))
                        }
                      >
                        Снапшоты
                      </button>
                      <button
                        type="button"
                        className="server-btn"
                        style={{ color: '#FF3B30', background: 'transparent', border: '1px solid #FF3B30' }}
                        disabled={isBusy}
                        onClick={() => { void handleDeleteVm(vm.id, project.id); }}
                      >
                        Удалить
                      </button>
                    </div>

                    {snapsOpen && <VmSnapshotPanel vm={vm} />}
                  </article>
                );
              })}
            </div>
          )}

          {selectedTab === 'graph' && <ProjectGraphTab project={project} />}

          {selectedTab === 'files' && <ProjectFilesTab project={project} />}

          {selectedTab === 'launch' && <ProjectLaunchTab project={project} />}

          {selectedTab === 'network' && <ProjectNetworkTab project={project} />}
        </section>
      </div>
      <AIAssistantWidget
        mode="project"
        environment={{
          openTab: (tab) => changeTab(tab),
          highlightVm: () => {
            // подсветка обрабатывается внутри графа через стор
          },
          suggestPorts: (vmId, ports) => setVmPorts(vmId, ports)
        }}
        attachedVmIds={project.resources.vms.map((vm) => vm.id)}
      />
    </section>
  );
}

