import { useAdminStore } from '../store/adminStore';

const INTERVAL_MS = 60 * 1000; // 1 minute

let timerId: ReturnType<typeof setInterval> | null = null;

export function startScheduler(): void {
  if (timerId !== null) return;
  timerId = setInterval(() => {
    useAdminStore.getState().loadAll();
  }, INTERVAL_MS);
}

export function stopScheduler(): void {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}
