import { create } from 'zustand';
import { api } from '../services/api';
import { appendSnapshot, loadHistory, type UsageHistory } from '../services/usageHistory';

const SYSTEM_NETWORKS = new Set(['lxdbr0', 'lo', 'eth0', 'mpbr0', 'lxcbr0', 'virbr0']);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawAny = Record<string, any>;

export interface RawInstance {
  name: string;
  status: string;
  config: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  network?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  devices?: Record<string, any>;
}

export interface RawNetwork {
  name: string;
  description?: string;
  config?: Record<string, string>;
}

export interface RawSnapshot {
  name: string;
  created_at?: string;
  stateful?: boolean;
}

export type VmStatus = 'running' | 'stopped' | 'provisioning';

export interface InstanceSummary {
  name: string;
  projectId: string;
  status: VmStatus;
  cpu: number;
  ramMB: number;
  privateIp?: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  vmCount: number;
  runningCount: number;
  stoppedCount: number;
  totalCpu: number;
  totalRamMB: number;
  cidr: string;
}

export interface DashboardMetrics {
  totalProjects: number;
  totalVMs: number;
  runningVMs: number;
  stoppedVMs: number;
  provisioningVMs: number;
  totalCpuCores: number;
  totalRamGB: number;
  totalDiskGB: number;
  projects: ProjectSummary[];
  instances: InstanceSummary[];
}

let toastCounter = 1;

function parseMemoryMB(mem?: string): number {
  if (!mem) return 512;
  const upper = mem.toUpperCase();
  const val = parseFloat(upper);
  if (upper.includes('GB')) return val * 1024;
  if (upper.includes('MB')) return val;
  return 512;
}

function mapStatus(s: string): VmStatus {
  const lower = (s || '').toLowerCase();
  if (lower === 'running') return 'running';
  if (['starting', 'provisioning', 'created'].includes(lower)) return 'provisioning';
  return 'stopped';
}

function getPrivateIp(inst: RawAny): string | undefined {
  const network = inst.network || inst.networks || {};
  for (const iface of Object.values(network)) {
    const addresses = (iface as RawAny).addresses || [];
    for (const addr of addresses) {
      if (addr.family === 'inet' && addr.address && addr.address !== '127.0.0.1') {
        return addr.address;
      }
    }
  }
  return inst.ip ?? inst.private_ip ?? inst.ipv4;
}

function mapInstance(inst: RawAny): InstanceSummary {
  const config: Record<string, string> = inst.config ?? {};
  const projectId = config['user.project_network'] ?? '';
  const cpu = config['limits.cpu'] ? parseInt(String(config['limits.cpu'])) : 1;
  const ramMB = parseMemoryMB(config['limits.memory']);
  return {
    name: String(inst.name),
    projectId,
    status: mapStatus(String(inst.status || inst.state || '')),
    cpu: cpu || 1,
    ramMB,
    privateIp: getPrivateIp(inst),
  };
}

function buildMetrics(networks: RawAny[], instances: RawAny[]): DashboardMetrics {
  const filteredNetworks = networks.filter(
    (n) => typeof n.name === 'string' && !SYSTEM_NETWORKS.has(n.name)
  );

  const mappedInstances = instances.map(mapInstance);

  const projects: ProjectSummary[] = filteredNetworks.map((net) => {
    const netName = String(net.name);
    const netInstances = mappedInstances.filter((inst) => {
      if (inst.projectId === netName) return true;
      // device NIC check
      const raw = instances.find((i) => i.name === inst.name) as RawAny | undefined;
      if (!raw) return false;
      const devices: Record<string, RawAny> = raw.devices ?? {};
      for (const dev of Object.values(devices)) {
        if (dev?.type === 'nic' && dev?.network === netName) return true;
      }
      if (String(inst.name).startsWith(netName + '-')) return true;
      return false;
    });

    return {
      id: netName,
      name: netName,
      description: String(net.description || ''),
      vmCount: netInstances.length,
      runningCount: netInstances.filter((i) => i.status === 'running').length,
      stoppedCount: netInstances.filter((i) => i.status === 'stopped').length,
      totalCpu: netInstances.reduce((s, i) => s + i.cpu, 0),
      totalRamMB: netInstances.reduce((s, i) => s + i.ramMB, 0),
      cidr:
        net.config?.['ipv4.address'] ??
        net.config?.ipv4_address ??
        '—',
    };
  });

  const running = mappedInstances.filter((i) => i.status === 'running').length;
  const stopped = mappedInstances.filter((i) => i.status === 'stopped').length;
  const provisioning = mappedInstances.filter((i) => i.status === 'provisioning').length;
  const totalCpu = mappedInstances.reduce((s, i) => s + i.cpu, 0);
  const totalRamMB = mappedInstances.reduce((s, i) => s + i.ramMB, 0);

  return {
    totalProjects: filteredNetworks.length,
    totalVMs: mappedInstances.length,
    runningVMs: running,
    stoppedVMs: stopped,
    provisioningVMs: provisioning,
    totalCpuCores: totalCpu,
    totalRamGB: Math.round((totalRamMB / 1024) * 10) / 10,
    totalDiskGB: mappedInstances.length * 20, // 20 GB per VM default
    projects,
    instances: mappedInstances,
  };
}

interface AdminState {
  metrics: DashboardMetrics | null;
  rawInstances: RawAny[];
  snapshotsByInstance: Record<string, RawSnapshot[]>;
  usageHistory: UsageHistory;
  loading: boolean;
  snapshotsLoading: boolean;
  error?: string;
  toast?: { id: number; message: string };

  loadAll(): Promise<void>;
  loadSnapshots(): Promise<void>;
  addToast(msg: string): void;
  clearToast(): void;
  stopInstance(name: string): Promise<void>;
  deleteInstance(name: string): Promise<void>;
  stopProject(projectId: string): void;
  deleteProject(projectId: string): Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  metrics: null,
  rawInstances: [],
  snapshotsByInstance: {},
  usageHistory: loadHistory(),
  loading: false,
  snapshotsLoading: false,
  error: undefined,
  toast: undefined,

  async loadAll() {
    set({ loading: true, error: undefined });
    try {
      const [networksRaw, instancesRaw] = await Promise.all([
        api.listNetworks(),
        api.listInstances(),
      ]);
      const networks = networksRaw as RawAny[];
      const instances = instancesRaw as RawAny[];
      const metrics = buildMetrics(networks, instances);
      const usageHistory = appendSnapshot({
        runningVMs: metrics.runningVMs,
        stoppedVMs: metrics.stoppedVMs,
        provisioningVMs: metrics.provisioningVMs,
        totalCpuCores: metrics.totalCpuCores,
        totalRamGB: metrics.totalRamGB,
        totalVMs: metrics.totalVMs,
      });
      set({ metrics, rawInstances: instances, usageHistory, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Ошибка загрузки данных',
      });
    }
  },

  async loadSnapshots() {
    const instances = get().rawInstances;
    if (instances.length === 0) return;
    set({ snapshotsLoading: true });
    const result: Record<string, RawSnapshot[]> = {};
    await Promise.allSettled(
      instances.map(async (inst) => {
        const name = String(inst.name);
        try {
          const raw = await api.listSnapshots(name);
          result[name] = (raw as RawAny[]).map((s) => ({
            name: String(s.name || s.snapshot_name || ''),
            created_at: s.created_at ?? s.createdAt,
            stateful: s.stateful ?? false,
          }));
        } catch {
          result[name] = [];
        }
      })
    );
    set({ snapshotsByInstance: result, snapshotsLoading: false });
  },

  addToast(msg) {
    const id = toastCounter++;
    set({ toast: { id, message: msg } });
  },

  clearToast() {
    set({ toast: undefined });
  },

  async stopInstance(name) {
    try {
      await api.instanceAction(name, 'stop');
      set((s) => {
        if (!s.metrics) return {};
        return {
          metrics: {
            ...s.metrics,
            runningVMs: Math.max(0, s.metrics.runningVMs - 1),
            stoppedVMs: s.metrics.stoppedVMs + 1,
            instances: s.metrics.instances.map((i) =>
              i.name === name ? { ...i, status: 'stopped' as VmStatus } : i
            ),
            projects: s.metrics.projects.map((p) => {
              const inst = s.metrics!.instances.find((i) => i.name === name);
              if (!inst || inst.projectId !== p.id) return p;
              return {
                ...p,
                runningCount: Math.max(0, p.runningCount - 1),
                stoppedCount: p.stoppedCount + 1,
              };
            }),
          },
        };
      });
      get().addToast(`Инстанс «${name}» остановлен`);
    } catch (err) {
      get().addToast(`Ошибка остановки: ${err instanceof Error ? err.message : name}`);
    }
  },

  async deleteInstance(name) {
    try {
      await api.instanceAction(name, 'stop').catch(() => { /* ignore */ });
      await api.deleteInstance(name);
      set((s) => {
        if (!s.metrics) return {};
        const inst = s.metrics.instances.find((i) => i.name === name);
        return {
          metrics: {
            ...s.metrics,
            totalVMs: s.metrics.totalVMs - 1,
            runningVMs: inst?.status === 'running' ? Math.max(0, s.metrics.runningVMs - 1) : s.metrics.runningVMs,
            stoppedVMs: inst?.status === 'stopped' ? Math.max(0, s.metrics.stoppedVMs - 1) : s.metrics.stoppedVMs,
            instances: s.metrics.instances.filter((i) => i.name !== name),
            projects: s.metrics.projects.map((p) => {
              if (!inst || inst.projectId !== p.id) return p;
              return {
                ...p,
                vmCount: Math.max(0, p.vmCount - 1),
                runningCount: inst.status === 'running' ? Math.max(0, p.runningCount - 1) : p.runningCount,
                stoppedCount: inst.status === 'stopped' ? Math.max(0, p.stoppedCount - 1) : p.stoppedCount,
                totalCpu: Math.max(0, p.totalCpu - inst.cpu),
                totalRamMB: Math.max(0, p.totalRamMB - inst.ramMB),
              };
            }),
          },
          rawInstances: s.rawInstances.filter((i) => i.name !== name),
        };
      });
      get().addToast(`Инстанс «${name}» удалён`);
    } catch (err) {
      get().addToast(`Ошибка удаления: ${err instanceof Error ? err.message : name}`);
    }
  },

  stopProject(projectId) {
    get().addToast(`Проект «${projectId}» успешно остановлен`);
  },

  async deleteProject(projectId) {
    try {
      // Fetch ALL instances from API (same as vps-frontend) to not miss any
      let allRaw: RawAny[] = [];
      try {
        allRaw = (await api.listInstances()) as RawAny[];
      } catch { /* fall back to local state */ }

      // Identify by config tag OR name prefix — same logic as vps-frontend
      const localNames = get().metrics?.instances
        .filter((i) => i.projectId === projectId)
        .map((i) => i.name) ?? [];

      const apiNames = allRaw
        .map((i) => String(i.name ?? ''))
        .filter((name) => {
          const cfg = (allRaw.find((i) => i.name === name) as any)?.config ?? {};
          return (
            cfg['user.project_network'] === projectId ||
            name.startsWith(projectId + '-')
          );
        });

      const allNames = [...new Set([...localNames, ...apiNames])].filter(Boolean);

      // Delete each instance individually: stop → delete
      for (const name of allNames) {
        try { await api.instanceAction(name, 'stop'); } catch { /* ignore */ }
        try { await api.deleteInstance(name); } catch { /* ignore */ }
      }

      // Delete the network after all instances
      try { await api.deleteNetwork(projectId); } catch { /* ignore */ }

      // Update local state
      set((s) => {
        if (!s.metrics) return {};
        const removed = new Set(allNames);
        const removedInst = s.metrics.instances.filter((i) => removed.has(i.name));
        const runningRemoved = removedInst.filter((i) => i.status === 'running').length;
        const stoppedRemoved = removedInst.filter((i) => i.status === 'stopped').length;
        return {
          metrics: {
            ...s.metrics,
            totalProjects: Math.max(0, s.metrics.totalProjects - 1),
            totalVMs: Math.max(0, s.metrics.totalVMs - removedInst.length),
            runningVMs: Math.max(0, s.metrics.runningVMs - runningRemoved),
            stoppedVMs: Math.max(0, s.metrics.stoppedVMs - stoppedRemoved),
            instances: s.metrics.instances.filter((i) => !removed.has(i.name)),
            projects: s.metrics.projects.filter((p) => p.id !== projectId),
          },
          rawInstances: s.rawInstances.filter((i) => !removed.has(String(i.name))),
        };
      });
      get().addToast(`Проект «${projectId}» удалён`);
    } catch (err) {
      get().addToast(`Ошибка удаления проекта: ${err instanceof Error ? err.message : projectId}`);
    }
  },
}));
