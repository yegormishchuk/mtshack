export type ProjectTemplate =
  | 'Backend API'
  | 'SaaS'
  | 'VPN'
  | 'AI Inference'
  | 'Static Site'
  | 'Custom';

export type ProjectStatus = 'draft' | 'provisioning' | 'running' | 'error';

export type VmRole = 'frontend' | 'backend' | 'db' | 'worker' | 'vpn' | 'proxy' | 'custom';

export interface VM {
  id: string;
  projectId: string;
  name: string;
  role: VmRole;
  os: string;
  cpu: number;
  ram: number;
  disk: number;
  publicIp?: string;
  privateIp?: string;
  networkId?: string;
  state: 'running' | 'stopped' | 'provisioning';
  monthlyCost: number;
  portsOpen: number[];
}

export interface Network {
  id: string;
  projectId: string;
  name: string;
  cidr: string;
  type: 'private' | 'public';
}

export interface Volume {
  id: string;
  projectId: string;
  name: string;
  sizeGB: number;
  attachedToVmId?: string;
}

export interface PublicIP {
  id: string;
  projectId: string;
  ip: string;
  attachedToVmId?: string;
}

// Идентификатор шага чеклиста.
// Базовые шаги используют предопределённые значения, но тип расширен до string,
// чтобы поддерживать пользовательские шаги, добавленные из интерфейса.
export type ChecklistStepId = string;

export interface ChecklistStep {
  id: ChecklistStepId;
  label: string;
  description: string;
  done: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  template: ProjectTemplate;
  region: string;
  status: ProjectStatus;
  createdAt: string;
  checklist: ChecklistStep[];
  resources: {
    vms: VM[];
    networks: Network[];
    volumes: Volume[];
    ips: PublicIP[];
  };
}

export type ProjectTab = 'overview' | 'graph' | 'files' | 'launch' | 'network';

export interface ProjectResources {
  project: Project;
  vms: VM[];
  networks: Network[];
  volumes: Volume[];
}

