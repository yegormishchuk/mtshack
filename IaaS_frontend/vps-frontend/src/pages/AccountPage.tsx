import { useState } from 'react';
import { User, Lock, Users, X, Send } from 'lucide-react';
import './AccountPage.css';

const MOCK_USER = {
  name: 'Иван Петров',
  email: 'ivan@example.com',
  role: 'Основной владелец',
  createdAt: '12.01.2026',
};

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="acct-avatar"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden
    >
      {initials}
    </div>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [sent, setSent] = useState(false);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  }

  return (
    <div className="acct-modal-overlay" onClick={onClose}>
      <div className="acct-modal" onClick={(e) => e.stopPropagation()}>
        <div className="acct-modal-header">
          <div>
            <div className="acct-modal-title">Пригласить в команду</div>
            <div className="acct-modal-subtitle">
              Участник получит письмо со ссылкой для входа
            </div>
          </div>
          <button type="button" className="acct-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {sent ? (
          <div className="acct-modal-success">
            <div className="acct-modal-success-icon">✓</div>
            <div className="acct-modal-success-title">Приглашение отправлено</div>
            <div className="acct-modal-success-sub">{email}</div>
            <button type="button" className="acct-btn acct-btn-ghost" style={{ marginTop: 16 }} onClick={onClose}>
              Закрыть
            </button>
          </div>
        ) : (
          <form className="acct-modal-body" onSubmit={handleSend}>
            <div className="acct-modal-field">
              <label className="acct-modal-label" htmlFor="invite-email">
                Email адрес
              </label>
              <input
                id="invite-email"
                type="email"
                className="acct-modal-input"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="acct-modal-field">
              <label className="acct-modal-label" htmlFor="invite-role">
                Роль
              </label>
              <select
                id="invite-role"
                className="acct-modal-input acct-modal-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="viewer">Наблюдатель — только просмотр</option>
                <option value="developer">Разработчик — серверы и деплой</option>
                <option value="billing">Финансы — доступ к счетам</option>
                <option value="admin">Администратор — полный доступ</option>
              </select>
            </div>
            <div className="acct-modal-actions">
              <button type="button" className="acct-btn acct-btn-secondary" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="acct-btn acct-btn-primary-dark">
                <Send size={13} />
                Отправить приглашение
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function AccountPage() {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="acct-root">
      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="acct-header">
        <div>
          <h1 className="acct-title">Аккаунт</h1>
          <p className="acct-subtitle">
            Управляйте профилем, безопасностью и доступами к инфраструктуре
          </p>
        </div>
        <div className="acct-header-right">
          <div className="acct-user-chip">
            <Avatar name={MOCK_USER.name} size={28} />
            <span>{MOCK_USER.name}</span>
          </div>
          <button type="button" className="acct-btn acct-btn-secondary">
            Выйти
          </button>
        </div>
      </header>

      {/* ── Profile + Security ─────────────────────────────── */}
      <div className="acct-top-grid">
        {/* Profile */}
        <section className="acct-card">
          <div className="acct-card-title-row">
            <User size={16} className="acct-card-icon" />
            <h2 className="acct-card-title">Профиль</h2>
          </div>

          <div className="acct-profile-identity">
            <Avatar name={MOCK_USER.name} size={48} />
            <div>
              <div className="acct-profile-name">{MOCK_USER.name}</div>
              <div className="acct-profile-role">{MOCK_USER.role}</div>
            </div>
          </div>

          <dl className="acct-dl">
            <div className="acct-dl-row">
              <dt>Имя</dt>
              <dd>{MOCK_USER.name}</dd>
            </div>
            <div className="acct-dl-row">
              <dt>Email</dt>
              <dd>{MOCK_USER.email}</dd>
            </div>
            <div className="acct-dl-row">
              <dt>Роль</dt>
              <dd>{MOCK_USER.role}</dd>
            </div>
            <div className="acct-dl-row">
              <dt>Дата регистрации</dt>
              <dd>{MOCK_USER.createdAt}</dd>
            </div>
          </dl>

          <button type="button" className="acct-btn acct-btn-ghost">
            Редактировать профиль
          </button>
        </section>

        {/* Security */}
        <section className="acct-card">
          <div className="acct-card-title-row">
            <Lock size={16} className="acct-card-icon" />
            <h2 className="acct-card-title">Безопасность аккаунта</h2>
          </div>

          <div className="acct-security-status">
            <span className="acct-security-dot acct-security-dot-medium" />
            <span className="acct-security-label-medium">
              Средний уровень безопасности
            </span>
          </div>

          <ul className="acct-security-list">
            <li className="acct-security-row">
              <div>
                <div className="acct-security-row-label">Пароль</div>
                <div className="acct-security-row-status">
                  Последнее изменение: 03.02.2026
                </div>
              </div>
              <button type="button" className="acct-link-btn">
                Изменить
              </button>
            </li>
            <li className="acct-security-row">
              <div>
                <div className="acct-security-row-label">
                  Двухфакторная аутентификация
                </div>
                <div className="acct-security-row-status">Отключена</div>
              </div>
              <button type="button" className="acct-link-btn">
                Включить
              </button>
            </li>
            <li className="acct-security-row">
              <div>
                <div className="acct-security-row-label">SSH-ключи</div>
                <div className="acct-security-row-status">2 активных ключа</div>
              </div>
              <button type="button" className="acct-link-btn">
                Управлять
              </button>
            </li>
          </ul>
        </section>
      </div>

      {/* ── Team & Access ──────────────────────────────────── */}
      <section className="acct-card">
        <div className="acct-team-header">
          <div className="acct-team-header-text">
            <div className="acct-card-title-row">
              <Users size={16} className="acct-card-icon" />
              <h2 className="acct-card-title">Команда и доступы</h2>
            </div>
            <p className="acct-team-description">
              Пригласите коллег и управляйте доступом к серверам и платёжным данным.
            </p>
          </div>
          <button type="button" className="acct-btn acct-btn-invite" onClick={() => setInviteOpen(true)}>
            Пригласить в команду
          </button>
        </div>

        <div className="acct-table-wrap">
          <div className="acct-table-head">
            <span>Участник</span>
            <span>Email</span>
            <span>Роль</span>
            <span>Статус</span>
            <span />
          </div>
          <div className="acct-table-body">
            <div className="acct-table-row">
              <div className="acct-table-member">
                <Avatar name="Иван Петров" size={28} />
                <span>Иван Петров</span>
              </div>
              <span className="acct-table-email">ivan@example.com</span>
              <span className="acct-table-role">Owner</span>
              <span className="acct-badge acct-badge-success">Активен</span>
              <div className="acct-table-actions">
                <button type="button" className="acct-link-btn">
                  Управлять
                </button>
              </div>
            </div>
            <div className="acct-table-row">
              <div className="acct-table-member">
                <div
                  className="acct-avatar"
                  style={{
                    width: 28,
                    height: 28,
                    fontSize: 11,
                    background: '#e5e7eb',
                    color: '#9ca3af',
                  }}
                >
                  +
                </div>
                <span style={{ color: '#6b7280' }}>Добавить участника</span>
              </div>
              <span />
              <span />
              <span className="acct-badge acct-badge-muted">Пока только вы</span>
              <div className="acct-table-actions">
                <button type="button" className="acct-link-btn" onClick={() => setInviteOpen(true)}>
                  Пригласить
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
