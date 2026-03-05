import { Handle, Position } from 'reactflow';

export function InternetNode() {
  return (
    <div
      style={{
        borderRadius: 20,
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.10)',
        padding: '12px 18px',
        minWidth: 110,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: 'rgba(248,113,113,0.90)',
          marginBottom: 4,
        }}
      >
        PUBLIC
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'rgba(248,113,113,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
          }}
        >
          🌐
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Internet</span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: 8, height: 8, background: 'rgba(248,113,113,0.9)', border: 'none' }}
      />
    </div>
  );
}
