import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { VolumeNodeData } from '../types';

export function VolumeNode({ data }: NodeProps<VolumeNodeData>) {
  const { volume } = data;

  return (
    <div
      style={{
        minWidth: 140,
        borderRadius: 16,
        background: '#ffffff',
        border: '1px solid rgba(139,92,246,0.20)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.07)',
        padding: '10px 14px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.07em',
          color: 'rgba(139,92,246,0.75)',
          marginBottom: 4,
        }}
      >
        VOLUME
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: 'rgba(139,92,246,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}
        >
          💾
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{volume.name}</div>
          <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)' }}>{volume.sizeGB} GB</div>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: 7, height: 7, background: 'rgba(139,92,246,0.60)', border: 'none' }}
      />
    </div>
  );
}
