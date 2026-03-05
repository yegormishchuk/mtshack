import { useState } from 'react';
import { Download, Search, FileText } from 'lucide-react';
import type { Invoice } from '../../services/paymentsApi';
import './billing.css';

type Filter = 'all' | 'paid' | 'pending';

interface Props {
  invoices: Invoice[];
  onPay: (invoiceId: string) => Promise<void>;
  onExportCsv: () => void;
  payingId: string | null;
}

export function InvoicesTable({ invoices, onPay, onExportCsv, payingId }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const filtered = invoices.filter((inv) => {
    if (filter === 'paid' && inv.status !== 'paid') return false;
    if (filter === 'pending' && inv.status !== 'pending') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return inv.id.toLowerCase().includes(q) || inv.period.toLowerCase().includes(q);
    }
    return true;
  });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'paid', label: 'Оплаченные' },
    { key: 'pending', label: 'Ожидают' },
  ];

  return (
    <div className="invoices-card">
      <div className="invoices-header">
        <div className="invoices-header-left">
          <h2 className="invoices-title">История счетов</h2>
          <p className="invoices-subtitle">
            Все счета по месяцам — для бухгалтерии и отчётности.
          </p>
        </div>

        <div className="invoices-header-right">
          <label className="invoices-search">
            <Search size={12} className="invoices-search-icon" />
            <input
              className="invoices-search-input"
              type="search"
              placeholder="Поиск по номеру…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <div className="invoices-filters">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`invoices-filter-btn${filter === key ? ' active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <button type="button" className="invoices-export-btn" onClick={onExportCsv}>
            <Download size={13} />
            Экспорт CSV
          </button>
        </div>
      </div>

      <div className="invoices-table-wrap">
        {filtered.length === 0 ? (
          <div className="invoices-empty">
            <FileText size={36} strokeWidth={1} />
            <span className="invoices-empty-text">
              {search ? 'Ничего не найдено по запросу' : 'Счета отсутствуют'}
            </span>
          </div>
        ) : (
          <table className="invoices-table">
            <thead>
              <tr>
                <th>Период</th>
                <th>Номер</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Дата</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.period}</td>
                  <td style={{ color: '#999', fontFamily: 'monospace', fontSize: 11.5 }}>{inv.id}</td>
                  <td style={{ fontWeight: 600 }}>
                    {inv.amount}&nbsp;{inv.currency}
                  </td>
                  <td>
                    <span
                      className={`invoice-status-pill ${
                        inv.status === 'paid' ? 'invoice-status-paid' : 'invoice-status-pending'
                      }`}
                    >
                      <span className="invoice-status-dot" />
                      {inv.status === 'paid' ? 'Оплачен' : 'Ожидает оплаты'}
                    </span>
                  </td>
                  <td style={{ color: '#999' }}>{inv.createdAt}</td>
                  <td>
                    <div className="invoice-actions">
                      <button
                        type="button"
                        className="invoice-pdf-btn"
                        onClick={() => window.open(inv.pdfUrl, '_blank')}
                        title="Скачать PDF"
                      >
                        <Download size={11} />
                        PDF
                      </button>
                      {inv.status === 'pending' && (
                        <button
                          type="button"
                          className="invoice-pay-btn"
                          onClick={() => onPay(inv.id)}
                          disabled={payingId === inv.id}
                        >
                          {payingId === inv.id ? '…' : 'Оплатить'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
