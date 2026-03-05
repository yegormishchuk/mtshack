import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { colors } from '../theme';

const pageTitle = { margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' };
const pageSub = { margin: '0 0 24px', fontSize: 14, color: 'rgba(255,255,255,0.85)' };

export function Network() {
  const [ports, setPorts] = useState({ p22: true, p80: true, p443: true });

  const toggle = (key: keyof typeof ports) => setPorts((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1 style={pageTitle}>Network</h1>
      <p style={pageSub}>Публичные IP и правила фаервола</p>

      <Card title="Публичные IP">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <code style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>203.0.113.42</code>
          <span style={{ fontSize: 13, color: colors.textSecondary }}>привязан к web-server-1</span>
        </div>
      </Card>

      <Card title="Firewall — открытые порты">
        <p style={{ margin: '0 0 16px', fontSize: 14, color: colors.textSecondary }}>
          Отметьте порты, которые должны быть доступны из интернета.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label className="app-checkbox-label">
            <input type="checkbox" checked={ports.p22} onChange={() => toggle('p22')} />
            <span>22 (SSH)</span>
          </label>
          <label className="app-checkbox-label">
            <input type="checkbox" checked={ports.p80} onChange={() => toggle('p80')} />
            <span>80 (HTTP)</span>
          </label>
          <label className="app-checkbox-label">
            <input type="checkbox" checked={ports.p443} onChange={() => toggle('p443')} />
            <span>443 (HTTPS)</span>
          </label>
        </div>
        <Button variant="secondary" style={{ marginTop: 16 }}>Применить правила</Button>
      </Card>
    </div>
  );
}
