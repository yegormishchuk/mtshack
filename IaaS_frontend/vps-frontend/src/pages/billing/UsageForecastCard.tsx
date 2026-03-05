import './billing.css';

interface Props {
  balance: number;
  currency: string;
  dailyCost: number;
}

function pluralDays(n: number): string {
  const abs = Math.abs(n);
  if (abs % 10 === 1 && abs % 100 !== 11) return 'день';
  if ([2, 3, 4].includes(abs % 10) && ![12, 13, 14].includes(abs % 100)) return 'дня';
  return 'дней';
}

function ForecastSparkline({ balance, dailyCost }: { balance: number; dailyCost: number }) {
  const W = 240;
  const H = 64;
  const STEPS = 10;

  const totalDays = dailyCost > 0 ? balance / dailyCost : 60;
  const weeklyDrain = dailyCost * 7;

  const raw = Array.from({ length: STEPS }, (_, i) => ({
    x: (i / (STEPS - 1)) * W,
    val: Math.max(0, balance - weeklyDrain * i),
  }));

  const minVal = 0;
  const maxVal = balance;
  const range = maxVal - minVal || 1;
  const PAD_T = 8;
  const PAD_B = 4;
  const usableH = H - PAD_T - PAD_B;

  const pts = raw.map(({ x, val }) => {
    const y = PAD_T + usableH - ((val - minVal) / range) * usableH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const lineStr = pts.join(' ');
  const areaStr = `0,${H} ${lineStr} ${W},${H}`;

  const weeksUntilEmpty = Math.ceil(totalDays / 7);
  const tickCount = Math.min(4, weeksUntilEmpty);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      style={{ overflow: 'visible', display: 'block' }}
    >
      <defs>
        <linearGradient id="forecast-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff0023" stopOpacity="0.13" />
          <stop offset="100%" stopColor="#ff0023" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1="0"
          y1={(PAD_T + usableH * (1 - f)).toFixed(1)}
          x2={W}
          y2={(PAD_T + usableH * (1 - f)).toFixed(1)}
          stroke="#e2e2e2"
          strokeWidth="1"
          strokeDasharray="4 3"
        />
      ))}

      {Array.from({ length: tickCount + 1 }, (_, i) => {
        const x = ((i / tickCount) * W).toFixed(1);
        const label = `${Math.round((i / tickCount) * weeksUntilEmpty)} нед`;
        return (
          <text key={i} x={x} y={H + 13} textAnchor="middle" fontSize="8" fill="#bbbbbb">
            {label}
          </text>
        );
      })}

      <polygon points={areaStr} fill="url(#forecast-area-grad)" />

      <polyline
        points={lineStr}
        fill="none"
        stroke="#ff0023"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />

      <circle
        cx={raw[0].x.toFixed(1)}
        cy={(PAD_T + usableH - ((raw[0].val - minVal) / range) * usableH).toFixed(1)}
        r="3"
        fill="#ff0023"
        opacity="0.7"
      />
    </svg>
  );
}

export function UsageForecastCard({ balance, currency, dailyCost }: Props) {
  const days = dailyCost > 0 ? Math.floor(balance / dailyCost) : 0;

  return (
    <div className="forecast-card">
      <p className="forecast-card-label">Прогноз работы серверов</p>

      <div className="forecast-card-value-row">
        <span className="forecast-card-value">{days}</span>
        <span className="forecast-card-unit">{pluralDays(days)}</span>
      </div>

      <div className="forecast-chart-wrap">
        <ForecastSparkline balance={balance} dailyCost={dailyCost} />
      </div>

      <p className="forecast-card-hint">
        При расходе&nbsp;<strong>{dailyCost}&nbsp;{currency}/день</strong>
      </p>
    </div>
  );
}
