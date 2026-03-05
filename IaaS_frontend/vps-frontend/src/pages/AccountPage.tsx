import { useState } from 'react';
import { useProjectsStore } from '../store/projectsStore';
import seedMembers from '../data/teamMembers.json';
import './Page.css';
import './AccountPage.css';

const MOCK_USER = {
  name: 'Иван Петров',
  email: 'ivan@example.com',
  role: 'Основной владелец',
  createdAt: '12.01.2026'
};

// ── Types ────────────────────────────────────────────────────────────────────

type RoleId = 'developer' | 'manager' | 'viewer' | 'custom';

interface CustomPerms {
  read: boolean;
  write: boolean;
  invite: boolean;
}

export interface TeamMember {
  id: string;
  email: string;
  role: RoleId;
  permissions: CustomPerms;
  /** 'all' means access to every project; otherwise array of project IDs */
  projects: 'all' | string[];
  invitedAt: string;
  status: 'pending' | 'active';
}

// ── Constants ─────────────────────────────────────────────────────────────────

interface RoleDef {
  id: RoleId;
  label: string;
  description: string;
}

const ROLES: RoleDef[] = [
  {
    id: 'developer',
    label: 'Разработчик',
    description: 'Чтение и запись данных проекта. Без права приглашать участников.'
  },
  {
    id: 'manager',
    label: 'Менеджер',
    description: 'Чтение, запись и право приглашать новых участников команды.'
  },
  {
    id: 'viewer',
    label: 'Наблюдатель',
    description: 'Только чтение. Не может вносить изменения и приглашать участников.'
  },
  {
    id: 'custom',
    label: 'Особые права',
    description: 'Настройте права доступа вручную.'
  }
];

const ROLE_DEFAULTS: Record<RoleId, CustomPerms> = {
  developer: { read: true, write: true, invite: false },
  manager:   { read: true, write: true, invite: true  },
  viewer:    { read: true, write: false, invite: false },
  custom:    { read: false, write: false, invite: false }
};

const ROLE_LABELS: Record<RoleId, string> = {
  developer: 'Разработчик',
  manager:   'Менеджер',
  viewer:    'Наблюдатель',
  custom:    'Особые права'
};

// ── InviteModal ───────────────────────────────────────────────────────────────

interface InviteModalProps {
  onClose(): void;
  onInvite(member: TeamMember): void;
}

function InviteModal({ onClose, onInvite }: InviteModalProps) {
  const projects = useProjectsStore((s) => s.projects);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<RoleId>('developer');
  const [projectMode, setProjectMode] = useState<'all' | 'selected'>('all');
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [customPerms, setCustomPerms] = useState<CustomPerms>(ROLE_DEFAULTS.custom);
  const [sent, setSent] = useState(false);

  function toggleProject(id: string) {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleRoleChange(r: RoleId) {
    setRole(r);
    if (r !== 'custom') setCustomPerms(ROLE_DEFAULTS[r]);
  }

  function handleSend() {
    const member: TeamMember = {
      id: crypto.randomUUID(),
      email: email.trim(),
      role,
      permissions: role === 'custom' ? { ...customPerms } : ROLE_DEFAULTS[role],
      projects: projectMode === 'all' ? 'all' : Array.from(selectedProjects),
      invitedAt: new Date().toISOString(),
      status: 'pending'
    };
    onInvite(member);
    setSent(true);
    setTimeout(onClose, 1400);
  }

  const canSend =
    email.trim().length > 0 &&
    (projectMode === 'all' || selectedProjects.size > 0);

  if (sent) {
    return (
      <div className="acc-modal-overlay" onClick={onClose}>
        <div className="acc-modal" onClick={(e) => e.stopPropagation()}>
          <div className="acc-modal-sent">
            <div className="acc-modal-sent-icon">✓</div>
            <p>Приглашение отправлено</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="acc-modal-overlay" onClick={onClose}>
      <div className="acc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="acc-modal-head">
          <h3 className="acc-modal-title">Пригласить участника</h3>
          <button type="button" className="acc-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Email */}
        <label className="acc-field-label">Email участника</label>
        <input
          type="email"
          className="acc-input"
          placeholder="colleague@company.ru"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Role */}
        <label className="acc-field-label" style={{ marginTop: 16 }}>Роль</label>
        <div className="acc-role-grid">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`acc-role-card ${role === r.id ? 'acc-role-card-active' : ''}`}
              onClick={() => handleRoleChange(r.id)}
            >
              <span className="acc-role-name">{r.label}</span>
              <span className="acc-role-desc">{r.description}</span>
            </button>
          ))}
        </div>

        {/* Custom permissions */}
        {role === 'custom' && (
          <div className="acc-custom-perms">
            <p className="acc-custom-perms-title">Настройка прав</p>
            <div className="acc-perm-list">
              <label className="acc-perm-row">
                <input type="checkbox" checked={customPerms.read}
                  onChange={(e) => setCustomPerms({ ...customPerms, read: e.target.checked })} />
                <span>Чтение — просматривать серверы и ресурсы проекта</span>
              </label>
              <label className="acc-perm-row">
                <input type="checkbox" checked={customPerms.write}
                  onChange={(e) => setCustomPerms({ ...customPerms, write: e.target.checked })} />
                <span>Запись — создавать, изменять и удалять ресурсы</span>
              </label>
              <label className="acc-perm-row">
                <input type="checkbox" checked={customPerms.invite}
                  onChange={(e) => setCustomPerms({ ...customPerms, invite: e.target.checked })} />
                <span>Приглашение — добавлять новых участников команды</span>
              </label>
            </div>
          </div>
        )}

        {/* Projects */}
        <label className="acc-field-label" style={{ marginTop: 16 }}>Доступ к проектам</label>
        <div className="acc-proj-mode">
          <button type="button"
            className={`acc-proj-mode-btn ${projectMode === 'all' ? 'active' : ''}`}
            onClick={() => setProjectMode('all')}>
            Все проекты
          </button>
          <button type="button"
            className={`acc-proj-mode-btn ${projectMode === 'selected' ? 'active' : ''}`}
            onClick={() => setProjectMode('selected')}>
            Выбранные проекты
          </button>
        </div>

        {projectMode === 'selected' && (
          <div className="acc-proj-list">
            {projects.length === 0 ? (
              <p className="acc-proj-empty">Нет доступных проектов</p>
            ) : (
              projects.map((p) => (
                <label key={p.id} className="acc-proj-row">
                  <input type="checkbox"
                    checked={selectedProjects.has(p.id)}
                    onChange={() => toggleProject(p.id)} />
                  <span className="acc-proj-name">{p.name}</span>
                  <span className="acc-proj-region">{p.region}</span>
                </label>
              ))
            )}
          </div>
        )}

        {/* Actions */}
        <div className="acc-modal-actions">
          <button type="button" className="page-btn page-btn-outline" onClick={onClose}>
            Отмена
          </button>
          <button type="button" className="page-btn page-btn-primary"
            disabled={!canSend} onClick={handleSend}>
            Пригласить
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AccountPage ───────────────────────────────────────────────────────────────

export function AccountPage() {
  const [showInvite, setShowInvite] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>(seedMembers as TeamMember[]);

  function handleInvite(member: TeamMember) {
    setMembers((prev) => [...prev, member]);
  }

  function handleDelete(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  return (
    <section className="page page-wide">
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvite={handleInvite}
        />
      )}

      <header className="page-header-row">
        <div>
          <h1 className="page-title">Аккаунт</h1>
          <p className="page-text">
            Профиль, безопасность и доступ к облачной инфраструктуре.
          </p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="page-btn page-btn-outline">
            Выйти
          </button>
        </div>
      </header>

      <div className="page-grid">
        <section className="page-card">
          <h2 className="page-card-title">Профиль</h2>
          <p className="page-card-text">
            Эти данные используются в счетах и уведомлениях.
          </p>
          <dl className="page-description-list">
            <div className="page-description-row">
              <dt>Имя</dt>
              <dd>{MOCK_USER.name}</dd>
            </div>
            <div className="page-description-row">
              <dt>Email</dt>
              <dd>{MOCK_USER.email}</dd>
            </div>
            <div className="page-description-row">
              <dt>Роль</dt>
              <dd>{MOCK_USER.role}</dd>
            </div>
            <div className="page-description-row">
              <dt>В IaaS с</dt>
              <dd>{MOCK_USER.createdAt}</dd>
            </div>
          </dl>
          <button type="button" className="page-btn page-btn-ghost">
            Редактировать профиль
          </button>
        </section>

        <section className="page-card">
          <h2 className="page-card-title">Безопасность</h2>
          <p className="page-card-text">
            Рекомендуем включить двухфакторную аутентификацию и использовать SSH‑ключи.
          </p>
          <ul className="page-list">
            <li className="page-list-item">
              <div>
                <div className="page-list-primary">Пароль</div>
                <div className="page-list-secondary">Последнее изменение: 03.02.2026</div>
              </div>
              <button type="button" className="page-link">Изменить</button>
            </li>
            <li className="page-list-item">
              <div>
                <div className="page-list-primary">Двухфакторная аутентификация</div>
                <div className="page-list-secondary">Отключена</div>
              </div>
              <button type="button" className="page-link">Включить</button>
            </li>
            <li className="page-list-item">
              <div>
                <div className="page-list-primary">SSH‑ключи</div>
                <div className="page-list-secondary">2 активных ключа</div>
              </div>
              <button type="button" className="page-link">Открыть раздел</button>
            </li>
          </ul>
        </section>
      </div>

      <section className="page-card">
        <div className="page-card-header-row">
          <div>
            <h2 className="page-card-title">Команда и доступы</h2>
            <p className="page-card-text">
              Пригласите коллег, дайте им доступ к серверам и платёжным данным.
            </p>
          </div>
          <button type="button" className="page-btn page-btn-primary"
            onClick={() => setShowInvite(true)}>
            Пригласить в команду
          </button>
        </div>

        <div className="page-table acc-team-table">
          <div className="page-table-header">
            <span>Email</span>
            <span>Роль</span>
            <span>Проекты</span>
            <span>Статус</span>
            <span>Приглашён</span>
            <span />
          </div>
          <div className="page-table-body">
            {/* Owner row — always first, no delete */}
            <div className="page-table-row">
              <span>{MOCK_USER.email}</span>
              <span>{MOCK_USER.role}</span>
              <span>Все</span>
              <span className="page-badge page-badge-success">Активен</span>
              <span>{MOCK_USER.createdAt}</span>
              <span />
            </div>

            {/* Invited members */}
            {members.map((m) => (
              <div key={m.id} className="page-table-row">
                <span>{m.email}</span>
                <span>{ROLE_LABELS[m.role]}</span>
                <span>
                  {m.projects === 'all'
                    ? 'Все'
                    : `${(m.projects as string[]).length} пр.`}
                </span>
                <span className="page-badge page-badge-warning">Ожидает</span>
                <span>{formatDate(m.invitedAt)}</span>
                <button type="button" className="acc-delete-btn"
                  title="Удалить участника"
                  onClick={() => handleDelete(m.id)}>
                  ✕
                </button>
              </div>
            ))}

            {/* Empty hint when no invited members */}
            {members.length === 0 && (
              <div className="page-table-row acc-team-empty-row">
                <span style={{ color: '#999', fontStyle: 'italic' }}>
                  Нет приглашённых участников
                </span>
                <span /><span /><span /><span />
                <button type="button" className="page-link"
                  onClick={() => setShowInvite(true)}>
                  Пригласить
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
