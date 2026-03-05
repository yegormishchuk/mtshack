export type AppActionType =
  | 'openPage'
  | 'highlight'
  | 'setValue'
  | 'createServer'
  | 'startDeploy'
  | 'showToast'
  | 'pushLogs';

export interface AppAction {
  type: AppActionType;
  payload?: Record<string, unknown>;
}

export interface SecondaryButton {
  id: string;
  label: string;
  event: string;
  value?: string;
  icon?: string;
  group?: string;
}

export interface CardConfig {
  title: string;
  instruction: string;
  hint?: string;
  primaryAction: {
    label: string;
    event: string;
    icon?: string;
  };
  secondaryButtons?: SecondaryButton[];
  accordionText?: string;
  showProgress?: boolean;
  showLogs?: boolean;
  showEnvForm?: boolean;
  isDone?: boolean;
  // New step types for Oleg flow
  isConsoleSetup?: boolean;
  isRunProject?: boolean;
  isFilesReview?: boolean;
  isProvision?: boolean;
  isTour?: boolean;
}

export interface ScenarioStep {
  id: string;
  stepIndex: number;
  totalSteps: number;
  card: CardConfig;
  spotlightTarget?: string;
  spotlightTooltip?: string;
  navigateTo?: string;
  onEnterActions?: AppAction[];
  transitions: Record<string, string>;
}

export interface FeedItem {
  id: string;
  type: 'user' | 'system';
  content: string;
  timestamp: string;
}

export type DeployMode = 'autopilot' | 'manual';

export interface UploadedFile {
  name: string;
  size: number;
  ext: string;
  flagged: boolean;
  flagReason?: string;
  removed: boolean;
}

export interface MockAppState {
  currentPage: string;
  serverType: string | null;
  serverConfig: string | null;
  region: string | null;
  deployMethod: string | null;
  envVars: Record<string, string>;
  deployedUrl: string | null;
  isServerRunning: boolean;
  // Oleg-specific selections (set after answering questions)
  olegPlan: string | null;
  olegOs: string | null;
  olegRegion: string | null;
  olegBilling: string | null;
  // Server provisioning
  serverIp: string | null;
  serverStatus: 'none' | 'provisioning' | 'running';
  // Console
  consoleReady: boolean;
  // Files
  uploadedFiles: UploadedFile[];
  // Project
  projectRunning: boolean;
  projectUrl: string | null;
  projectType: 'node' | 'python' | 'docker' | 'generic' | null;
}

export interface AssistantState {
  isOpen: boolean;
  isMinimized: boolean;
  mode: DeployMode;
  currentStepId: string;
  feed: FeedItem[];
  isDeploying: boolean;
  deployStageIndex: number;
  logs: string[];
  selectedValues: Record<string, string>;
  spotlightTarget: string | null;
  appState: MockAppState;
  navigateTo: string | null;
  // Console sub-step tracking
  consoleStepIndex: number;
  // Run project sub-step tracking
  runStepIndex: number;
  // Tour sub-step tracking
  tourStepIndex: number;
  // actions
  open: () => void;
  close: () => void;
  minimize: () => void;
  toggleMode: () => void;
  sendEvent: (event: string, value?: string, label?: string) => void;
  pushFeedItem: (item: Omit<FeedItem, 'id' | 'timestamp'>) => void;
  setSpotlight: (target: string | null) => void;
  startDeploy: () => void;
  startProvision: () => void;
  resetAssistant: () => void;
  setSelectedValue: (key: string, value: string) => void;
  clearNavigation: () => void;
  advanceConsoleStep: () => void;
  advanceRunStep: () => void;
  advanceTourStep: () => void;
  setUploadedFiles: (files: UploadedFile[]) => void;
  removeFile: (name: string) => void;
  removeFlaggedFiles: () => void;
}
