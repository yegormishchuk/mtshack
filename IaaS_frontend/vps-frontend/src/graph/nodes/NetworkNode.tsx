import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { NetworkNodeData } from '../types';

export function NetworkNode({ data }: NodeProps<NetworkNodeData>) {
  const { network } = data;
  const isPrivate = network.type === 'private';

  return (
    <div
      style={{
        minWidth: 160,
        borderRadius: 16,
        background: '#ffffff',
        border: `1px solid ${isPrivate ? 'rgba(0,0,0,0.08)' : 'rgba(248,113,113,0.25)'}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.07)',
        padding: '10px 14px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.07em',
          color: isPrivate ? 'rgba(0,0,0,0.40)' : 'rgba(248,113,113,0.80)',
          marginBottom: 4,
        }}
      >
        {isPrivate ? 'PRIVATE NET' : 'PUBLIC NET'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: isPrivate ? 'rgba(0,0,0,0.06)' : 'rgba(248,113,113,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}
        >
          🔗
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{network.name}</div>
          <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)', fontFamily: 'monospace' }}>
            {network.cidr}
          </div>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        style={{ width: 7, height: 7, background: 'rgba(0,0,0,0.30)', border: 'none' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ width: 7, height: 7, background: 'rgba(0,0,0,0.30)', border: 'none' }}
      />
    </div>
  );
}
