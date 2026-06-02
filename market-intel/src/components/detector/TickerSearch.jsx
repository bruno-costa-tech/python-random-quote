import { useState } from 'react';
import { fetchWithWebSearch } from '../../lib/anthropic.js';
import { parseJSON } from '../../lib/anthropic.js';

const CATALYST_OPTIONS = [
  { value: 'none',     label: 'Nenhum' },
  { value: 'news',     label: 'Notícia (+15)' },
  { value: 'earnings', label: 'Resultados (+18)' },
  { value: 'fda',      label: 'FDA Approval (+25)' },
  { value: 'contract', label: 'Contrato (+12)' },
  { value: 'squeeze',  label: 'Short Squeeze (+8)' },
];

const FIELDS_DEF = [
  { id: 'price',    label: 'Preço ($)',           mandatory: false, type: 'number' },
  { id: 'mcap',     label: 'Market Cap ($M)',      mandatory: false, type: 'number' },
  { id: 'float',    label: 'Float (M acções)',     mandatory: true,  type: 'number' },
  { id: 'short',    label: 'Short Float (%)',      mandatory: true,  type: 'number' },
  { id: 'dtc',      label: 'Days to Cover',        mandatory: true,  type: 'number' },
  { id: 'relvol',   label: 'Relative Volume (x)',  mandatory: true,  type: 'number' },
  { id: 'premkt',   label: 'Premarket Vol (M)',    mandatory: false, type: 'number' },
  { id: 'inst',     label: 'Inst. Ownership (%)',  mandatory: true,  type: 'number' },
  { id: 'catalyst', label: 'Catalisador',          mandatory: false, type: 'select' },
];

function buildFetchPrompt(ticker) {
  return `
Pesquisa os dados actuais de mercado para a acção ${ticker.toUpperCase()} no Finviz (finviz.com/quote.ashx?t=${ticker}) e Yahoo Finance.
Procura especificamente: float, short interest, days to cover (short ratio), relative volume, institutional ownership, premarket volume.

Devolve APENAS JSON válido sem markdown nem texto extra:
{
  "price": number_or_null,
  "marketCapM": number_or_null,
  "floatM": number_or_null,
  "shortFloatPct": number_or_null,
  "daysToCover": number_or_null,
  "relativeVolume": number_or_null,
  "premarketVolM": number_or_null,
  "instOwnershipPct": number_or_null,
  "catalyst": "none",
  "catalystNote": "",
  "dataNote": "fonte e data"
}

Se um campo não estiver disponível usa null. Não inventar valores.
`.trim();
}

export default function TickerSearch({ fields, onFieldChange, onFetched }) {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dataNote, setDataNote] = useState('');

  async function handleFetch() {
    if (!ticker.trim()) return;
    setLoading(true);
    setError('');
    setDataNote('');
    try {
      const raw = await fetchWithWebSearch(buildFetchPrompt(ticker), 1000);
      const data = parseJSON(raw);
      const mapped = {
        price:    data.price    != null ? String(data.price)             : '',
        mcap:     data.marketCapM != null ? String(data.marketCapM)      : '',
        float:    data.floatM   != null ? String(data.floatM)            : '',
        short:    data.shortFloatPct != null ? String(data.shortFloatPct): '',
        dtc:      data.daysToCover  != null ? String(data.daysToCover)   : '',
        relvol:   data.relativeVolume != null ? String(data.relativeVolume) : '',
        premkt:   data.premarketVolM != null ? String(data.premarketVolM)  : '',
        inst:     data.instOwnershipPct != null ? String(data.instOwnershipPct) : '',
        catalyst: data.catalyst || 'none',
      };
      onFetched(ticker.toUpperCase(), mapped);
      if (data.dataNote) setDataNote(data.dataNote);
      if (data.catalystNote) setDataNote(n => n + (n ? ' | ' : '') + data.catalystNote);
    } catch (e) {
      setError(`Erro ao buscar dados: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="section-title">Ticker</div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <input
          type="text"
          className="input"
          placeholder="ex: ASTC, GME, AMC..."
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleFetch()}
          style={{ maxWidth: 200 }}
        />
        <button className="btn-primary" onClick={handleFetch} disabled={loading || !ticker.trim()}>
          {loading ? <><span className="loader" style={{ marginRight: 8 }} />A buscar...</> : 'Buscar Dados'}
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {dataNote && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: 1 }}>
          {dataNote}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {FIELDS_DEF.map(f => {
          const val = fields[f.id] || '';
          const populated = val !== '' && val !== 'none';
          const missing = f.mandatory && !val;
          const cls = `input ${populated ? 'populated' : missing ? 'missing' : ''}`;

          return (
            <div key={f.id}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4 }}>
                {f.label}
                {f.mandatory && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
              </div>
              {f.type === 'select' ? (
                <select
                  className={cls}
                  value={val || 'none'}
                  onChange={e => onFieldChange(f.id, e.target.value)}
                >
                  {CATALYST_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  className={cls}
                  value={val}
                  onChange={e => onFieldChange(f.id, e.target.value)}
                  step="any"
                  placeholder={f.id === 'float' ? '0.5' : f.id === 'short' ? '35' : f.id === 'relvol' ? '3.2' : ''}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
