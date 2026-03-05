import { useSearchParams } from 'react-router-dom';
import './Page.css';

const MOCK_INVOICES = [
  {
    id: 'INV-2026-003',
    period: 'Февраль 2026',
    amount: '69 BYN',
    status: 'Оплачен',
    createdAt: '04.03.2026',
    link: '#'
  },
  {
    id: 'INV-2026-002',
    period: 'Январь 2026',
    amount: '54 BYN',
    status: 'Оплачен',
    createdAt: '05.02.2026',
    link: '#'
  },
  {
    id: 'INV-2026-001',
    period: 'Декабрь 2025',
    amount: '32 BYN',
    status: 'Ожидает оплаты',
    createdAt: '03.01.2026',
    link: '#'
  }
] as const;

export function BillingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = (searchParams.get('filter') ?? 'all') as 'all' | 'paid' | 'unpaid';

  const nextInvoice = MOCK_INVOICES.find((i) => i.status === 'Ожидает оплаты');

  const filteredInvoices = MOCK_INVOICES.filter((invoice) => {
    if (filter === 'paid') return invoice.status === 'Оплачен';
    if (filter === 'unpaid') return invoice.status !== 'Оплачен';
    return true;
  });

  return (
    <section className="page page-wide">
      <header className="page-header-row">
        <div>
          <h1 className="page-title">Счета</h1>
          <p className="page-text">
            Управляйте балансом, тарифами и счетами для своей инфраструктуры.
          </p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="page-btn page-btn-primary">
            Пополнить баланс
          </button>
          <button type="button" className="page-btn page-btn-outline">
            Экспорт в CSV
          </button>
        </div>
      </header>

      <div className="page-grid">
        <section className="page-card page-card-primary">
          <h2 className="page-card-title">Текущий баланс</h2>
          <p className="page-card-amount">32 BYN</p>
          <p className="page-card-caption">≈ 10 дней работы текущих серверов</p>
          {nextInvoice && (
            <div className="page-card-banner">
              <div>
                <div className="page-card-banner-label">Следующий счёт</div>
                <div className="page-card-banner-text">
                  {nextInvoice.period} • {nextInvoice.amount}
                </div>
              </div>
              <button type="button" className="page-btn page-btn-light">
                Оплатить
              </button>
            </div>
          )}
        </section>

        <section className="page-card">
          <h2 className="page-card-title">Платёжные методы</h2>
          <p className="page-card-text">
            Добавьте карту или настройте автосписание, чтобы сервера не останавливались.
          </p>
          <ul className="page-list">
            <li className="page-list-item">
              <div>
                <div className="page-list-primary">Visa **** 1234</div>
                <div className="page-list-secondary">Основная карта • до 07/28</div>
              </div>
              <button type="button" className="page-link">
                Управлять
              </button>
            </li>
            <li className="page-list-item">
              <div>
                <div className="page-list-primary">Автосписание</div>
                <div className="page-list-secondary">Включено при балансе &lt; 10 BYN</div>
              </div>
              <button type="button" className="page-link">
                Настроить
              </button>
            </li>
          </ul>
          <button type="button" className="page-btn page-btn-ghost">
            Добавить платёжный метод
          </button>
        </section>
      </div>

      <section className="page-card">
        <div className="page-card-header-row">
          <div>
            <h2 className="page-card-title">История счетов</h2>
            <p className="page-card-text">
              Все счета по месяцам. Используйте их для бухгалтерии и отчётности.
            </p>
          </div>
          <div className="page-pill-group">
            <button
              type="button"
              className={`page-pill${filter === 'all' ? ' page-pill-active' : ''}`}
              onClick={() => setSearchParams({ filter: 'all' })}
            >
              Все
            </button>
            <button
              type="button"
              className={`page-pill${filter === 'paid' ? ' page-pill-active' : ''}`}
              onClick={() => setSearchParams({ filter: 'paid' })}
            >
              Оплаченные
            </button>
            <button
              type="button"
              className={`page-pill${filter === 'unpaid' ? ' page-pill-active' : ''}`}
              onClick={() => setSearchParams({ filter: 'unpaid' })}
            >
              Ожидают оплаты
            </button>
          </div>
        </div>

        <div className="page-table">
          <div className="page-table-header">
            <span>Период</span>
            <span>Номер</span>
            <span>Сумма</span>
            <span>Статус</span>
            <span>Дата</span>
            <span />
          </div>
          <div className="page-table-body">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="page-table-row">
                <span>{invoice.period}</span>
                <span>{invoice.id}</span>
                <span>{invoice.amount}</span>
                <span
                  className={`page-badge ${
                    invoice.status === 'Оплачен'
                      ? 'page-badge-success'
                      : 'page-badge-warning'
                  }`}
                >
                  {invoice.status}
                </span>
                <span>{invoice.createdAt}</span>
                <button type="button" className="page-link">
                  Скачать PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}


