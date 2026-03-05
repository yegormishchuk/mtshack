import { useState } from 'react';
import { X, CreditCard } from 'lucide-react';
import type { PaymentMethod } from '../../services/paymentsApi';
import './billing.css';

const PRESETS = [50, 100, 200, 500] as const;

interface Props {
  methods: PaymentMethod[];
  currency: string;
  onTopUp: (amount: number) => Promise<void>;
  onClose: () => void;
}

export function TopUpModal({ methods, currency, onTopUp, onClose }: Props) {
  const [preset, setPreset] = useState<number>(100);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);

  const effectiveAmount = custom.trim() ? Math.max(0, parseInt(custom, 10) || 0) : preset;
  const defaultMethod = methods.find((m) => m.isDefault) ?? methods[0] ?? null;
  const canPay = effectiveAmount > 0 && defaultMethod !== null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canPay) return;
    setLoading(true);
    try {
      await onTopUp(effectiveAmount);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="billing-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="billing-modal" style={{ maxWidth: 460 }}>
        <div className="billing-modal-header">
          <h2 className="billing-modal-title">Пополнить баланс</h2>
          <button type="button" className="billing-modal-close" onClick={onClose} aria-label="Закрыть">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="topup-modal-body">
            {/* Preset amounts */}
            <div>
              <div className="billing-form-label" style={{ marginBottom: 8 }}>
                Выберите сумму
              </div>
              <div className="topup-amounts">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`topup-amount-btn${!custom && preset === p ? ' active' : ''}`}
                    onClick={() => {
                      setPreset(p);
                      setCustom('');
                    }}
                  >
                    {p}
                    <span style={{ fontSize: 11, fontWeight: 400 }}>&nbsp;{currency}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div className="billing-form-group">
              <label className="billing-form-label">Другая сумма</label>
              <input
                className="billing-form-input"
                type="number"
                min="1"
                step="1"
                placeholder={`Введите сумму в ${currency}`}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
              />
            </div>

            {/* Payment method */}
            <div className="billing-form-group">
              <label className="billing-form-label">Способ оплаты</label>
              {defaultMethod ? (
                <div className="topup-card-preview">
                  <CreditCard size={14} style={{ color: '#888', flexShrink: 0 }} />
                  <span>
                    {defaultMethod.brand.toUpperCase()}&nbsp;••••&nbsp;{defaultMethod.last4}&nbsp;
                    &middot;&nbsp;до&nbsp;{defaultMethod.expiry}
                  </span>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>
                  Нет сохранённых карт. Сначала добавьте карту.
                </p>
              )}
            </div>
          </div>

          <div className="billing-modal-footer">
            <div className="billing-modal-actions">
              <button
                type="submit"
                className="billing-submit-btn"
                disabled={loading || !canPay}
              >
                {loading ? (
                  <>
                    <span className="billing-spinner" />
                    Оплата…
                  </>
                ) : (
                  `Пополнить на ${effectiveAmount} ${currency}`
                )}
              </button>
              <button
                type="button"
                className="billing-cancel-btn"
                onClick={onClose}
                disabled={loading}
              >
                Отмена
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
