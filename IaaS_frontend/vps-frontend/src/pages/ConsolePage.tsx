import { useEffect, useRef, useState } from 'react';
import { Terminal, Copy, Trash2, RefreshCw, Wifi } from 'lucide-react';
import { useAssistantStore } from '../assistant/store';
import { eventBus, EVENTS } from '../assistant/eventBus';
import './ConsolePage.css';

interface OutputLine {
  id: string;
  type: 'cmd' | 'output' | 'error' | 'info';
  text: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

// Mock command runner — returns output lines for known commands
function runMockCommand(input: string): string[] {
  const cmd = input.trim();

  if (cmd.startsWith('sudo apt update')) {
    return [
      'Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease',
      'Get:2 http://security.ubuntu.com/ubuntu jammy-security InRelease [110 kB]',
      'Get:3 http://archive.ubuntu.com/ubuntu jammy-updates InRelease [119 kB]',
      'Fetched 3,456 kB in 2s (1,728 kB/s)',
      'Reading package lists... Done',
      'Building dependency tree... Done',
      'Reading state information... Done',
      '247 packages can be upgraded.',
      '✓ Packages list updated',
    ];
  }

  if (cmd.startsWith('curl -fsSL https://get.docker.com')) {
    return [
      '# Executing docker install script, commit: 4e6bb4b',
      '+ sh -c apt-get update -qq >/dev/null',
      '+ sh -c DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker-ce',
      'Selecting previously unselected package docker-ce-cli.',
      'Selecting previously unselected package docker-ce.',
      'Setting up docker-ce (5:24.0.7-1~ubuntu.22.04~jammy)...',
      'Created symlink /etc/systemd/system/multi-user.target.wants/docker.service',
      'Docker version 24.0.7, build afdd53b',
      '✓ Docker installed successfully',
    ];
  }

  if (cmd.startsWith('mkdir -p app')) {
    return [
      '$ mkdir -p app && cd app',
      '✓ Directory /root/app created',
      '✓ Working directory: /root/app',
    ];
  }

  if (cmd.startsWith('npm install')) {
    return [
      'npm warn deprecated inflight@1.0.6',
      'npm warn deprecated glob@7.2.3',
      'added 847 packages, and audited 848 packages in 12s',
      '98 packages are looking for funding',
      'found 0 vulnerabilities',
      '✓ npm install complete',
    ];
  }

  if (cmd.startsWith('npm run build')) {
    return [
      '> my-app@1.0.0 build',
      '> vite build',
      '',
      'vite v5.0.0 building for production...',
      '✓ 1847 modules transformed.',
      'dist/index.html                   0.46 kB │ gzip:  0.30 kB',
      'dist/assets/index-DiwrgTda.css   28.26 kB │ gzip:  5.25 kB',
      'dist/assets/index-C1a7aaLL.js   143.55 kB │ gzip: 46.04 kB',
      '✓ built in 2.84s',
    ];
  }

  if (cmd.startsWith('npm start')) {
    return [
      '> my-app@1.0.0 start',
      '> node server.js',
      '',
      'Server running on http://0.0.0.0:3000',
      '✓ Application started successfully',
      '✓ Listening on port 3000',
    ];
  }

  if (cmd.startsWith('python -m venv')) {
    return [
      '$ python -m venv venv',
      '✓ Virtual environment created at /root/app/venv',
      '$ source venv/bin/activate',
      '(venv) ✓ Environment activated',
    ];
  }

  if (cmd.startsWith('pip install')) {
    return [
      'Collecting flask==3.0.0',
      '  Downloading flask-3.0.0-py3-none-any.whl (99 kB)',
      'Collecting gunicorn==21.2.0',
      '  Downloading gunicorn-21.2.0-py3-none-any.whl (84 kB)',
      'Installing collected packages: flask, gunicorn, werkzeug',
      '✓ Successfully installed 12 packages',
    ];
  }

  if (cmd.startsWith('gunicorn')) {
    return [
      '[2024-01-15 10:23:45 +0000] [1234] [INFO] Starting gunicorn 21.2.0',
      '[2024-01-15 10:23:45 +0000] [1234] [INFO] Listening at: http://0.0.0.0:3000',
      '[2024-01-15 10:23:45 +0000] [1234] [INFO] Using worker: sync',
      '[2024-01-15 10:23:45 +0000] [1236] [INFO] Booting worker with pid: 1236',
      '✓ Application running in background on port 3000',
    ];
  }

  if (cmd.startsWith('docker build')) {
    return [
      '[+] Building 12.4s (10/10) FINISHED                          docker:default',
      ' => [internal] load build definition from Dockerfile               0.0s',
      ' => [1/4] FROM docker.io/library/node:18-alpine                    2.1s',
      ' => [2/4] WORKDIR /app                                             0.0s',
      ' => [3/4] RUN npm ci --only=production                             8.2s',
      ' => [4/4] COPY . .                                                 0.1s',
      ' => exporting to image                                             0.6s',
      '✓ Successfully built app:latest',
    ];
  }

  if (cmd.startsWith('docker run')) {
    return [
      'a7f3c8d9e2b1f4a5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5',
      '✓ Container started as "app"',
      '✓ Port mapping: 80 → 3000',
      '✓ Application accessible at http://185.12.44.201',
    ];
  }

  if (cmd.startsWith('ls')) {
    return [
      'total 48',
      'drwxr-xr-x 2 root root 4096 Jan 15 10:20 .',
      'drwxr-xr-x 8 root root 4096 Jan 15 10:18 ..',
      '-rw-r--r-- 1 root root  342 Jan 15 10:18 index.html',
      '-rw-r--r-- 1 root root 2841 Jan 15 10:18 app.js',
      '-rw-r--r-- 1 root root  156 Jan 15 10:17 package.json',
    ];
  }

  if (cmd.startsWith('python3 -m http.server')) {
    return [
      'Serving HTTP on 0.0.0.0 port 3000 (http://0.0.0.0:3000/) ...',
      '✓ Static server running on port 3000',
      '✓ Accessible at http://185.12.44.201:3000',
    ];
  }

  if (cmd === 'clear' || cmd === 'cls') {
    return ['__CLEAR__'];
  }

  // Generic fallback
  return [`bash: ${cmd.split(' ')[0]}: command not found`];
}

export function ConsolePage() {
  const [lines, setLines] = useState<OutputLine[]>([
    {
      id: uid(),
      type: 'info',
      text: '─────────────────────────────────────────────────────────',
    },
    {
      id: uid(),
      type: 'info',
      text: 'Ubuntu 22.04.3 LTS  |  root@185.12.44.201  |  SSH secured',
    },
    {
      id: uid(),
      type: 'info',
      text: '─────────────────────────────────────────────────────────',
    },
    { id: uid(), type: 'info', text: '' },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { appState } = useAssistantStore();

  const scrollToBottom = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [lines]);

  // Listen to event bus for Oleg's "run command" events
  useEffect(() => {
    const off = eventBus.on(EVENTS.CONSOLE_RUN_CMD, (payload) => {
      const p = payload as { cmd: string; outputLines: string[] };
      runCommandWithOutput(p.cmd, p.outputLines);
    });
    return off;
  }, []);

  const runCommandWithOutput = (cmd: string, outputLines: string[]) => {
    setIsRunning(true);
    setInputVal('');

    // Add command line
    setLines((prev) => [
      ...prev,
      { id: uid(), type: 'cmd', text: `root@185.12.44.201:~# ${cmd}` },
    ]);

    // Simulate progressive output
    outputLines.forEach((line, i) => {
      setTimeout(() => {
        if (line === '__CLEAR__') {
          setLines([]);
          return;
        }
        setLines((prev) => [...prev, { id: uid(), type: 'output', text: line }]);
        if (i === outputLines.length - 1) {
          setTimeout(() => {
            setLines((prev) => [...prev, { id: uid(), type: 'info', text: '' }]);
            setIsRunning(false);
            eventBus.emit(EVENTS.CONSOLE_CMD_OK, { cmd });
          }, 100);
        }
      }, 200 + i * 120);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isRunning) return;

    const cmd = inputVal.trim();
    const output = runMockCommand(cmd);
    runCommandWithOutput(cmd, output);
  };

  const handleClear = () => {
    setLines([]);
    inputRef.current?.focus();
  };

  const handleCopy = () => {
    const text = lines.map((l) => l.text).join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const serverInfo = {
    ip: appState.serverIp ?? '185.12.44.201',
    status: appState.serverStatus === 'running' ? 'running' : 'running',
    region: appState.region ?? 'de-frankfurt',
    os: appState.olegOs ? appState.olegOs.charAt(0).toUpperCase() + appState.olegOs.slice(1) : 'Ubuntu 22.04',
    plan: appState.olegPlan ?? 'standard',
  };

  return (
    <div className="console-root">
      {/* Server Info Card */}
      <aside className="console-server-card">
        <div className="console-server-header">
          <div className="console-server-status">
            <span className="console-status-dot running" />
            <span className="console-status-label">Работает</span>
          </div>
          <h2 className="console-server-ip">{serverInfo.ip}</h2>
        </div>
        <dl className="console-server-specs">
          <div className="console-spec-row">
            <dt>Регион</dt>
            <dd>{serverInfo.region}</dd>
          </div>
          <div className="console-spec-row">
            <dt>ОС</dt>
            <dd>{serverInfo.os}</dd>
          </div>
          <div className="console-spec-row">
            <dt>Тариф</dt>
            <dd>{serverInfo.plan}</dd>
          </div>
          <div className="console-spec-row">
            <dt>SSH</dt>
            <dd>root@{serverInfo.ip}</dd>
          </div>
        </dl>
        <div className="console-server-ping">
          <Wifi size={12} />
          <span>Ping: 4ms</span>
        </div>
      </aside>

      {/* Terminal */}
      <div className="console-terminal-wrap">
        <div className="console-toolbar">
          <div className="console-toolbar-title">
            <Terminal size={14} />
            <span>Веб-консоль</span>
          </div>
          <div className="console-toolbar-actions">
            <button type="button" className="console-tool-btn" onClick={handleCopy} title="Копировать">
              <Copy size={14} />
            </button>
            <button type="button" className="console-tool-btn" onClick={handleClear} title="Очистить">
              <Trash2 size={14} />
            </button>
            <button type="button" className="console-tool-btn" title="Переподключить">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="console-terminal" ref={terminalRef} onClick={() => inputRef.current?.focus()}>
          {lines.map((line) => (
            <div
              key={line.id}
              className={`console-line console-line-${line.type}`}
            >
              {line.text}
            </div>
          ))}
          {isRunning && (
            <div className="console-line console-line-running">
              <span className="console-spinner">⠋</span>
              {' '}Выполняется...
            </div>
          )}
        </div>

        <form className="console-input-row" onSubmit={handleSubmit} data-tour="console-input">
          <span className="console-prompt">root@185.12.44.201:~#</span>
          <input
            ref={inputRef}
            type="text"
            className="console-input"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Введи команду или нажми кнопку у Олега..."
            autoComplete="off"
            spellCheck={false}
            disabled={isRunning}
          />
          <button type="submit" className="console-run-btn" disabled={!inputVal.trim() || isRunning}>
            Выполнить
          </button>
        </form>
      </div>
    </div>
  );
}
