import type { Network, Project, VM } from '../../domain/iaasTypes';
import { useProjectsStore } from '../../store/projectsStore';

interface PortDef {
  port: number;
  label: string;
  protocol: string;
}

const WELL_KNOWN_PORTS: PortDef[] = [
  { port: 22, label: 'SSH', protocol: 'TCP' },
  { port: 80, label: 'HTTP', protocol: 'TCP' },
  { port: 443, label: 'HTTPS', protocol: 'TCP' },
  { port: 3306, label: 'MySQL', protocol: 'TCP' },
  { port: 5432, label: 'PostgreSQL', protocol: 'TCP' },
  { port: 6379, label: 'Redis', protocol: 'TCP' },
  { port: 8000, label: 'App (8000)', protocol: 'TCP' },
  { port: 8080, label: 'App (8080)', protocol: 'TCP' },
  { port: 51820, label: 'WireGuard', protocol: 'UDP' },
];

function relevantPorts(vm: VM): PortDef[] {
  const extras = new Set(vm.portsOpen);
  const base = WELL_KNOWN_PORTS.filter((p) => {
    if (vm.role === 'db') return [22, 5432, 3306].includes(p.port);
    if (vm.role === 'frontend' || vm.role === 'proxy') return [22, 80, 443].includes(p.port);
    if (vm.role === 'vpn') return [22, 51820].includes(p.port);
    if (vm.role === 'backend' || vm.role === 'worker') return [22, 8000, 8080].includes(p.port);
    return true;
  });

  const extra = WELL_KNOWN_PORTS.filter(
    (p) => extras.has(p.port) && !base.some((b) => b.port === p.port)
  );
  return [...base, ...extra];
}

interface PortToggleProps {
  vmId: string;
  portDef: PortDef;
  isOpen: boolean;
}

function PortToggle({ vmId, portDef, isOpen }: PortToggleProps) {
  const toggleVmPort = useProjectsStore((s) => s.toggleVmPort);

  return (
    <div className={`pn-port-row${isOpen ? ' pn-port-row-open' : ''}`}>
      <div className="pn-port-info">
        <span className="pn-port-label">{portDef.label}</span>
        <span className="pn-port-number">{portDef.port}/{portDef.protocol}</span>
      </div>
      <div className="pn-port-status">
        <span className={`pn-port-badge${isOpen ? ' pn-port-badge-open' : ' pn-port-badge-closed'}`}>
          {isOpen ? 'Открыт' : 'Закрыт'}
        </span>
        <button
          type="button"
          className={`pn-toggle${isOpen ? ' pn-toggle-on' : ''}`}
          onClick={() => toggleVmPort(vmId, portDef.port)}
          aria-pressed={isOpen}
          aria-label={`${isOpen ? 'Закрыть' : 'Открыть'} порт ${portDef.port}`}
        >
          <span className="pn-toggle-knob" />
        </button>
      </div>
    </div>
  );
}

interface VmPortCardProps {
  vm: VM;
}

function VmPortCard({ vm }: VmPortCardProps) {
  const ports = relevantPorts(vm);

  return (
    <div className="pn-vm-card">
      <div className="pn-vm-card-header">
        <div className="pn-vm-card-title">
          <span className="pn-vm-dot" style={{ background: vm.state === 'running' ? '#2ecc71' : '#e67e22' }} />
          <span className="pn-vm-name">{vm.name}</span>
          <span className="pn-vm-role">{vm.role}</span>
        </div>
        <div className="pn-vm-card-ip">
          {vm.publicIp ? (
            <span className="pn-ip-public">{vm.publicIp} <span className="pn-ip-tag">публичный</span></span>
          ) : null}
          {vm.privateIp ? (
            <span className="pn-ip-private">{vm.privateIp} <span className="pn-ip-tag">приватный</span></span>
          ) : null}
        </div>
      </div>
      <div className="pn-ports-list">
        {ports.map((portDef) => (
          <PortToggle
            key={portDef.port}
            vmId={vm.id}
            portDef={portDef}
            isOpen={vm.portsOpen.includes(portDef.port)}
          />
        ))}
      </div>
    </div>
  );
}

interface NetworkCardProps {
  network: Network;
}

function NetworkCard({ network }: NetworkCardProps) {
  return (
    <div className="pn-net-card">
      <div className="pn-net-icon">{network.type === 'public' ? '🌐' : '🔒'}</div>
      <div className="pn-net-info">
        <div className="pn-net-name">{network.name}</div>
        <div className="pn-net-cidr">{network.cidr}</div>
      </div>
      <span className={`pn-net-badge${network.type === 'public' ? ' pn-net-badge-public' : ' pn-net-badge-private'}`}>
        {network.type === 'public' ? 'Публичная' : 'Приватная'}
      </span>
    </div>
  );
}

interface Props {
  project: Project;
}

export function ProjectNetworkTab({ project }: Props) {
  const vms = useProjectsStore((s) =>
    s.projects.find((p) => p.id === project.id)?.resources.vms ?? project.resources.vms
  );

  return (
    <div className="pn-root">
      <div className="pn-section">
        <div className="pn-section-title">Управление портами</div>
        <div className="pn-section-description">
          Включайте и выключайте порты для каждой VM. Изменения применяются немедленно.
        </div>
        <div className="pn-vm-list">
          {vms.map((vm) => (
            <VmPortCard key={vm.id} vm={vm} />
          ))}
        </div>
      </div>

      {project.resources.networks.length > 0 && (
        <div className="pn-section">
          <div className="pn-section-title">Сети проекта</div>
          <div className="pn-networks-list">
            {project.resources.networks.map((net) => (
              <NetworkCard key={net.id} network={net} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
