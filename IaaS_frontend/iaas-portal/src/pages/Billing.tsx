import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { colors } from '../theme';

const pageTitle = { margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' };
const pageSub = { margin: '0 0 24px', fontSize: 14, color: 'rgba(255,255,255,0.85)' };

export function Billing() {
  const [spendLimit, setSpendLimit] = useState<string>('2000');

  const balance = 1250;
  const todaySpend = 12;
  const monthSpend = 387;
  const tariff = 'Pay-as-you-go';

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1 style={pageTitle}>Billing</h1>
      <p style={pageSub}>Тариф, расходы и лимит</p>

      <Card title="Текущий тариф">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, color: colors.text }}>{tariff}</span>
          <span style={{ fontSize: 14, color: colors.textSecondary }}>Оплата по факту использования</span>
        </div>
      </Card>

      <Card title="Расходы">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, background: 'rgba(0,0,0,0.04)', borderRadius: 16 }}>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Сегодня</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>{todaySpend} ₽</div>
          </div>
          <div style={{ padding: 16, background: 'rgba(0,0,0,0.04)', borderRadius: 16 }}>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>За месяц</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>{monthSpend} ₽</div>
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 14, color: colors.textSecondary }}>
          Баланс: <strong style={{ color: colors.text }}>{balance} ₽</strong>
        </div>
      </Card>

      <Card title="Лимит расходов">
        <p style={{ margin: '0 0 12px', fontSize: 14, color: colors.textSecondary }}>
          При достижении лимита новые VM не запускаются, текущие продолжают работать до конца оплаченного периода. Идеально для новичков — вы заранее знаете потолок расходов.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="number"
            value={spendLimit}
            onChange={(e) => setSpendLimit(e.target.value)}
            min={0}
            step={100}
            style={{
              width: 120,
              padding: '12px 16px',
              fontSize: 16,
              borderRadius: 14,
              border: `1px solid ${colors.divider}`,
              background: '#fff',
            }}
          />
          <span style={{ color: colors.text }}>₽ в месяц</span>
          <Button variant="secondary">Сохранить лимит</Button>
        </div>
      </Card>

      <Card title="Сценарии неплатежа">
        <div
          style={{
            padding: 16,
            background: 'rgba(255, 149, 0, 0.08)',
            borderRadius: 16,
            border: `1px solid rgba(255, 149, 0, 0.2)`,
          }}
        >
          <div style={{ fontWeight: 600, color: colors.text, marginBottom: 8 }}>При недостатке средств:</div>
          <ul style={{ margin: 0, paddingLeft: 20, color: colors.textSecondary, fontSize: 14, lineHeight: 1.6 }}>
            <li>VM останавливается, данные сохраняются</li>
            <li>Диски и снапшоты не удаляются автоматически</li>
            <li>После пополнения можно снова запустить VM с теми же данными</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
