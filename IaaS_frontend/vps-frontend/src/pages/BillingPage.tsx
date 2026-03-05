import { useEffect, useReducer, useRef, useCallback } from 'react';
import { BalanceCard } from './billing/BalanceCard';
import { UsageForecastCard } from './billing/UsageForecastCard';
import { PaymentMethodsCard } from './billing/PaymentMethodsCard';
import { InvoicesTable } from './billing/InvoicesTable';
import { AddCardModal } from './billing/AddCardModal';
import { TopUpModal } from './billing/TopUpModal';
import {
  paymentsApi,
  type BillingSnapshot,
  type AddCardInput,
  type Invoice,
} from '../services/paymentsApi';
import './Page.css';
import './billing/billing.css';

/* ---- Toast ---- */
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

/* ---- Reducer ---- */
interface State {
  loading: boolean;
  data: BillingSnapshot | null;
  error: string | null;
  payingInvoiceId: string | null;
  payingNext: boolean;
  togglingAutoCharge: boolean;
  toasts: Toast[];
  showAddCard: boolean;
  showTopUp: boolean;
}

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_OK'; payload: BillingSnapshot }
  | { type: 'LOAD_FAIL'; payload: string }
  | { type: 'SHOW_ADD_CARD' }
  | { type: 'HIDE_ADD_CARD' }
  | { type: 'SHOW_TOP_UP' }
  | { type: 'HIDE_TOP_UP' }
  | { type: 'TOAST_ADD'; payload: { id: number; message: string; type: 'success' | 'error' } }
  | { type: 'TOAST_REMOVE'; payload: number }
  | { type: 'PAYING_INVOICE'; payload: string | null }
  | { type: 'PAYING_NEXT'; payload: boolean }
  | { type: 'TOGGLING_AC'; payload: boolean }
  | { type: 'DATA_UPDATE'; payload: Partial<BillingSnapshot> };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null };
    case 'LOAD_OK':
      return { ...state, loading: false, data: action.payload };
    case 'LOAD_FAIL':
      return { ...state, loading: false, error: action.payload };
    case 'SHOW_ADD_CARD':
      return { ...state, showAddCard: true };
    case 'HIDE_ADD_CARD':
      return { ...state, showAddCard: false };
    case 'SHOW_TOP_UP':
      return { ...state, showTopUp: true };
    case 'HIDE_TOP_UP':
      return { ...state, showTopUp: false };
    case 'TOAST_ADD':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'TOAST_REMOVE':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };
    case 'PAYING_INVOICE':
      return { ...state, payingInvoiceId: action.payload };
    case 'PAYING_NEXT':
      return { ...state, payingNext: action.payload };
    case 'TOGGLING_AC':
      return { ...state, togglingAutoCharge: action.payload };
    case 'DATA_UPDATE':
      return state.data ? { ...state, data: { ...state.data, ...action.payload } } : state;
    default:
      return state;
  }
}

const INITIAL: State = {
  loading: true,
  data: null,
  error: null,
  payingInvoiceId: null,
  payingNext: false,
  togglingAutoCharge: false,
  toasts: [],
  showAddCard: false,
  showTopUp: false,
};

let _toastCounter = 0;

export function BillingPage() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const toastTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  /* Load data */
  useEffect(() => {
    dispatch({ type: 'LOAD_START' });
    paymentsApi
      .fetchBillingSnapshot()
      .then((data) => dispatch({ type: 'LOAD_OK', payload: data }))
      .catch((e: unknown) =>
        dispatch({ type: 'LOAD_FAIL', payload: e instanceof Error ? e.message : String(e) }),
      );
  }, []);

  /* Auto-dismiss toasts */
  useEffect(() => {
    state.toasts.forEach((t) => {
      if (!toastTimers.current.has(t.id)) {
        const timer = setTimeout(() => {
          dispatch({ type: 'TOAST_REMOVE', payload: t.id });
          toastTimers.current.delete(t.id);
        }, 4200);
        toastTimers.current.set(t.id, timer);
      }
    });
    return () => {
      // Only cleanup on unmount
    };
  }, [state.toasts]);

  const toast = useCallback((message: string, type: 'success' | 'error') => {
    dispatch({ type: 'TOAST_ADD', payload: { id: ++_toastCounter, message, type } });
  }, []);

  async function handleAddCard(input: AddCardInput) {
    const snapshot = state.data;
    try {
      const method = await paymentsApi.addCard(input);
      if (snapshot) {
        const updatedMethods = input.isDefault
          ? [...snapshot.paymentMethods.map((m) => ({ ...m, isDefault: false })), method]
          : [...snapshot.paymentMethods, method];
        dispatch({ type: 'DATA_UPDATE', payload: { paymentMethods: updatedMethods } });
      }
      dispatch({ type: 'HIDE_ADD_CARD' });
      toast('Карта успешно добавлена', 'success');
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Ошибка при добавлении карты', 'error');
      throw e;
    }
  }

  async function handleTopUp(amount: number) {
    try {
      const newBalance = await paymentsApi.topUp(amount);
      dispatch({ type: 'DATA_UPDATE', payload: { balance: newBalance } });
      dispatch({ type: 'HIDE_TOP_UP' });
      toast(`Баланс пополнен на ${amount} ${state.data?.currency ?? 'BYN'}`, 'success');
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Ошибка оплаты', 'error');
      throw e;
    }
  }

  async function handlePayInvoice(invoiceId: string) {
    const snapshot = state.data;
    dispatch({ type: 'PAYING_INVOICE', payload: invoiceId });
    try {
      await paymentsApi.payInvoice(invoiceId);
      if (snapshot) {
        const paidInv = snapshot.invoices.find((i) => i.id === invoiceId);
        const updatedInvoices: Invoice[] = snapshot.invoices.map((i) =>
          i.id === invoiceId ? { ...i, status: 'paid' as const } : i,
        );
        const stillPending = updatedInvoices.some((i) => i.status === 'pending');
        dispatch({
          type: 'DATA_UPDATE',
          payload: {
            invoices: updatedInvoices,
            balance: Math.max(0, snapshot.balance - (paidInv?.amount ?? 0)),
            nextInvoice: stillPending ? snapshot.nextInvoice : null,
          },
        });
      }
      toast('Счёт успешно оплачен', 'success');
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Ошибка оплаты', 'error');
    } finally {
      dispatch({ type: 'PAYING_INVOICE', payload: null });
    }
  }

  async function handlePayNext() {
    const pendingInv = state.data?.invoices.find((i) => i.status === 'pending');
    if (!pendingInv) return;
    dispatch({ type: 'PAYING_NEXT', payload: true });
    await handlePayInvoice(pendingInv.id);
    dispatch({ type: 'PAYING_NEXT', payload: false });
  }

  async function handleToggleAutoCharge(val: boolean) {
    const snapshot = state.data;
    if (!snapshot) return;
    dispatch({ type: 'TOGGLING_AC', payload: true });
    try {
      await paymentsApi.toggleAutoCharge(val);
      dispatch({
        type: 'DATA_UPDATE',
        payload: { autoCharge: { ...snapshot.autoCharge, enabled: val } },
      });
      toast(val ? 'Автосписание включено' : 'Автосписание отключено', 'success');
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : 'Ошибка', 'error');
    } finally {
      dispatch({ type: 'TOGGLING_AC', payload: false });
    }
  }

  /* ---- Render: loading ---- */
  if (state.loading) {
    return (
      <section className="page page-wide">
        <PageHeader />
        <div className="billing-grid">
          <div className="billing-skeleton" style={{ height: 260 }} />
          <div className="billing-skeleton" style={{ height: 260 }} />
          <div className="billing-skeleton" style={{ height: 260 }} />
        </div>
        <div className="billing-skeleton" style={{ height: 380 }} />
      </section>
    );
  }

  /* ---- Render: error ---- */
  if (state.error || !state.data) {
    return (
      <section className="page page-wide">
        <PageHeader />
        <div
          className="page-card"
          style={{ alignItems: 'center', padding: '48px 24px', color: '#ff0023', gap: 8 }}
        >
          <strong>Ошибка загрузки</strong>
          <span style={{ color: '#888', fontSize: 13 }}>{state.error}</span>
          <button
            type="button"
            className="page-btn page-btn-primary"
            style={{ marginTop: 8 }}
            onClick={() => {
              dispatch({ type: 'LOAD_START' });
              paymentsApi
                .fetchBillingSnapshot()
                .then((data) => dispatch({ type: 'LOAD_OK', payload: data }))
                .catch((e: unknown) =>
                  dispatch({
                    type: 'LOAD_FAIL',
                    payload: e instanceof Error ? e.message : String(e),
                  }),
                );
            }}
          >
            Повторить
          </button>
        </div>
      </section>
    );
  }

  const { data } = state;

  /* ---- Render: main ---- */
  return (
    <section className="page page-wide">
      <PageHeader />

      <div className="billing-grid">
        <BalanceCard
          balance={data.balance}
          currency={data.currency}
          dailyCost={data.dailyCost}
          nextInvoice={data.nextInvoice}
          onTopUp={() => dispatch({ type: 'SHOW_TOP_UP' })}
          onPayNext={handlePayNext}
          paying={state.payingNext}
        />
        <UsageForecastCard
          balance={data.balance}
          currency={data.currency}
          dailyCost={data.dailyCost}
        />
        <PaymentMethodsCard
          methods={data.paymentMethods}
          autoCharge={data.autoCharge}
          onToggleAutoCharge={handleToggleAutoCharge}
          onAddCard={() => dispatch({ type: 'SHOW_ADD_CARD' })}
          toggling={state.togglingAutoCharge}
        />
      </div>

      <InvoicesTable
        invoices={data.invoices}
        onPay={handlePayInvoice}
        onExportCsv={() => paymentsApi.exportCsv(data.invoices)}
        payingId={state.payingInvoiceId}
      />

      {state.showAddCard && (
        <AddCardModal
          onSave={handleAddCard}
          onClose={() => dispatch({ type: 'HIDE_ADD_CARD' })}
        />
      )}

      {state.showTopUp && (
        <TopUpModal
          methods={data.paymentMethods}
          currency={data.currency}
          onTopUp={handleTopUp}
          onClose={() => dispatch({ type: 'HIDE_TOP_UP' })}
        />
      )}

      {state.toasts.length > 0 && (
        <div className="billing-toasts">
          {state.toasts.map((t) => (
            <div key={t.id} className={`billing-toast billing-toast-${t.type}`}>
              {t.message}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PageHeader() {
  return (
    <header className="page-header-row">
      <div>
        <h1 className="page-title">Счета</h1>
        <p className="page-text">
          Управляйте балансом, тарифами и счетами для своей инфраструктуры.
        </p>
      </div>
    </header>
  );
}
