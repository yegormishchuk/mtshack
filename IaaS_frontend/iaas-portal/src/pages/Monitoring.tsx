import { Card } from '../components/Card';
import { colors } from '../theme';

const pageTitle = { margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' };
const pageSub = { margin: '0 0 24px', fontSize: 14, color: 'rgba(255,255,255,0.85)' };

/** Мок-график: полоска с заполнением по проценту */
function MockChart({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
        <span style={{ color: colors.text }}>{label}</span>
        <span style={{ color: colors.textSecondary }}>{value}%</span>
      </div>
      <div
        style={{
          height: 10,
          borderRadius: 5,
          background: colors.divider,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, value)}%`,
            height: '100%',
            background: color,
            borderRadius: 5,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

export function Monitoring() {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 style={pageTitle}>Monitoring</h1>
      <p style={pageSub}>Метрики и графики (мок)</p>

      <Card title="Использование ресурсов — web-server-1">
        <MockChart label="CPU" value={34} color={colors.primary} />
        <MockChart label="RAM" value={62} color={colors.success} />
        <MockChart label="Сеть (входящий трафик)" value={18} color={colors.warning} />
      </Card>

      <Card>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 14,
            background: 'rgba(0, 136, 255, 0.08)',
            borderRadius: 14,
            border: `1px solid rgba(0, 136, 255, 0.2)`,
          }}
        >
          <span style={{ fontSize: 20 }}>📊</span>
          <div>
            <div style={{ fontWeight: 600, color: colors.text }}>Prometheus подключен</div>
            <div style={{ fontSize: 13, color: colors.textSecondary }}>
              Метрики можно выгружать в свой Prometheus для детального мониторинга и алертов.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
