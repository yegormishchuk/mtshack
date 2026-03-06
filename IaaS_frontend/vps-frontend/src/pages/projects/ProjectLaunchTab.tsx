import { useState } from 'react';
import type { Project, VM } from '../../domain/iaasTypes';
import { useProjectsStore } from '../../store/projectsStore';

interface LaunchCommand {
  cmd: string;
  comment?: string;
}

interface LaunchPhase {
  title: string;
  description: string;
  commands: LaunchCommand[];
}

function buildLaunchSteps(vm: VM): LaunchPhase[] {
  const baseSetup: LaunchPhase = {
    title: 'Подготовка системы',
    description: 'Обновление пакетов и установка базовых зависимостей',
    commands: [
      { cmd: 'sudo apt update && sudo apt upgrade -y' },
      { cmd: 'sudo apt install -y curl git unzip build-essential' },
    ],
  };

  if (vm.role === 'db') {
    return [
      baseSetup,
      {
        title: 'Установка PostgreSQL',
        description: 'Установка и первичная настройка СУБД',
        commands: [
          { cmd: 'sudo apt install -y postgresql postgresql-contrib' },
          { cmd: 'sudo systemctl enable postgresql && sudo systemctl start postgresql' },
          { cmd: `sudo -u postgres psql -c "CREATE DATABASE appdb;"` },
          { cmd: `sudo -u postgres psql -c "CREATE USER appuser WITH PASSWORD 'changeme';"` },
          { cmd: `sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE appdb TO appuser;"` },
        ],
      },
      {
        title: 'Проверка',
        description: 'Убедитесь, что PostgreSQL работает',
        commands: [
          { cmd: 'sudo systemctl status postgresql' },
          { cmd: 'sudo -u postgres psql -c "\\l"', comment: 'список баз данных' },
        ],
      },
    ];
  }

  if (vm.role === 'vpn') {
    return [
      baseSetup,
      {
        title: 'Установка WireGuard',
        description: 'Установка VPN-сервера WireGuard',
        commands: [
          { cmd: 'sudo apt install -y wireguard' },
          { cmd: 'wg genkey | sudo tee /etc/wireguard/server_private.key | wg pubkey | sudo tee /etc/wireguard/server_public.key' },
          { cmd: 'sudo chmod 600 /etc/wireguard/server_private.key' },
        ],
      },
      {
        title: 'Настройка интерфейса',
        description: 'Создание конфигурации wg0',
        commands: [
          { cmd: `sudo bash -c 'cat > /etc/wireguard/wg0.conf << EOF\n[Interface]\nAddress = 10.200.0.1/24\nListenPort = 51820\nPrivateKey = $(cat /etc/wireguard/server_private.key)\nPostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE\nPostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE\nEOF'` },
          { cmd: 'sudo systemctl enable wg-quick@wg0 && sudo systemctl start wg-quick@wg0' },
        ],
      },
      {
        title: 'Проверка',
        description: 'Убедитесь, что VPN поднят',
        commands: [
          { cmd: 'sudo wg show' },
          { cmd: 'sudo systemctl status wg-quick@wg0' },
        ],
      },
    ];
  }

  if (vm.role === 'frontend' || vm.role === 'proxy') {
    return [
      baseSetup,
      {
        title: 'Установка Nginx',
        description: 'Установка и настройка веб-сервера',
        commands: [
          { cmd: 'sudo apt install -y nginx' },
          { cmd: 'sudo systemctl enable nginx && sudo systemctl start nginx' },
          { cmd: 'sudo ufw allow "Nginx Full"' },
        ],
      },
      {
        title: 'Деплой фронтенда',
        description: 'Сборка и публикация статики',
        commands: [
          { cmd: 'cd /home/ubuntu/app && npm ci' },
          { cmd: 'npm run build' },
          { cmd: 'sudo cp -r dist/* /var/www/html/' },
          { cmd: 'sudo nginx -t && sudo systemctl reload nginx' },
        ],
      },
      {
        title: 'Проверка',
        description: 'Проверка статуса сервиса',
        commands: [
          { cmd: 'sudo systemctl status nginx' },
          { cmd: `curl -I http://localhost`, comment: 'должен вернуть 200 OK' },
        ],
      },
    ];
  }

  if (vm.role === 'worker') {
    return [
      baseSetup,
      {
        title: 'Установка Python и зависимостей',
        description: 'Подготовка окружения для inference-сервиса',
        commands: [
          { cmd: 'sudo apt install -y python3-pip python3-venv' },
          { cmd: 'python3 -m venv /home/ubuntu/venv' },
          { cmd: 'source /home/ubuntu/venv/bin/activate && pip install -r /home/ubuntu/app/requirements.txt' },
        ],
      },
      {
        title: 'Запуск сервиса',
        description: 'Запуск через systemd',
        commands: [
          { cmd: `sudo bash -c 'cat > /etc/systemd/system/inference.service << EOF\n[Unit]\nDescription=Inference Worker\nAfter=network.target\n\n[Service]\nUser=ubuntu\nWorkingDirectory=/home/ubuntu/app\nExecStart=/home/ubuntu/venv/bin/python src/main.py\nRestart=always\n\n[Install]\nWantedBy=multi-user.target\nEOF'` },
          { cmd: 'sudo systemctl daemon-reload' },
          { cmd: 'sudo systemctl enable inference && sudo systemctl start inference' },
        ],
      },
      {
        title: 'Проверка',
        description: '',
        commands: [
          { cmd: 'sudo systemctl status inference' },
          { cmd: 'curl http://localhost:8000/health', comment: 'healthcheck эндпоинт' },
        ],
      },
    ];
  }

  return [
    baseSetup,
    {
      title: 'Установка приложения',
      description: 'Установка зависимостей и запуск',
      commands: [
        { cmd: 'sudo apt install -y python3-pip python3-venv' },
        { cmd: 'cd /home/ubuntu/app && python3 -m venv venv' },
        { cmd: 'source venv/bin/activate && pip install -r requirements.txt' },
      ],
    },
    {
      title: 'Запуск',
      description: 'Запуск приложения',
      commands: [
        { cmd: 'source venv/bin/activate && python src/main.py &' },
        { cmd: 'curl http://localhost:8000/', comment: 'проверить доступность' },
      ],
    },
  ];
}

interface Props {
  project: Project;
}

export function ProjectLaunchTab({ project }: Props) {
  const vms = project.resources.vms;
  const addToast = useProjectsStore((s) => s.addToast);
  const [selectedVmId, setSelectedVmId] = useState(vms[0]?.id ?? '');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [runningCmd, setRunningCmd] = useState<string | null>(null);
  const vm = vms.find((v) => v.id === selectedVmId);
  const phases = vm ? buildLaunchSteps(vm) : [];

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd).catch(() => {});
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 1500);
  };

  const handleRun = (cmd: string) => {
    setRunningCmd(cmd);
    setTimeout(() => {
      setRunningCmd(null);
      addToast(`Команда выполнена: ${cmd.length > 48 ? cmd.slice(0, 48) + '…' : cmd}`);
    }, 1000);
  };

  return (
    <div className="pl-root">
      <div className="pf-toolbar">
        <div className="pf-vm-tabs">
          {vms.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`pf-vm-tab${v.id === selectedVmId ? ' pf-vm-tab-active' : ''}`}
              onClick={() => setSelectedVmId(v.id)}
            >
              <span className="pf-vm-dot" style={{ background: v.state === 'running' ? '#2ecc71' : '#e67e22' }} />
              {v.name}
            </button>
          ))}
        </div>
        {vm && <div className="pf-vm-info">{vm.os}</div>}
      </div>

      <div className="pl-phases">
        {phases.map((phase, idx) => (
          <div key={idx} className="pl-phase">
            <div className="pl-phase-header">
              <div className="pl-phase-number">{idx + 1}</div>
              <div>
                <div className="pl-phase-title">{phase.title}</div>
                {phase.description && (
                  <div className="pl-phase-description">{phase.description}</div>
                )}
              </div>
            </div>
            <div className="pl-commands">
              {phase.commands.map((item, ci) => (
                <div key={ci} className="pl-cmd-row">
                  <div className="pl-cmd-block">
                    <span className="pl-cmd-prompt">$</span>
                    <pre className="pl-cmd-text">{item.cmd}</pre>
                  </div>
                  <div className="pl-cmd-aside">
                    {item.comment && (
                      <span className="pl-cmd-comment"># {item.comment}</span>
                    )}
                    <button
                      type="button"
                      className={`pl-copy-btn${copiedCmd === item.cmd ? ' pl-copy-btn-done' : ''}`}
                      onClick={() => handleCopy(item.cmd)}
                      aria-label="Скопировать команду"
                    >
                      {copiedCmd === item.cmd ? '✓' : 'Копировать'}
                    </button>
                    <button
                      type="button"
                      className="pl-copy-btn"
                      disabled={runningCmd === item.cmd}
                      onClick={() => handleRun(item.cmd)}
                      aria-label="Выполнить команду"
                      style={{
                        background: runningCmd === item.cmd ? '#e5e7eb' : '#FF0023',
                        color: runningCmd === item.cmd ? '#9ca3af' : '#fff',
                        border: 'none',
                      }}
                    >
                      {runningCmd === item.cmd ? '…' : 'Запустить'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
