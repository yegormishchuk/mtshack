import './billing.css';

interface Props {
  balance: number;
  currency: string;
  dailyCost: number;
  nextInvoice: { period: string; amount: number } | null;
  onTopUp: () => void;
  onPayNext: () => void;
  paying: boolean;
}

function pluralDays(n: number): string {
  const abs = Math.abs(n);
  if (abs % 10 === 1 && abs % 100 !== 11) return 'день';
  if ([2, 3, 4].includes(abs % 10) && ![12, 13, 14].includes(abs % 100)) return 'дня';
  return 'дней';
}

export function BalanceCard({
  balance,
  currency,
  dailyCost,
  nextInvoice,
  onTopUp,
  onPayNext,
  paying,
}: Props) {
  const days = dailyCost > 0 ? Math.floor(balance / dailyCost) : 0;

  return (
    <div className="balance-card">
      <p className="balance-card-label">Текущий баланс</p>

      <div className="balance-card-amount-row">
        <span className="balance-card-amount">{balance}</span>
        <span className="balance-card-currency">{currency}</span>
      </div>

      <div className="balance-card-metrics">
        <div className="balance-card-metric">
          <span className="balance-card-metric-label">Расход&nbsp;/&nbsp;день</span>
          <span className="balance-card-metric-value">
            {dailyCost}&nbsp;{currency}
          </span>
        </div>
        <div className="balance-card-metric-divider" />
        <div className="balance-card-metric">
          <span className="balance-card-metric-label">Прогноз работы</span>
          <span className="balance-card-metric-value">
            {days}&nbsp;{pluralDays(days)}
          </span>
        </div>
      </div>

      <div className="balance-card-actions">
        <button type="button" className="balance-card-btn-primary" onClick={onTopUp}>
          Пополнить баланс
        </button>
        {nextInvoice && (
          <button
            type="button"
            className="balance-card-btn-secondary"
            onClick={onPayNext}
            disabled={paying}
          >
            {paying ? 'Оплата…' : 'Оплатить счёт'}
          </button>
        )}
      </div>

      {nextInvoice && (
        <div className="balance-card-next">
          <div>
            <div className="balance-card-next-label">Следующий счёт</div>
            <div className="balance-card-next-text">
              {nextInvoice.period}&nbsp;&nbsp;·&nbsp;&nbsp;
              <strong>
                {nextInvoice.amount}&nbsp;{currency}
              </strong>
            </div>
          </div>
          <button
            type="button"
            className="balance-card-next-pay"
            onClick={onPayNext}
            disabled={paying}
          >
            {paying ? '…' : 'Оплатить'}
          </button>
        </div>
      )}
    </div>
  );
}
