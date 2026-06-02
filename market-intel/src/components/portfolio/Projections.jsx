import { useState } from 'react';

function projectPortfolio(initialValue, monthlyContrib, annualReturnPct, years) {
  const monthlyRate = annualReturnPct / 100 / 12;
  const points = [];
  let value = initialValue;
  for (let y = 0; y <= years; y++) {
    points.push({ year: y, value: Math.round(value) });
    for (let m = 0; m < 12; m++) {
      value = value * (1 + monthlyRate) + parseFloat(monthlyContrib || 0);
    }
  }
  return points;
}

function MiniChart({ data, years }) {
  const maxVal = Math.max(...data.map(d => d.value));
  const w = 600;
  const h = 160;
  const pad = { top: 10, right: 20, bottom: 30, left: 60 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  const pts = data.map((d, i) => {
    const x = pad.left + (i / (data.length - 1)) * chartW;
    const y = pad.top + (1 - d.value / maxVal) * chartH;
    return `${x},${y}`;
  });

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: pad.top + (1 - f) * chartH,
    label: `€${Math.round(maxVal * f / 1000)}k`,
  }));

  const xLabels = [0, Math.round(years / 4), Math.round(years / 2), Math.round(years * 3 / 4), years];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: w, height: 'auto' }}>
      {/* Grid lines */}
      {yTicks.map(t => (
        <g key={t.y}>
          <line x1={pad.left} y1={t.y} x2={w - pad.right} y2={t.y}
            stroke="#e8e8ed" strokeWidth="1" />
          <text x={pad.left - 6} y={t.y + 4} textAnchor="end"
            fontSize="10" fill="#86868b" fontFamily="-apple-system, sans-serif">
            {t.label}
          </text>
        </g>
      ))}
      {/* X axis labels */}
      {xLabels.map(yr => {
        const idx = yr;
        const x = pad.left + (idx / years) * chartW;
        return (
          <text key={yr} x={x} y={h - 6} textAnchor="middle"
            fontSize="10" fill="#86868b" fontFamily="-apple-system, sans-serif">
            {yr}a
          </text>
        );
      })}
      {/* Area fill */}
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0071e3" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0071e3" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <polygon
        points={`${pad.left},${pad.top + chartH} ${pts.join(' ')} ${w - pad.right},${pad.top + chartH}`}
        fill="url(#areaGrad)"
      />
      {/* Line */}
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke="#0071e3"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function Projections({ assets, monthlyContrib, onMonthlyContribChange }) {
  const [years, setYears] = useState(30);
  const [inflation, setInflation] = useState(2.5);

  const totalValue = assets.reduce((s, a) => s + (parseFloat(a.value) || 0), 0);
  const weightedReturn = assets.reduce((s, a) => {
    const v = parseFloat(a.value) || 0;
    const r = parseFloat(a.expectedReturn) || 0;
    return s + (v / totalValue) * r;
  }, totalValue > 0 ? 0 : 5.2);

  const nominal = projectPortfolio(totalValue, monthlyContrib, weightedReturn, years);
  const real = projectPortfolio(totalValue, monthlyContrib, weightedReturn - parseFloat(inflation || 0), years);

  const finalNominal = nominal[nominal.length - 1]?.value || 0;
  const finalReal = real[real.length - 1]?.value || 0;
  const passiveMonthly = finalReal * (weightedReturn / 100) / 12;

  const milestones = [
    { label: 'Entrada imóvel Dubai (400k AED / ~99k€)', target: 99000, unit: '€' },
    { label: 'Independência financeira (5k€/mês)',       target: 1200000, unit: '€' },
  ];

  function yearsToTarget(target) {
    const found = nominal.find(p => p.value >= target);
    return found ? found.year : `>${years}`;
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="section-title">Configuração</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4 }}>
              Aporte Mensal (€)
            </div>
            <input
              type="number"
              className="input populated"
              value={monthlyContrib}
              onChange={e => onMonthlyContribChange(e.target.value)}
            />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4 }}>
              Horizonte (anos)
            </div>
            <input
              type="number"
              className="input populated"
              value={years}
              onChange={e => setYears(Math.max(1, Math.min(50, parseInt(e.target.value) || 30)))}
              min={1} max={50}
            />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4 }}>
              Inflação (%)
            </div>
            <input
              type="number"
              className="input"
              value={inflation}
              onChange={e => setInflation(e.target.value)}
              step="0.1"
            />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4 }}>
              Retorno Ponderado
            </div>
            <div style={{ padding: '8px 10px', color: 'var(--green-bright)', fontSize: 14 }}>
              {weightedReturn.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="section-title">Projecção {years} Anos</div>
        <MiniChart data={nominal} years={years} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 14 }}>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 4 }}>
              VALOR NOMINAL
            </div>
            <div style={{ fontSize: 22, color: 'var(--text-primary)' }}>
              €{finalNominal.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 4 }}>
              VALOR REAL ({inflation}% inflação)
            </div>
            <div style={{ fontSize: 22, color: 'var(--text-secondary)' }}>
              €{finalReal.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 4 }}>
              RENDIMENTO MENSAL PASSIVO
            </div>
            <div style={{ fontSize: 22, color: passiveMonthly >= 5000 ? 'var(--green-bright)' : 'var(--amber)' }}>
              €{Math.round(passiveMonthly).toLocaleString('pt-PT')}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Marcos</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Objectivo</th>
              <th>Target</th>
              <th>Anos Estimados</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map(m => (
              <tr key={m.label}>
                <td style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{m.label}</td>
                <td>{m.unit}{m.target.toLocaleString('pt-PT')}</td>
                <td style={{ color: 'var(--amber)' }}>
                  {yearsToTarget(m.target)} {typeof yearsToTarget(m.target) === 'number' ? 'anos' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
