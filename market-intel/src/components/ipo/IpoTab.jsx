import { useState } from 'react';

const LS_KEY = 'mid_ipo_v3';
const MARKETS  = ['NASDAQ','NYSE','LSE','Euronext','DFM','ADX','HKEX','ASX','Outro'];
const STATUSES = [
  { v:'upcoming',  l:'Previsto',  c:'#86868b' },
  { v:'roadshow',  l:'Roadshow',  c:'#0071e3' },
  { v:'pricing',   l:'Pricing',   c:'#ff9500' },
  { v:'listed',    l:'Listed',    c:'#34c759' },
  { v:'withdrawn', l:'Retirado',  c:'#ff3b30' },
];
const INTEREST = [
  { v:'pass',       l:'Passar',     c:'#86868b' },
  { v:'watch',      l:'Vigiar',     c:'#ff9500' },
  { v:'interested', l:'Interessado',c:'#0071e3' },
  { v:'allocated',  l:'Alocado',    c:'#34c759' },
];

const EMPTY = { company:'', ticker:'', ipoDate:'', market:'NASDAQ', status:'upcoming', interest:'watch' };
const DAYS   = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

function load() { try { return JSON.parse(localStorage.getItem(LS_KEY)||'[]'); } catch { return []; } }
function persist(l) { try { localStorage.setItem(LS_KEY, JSON.stringify(l)); } catch {} }

const DEMOS = [
  { id:1, company:'Klarna',            ticker:'KLAR',  ipoDate:'2025-07-01', market:'NYSE',   status:'upcoming',  interest:'interested' },
  { id:2, company:'Cerebras Systems',  ticker:'CBRS',  ipoDate:'2025-10-15', market:'NASDAQ', status:'roadshow',  interest:'interested' },
  { id:3, company:'CoreWeave',         ticker:'CRWV',  ipoDate:'2025-03-28', market:'NASDAQ', status:'listed',    interest:'watch'      },
  { id:4, company:'Medline Industries',ticker:'MDLN',  ipoDate:'2025-09-01', market:'NYSE',   status:'upcoming',  interest:'watch'      },
  { id:5, company:'Chime Financial',   ticker:'CHYM',  ipoDate:'2025-11-05', market:'NYSE',   status:'upcoming',  interest:'interested' },
  { id:6, company:'Ripple / XRP',      ticker:'XRPL',  ipoDate:'2025-12-10', market:'NASDAQ', status:'upcoming',  interest:'watch'      },
];

function Badge({ v, opts }) {
  const o = opts.find(x => x.v === v) || opts[0];
  return <span style={{ fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:980, background:o.c+'18', color:o.c }}>{o.l}</span>;
}

function Modal({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial || EMPTY);
  const set = (k,v) => setF(p => ({ ...p, [k]:v }));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth:400 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize:18, fontWeight:600, marginBottom:20 }}>{initial ? 'Editar IPO' : 'Adicionar IPO'}</h2>
        {[
          { k:'company', l:'Empresa *',   type:'text',   ph:'Ex: Klarna' },
          { k:'ticker',  l:'Ticker',      type:'text',   ph:'KLAR', upper:true },
          { k:'ipoDate', l:'Data IPO *',  type:'date' },
        ].map(row => (
          <div key={row.k} style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.3 }}>{row.l}</label>
            <input type={row.type} className="input" placeholder={row.ph||''} value={f[row.k]||''}
              onChange={e => set(row.k, row.upper ? e.target.value.toUpperCase() : e.target.value)}
              style={row.upper ? { textTransform:'uppercase' } : undefined} />
          </div>
        ))}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          {[
            { k:'market',   l:'Mercado',   opts:MARKETS.map(m => ({ v:m, l:m })) },
            { k:'status',   l:'Estado',    opts:STATUSES.map(s => ({ v:s.v, l:s.l })) },
            { k:'interest', l:'Interesse', opts:INTEREST.map(i => ({ v:i.v, l:i.l })) },
          ].map(row => (
            <div key={row.k} style={{ gridColumn: row.k==='market' ? 'span 2' : undefined }}>
              <label style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:.3 }}>{row.l}</label>
              <select className="input" value={f[row.k]} onChange={e => set(row.k, e.target.value)}>
                {row.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSave(f)} disabled={!f.company.trim() || !f.ipoDate}>
            {initial ? 'Guardar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function IpoTab() {
  const [ipos, setIpos] = useState(() => { const s = load(); return s.length ? s : DEMOS; });
  const [modal, setModal]   = useState(null); // null | 'add' | entry
  const [viewYear, setViewYear]   = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth()); // 0-indexed
  const [sortKey, setSortKey] = useState('ipoDate');
  const [sortDir, setSortDir] = useState('asc');

  function upsert(form) {
    const updated = modal && modal !== 'add'
      ? ipos.map(i => i.id === modal.id ? { ...form, id:modal.id } : i)
      : [...ipos, { ...form, id:Date.now(), ticker:(form.ticker||'').toUpperCase() }];
    setIpos(updated); persist(updated); setModal(null);
  }
  function del(id) { const u = ipos.filter(i => i.id !== id); setIpos(u); persist(u); }

  function sort(k) {
    if (sortKey === k) setSortDir(d => d==='asc'?'desc':'asc');
    else { setSortKey(k); setSortDir('asc'); }
  }

  // Calendar
  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
  const cells = [...Array(startDow).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];
  while (cells.length % 7) cells.push(null);

  const iposByDay = {};
  ipos.forEach(ipo => {
    if (!ipo.ipoDate) return;
    const d = new Date(ipo.ipoDate + 'T12:00:00');
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const day = d.getDate();
      if (!iposByDay[day]) iposByDay[day] = [];
      iposByDay[day].push(ipo);
    }
  });

  const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  function prevMonth() { if (viewMonth === 0) { setViewMonth(11); setViewYear(y=>y-1); } else setViewMonth(m=>m-1); }
  function nextMonth() { if (viewMonth === 11) { setViewMonth(0);  setViewYear(y=>y+1); } else setViewMonth(m=>m+1); }

  // List (sorted)
  const sorted = [...ipos].sort((a,b) => {
    let av = a[sortKey]||'', bv = b[sortKey]||'';
    if (av<bv) return sortDir==='asc' ? -1 : 1;
    if (av>bv) return sortDir==='asc' ? 1 : -1;
    return 0;
  });

  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ display:'grid', gap:16 }}>
      {modal && <Modal initial={modal==='add'?null:modal} onSave={upsert} onClose={()=>setModal(null)} />}

      {/* Calendar card */}
      <div className="card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button className="btn-secondary" style={{ padding:'5px 12px' }} onClick={prevMonth}>‹</button>
            <span style={{ fontSize:17, fontWeight:600, letterSpacing:-.3, minWidth:160, textAlign:'center' }}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button className="btn-secondary" style={{ padding:'5px 12px' }} onClick={nextMonth}>›</button>
          </div>
          <button className="btn-primary" onClick={()=>setModal('add')}>+ Adicionar</button>
        </div>

        {/* Day headers */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, marginBottom:4 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign:'center', fontSize:11, fontWeight:600, color:'var(--text-muted)', padding:'4px 0', textTransform:'uppercase', letterSpacing:.4 }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 }}>
          {cells.map((day, idx) => {
            const entries = day ? (iposByDay[day]||[]) : [];
            const isToday = day && `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` === today;
            return (
              <div key={idx} style={{
                minHeight: 64,
                borderRadius: 10,
                background: day ? (isToday ? '#e8f0ff' : '#fafafa') : 'transparent',
                border: isToday ? '1.5px solid #0071e3' : day ? '1px solid var(--border-dim)' : 'none',
                padding: '5px 6px',
              }}>
                {day && (
                  <>
                    <div style={{ fontSize:12, fontWeight: isToday ? 700 : 500, color: isToday ? '#0071e3' : 'var(--text-secondary)', marginBottom:4 }}>{day}</div>
                    {entries.map(e => {
                      const st = STATUSES.find(s => s.v === e.status) || STATUSES[0];
                      return (
                        <div key={e.id}
                          title={`${e.company} (${e.market})`}
                          onClick={() => setModal(e)}
                          style={{
                            fontSize:10, fontWeight:700, letterSpacing:.2,
                            padding:'2px 5px', borderRadius:5, marginBottom:2,
                            background:st.c+'22', color:st.c, cursor:'pointer',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                          }}>
                          {e.ticker || e.company.split(' ')[0]}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* IPO list */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              {[
                { k:'ipoDate', l:'Data' },
                { k:'ticker',  l:'Ticker' },
                { k:'company', l:'Empresa' },
                { k:'market',  l:'Mercado' },
                { k:'status',  l:'Estado' },
                { k:'interest',l:'Interesse' },
              ].map(col => (
                <th key={col.k} onClick={() => sort(col.k)} style={{ cursor:'pointer', userSelect:'none' }}>
                  {col.l} {sortKey===col.k && <span style={{ opacity:.4 }}>{sortDir==='asc'?'↑':'↓'}</span>}
                </th>
              ))}
              <th style={{ width:70 }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text-muted)', padding:32 }}>
                Nenhum IPO adicionado. Clica em "+ Adicionar".
              </td></tr>
            ) : sorted.map(ipo => (
              <tr key={ipo.id}>
                <td style={{ color:'var(--text-muted)', fontSize:12, whiteSpace:'nowrap' }}>
                  {ipo.ipoDate ? new Date(ipo.ipoDate+'T12:00:00').toLocaleDateString('pt-PT',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                </td>
                <td style={{ fontWeight:700, fontFamily:'monospace', fontSize:13 }}>{ipo.ticker||'—'}</td>
                <td style={{ fontWeight:500 }}>{ipo.company}</td>
                <td style={{ fontSize:12, color:'var(--text-secondary)' }}>{ipo.market}</td>
                <td><Badge v={ipo.status}   opts={STATUSES} /></td>
                <td><Badge v={ipo.interest} opts={INTEREST} /></td>
                <td>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn-secondary" style={{ padding:'3px 9px', fontSize:11 }} onClick={()=>setModal(ipo)}>✎</button>
                    <button className="btn-secondary" style={{ padding:'3px 9px', fontSize:11, color:'var(--red)' }} onClick={()=>del(ipo.id)}>×</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
