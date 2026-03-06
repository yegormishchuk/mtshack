import { useState } from 'react';
import { useAdminStore } from '../store/adminStore';
import './UsersPage.css';

interface MockUser {
  id: string;
  name: string;
  email: string;
  projects: number;
  instances: number;
  registered: string;
  lastActive: string;
  blocked: boolean;
}

const INITIAL_USERS: MockUser[] = [
  { id: 'u1', name: 'Алексей Иванов', email: 'alexey@example.com', projects: 5, instances: 12, registered: '12.01.2024', lastActive: '05.03.2026', blocked: false },
  { id: 'u2', name: 'Мария Смирнова', email: 'maria@example.com', projects: 2, instances: 4, registered: '03.03.2024', lastActive: '04.03.2026', blocked: false },
  { id: 'u3', name: 'Дмитрий Козлов', email: 'dmitry@example.com', projects: 8, instances: 21, registered: '27.11.2023', lastActive: '06.03.2026', blocked: false },
  { id: 'u4', name: 'Елена Попова', email: 'elena@example.com', projects: 1, instances: 1, registered: '15.05.2024', lastActive: '01.03.2026', blocked: false },
  { id: 'u5', name: 'Николай Новиков', email: 'nikolay@example.com', projects: 14, instances: 48, registered: '08.09.2023', lastActive: '06.03.2026', blocked: false },
  { id: 'u6', name: 'Ольга Соколова', email: 'olga@example.com', projects: 3, instances: 7, registered: '22.02.2024', lastActive: '28.02.2026', blocked: false },
  { id: 'u7', name: 'Андрей Морозов', email: 'andrey@example.com', projects: 6, instances: 15, registered: '11.07.2024', lastActive: '05.03.2026', blocked: false },
  { id: 'u8', name: 'Светлана Волкова', email: 'svetlana@example.com', projects: 0, instances: 0, registered: '29.01.2026', lastActive: '29.01.2026', blocked: false },
  { id: 'u9', name: 'Игорь Петров', email: 'igor@example.com', projects: 22, instances: 67, registered: '14.06.2023', lastActive: '06.03.2026', blocked: false },
  { id: 'u10', name: 'Анна Кузнецова', email: 'anna@example.com', projects: 4, instances: 9, registered: '07.10.2024', lastActive: '03.03.2026', blocked: false },
];

export function UsersPage() {
  const addToast = useAdminStore((s) => s.addToast);
  const [users, setUsers] = useState<MockUser[]>(INITIAL_USERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !u.blocked) ||
      (statusFilter === 'blocked' && u.blocked);
    return matchSearch && matchStatus;
  });

  const handleToggleBlock = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const next = { ...u, blocked: !u.blocked };
        addToast(
          next.blocked
            ? `Пользователь «${u.name}» заблокирован`
            : `Пользователь «${u.name}» разблокирован`
        );
        return next;
      })
    );
  };

  const activeCount = users.filter((u) => !u.blocked).length;
  const blockedCount = users.filter((u) => u.blocked).length;

  return (
    <div className="users-root">
      <div className="page-header">
        <div>
          <h1 className="page-title">Пользователи</h1>
          <p className="page-subtitle">
            {users.length} всего &nbsp;·&nbsp;
            <span style={{ color: '#22C55E' }}>{activeCount} активных</span>
            {blockedCount > 0 && (
              <> &nbsp;·&nbsp; <span style={{ color: '#EF4444' }}>{blockedCount} заблокированных</span></>
            )}
          </p>
        </div>
      </div>

      <div className="users-toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Поиск по имени или email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="users-filters">
          <div className="filter-chips">
            {(['all', 'active', 'blocked'] as const).map((s) => (
              <button
                key={s}
                className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'Все' : s === 'active' ? 'Активные' : 'Заблокированные'}
                <span className="chip-count">
                  {s === 'all' ? users.length : s === 'active' ? activeCount : blockedCount}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="page-empty">Пользователи не найдены</div>
      )}

      {filtered.length > 0 && (
        <div className="users-table-wrap">
          <div className="users-table-header">
            <div className="users-th">Пользователь</div>
            <div className="users-th">Проектов</div>
            <div className="users-th">Инстансов</div>
            <div className="users-th">Зарегистрирован</div>
            <div className="users-th">Последняя активность</div>
            <div className="users-th">Статус</div>
            <div className="users-th">Действие</div>
          </div>
          <div className="users-table-body">
            {filtered.map((user) => (
              <div key={user.id} className={`users-row ${user.blocked ? 'users-row-blocked' : ''}`}>
                <div className="users-name-cell">
                  <div className="users-avatar" style={{ background: user.blocked ? '#fee2e2' : '#f0f0ff' }}>
                    {user.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="users-name">{user.name}</div>
                    <div className="users-email">{user.email}</div>
                  </div>
                </div>
                <div className="users-cell users-cell-num">{user.projects}</div>
                <div className="users-cell users-cell-num">{user.instances}</div>
                <div className="users-cell users-cell-muted">{user.registered}</div>
                <div className="users-cell users-cell-muted">{user.lastActive}</div>
                <div className="users-cell">
                  <span className={`users-status-badge ${user.blocked ? 'users-status-blocked' : 'users-status-active'}`}>
                    {user.blocked ? 'Заблокирован' : 'Активен'}
                  </span>
                </div>
                <div className="users-cell">
                  <button
                    className={`users-action-btn ${user.blocked ? 'users-action-unblock' : 'users-action-block'}`}
                    onClick={() => handleToggleBlock(user.id)}
                  >
                    {user.blocked ? 'Разблокировать' : 'Заблокировать'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
