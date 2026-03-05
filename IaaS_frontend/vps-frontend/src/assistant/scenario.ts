import type { ScenarioStep } from './types';

export const TOTAL_STEPS = 7;

export const SCENARIO: Record<string, ScenarioStep> = {
  welcome: {
    id: 'welcome',
    stepIndex: 1,
    totalSteps: TOTAL_STEPS,
    card: {
      title: 'Что запускаем?',
      instruction:
        'Выберите тип проекта или доверьтесь автопилоту — он подберёт оптимальную конфигурацию за вас.',
      hint: 'Автопилот рекомендован для быстрого старта',
      primaryAction: {
        label: '⚡ Автопилот: выбрать за меня',
        event: 'AUTOPILOT_SELECTED',
        icon: 'zap',
      },
      secondaryButtons: [
        { id: 'webapp', label: '🌐 Web App', event: 'TYPE_SELECTED', value: 'webapp' },
        { id: 'bot', label: '🤖 Telegram Bot', event: 'TYPE_SELECTED', value: 'bot' },
        { id: 'gpu', label: '🚀 GPU Task', event: 'TYPE_SELECTED', value: 'gpu' },
        { id: 'static', label: '📄 Static Site', event: 'TYPE_SELECTED', value: 'static' },
      ],
      accordionText:
        'Автопилот анализирует популярные сценарии и выбирает оптимальный сервер, регион и метод деплоя. Вы можете изменить любой параметр вручную на следующих шагах.',
    },
    transitions: {
      AUTOPILOT_SELECTED: 'server-config',
      TYPE_SELECTED: 'server-config',
    },
  },

  'server-config': {
    id: 'server-config',
    stepIndex: 2,
    totalSteps: TOTAL_STEPS,
    card: {
      title: 'Конфигурация сервера',
      instruction:
        'Рекомендованная конфигурация уже выбрана. Подтвердите или выберите вручную.',
      hint: 'Оптимально для большинства веб-приложений',
      primaryAction: {
        label: '✓ Применить рекомендованную',
        event: 'CONFIG_APPLIED',
        icon: 'check',
      },
      secondaryButtons: [
        {
          id: 'cpu-standard',
          label: 'Стандарт — 2 CPU / 4 ГБ / 50 ГБ',
          event: 'CONFIG_SELECTED',
          value: 'standard',
          group: 'config',
        },
        {
          id: 'cpu-balance',
          label: 'Баланс — 3 CPU / 6 ГБ / 75 ГБ',
          event: 'CONFIG_SELECTED',
          value: 'balance',
          group: 'config',
        },
        {
          id: 'cpu-optimum',
          label: 'Оптимум — 4 CPU / 8 ГБ / 100 ГБ',
          event: 'CONFIG_SELECTED',
          value: 'optimum',
          group: 'config',
        },
      ],
      accordionText:
        'Стандартный тариф включает 2 vCPU, 4 ГБ RAM и 50 ГБ SSD. Достаточно для обработки до 500 одновременных пользователей. Масштабируется в любой момент без остановки сервера.',
    },
    spotlightTarget: 'server-config',
    spotlightTooltip: 'Выберите конфигурацию сервера',
    transitions: {
      CONFIG_APPLIED: 'region',
      CONFIG_SELECTED: 'region',
    },
  },

  region: {
    id: 'region',
    stepIndex: 3,
    totalSteps: TOTAL_STEPS,
    card: {
      title: 'Выбор региона',
      instruction:
        'Выберите ближайший к вашим пользователям дата-центр для минимальной задержки.',
      hint: 'Германия — оптимально для Европы',
      primaryAction: {
        label: '🇩🇪 Германия, Франкфурт (рек.)',
        event: 'REGION_SELECTED',
        icon: 'map-pin',
      },
      secondaryButtons: [
        {
          id: 'region-by',
          label: '🇧🇾 Беларусь, Минск',
          event: 'REGION_SELECTED',
          value: 'by-minsk',
          group: 'region',
        },
        {
          id: 'region-us',
          label: '🇺🇸 США, Нью-Йорк',
          event: 'REGION_SELECTED',
          value: 'us-newyork',
          group: 'region',
        },
        {
          id: 'region-nl',
          label: '🇳🇱 Нидерланды, Амстердам',
          event: 'REGION_SELECTED',
          value: 'nl-amsterdam',
          group: 'region',
        },
        {
          id: 'region-sg',
          label: '🇸🇬 Сингапур',
          event: 'REGION_SELECTED',
          value: 'sg-singapore',
          group: 'region',
        },
      ],
      accordionText:
        'Пинг от Берлина до Франкфурта — ~5 мс. Минск — ~2 мс от Беларуси, ~40 мс от Европы. Рекомендуем выбирать регион ближе к основной аудитории.',
    },
    spotlightTarget: 'region-select',
    spotlightTooltip: '← Кликните здесь, чтобы выбрать регион',
    transitions: {
      REGION_SELECTED: 'deploy-method',
    },
  },

  'deploy-method': {
    id: 'deploy-method',
    stepIndex: 4,
    totalSteps: TOTAL_STEPS,
    card: {
      title: 'Способ деплоя',
      instruction: 'Как вы хотите развернуть приложение на сервере?',
      hint: 'GitHub — самый быстрый путь до прода',
      primaryAction: {
        label: '🐙 GitHub репозиторий',
        event: 'METHOD_SELECTED',
        icon: 'github',
      },
      secondaryButtons: [
        {
          id: 'docker',
          label: '🐳 Docker Image',
          event: 'METHOD_SELECTED',
          value: 'docker',
        },
        {
          id: 'upload',
          label: '📦 Upload ZIP',
          event: 'METHOD_SELECTED',
          value: 'upload',
        },
      ],
      accordionText:
        'При деплое через GitHub мы подключаемся к репозиторию и автоматически запускаем CI/CD при каждом push в main. Поддерживаются все популярные языки и фреймворки.',
    },
    transitions: {
      METHOD_SELECTED: 'env-vars',
    },
  },

  'env-vars': {
    id: 'env-vars',
    stepIndex: 5,
    totalSteps: TOTAL_STEPS,
    card: {
      title: 'Переменные окружения',
      instruction: 'Добавьте переменные или пропустите этот шаг — изменить можно позже.',
      hint: 'Секреты хранятся в зашифрованном виде',
      primaryAction: {
        label: '🔑 Сохранить и продолжить',
        event: 'ENV_SAVED',
        icon: 'key',
      },
      secondaryButtons: [
        { id: 'skip', label: 'Пропустить', event: 'ENV_SKIPPED', value: 'skip' },
      ],
      accordionText:
        'Переменные окружения недоступны в логах и коде репозитория. Они передаются в контейнер в момент запуска. Изменить можно без перезапуска сервера.',
      showEnvForm: true,
    },
    transitions: {
      ENV_SAVED: 'deploy',
      ENV_SKIPPED: 'deploy',
    },
  },

  deploy: {
    id: 'deploy',
    stepIndex: 6,
    totalSteps: TOTAL_STEPS,
    card: {
      title: 'Запуск сервера',
      instruction: 'Создаём и настраиваем вашу инфраструктуру...',
      hint: 'Обычно занимает 30–60 секунд',
      primaryAction: {
        label: '🚀 Запустить деплой',
        event: 'DEPLOY_STARTED',
        icon: 'rocket',
      },
      secondaryButtons: [],
      accordionText:
        'Мы создаём виртуальную машину, настраиваем сеть, устанавливаем Docker и разворачиваем ваш контейнер. После завершения сервер будет доступен по публичному IP.',
      showProgress: true,
      showLogs: true,
    },
    transitions: {
      DEPLOY_STARTED: 'deploy',
      DEPLOY_COMPLETE: 'done',
    },
  },

  done: {
    id: 'done',
    stepIndex: 7,
    totalSteps: TOTAL_STEPS,
    card: {
      title: '🎉 Приложение запущено!',
      instruction: 'Ваш сервер работает и доступен по IP: 185.12.44.201',
      hint: 'Аптайм гарантирован по SLA 99.9%',
      primaryAction: {
        label: '🌐 Открыть приложение',
        event: 'OPEN_APP',
        icon: 'external-link',
      },
      secondaryButtons: [
        { id: 'domain', label: '🔗 Добавить домен', event: 'ADD_DOMAIN', value: 'domain' },
        { id: 'backups', label: '💾 Включить бэкапы', event: 'ENABLE_BACKUPS', value: 'backups' },
        { id: 'monitor', label: '📊 Мониторинг', event: 'OPEN_MONITOR', value: 'monitor' },
      ],
      accordionText:
        'Для добавления домена перейдите в раздел "Сеть" и привяжите DNS-запись A к IP 185.12.44.201. Бэкапы создаются ежедневно и хранятся 7 дней.',
      isDone: true,
    },
    transitions: {
      OPEN_APP: 'done',
      ADD_DOMAIN: 'done',
      ENABLE_BACKUPS: 'done',
      OPEN_MONITOR: 'done',
    },
  },
};

export const STEP_ORDER = [
  'welcome',
  'server-config',
  'region',
  'deploy-method',
  'env-vars',
  'deploy',
  'done',
] as const;

export type StepId = (typeof STEP_ORDER)[number];
