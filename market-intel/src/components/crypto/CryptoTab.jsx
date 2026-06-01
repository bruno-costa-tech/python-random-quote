import { useState, useEffect, useRef } from 'react';

const DEX = 'https://api.dexscreener.com';
const LS_KEY = 'mid_crypto_watch_v1';

// ── helpers ──────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1e9) return '$' + (n/1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n/1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n/1e3).toFixed(0) + 'K';
  return '$' + n.toFixed(0);
}
function fmtP(p) {
  if (p == null || isNaN(p)) return '—';
  const n = parseFloat(p);
  if (n >= 1)      return '$' + n.toFixed(4);
  if (n >= 0.01)   return '$' + n.toFixed(6);
  if (n >= 0.0001) return '$' + n.toFixed(8);
  const e = n.toExponential(2);
  return '$' + e;
}
function chgColor(v) {
  if (!v && v !== 0) return 'var(--text-muted)';
  return v > 0 ? '#248a3d' : v < 0 ? '#ff3b30' : 'var(--text-muted)';
}
function chgFmt(v) {
  if (v == null || isNaN(v)) return '—';
  return (v > 0 ? '+' : '') + v.toFixed(2) + '%';
}

// ── scoring ──────────────────────────────────────────────────────────────────
function calcScore(pair) {
  let pts = 0;
  const mcap  = pair.marketCap || pair.fdv || 0;
  const vol24 = pair.volume?.h24 || 0;
  const vol1h  = pair.volume?.h1  || 0;
  const liq   = pair.liquidity?.usd || 0;
  const ch1h  = pair.priceChange?.h1  || 0;
  const ch24  = pair.priceChange?.h24 || 0;
  const buys1  = pair.txns?.h1?.buys  || 0;
  const sells1 = pair.txns?.h1?.sells || 0;
  const fdv   = pair.fdv || 0;

  // Vol/MCap ratio – main signal of unusual activity (0-30)
  if (mcap > 0) {
    const r = vol24 / mcap;
    if (r > 2)    pts += 30;
    else if (r > 1)   pts += 24;
    else if (r > 0.5) pts += 18;
    else if (r > 0.2) pts += 12;
    else if (r > 0.05)pts += 6;
  }

  // 1h momentum (0-25)
  if (ch1h > 50)     pts += 25;
  else if (ch1h > 20) pts += 20;
  else if (ch1h > 10) pts += 15;
  else if (ch1h > 5)  pts += 10;
  else if (ch1h > 0)  pts += 5;

  // 24h trend direction (0-15)
  if (ch24 > 100)    pts += 15;
  else if (ch24 > 50) pts += 12;
  else if (ch24 > 20) pts += 9;
  else if (ch24 > 0)  pts += 5;

  // Buy pressure 1h (0-20)
  const total1 = buys1 + sells1;
  if (total1 > 0) {
    const br = buys1 / total1;
    if (br > 0.75)      pts += 20;
    else if (br > 0.65) pts += 15;
    else if (br > 0.55) pts += 9;
    else if (br > 0.50) pts += 4;
  }

  // Liquidity sweet spot (0-10)
  // Too low = rug risk; too high = harder to move
  if (liq >= 30000 && liq <= 300000)  pts += 10;
  else if (liq >= 10000 && liq < 30000) pts += 7;
  else if (liq >= 300000 && liq <= 1000000) pts += 5;
  else if (liq >= 5000 && liq < 10000) pts += 3;

  return Math.min(100, Math.round(pts));
}

function scoreTier(s) {
  if (s >= 80) return { label:'EXPLOSIVO',      color:'#ff3b30' };
  if (s >= 60) return { label:'ALTO POTENCIAL', color:'#ff9500' };
  if (s >= 40) return { label:'SETUP',          color:'#0071e3' };
  if (s >= 20) return { label:'OBSERVAR',       color:'#86868b' };
  return            { label:'SEM SINAL',       color:'#c7c7cc' };
}

// ── chain badges ──────────────────────────────────────────────────────────────
const CHAIN_COLORS = {
  solana:    { bg:'#9945ff22', c:'#9945ff', l:'SOL' },
  ethereum:  { bg:'#627eea22', c:'#627eea', l:'ETH' },
  bsc:       { bg:'#f0b90b22', c:'#b8860b', l:'BSC' },
  base:      { bg:'#0052ff22', c:'#0052ff', l:'BASE' },
  avalanche: { bg:'#e8424222', c:'#e84242', l:'AVAX' },
  polygon:   { bg:'#8247e522', c:'#8247e5', l:'MATIC' },
  arbitrum:  { bg:'#28a0f022', c:'#1a8ccc', l:'ARB' },
};
function ChainBadge({ chain }) {
  const info = CHAIN_COLORS[chain] || { bg:'#86868b22', c:'#86868b', l: (chain||'?').slice(0,4).toUpperCase() };
  return (
    <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:6, background:info.bg, color:info.c, whiteSpace:'nowrap' }}>
      {info.l}
    </span>
  );
}

// ── API ───────────────────────────────────────────────────────────────────────
async function searchDex(q) {
  const r = await fetch(`${DEX}/latest/dex/search?q=${encodeURIComponent(q)}`);
  if (!r.ok) throw new Error(`DexScreener error ${r.status}`);
  const d = await r.json();
  return (d.pairs || []).filter(p => (p.liquidity?.usd || 0) >= 3000);
}

function dedupe(pairs) {
  const seen = new Set();
  return pairs.filter(p => {
    const k = p.pairAddress;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
}

// ── main component ────────────────────────────────────────────────────────────
const INIT_QUERIES = ['sol','pepe','meme'];

function loadWL() { try { return JSON.parse(localStorage.getItem(LS_KEY)||'[]'); } catch { return []; } }
function saveWL(l) { try { localStorage.setItem(LS_KEY, JSON.stringify(l)); } catch {} }

export default function CryptoTab() {
  const [pairs, setPairs]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [query, setQuery]     = useState('');
  const [filterChain, setFilterChain] = useState('all');
  const [minScore, setMinScore]       = useState(0);
  const [sortKey, setSortKey]   = useState('score');
  const [sortDir, setSortDir]   = useState('desc');
  const [watchlist, setWatchlist] = useState(loadWL);
  const [lastRefresh, setLastRefresh] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => { initialLoad(); }, []);

  async function initialLoad() {
    setLoading(true); setError('');
    try {
      const results = await Promise.all(INIT_QUERIES.map(q => searchDex(q).catch(()=>[])));
      const all = dedupe(results.flat());
      setPairs(all);
      setLastRefresh(new Date());
    } catch(e) { setError('Erro ao carregar dados do DexScreener: ' + e.message); }
    setLoading(false);
  }

  async function handleSearch(e) {
    e?.preventDefault();
    if (!query.trim()) { initialLoad(); return; }
    setLoading(true); setError('');
    try {
      const result = await searchDex(query.trim());
      setPairs(result);
      setLastRefresh(new Date());
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  function sort(k) {
    if (sortKey === k) setSortDir(d => d==='asc'?'desc':'asc');
    else { setSortKey(k); setSortDir(k==='score'?'desc':'desc'); }
  }

  function addToWL(pair, score) {
    const entry = {
      pairAddress: pair.pairAddress,
      symbol: pair.baseToken?.symbol || '?',
      name: pair.baseToken?.name || '?',
      chain: pair.chainId,
      price: pair.priceUsd,
      score,
      url: pair.url,
      savedAt: new Date().toLocaleDateString('pt-PT'),
    };
    const updated = [entry, ...watchlist.filter(w => w.pairAddress !== pair.pairAddress)];
    setWatchlist(updated); saveWL(updated);
  }
  function removeWL(addr) {
    const updated = watchlist.filter(w => w.pairAddress !== addr);
    setWatchlist(updated); saveWL(updated);
  }

  const chains = ['all', ...new Set(pairs.map(p => p.chainId).filter(Boolean))];

  const processed = pairs
    .map(p => ({ ...p, _score: calcScore(p) }))
    .filter(p => (filterChain === 'all' || p.chainId === filterChain) && p._score >= minScore)
    .sort((a,b) => {
      let av, bv;
      if (sortKey === 'score')     { av = a._score;              bv = b._score; }
      else if (sortKey === 'vol')  { av = a.volume?.h24||0;      bv = b.volume?.h24||0; }
      else if (sortKey === 'ch1h') { av = a.priceChange?.h1||0;  bv = b.priceChange?.h1||0; }
      else if (sortKey === 'liq')  { av = a.liquidity?.usd||0;   bv = b.liquidity?.usd||0; }
      else if (sortKey === 'mcap') { av = a.marketCap||a.fdv||0; bv = b.marketCap||b.fdv||0; }
      else { av = 0; bv = 0; }
      return sortDir === 'desc' ? bv - av : av - bv;
    });

  const wlAddresses = new Set(watchlist.map(w => w.pairAddress));

  return (
    <div style={{ display:'grid', gap:16 }}>

      {/* Search + controls */}
      <div className="card">
        <form onSubmit={handleSearch} style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
          <input ref={searchRef} className="input" style={{ flex:1, minWidth:200 }}
            placeholder="Pesquisar token, símbolo ou endereço de contrato..."
            value={query} onChange={e => setQuery(e.target.value)} />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="loader"/> : 'Pesquisar'}
          </button>
          <button type="button" className="btn-secondary" onClick={initialLoad} disabled={loading}>
            Recarregar
          </button>
        </form>

        {/* Chain filter */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)' }}>CHAIN</span>
          {chains.map(ch => (
            <button key={ch} onClick={()=>setFilterChain(ch)} style={{
              background: filterChain===ch ? '#1d1d1f' : 'transparent',
              border:`1px solid ${filterChain===ch ? '#1d1d1f' : 'var(--border-mid)'}`,
              color: filterChain===ch ? '#fff' : 'var(--text-secondary)',
              fontSize:11, fontWeight:600, padding:'4px 11px', borderRadius:980, cursor:'pointer', transition:'all .15s',
            }}>
              {ch === 'all' ? 'Todas' : (CHAIN_COLORS[ch]?.l || ch.toUpperCase())}
            </button>
          ))}
          <div style={{ flex:1 }}/>
          <span style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)' }}>SCORE MÍN.</span>
          {[0,30,50,70].map(s => (
            <button key={s} onClick={()=>setMinScore(s)} style={{
              background: minScore===s ? '#0071e3' : 'transparent',
              border:`1px solid ${minScore===s ? '#0071e3' : 'var(--border-mid)'}`,
              color: minScore===s ? '#fff' : 'var(--text-secondary)',
              fontSize:11, fontWeight:600, padding:'4px 11px', borderRadius:980, cursor:'pointer', transition:'all .15s',
            }}>{s === 0 ? 'Todos' : `${s}+`}</button>
          ))}
          {lastRefresh && (
            <span style={{ fontSize:11, color:'var(--text-muted)' }}>
              Actualizado {lastRefresh.toLocaleTimeString('pt-PT', { hour:'2-digit', minute:'2-digit' })}
            </span>
          )}
        </div>
        {error && <div className="error-msg" style={{ marginTop:10 }}>{error}</div>}
      </div>

      {/* Stats */}
      {processed.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12 }}>
          {[
            { l:'Pares encontrados',  v: processed.length },
            { l:'Score ≥ 60',         v: processed.filter(p=>p._score>=60).length, c:'#ff9500' },
            { l:'Score ≥ 80',         v: processed.filter(p=>p._score>=80).length, c:'#ff3b30' },
            { l:'Com momentum 1h',    v: processed.filter(p=>(p.priceChange?.h1||0)>5).length, c:'#34c759' },
          ].map(s => (
            <div key={s.l} className="card" style={{ padding:'14px 16px' }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:.3, marginBottom:6 }}>{s.l}</div>
              <div style={{ fontSize:24, fontWeight:700, color:s.c||'var(--text-primary)' }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {loading && pairs.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>
            <span className="loader" style={{ width:20, height:20, marginBottom:10, display:'block', margin:'0 auto 10px' }}/> A carregar dados do DexScreener...
          </div>
        ) : processed.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>
            Nenhum resultado. Tenta pesquisar um token ou endereço de contrato.
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Chain</th>
                  <th>Token</th>
                  <th>Preço</th>
                  <th onClick={()=>sort('ch1h')} style={{ cursor:'pointer' }}>
                    1h% {sortKey==='ch1h' && <span style={{opacity:.4}}>{sortDir==='asc'?'↑':'↓'}</span>}
                  </th>
                  <th>24h%</th>
                  <th onClick={()=>sort('vol')} style={{ cursor:'pointer', whiteSpace:'nowrap' }}>
                    Vol 24h {sortKey==='vol' && <span style={{opacity:.4}}>{sortDir==='asc'?'↑':'↓'}</span>}
                  </th>
                  <th onClick={()=>sort('mcap')} style={{ cursor:'pointer' }}>
                    MCap {sortKey==='mcap' && <span style={{opacity:.4}}>{sortDir==='asc'?'↑':'↓'}</span>}
                  </th>
                  <th onClick={()=>sort('liq')} style={{ cursor:'pointer' }}>
                    Liq. {sortKey==='liq' && <span style={{opacity:.4}}>{sortDir==='asc'?'↑':'↓'}</span>}
                  </th>
                  <th style={{ whiteSpace:'nowrap' }}>Buys 1h</th>
                  <th onClick={()=>sort('score')} style={{ cursor:'pointer', whiteSpace:'nowrap' }}>
                    Score {sortKey==='score' && <span style={{opacity:.4}}>{sortDir==='asc'?'↑':'↓'}</span>}
                  </th>
                  <th style={{ width:80 }}></th>
                </tr>
              </thead>
              <tbody>
                {processed.map(pair => {
                  const score = pair._score;
                  const tier  = scoreTier(score);
                  const ch1h  = pair.priceChange?.h1;
                  const ch24  = pair.priceChange?.h24;
                  const buys  = pair.txns?.h1?.buys || 0;
                  const sells = pair.txns?.h1?.sells || 0;
                  const totalTxns = buys + sells;
                  const buyPct = totalTxns > 0 ? Math.round(buys/totalTxns*100) : null;
                  const inWL   = wlAddresses.has(pair.pairAddress);

                  return (
                    <tr key={pair.pairAddress}>
                      <td><ChainBadge chain={pair.chainId} /></td>
                      <td>
                        <div style={{ fontWeight:700, fontSize:13 }}>{pair.baseToken?.symbol || '?'}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {pair.baseToken?.name || ''}
                        </div>
                      </td>
                      <td style={{ fontFamily:'monospace', fontSize:12, whiteSpace:'nowrap' }}>{fmtP(pair.priceUsd)}</td>
                      <td style={{ fontWeight:700, color:chgColor(ch1h), whiteSpace:'nowrap' }}>{chgFmt(ch1h)}</td>
                      <td style={{ fontWeight:600, color:chgColor(ch24), whiteSpace:'nowrap' }}>{chgFmt(ch24)}</td>
                      <td style={{ whiteSpace:'nowrap' }}>{fmt(pair.volume?.h24)}</td>
                      <td style={{ whiteSpace:'nowrap' }}>{fmt(pair.marketCap || pair.fdv)}</td>
                      <td style={{ whiteSpace:'nowrap' }}>{fmt(pair.liquidity?.usd)}</td>
                      <td>
                        {buyPct != null ? (
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ width:40 }} className="bar-track">
                              <div className="bar-fill" style={{ width:`${buyPct}%`, background: buyPct>65 ? '#34c759' : buyPct>50 ? '#ff9500' : '#ff3b30' }} />
                            </div>
                            <span style={{ fontSize:11, color: buyPct>65 ? '#248a3d' : 'var(--text-muted)' }}>{buyPct}%</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:16, fontWeight:700, color:tier.color }}>{score}</span>
                          <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:980, background:tier.color+'18', color:tier.color, whiteSpace:'nowrap' }}>
                            {tier.label}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:5 }}>
                          <a href={pair.url} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize:11, padding:'3px 9px', borderRadius:980, border:'1px solid var(--border-mid)', color:'var(--blue-accent)', textDecoration:'none', background:'var(--bg-secondary)' }}>
                            DEX
                          </a>
                          <button
                            onClick={() => inWL ? removeWL(pair.pairAddress) : addToWL(pair, score)}
                            style={{
                              fontSize:11, padding:'3px 9px', borderRadius:980, cursor:'pointer', transition:'all .15s',
                              border: inWL ? '1px solid #34c759' : '1px solid var(--border-mid)',
                              background: inWL ? '#34c75918' : 'var(--bg-secondary)',
                              color: inWL ? '#248a3d' : 'var(--text-muted)',
                            }}>
                            {inWL ? '★' : '☆'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Watchlist */}
      {watchlist.length > 0 && (
        <div className="card">
          <div className="section-title">Watchlist ({watchlist.length})</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {watchlist.map(w => {
              const t = scoreTier(w.score);
              return (
                <div key={w.pairAddress} style={{
                  padding:'10px 14px', borderRadius:12, border:'1px solid var(--border-dim)',
                  background:'#fafafa', display:'flex', alignItems:'center', gap:12,
                }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13 }}>{w.symbol}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{(CHAIN_COLORS[w.chain]?.l||w.chain.toUpperCase())}</div>
                  </div>
                  <div style={{ fontWeight:700, fontSize:18, color:t.color }}>{w.score}</div>
                  <div style={{ display:'flex', gap:6 }}>
                    <a href={w.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:11, padding:'3px 9px', borderRadius:980, border:'1px solid var(--border-mid)', color:'var(--blue-accent)', textDecoration:'none' }}>
                      DEX
                    </a>
                    <button onClick={()=>removeWL(w.pairAddress)}
                      style={{ fontSize:11, padding:'3px 9px', borderRadius:980, cursor:'pointer', border:'1px solid var(--border-mid)', background:'transparent', color:'var(--red)' }}>
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:10 }}>
            Scores calculados na altura em que foram guardados. Pesquisa o token para ver dados actualizados.
          </div>
        </div>
      )}

      {/* Methodology note */}
      <div className="card" style={{ padding:'14px 18px', background:'#f5f5f7' }}>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:.4 }}>Metodologia do Score</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:6, fontSize:12, color:'var(--text-secondary)' }}>
          {[
            { l:'Vol/MCap 24h', pts:'30', d:'Actividade vs tamanho do token' },
            { l:'Momentum 1h',  pts:'25', d:'Velocidade de subida recente' },
            { l:'Tendência 24h',pts:'15', d:'Direcção geral do dia' },
            { l:'Pressão buys', pts:'20', d:'% transacções de compra (1h)' },
            { l:'Liquidez',     pts:'10', d:'Sweet spot $10K–$300K' },
          ].map(row => (
            <div key={row.l} style={{ display:'flex', gap:6, alignItems:'baseline' }}>
              <span style={{ fontWeight:700, color:'var(--text-primary)' }}>{row.l}</span>
              <span style={{ color:'var(--text-muted)' }}>({row.pts}pts)</span>
              <span>— {row.d}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:8 }}>
          Dados em tempo real via DexScreener. Não é conselho de investimento. Meme coins têm risco extremo de perda total.
        </div>
      </div>
    </div>
  );
}
