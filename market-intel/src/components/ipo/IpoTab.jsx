import { useState } from 'react';

const LS_KEY = 'mid_ipo_list_v1';

const MARKETS = ['NASDAQ', 'NYSE', 'LSE', 'Euronext', 'DFM', 'ADX', 'HKEX', 'ASX', 'Outro'];
const SECTORS = ['Tecnologia', 'IA / ML', 'Biotech / Pharma', 'Energia Limpa', 'Fintech', 'Defesa', 'Imobiliário', 'Consumo', 'Industrial', 'Saúde', 'Cripto / Web3', 'Outro'];
const STATUSES = [
  { value: 'upcoming',  label: 'Previsto',   color: '#86868b' },
  { value: 'roadshow',  label: 'Roadshow',   color: '#0071e3' },
  { value: 'pricing',   label: 'Pricing',    color: '#ff9500' },
  { value: 'listed',    label: 'Listed',     color: '#34c759' },
  { value: 'withdrawn', label: 'Retirado',   color: '#ff3b30' },
];
const INTEREST = [
  { value: 'pass',       label: 'Passar',     color: '#86868b' },
  { value: 'watch',      label: 'Vigiar',     color: '#ff9500' },
  { value: 'interested', label: 'Interessado',color: '#0071e3' },
  { value: 'allocated',  label: 'Alocado',    color: '#34c759' },
];

const EMPTY_FORM = {
  company: '', ticker: '', market: 'NASDAQ', sector: 'Tecnologia',
  ipoDate: '', status: 'upcoming', priceLow: '', priceHigh: '',
  offerSize: '', firstDayReturn: '', interest: 'watch', notes: '',
};

function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function save(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch {}
}

function Badge({ value, options }) {
  const opt = options.find(o => o.value === value) || options[0];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 980,
      background: opt.color + '18', color: opt.color, whiteSpace: 'nowrap',
    }}>{opt.label}</span>
  );
}

function IpoFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const valid = form.company.trim() && form.ipoDate;

  const fields = [
    [
      { key: 'company',  label: 'Empresa *',        type: 'text',   span: 2, placeholder: 'Ex: CoreWeave' },
      { key: 'ticker',   label: 'Ticker',            type: 'text',   placeholder: 'CRWV' },
      { key: 'market',   label: 'Mercado *',         type: 'select', options: MARKETS },
    ],
    [
      { key: 'sector',   label: 'Sector',            type: 'select', options: SECTORS },
      { key: 'ipoDate',  label: 'Data IPO *',        type: 'date' },
      { key: 'status',   label: 'Estado',            type: 'select', options: STATUSES.map(s => s.value) },
      { key: 'interest', label: 'Interesse',         type: 'select', options: INTEREST.map(i => i.value) },
    ],
    [
      { key: 'priceLow',  label: 'Preço Baixo ($)',  type: 'number', placeholder: '18' },
      { key: 'priceHigh', label: 'Preço Alto ($)',   type: 'number', placeholder: '22' },
      { key: 'offerSize', label: 'Oferta ($M)',      type: 'number', placeholder: '500' },
      { key: 'firstDayReturn', label: 'Retorno 1º Dia (%)', type: 'number', placeholder: '24.5', step: '0.1' },
    ],
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, letterSpacing: -0.3 }}>
          {initial ? 'Editar IPO' : 'Adicionar IPO'}
        </h2>

        {fields.map((row, ri) => (
          <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${row.length}, 1fr)`, gap: 12, marginBottom: 14 }}>
            {row.map(f => (
              <div key={f.key} style={{ gridColumn: f.span ? `span ${f.span}` : undefined }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                  {f.label}
                </label>
                {f.type === 'select' ? (
                  <select className="input" value={form[f.key]} onChange={e => set(f.key, e.target.value)}>
                    {(f.options || []).map(o => (
                      <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type}
                    className="input"
                    placeholder={f.placeholder || ''}
                    value={form[f.key] || ''}
                    onChange={e => set(f.key, e.target.value)}
                    step={f.step}
                    style={f.key === 'ticker' ? { textTransform: 'uppercase' } : undefined}
                  />
                )}
              </div>
            ))}
          </div>
        ))}

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            Notas
          </label>
          <textarea
            className="input"
            rows={3}
            placeholder="Use of proceeds, underwriters, observações..."
            value={form.notes || ''}
            onChange={e => set('notes', e.target.value)}
            style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSave(form)} disabled={!valid}>
            {initial ? 'Guardar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
}

const SORT_FIELDS = [
  { key: 'ipoDate', label: 'Data' },
  { key: 'company', label: 'Empresa' },
  { key: 'market',  label: 'Mercado' },
  { key: 'sector',  label: 'Sector' },
  { key: 'status',  label: 'Estado' },
  { key: 'offerSize', label: 'Oferta' },
  { key: 'firstDayReturn', label: '1º Dia %' },
];

const DEMO_IPOS = [
  { id: 1, company: 'CoreWeave', ticker: 'CRWV', market: 'NASDAQ', sector: 'IA / ML', ipoDate: '2025-03-28', status: 'listed', priceLow: '47', priceHigh: '55', offerSize: '1500', firstDayReturn: '-5.8', interest: 'watch', notes: 'GPU cloud computing. Clientes: Microsoft, NVIDIA. Valorização controversa.' },
  { id: 2, company: 'Klarna', ticker: 'KLAR', market: 'NYSE', sector: 'Fintech', ipoDate: '2025-07-01', status: 'upcoming', priceLow: '60', priceHigh: '70', offerSize: '1000', firstDayReturn: '', interest: 'interested', notes: 'BNPL europeu. Lucrativo desde 2023. Tentou IPO em 2022, abortou.' },
  { id: 3, company: 'Cerebras Systems', ticker: 'CBRS', market: 'NASDAQ', sector: 'IA / ML', ipoDate: '2025-10-15', status: 'roadshow', priceLow: '28', priceHigh: '35', offerSize: '750', firstDayReturn: '', interest: 'interested', notes: 'Chips de IA alternativos à NVIDIA. Revenue crescimento 900% YoY.' },
  { id: 4, company: 'Medline Industries', ticker: 'MDLN', market: 'NYSE', sector: 'Saúde', ipoDate: '2025-09-01', status: 'upcoming', priceLow: '', priceHigh: '', offerSize: '3000', firstDayReturn: '', interest: 'watch', notes: 'Maior distribuidor de material médico dos EUA. Private equity-backed.' },
];

export default function IpoTab() {
  const [ipos, setIpos] = useState(() => {
    const stored = load();
    return stored.length ? stored : DEMO_IPOS;
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [sortKey, setSortKey] = useState('ipoDate');
  const [sortDir, setSortDir] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterInterest, setFilterInterest] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  function handleSave(form) {
    let updated;
    if (editing) {
      updated = ipos.map(i => i.id === editing.id ? { ...form, id: editing.id } : i);
    } else {
      updated = [...ipos, { ...form, id: Date.now(), ticker: (form.ticker || '').toUpperCase() }];
    }
    setIpos(updated);
    save(updated);
    setShowForm(false);
    setEditing(null);
  }

  function handleDelete(id) {
    const updated = ipos.filter(i => i.id !== id);
    setIpos(updated);
    save(updated);
    setExpandedId(null);
  }

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  const filtered = ipos
    .filter(i => filterStatus === 'all' || i.status === filterStatus)
    .filter(i => filterInterest === 'all' || i.interest === filterInterest)
    .sort((a, b) => {
      let av = a[sortKey] || '', bv = b[sortKey] || '';
      if (sortKey === 'offerSize' || sortKey === 'firstDayReturn') {
        av = parseFloat(av) || 0; bv = parseFloat(bv) || 0;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  // Stats
  const listed = ipos.filter(i => i.status === 'listed' && i.firstDayReturn !== '');
  const avgReturn = listed.length
    ? listed.reduce((s, i) => s + parseFloat(i.firstDayReturn || 0), 0) / listed.length
    : null;
  const upcoming = ipos.filter(i => ['upcoming', 'roadshow', 'pricing'].includes(i.status)).length;
  const interested = ipos.filter(i => ['interested', 'allocated'].includes(i.interest)).length;

  return (
    <div style={{ display: 'grid', gap: 16 }}>

      {(showForm || editing) && (
        <IpoFormModal
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total IPOs', value: ipos.length, color: 'var(--text-primary)' },
          { label: 'A acompanhar', value: upcoming, color: '#0071e3' },
          { label: 'Com interesse', value: interested, color: '#34c759' },
          { label: 'Retorno médio 1º dia', value: avgReturn != null ? `${avgReturn > 0 ? '+' : ''}${avgReturn.toFixed(1)}%` : '—', color: avgReturn > 0 ? '#248a3d' : avgReturn < 0 ? '#ff3b30' : 'var(--text-muted)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters + Add */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>ESTADO</span>
          {['all', ...STATUSES.map(s => s.value)].map(v => {
            const s = STATUSES.find(x => x.value === v);
            const active = filterStatus === v;
            return (
              <button key={v} onClick={() => setFilterStatus(v)}
                style={{
                  background: active ? (s ? s.color : 'var(--text-primary)') : 'transparent',
                  border: `1px solid ${active ? (s ? s.color : 'var(--text-primary)') : 'var(--border-mid)'}`,
                  color: active ? '#fff' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 500, padding: '5px 12px',
                  borderRadius: 980, cursor: 'pointer', transition: 'all .15s',
                }}>
                {v === 'all' ? 'Todos' : (s?.label || v)}
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>INTERESSE</span>
          {['all', ...INTEREST.map(i => i.value)].map(v => {
            const opt = INTEREST.find(x => x.value === v);
            const active = filterInterest === v;
            return (
              <button key={v} onClick={() => setFilterInterest(v)}
                style={{
                  background: active ? (opt ? opt.color : 'var(--text-primary)') : 'transparent',
                  border: `1px solid ${active ? (opt ? opt.color : 'var(--text-primary)') : 'var(--border-mid)'}`,
                  color: active ? '#fff' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 500, padding: '5px 12px',
                  borderRadius: 980, cursor: 'pointer', transition: 'all .15s',
                }}>
                {v === 'all' ? 'Todos' : (opt?.label || v)}
              </button>
            );
          })}
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            + Adicionar IPO
          </button>
        </div>
      </div>

      {/* IPO Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Nenhum IPO encontrado. Clica em "+ Adicionar IPO" para começar.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {SORT_FIELDS.map(f => (
                    <th key={f.key} onClick={() => handleSort(f.key)}
                      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                      {f.label}
                      {sortKey === f.key && <span style={{ marginLeft: 4, opacity: 0.5 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </th>
                  ))}
                  <th>Range ($)</th>
                  <th>Interesse</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ipo => {
                  const ret = parseFloat(ipo.firstDayReturn);
                  const isExpanded = expandedId === ipo.id;
                  return (
                    <>
                      <tr key={ipo.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : ipo.id)}>
                        <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: 12 }}>
                          {ipo.ipoDate ? new Date(ipo.ipoDate + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{ipo.company}</div>
                          {ipo.ticker && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ipo.ticker}</div>}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ipo.market}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ipo.sector}</td>
                        <td><Badge value={ipo.status} options={STATUSES} /></td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {ipo.offerSize ? `$${Number(ipo.offerSize).toLocaleString()}M` : '—'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: ret > 0 ? '#248a3d' : ret < 0 ? '#ff3b30' : 'var(--text-muted)' }}>
                          {ipo.firstDayReturn !== '' && !isNaN(ret) ? `${ret > 0 ? '+' : ''}${ret.toFixed(1)}%` : '—'}
                        </td>
                        <td>
                          {ipo.priceLow || ipo.priceHigh
                            ? <span style={{ fontSize: 12 }}>${ipo.priceLow || '?'}–${ipo.priceHigh || '?'}</span>
                            : '—'}
                        </td>
                        <td><Badge value={ipo.interest} options={INTEREST} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-secondary" style={{ padding: '3px 8px', fontSize: 11 }}
                              onClick={e => { e.stopPropagation(); setEditing(ipo); setShowForm(false); }}>
                              ✎
                            </button>
                            <button className="btn-secondary" style={{ padding: '3px 8px', fontSize: 11, color: 'var(--red)' }}
                              onClick={e => { e.stopPropagation(); handleDelete(ipo.id); }}>
                              ×
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && ipo.notes && (
                        <tr key={`${ipo.id}-notes`}>
                          <td colSpan={10} style={{ background: '#f5f5f7', padding: '10px 16px', fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            {ipo.notes}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent IPOs comparison */}
      {listed.length > 0 && (
        <div className="card">
          <div className="section-title">IPOs Listados — Performance 1º Dia</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {listed
              .sort((a, b) => new Date(b.ipoDate) - new Date(a.ipoDate))
              .map(i => {
                const ret = parseFloat(i.firstDayReturn);
                return (
                  <div key={i.id} style={{
                    padding: '10px 14px', borderRadius: 12,
                    background: ret > 20 ? '#f0fbf3' : ret > 0 ? '#f5f5f7' : '#fff5f5',
                    border: `1px solid ${ret > 20 ? '#34c75940' : ret > 0 ? 'var(--border-dim)' : '#ff3b3040'}`,
                    minWidth: 120,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{i.ticker || i.company}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{i.sector}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: ret > 0 ? '#248a3d' : '#ff3b30' }}>
                      {ret > 0 ? '+' : ''}{ret.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {new Date(i.ipoDate + 'T12:00:00').toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
