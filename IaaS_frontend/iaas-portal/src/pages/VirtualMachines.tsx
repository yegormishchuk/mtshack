import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { colors } from '../theme';
import { useToast } from '../components/ToastProvider';

const pageTitle = { margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' };
const pageSub = { margin: '0 0 24px', fontSize: 14, color: 'rgba(255,255,255,0.85)' };

type VMState = 'running' | 'stopped' | 'pending';

interface VM {
  id: string;
  name: string;
  state: VMState;
  ip: string;
  flavor: string;
  image: string;
  created: string;
  costPerDay: number;
}

const MOCK_VMS: VM[] = [
  { id: '1', name: 'web-server-1', state: 'running', ip: '192.168.1.10', flavor: '2 vCPU / 4 GB', image: 'Ubuntu 22.04', created: '2025-02-20', costPerDay: 45 },
  { id: '2', name: 'docker-host', state: 'running', ip: '192.168.1.11', flavor: '4 vCPU / 8 GB', image: 'Docker host', created: '2025-02-18', costPerDay: 89 },
  { id: '3', name: 'llm-inference', state: 'stopped', ip: '—', flavor: '8 vCPU / 32 GB', image: 'LLM-inference preset', created: '2025-02-15', costPerDay: 220 },
];

function StateBadge({ state }: { state: VMState }) {
  const style = state === 'running'
    ? { background: 'rgba(52, 199, 89, 0.15)', color: colors.success }
    : state === 'stopped'
      ? { background: 'rgba(142, 142, 147, 0.2)', color: colors.textSecondary }
      : { background: 'rgba(255, 149, 0, 0.2)', color: colors.warning };
  return (
    <span style={{ padding: '4px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600, ...style }}>
      {state === 'running' ? 'Запущена' : state === 'stopped' ? 'Остановлена' : 'Ожидание'}
    </span>
  );
}

export function VirtualMachines() {
  const location = useLocation() as { state?: { newService?: { ip: string; sshCommand: string } } };
  const newService = location.state?.newService ?? null;
  const [vms, setVms] = useState<VM[]>(MOCK_VMS);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const doAction = (id: string, action: 'start' | 'stop' | 'restart') => {
    setVms((prev) =>
      prev.map((vm) =>
        vm.id === id
          ? { ...vm, state: action === 'stop' ? 'stopped' : 'running', ip: action === 'stop' ? '—' : vm.ip || '192.168.1.x' }
          : vm
      )
    );
  };

  const deleteVm = (id: string) => setVms((prev) => prev.filter((v) => v.id !== id));

  const copySsh = async (ip: string) => {
    const sshCommand = `ssh ubuntu@${ip}`;
    try {
      await navigator.clipboard.writeText(sshCommand);
      showToast('SSH команда скопирована. Откройте терминал и вставьте её.');
    } catch {
      showToast('Не удалось скопировать. Пожалуйста, скопируйте команду вручную.', 'error');
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={pageTitle}>Compute → Virtual Machines</h1>
          <p style={pageSub}>Управление виртуальными машинами</p>
        </div>
        <Link to="/compute/vms/create">
          <Button>Создать сервис</Button>
        </Link>
      </div>

      {newService && (
        <Card title="Сервис создаётся">
          <p style={{ margin: '0 0 8px', fontSize: 14, color: colors.textSecondary }}>
            Мы запускаем вашу VM. Это займёт пару минут — можно уже настроить DNS или добавить ключи.
          </p>
          <p style={{ margin: '0 0 4px', fontSize: 14 }}>
            IP:&nbsp;
            <code style={{ fontSize: 13 }}>{newService.ip}</code>
          </p>
          <div style={{ margin: '0 0 12px 0', fontSize: 14 }}>
            SSH:&nbsp;
            <code style={{ fontSize: 13 }}>{newService.sshCommand}</code>
            <Button
              variant="small"
              style={{ marginLeft: 8 }}
              onClick={() => copySsh(newService.ip)}
            >
              Скопировать SSH
            </Button>
          </div>
          <div
            style={{
              width: '100%',
              height: 8,
              borderRadius: 9999,
              background: 'rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              className="skeleton"
              style={{ width: '70%', height: '100%' }}
            />
          </div>
        </Card>
      )}

      {loading ? (
        <Card>
          <div className="app-table-wrap">
            <table className="app-table">
              <tbody>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={idx}>
                    <td colSpan={8}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div className="skeleton skeleton-text" style={{ maxWidth: 160 }} />
                        <div className="skeleton skeleton-text" style={{ maxWidth: 120 }} />
                        <div className="skeleton skeleton-text" style={{ maxWidth: 80 }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
      <Card>
        <div className="app-table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Состояние</th>
                <th>IP</th>
                <th>Flavor</th>
                <th>Образ</th>
                <th>Создана</th>
                <th>₽/день</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {vms.map((vm) => (
                <tr key={vm.id}>
                  <td style={{ fontWeight: 600 }}>{vm.name}</td>
                  <td><StateBadge state={vm.state} /></td>
                  <td><code style={{ fontSize: 13 }}>{vm.ip}</code></td>
                  <td>{vm.flavor}</td>
                  <td>{vm.image}</td>
                  <td>{vm.created}</td>
                  <td>{vm.costPerDay}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {vm.state === 'running' && (
                        <>
                          <Button variant="small" onClick={() => doAction(vm.id, 'restart')}>Restart</Button>
                          <Button variant="small" onClick={() => doAction(vm.id, 'stop')}>Stop</Button>
                        </>
                      )}
                      {vm.state === 'stopped' && (
                        <Button variant="small" onClick={() => doAction(vm.id, 'start')}>Start</Button>
                      )}
                      <Button variant="small" onClick={() => alert('Консоль (заглушка)')}>Console</Button>
                      {vm.ip !== '—' && (
                        <Button variant="small" onClick={() => copySsh(vm.ip)}>SSH</Button>
                      )}
                      <Button variant="small" onClick={() => deleteVm(vm.id)} style={{ color: colors.error }}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      )}
    </div>
  );
}
