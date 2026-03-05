import { Plus } from 'lucide-react';
import type { AutoCharge, PaymentMethod } from '../../services/paymentsApi';
import './billing.css';

interface Props {
  methods: PaymentMethod[];
  autoCharge: AutoCharge;
  onToggleAutoCharge: (val: boolean) => void;
  onAddCard: () => void;
  toggling: boolean;
}

export function PaymentMethodsCard({
  methods,
  autoCharge,
  onToggleAutoCharge,
  onAddCard,
  toggling,
}: Props) {
  const defaultMethod = methods.find((m) => m.isDefault) ?? methods[0] ?? null;

  return (
    <div className="pm-card">
      <h2 className="pm-card-title">Платёжные методы</h2>

      {defaultMethod ? (
        <MiniCard method={defaultMethod} />
      ) : (
        <div className="pm-empty">Карты не добавлены</div>
      )}

      <div className="pm-autocharge">
        <div className="pm-autocharge-info">
          <div className="pm-autocharge-title">
            Автосписание
            <button
              type="button"
              className="pm-tooltip-trigger"
              title={`Автоматически списывает средства с основной карты, когда баланс падает ниже ${autoCharge.threshold} BYN. Сервера не останавливаются.`}
            >
              ?
            </button>
          </div>
          <span className="pm-autocharge-hint">
            Срабатывает при балансе&nbsp;&lt;&nbsp;{autoCharge.threshold}&nbsp;BYN
          </span>
        </div>
        <label className="pm-toggle">
          <input
            type="checkbox"
            checked={autoCharge.enabled}
            onChange={(e) => onToggleAutoCharge(e.target.checked)}
            disabled={toggling}
          />
          <span className="pm-toggle-slider" />
        </label>
      </div>

      {defaultMethod && (
        <div className="pm-actions">
          <button type="button" className="pm-action-btn">
            Управлять картой
          </button>
          <button type="button" className="pm-action-btn">
            Настроить автосписание
          </button>
        </div>
      )}

      <button type="button" className="pm-add-btn" onClick={onAddCard}>
        <Plus size={16} />
        Добавить платёжный метод
      </button>
    </div>
  );
}

function MiniCard({ method }: { method: PaymentMethod }) {
  const brandLabel =
    method.brand === 'visa'
      ? 'VISA'
      : method.brand === 'mastercard'
        ? 'MASTERCARD'
        : method.brand === 'amex'
          ? 'AMEX'
          : 'CARD';

  return (
    <div className="pm-mini-card">
      <div className="pm-mini-card-brand">{brandLabel}</div>
      <div className="pm-mini-card-number">
        ••••&nbsp;&nbsp;••••&nbsp;&nbsp;••••&nbsp;&nbsp;{method.last4}
      </div>
      <div className="pm-mini-card-footer">
        <div>
          <div className="pm-mini-card-expiry-label">Держатель</div>
          <div className="pm-mini-card-name">{method.name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="pm-mini-card-expiry-label">Срок</div>
          <div className="pm-mini-card-expiry">{method.expiry}</div>
        </div>
      </div>
    </div>
  );
}
