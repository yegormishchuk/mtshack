import { useState } from 'react';
import type { ProjectTemplate } from '../domain/iaasTypes';
import './AIAssistantWidget.css';

type AssistantAction =
  | { type: 'selectTemplate'; template: ProjectTemplate }
  | { type: 'setRegion'; region: string }
  | { type: 'setSize'; size: 's' | 'm' | 'l' }
  | { type: 'createProject' }
  | { type: 'openTab'; tab: 'overview' | 'graph' | 'files' | 'launch' | 'network' }
  | { type: 'highlightVm'; vmId: string }
  | { type: 'suggestPorts'; vmId: string; ports: number[] };

export interface AssistantEnvironment {
  selectTemplate?(template: ProjectTemplate): void;
  setRegion?(region: string): void;
  setSize?(size: 's' | 'm' | 'l'): void;
  createProject?(): void;
  openTab?(tab: 'overview' | 'graph' | 'files' | 'launch' | 'network'): void;
  highlightVm?(vmId: string): void;
  suggestPorts?(vmId: string, ports: number[]): void;
}

interface Message {
  id: number;
  from: 'user' | 'bot';
  text: string;
}

interface AIAssistantWidgetProps {
  mode: 'wizard' | 'project';
  environment: AssistantEnvironment;
  attachedVmIds?: string[];
}

let messageId = 1;

function dispatchAction(action: AssistantAction, env: AssistantEnvironment) {
  switch (action.type) {
    case 'selectTemplate':
      env.selectTemplate?.(action.template);
      break;
    case 'setRegion':
      env.setRegion?.(action.region);
      break;
    case 'setSize':
      env.setSize?.(action.size);
      break;
    case 'createProject':
      env.createProject?.();
      break;
    case 'openTab':
      env.openTab?.(action.tab);
      break;
    case 'highlightVm':
      env.highlightVm?.(action.vmId);
      break;
    case 'suggestPorts':
      env.suggestPorts?.(action.vmId, action.ports);
      break;
    default:
      break;
  }
}

export function AIAssistantWidget({
  mode,
  environment,
  attachedVmIds
}: AIAssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: messageId++,
      from: 'bot',
      text:
        mode === 'wizard'
          ? 'Привет! Давай вместе соберём инфраструктуру под ваш проект.'
          : 'Я помогу понять топологию проекта и открыть нужные порты.'
    }
  ]);

  const pushMessage = (from: 'user' | 'bot', text: string) => {
    setMessages((prev) => [...prev, { id: messageId++, from, text }]);
  };

  const runScenarioStaticSite = () => {
    pushMessage('user', 'Хочу поднять сайт');
    pushMessage(
      'bot',
      'Рекомендую шаблон Static Site в ближайшем регионе и открытые порты 80/443.'
    );
    dispatchAction({ type: 'selectTemplate', template: 'Static Site' }, environment);
    dispatchAction({ type: 'setSize', size: 's' }, environment);
    dispatchAction({ type: 'setRegion', region: 'Германия' }, environment);
    if (mode === 'wizard') {
      dispatchAction({ type: 'createProject' }, environment);
    } else if (attachedVmIds && attachedVmIds[0]) {
      dispatchAction(
        { type: 'suggestPorts', vmId: attachedVmIds[0], ports: [80, 443] },
        environment
      );
      dispatchAction({ type: 'openTab', tab: 'network' }, environment);
    }
  };

  const runScenarioBackendApi = () => {
    pushMessage('user', 'Хочу API на FastAPI');
    pushMessage(
      'bot',
      'Соберём Backend API с портом 8000 и nginx в рецептах запуска.'
    );
    dispatchAction({ type: 'selectTemplate', template: 'Backend API' }, environment);
    dispatchAction({ type: 'setSize', size: 'm' }, environment);
    if (mode === 'wizard') {
      dispatchAction({ type: 'createProject' }, environment);
    } else if (attachedVmIds && attachedVmIds[0]) {
      dispatchAction(
        { type: 'suggestPorts', vmId: attachedVmIds[0], ports: [80, 8000] },
        environment
      );
      dispatchAction({ type: 'openTab', tab: 'launch' }, environment);
    }
  };

  const runScenarioVpn = () => {
    pushMessage('user', 'Хочу VPN');
    pushMessage(
      'bot',
      'Предлагаю VPN шаблон с портом 51820 и доступом только по ключу.'
    );
    dispatchAction({ type: 'selectTemplate', template: 'VPN' }, environment);
    if (mode === 'wizard') {
      dispatchAction({ type: 'createProject' }, environment);
    } else if (attachedVmIds && attachedVmIds[0]) {
      dispatchAction(
        { type: 'suggestPorts', vmId: attachedVmIds[0], ports: [22, 51820] },
        environment
      );
      dispatchAction({ type: 'openTab', tab: 'network' }, environment);
    }
  };

  const runScenarioSaas = () => {
    pushMessage('user', 'Хочу SaaS');
    pushMessage(
      'bot',
      'Сделаем трёхзвенную топологию: frontend → backend → db в приватной сети.'
    );
    dispatchAction({ type: 'selectTemplate', template: 'SaaS' }, environment);
    if (mode === 'wizard') {
      dispatchAction({ type: 'createProject' }, environment);
    } else if (attachedVmIds && attachedVmIds[0]) {
      dispatchAction(
        { type: 'suggestPorts', vmId: attachedVmIds[0], ports: [80, 443] },
        environment
      );
      dispatchAction({ type: 'openTab', tab: 'graph' }, environment);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className="ai-fab"
        onClick={() => setIsOpen(true)}
        aria-label="Открыть ассистента"
      >
        ИИ
      </button>
    );
  }

  return (
    <div className="ai-widget-root" aria-label="AI ассистент">
      <header className="ai-widget-header">
        <span className="ai-widget-title">AI ассистент</span>
        <button
          type="button"
          className="ai-widget-close-btn"
          onClick={() => setIsOpen(false)}
        >
          ×
        </button>
      </header>
      <div className="ai-widget-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`ai-message ai-message-${msg.from === 'bot' ? 'bot' : 'user'}`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <div className="ai-widget-quick">
        <button type="button" onClick={runScenarioStaticSite}>
          Хочу поднять сайт
        </button>
        <button type="button" onClick={runScenarioBackendApi}>
          Хочу API
        </button>
        <button type="button" onClick={runScenarioVpn}>
          Хочу VPN
        </button>
        <button type="button" onClick={runScenarioSaas}>
          Хочу SaaS
        </button>
      </div>
    </div>
  );
}

