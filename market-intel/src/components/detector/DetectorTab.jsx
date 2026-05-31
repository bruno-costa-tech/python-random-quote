import { useState } from 'react';
import { calcScore, scoreTier } from '../../lib/scoring.js';

const CATALYST_OPTIONS = [
  { value: 'none',     label: 'Nenhum',              pts: 0  },
  { value: 'news',     label: 'Notícia / PR',         pts: 15 },
  { value: 'earnings', label: 'Resultados (earnings)', pts: 18 },
  { value: 'fda',      label: 'FDA / Aprovação',      pts: 25 },
  { value: 'contract', label: 'Contrato / Parceria',  pts: 12 },
  { value: 'squeeze',  label: 'Short Squeeze activo', pts: 8  },
];

const FIELDS = [
  {
    id: 'float',
    label: 'Float',
    unit: 'M acções',
    placeholder: '1.2',
    mandatory: true,
    source: 'Finviz → Overview → "Float"',
    hint: 'Nº de acções disponíveis para trading. Quanto menor, mais fácil mover o preço.',
    color: '#0071e3',
  },
  {
    id: 'short',
    label: 'Short Float',
    unit: '%',
    placeholder: '28',
    mandatory: true,
    source: 'Finviz → Overview → "Short Float"',
    hint: '% do float vendido a descoberto. >20% = pressão de compra forçada se o preço subir.',
    color: '#ff3b30',
  },
  {
    id: 'dtc',
    label: 'Days to Cover',
    unit: 'dias',
    placeholder: '4',
    mandatory: true,
    source: 'Finviz → Overview → "Short Ratio"',
    hint: 'Dias necessários para cobrir todas as posições curtas. >5 = risco elevado de squeeze.',
    color: '#ff9500',
  },
  {
    id: 'relvol',
    label: 'Relative Volume',
    unit: 'x',
    placeholder: '3.5',
    mandatory: true,
    source: 'Finviz → Overview → "Rel Volume"',
    hint: 'Volume actual vs média. >3x = interesse incomum. >5x = explosivo.',
    color: '#34c759',
  },
  {
    id: 'premkt',
    label: 'Premarket Volume',
    unit: 'M',
    placeholder: '2.1',
    mandatory: false,
    source: 'TradingView → Extended Hours / Webull',
    hint: 'Volume antes da abertura. >1M = momentum forte nas horas alargadas.',
    color: '#5856d6',
  },
  {
    id: 'inst',
    label: 'Inst. Ownership',
    unit: '%',
    placeholder: '8',
    mandatory: true,
    source: 'Finviz → Overview → "Inst Own"',
    hint: '% em posse institucional. <5% = poucos vendedores grandes a resistir a uma subida.',
    color: '#af52de',
  },
  {
    id: 'price',
    label: 'Preço',
    unit: '$',
    placeholder: '3.40',
    mandatory: false,
    source: 'Finviz / Yahoo Finance',
    hint: 'Sweet spot para movimentos explosivos: $1–10. Muito alto limita a % de ganho.',
    color: '#8e8e93',
  },
  {
    id: 'mcap',
    label: 'Market Cap',
    unit: '$M',
    placeholder: '25',
    mandatory: false,
    source: 'Finviz → Overview → "Market Cap"',
    hint: '<$50M = micro cap. Mais fácil de mover com volume. >$500M = mais difícil.',
    color: '#8e8e93',
  },
];

const LS_KEY = 'mid_watchlist_v2';

function loadWatchlist() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function saveWatchlist(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {}
}

export default function DetectorTab() {
  const [ticker, setTicker] = useState('');
  const [fields, setFields] = useState({
    float: '', short: '', dtc: '', relvol: '',
    premkt: '', inst: '', price: '', mcap: '', catalyst: 'none',
  });
  const [watchlist, setWatchlist] = useState(loadWatchlist);
  const [saved, setSaved] = useState(false);

  const { score, signals } = calcScore(fields);
  const tier = scoreTier(score);

  function setField(k, v) {
    setFields(p => ({ ...p, [k]: v }));
    setSaved(false);
  }

  function reset() {
    setTicker('');
    setFields({ float: '', short: '', dtc: '', relvol: '', premkt: '', inst: '', price: '', mcap: '', catalyst: 'none' });
    setSaved(false);
  }

  function saveToWatchlist() {
    if (!ticker.trim()) return;
    const entry = {
      id: Date.now(),
      ticker: ticker.toUpperCase(),
      score,
      tier: tier.label,
      ...fields,
      savedAt: new Date().toLocaleDateString('pt-PT'),
    };
    const updated = [entry, ...watchlist.filter(w => w.ticker !== ticker.toUpperCase())];
    setWatchlist(updated);
    saveWatchlist(updated);
    setSaved(true);
  }

  function removeFromWatchlist(id) {
    const updated = watchlist.filter(w => w.id !== id);
    setWatchlist(updated);
    saveWatchlist(updated);
  }

  const hasRequired = fields.float && fields.short && fields.dtc && fields.relvol && fields.inst;

  return (
    <div style={{ display: 'grid', gap: 16 }}>

      {/* Ticker + Score hero */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
          <div style={{ flex: '0 0 auto' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>Ticker</label>
            <input
              className="input"
              style={{ width: 130, fontSize: 20, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}
              placeholder="ASTC"
              value={ticker}
              onChange={e => { setTicker(e.target.value.toUpperCase()); setSaved(false); }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 52, fontWeight: 700, color: tier.color, lineHeight: 1 }}>{score}</span>
                <span style={{ fontSize: 16, color: 'var(--text-muted)', marginLeft: 4 }}>/100</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{
                  display: 'inline-block', fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
                  padding: '4px 12px', borderRadius: 980,
                  background: tier.color + '18', color: tier.color,
                }}>
                  {tier.label}
                </div>
              </div>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${score}%`, background: tier.color }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 2 }}>
            <button
              className="btn-primary"
              onClick={saveToWatchlist}
              disabled={!ticker.trim() || !hasRequired || saved}
              style={{ background: saved ? 'var(--green-bright)' : undefined }}
            >
              {saved ? '✓ Guardado' : 'Guardar na Watchlist'}
            </button>
            <button className="btn-secondary" onClick={reset}>Limpar</button>
          </div>
        </div>

        {/* Signal badges */}
        {signals.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {signals.map((s, i) => (
              <span key={i} style={{
                fontSize: 12, padding: '4px 10px', borderRadius: 980,
                background: '#f5f5f7', color: 'var(--text-secondary)',
                border: '1px solid var(--border-dim)',
              }}>{s.label}</span>
            ))}
          </div>
        )}
      </div>

      {/* Fields grid */}
      <div className="card">
        <div className="section-title">Dados do Screening</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {FIELDS.map(f => {
            const val = fields[f.id] || '';
            const populated = val !== '';
            const missing = f.mandatory && !val;
            return (
              <div key={f.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {f.label}
                    {f.unit && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>({f.unit})</span>}
                    {f.mandatory && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}
                  </label>
                </div>
                <input
                  type="number"
                  className={`input ${populated ? 'populated' : missing ? 'missing' : ''}`}
                  placeholder={f.placeholder}
                  value={val}
                  onChange={e => setField(f.id, e.target.value)}
                  step="any"
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span style={{ color: f.color, fontWeight: 600 }}>→</span>{' '}{f.source}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
                  {f.hint}
                </div>
              </div>
            );
          })}

          {/* Catalyst */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Catalisador</label>
            </div>
            <select
              className={`input ${fields.catalyst !== 'none' ? 'populated' : ''}`}
              value={fields.catalyst}
              onChange={e => setField('catalyst', e.target.value)}
            >
              {CATALYST_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label} {o.pts > 0 ? `(+${o.pts}pts)` : ''}</option>
              ))}
            </select>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span style={{ color: '#ff9500', fontWeight: 600 }}>→</span>{' '}Notícias recentes, SEC filings, press releases
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
              FDA é o catalisador mais poderoso (binário, movimentos de +100% a +500%).
            </div>
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      {hasRequired && (
        <div className="card">
          <div className="section-title">Decomposição do Score</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { label: 'Float', max: 35 },
              { label: 'Short Float', max: 30 },
              { label: 'Days to Cover', max: 20 },
              { label: 'Relative Volume', max: 25 },
              { label: 'Premarket Volume', max: 15 },
              { label: 'Inst. Ownership', max: 10 },
              { label: 'Catalisador', max: 25 },
            ].map(row => {
              const sig = signals.find(s => s.label.toLowerCase().includes(row.label.toLowerCase().split(' ')[0]));
              const pts = sig ? sig.pts : 0;
              const pct = (pts / row.max) * 100;
              return (
                <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 60px', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%`, background: pct === 100 ? '#34c759' : pct >= 60 ? '#ff9500' : 'var(--border-mid)' }} />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{pts}/{row.max}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Watchlist */}
      {watchlist.length > 0 && (
        <div className="card">
          <div className="section-title">Watchlist ({watchlist.length})</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticker</th><th>Score</th><th>Tier</th>
                  <th>Float M</th><th>Short%</th><th>DTC</th><th>RelVol</th>
                  <th>Catalisador</th><th>Data</th><th></th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map(w => {
                  const t = scoreTier(w.score);
                  return (
                    <tr key={w.id} style={{ cursor: 'pointer' }} onClick={() => {
                      setTicker(w.ticker);
                      setFields({ float: w.float||'', short: w.short||'', dtc: w.dtc||'', relvol: w.relvol||'', premkt: w.premkt||'', inst: w.inst||'', price: w.price||'', mcap: w.mcap||'', catalyst: w.catalyst||'none' });
                      setSaved(true);
                    }}>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{w.ticker}</td>
                      <td style={{ fontWeight: 700, color: t.color }}>{w.score}</td>
                      <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 980, background: t.color+'18', color: t.color }}>{t.label}</span></td>
                      <td>{w.float||'—'}</td><td>{w.short||'—'}%</td>
                      <td>{w.dtc||'—'}</td><td>{w.relvol||'—'}x</td>
                      <td>{w.catalyst||'—'}</td><td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{w.savedAt}</td>
                      <td>
                        <button className="btn-secondary" style={{ padding: '2px 8px', fontSize: 11, color: 'var(--red)' }}
                          onClick={e => { e.stopPropagation(); removeFromWatchlist(w.id); }}>
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
