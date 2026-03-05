import { useState } from 'react';
import type { Project, VM } from '../../domain/iaasTypes';

interface FileNode {
  name: string;
  type: 'dir' | 'file';
  size?: string;
  modified?: string;
  children?: FileNode[];
}

function buildMockTree(vm: VM): FileNode[] {
  if (vm.role === 'db') {
    return [
      {
        name: '/var/lib/postgresql',
        type: 'dir',
        children: [
          { name: 'data', type: 'dir', children: [
            { name: 'pg_hba.conf', type: 'file', size: '4.2 KB', modified: '2 дня назад' },
            { name: 'postgresql.conf', type: 'file', size: '22.1 KB', modified: '2 дня назад' },
            { name: 'PG_VERSION', type: 'file', size: '3 B', modified: '5 дней назад' },
          ]},
        ]
      },
      {
        name: '/var/log/postgresql',
        type: 'dir',
        children: [
          { name: 'postgresql-2026-03-04.log', type: 'file', size: '1.1 MB', modified: '1 час назад' },
          { name: 'postgresql-2026-03-03.log', type: 'file', size: '4.8 MB', modified: '1 день назад' },
        ]
      },
    ];
  }

  if (vm.role === 'frontend' || vm.role === 'proxy') {
    return [
      {
        name: '/etc/nginx',
        type: 'dir',
        children: [
          { name: 'nginx.conf', type: 'file', size: '2.8 KB', modified: '3 дня назад' },
          { name: 'sites-enabled', type: 'dir', children: [
            { name: 'default', type: 'file', size: '1.2 KB', modified: '3 дня назад' },
          ]},
        ]
      },
      {
        name: '/var/www/html',
        type: 'dir',
        children: [
          { name: 'index.html', type: 'file', size: '12.4 KB', modified: '1 день назад' },
          { name: 'assets', type: 'dir', children: [
            { name: 'main.js', type: 'file', size: '342.1 KB', modified: '1 день назад' },
            { name: 'main.css', type: 'file', size: '48.3 KB', modified: '1 день назад' },
          ]},
        ]
      },
      {
        name: '/var/log/nginx',
        type: 'dir',
        children: [
          { name: 'access.log', type: 'file', size: '3.2 MB', modified: '10 мин назад' },
          { name: 'error.log', type: 'file', size: '128 KB', modified: '2 часа назад' },
        ]
      },
    ];
  }

  if (vm.role === 'vpn') {
    return [
      {
        name: '/etc/wireguard',
        type: 'dir',
        children: [
          { name: 'wg0.conf', type: 'file', size: '1.4 KB', modified: '5 дней назад' },
          { name: 'clients', type: 'dir', children: [
            { name: 'peer1.conf', type: 'file', size: '320 B', modified: '5 дней назад' },
            { name: 'peer2.conf', type: 'file', size: '320 B', modified: '4 дня назад' },
          ]},
        ]
      },
    ];
  }

  return [
    {
      name: '/home/ubuntu/app',
      type: 'dir',
      children: [
        { name: 'src', type: 'dir', children: [
          { name: 'main.py', type: 'file', size: '4.1 KB', modified: '1 день назад' },
          { name: 'config.py', type: 'file', size: '1.8 KB', modified: '2 дня назад' },
          { name: 'models.py', type: 'file', size: '8.3 KB', modified: '1 день назад' },
        ]},
        { name: 'requirements.txt', type: 'file', size: '512 B', modified: '3 дня назад' },
        { name: '.env', type: 'file', size: '240 B', modified: '3 дня назад' },
        { name: 'Dockerfile', type: 'file', size: '1.1 KB', modified: '3 дня назад' },
      ]
    },
    {
      name: '/var/log',
      type: 'dir',
      children: [
        { name: 'app.log', type: 'file', size: '2.1 MB', modified: '5 мин назад' },
        { name: 'syslog', type: 'file', size: '14.7 MB', modified: '1 мин назад' },
      ]
    },
  ];
}

interface FileRowProps {
  node: FileNode;
  depth: number;
}

function FileRow({ node, depth }: FileRowProps) {
  const [open, setOpen] = useState(depth === 0);

  const isDir = node.type === 'dir';

  return (
    <>
      <div
        className={`pf-row${isDir ? ' pf-row-dir' : ''}`}
        style={{ paddingLeft: `${14 + depth * 20}px` }}
        onClick={() => isDir && setOpen((v) => !v)}
        role={isDir ? 'button' : undefined}
        tabIndex={isDir ? 0 : undefined}
        onKeyDown={isDir ? (e) => e.key === 'Enter' && setOpen((v) => !v) : undefined}
      >
        <span className="pf-icon">
          {isDir ? (open ? '▾' : '▸') : getFileIcon(node.name)}
        </span>
        <span className="pf-name">{node.name}</span>
        {!isDir && node.size && <span className="pf-meta">{node.size}</span>}
        {!isDir && node.modified && <span className="pf-meta pf-meta-muted">{node.modified}</span>}
      </div>
      {isDir && open && node.children?.map((child, i) => (
        <FileRow key={i} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

function getFileIcon(name: string): string {
  if (name.endsWith('.py')) return '🐍';
  if (name.endsWith('.js') || name.endsWith('.ts')) return '📜';
  if (name.endsWith('.css')) return '🎨';
  if (name.endsWith('.html')) return '🌐';
  if (name.endsWith('.conf') || name.endsWith('.cfg')) return '⚙️';
  if (name.endsWith('.log')) return '📋';
  if (name.endsWith('.env')) return '🔑';
  if (name === 'Dockerfile') return '🐳';
  if (name.endsWith('.txt')) return '📄';
  return '📄';
}

interface Props {
  project: Project;
}

export function ProjectFilesTab({ project }: Props) {
  const vms = project.resources.vms;
  const [selectedVmId, setSelectedVmId] = useState(vms[0]?.id ?? '');
  const vm = vms.find((v) => v.id === selectedVmId);
  const tree = vm ? buildMockTree(vm) : [];

  return (
    <div className="pf-root">
      <div className="pf-toolbar">
        <div className="pf-vm-tabs">
          {vms.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`pf-vm-tab${v.id === selectedVmId ? ' pf-vm-tab-active' : ''}`}
              onClick={() => setSelectedVmId(v.id)}
            >
              <span className="pf-vm-dot" style={{ background: v.state === 'running' ? '#2ecc71' : '#e67e22' }} />
              {v.name}
            </button>
          ))}
        </div>
        {vm && (
          <div className="pf-vm-info">
            {vm.publicIp ?? vm.privateIp}
          </div>
        )}
      </div>

      <div className="pf-tree-header">
        <span className="pf-tree-col-name">Имя</span>
        <span className="pf-tree-col-size">Размер</span>
        <span className="pf-tree-col-modified">Изменён</span>
      </div>

      <div className="pf-tree">
        {tree.map((node, i) => (
          <FileRow key={i} node={node} depth={0} />
        ))}
      </div>

      <div className="pf-footer">
        <span className="pf-footer-note">Файловый менеджер работает в режиме просмотра. Редактирование будет доступно позже.</span>
      </div>
    </div>
  );
}
