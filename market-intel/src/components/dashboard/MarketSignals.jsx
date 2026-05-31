import { getIndicatorSignal, getAssetSignal } from '../../lib/signals.js';

const INDICATORS = [
  { key: 'yield10y',  label: 'US 10Y Yield (%)',    placeholder: '4.55', hint: 'fred.stlouisfed.org' },
  { key: 'dxy',       label: 'DXY',                  placeholder: '97.5', hint: 'TradingView: DXY' },
  { key: 'feargreed', label: 'Fear & Greed (0-100)', placeholder: '25',   hint: 'CNN Fear & Greed' },
  { key: 'btcflows',  label: 'BTC ETF Flows ($M)',   placeholder: '-733', hint: 'SoSoValue.com' },
  { key: 'eurusd',    label: 'EUR/USD',               placeholder: '1.085',hint: 'TradingView: EURUSD' },
];

const ASSETS = ['iwda', 'btc', 'eth'];
const ASSET_LABELS = { iwda: 'IWDA', btc: 'BTC', eth: 'ETH' };

function Dot({ signal }) {
  const cls = signal === 'green' ? 'dot dot-green'
    : signal === 'amber' ? 'dot dot-amber'
    : signal === 'red'   ? 'dot dot-red'
    : 'dot dot-gray';
  return <span className={cls} />;
}

export default function MarketSignals({ values, onChange }) {
  function sigFor(key) {
    if (key === 'feargreed') return null; // handled per asset
    return getIndicatorSignal(key, values[key]);
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="section-title">Indicadores Macro</div>

      <div style={{ display: 'grid', gap: 10 }}>
        {INDICATORS.map(ind => {
          const sig = ind.key === 'feargreed'
            ? getIndicatorSignal('feargreed_iwda', values[ind.key])
            : getIndicatorSignal(ind.key, values[ind.key]);
          const hasSig = sig !== 'gray';

          return (
            <div key={ind.key} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4 }}>
                  {ind.label}
                  <span style={{ marginLeft: 8, color: '#333366', fontSize: 9 }}>
                    [{ind.hint}]
                  </span>
                </div>
                <input
                  type="number"
                  className={`input ${values[ind.key] ? 'populated' : ''}`}
                  placeholder={ind.placeholder}
                  value={values[ind.key] || ''}
                  onChange={e => onChange(ind.key, e.target.value)}
                  step="any"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 18 }}>
                {hasSig ? <Dot signal={sig} /> : <span className="dot dot-gray" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Asset aggregate signals */}
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: '0.5px solid var(--border-dim)' }}>
        <div className="section-title" style={{ marginBottom: 10 }}>Sinal Agregado</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {ASSETS.map(asset => {
            const sig = getAssetSignal(asset, values);
            return (
              <div key={asset} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Dot signal={sig} />
                <span style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text-secondary)' }}>
                  {ASSET_LABELS[asset]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
