const STORAGE_KEY = 'admin_usage_history';
const MAX_POINTS = 30; // 30 minutes
const RETENTION_MS = 30 * 60 * 1000;

export interface UsagePoint {
  timestamp: number;
  runningVMs: number;
  stoppedVMs: number;
  provisioningVMs: number;
  totalCpuCores: number;
  totalRamGB: number;
  totalVMs: number;
}

export interface UsageHistory {
  points: UsagePoint[];
}

export function loadHistory(): UsageHistory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { points: [] };
    return JSON.parse(raw) as UsageHistory;
  } catch {
    return { points: [] };
  }
}

export function appendSnapshot(
  point: Omit<UsagePoint, 'timestamp'>
): UsageHistory {
  const history = loadHistory();
  const now = Date.now();
  const cutoff = now - RETENTION_MS;

  const newPoints = [
    ...history.points.filter((p) => p.timestamp > cutoff),
    { ...point, timestamp: now },
  ].slice(-MAX_POINTS);

  const updated: UsageHistory = { points: newPoints };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore quota errors
  }
  return updated;
}
