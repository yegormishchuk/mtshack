import { create } from 'zustand';
import { api } from '../services/api';
import type {
  ChecklistStepId,
  Project,
  ProjectStatus,
  ProjectTab,
  VM,
  VmRole,
} from '../domain/iaasTypes';

export interface SnapshotInfo {
  name: string;
  created_at?: string;
  stateful?: boolean;
}

interface UiState {
  selectedProjectId?: string;
  selectedProjectTab: ProjectTab;
  highlightedVmId?: string;
  toast?: { id: number; message: string };
}

export interface CreateProjectApiOpts {
  name: string;
  description: string;
  template: Project['template'];
  region: string;
  size: 's' | 'm' | 'l';
}

export interface ProjectsState extends UiState {
  projects: Project[];
  nextId: number;
  loading: boolean;
  error: string | undefined;
  snapshots: Record<string, SnapshotInfo[]>; // keyed by instance name

  // Existing sync actions
  setSelectedProject(projectId: string | undefined): void;
  setProjectTab(tab: ProjectTab): void;
  setHighlightedVm(vmId: string | undefined): void;
  setProjectStatus(projectId: string, status: ProjectStatus): void;
  completeChecklistStep(projectId: string, stepId: ChecklistStepId): void;
  toggleChecklistStep(projectId: string, stepId: ChecklistStepId): void;
  addChecklistStep(
    projectId: string,
    input: { label: string; description: string }
  ): void;
  toggleVmPort(vmId: string, port: number): void;
  setVmPorts(vmId: string, ports: number[]): void;
  addProject(project: Omit<Project, 'id' | 'createdAt' | 'checklist'>): string;
  addToast(message: string): void;
  clearToast(): void;

  // New sync helpers
  insertProject(project: Project): void;
  removeProject(projectId: string): void;
  removeVmFromProject(vmId: string, projectId: string): void;
  updateVmState(vmId: string, state: VM['state']): void;
  clearError(): void;

  // Async API actions
  loadProjects(): Promise<void>;
  createProjectOnApi(opts: CreateProjectApiOpts): Promise<string>;
  deleteProjectOnApi(projectId: string): Promise<void>;
  vmAction(vmId: string, action: 'start' | 'stop' | 'restart'): Promise<void>;
  deleteVmOnApi(vmId: string, projectId: string): Promise<void>;
  loadSnapshots(instanceName: string): Promise<void>;
  createSnapshotOnApi(instanceName: string, snapshotName: string): Promise<void>;
  restoreSnapshotOnApi(instanceName: string, snapshotName: string): Promise<void>;
  deleteSnapshotOnApi(instanceName: string, snapshotName: string): Promise<void>;

  updateVmResources(vmId: string, cpu: number, ram: number, disk: number): void;
  updateVmResourcesOnApi(vmId: string, cpus: number, ramGb: number, diskGb: number): Promise<void>;
}

let toastIdCounter = 1;

function createChecklist(): Project['checklist'] {
  const base: { id: ChecklistStepId; label: string; description: string }[] = [
    {
      id: 'connect',
      label: 'Подключить репозиторий или код',
      description: 'Подключите Git или загрузите архив проекта.',
    },
    {
      id: 'upload',
      label: 'Настроить окружение',
      description: 'Выберите образ, переменные окружения и зависимости.',
    },
    {
      id: 'run',
      label: 'Запустить приложение',
      description: 'Опишите команду запуска сервиса.',
    },
    {
      id: 'expose',
      label: 'Открыть доступ',
      description: 'Настройте порты и публичный доступ.',
    },
  ];
  return base.map((item) => ({ ...item, done: item.id === 'connect' }));
}

function sanitizeLxdName(name: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^[^a-z]+/, '')
    .replace(/-+/g, '-')
    .replace(/-$/, '')
    .slice(0, 50);
  return sanitized || 'project';
}

function mapInstanceStatus(status: string): VM['state'] {
  const s = status.toLowerCase();
  if (s === 'running') return 'running';
  if (['starting', 'provisioning', 'created'].includes(s)) return 'provisioning';
  return 'stopped';
}

function guessRole(name: string): VmRole {
  const n = name.toLowerCase();
  if (n.includes('front') || n.includes('web') || n.includes('fe') || n.includes('static')) return 'frontend';
  if (n.includes('back') || n.includes('api') || n.includes('be')) return 'backend';
  if (n.includes('db') || n.includes('database') || n.includes('postgres') || n.includes('mysql')) return 'db';
  if (n.includes('vpn') || n.includes('gateway') || n.includes('gw')) return 'vpn';
  if (n.includes('worker') || n.includes('inference') || n.includes('ai')) return 'worker';
  if (n.includes('proxy') || n.includes('nginx') || n.includes('lb')) return 'proxy';
  return 'custom';
}

function parseMemoryMB(mem: string | undefined): number {
  if (!mem) return 512;
  const upper = mem.toUpperCase();
  const val = parseFloat(upper);
  if (upper.includes('GB')) return val * 1024;
  if (upper.includes('MB')) return val;
  return 512;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRawInstanceToVm(inst: Record<string, any>, projectId: string): VM {
  const status = String(inst.status || inst.state || '');
  const state = mapInstanceStatus(status);

  let privateIp: string | undefined;
  let publicIp: string | undefined;

  // Try network interfaces (LXD format)
  const network = inst.network || inst.networks || {};
  for (const iface of Object.values(network)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addresses = (iface as any).addresses || [];
    for (const addr of addresses) {
      if (addr.family === 'inet' && addr.address && addr.address !== '127.0.0.1') {
        privateIp = privateIp ?? addr.address;
        if (addr.scope === 'global') publicIp = publicIp ?? addr.address;
      }
    }
  }

  // Fallback to direct fields
  privateIp = privateIp ?? inst.ip ?? inst.private_ip ?? inst.ipv4;
  publicIp = publicIp ?? inst.public_ip;

  const config: Record<string, string> = inst.config ?? {};
  const cpuLimit = config['limits.cpu'] ? parseInt(String(config['limits.cpu'])) : 1;
  const memMB = parseMemoryMB(config['limits.memory']);

  return {
    id: String(inst.name),
    projectId,
    name: String(inst.name),
    role: guessRole(String(inst.name)),
    os: 'Ubuntu 22.04',
    cpu: cpuLimit || 1,
    ram: Math.max(1, Math.round(memMB / 1024)),
    disk: 20,
    privateIp,
    publicIp,
    state,
    monthlyCost: 0,
    portsOpen: [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRawSnapshot(snap: Record<string, any>): SnapshotInfo {
  return {
    name: String(snap.name || snap.snapshot_name || ''),
    created_at: snap.created_at ?? snap.createdAt,
    stateful: snap.stateful ?? false,
  };
}

function sizeConfig(size: 's' | 'm' | 'l'): Record<string, string> {
  if (size === 's') return { 'limits.cpu': '1', 'limits.memory': '512MB' };
  if (size === 'm') return { 'limits.cpu': '2', 'limits.memory': '1024MB' };
  return { 'limits.cpu': '4', 'limits.memory': '2048MB' };
}

function templateVmRoles(template: Project['template']): VmRole[] {
  if (template === 'VPN') return ['vpn'];
  if (template === 'Static Site') return ['frontend'];
  if (template === 'Backend API') return ['backend'];
  if (template === 'SaaS') return ['frontend', 'backend', 'db'];
  if (template === 'AI Inference') return ['frontend', 'worker'];
  return ['custom'];
}

function roleSuffix(role: VmRole): string {
  const map: Record<VmRole, string> = {
    frontend: 'fe',
    backend: 'be',
    db: 'db',
    vpn: 'gw',
    worker: 'worker',
    proxy: 'proxy',
    custom: 'vm',
  };
  return map[role];
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  nextId: 1,
  selectedProjectId: undefined,
  selectedProjectTab: 'overview',
  highlightedVmId: undefined,
  toast: undefined,
  loading: false,
  error: undefined,
  snapshots: {},

  // ---------- Existing sync actions ----------

  setSelectedProject(projectId) {
    set({ selectedProjectId: projectId, selectedProjectTab: 'overview' });
  },

  setProjectTab(tab) {
    set({ selectedProjectTab: tab });
  },

  setHighlightedVm(vmId) {
    set({ highlightedVmId: vmId });
  },

  setProjectStatus(projectId, status) {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id === projectId ? { ...project, status } : project
      ),
    }));
  },

  completeChecklistStep(projectId, stepId) {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id !== projectId
          ? project
          : {
              ...project,
              checklist: project.checklist.map((step) =>
                step.id === stepId ? { ...step, done: true } : step
              ),
            }
      ),
    }));
  },

  toggleChecklistStep(projectId, stepId) {
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id !== projectId
          ? project
          : {
              ...project,
              checklist: project.checklist.map((step) =>
                step.id === stepId ? { ...step, done: !step.done } : step
              ),
            }
      ),
    }));
  },

  addChecklistStep(projectId, input) {
    const id: ChecklistStepId = `custom-${Date.now()}`;
    set((state) => ({
      projects: state.projects.map((project) =>
        project.id !== projectId
          ? project
          : {
              ...project,
              checklist: [
                ...project.checklist,
                {
                  id,
                  label: input.label,
                  description: input.description,
                  done: false,
                },
              ],
            }
      ),
    }));
  },

  toggleVmPort(vmId, port) {
    set((state) => ({
      projects: state.projects.map((project) => ({
        ...project,
        resources: {
          ...project.resources,
          vms: project.resources.vms.map((vm) =>
            vm.id !== vmId
              ? vm
              : {
                  ...vm,
                  portsOpen: vm.portsOpen.includes(port)
                    ? vm.portsOpen.filter((p) => p !== port)
                    : [...vm.portsOpen, port],
                }
          ),
        },
      })),
    }));
  },

  setVmPorts(vmId, ports) {
    set((state) => ({
      projects: state.projects.map((project) => ({
        ...project,
        resources: {
          ...project.resources,
          vms: project.resources.vms.map((vm) =>
            vm.id !== vmId ? vm : { ...vm, portsOpen: ports }
          ),
        },
      })),
    }));
  },

  addProject(input) {
    const id = `p${get().nextId}`;
    const createdAt = new Date().toISOString();
    const project: Project = {
      id,
      createdAt,
      checklist: createChecklist(),
      ...input,
    };
    set((state) => ({
      projects: [...state.projects, project],
      nextId: state.nextId + 1,
      selectedProjectId: id,
      selectedProjectTab: 'overview',
    }));
    return id;
  },

  addToast(message) {
    const id = toastIdCounter++;
    set({ toast: { id, message } });
  },

  clearToast() {
    if (!get().toast) return;
    set({ toast: undefined });
  },

  // ---------- New sync helpers ----------

  insertProject(project) {
    set((state) => ({
      projects: [...state.projects.filter((p) => p.id !== project.id), project],
    }));
  },

  removeProject(projectId) {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
    }));
  },

  removeVmFromProject(vmId, projectId) {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id !== projectId
          ? p
          : {
              ...p,
              resources: {
                ...p.resources,
                vms: p.resources.vms.filter((vm) => vm.id !== vmId),
              },
            }
      ),
    }));
  },

  updateVmState(vmId, state) {
    set((s) => ({
      projects: s.projects.map((project) => ({
        ...project,
        resources: {
          ...project.resources,
          vms: project.resources.vms.map((vm) =>
            vm.id !== vmId ? vm : { ...vm, state }
          ),
        },
      })),
    }));
  },

  clearError() {
    set({ error: undefined });
  },

  // ---------- Async API actions ----------

  async loadProjects() {
    set({ loading: true, error: undefined });
    try {
      const [networksRaw, instancesRaw] = await Promise.all([
        api.listNetworks(),
        api.listInstances(),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SYSTEM_NETWORKS = new Set(['lxdbr0', 'lo', 'eth0', 'mpbr0', 'lxcbr0']);
      const networks = (networksRaw as any[]).filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (n: any) => typeof n.name === 'string' && !SYSTEM_NETWORKS.has(n.name)
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instances = instancesRaw as any[];

      const projects: Project[] = networks.map((net) => {
        const netName = String(net.name);
        const netInstances = instances.filter((inst) => {
          // 1. Our custom config tag (set when created via UI)
          if (inst.config?.['user.project_network'] === netName) return true;

          // 2. LXD devices — NIC whose "network" field points to this bridge
          const devices: Record<string, any> = inst.devices ?? {};
          for (const dev of Object.values(devices)) {
            if (dev?.type === 'nic' && dev?.network === netName) return true;
          }

          // 3. Direct network_name field (some API responses include it)
          if (inst.network_name === netName) return true;

          // 4. Name-prefix convention: instances created as "<networkName>-<role>"
          if (String(inst.name ?? '').startsWith(netName + '-')) return true;

          return false;
        });

        const cidr =
          net.config?.['ipv4.address'] ??
          net.config?.ipv4_address ??
          '10.0.0.0/24';

        return {
          id: netName,
          name: netName,
          description: String(net.description || ''),
          template: 'Custom' as const,
          region: 'Локальный',
          status: 'running' as const,
          createdAt: new Date().toISOString(),
          checklist: createChecklist(),
          resources: {
            vms: netInstances.map((inst) => mapRawInstanceToVm(inst, netName)),
            networks: [
              {
                id: netName,
                projectId: netName,
                name: netName,
                cidr,
                type: 'private' as const,
              },
            ],
            volumes: [],
            ips: [],
          },
        };
      });

      set({ projects, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Ошибка загрузки',
      });
    }
  },

  async createProjectOnApi(opts) {
    set({ loading: true, error: undefined });
    try {
      const suffix = Math.random().toString(36).slice(2, 6);
      const networkName = `${sanitizeLxdName(opts.name)}-${suffix}`;
      const cfg = sizeConfig(opts.size);

      // 1. Create network with a random private subnet to avoid conflicts
      const oct2 = Math.floor(Math.random() * 254) + 1;
      const oct3 = Math.floor(Math.random() * 254) + 1;
      const cidr = `10.${oct2}.${oct3}.1/24`;
      await api.createNetwork({
        name: networkName,
        description: opts.description,
        config: {
          ipv4_address: cidr,
          ipv4_nat: 'true',
          ipv6_address: 'none',
        },
      });

      // 2. Create instances for each role in the template
      const roles = templateVmRoles(opts.template);
      const createdVms: VM[] = [];

      for (const role of roles) {
        const vmName = `${networkName}-${roleSuffix(role)}`;
        const diskSize = opts.size === 'l' ? '40GB' : opts.size === 'm' ? '20GB' : '10GB';
        await api.createInstance({
          name: vmName,
          network_name: networkName,
          disk: diskSize,
          config: {
            ...cfg,
            'user.project_network': networkName,
          },
        });

        // Auto-start the instance
        try {
          await api.instanceAction(vmName, 'start');
        } catch {
          // Instance might already be starting or start is async - ignore
        }

        createdVms.push({
          id: vmName,
          projectId: networkName,
          name: vmName,
          role,
          os: 'Ubuntu 22.04',
          cpu: parseInt(cfg['limits.cpu']),
          ram: parseMemoryMB(cfg['limits.memory']) / 1024,
          disk: 20,
          state: 'provisioning',
          monthlyCost: 0,
          portsOpen: [],
        });
      }

      // 3. Add project to local store
      const project: Project = {
        id: networkName,
        name: opts.name,
        description: opts.description,
        template: opts.template,
        region: opts.region,
        status: 'provisioning',
        createdAt: new Date().toISOString(),
        checklist: createChecklist(),
        resources: {
          vms: createdVms,
          networks: [
            {
              id: networkName,
              projectId: networkName,
              name: networkName,
              cidr,
              type: 'private',
            },
          ],
          volumes: [],
          ips: [],
        },
      };

      get().insertProject(project);
      set({ loading: false, selectedProjectId: networkName, selectedProjectTab: 'overview' });

      // After a delay, set status to running
      window.setTimeout(() => {
        get().setProjectStatus(networkName, 'running');
        for (const vm of createdVms) {
          get().updateVmState(vm.id, 'running');
        }
      }, 3000);

      return networkName;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка создания проекта';
      set({ loading: false, error: msg });
      throw err;
    }
  },

  async deleteProjectOnApi(projectId) {
    set({ loading: true, error: undefined });
    try {
      // Fetch ALL instances from API to ensure we don't miss any
      let allInstances: Record<string, unknown>[] = [];
      try {
        allInstances = (await api.listInstances()) as Record<string, unknown>[];
      } catch { /* ignore, fall back to local state */ }

      // Instances belonging to this network (by config tag or name prefix)
      const localVmIds = get().projects
        .find((p) => p.id === projectId)
        ?.resources.vms.map((v) => v.id) ?? [];

      const apiVmNames = allInstances
        .map((i) => String(i.name ?? ''))
        .filter((name) => {
          const cfg = (allInstances.find((i) => i.name === name) as any)?.config ?? {};
          return (
            cfg['user.project_network'] === projectId ||
            name.startsWith(projectId + '-')
          );
        });

      const allVmNames = [...new Set([...localVmIds, ...apiVmNames])].filter(Boolean);

      // Stop then delete every instance
      for (const name of allVmNames) {
        try { await api.instanceAction(name, 'stop'); } catch { /* ignore */ }
        try { await api.deleteInstance(name); } catch { /* ignore */ }
      }

      // Now delete the network
      try { await api.deleteNetwork(projectId); } catch { /* ignore */ }

      get().removeProject(projectId);
      set({ loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Ошибка удаления проекта',
      });
      throw err;
    }
  },

  async vmAction(vmId, action) {
    try {
      get().updateVmState(vmId, 'provisioning');
      await api.instanceAction(vmId, action);
      const newState: VM['state'] =
        action === 'stop' ? 'stopped' : 'running';
      get().updateVmState(vmId, newState);
      get().addToast(
        action === 'start'
          ? `${vmId}: запущен`
          : action === 'stop'
          ? `${vmId}: остановлен`
          : `${vmId}: перезапущен`
      );
    } catch (err) {
      get().addToast(`Ошибка: ${err instanceof Error ? err.message : action}`);
      // Reload to get actual state
      await get().loadProjects();
    }
  },

  async deleteVmOnApi(vmId, projectId) {
    try {
      await api.instanceAction(vmId, 'stop').catch(() => { /* ignore */ });
      await api.deleteInstance(vmId);
      get().removeVmFromProject(vmId, projectId);
      get().addToast(`${vmId}: удалён`);
    } catch (err) {
      get().addToast(`Ошибка удаления: ${err instanceof Error ? err.message : vmId}`);
    }
  },

  async loadSnapshots(instanceName) {
    try {
      const raw = await api.listSnapshots(instanceName);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const snaps = (raw as any[]).map(mapRawSnapshot);
      set((s) => ({ snapshots: { ...s.snapshots, [instanceName]: snaps } }));
    } catch {
      set((s) => ({ snapshots: { ...s.snapshots, [instanceName]: [] } }));
    }
  },

  async createSnapshotOnApi(instanceName, snapshotName) {
    await api.createSnapshot({ instance_name: instanceName, snapshot_name: snapshotName });
    get().addToast(`Снапшот «${snapshotName}» создан`);
    await get().loadSnapshots(instanceName);
  },

  async restoreSnapshotOnApi(instanceName, snapshotName) {
    await api.restoreSnapshot({ instance_name: instanceName, snapshot_name: snapshotName });
    get().addToast(`Восстановлено из «${snapshotName}»`);
    await get().loadProjects();
  },

  async deleteSnapshotOnApi(instanceName, snapshotName) {
    await api.deleteSnapshot(instanceName, snapshotName);
    get().addToast(`Снапшот «${snapshotName}» удалён`);
    await get().loadSnapshots(instanceName);
  },

  updateVmResources(vmId, cpu, ram, disk) {
    set((s) => ({
      projects: s.projects.map((project) => ({
        ...project,
        resources: {
          ...project.resources,
          vms: project.resources.vms.map((vm) =>
            vm.id !== vmId ? vm : { ...vm, cpu, ram, disk }
          ),
        },
      })),
    }));
  },

  async updateVmResourcesOnApi(vmId, cpus, ramGb, diskGb) {
    // LXD accepts fractional CPU (e.g. "0.5") and memory in MB or GB
    const memMb = ramGb * 1024;
    const memStr = memMb < 1024 ? `${Math.round(memMb)}MB` : `${ramGb}GB`;
    await api.updateResources(vmId, {
      cpus: String(cpus),
      memory: memStr,
      disk: `${diskGb}GB`,
    });
    get().updateVmResources(vmId, cpus, ramGb, diskGb);
    get().addToast(`${vmId}: ресурсы обновлены`);
  },
}));

export function findProjectVmById(
  state: ProjectsState,
  vmId: string
): { projectId: string; vm: VM } | undefined {
  for (const project of state.projects) {
    const vm = project.resources.vms.find((v) => v.id === vmId);
    if (vm) {
      return { projectId: project.id, vm };
    }
  }
  return undefined;
}
