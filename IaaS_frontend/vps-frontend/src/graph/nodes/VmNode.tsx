import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { VmNodeData } from '../types';

const ROLE_ICON: Record<string, string> = {
  frontend: '🖥',
  backend: '⚙️',
  db: '🗄',
  worker: '🔧',
  vpn: '🔒',
  proxy: '🔀',
  custom: '📦',
};

const ROLE_COLOR: Record<string, string> = {
  frontend: 'rgba(59,130,246,0.12)',
  backend: 'rgba(249,115,22,0.12)',
  db: 'rgba(34,197,94,0.12)',
  worker: 'rgba(168,85,247,0.12)',
  vpn: 'rgba(20,184,166,0.12)',
  proxy: 'rgba(236,72,153,0.12)',
  custom: 'rgba(100,116,139,0.12)',
};

export function VmNode({ data }: NodeProps<VmNodeData>) {
  const { vm } = data;
  const isRunning = vm.state === 'running';
  const icon = ROLE_ICON[vm.role] ?? '📦';
  const roleColor = ROLE_COLOR[vm.role] ?? 'rgba(100,116,139,0.12)';

  return (
    <div
      style={{
        width: 220,
        borderRadius: 20,
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.09)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '11px 14px 10px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: roleColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.07em',
                color: 'rgba(0,0,0,0.40)',
                marginBottom: 2,
              }}
            >
              {vm.role.toUpperCase()}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#111',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {vm.name}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 2,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isRunning ? '#22c55e' : vm.state === 'provisioning' ? '#f59e0b' : '#ef4444',
            flexShrink: 0,
          }}
        />
      </div>

      {/* Specs */}
      <div
        style={{
          padding: '0 14px 8px',
          fontSize: 11,
          color: 'rgba(0,0,0,0.50)',
        }}
      >
        {vm.cpu} vCPU · {vm.ram}GB RAM · {vm.disk}GB
      </div>

      {/* IPs */}
      {(vm.publicIp || vm.privateIp) && (
        <div
          style={{
            padding: '4px 14px 8px',
            fontSize: 11,
            color: 'rgba(0,0,0,0.55)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {vm.publicIp && (
            <div>
              <span style={{ color: 'rgba(0,0,0,0.35)' }}>pub </span>
              <span style={{ fontWeight: 600, color: '#111', fontFamily: 'monospace' }}>
                {vm.publicIp}
              </span>
            </div>
          )}
          {vm.privateIp && (
            <div>
              <span style={{ color: 'rgba(0,0,0,0.35)' }}>priv </span>
              <span style={{ fontWeight: 500, color: '#333', fontFamily: 'monospace' }}>
                {vm.privateIp}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Ports */}
      {vm.portsOpen.length > 0 && (
        <div
          style={{
            padding: '0 14px 12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
          }}
        >
          {vm.portsOpen.slice(0, 5).map((p) => (
            <span
              key={p}
              style={{
                fontSize: 10,
                padding: '2px 7px',
                borderRadius: 999,
                background: 'rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.08)',
                color: 'rgba(0,0,0,0.60)',
                fontFamily: 'monospace',
              }}
            >
              :{p}
            </span>
          ))}
          {vm.portsOpen.length > 5 && (
            <span
              style={{
                fontSize: 10,
                padding: '2px 7px',
                borderRadius: 999,
                background: 'rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.08)',
                color: 'rgba(0,0,0,0.45)',
              }}
            >
              +{vm.portsOpen.length - 5}
            </span>
          )}
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 8, height: 8, background: 'rgba(0,0,0,0.35)', border: 'none' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 8, height: 8, background: 'rgba(0,0,0,0.35)', border: 'none' }}
      />
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        style={{ width: 8, height: 8, background: 'rgba(0,0,0,0.25)', border: 'none' }}
      />
    </div>
  );
}
