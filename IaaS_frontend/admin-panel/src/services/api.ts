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

export const api = {
  listInstances: () => request<unknown[]>('GET', '/instances'),
  listNetworks: () => request<unknown[]>('GET', '/networks'),
  listSnapshots: (instanceName: string) =>
    request<unknown[]>('GET', `/snapshots/${encodeURIComponent(instanceName)}`),
  instanceAction: (name: string, action: 'start' | 'stop' | 'restart') =>
    request<unknown>('POST', `/instances/${encodeURIComponent(name)}/action`, undefined, { action }),
  deleteInstance: (name: string) =>
    request<unknown>('DELETE', `/instances/${encodeURIComponent(name)}`),
  deleteNetwork: (name: string) =>
    request<unknown>('DELETE', `/networks/${encodeURIComponent(name)}`),
};
