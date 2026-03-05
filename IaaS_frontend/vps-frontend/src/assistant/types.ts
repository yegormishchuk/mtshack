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
}

export interface ScenarioStep {
  id: string;
  stepIndex: number;
  totalSteps: number;
  card: CardConfig;
  spotlightTarget?: string;
  spotlightTooltip?: string;
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

export interface MockAppState {
  currentPage: string;
  serverType: string | null;
  serverConfig: string | null;
  region: string | null;
  deployMethod: string | null;
  envVars: Record<string, string>;
  deployedUrl: string | null;
  isServerRunning: boolean;
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
  // actions
  open: () => void;
  close: () => void;
  minimize: () => void;
  toggleMode: () => void;
  sendEvent: (event: string, value?: string, label?: string) => void;
  pushFeedItem: (item: Omit<FeedItem, 'id' | 'timestamp'>) => void;
  setSpotlight: (target: string | null) => void;
  startDeploy: () => void;
  resetAssistant: () => void;
  setSelectedValue: (key: string, value: string) => void;
}
