type Handler = (payload?: unknown) => void;

const listeners: Map<string, Set<Handler>> = new Map();

export const eventBus = {
  emit(event: string, payload?: unknown): void {
    listeners.get(event)?.forEach((h) => h(payload));
  },

  on(event: string, handler: Handler): () => void {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(handler);
    return () => listeners.get(event)?.delete(handler);
  },
};

export const EVENTS = {
  CONSOLE_RUN_CMD: 'CONSOLE_RUN_CMD',
  CONSOLE_CMD_OK: 'CONSOLE_CMD_OK',
  CONSOLE_SETUP_DONE: 'CONSOLE_SETUP_DONE',
  FILES_UPLOADED: 'FILES_UPLOADED',
  FILES_CLEANED: 'FILES_CLEANED',
  PROJECT_RUNNING: 'PROJECT_RUNNING',
  NAVIGATE: 'NAVIGATE',
} as const;
