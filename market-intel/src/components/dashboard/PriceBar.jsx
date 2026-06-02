function PriceItem({ label, price, change }) {
  const isPos = change > 0;
  const isNeg = change < 0;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      padding: '8px 14px',
      borderRight: '0.5px solid var(--border-dim)',
      minWidth: 90,
    }}>
      <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 3 }}>
        {label}
      </span>
      <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 'normal' }}>
        {price || '—'}
      </span>
      {change !== undefined && change !== null && !isNaN(change) && (
        <span style={{ fontSize: 10, color: isPos ? 'var(--green-bright)' : isNeg ? 'var(--red)' : 'var(--text-muted)' }}>
          {isPos ? '+' : ''}{change?.toFixed(2)}%
        </span>
      )}
    </div>
  );
}

export default function PriceBar({ prices, loading, onRefresh }) {
  const assets = [
    { key: 'iwda',    label: 'IWDA.AS',        unit: '€' },
    { key: 'btc',     label: 'BTC',             unit: '€' },
    { key: 'eth',     label: 'ETH',             unit: '€' },
    { key: 'xrp',     label: 'XRP',             unit: '$' },
    { key: 'sol',     label: 'SOL',             unit: '$' },
    { key: 'sui',     label: 'SUI',             unit: '$' },
    { key: 'copper',  label: 'Copper ETF',      unit: '' },
    { key: 'uranium', label: 'Uranium ETF',     unit: '' },
    { key: 'water',   label: 'Water ETF',       unit: '' },
    { key: 'robot',   label: 'Robotics ETF',    unit: '' },
    { key: 'commodity',label: 'Commodity ETF',  unit: '' },
    { key: 'europe',  label: 'MSCI Europe ETF', unit: '' },
  ];

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>Preços</div>
        <button className="btn-secondary" onClick={onRefresh} disabled={loading}>
          {loading ? <span className="loader" /> : 'Actualizar'}
        </button>
      </div>
      <div style={{ display: 'flex', overflowX: 'auto', gap: 0 }}>
        {assets.map(a => (
          <PriceItem
            key={a.key}
            label={a.label}
            price={prices[a.key] ? `${a.unit}${prices[a.key]}` : undefined}
            change={prices[`${a.key}_chg`]}
          />
        ))}
      </div>
      {prices.updatedAt && (
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 8, letterSpacing: 1 }}>
          Actualizado: {prices.updatedAt}
        </div>
      )}
    </div>
  );
}
