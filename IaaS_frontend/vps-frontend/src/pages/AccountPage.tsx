import { useState, useEffect } from 'react';
import { User, Lock, Users, Send } from 'lucide-react';
import { useProjectsStore } from '../store/projectsStore';
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

const INVITE_ROLES = [
  { value: 'analyst',   label: 'Аналитик',    desc: 'Только просмотр' },
  { value: 'developer', label: 'Разработчик', desc: 'Просмотр и запись' },
  { value: 'manager',   label: 'Менеджер',    desc: 'Просмотр, запись, приглашения' },
  { value: 'custom',    label: 'Custom',       desc: 'Ручной выбор прав' },
];

const CUSTOM_PERMISSIONS = [
  { key: 'view',   label: 'Просмотр' },
  { key: 'write',  label: 'Запись' },
  { key: 'invite', label: 'Приглашение участников' },
];

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('analyst');
  const [customPerms, setCustomPerms] = useState<Record<string, boolean>>({ view: false, write: false, invite: false });
  const [projectAccess, setProjectAccess] = useState<'all' | 'select'>('all');
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [sent, setSent] = useState(false);

  const { projects, loadProjects } = useProjectsStore();

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  function toggleProject(id: string) {
    setSelectedProjects(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function togglePerm(key: string) {
    setCustomPerms(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  }

  const cardStyle = (active: boolean): React.CSSProperties => ({
    border: active ? '2px solid #FF0023' : '1.5px solid #e5e7eb',
    borderRadius: 14, padding: '10px 14px', textAlign: 'left', cursor: 'pointer',
    background: active ? 'rgba(255,0,35,0.05)' : '#f9f9f9',
    transition: 'all 0.15s',
  });

  return (
    <div className="acct-modal-overlay" onClick={onClose}>
      <div className="acct-modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Пригласить в команду</h2>
        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#6b7280' }}>
          Участник получит письмо со ссылкой для входа
        </p>

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
            {/* Email */}
            <div className="acct-modal-field">
              <label className="acct-modal-label" htmlFor="invite-email">Email адрес</label>
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

            {/* Role */}
            <div className="acct-modal-field">
              <div className="acct-modal-label">Роль</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {INVITE_ROLES.map(({ value, label, desc }) => (
                  <button key={value} type="button" onClick={() => setRole(value)} style={cardStyle(role === value)}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: role === value ? '#FF0023' : '#111' }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom permissions */}
            {role === 'custom' && (
              <div className="acct-modal-field">
                <div className="acct-modal-label">Права доступа</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {CUSTOM_PERMISSIONS.map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#111' }}>
                      <input
                        type="checkbox"
                        checked={customPerms[key]}
                        onChange={() => togglePerm(key)}
                        style={{ accentColor: '#FF0023', width: 16, height: 16, cursor: 'pointer' }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Project access */}
            <div className="acct-modal-field">
              <div className="acct-modal-label">Доступ к проектам</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: projectAccess === 'select' ? 10 : 0 }}>
                {([['all', 'Все проекты'], ['select', 'Выбрать проекты']] as const).map(([val, lbl]) => (
                  <button key={val} type="button" onClick={() => setProjectAccess(val)} style={{ ...cardStyle(projectAccess === val), flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: projectAccess === val ? '#FF0023' : '#111' }}>{lbl}</div>
                  </button>
                ))}
              </div>
              {projectAccess === 'select' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 160, overflowY: 'auto', paddingRight: 2 }}>
                  {projects.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>Нет доступных проектов</div>
                  ) : projects.map((p) => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#111' }}>
                      <input
                        type="checkbox"
                        checked={selectedProjects.has(p.id)}
                        onChange={() => toggleProject(p.id)}
                        style={{ accentColor: '#FF0023', width: 16, height: 16, cursor: 'pointer' }}
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="acct-modal-actions">
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '0 22px', height: 40, borderRadius: 999, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                Отмена
              </button>
              <button
                type="submit"
                style={{
                  padding: '0 24px', height: 40, borderRadius: 999, border: 'none',
                  background: '#FF0023', color: '#fff',
                  cursor: 'pointer', fontSize: 14, fontWeight: 700,
                  boxShadow: '0 8px 20px rgba(255,0,35,0.28)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
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
              <span className="acct-table-role">Владелец</span>
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
