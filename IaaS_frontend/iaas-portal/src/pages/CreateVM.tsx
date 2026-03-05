import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { colors } from '../theme';
import { useToast } from '../components/ToastProvider';

const pageTitle = { margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' };
const pageSub = { margin: '0 0 24px', fontSize: 14, color: 'rgba(255,255,255,0.85)' };

const PRESETS = [
  { id: 'ml', name: 'Нейронка', desc: 'Сервис инференса LLM по API (чтение/чат‑боты).' },
  { id: 'api', name: 'API сервис', desc: 'Бэкенд, Telegram‑бот, REST/GraphQL API.' },
  { id: 'web', name: 'Веб‑сервис', desc: 'Лендинг, сайт, админка или дашборд.' },
] as const;

const FLAVORS = [
  { id: 'small', name: 'Small', cpu: '2 vCPU', ram: '4 GB', price: 45 },
  { id: 'medium', name: 'Medium', cpu: '4 vCPU', ram: '8 GB', price: 89 },
  { id: 'large', name: 'Large', cpu: '8 vCPU', ram: '32 GB', price: 220 },
] as const;

const STEPS = ['Что разворачиваем?', 'Мощность', 'Доступ'] as const;

export function CreateVM() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [preset, setPreset] = useState<string | null>(null);
  const [flavor, setFlavor] = useState<string | null>(null);
  const [sshKey, setSshKey] = useState<'upload' | 'generate' | null>(null);

  const SPEND_LIMIT = 2000;

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && PRESETS.some((p) => p.id === type)) {
      setPreset(type);
    }
  }, [searchParams]);

  const canNextStep1 = preset != null;
  const canNextStep2 = flavor != null;
  const canNextStep3 = sshKey != null;

  const handleFinish = () => {
    const ip = '203.0.113.100';
    const sshCommand = `ssh ubuntu@${ip}`;
    showToast(`Сервис создаётся. IP: ${ip}, SSH: ${sshCommand}`);
    navigate('/compute/vms', {
      state: {
        newService: {
          ip,
          sshCommand,
        },
      },
    });
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1 style={pageTitle}>Создать сервис</h1>
      <p style={pageSub}>Мастер из 3 шагов</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {STEPS.map((label, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 14,
              fontSize: 12,
              fontWeight: 600,
              textAlign: 'center',
              background: i <= step ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
              color: i <= step ? colors.text : 'rgba(255,255,255,0.9)',
            }}
          >
            {i + 1}. {label}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card title="Шаг 1: Что разворачиваем?">
          <p style={{ margin: '0 0 12px', fontSize: 14, color: colors.textSecondary }}>
            Выберите сценарий на человеческом языке — мы подберём конфигурацию VM под задачу.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                style={{
                  padding: 16,
                  textAlign: 'left',
                  borderRadius: 16,
                  border: `2px solid ${preset === p.id ? colors.primary : colors.divider}`,
                  background: preset === p.id ? 'rgba(0, 136, 255, 0.08)' : 'transparent',
                  cursor: 'pointer',
                  font: 'inherit',
                }}
              >
                <div style={{ fontWeight: 600, color: colors.text }}>{p.name}</div>
                <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>{p.desc}</div>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => navigate('/compute/vms')}>Отмена</Button>
            <Button onClick={() => setStep(1)} disabled={!canNextStep1}>Далее</Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card title="Шаг 2: Мощность">
          <p style={{ margin: '0 0 8px', fontSize: 14, color: colors.textSecondary }}>
            Выберите размер — мы покажем цену в день и примерную стоимость в месяц.
          </p>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: colors.textSecondary }}>
            Ваш лимит расходов: <strong style={{ color: colors.text }}>{SPEND_LIMIT} ₽/мес</strong>. Ниже — оценка для одного сервиса.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FLAVORS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFlavor(f.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  borderRadius: 16,
                  border: `2px solid ${flavor === f.id ? colors.primary : colors.divider}`,
                  background: flavor === f.id ? 'rgba(0, 136, 255, 0.08)' : 'transparent',
                  cursor: 'pointer',
                  font: 'inherit',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: colors.text }}>{f.name}</div>
                  <div style={{ fontSize: 13, color: colors.textSecondary }}>{f.cpu}, {f.ram}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: colors.primary }}>{f.price} ₽/день</div>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>
                    ≈ {f.price * 30} ₽/мес
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setStep(0)}>Назад</Button>
            <Button onClick={() => setStep(2)} disabled={!canNextStep2}>Далее</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card title="Шаг 3: Доступ">
          <p style={{ margin: '0 0 16px', fontSize: 14, color: colors.textSecondary }}>
            SSH-ключ для входа на VM.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label className="app-checkbox-label">
              <input
                type="radio"
                name="ssh"
                checked={sshKey === 'upload'}
                onChange={() => setSshKey('upload')}
              />
              <span>Загрузить свой SSH-ключ</span>
            </label>
            <label className="app-checkbox-label">
              <input
                type="radio"
                name="ssh"
                checked={sshKey === 'generate'}
                onChange={() => setSshKey('generate')}
              />
              <span>Сгенерировать новый ключ</span>
            </label>
          </div>
          <div
            style={{
              marginTop: 16,
              padding: 14,
              background: 'rgba(0, 136, 255, 0.08)',
              borderRadius: 14,
              fontSize: 13,
              color: colors.textSecondary,
            }}
          >
            <strong style={{ color: colors.text }}>Как подключиться:</strong>
            <br />
            <code style={{ display: 'block', marginTop: 6, color: colors.text }}>
              ssh ubuntu@&lt;IP вашей VM&gt;
            </code>
            После создания VM IP и инструкция появятся в карточке машины.
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button variant="secondary" onClick={() => setStep(1)}>Назад</Button>
            <Button onClick={handleFinish} disabled={!canNextStep3}>Создать VM</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
