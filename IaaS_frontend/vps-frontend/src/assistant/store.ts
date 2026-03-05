import { create } from 'zustand';
import type { AssistantState, FeedItem, MockAppState } from './types';
import { SCENARIO } from './scenario';

const uid = () => Math.random().toString(36).slice(2, 9);
const ts = () =>
  new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

const INITIAL_APP: MockAppState = {
  currentPage: '/',
  serverType: null,
  serverConfig: null,
  region: null,
  deployMethod: null,
  envVars: {},
  deployedUrl: null,
  isServerRunning: false,
};

export const useAssistantStore = create<AssistantState>((set, get) => ({
  isOpen: false,
  isMinimized: false,
  mode: 'autopilot',
  currentStepId: 'welcome',
  feed: [],
  isDeploying: false,
  deployStageIndex: -1,
  logs: [],
  selectedValues: {},
  spotlightTarget: null,
  appState: INITIAL_APP,

  open: () => set({ isOpen: true, isMinimized: false }),
  close: () => set({ isOpen: false }),
  minimize: () => set((s) => ({ isMinimized: !s.isMinimized })),
  toggleMode: () =>
    set((s) => ({ mode: s.mode === 'autopilot' ? 'manual' : 'autopilot' })),

  setSelectedValue: (key, value) =>
    set((s) => ({ selectedValues: { ...s.selectedValues, [key]: value } })),

  setSpotlight: (target) => set({ spotlightTarget: target }),

  pushFeedItem: (item) => {
    const full: FeedItem = { ...item, id: uid(), timestamp: ts() };
    set((s) => ({ feed: [...s.feed.slice(-30), full] }));
  },

  sendEvent: (event, value, label) => {
    const { currentStepId, pushFeedItem, startDeploy } = get();
    const step = SCENARIO[currentStepId];
    if (!step) return;

    const nextStepId = step.transitions[event];
    if (!nextStepId) return;

    if (label) pushFeedItem({ type: 'user', content: label });

    // Update mock app state
    const patch: Partial<MockAppState> = {};
    if (event === 'TYPE_SELECTED' && value) patch.serverType = value;
    if (event === 'AUTOPILOT_SELECTED') patch.serverType = 'webapp';
    if (event === 'CONFIG_APPLIED') patch.serverConfig = 'standard';
    if (event === 'CONFIG_SELECTED' && value) patch.serverConfig = value;
    if (event === 'REGION_SELECTED') patch.region = value ?? 'de-frankfurt';
    if (event === 'METHOD_SELECTED') patch.deployMethod = value ?? 'github';
    if (event === 'ENV_SAVED') patch.envVars = { NODE_ENV: 'production', PORT: '3000' };
    if (event === 'DEPLOY_COMPLETE') {
      patch.isServerRunning = true;
      patch.deployedUrl = 'http://185.12.44.201';
    }

    const newApp = { ...get().appState, ...patch };

    if (event === 'DEPLOY_STARTED') {
      set({ appState: newApp });
      startDeploy();
      return;
    }

    const nextStep = SCENARIO[nextStepId];
    const spotlight = nextStep?.spotlightTarget ?? null;

    if (nextStepId !== currentStepId) {
      pushFeedItem({
        type: 'system',
        content: `Шаг: ${nextStep?.card.title ?? nextStepId}`,
      });
    }

    set({
      currentStepId: nextStepId,
      appState: newApp,
      spotlightTarget: spotlight,
      isDeploying: false,
      deployStageIndex: -1,
    });
  },

  startDeploy: () => {
    const { pushFeedItem, sendEvent } = get();
    set({ isDeploying: true, deployStageIndex: 0, logs: [] });
    pushFeedItem({ type: 'system', content: '🚀 Запуск деплоя...' });

    const stages: Array<{ idx: number; log: string; delay: number }> = [
      { idx: 0, log: '[iaas] Allocating IP address → 185.12.44.201', delay: 800 },
      { idx: 1, log: '[iaas] Provisioning VM (Ubuntu 22.04)...', delay: 2200 },
      { idx: 1, log: '[iaas] VM ready, configuring firewall rules...', delay: 3400 },
      { idx: 2, log: '[iaas] Installing Docker 24.0.5...', delay: 4600 },
      { idx: 2, log: '[iaas] Pulling image nginx:alpine...', delay: 5800 },
      { idx: 3, log: '[iaas] Container started on :80 ✓', delay: 7200 },
      { idx: 3, log: '[iaas] Health check: OK (200) ✓', delay: 8000 },
    ];

    stages.forEach(({ idx, log, delay }) => {
      setTimeout(() => {
        set((s) => ({
          deployStageIndex: idx,
          logs: [...s.logs, log],
        }));
      }, delay);
    });

    setTimeout(() => {
      set({ isDeploying: false });
      pushFeedItem({ type: 'system', content: '✅ Сервер запущен: 185.12.44.201' });
      sendEvent('DEPLOY_COMPLETE');
    }, 8800);
  },

  resetAssistant: () =>
    set({
      currentStepId: 'welcome',
      feed: [],
      isDeploying: false,
      deployStageIndex: -1,
      logs: [],
      selectedValues: {},
      spotlightTarget: null,
      appState: INITIAL_APP,
    }),
}));
