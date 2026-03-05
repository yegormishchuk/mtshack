import type { ScenarioStep } from './types';

export const TOTAL_STEPS = 12;

export const SCENARIO: Record<string, ScenarioStep> = {
  // ─── 1. Приветствие ─────────────────────────────────────────
  welcome: {
    id: 'welcome',
    stepIndex: 1,
    totalSteps: TOTAL_STEPS,
    card: {
      title: 'Привет! Я Олег 👋',
      instruction:
        'Помогу развернуть продукт на сервере за пару минут. Отвечай на кнопки — я всё настрою сам.',
      hint: 'Полностью автоматический режим',
      primaryAction: {
        label: 'Давай!',
        event: 'LETS_GO',
        icon: 'rocket',
      },
      secondaryButtons: [],
      accordionText:
        'Я проведу тебя через весь процесс: выбор конфигурации, создание сервера, загрузку файлов и запуск проекта. Никакого DevOps — только кнопки.',
    },
    spotlightTarget: 'hero-cta',
    spotlightTooltip: 'Нажми "Давай!" чтобы начать',
    transitions: {
      LETS_GO: 'ask-type',
    },
  },

  // ─── 2. Что запускаем? ──────────────────────────────────────
  'ask-type': {
    id: 'ask-type',
    stepIndex: 2,
    totalSteps: TOTAL_STEPS,
    navigateTo: '/build',
    card: {
      title: 'Что запускаем?',
      instruction: 'Выбери тип проекта — я подберу оптимальный сервер.',
      primaryAction: {
        label: '🌐 Web App',
        event: 'TYPE_SELECTED',
        icon: 'globe',
      },
      secondaryButtons: [
        { id: 'bot', label: '🤖 Telegram Bot', event: 'TYPE_SELECTED', value: 'bot', group: 'type' },
        { id: 'gpu', label: '🚀 GPU Task', event: 'TYPE_SELECTED', value: 'gpu', group: 'type' },
        { id: 'static', label: '📄 Static Site', event: 'TYPE_SELECTED', value: 'static', group: 'type' },
      ],
      accordionText: 'Тип проекта влияет на рекомендуемую конфигурацию CPU/RAM и операционную систему.',
    },
    transitions: {
      TYPE_SELECTED: 'ask-users',
    },
  },

  // ─── 3. Сколько пользователей? ──────────────────────────────
  'ask-users': {
    id: 'ask-users',
    stepIndex: 3,
    totalSteps: TOTAL_STEPS,
    card: {
      title: 'Сколько пользователей?',
      instruction: 'Ожидаемая нагрузка определяет размер сервера.',
      primaryAction: {
        label: 'До 100',
        event: 'USERS_SELECTED',
        icon: 'users',
      },
      secondaryButtons: [
        { id: 'u-medium', label: '100 – 1к', event: 'USERS_SELECTED', value: 'medium', group: 'users' },
        { id: 'u-large', label: '1к – 10к', event: 'USERS_SELECTED', value: 'large', group: 'users' },
        { id: 'u-xlarge', label: '10к+', event: 'USERS_SELECTED', value: 'xlarge', group: 'users' },
      ],
      accordionText: 'До 100 — достаточно 1 CPU / 2 ГБ RAM. 100-1k — 2 CPU / 4 ГБ. 1k-10k — 3-4 CPU / 6-8 ГБ.',
    },
    transitions: {
      USERS_SELECTED: 'ask-region-target',
    },
  },

  // ─── 4. Аудитория ───────────────────────────────────────────
  'ask-region-target': {
    id: 'ask-region-target',
    stepIndex: 4,
    totalSteps: TOTAL_STEPS,
    card: {
      title: 'Где аудитория?',
      instruction: 'Выберем ближайший дата-центр — меньше задержка.',
      primaryAction: {
        label: '🇪🇺 Европа',
        event: 'REGION_TARGET_SELECTED',
        icon: 'map-pin',
      },
      secondaryButtons: [
        { id: 'rt-usa', label: '🇺🇸 США', event: 'REGION_TARGET_SELECTED', value: 'usa', group: 'regionTarget' },
        { id: 'rt-asia', label: '🌏 Азия', event: 'REGION_TARGET_SELECTED', value: 'asia', group: 'regionTarget' },
        { id: 'rt-cis', label: '🇧🇾 СНГ', event: 'REGION_TARGET_SELECTED', value: 'cis', group: 'regionTarget' },
      ],
      accordionText: 'Европа → Франкфурт (~5мс из Берлина). США → Нью-Йорк. Азия → Сингапур. СНГ → Минск (~2мс из Беларуси).',
    },
    transitions: {
      REGION_TARGET_SELECTED: 'ask-billing',
    },
  },

  // ─── 5. Оплата ──────────────────────────────────────────────
  'ask-billing': {
    id: 'ask-billing',
    stepIndex: 5,
    totalSteps: TOTAL_STEPS,
    card: {
      title: 'Как платить?',
      instruction: 'Ежегодная оплата даёт скидку ~20%.',
      primaryAction: {
        label: '📅 Ежемесячно',
        event: 'BILLING_SELECTED',
        icon: 'calendar',
      },
      secondaryButtons: [
        { id: 'b-yearly', label: '🎁 Ежегодно (−20%)', event: 'BILLING_SELECTED', value: 'yearly', group: 'billing' },
        { id: 'b-payg', label: '⚡ Pay-as-you-go', event: 'BILLING_SELECTED', value: 'payg', group: 'billing' },
      ],
      accordionText: 'Pay-as-you-go тарифицируется посекундно — выгодно для тестов. Ежегодный тариф фиксирует цену и даёт -20%.',
    },
    transitions: {
      BILLING_SELECTED: 'build-config',
    },
  },

  // ─── 6. Олег выбирает конфигурацию ──────────────────────────
  'build-config': {
    id: 'build-config',
    stepIndex: 6,
    totalSteps: TOTAL_STEPS,
    card: {
      title: 'Я выбрал конфигурацию',
      instruction: 'Подобрал оптимальный тариф, ОС и регион под твои ответы. Проверь — и оформим!',
      hint: 'Выделено красным на странице',
      primaryAction: {
        label: '✅ Оформить и создать сервер',
        event: 'BUILD_CONFIRMED',
        icon: 'check',
      },
      secondaryButtons: [
        { id: 'bc-change', label: 'Изменить выбор', event: 'BUILD_CHANGE', value: 'change' },
      ],
      accordionText: 'Конфигурация подобрана автоматически на основе типа проекта, нагрузки и региона аудитории. Ты всегда можешь масштабировать без остановки.',
    },
    spotlightTarget: 'oleg-plan-card',
    spotlightTooltip: 'Выбрано Олегом',
    transitions: {
      BUILD_CONFIRMED: 'provision',
      BUILD_CHANGE: 'build-config',
    },
  },

  // ─── 7. Провизионирование ────────────────────────────────────
  provision: {
    id: 'provision',
    stepIndex: 7,
    totalSteps: TOTAL_STEPS,
    card: {
      title: 'Создаём сервер...',
      instruction: 'Подбираю железо, настраиваю сеть, устанавливаю Docker.',
      hint: 'Обычно 15–30 секунд',
      primaryAction: {
        label: '🚀 Запустить создание',
        event: 'PROVISION_STARTED',
        icon: 'rocket',
      },
      secondaryButtons: [],
      accordionText: 'Создаём виртуальную машину на физическом железе в выбранном дата-центре, настраиваем сеть и firewall, устанавливаем базовое ПО.',
      isProvision: true,
      showProgress: true,
      showLogs: true,
    },
    transitions: {
      PROVISION_STARTED: 'provision',
      PROVISION_COMPLETE: 'console-setup',
    },
  },

  // ─── 8. Настройка консоли ───────────────────────────────────
  'console-setup': {
    id: 'console-setup',
    stepIndex: 8,
    totalSteps: TOTAL_STEPS,
    navigateTo: '/console',
    card: {
      title: 'Настроим окружение',
      instruction: 'Обновим пакеты, установим Docker и подготовим папку проекта.',
      hint: 'Нажми кнопку — я вставлю и выполню команду',
      primaryAction: {
        label: '⚡ Выполнить следующую команду',
        event: 'CONSOLE_NEXT_CMD',
        icon: 'terminal',
      },
      secondaryButtons: [],
      isConsoleSetup: true,
      accordionText: 'sudo apt update обновит список пакетов. Docker нужен для запуска твоего приложения в контейнере — изолированно и безопасно.',
    },
    spotlightTarget: 'console-input',
    spotlightTooltip: 'Введи команду здесь',
    transitions: {
      CONSOLE_NEXT_CMD: 'console-setup',
      CONSOLE_SETUP_DONE: 'files-intro',
    },
  },

  // ─── 9. Загрузка файлов ─────────────────────────────────────
  'files-intro': {
    id: 'files-intro',
    stepIndex: 9,
    totalSteps: TOTAL_STEPS,
    navigateTo: '/files',
    card: {
      title: 'Загрузим файлы проекта',
      instruction: 'Перетащи папку или выбери файлы. Я проверю что загружать безопасно.',
      hint: 'Я предупрежу о лишних/опасных файлах',
      primaryAction: {
        label: '📁 Открыть файловый менеджер',
        event: 'FILES_OPEN',
        icon: 'folder',
      },
      secondaryButtons: [],
      isFilesReview: true,
      accordionText: 'Я автоматически обнаружу .env, приватные ключи (.pem, id_rsa), папки node_modules и .git — их не стоит загружать на сервер.',
    },
    spotlightTarget: 'files-dropzone',
    spotlightTooltip: 'Перетащи файлы сюда',
    transitions: {
      FILES_OPEN: 'files-intro',
      FILES_UPLOADED: 'files-review',
    },
  },

  // ─── 10. Анализ файлов ──────────────────────────────────────
  'files-review': {
    id: 'files-review',
    stepIndex: 10,
    totalSteps: TOTAL_STEPS,
    card: {
      title: 'Проверил файлы',
      instruction: 'Нашёл потенциально опасные или лишние файлы. Рекомендую их убрать.',
      hint: 'Выделено красным на странице',
      primaryAction: {
        label: '🗑️ Удалить всё лишнее (рек.)',
        event: 'FILES_CLEAN',
        icon: 'trash',
      },
      secondaryButtons: [
        { id: 'fr-keep', label: 'Оставить всё', event: 'FILES_KEEP', value: 'keep' },
      ],
      isFilesReview: true,
      accordionText: '.env файлы содержат секреты (пароли, API ключи). node_modules — сотни МБ лишних данных. .git — история изменений с возможными секретами.',
    },
    spotlightTarget: 'files-list',
    spotlightTooltip: 'Отмеченные файлы лучше не загружать',
    transitions: {
      FILES_CLEAN: 'run-project',
      FILES_KEEP: 'run-project',
    },
  },

  // ─── 11. Запуск проекта ─────────────────────────────────────
  'run-project': {
    id: 'run-project',
    stepIndex: 11,
    totalSteps: TOTAL_STEPS,
    navigateTo: '/console',
    card: {
      title: 'Запускаем проект!',
      instruction: 'Определил тип проекта по файлам. Выполни команды — и продукт будет работать.',
      hint: 'Нажми кнопку — я вставлю и выполню',
      primaryAction: {
        label: '⚡ Выполнить следующую команду',
        event: 'RUN_NEXT_CMD',
        icon: 'play',
      },
      secondaryButtons: [],
      isRunProject: true,
      accordionText: 'Команды запуска определяются автоматически по наличию package.json, requirements.txt или Dockerfile.',
    },
    spotlightTarget: 'console-input',
    spotlightTooltip: 'Следующая команда',
    transitions: {
      RUN_NEXT_CMD: 'run-project',
      PROJECT_RUNNING: 'project-done',
    },
  },

  // ─── 12a. Проект запущен ────────────────────────────────────
  'project-done': {
    id: 'project-done',
    stepIndex: 12,
    totalSteps: TOTAL_STEPS,
    card: {
      title: '🎉 Продукт запущен!',
      instruction: 'Сервер работает. Теперь настроим безопасность.',
      hint: 'IP: 185.12.44.201',
      primaryAction: {
        label: '🔒 Перейти к безопасности',
        event: 'START_TOUR',
        icon: 'shield',
      },
      secondaryButtons: [
        { id: 'pd-open', label: '🌐 Открыть продукт', event: 'OPEN_PRODUCT', value: 'open' },
        { id: 'pd-status', label: '📊 Статус сервера', event: 'CHECK_STATUS', value: 'status' },
      ],
      isDone: true,
      accordionText: 'Продукт доступен по IP 185.12.44.201. Для привязки домена перейди в настройки сети. Настройка безопасности займёт 2 минуты.',
    },
    transitions: {
      START_TOUR: 'security-tour',
      OPEN_PRODUCT: 'project-done',
      CHECK_STATUS: 'project-done',
    },
  },

  // ─── 12b. Тур по продукту ───────────────────────────────────
  'security-tour': {
    id: 'security-tour',
    stepIndex: 12,
    totalSteps: TOTAL_STEPS,
    navigateTo: '/servers',
    card: {
      title: 'Тур по продукту',
      instruction: 'Покажу все ключевые разделы: сервера, безопасность, файлы и счета.',
      hint: '9 шагов — кратко и по делу',
      primaryAction: {
        label: '→ Понял, дальше',
        event: 'TOUR_NEXT',
        icon: 'arrow-right',
      },
      secondaryButtons: [
        { id: 'tour-skip', label: 'Пропустить тур', event: 'TOUR_SKIP', value: 'skip' },
      ],
      isTour: true,
      accordionText: 'Тур охватывает: статус сервера, мониторинг, консоль, файловый менеджер, firewall, резервные копии, баланс, счета и способ оплаты.',
    },
    transitions: {
      TOUR_NEXT: 'security-tour',
      TOUR_SKIP: 'tour-done',
      TOUR_DONE: 'tour-done',
    },
  },

  // ─── 12c. Тур завершён ──────────────────────────────────────
  'tour-done': {
    id: 'tour-done',
    stepIndex: 12,
    totalSteps: TOTAL_STEPS,
    card: {
      title: 'Готово! 🎉',
      instruction: 'Ты полностью ориентируешься в продукте. Сервер запущен и готов к работе.',
      hint: 'Можешь открыть продукт по IP',
      primaryAction: {
        label: '✓ Закрыть тур',
        event: 'TOUR_CLOSE',
        icon: 'check',
      },
      secondaryButtons: [
        { id: 'open-product', label: '🌐 Открыть продукт', event: 'OPEN_PRODUCT', value: 'open' },
      ],
      isDone: true,
      accordionText: 'Ты прошёл полный тур: сервера, мониторинг, консоль, файлы, безопасность, резервные копии и счета. Продукт доступен по адресу http://185.12.44.201.',
    },
    transitions: {
      TOUR_CLOSE: 'tour-done',
      OPEN_PRODUCT: 'tour-done',
    },
  },
};

export const STEP_ORDER = [
  'welcome',
  'ask-type',
  'ask-users',
  'ask-region-target',
  'ask-billing',
  'build-config',
  'provision',
  'console-setup',
  'files-intro',
  'files-review',
  'run-project',
  'project-done',
  'security-tour',
  'tour-done',
] as const;

export type StepId = (typeof STEP_ORDER)[number];

// Console setup commands
export const CONSOLE_SETUP_CMDS = [
  { cmd: 'sudo apt update', label: 'Обновить пакеты', outputLines: [
    'Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease',
    'Get:2 http://security.ubuntu.com/ubuntu jammy-security InRelease [110 kB]',
    'Fetched 3,456 kB in 2s (1,728 kB/s)',
    'Reading package lists... Done',
    'Building dependency tree... Done',
    '✓ Packages up to date',
  ]},
  { cmd: 'curl -fsSL https://get.docker.com | sh', label: 'Установить Docker', outputLines: [
    '# Executing docker install script',
    '+ sh -c apt-get update -qq >/dev/null',
    '+ sh -c apt-get install -y -qq docker-ce docker-ce-cli containerd.io',
    'Selecting previously unselected package docker-ce.',
    'Processing triggers for systemd (249.11-0ubuntu3.9)...',
    'Docker version 24.0.7, build afdd53b',
    '✓ Docker installed successfully',
  ]},
  { cmd: 'mkdir -p app && cd app', label: 'Создать папку проекта', outputLines: [
    '$ mkdir -p app && cd app',
    '✓ Directory /root/app created',
    '✓ Changed to /root/app',
  ]},
] as const;

// Run project commands by type
export const RUN_CMDS: Record<string, Array<{ cmd: string; label: string; outputLines: string[] }>> = {
  node: [
    { cmd: 'npm install', label: 'Установить зависимости', outputLines: [
      'npm warn deprecated some-package@1.0.0',
      'added 847 packages, and audited 848 packages in 12s',
      '✓ npm install complete',
    ]},
    { cmd: 'npm run build', label: 'Собрать проект', outputLines: [
      '> my-app@1.0.0 build',
      '> vite build',
      'vite v5.0.0 building for production...',
      '✓ built in 2.84s',
    ]},
    { cmd: 'npm start', label: 'Запустить сервер', outputLines: [
      '> my-app@1.0.0 start',
      '> node server.js',
      'Server running on http://0.0.0.0:3000',
      '✓ Application started successfully',
    ]},
  ],
  python: [
    { cmd: 'python -m venv venv && source venv/bin/activate', label: 'Создать venv', outputLines: [
      '$ python -m venv venv',
      '✓ Virtual environment created',
      '$ source venv/bin/activate',
      '(venv) ✓',
    ]},
    { cmd: 'pip install -r requirements.txt', label: 'Установить пакеты', outputLines: [
      'Collecting flask==3.0.0',
      'Collecting gunicorn==21.2.0',
      'Installing collected packages: flask, gunicorn',
      '✓ Successfully installed 12 packages',
    ]},
    { cmd: 'gunicorn app:app -b 0.0.0.0:3000 --daemon', label: 'Запустить приложение', outputLines: [
      '[2024-01-15 10:23:45 +0000] [1234] [INFO] Starting gunicorn 21.2.0',
      '[2024-01-15 10:23:45 +0000] [1234] [INFO] Listening at: http://0.0.0.0:3000',
      '✓ Application running in background',
    ]},
  ],
  docker: [
    { cmd: 'docker build -t app .', label: 'Собрать Docker образ', outputLines: [
      '[+] Building 12.4s (10/10) FINISHED',
      ' => [1/4] FROM docker.io/library/node:18-alpine',
      ' => [2/4] COPY package*.json ./',
      ' => [3/4] RUN npm ci --only=production',
      ' => [4/4] COPY . .',
      '✓ Successfully built app:latest',
    ]},
    { cmd: 'docker run -d -p 80:3000 --name app app', label: 'Запустить контейнер', outputLines: [
      'a7f3c8d9e2b1f4a5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
      '✓ Container started',
      '✓ Mapped port 80 → 3000',
      '✓ Application accessible at http://185.12.44.201',
    ]},
  ],
  generic: [
    { cmd: 'ls -la', label: 'Просмотреть файлы', outputLines: [
      'total 48',
      'drwxr-xr-x 2 root root 4096 Jan 15 10:20 .',
      '-rw-r--r-- 1 root root  342 Jan 15 10:18 index.html',
      '-rw-r--r-- 1 root root 2841 Jan 15 10:18 app.js',
      '✓ Files ready',
    ]},
    { cmd: 'python3 -m http.server 3000 &', label: 'Запустить HTTP сервер', outputLines: [
      'Serving HTTP on 0.0.0.0 port 3000 (http://0.0.0.0:3000/) ...',
      '✓ Static server running on port 3000',
    ]},
  ],
};

// Product tour stops — navigateTo triggers route change before spotlight
export const TOUR_STOPS: ReadonlyArray<{
  readonly target: string;
  readonly label: string;
  readonly desc: string;
  readonly navigateTo?: string;
}> = [
  {
    target: 'server-status',
    label: 'Статус сервера',
    desc: 'Здесь статус сервера и IP-адрес для подключения. Зелёный — всё работает.',
    navigateTo: '/servers',
  },
  {
    target: 'tour-monitoring',
    label: 'Мониторинг',
    desc: 'Графики CPU, RAM и трафика в реальном времени. Аномальные пики — сигнал проблемы.',
    navigateTo: '/servers',
  },
  {
    target: 'open-console',
    label: 'Консоль',
    desc: 'SSH-доступ прямо из браузера. Вводи команды без терминала на компьютере.',
    navigateTo: '/servers',
  },
  {
    target: 'open-files',
    label: 'Файловый менеджер',
    desc: 'Загружай и управляй файлами на сервере. Олег проверит безопасность при загрузке.',
    navigateTo: '/servers',
  },
  {
    target: 'tour-firewall',
    label: 'Firewall / Безопасность',
    desc: 'Открытые порты и SSH-ключи. Оставь только 80, 443 и свой SSH-порт.',
    navigateTo: '/servers',
  },
  {
    target: 'tour-backups',
    label: 'Резервные копии',
    desc: 'Снапшоты каждые 24 часа. Откат к любой точке — "машина времени" для сервера.',
    navigateTo: '/servers',
  },
  {
    target: 'billing-summary',
    label: 'Счета — баланс',
    desc: 'Текущий баланс и прогноз расходов. Пополняй вовремя — сервер не остановится.',
    navigateTo: '/billing',
  },
  {
    target: 'billing-invoices',
    label: 'История платежей',
    desc: 'Все счета и платежи за всё время. Экспорт в CSV для бухгалтерии.',
    navigateTo: '/billing',
  },
  {
    target: 'billing-payment-method',
    label: 'Способ оплаты',
    desc: 'Привязанные карты и автосписание. Добавляй карты безопасно — данные шифруются.',
    navigateTo: '/billing',
  },
];
