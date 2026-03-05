export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'unknown';

export interface PaymentMethod {
  id: string;
  last4: string;
  brand: CardBrand;
  expiry: string;
  name: string;
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  period: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending';
  createdAt: string;
  pdfUrl: string;
}

export interface AutoCharge {
  enabled: boolean;
  threshold: number;
}

export interface BillingSnapshot {
  balance: number;
  currency: string;
  dailyCost: number;
  nextInvoice: { period: string; amount: number } | null;
  paymentMethods: PaymentMethod[];
  autoCharge: AutoCharge;
  invoices: Invoice[];
}

export interface AddCardInput {
  number: string;
  name: string;
  expiry: string;
  cvc: string;
  isDefault: boolean;
}

const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

function detectBrand(number: string): CardBrand {
  const n = number.replace(/\s/g, '');
  if (n.startsWith('4')) return 'visa';
  if (/^5[1-5]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  return 'unknown';
}

const _state: BillingSnapshot = {
  balance: 500,
  currency: 'BYN',
  dailyCost: 3.2,
  nextInvoice: { period: 'Декабрь 2025', amount: 32 },
  paymentMethods: [
    {
      id: 'pm_default',
      last4: '1234',
      brand: 'visa',
      expiry: '07/28',
      name: 'IVAN PETROV',
      isDefault: true,
    },
  ],
  autoCharge: { enabled: true, threshold: 10 },
  invoices: [
    {
      id: 'INV-2026-003',
      period: 'Февраль 2026',
      amount: 69,
      currency: 'BYN',
      status: 'paid',
      createdAt: '04.03.2026',
      pdfUrl: '#',
    },
    {
      id: 'INV-2026-002',
      period: 'Январь 2026',
      amount: 54,
      currency: 'BYN',
      status: 'paid',
      createdAt: '05.02.2026',
      pdfUrl: '#',
    },
    {
      id: 'INV-2026-001',
      period: 'Декабрь 2025',
      amount: 32,
      currency: 'BYN',
      status: 'pending',
      createdAt: '03.01.2026',
      pdfUrl: '#',
    },
  ],
};

export const paymentsApi = {
  async fetchBillingSnapshot(): Promise<BillingSnapshot> {
    await delay(700);
    return JSON.parse(JSON.stringify(_state)) as BillingSnapshot;
  },

  async addCard(input: AddCardInput): Promise<PaymentMethod> {
    await delay(1200);
    const method: PaymentMethod = {
      id: `pm_${Date.now()}`,
      last4: input.number.replace(/\s/g, '').slice(-4),
      brand: detectBrand(input.number),
      expiry: input.expiry,
      name: input.name.toUpperCase(),
      isDefault: input.isDefault,
    };
    if (input.isDefault) {
      _state.paymentMethods.forEach((m) => (m.isDefault = false));
    }
    _state.paymentMethods.push(method);
    return method;
  },

  async topUp(amount: number): Promise<number> {
    await delay(1400);
    _state.balance += amount;
    return _state.balance;
  },

  async payInvoice(invoiceId: string): Promise<void> {
    await delay(1200);
    const inv = _state.invoices.find((i) => i.id === invoiceId);
    if (inv) {
      _state.balance = Math.max(0, _state.balance - inv.amount);
      inv.status = 'paid';
    }
    const stillPending = _state.invoices.some((i) => i.status === 'pending');
    if (!stillPending) _state.nextInvoice = null;
  },

  async toggleAutoCharge(enabled: boolean): Promise<void> {
    await delay(300);
    _state.autoCharge.enabled = enabled;
  },

  exportCsv(invoices: Invoice[]): void {
    const header = 'Период,Номер,Сумма,Статус,Дата\n';
    const rows = invoices
      .map(
        (i) =>
          `${i.period},${i.id},${i.amount} ${i.currency},${
            i.status === 'paid' ? 'Оплачен' : 'Ожидает оплаты'
          },${i.createdAt}`,
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices.csv';
    a.click();
    URL.revokeObjectURL(url);
  },
};
