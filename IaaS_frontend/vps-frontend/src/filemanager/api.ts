import type {
  FileKind,
  RemoteApiInterface,
  RemoteItem,
} from './types';

// ── Helpers ──────────────────────────────────────────────────────
const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));
let _idCounter = 1;
const uid = () => `r${_idCounter++}`;

function kindFromName(name: string): FileKind {
  if (name.startsWith('.env')) return 'env';
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico'].includes(ext)) return 'image';
  if (['json', 'jsonc'].includes(ext)) return 'json';
  if (['log'].includes(ext)) return 'log';
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'sh', 'bash', 'yml', 'yaml', 'toml', 'xml', 'sql', 'dockerfile'].includes(ext)) return 'code';
  if (['zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar'].includes(ext)) return 'archive';
  if (['txt', 'md', 'csv', 'ini', 'cfg', 'conf'].includes(ext)) return 'text';
  if (['exe', 'bin', 'so', 'dll', 'iso', 'dmg', 'deb', 'rpm'].includes(ext)) return 'binary';
  return 'text';
}

function makeFile(
  serverId: string,
  name: string,
  dir: string,
  size: number,
  daysAgo: number,
  permissions = '-rw-r--r--',
  owner = 'ubuntu'
): RemoteItem {
  const modified = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
  const path = dir === '/' ? `/${name}` : `${dir}/${name}`;
  return {
    id: uid(),
    serverId,
    name,
    path,
    size,
    modified,
    isDirectory: false,
    kind: kindFromName(name),
    permissions,
    owner,
  };
}

function makeDir(
  serverId: string,
  name: string,
  dir: string,
  daysAgo: number,
  permissions = 'drwxr-xr-x',
  owner = 'ubuntu'
): RemoteItem {
  const modified = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
  const path = dir === '/' ? `/${name}` : `${dir}/${name}`;
  return {
    id: uid(),
    serverId,
    name,
    path,
    size: -1,
    modified,
    isDirectory: true,
    kind: 'folder',
    permissions,
    owner,
  };
}

// ── Static mock filesystem ────────────────────────────────────────
const MOCK_FS: Record<string, (serverId: string) => RemoteItem[]> = {
  '/': (s) => [
    makeDir(s, 'home', '/', 10),
    makeDir(s, 'etc', '/', 30),
    makeDir(s, 'var', '/', 5),
    makeDir(s, 'opt', '/', 15),
    makeDir(s, 'tmp', '/', 0),
  ],
  '/home': (s) => [makeDir(s, 'ubuntu', '/home', 10)],
  '/home/ubuntu': (s) => [
    makeDir(s, 'app', '/home/ubuntu', 3),
    makeDir(s, '.ssh', '/home/ubuntu', 10, 'drwx------'),
    makeFile(s, '.bashrc', '/home/ubuntu', 3_800, 10, '-rw-r--r--'),
    makeFile(s, '.profile', '/home/ubuntu', 807, 10, '-rw-r--r--'),
    makeFile(s, 'docker-compose.yml', '/home/ubuntu', 2_100, 2, '-rw-r--r--'),
    makeFile(s, '.env', '/home/ubuntu', 512, 3, '-rw-------'),
  ],
  '/home/ubuntu/app': (s) => [
    makeDir(s, 'src', '/home/ubuntu/app', 2),
    makeDir(s, 'dist', '/home/ubuntu/app', 1),
    makeFile(s, 'package.json', '/home/ubuntu/app', 1_200, 2, '-rw-r--r--'),
    makeFile(s, 'package-lock.json', '/home/ubuntu/app', 145_000, 2, '-rw-r--r--'),
    makeFile(s, 'README.md', '/home/ubuntu/app', 4_300, 5, '-rw-r--r--'),
    makeFile(s, 'Dockerfile', '/home/ubuntu/app', 980, 3, '-rw-r--r--'),
  ],
  '/home/ubuntu/app/src': (s) => [
    makeFile(s, 'index.ts', '/home/ubuntu/app/src', 3_200, 1),
    makeFile(s, 'config.ts', '/home/ubuntu/app/src', 1_800, 2),
    makeFile(s, 'server.ts', '/home/ubuntu/app/src', 5_600, 1),
    makeFile(s, 'routes.ts', '/home/ubuntu/app/src', 8_200, 1),
    makeFile(s, 'db.ts', '/home/ubuntu/app/src', 2_400, 3),
  ],
  '/home/ubuntu/app/dist': (s) => [
    makeFile(s, 'index.js', '/home/ubuntu/app/dist', 98_000, 1),
    makeFile(s, 'index.js.map', '/home/ubuntu/app/dist', 220_000, 1),
  ],
  '/home/ubuntu/.ssh': (s) => [
    makeFile(s, 'authorized_keys', '/home/ubuntu/.ssh', 400, 10, '-rw-------'),
    makeFile(s, 'known_hosts', '/home/ubuntu/.ssh', 2_300, 5, '-rw-r--r--'),
  ],
  '/etc': (s) => [
    makeDir(s, 'nginx', '/etc', 3),
    makeDir(s, 'systemd', '/etc', 10),
    makeFile(s, 'hosts', '/etc', 220, 30, '-rw-r--r--', 'root'),
    makeFile(s, 'hostname', '/etc', 12, 30, '-rw-r--r--', 'root'),
    makeFile(s, 'resolv.conf', '/etc', 80, 5, '-rw-r--r--', 'root'),
  ],
  '/etc/nginx': (s) => [
    makeDir(s, 'sites-enabled', '/etc/nginx', 3),
    makeFile(s, 'nginx.conf', '/etc/nginx', 2_800, 3, '-rw-r--r--', 'root'),
  ],
  '/etc/nginx/sites-enabled': (s) => [
    makeFile(s, 'default', '/etc/nginx/sites-enabled', 1_200, 3, '-rw-r--r--', 'root'),
  ],
  '/var': (s) => [
    makeDir(s, 'log', '/var', 0),
    makeDir(s, 'lib', '/var', 10),
  ],
  '/var/log': (s) => [
    makeFile(s, 'syslog', '/var/log', 8_400_000, 0, '-rw-r-----', 'syslog'),
    makeFile(s, 'auth.log', '/var/log', 1_200_000, 0, '-rw-r-----', 'syslog'),
    makeFile(s, 'nginx-access.log', '/var/log', 3_200_000, 0, '-rw-r--r--', 'www-data'),
    makeFile(s, 'nginx-error.log', '/var/log', 128_000, 0, '-rw-r--r--', 'www-data'),
  ],
  '/opt': (s) => [makeDir(s, 'backups', '/opt', 2)],
  '/opt/backups': (s) => [
    makeFile(s, 'db-2026-03-01.sql.gz', '/opt/backups', 45_000_000, 3, '-rw-r--r--'),
    makeFile(s, 'db-2026-03-02.sql.gz', '/opt/backups', 46_200_000, 2, '-rw-r--r--'),
    makeFile(s, 'db-2026-03-03.sql.gz', '/opt/backups', 44_800_000, 1, '-rw-r--r--'),
  ],
  '/tmp': () => [],
};

// ── Mock preview content ──────────────────────────────────────────
const MOCK_PREVIEWS: Record<string, string> = {
  '/home/ubuntu/.env': `DATABASE_URL=postgresql://user:password@localhost:5432/appdb\nREDIS_URL=redis://localhost:6379\nSECRET_KEY=super-secret-key-changeme\nDEBUG=false\nPORT=8000\nALLOWED_HOSTS=*.example.com`,
  '/home/ubuntu/docker-compose.yml': `version: '3.9'\nservices:\n  app:\n    build: .\n    ports:\n      - "8000:8000"\n    env_file: .env\n    depends_on:\n      - db\n  db:\n    image: postgres:15\n    volumes:\n      - pgdata:/var/lib/postgresql/data\nvolumes:\n  pgdata:`,
  '/etc/hosts': `127.0.0.1 localhost\n::1       localhost\n127.0.1.1 server.local server`,
  '/etc/nginx/nginx.conf': `user www-data;\nworker_processes auto;\npid /run/nginx.pid;\n\nevents {\n  worker_connections 1024;\n}\n\nhttp {\n  sendfile on;\n  include /etc/nginx/sites-enabled/*;\n}`,
};

// ── Mock implementation ───────────────────────────────────────────
export const mockApi: RemoteApiInterface = {
  async listRemote(serverId, path) {
    await delay(200 + Math.random() * 300);
    const factory = MOCK_FS[path] ?? MOCK_FS[path.replace(/\/$/, '')];
    if (!factory) return [];
    return factory(serverId);
  },

  async previewRemote(_serverId, path, _offset, _limit) {
    await delay(150 + Math.random() * 200);
    if (MOCK_PREVIEWS[path]) return MOCK_PREVIEWS[path];
    const name = path.split('/').pop() ?? '';
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (['log'].includes(ext)) {
      return Array.from({ length: 20 }, (_, i) =>
        `[2026-03-04 ${String(8 + Math.floor(i / 4)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}] INFO Request processed in ${10 + i * 3}ms — status 200`
      ).join('\n');
    }
    if (['ts', 'js'].includes(ext)) {
      return `// ${name}\nimport { createServer } from 'http';\n\nconst PORT = process.env.PORT ?? 8000;\n\nconst server = createServer((req, res) => {\n  res.writeHead(200, { 'Content-Type': 'application/json' });\n  res.end(JSON.stringify({ ok: true, path: req.url }));\n});\n\nserver.listen(PORT, () => {\n  console.log(\`Server running on port \${PORT}\`);\n});`;
    }
    if (['json'].includes(ext)) {
      return `{\n  "name": "${name}",\n  "version": "1.0.0",\n  "description": "Mock content",\n  "scripts": {\n    "start": "node dist/index.js",\n    "build": "tsc",\n    "dev": "ts-node src/index.ts"\n  }\n}`;
    }
    return `# ${name}\n\nThis is mock content for ${path}.\nReal content will be fetched from the server via SFTP/SSH.`;
  },

  async mkdirRemote(_serverId, path) {
    await delay(300);
    console.info('[mock] mkdir', path);
  },

  async renameRemote(_serverId, oldPath, newPath) {
    await delay(300);
    console.info('[mock] rename', oldPath, '->', newPath);
  },

  async deleteRemote(_serverId, paths) {
    await delay(400);
    console.info('[mock] delete', paths);
  },

  async downloadRemote(_serverId, path) {
    await delay(500);
    const content = MOCK_PREVIEWS[path] ?? `content of ${path}`;
    return new Blob([content], { type: 'text/plain' });
  },

  async uploadInit(_serverId, targetPath, manifest) {
    await delay(200);
    const id = `up-${Date.now()}`;
    console.info('[mock] uploadInit', targetPath, manifest.totalSize, 'bytes → id:', id);
    return id;
  },

  async uploadChunk(uploadId, _data, chunkIndex) {
    await delay(50 + Math.random() * 100);
    console.info('[mock] uploadChunk', uploadId, 'chunk', chunkIndex);
  },

  async uploadCommit(uploadId) {
    await delay(200);
    console.info('[mock] uploadCommit', uploadId);
  },
};
