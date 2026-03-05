import { useState } from 'react';
import type { Project } from '../../domain/iaasTypes';
import type { ProjectResources } from '../../domain/iaasTypes';
import { useProjectsStore } from '../../store/projectsStore';
import { ProjectGraph } from '../../graph/ProjectGraph';
import './ProjectsPages.css';

interface ProjectGraphTabProps {
  project: Project;
}

export function ProjectGraphTab({ project }: ProjectGraphTabProps) {
  const [showStorage, setShowStorage] = useState(false);
  const [selectedVmId, setSelectedVmId] = useState<string | undefined>();

  const setHighlightedVm = useProjectsStore((state) => state.setHighlightedVm);
  const toggleVmPort = useProjectsStore((state) => state.toggleVmPort);

  const resources: ProjectResources = {
    project,
    vms: project.resources.vms,
    networks: project.resources.networks,
    volumes: project.resources.volumes,
  };

  const selectedVm = selectedVmId
    ? project.resources.vms.find((vm) => vm.id === selectedVmId)
    : undefined;

  const handleVmClick = (vmId: string) => {
    setSelectedVmId(vmId);
    setHighlightedVm(vmId);
  };

  return (
    <div className="graph-root">
      {/* Toolbar */}
      <div className="graph-toolbar">
        <label>
          <input
            type="checkbox"
            checked={showStorage}
            onChange={(e) => setShowStorage(e.target.checked)}
          />
          Показать storage
        </label>
        {selectedVmId && (
          <button
            type="button"
            className="project-card-open-btn"
            style={{ fontSize: 12, padding: '4px 12px' }}
            onClick={() => {
              setSelectedVmId(undefined);
              setHighlightedVm(undefined);
            }}
          >
            Сбросить выбор
          </button>
        )}
      </div>

      {/* Graph */}
      <ProjectGraph
        resources={resources}
        onVmClick={handleVmClick}
        showStorage={showStorage}
      />

      {/* VM side-panel */}
      {selectedVm && (
        <aside className="graph-sidepanel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 className="projects-empty-title" style={{ margin: 0 }}>{selectedVm.name}</h3>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 999,
                background: selectedVm.state === 'running' ? 'rgba(34,197,94,0.12)' : 'rgba(249,115,22,0.12)',
                color: selectedVm.state === 'running' ? '#16a34a' : '#ea580c',
              }}
            >
              {selectedVm.state}
            </span>
          </div>

          <p className="projects-empty-text">
            Роль: <strong>{selectedVm.role}</strong>
            {' · '}
            OS: {selectedVm.os}
          </p>
          <p className="projects-empty-text">
            CPU {selectedVm.cpu} vCPU · RAM {selectedVm.ram} ГБ · Disk {selectedVm.disk} ГБ
          </p>
          <p className="projects-empty-text">
            Public IP: <code>{selectedVm.publicIp ?? '—'}</code>
            <br />
            Private IP: <code>{selectedVm.privateIp ?? '—'}</code>
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {selectedVm.portsOpen.map((p) => (
              <span
                key={p}
                style={{
                  fontSize: 11,
                  padding: '3px 9px',
                  borderRadius: 999,
                  background: 'rgba(0,0,0,0.06)',
                  border: '1px solid rgba(0,0,0,0.10)',
                  fontFamily: 'monospace',
                }}
              >
                :{p}
              </span>
            ))}
          </div>

          <div className="projects-empty-actions">
            <button
              type="button"
              className="project-card-open-btn"
              onClick={() => toggleVmPort(selectedVm.id, 22)}
            >
              {selectedVm.portsOpen.includes(22) ? '🔒 Закрыть SSH' : '🔓 Открыть SSH'}
            </button>
            <button
              type="button"
              className="project-card-open-btn"
              onClick={() => {
                const ip = selectedVm.publicIp ?? selectedVm.privateIp ?? '0.0.0.0';
                void navigator.clipboard.writeText(`ssh clouduser@${ip}`);
              }}
            >
              Copy SSH
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
