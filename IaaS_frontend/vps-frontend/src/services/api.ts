// Proxied through Vite dev server to avoid CORS (see vite.config.ts)
const BASE_URL = '/iaas';

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  queryParams?: Record<string, string>
): Promise<T> {
  let url = `${BASE_URL}${path}`;
  if (queryParams) {
    const params = new URLSearchParams(queryParams);
    url += `?${params.toString()}`;
  }
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      errMsg += `: ${await res.text()}`;
    } catch { /* ignore */ }
    throw new Error(errMsg);
  }
  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}

export interface InstanceCreatePayload {
  name: string;
  image?: string;
  type?: string;
  profiles?: string[];
  network_name?: string;
  storage_pool?: string;
  config?: Record<string, string> | null;
  disk?: string | null;
  ssh_password?: string | null;
  ssh_key?: string | null;
}

export interface UpdateResourcesPayload {
  cpus?: string | null;
  memory?: string | null;
  disk?: string | null;
}

export interface NetworkCreatePayload {
  name: string;
  description?: string | null;
  config?: {
    ipv4_address?: string;
    ipv4_nat?: string;
    ipv6_address?: string;
  } | null;
}

export interface SnapshotCreatePayload {
  instance_name: string;
  snapshot_name: string;
  stateful?: boolean;
}

export interface SnapshotRestorePayload {
  instance_name: string;
  snapshot_name: string;
}

export type InstanceAction = 'start' | 'stop' | 'restart';

export const BASE_API_URL = BASE_URL;

export const api = {
  // Instances
  listInstances: () => request<unknown[]>('GET', '/instances'),
  createInstance: (payload: InstanceCreatePayload) =>
    request<unknown>('POST', '/instances', payload),
  getInstance: (name: string) =>
    request<unknown>('GET', `/instances/${encodeURIComponent(name)}`),
  deleteInstance: (name: string) =>
    request<unknown>('DELETE', `/instances/${encodeURIComponent(name)}`),
  instanceAction: (name: string, action: InstanceAction) =>
    request<unknown>('POST', `/instances/${encodeURIComponent(name)}/action`, undefined, {
      action,
    }),

  // Networks
  listNetworks: () => request<unknown[]>('GET', '/networks'),
  createNetwork: (payload: NetworkCreatePayload) =>
    request<unknown>('POST', '/networks', payload),
  deleteNetwork: (name: string) =>
    request<unknown>('DELETE', `/networks/${encodeURIComponent(name)}`),

  // Snapshots
  listSnapshots: (instanceName: string) =>
    request<unknown[]>('GET', `/snapshots/${encodeURIComponent(instanceName)}`),
  createSnapshot: (payload: SnapshotCreatePayload) =>
    request<unknown>('POST', '/snapshots', payload),
  restoreSnapshot: (payload: SnapshotRestorePayload) =>
    request<unknown>('POST', '/snapshots/restore', payload),
  deleteSnapshot: (instanceName: string, snapshotName: string) =>
    request<unknown>(
      'DELETE',
      `/snapshots/${encodeURIComponent(instanceName)}/${encodeURIComponent(snapshotName)}`
    ),
  getSnapshotDownloadUrl: (instanceName: string, snapshotName: string) =>
    `${BASE_URL}/snapshots/${encodeURIComponent(instanceName)}/${encodeURIComponent(snapshotName)}/download`,

  // Resources
  updateResources: (instanceName: string, payload: UpdateResourcesPayload) =>
    request<unknown>('PATCH', `/resources/${encodeURIComponent(instanceName)}`, payload),
  getResourceUsage: (instanceName: string) =>
    request<unknown>('GET', `/resources/${encodeURIComponent(instanceName)}/usage`),
  getMetrics: (instanceName: string) =>
    request<unknown>('GET', `/resources/${encodeURIComponent(instanceName)}/metrics`),
};
