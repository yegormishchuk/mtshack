import './Page.css';

const MOCK_KEYS = [
  {
    id: 'key-1',
    name: 'MacBook Pro',
    fingerprint: 'SHA256:ab:cd:ef:12:34',
    createdAt: '04.03.2026',
    lastUsed: 'Сегодня, 10:22',
    scope: 'Все проекты'
  },
  {
    id: 'key-2',
    name: 'CI/CD Runner',
    fingerprint: 'SHA256:98:76:54:32:10',
    createdAt: '20.02.2026',
    lastUsed: 'Вчера, 18:04',
    scope: 'Только staging'
  }
] as const;

export function SshKeysPage() {
  return (
    <section className="page page-wide">
      <header className="page-header-row">
        <div>
          <h1 className="page-title">SSH ключи</h1>
          <p className="page-text">
            Управляйте SSH‑ключами для доступа к серверам без пароля.
          </p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="page-btn page-btn-primary">
            Добавить ключ
          </button>
        </div>
      </header>

      <div className="page-card">
        <h2 className="page-card-title">Как это работает</h2>
        <p className="page-card-text">
          Добавьте публичный SSH‑ключ. Мы автоматически привяжем его к новым серверам и
          безопасно доставим в существующие.
        </p>
        <ul className="page-list">
          <li className="page-list-item">
            <div>
              <div className="page-list-primary">1. Сгенерируйте ключ локально</div>
              <div className="page-list-secondary">ssh-keygen -t ed25519</div>
            </div>
          </li>
          <li className="page-list-item">
            <div>
              <div className="page-list-primary">2. Вставьте публичную часть</div>
              <div className="page-list-secondary">Например, id_ed25519.pub</div>
            </div>
          </li>
          <li className="page-list-item">
            <div>
              <div className="page-list-primary">3. Подключайтесь по SSH</div>
              <div className="page-list-secondary">ssh clouduser@your-server</div>
            </div>
          </li>
        </ul>
      </div>

      <section className="page-card">
        <div className="page-card-header-row">
          <div>
            <h2 className="page-card-title">Добавленные ключи</h2>
            <p className="page-card-text">
              Активные ключи, которые имеют доступ к вашим серверам.
            </p>
          </div>
        </div>

        <div className="page-table">
          <div className="page-table-header">
            <span>Название</span>
            <span>Fingerprint</span>
            <span>Создан</span>
            <span>Последнее использование</span>
            <span>Доступ</span>
            <span />
          </div>
          <div className="page-table-body">
            {MOCK_KEYS.map((key) => (
              <div key={key.id} className="page-table-row">
                <span>{key.name}</span>
                <span>{key.fingerprint}</span>
                <span>{key.createdAt}</span>
                <span>{key.lastUsed}</span>
                <span>{key.scope}</span>
                <button type="button" className="page-link">
                  Управлять
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}

