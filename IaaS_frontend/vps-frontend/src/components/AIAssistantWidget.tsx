import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, X, Send, Sparkles } from 'lucide-react';
import type { ProjectTemplate } from '../domain/iaasTypes';
import './AIAssistantWidget.css';

// ── Types ──────────────────────────────────────────────────────────────────
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

interface Chip {
  label: string;
  primary?: boolean;
  onPress?: () => void;
  quickInput?: string;
}

interface Message {
  id: number;
  from: 'user' | 'bot';
  text: string;
  chips?: Chip[];
  time: string;
}

interface AIAssistantWidgetProps {
  mode: 'wizard' | 'project';
  environment: AssistantEnvironment;
  attachedVmIds?: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
let _id = 1;
const uid = () => _id++;
const nowTime = () =>
  new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

function dispatch(action: AssistantAction, env: AssistantEnvironment) {
  switch (action.type) {
    case 'selectTemplate': env.selectTemplate?.(action.template); break;
    case 'setRegion':      env.setRegion?.(action.region); break;
    case 'setSize':        env.setSize?.(action.size); break;
    case 'createProject':  env.createProject?.(); break;
    case 'openTab':        env.openTab?.(action.tab); break;
    case 'highlightVm':    env.highlightVm?.(action.vmId); break;
    case 'suggestPorts':   env.suggestPorts?.(action.vmId, action.ports); break;
  }
}

// ── Scripted scenario engine ───────────────────────────────────────────────
interface BotResponse {
  text: string;
  chips?: Chip[];
  actions?: AssistantAction[];
}

function getBotResponse(
  input: string,
  mode: string,
  env: AssistantEnvironment,
  attachedVmIds?: string[],
): BotResponse {
  const q = input.toLowerCase();

  // Static site / frontend
  if (/сайт|site|html|static|лендинг|landing|frontend/i.test(q)) {
    return {
      text: 'Для статического сайта хватит тарифа S. Регион — Германия, порты 80/443. Разворачиваем?',
      chips: [{ label: '✓ Создать проект', primary: true }],
      actions: [
        { type: 'selectTemplate', template: 'Static Site' },
        { type: 'setSize', size: 's' },
        { type: 'setRegion', region: 'Германия' },
        ...(mode === 'wizard' ? [{ type: 'createProject' as const }] : []),
        ...(mode === 'project' && attachedVmIds?.[0]
          ? [{ type: 'suggestPorts' as const, vmId: attachedVmIds[0], ports: [80, 443] }]
          : []),
      ],
    };
  }

  // Backend / API
  if (/api|fastapi|django|flask|backend|бэкенд|express|node/i.test(q)) {
    return {
      text: 'Backend API — тариф M, регион по умолчанию, порты 80 и 8000. Запускаю конфигурацию.',
      chips: [
        { label: '✓ Применить', primary: true },
        { label: 'Порты', quickInput: 'какие порты нужны для API?' },
      ],
      actions: [
        { type: 'selectTemplate', template: 'Backend API' },
        { type: 'setSize', size: 'm' },
        ...(mode === 'wizard' ? [{ type: 'createProject' as const }] : []),
        ...(mode === 'project' && attachedVmIds?.[0]
          ? [
              { type: 'suggestPorts' as const, vmId: attachedVmIds[0], ports: [80, 8000] },
              { type: 'openTab' as const, tab: 'launch' as const },
            ]
          : []),
      ],
    };
  }

  // VPN
  if (/vpn|wireguard|туннел|tunnel/i.test(q)) {
    return {
      text: 'VPN на WireGuard — порты 22 и 51820/UDP, ключ авторизации. Минимальный тариф S.',
      chips: [{ label: '✓ Создать VPN', primary: true }],
      actions: [
        { type: 'selectTemplate', template: 'VPN' },
        { type: 'setSize', size: 's' },
        ...(mode === 'wizard' ? [{ type: 'createProject' as const }] : []),
        ...(mode === 'project' && attachedVmIds?.[0]
          ? [{ type: 'suggestPorts' as const, vmId: attachedVmIds[0], ports: [22, 51820] }]
          : []),
      ],
    };
  }

  // SaaS / multi-tier
  if (/saas|сааs|микросервис|micro|топология|topo|трёхзвенн|frontend.*backend|база данных|db/i.test(q)) {
    return {
      text: 'SaaS-топология: frontend → backend → DB в приватной сети. Тариф L с авто-масштабированием.',
      chips: [
        { label: '✓ Собрать SaaS', primary: true },
        { label: 'Граф', quickInput: 'покажи граф инфраструктуры' },
      ],
      actions: [
        { type: 'selectTemplate', template: 'SaaS' },
        { type: 'setSize', size: 'l' },
        ...(mode === 'wizard' ? [{ type: 'createProject' as const }] : []),
        ...(mode === 'project' && attachedVmIds?.[0]
          ? [
              { type: 'suggestPorts' as const, vmId: attachedVmIds[0], ports: [80, 443] },
              { type: 'openTab' as const, tab: 'graph' as const },
            ]
          : []),
      ],
    };
  }

  // Graph / topology view
  if (/граф|graph|топо|topo|схем|diagram/i.test(q)) {
    if (mode === 'project') {
      env.openTab?.('graph');
    }
    return {
      text: 'Открываю граф инфраструктуры. Там видна топология сети, связи между VM и объёмами.',
      chips: [{ label: 'Файлы', quickInput: 'покажи файлы' }],
    };
  }

  // Files
  if (/файл|file|менеджер|manager/i.test(q)) {
    if (mode === 'project') env.openTab?.('files');
    return {
      text: 'Открываю файловый менеджер. Можно загрузить конфиги, посмотреть логи, изменить .env.',
    };
  }

  // Ports
  if (/порт|port|открыт|firewall|фаервол/i.test(q)) {
    return {
      text: 'Укажите порты, которые нужно открыть. Обычно: 80/443 (веб), 22 (SSH), 8080/8000 (dev-серверы).',
      chips: [
        { label: '80 + 443', quickInput: 'открой порты 80 и 443' },
        { label: '22 + 8000', quickInput: 'открой порты 22 и 8000' },
      ],
    };
  }

  if (/80.*443|443.*80/i.test(q) && mode === 'project' && attachedVmIds?.[0]) {
    env.suggestPorts?.(attachedVmIds[0], [80, 443]);
    return { text: 'Порты 80 и 443 добавлены в конфигурацию фаервола.' };
  }

  if (/22.*8000|8000.*22/i.test(q) && mode === 'project' && attachedVmIds?.[0]) {
    env.suggestPorts?.(attachedVmIds[0], [22, 8000]);
    return { text: 'Порты 22 и 8000 открыты.' };
  }

  // GPU / AI inference
  if (/gpu|cuda|pytorch|tensorflow|ml|ai inference|нейрон/i.test(q)) {
    return {
      text: 'GPU-задачи требуют специального тарифа. Рекомендую AI Inference шаблон — уже настроен CUDA и Docker.',
      chips: [{ label: '✓ GPU конфиг', primary: true }],
      actions: [
        { type: 'selectTemplate', template: 'AI Inference' },
        { type: 'setSize', size: 'l' },
        ...(mode === 'wizard' ? [{ type: 'createProject' as const }] : []),
      ],
    };
  }

  // Region questions
  if (/регион|region|минск|германи|берлин|москв|европ|азия|сша/i.test(q)) {
    return {
      text: 'Германия (Франкфурт) — лучший выбор для европейских пользователей (~5мс от Берлина). Минск — для BY-трафика.',
      chips: [
        { label: '🇩🇪 Германия', quickInput: 'выбери регион Германия' },
        { label: '🇧🇾 Минск', quickInput: 'выбери регион Минск' },
      ],
    };
  }

  if (/германи/i.test(q)) {
    env.setRegion?.('Германия');
    return { text: 'Регион Германия (Франкфурт) выбран.' };
  }

  if (/минск/i.test(q)) {
    env.setRegion?.('Минск');
    return { text: 'Регион Минск выбран.' };
  }

  // Greeting
  if (/привет|hello|hi|здраст|добрый|хай/i.test(q)) {
    return {
      text: 'Привет! Я помогу настроить инфраструктуру. Что хотите запустить?',
      chips: [
        { label: '🌐 Сайт', quickInput: 'хочу поднять сайт' },
        { label: '🔌 API', quickInput: 'хочу backend API' },
        { label: '🔒 VPN', quickInput: 'хочу VPN' },
        { label: '🚀 SaaS', quickInput: 'хочу SaaS' },
      ],
    };
  }

  // Help
  if (/помог|help|что умеешь|можешь|умеешь/i.test(q)) {
    return {
      text: 'Я умею:\n• Подбирать тариф и регион под проект\n• Открывать нужные порты\n• Создавать проект одной командой\n• Показывать граф инфраструктуры\n\nСпросите: "хочу поднять API" или "нужен VPN".',
    };
  }

  // Pricing
  if (/цен|стоимост|тариф|prici|cost|сколько стоит/i.test(q)) {
    return {
      text: 'Тарифы от 14 BYN/мес (S: 1CPU/2ГБ) до 180 BYN/мес (XL: 12CPU/32ГБ). Деплой за минуту, оплата посекундно.',
      chips: [{ label: 'Смотреть тарифы', quickInput: 'покажи все тарифы' }],
    };
  }

  // Default fallback
  const fallbacks = [
    'Уточните задачу — и я подберу подходящую конфигурацию сервера.',
    'Не совсем понял запрос. Попробуйте: "хочу API", "нужен VPN" или "подними сайт".',
    'Опишите проект подробнее — тип приложения, ожидаемая нагрузка, регион?',
  ];
  return {
    text: fallbacks[Math.floor(Math.random() * fallbacks.length)],
    chips: [
      { label: '🌐 Сайт', quickInput: 'хочу поднять сайт' },
      { label: '🔌 API', quickInput: 'хочу backend API' },
      { label: '❓ Помощь', quickInput: 'что умеешь?' },
    ],
  };
}

// ── Component ──────────────────────────────────────────────────────────────
export function AIAssistantWidget({ mode, environment, attachedVmIds }: AIAssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      from: 'bot',
      text: mode === 'wizard'
        ? 'Привет! Давай соберём инфраструктуру под ваш проект. Что запускаем?'
        : 'Привет! Помогу разобраться с топологией проекта и настройкой портов.',
      chips: [
        { label: '🌐 Сайт', quickInput: 'хочу поднять сайт' },
        { label: '🔌 API', quickInput: 'хочу backend API' },
        { label: '🔒 VPN', quickInput: 'хочу VPN' },
        { label: '🚀 SaaS', quickInput: 'хочу SaaS' },
      ],
      time: nowTime(),
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMessage = (msg: Omit<Message, 'id' | 'time'>) => {
    setMessages((prev) => [...prev, { ...msg, id: uid(), time: nowTime() }]);
  };

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    addMessage({ from: 'user', text: trimmed });
    setInput('');
    setIsTyping(true);

    const delay = 600 + Math.random() * 700;
    setTimeout(() => {
      const response = getBotResponse(trimmed, mode, environment, attachedVmIds);

      if (response.actions?.length) {
        response.actions.forEach((a) => dispatch(a, environment));
      }

      addMessage({
        from: 'bot',
        text: response.text,
        chips: response.chips?.map((c) => ({
          ...c,
          onPress: c.quickInput
            ? () => sendMessage(c.quickInput!)
            : undefined,
        })),
      });
      setIsTyping(false);
    }, delay);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const SUGGESTIONS =
    mode === 'wizard'
      ? ['Поднять сайт', 'Backend API', 'VPN', 'SaaS', 'GPU-задача']
      : ['Граф инфраструктуры', 'Открыть порты', 'Файловый менеджер', 'Что умеешь?'];

  if (!isOpen) {
    return (
      <motion.button
        className="ai-root ai-fab"
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        aria-label="Открыть AI ассистента"
      >
        <Sparkles size={20} />
        <span className="ai-fab-badge" />
      </motion.button>
    );
  }

  return (
    <motion.div
      className="ai-root ai-widget"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
    >
      {/* Header */}
      <div className="ai-header">
        <div className="ai-avatar">
          <Sparkles size={16} color="#fff" />
        </div>
        <div className="ai-header-info">
          <div className="ai-header-name">AI Ассистент</div>
          <div className="ai-header-status">
            <span className="ai-status-dot" />
            Онлайн · IaaS Expert
          </div>
        </div>
        <div className="ai-header-actions">
          <button
            type="button"
            className="ai-hdr-btn"
            onClick={() => setIsMinimized((m) => !m)}
            title={isMinimized ? 'Развернуть' : 'Свернуть'}
          >
            <Minus size={12} />
          </button>
          <button
            type="button"
            className="ai-hdr-btn"
            onClick={() => setIsOpen(false)}
            title="Закрыть"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.div
            key="minimized"
            className="ai-minimized"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {messages[messages.length - 1]?.text.slice(0, 55)}…
          </motion.div>
        ) : (
          <motion.div
            key="full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
          >
            {/* Messages */}
            <div className="ai-messages">
              <div className="ai-day-divider">
                <div className="ai-day-divider-line" />
                <span className="ai-day-divider-text">Сегодня</span>
                <div className="ai-day-divider-line" />
              </div>

              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    className={`ai-msg-row ${msg.from}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {msg.from === 'bot' && (
                      <div className="ai-msg-avatar">
                        <Sparkles size={12} color="#fff" />
                      </div>
                    )}
                    <div className="ai-msg-body">
                      <div className={`ai-bubble ${msg.from}`} style={{ whiteSpace: 'pre-line' }}>
                        {msg.text}
                      </div>
                      {msg.chips && msg.chips.length > 0 && (
                        <div className="ai-action-chips">
                          {msg.chips.map((chip, i) => (
                            <button
                              key={i}
                              type="button"
                              className={`ai-chip${chip.primary ? ' primary' : ''}`}
                              onClick={() =>
                                chip.onPress
                                  ? chip.onPress()
                                  : chip.quickInput
                                  ? sendMessage(chip.quickInput)
                                  : undefined
                              }
                            >
                              {chip.label}
                            </button>
                          ))}
                        </div>
                      )}
                      <span className="ai-msg-time">{msg.time}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    className="ai-typing-row"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="ai-msg-avatar">
                      <Sparkles size={12} color="#fff" />
                    </div>
                    <div className="ai-typing-bubble">
                      <span className="ai-typing-dot" />
                      <span className="ai-typing-dot" />
                      <span className="ai-typing-dot" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef} />
            </div>

            {/* Quick Suggestions */}
            <div className="ai-suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="ai-suggest-btn"
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="ai-input-area">
              <div className="ai-input-row">
                <textarea
                  ref={textareaRef}
                  className="ai-textarea"
                  placeholder="Напишите запрос…"
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  className="ai-send-btn"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isTyping}
                  aria-label="Отправить"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
