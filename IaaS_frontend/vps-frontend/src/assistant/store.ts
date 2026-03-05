import { create } from 'zustand';
import type { AssistantState, FeedItem, MockAppState, UploadedFile } from './types';
import { SCENARIO, CONSOLE_SETUP_CMDS, RUN_CMDS, TOUR_STOPS } from './scenario';
import { eventBus, EVENTS } from './eventBus';

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
  olegPlan: null,
  olegOs: null,
  olegRegion: null,
  olegBilling: null,
  serverIp: null,
  serverStatus: 'none',
  consoleReady: false,
  uploadedFiles: [],
  projectRunning: false,
  projectUrl: null,
  projectType: null,
};

// Compute Oleg's recommendation based on user answers
function computeOlegRecommendation(selectedValues: Record<string, string>): {
  plan: string;
  os: string;
  region: string;
  billing: string;
} {
  const users = selectedValues['users'] ?? 'small';
  const regionTarget = selectedValues['regionTarget'] ?? 'eu';
  const billing = selectedValues['billing'] ?? 'monthly';

  let plan = 'minimum';
  if (users === 'medium') plan = 'standard';
  else if (users === 'large') plan = 'balance';
  else if (users === 'xlarge') plan = 'optimum';

  let region = 'de-frankfurt';
  if (regionTarget === 'cis') region = 'by-minsk';
  else if (regionTarget === 'usa') region = 'us-newyork';
  else if (regionTarget === 'asia') region = 'sg-singapore';

  return { plan, os: 'ubuntu', region, billing };
}

// Detect project type from uploaded files
function detectProjectType(files: UploadedFile[]): 'node' | 'python' | 'docker' | 'generic' {
  const names = files.map((f) => f.name.toLowerCase());
  if (names.includes('dockerfile')) return 'docker';
  if (names.includes('package.json')) return 'node';
  if (names.includes('requirements.txt')) return 'python';
  return 'generic';
}

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
  navigateTo: null,
  consoleStepIndex: 0,
  runStepIndex: 0,
  tourStepIndex: 0,

  open: () => set({ isOpen: true, isMinimized: false }),
  close: () => set({ isOpen: false }),
  minimize: () => set((s) => ({ isMinimized: !s.isMinimized })),
  toggleMode: () =>
    set((s) => ({ mode: s.mode === 'autopilot' ? 'manual' : 'autopilot' })),

  clearNavigation: () => set({ navigateTo: null }),

  setSelectedValue: (key, value) =>
    set((s) => ({ selectedValues: { ...s.selectedValues, [key]: value } })),

  setSpotlight: (target) => set({ spotlightTarget: target }),

  pushFeedItem: (item) => {
    const full: FeedItem = { ...item, id: uid(), timestamp: ts() };
    set((s) => ({ feed: [...s.feed.slice(-30), full] }));
  },

  setUploadedFiles: (files: UploadedFile[]) => {
    const projectType = detectProjectType(files);
    set((s) => ({
      appState: {
        ...s.appState,
        uploadedFiles: files,
        projectType,
      },
    }));
  },

  removeFile: (name: string) => {
    set((s) => ({
      appState: {
        ...s.appState,
        uploadedFiles: s.appState.uploadedFiles.map((f) =>
          f.name === name ? { ...f, removed: true } : f
        ),
      },
    }));
  },

  removeFlaggedFiles: () => {
    set((s) => ({
      appState: {
        ...s.appState,
        uploadedFiles: s.appState.uploadedFiles.map((f) =>
          f.flagged ? { ...f, removed: true } : f
        ),
      },
    }));
  },

  sendEvent: (event, value, label) => {
    const { currentStepId, pushFeedItem, startProvision, appState, consoleStepIndex, runStepIndex, tourStepIndex } = get();
    const step = SCENARIO[currentStepId];
    if (!step) return;

    if (label) pushFeedItem({ type: 'user', content: label });

    // ── Console setup sub-steps ─────────────────────────────────
    if (currentStepId === 'console-setup' && event === 'CONSOLE_NEXT_CMD') {
      const cmds = CONSOLE_SETUP_CMDS;
      const idx = consoleStepIndex;

      if (idx < cmds.length) {
        const cmd = cmds[idx];
        eventBus.emit(EVENTS.CONSOLE_RUN_CMD, { cmd: cmd.cmd, outputLines: cmd.outputLines });
        pushFeedItem({ type: 'system', content: `$ ${cmd.cmd}` });

        if (idx + 1 >= cmds.length) {
          // All setup commands done
          setTimeout(() => {
            set({ consoleStepIndex: 0 });
            pushFeedItem({ type: 'system', content: '✅ Окружение готово!' });
            get().sendEvent('CONSOLE_SETUP_DONE');
          }, 2000);
        } else {
          set({ consoleStepIndex: idx + 1 });
        }
      }
      return;
    }

    // ── Run project sub-steps ───────────────────────────────────
    if (currentStepId === 'run-project' && event === 'RUN_NEXT_CMD') {
      const projectType = appState.projectType ?? 'generic';
      const cmds = RUN_CMDS[projectType] ?? RUN_CMDS.generic;
      const idx = runStepIndex;

      if (idx < cmds.length) {
        const cmd = cmds[idx];
        eventBus.emit(EVENTS.CONSOLE_RUN_CMD, { cmd: cmd.cmd, outputLines: cmd.outputLines });
        pushFeedItem({ type: 'system', content: `$ ${cmd.cmd}` });

        if (idx + 1 >= cmds.length) {
          setTimeout(() => {
            set((s) => ({
              runStepIndex: 0,
              appState: {
                ...s.appState,
                projectRunning: true,
                projectUrl: 'http://185.12.44.201',
              },
            }));
            pushFeedItem({ type: 'system', content: '🚀 Проект запущен: http://185.12.44.201' });
            eventBus.emit(EVENTS.PROJECT_RUNNING);
            get().sendEvent('PROJECT_RUNNING');
          }, 2500);
        } else {
          set({ runStepIndex: idx + 1 });
        }
      }
      return;
    }

    // ── Product tour sub-steps ──────────────────────────────────
    if (currentStepId === 'security-tour' && (event === 'TOUR_NEXT' || event === 'TOUR_SKIP')) {
      if (event === 'TOUR_SKIP') {
        pushFeedItem({ type: 'system', content: '✅ Тур пропущен.' });
        set({
          currentStepId: 'tour-done',
          tourStepIndex: 0,
          spotlightTarget: null,
          navigateTo: null,
        });
        return;
      }
      const nextIdx = tourStepIndex + 1;
      if (nextIdx >= TOUR_STOPS.length) {
        pushFeedItem({ type: 'system', content: '✅ Тур завершён! Ты знаешь весь продукт.' });
        set({
          currentStepId: 'tour-done',
          tourStepIndex: 0,
          spotlightTarget: null,
          navigateTo: null,
        });
        return;
      }
      const stop = TOUR_STOPS[nextIdx];
      pushFeedItem({ type: 'system', content: `📍 ${stop.label}` });
      set({
        tourStepIndex: nextIdx,
        spotlightTarget: stop.target,
        navigateTo: stop.navigateTo ?? null,
      });
      return;
    }

    const nextStepId = step.transitions[event];
    if (!nextStepId) return;

    // ── Build app state patches ─────────────────────────────────
    const patch: Partial<MockAppState> = {};

    // Record user answers
    if (event === 'TYPE_SELECTED') {
      const v = value ?? 'webapp';
      patch.serverType = v;
      set((s) => ({ selectedValues: { ...s.selectedValues, type: v } }));
    }
    if (event === 'LETS_GO') {
      // Primary button click for welcome uses webapp
      set((s) => ({ selectedValues: { ...s.selectedValues, type: 'webapp' } }));
    }
    if (event === 'USERS_SELECTED') {
      const v = value ?? 'small';
      set((s) => ({ selectedValues: { ...s.selectedValues, users: v } }));
    }
    if (event === 'REGION_TARGET_SELECTED') {
      const v = value ?? 'eu';
      set((s) => ({ selectedValues: { ...s.selectedValues, regionTarget: v } }));
    }
    if (event === 'BILLING_SELECTED') {
      const v = value ?? 'monthly';
      set((s) => ({ selectedValues: { ...s.selectedValues, billing: v } }));
    }

    // Compute Oleg recommendation when transitioning to build-config
    if (nextStepId === 'build-config') {
      const updatedValues = { ...get().selectedValues };
      if (event === 'BILLING_SELECTED' && value) updatedValues.billing = value;
      const rec = computeOlegRecommendation(updatedValues);
      patch.olegPlan = rec.plan;
      patch.olegOs = rec.os;
      patch.olegRegion = rec.region;
      patch.olegBilling = rec.billing;
      patch.region = rec.region;
      patch.serverConfig = rec.plan;
    }

    // Handle provision start
    if (event === 'PROVISION_STARTED') {
      const newApp = { ...appState, ...patch };
      set({ appState: newApp });
      startProvision();
      return;
    }

    // Handle files cleanup
    if (event === 'FILES_CLEAN') {
      get().removeFlaggedFiles();
      pushFeedItem({ type: 'system', content: '🗑️ Лишние файлы удалены' });
      eventBus.emit(EVENTS.FILES_CLEANED);
    }

    // Handle files uploaded → compute flagged items
    if (event === 'FILES_UPLOADED') {
      const files = appState.uploadedFiles;
      const dangerous = ['.env', '.pem', 'id_rsa', '.key', '.p12', '.pfx', 'credentials.json'];
      const junk = ['node_modules', '.git', '.DS_Store', 'Thumbs.db', 'dist'];
      const flagged = files.filter((f) => {
        return dangerous.some((d) => f.name.includes(d)) || junk.some((j) => f.name.includes(j));
      });
      if (flagged.length > 0) {
        set((s) => ({
          appState: {
            ...s.appState,
            uploadedFiles: s.appState.uploadedFiles.map((f) => {
              const isDangerous = dangerous.some((d) => f.name.includes(d));
              const isJunk = junk.some((j) => f.name.includes(j));
              if (isDangerous) return { ...f, flagged: true, flagReason: 'Содержит секреты' };
              if (isJunk) return { ...f, flagged: true, flagReason: 'Лишние данные' };
              return f;
            }),
          },
        }));
        pushFeedItem({ type: 'system', content: `⚠️ Найдено ${flagged.length} опасных/лишних файлов` });
      }
    }

    const newApp = { ...appState, ...patch };
    const nextStep = SCENARIO[nextStepId];
    const spotlight = nextStep?.spotlightTarget ?? null;
    const navigateTo = nextStep?.navigateTo ?? null;

    if (nextStepId !== currentStepId) {
      pushFeedItem({
        type: 'system',
        content: `Шаг: ${nextStep?.card.title ?? nextStepId}`,
      });
    }

    // Set initial tour spotlight + navigate to first stop's page
    if (nextStepId === 'security-tour') {
      const firstStop = TOUR_STOPS[0];
      set({
        currentStepId: nextStepId,
        appState: newApp,
        spotlightTarget: firstStop.target,
        navigateTo: firstStop.navigateTo ?? navigateTo,
        isDeploying: false,
        deployStageIndex: -1,
        tourStepIndex: 0,
      });
      return;
    }

    set({
      currentStepId: nextStepId,
      appState: newApp,
      spotlightTarget: spotlight,
      navigateTo,
      isDeploying: false,
      deployStageIndex: -1,
    });
  },

  startDeploy: () => {
    const { pushFeedItem, sendEvent } = get();
    set({ isDeploying: true, deployStageIndex: 0, logs: [] });
    pushFeedItem({ type: 'system', content: '🚀 Запуск деплоя...' });

    const stages = [
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
        set((s) => ({ deployStageIndex: idx, logs: [...s.logs, log] }));
      }, delay);
    });

    setTimeout(() => {
      set({ isDeploying: false });
      pushFeedItem({ type: 'system', content: '✅ Сервер запущен: 185.12.44.201' });
      sendEvent('DEPLOY_COMPLETE');
    }, 8800);
  },

  startProvision: () => {
    const { pushFeedItem, sendEvent } = get();
    set({ isDeploying: true, deployStageIndex: 0, logs: [] });
    pushFeedItem({ type: 'system', content: '⚙️ Создание сервера...' });

    const stages: Array<{ idx: number; log: string; delay: number }> = [
      { idx: 0, log: '[iaas] Подбираю железо в дата-центре...', delay: 600 },
      { idx: 0, log: '[iaas] Allocating IP → 185.12.44.201', delay: 1400 },
      { idx: 1, log: '[iaas] Создаю VM (Ubuntu 22.04, 2 CPU, 4 ГБ)...', delay: 2200 },
      { idx: 1, log: '[iaas] VM online, настраиваю сеть...', delay: 3500 },
      { idx: 2, log: '[iaas] Настраиваю firewall rules...', delay: 4400 },
      { idx: 2, log: '[iaas] Installing Docker 24.0.7...', delay: 5600 },
      { idx: 3, log: '[iaas] Health check: ping 185.12.44.201 → OK ✓', delay: 7000 },
      { idx: 3, log: '[iaas] Сервер готов к работе ✓', delay: 7800 },
    ];

    stages.forEach(({ idx, log, delay }) => {
      setTimeout(() => {
        set((s) => ({ deployStageIndex: idx, logs: [...s.logs, log] }));
      }, delay);
    });

    setTimeout(() => {
      set((s) => ({
        isDeploying: false,
        appState: {
          ...s.appState,
          serverIp: '185.12.44.201',
          serverStatus: 'running',
          consoleReady: true,
        },
      }));
      pushFeedItem({ type: 'system', content: '✅ Сервер 185.12.44.201 готов!' });
      sendEvent('PROVISION_COMPLETE');
    }, 8600);
  },

  advanceConsoleStep: () => {
    set((s) => ({ consoleStepIndex: s.consoleStepIndex + 1 }));
  },

  advanceRunStep: () => {
    set((s) => ({ runStepIndex: s.runStepIndex + 1 }));
  },

  advanceTourStep: () => {
    set((s) => ({ tourStepIndex: s.tourStepIndex + 1 }));
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
      navigateTo: null,
      consoleStepIndex: 0,
      runStepIndex: 0,
      tourStepIndex: 0,
    }),
}));
