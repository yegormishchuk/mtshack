import { useState } from 'react';
import Cards from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';
import { X, Lock } from 'lucide-react';
import type { AddCardInput } from '../../services/paymentsApi';
import './billing.css';

type FocusedField = 'number' | 'name' | 'expiry' | 'cvc' | undefined;

interface FormState {
  number: string;
  name: string;
  expiry: string;
  cvc: string;
  focus: FocusedField;
  isDefault: boolean;
}

interface FormErrors {
  number?: string;
  name?: string;
  expiry?: string;
  cvc?: string;
}

interface Props {
  onSave: (data: AddCardInput) => Promise<void>;
  onClose: () => void;
}

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const cleanNum = form.number.replace(/\s/g, '');
  if (cleanNum.length < 15) errors.number = 'Введите полный номер карты';
  if (form.name.trim().length < 2) errors.name = 'Введите имя держателя';
  const [mm = '', yy = ''] = form.expiry.split('/');
  const mmN = parseInt(mm, 10);
  const yyN = parseInt(yy, 10);
  if (!mm || !yy || mmN < 1 || mmN > 12 || yyN < 24) errors.expiry = 'Неверный срок действия';
  if (form.cvc.length < 3) errors.cvc = 'Неверный CVC';
  return errors;
}

export function AddCardModal({ onSave, onClose }: Props) {
  const [form, setForm] = useState<FormState>({
    number: '',
    name: '',
    expiry: '',
    cvc: '',
    focus: undefined,
    isDefault: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field in errors) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await onSave({
        number: form.number,
        name: form.name,
        expiry: form.expiry,
        cvc: form.cvc,
        isDefault: form.isDefault,
      });
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
      <div className="billing-modal">
        <div className="billing-modal-header">
          <h2 className="billing-modal-title">Добавить карту</h2>
          <button type="button" className="billing-modal-close" onClick={onClose} aria-label="Закрыть">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="billing-modal-body">
            {/* Left: visual card */}
            <div className="billing-modal-card-side">
              <Cards
                number={form.number}
                name={form.name || 'ИМЯ ФАМИЛИЯ'}
                expiry={form.expiry}
                cvc={form.cvc}
                focused={form.focus}
                locale={{ valid: 'до' }}
                placeholders={{ name: 'ИМЯ ФАМИЛИЯ' }}
              />
              <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                Данные токенизируются&nbsp;—&nbsp;PAN и CVC
                <br />не хранятся на наших серверах
              </p>
            </div>

            {/* Right: form */}
            <div className="billing-modal-form-side">
              <div className="billing-form-group">
                <label className="billing-form-label">Номер карты</label>
                <input
                  className={`billing-form-input${errors.number ? ' error' : ''}`}
                  type="tel"
                  inputMode="numeric"
                  placeholder="0000 0000 0000 0000"
                  value={form.number}
                  maxLength={19}
                  autoComplete="cc-number"
                  onFocus={() => setField('focus', 'number')}
                  onBlur={() => setField('focus', undefined)}
                  onChange={(e) => setField('number', formatCardNumber(e.target.value))}
                />
                {errors.number && <span className="billing-form-error">{errors.number}</span>}
              </div>

              <div className="billing-form-group">
                <label className="billing-form-label">Имя на карте</label>
                <input
                  className={`billing-form-input${errors.name ? ' error' : ''}`}
                  type="text"
                  placeholder="IVAN PETROV"
                  value={form.name}
                  autoComplete="cc-name"
                  onFocus={() => setField('focus', 'name')}
                  onBlur={() => setField('focus', undefined)}
                  onChange={(e) => setField('name', e.target.value.toUpperCase())}
                />
                {errors.name && <span className="billing-form-error">{errors.name}</span>}
              </div>

              <div className="billing-form-row">
                <div className="billing-form-group">
                  <label className="billing-form-label">Срок действия</label>
                  <input
                    className={`billing-form-input${errors.expiry ? ' error' : ''}`}
                    type="tel"
                    placeholder="MM/YY"
                    value={form.expiry}
                    maxLength={5}
                    autoComplete="cc-exp"
                    onFocus={() => setField('focus', 'expiry')}
                    onBlur={() => setField('focus', undefined)}
                    onChange={(e) => setField('expiry', formatExpiry(e.target.value))}
                  />
                  {errors.expiry && <span className="billing-form-error">{errors.expiry}</span>}
                </div>

                <div className="billing-form-group">
                  <label className="billing-form-label">CVC / CVV</label>
                  <input
                    className={`billing-form-input${errors.cvc ? ' error' : ''}`}
                    type="tel"
                    placeholder="•••"
                    value={form.cvc}
                    maxLength={4}
                    autoComplete="cc-csc"
                    onFocus={() => setField('focus', 'cvc')}
                    onBlur={() => setField('focus', undefined)}
                    onChange={(e) => setField('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  />
                  {errors.cvc && <span className="billing-form-error">{errors.cvc}</span>}
                </div>
              </div>

              <label className="billing-form-checkbox">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setField('isDefault', e.target.checked)}
                />
                Сделать основной картой
              </label>
            </div>
          </div>

          <div className="billing-modal-footer">
            <div className="billing-modal-actions">
              <button type="submit" className="billing-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="billing-spinner" />
                    Сохранение…
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    Сохранить карту
                  </>
                )}
              </button>
              <button type="button" className="billing-cancel-btn" onClick={onClose} disabled={loading}>
                Отмена
              </button>
            </div>
            <p className="billing-modal-security">
              <Lock size={10} />
              Данные карты токенизируются — PAN и CVC не хранятся на сервере
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
