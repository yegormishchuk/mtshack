import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { colors } from '../theme';

const pageTitle = { margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' };
const pageSub = { margin: '0 0 24px', fontSize: 14, color: 'rgba(255,255,255,0.85)' };

export function Dashboard() {
  const balance = 1250;
  const paymentOk = true;
  const vmCount = 3;
  const storageGb = 120;
  const publicIp = 1;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={pageTitle}>Создай сервис за 1 минуту</h1>
      <p style={pageSub}>Нейронка, API или веб‑сервис — с понятной ценой и лимитом расходов.</p>

      <Card title="Выберите тип сервиса">
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'rgba(85, 88, 95, 1)' }}>
          Мы подготовили пресеты под типичные задачи. Никакой сетевой магии — просто выберите сценарий.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Link to="/compute/vms/create?type=ml">
            <Button>Нейронка</Button>
          </Link>
          <Link to="/compute/vms/create?type=api">
            <Button variant="secondary">API сервис</Button>
          </Link>
          <Link to="/compute/vms/create?type=web">
            <Button variant="secondary">Веб‑сервис</Button>
          </Link>
        </div>
      </Card>

      <Card title="Баланс и оплата">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>{balance} ₽</span>
            <span style={{ marginLeft: 8, fontSize: 14, color: colors.textSecondary }}>на счёте</span>
          </div>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              background: paymentOk ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 59, 48, 0.15)',
              color: paymentOk ? colors.success : colors.error,
            }}
          >
            {paymentOk ? 'Оплата в порядке' : 'Требуется пополнение'}
          </span>
        </div>
      </Card>

      <Card title="Активные ресурсы">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>
          <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.04)', borderRadius: 16 }}>
            <div style={{ fontSize: 12, color: 'rgba(85, 88, 95, 1)', marginBottom: 4 }}>Виртуальные машины</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>{vmCount}</div>
          </div>
          <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.04)', borderRadius: 16 }}>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Хранилище</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>{storageGb} GB</div>
          </div>
          <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.04)', borderRadius: 16 }}>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Публичные IP</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>{publicIp}</div>
          </div>
        </div>
      </Card>

      <Card title="Быстрые действия">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Link to="/compute/vms/create">
            <Button>Создать VM</Button>
          </Link>
          <Button variant="secondary">Деплой нейросети (1 клик)</Button>
        </div>
      </Card>
    </div>
  );
}
