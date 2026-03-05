import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { colors } from '../theme';
import { useToast } from '../components/ToastProvider';

const pageTitle = { margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' };
const pageSub = { margin: '0 0 24px', fontSize: 14, color: 'rgba(255,255,255,0.85)' };

interface Disk {
  id: string;
  name: string;
  size: number;
  attachedTo: string;
  type: string;
  autoBackup: boolean;
}

interface Snapshot {
  id: string;
  name: string;
  fromDisk: string;
  created: string;
  size: number;
}

const INITIAL_DISKS: Disk[] = [
  { id: 'd1', name: 'disk-web-1', size: 50, attachedTo: 'web-server-1', type: 'SSD', autoBackup: true },
  { id: 'd2', name: 'disk-data', size: 100, attachedTo: '—', type: 'SSD', autoBackup: false },
];

const INITIAL_SNAPSHOTS: Snapshot[] = [
  { id: 's1', name: 'snap-web-20250220', fromDisk: 'disk-web-1', created: '2025-02-20 14:00', size: 12 },
  { id: 's2', name: 'snap-data-backup', fromDisk: 'disk-data', created: '2025-02-18 03:00', size: 28 },
];

export function Storage() {
  const [disks, setDisks] = useState<Disk[]>(INITIAL_DISKS);
  const [snapshots, setSnapshots] = useState<Snapshot[]>(INITIAL_SNAPSHOTS);
  const { showToast } = useToast();

  const toggleAutoBackup = (id: string) => {
    setDisks((prev) =>
      prev.map((d) => (d.id === id ? { ...d, autoBackup: !d.autoBackup } : d)),
    );
    const disk = disks.find((d) => d.id === id);
    if (disk) {
      showToast(
        disk.autoBackup
          ? 'Автобэкап для диска выключен.'
          : 'Автобэкап включён. Мы будем автоматически создавать снапшоты.',
      );
    }
  };

  const createBackup = (disk: Disk) => {
    const id = `s-${Date.now()}`;
    const created = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const size = Math.max(4, Math.round(disk.size * 0.2));
    setSnapshots((prev) => [
      { id, name: `snap-${disk.name}-${created}`, fromDisk: disk.name, created, size },
      ...prev,
    ]);
    showToast(`Снапшот для ${disk.name} создан. В случае чего можно откатиться.`);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 style={pageTitle}>Storage</h1>
      <p style={pageSub}>Диски, снапшоты и защита данных</p>

      <Card title="Страховка от потери данных">
        <p style={{ margin: '0 0 8px', fontSize: 14, color: colors.textSecondary }}>
          Мы делаем снапшоты дисков. Если что-то сломаете или сервис упадёт — можно откатиться к рабочему состоянию.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: colors.textSecondary }}>
          Даже при неплатеже диски и снапшоты не удаляются автоматически — у вас есть время всё восстановить.
        </p>
      </Card>

      <Card title="Диски">
        <div className="app-table-wrap">
          <table className="app-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Размер</th>
                <th>Тип</th>
                <th>Примонтирован к</th>
                <th>Защита</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {disks.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td>{d.size} GB</td>
                  <td>{d.type}</td>
                  <td>{d.attachedTo}</td>
                  <td>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 600,
                        background: d.autoBackup ? 'rgba(52, 199, 89, 0.15)' : 'rgba(142, 142, 147, 0.12)',
                        color: d.autoBackup ? colors.success : colors.textSecondary,
                      }}
                    >
                      {d.autoBackup ? 'Автобэкап включён' : 'Без автобэкапа'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <Button
                        variant="small"
                        onClick={() => toggleAutoBackup(d.id)}
                      >
                        {d.autoBackup ? 'Выключить автобэкап' : 'Включить автобэкап'}
                      </Button>
                      <Button
                        variant="small"
                        onClick={() => createBackup(d)}
                      >
                        Бэкап сейчас
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Снапшоты">
        {snapshots.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: colors.textSecondary }}>
            Пока нет снапшотов. Сделайте первый — это ваша страховка на случай ошибок.
          </p>
        ) : (
          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Диск</th>
                  <th>Создан</th>
                  <th>Размер</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.fromDisk}</td>
                    <td>{s.created}</td>
                    <td>{s.size} GB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
