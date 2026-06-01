import { useState, useEffect, useRef, useCallback } from 'react';

// ── URL routing (3 modes) ────────────────────────────────────────────────────
// 1. npm run dev   → Vite proxy: /proxy/dex → api.dexscreener.com
// 2. node server.js → /api/proxy?url= (Node proxies the call)
// 3. file://        → direct (fails CORS, shows instructions)
const DEV   = import.meta.env.DEV;
const LOCAL = !DEV && typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

function dexUrl(path) {
  if (DEV)   return `/proxy/dex${path}`;
  if (LOCAL) return `/api/proxy?url=${encodeURIComponent('https://api.dexscreener.com' + path)}`;
  return `https://api.dexscreener.com${path}`;
}

const LS_KEY      = 'mid_crypto_v4';
const REFRESH_SEC = 60;

// ── helpers ──────────────────────────────────────────────────────────────────
function fmt(n) {
  if (!n || isNaN(n)) return '—';
  if (n >= 1e9)  return '$' + (n/1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return '$' + (n/1e6).toFixed(2) + 'M';
  if (n >= 1e3)  return '$' + (n/1e3).toFixed(0) + 'K';
  return '$' + n.toFixed(0);
}
function fmtPrice(p) {
  if (!p) return '—';
  const n = parseFloat(p);
  if (!n) return '—';
  if (n >= 1)       return '$' + n.toFixed(4);
  if (n >= 0.001)   return '$' + n.toFixed(6);
  if (n >= 0.00001) return '$' + n.toFixed(8);
  return '$' + n.toExponential(2);
}
function pct(v, d = 1) {
  if (v == null || isNaN(v)) return '—';
  return (v > 0 ? '+' : '') + parseFloat(v).toFixed(d) + '%';
}
function cc(v) { return v > 0 ? '#248a3d' : v < 0 ? '#ff3b30' : 'var(--text-muted)'; }
function ageStr(h) {
  if (h == null) return null;
  if (h < 1)   return `${Math.round(h * 60)}min`;
  if (h < 24)  return `${h.toFixed(0)}h`;
  return `${Math.floor(h / 24)}d`;
}

// ── normalize DexScreener pair ────────────────────────────────────────────────
function normalize(p) {
  const created = p.pairCreatedAt ? new Date(p.pairCreatedAt) : null;
  const ageH    = created ? (Date.now() - created.getTime()) / 3600000 : null;
  return {
    id:      p.pairAddress,
    url:     p.url,
    chain:   p.chainId,
    name:    p.baseToken?.symbol || '?',
    full:    `${p.baseToken?.symbol || '?'}/${p.quoteToken?.symbol || '?'}`,
    price:   p.priceUsd,
    ch:  { m5: +p.priceChange?.m5 || 0, h1: +p.priceChange?.h1 || 0,
           h6: +p.priceChange?.h6 || 0, h24: +p.priceChange?.h24 || 0 },
    vol: { m5: +p.volume?.m5 || 0, h1: +p.volume?.h1 || 0,
           h6: +p.volume?.h6 || 0, h24: +p.volume?.h24 || 0 },
    txn: { buys5m: p.txns?.m5?.buys || 0, sells5m: p.txns?.m5?.sells || 0,
           buys1h: p.txns?.h1?.buys || 0, sells1h: p.txns?.h1?.sells || 0 },
    mcap: +(p.marketCap || p.fdv) || 0,
    fdv:  +p.fdv || 0,
    liq:  +p.liquidity?.usd || 0,
    ageH,
    _isDemo: false,
  };
}

// ── score 0-100 ───────────────────────────────────────────────────────────────
// Factores:
//   Momentum 5m      (0-25)  — o que está a acontecer AGORA
//   Vol/MCap 24h     (0-20)  — actividade relativa ao tamanho
//   Pressão compra 5m(0-20)  — direcção das transacções
//   Aceleração vol   (0-15)  — 1h vs média das 6h
//   MCap sweet spot  (0-12)  — quanto menor, mais explosivo
//   Frescura         (0-8)   — token novo = maior surpresa
function calcScore(t) {
  let pts = 0;
  const sigs = [];

  // 1 — Momentum 5m
  const ch5 = t.ch.m5;
  let s1 = 0;
  if (ch5 > 50) s1 = 25; else if (ch5 > 25) s1 = 21; else if (ch5 > 10) s1 = 16;
  else if (ch5 > 5) s1 = 11; else if (ch5 > 2) s1 = 6; else if (ch5 > 0) s1 = 3;
  pts += s1;
  if (s1) sigs.push({ key:'mom', label:`${pct(ch5)} (5m)`, pts:s1, max:25, c:'#ff3b30' });

  // 2 — Vol/MCap
  let s2 = 0;
  if (t.mcap > 0) {
    const r = t.vol.h24 / t.mcap;
    if (r > 10) s2 = 20; else if (r > 5) s2 = 17; else if (r > 2) s2 = 13;
    else if (r > 1) s2 = 9; else if (r > 0.3) s2 = 5; else if (r > 0.1) s2 = 2;
    if (s2) sigs.push({ key:'vm', label:`Vol/MCap ${(r*100).toFixed(0)}%`, pts:s2, max:20, c:'#ff9500' });
  }
  pts += s2;

  // 3 — Pressão compradora 5m
  const tot5 = t.txn.buys5m + t.txn.sells5m;
  let s3 = 0;
  if (tot5 >= 5) {
    const bp = t.txn.buys5m / tot5;
    if (bp > 0.85) s3 = 20; else if (bp > 0.75) s3 = 16; else if (bp > 0.65) s3 = 11;
    else if (bp > 0.55) s3 = 6; else if (bp > 0.50) s3 = 3;
    if (s3) sigs.push({ key:'bp', label:`Buys ${Math.round(bp*100)}% (5m, ${tot5} tx)`, pts:s3, max:20, c:'#34c759' });
  }
  pts += s3;

  // 4 — Aceleração de volume
  const avg6 = t.vol.h6 > 0 ? t.vol.h6 / 6 : 0;
  let s4 = 0;
  if (avg6 > 0 && t.vol.h1 > 0) {
    const a = t.vol.h1 / avg6;
    if (a > 20) s4 = 15; else if (a > 10) s4 = 12; else if (a > 5) s4 = 8; else if (a > 2) s4 = 4;
    if (s4) sigs.push({ key:'acc', label:`Vol ×${a.toFixed(1)} vs média 6h`, pts:s4, max:15, c:'#5856d6' });
  }
  pts += s4;

  // 5 — MCap sweet spot
  let s5 = 0;
  if (t.mcap > 0) {
    if (t.mcap < 200000) s5 = 12; else if (t.mcap < 1000000) s5 = 10;
    else if (t.mcap < 5000000) s5 = 7; else if (t.mcap < 20000000) s5 = 4;
    else if (t.mcap < 50000000) s5 = 2;
    if (s5) sigs.push({ key:'mc', label:`MCap ${fmt(t.mcap)}`, pts:s5, max:12, c:'#0071e3' });
  }
  pts += s5;

  // 6 — Frescura
  let s6 = 0;
  if (t.ageH != null) {
    if (t.ageH < 1) s6 = 8; else if (t.ageH < 6) s6 = 6;
    else if (t.ageH < 24) s6 = 4; else if (t.ageH < 72) s6 = 2;
    if (s6) sigs.push({ key:'age', label:`Novo (${ageStr(t.ageH)})`, pts:s6, max:8, c:'#af52de' });
  }
  pts += s6;

  // Riscos
  const risks = [];
  if (t.liq < 5000) risks.push({ lvl:'danger', msg:'Liquidez < $5K — risco de rug muito elevado' });
  else if (t.liq < 15000) risks.push({ lvl:'warn', msg:`Liquidez baixa — ${fmt(t.liq)}` });
  if (t.ageH != null && t.ageH < 0.5) risks.push({ lvl:'warn', msg:'Token < 30min — extremamente especulativo' });
  if (t.mcap > 100000000) risks.push({ lvl:'info', msg:'MCap > $100M — potencial limitado' });

  // Insights em linguagem natural
  const insights = [];
  if (ch5 > 5) insights.push(`Preço já em movimento: ${pct(ch5)} nos últimos 5 minutos.`);
  if (t.mcap > 0 && t.vol.h24 / t.mcap > 1) insights.push(`Volume 24h (${fmt(t.vol.h24)}) supera o próprio market cap — actividade extrema.`);
  if (tot5 >= 5 && t.txn.buys5m / tot5 > 0.65) insights.push(`${Math.round(t.txn.buys5m/tot5*100)}% das transacções recentes são compras — acumulação em curso.`);
  if (t.mcap > 0 && t.mcap < 1000000) insights.push(`Market cap de apenas ${fmt(t.mcap)} — qualquer afluxo de volume move o preço drasticamente.`);
  if (t.ageH != null && t.ageH < 24) insights.push(`Token com apenas ${ageStr(t.ageH)} de existência — janela de descoberta em aberto.`);
  if (avg6 > 0 && t.vol.h1 / avg6 > 5) insights.push(`Volume na última hora é ${(t.vol.h1/avg6).toFixed(0)}× acima da média das 6h — algo está a acontecer agora.`);

  return { score: Math.min(100, Math.round(pts)), signals: sigs, risks, insights };
}

function tier(s) {
  if (s >= 80) return { label:'EXPLOSIVO',       color:'#ff3b30', bg:'#fff0f0' };
  if (s >= 65) return { label:'ALTO POTENCIAL',  color:'#ff9500', bg:'#fff8ed' };
  if (s >= 45) return { label:'MOMENTUM',        color:'#0071e3', bg:'#f0f4ff' };
  if (s >= 25) return { label:'OBSERVAR',        color:'#86868b', bg:'#f5f5f7' };
  return             { label:'SEM SINAL',        color:'#c7c7cc', bg:'#fafafa' };
}

const CHAINS = {
  solana:   { l:'SOL',  c:'#9945ff' }, ethereum: { l:'ETH',  c:'#627eea' },
  bsc:      { l:'BSC',  c:'#f0b90b' }, base:     { l:'BASE', c:'#0052ff' },
  avalanche:{ l:'AVAX', c:'#e84242' }, polygon:  { l:'MATIC',c:'#8247e5' },
  arbitrum: { l:'ARB',  c:'#28a0f0' },
};
function ChainBadge({ chain }) {
  const i = CHAINS[chain] || { l:(chain||'?').slice(0,5).toUpperCase(), c:'#86868b' };
  return <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:6, background:i.c+'22', color:i.c }}>{i.l}</span>;
}

// ── demo data (when API unavailable) ─────────────────────────────────────────
const now = Date.now();
const DEMOS = [
  { id:'d1', _isDemo:true, url:'#', chain:'solana', name:'GOATAI', full:'GOATAI/SOL', price:'0.000047',
    ch:{m5:28.4,h1:87.2,h6:140.3,h24:380.5}, vol:{m5:185000,h1:920000,h6:1800000,h24:3400000},
    txn:{buys5m:62,sells5m:8,buys1h:480,sells1h:72}, mcap:285000,fdv:320000,liq:47000,
    ageH:2.3, _analysis: null },
  { id:'d2', _isDemo:true, url:'#', chain:'solana', name:'CATANA', full:'CATANA/SOL', price:'0.00000082',
    ch:{m5:14.1,h1:41.5,h6:95.2,h24:210.8}, vol:{m5:48000,h1:310000,h6:580000,h24:980000},
    txn:{buys5m:34,sells5m:9,buys1h:220,sells1h:58}, mcap:620000,fdv:750000,liq:32000,
    ageH:5.7, _analysis: null },
  { id:'d3', _isDemo:true, url:'#', chain:'ethereum', name:'PEPEAI', full:'PEPEAI/ETH', price:'0.0000000312',
    ch:{m5:5.2,h1:18.3,h6:35.1,h24:78.4}, vol:{m5:12000,h1:85000,h6:190000,h24:420000},
    txn:{buys5m:18,sells5m:7,buys1h:140,sells1h:60}, mcap:1850000,fdv:2100000,liq:95000,
    ageH:18.2, _analysis: null },
  { id:'d4', _isDemo:true, url:'#', chain:'bsc', name:'DMAIL', full:'DMAIL/WBNB', price:'0.00482',
    ch:{m5:-2.1,h1:8.4,h6:22.0,h24:55.3}, vol:{m5:5500,h1:42000,h6:98000,h24:230000},
    txn:{buys5m:12,sells5m:10,buys1h:95,sells1h:78}, mcap:4200000,fdv:5100000,liq:280000,
    ageH:48, _analysis: null },
  { id:'d5', _isDemo:true, url:'#', chain:'solana', name:'WOJAK2', full:'WOJAK2/SOL', price:'0.000000621',
    ch:{m5:1.3,h1:3.8,h6:8.2,h24:12.5}, vol:{m5:1800,h1:14000,h6:38000,h24:95000},
    txn:{buys5m:8,sells5m:6,buys1h:62,sells1h:55}, mcap:8500000,fdv:9200000,liq:185000,
    ageH:96, _analysis: null },
].map(t => ({ ...t, _analysis: calcScore(t) }))
 .sort((a,b) => b._analysis.score - a._analysis.score);

// ── fetch ─────────────────────────────────────────────────────────────────────
async function apiFetch(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  const r = await fetch(url, { headers:{ Accept:'application/json' }, signal:ctrl.signal });
  clearTimeout(t);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

const SEARCH_QUERIES = ['sol', 'pump', 'pepe', 'cat', 'ai', 'wif'];

async function loadTrending() {
  // Try token boosts first (best signal for upcoming pumps)
  const [boostsResult, ...searchResults] = await Promise.allSettled([
    apiFetch(dexUrl('/token-boosts/top/v1')),
    ...SEARCH_QUERIES.slice(0, 4).map(q => apiFetch(dexUrl(`/latest/dex/search?q=${q}`))),
  ]);

  const pairs = searchResults.flatMap(r => r.status === 'fulfilled' ? (r.value?.pairs || []) : []);

  // Enrich with boost tokens
  if (boostsResult.status === 'fulfilled' && Array.isArray(boostsResult.value)) {
    const addrs = boostsResult.value.slice(0, 20).map(b => b.tokenAddress).filter(Boolean);
    if (addrs.length > 0) {
      try {
        const tokenData = await apiFetch(dexUrl(`/latest/dex/tokens/${addrs.slice(0,10).join(',')}`));
        if (tokenData?.pairs) pairs.push(...tokenData.pairs);
      } catch { /* non-fatal */ }
    }
  }

  // Dedupe by pairAddress
  const seen = new Set();
  return pairs.filter(p => {
    if (!p.pairAddress || seen.has(p.pairAddress)) return false;
    seen.add(p.pairAddress); return true;
  });
}

async function searchTokens(q) {
  const d = await apiFetch(dexUrl(`/latest/dex/search?q=${encodeURIComponent(q)}`));
  return d?.pairs || [];
}

// ── storage ───────────────────────────────────────────────────────────────────
function loadWL() { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } }
function saveWL(l) { try { localStorage.setItem(LS_KEY, JSON.stringify(l)); } catch {} }

// ── sub-components ────────────────────────────────────────────────────────────
function SigBar({ label, pts, max, c }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 30px', gap:8, alignItems:'center', marginBottom:5 }}>
      <span style={{ fontSize:11, color:'var(--text-secondary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{label}</span>
      <div className="bar-track"><div className="bar-fill" style={{ width:`${(pts/max)*100}%`, background:c }}/></div>
      <span style={{ fontSize:11, color:'var(--text-muted)', textAlign:'right' }}>+{pts}</span>
    </div>
  );
}

function HeroCard({ t, rank }) {
  const { score: sc, signals, risks, insights } = t._analysis;
  const tr = tier(sc);
  const isTop = rank === 0;

  return (
    <div className="card" style={{ border: isTop ? `2px solid ${tr.color}` : '1px solid var(--border-dim)', background: isTop ? tr.bg : undefined, position:'relative' }}>
      {isTop && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, borderRadius:'16px 16px 0 0', background:`linear-gradient(90deg,${tr.color},${tr.color}40)` }}/>}

      {t._isDemo && (
        <div style={{ fontSize:10, fontWeight:600, color:'#86868b', background:'#f5f5f7', padding:'2px 8px', borderRadius:6, display:'inline-block', marginBottom:6 }}>
          DEMO — dados simulados
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div>
          {isTop && <div style={{ fontSize:10, fontWeight:700, color:tr.color, letterSpacing:.5, marginBottom:3 }}>#{rank+1} MAIS EXPLOSIVO AGORA</div>}
          <div style={{ fontSize:isTop?20:16, fontWeight:700, letterSpacing:-.3 }}>{t.name}</div>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{t.full}</div>
          <div style={{ marginTop:5, display:'flex', gap:5, flexWrap:'wrap' }}>
            <ChainBadge chain={t.chain}/>
            {t.ageH != null && <span style={{ fontSize:10, color:'var(--text-muted)', background:'#f5f5f7', padding:'2px 7px', borderRadius:6 }}>{ageStr(t.ageH)}</span>}
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0, marginLeft:10 }}>
          <div style={{ fontSize:isTop?44:30, fontWeight:700, color:tr.color, lineHeight:1 }}>{sc}</div>
          <div style={{ fontSize:10, fontWeight:600, color:tr.color }}>{tr.label}</div>
          <div style={{ fontSize:13, fontWeight:600, marginTop:5 }}>{fmtPrice(t.price)}</div>
          <div style={{ fontSize:12, fontWeight:700, color:cc(t.ch.m5) }}>{pct(t.ch.m5)}<span style={{ fontSize:10, color:'var(--text-muted)', fontWeight:400 }}> 5m</span></div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:10 }}>
        {[{ l:'MCap', v:fmt(t.mcap) },{ l:'Liq.', v:fmt(t.liq) },{ l:'Vol 24h', v:fmt(t.vol.h24) }].map(r=>(
          <div key={r.l} style={{ background:'rgba(0,0,0,0.04)', borderRadius:8, padding:'5px 9px' }}>
            <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:600 }}>{r.l}</div>
            <div style={{ fontSize:12, fontWeight:700 }}>{r.v}</div>
          </div>
        ))}
      </div>

      {signals.length > 0 && (
        <div style={{ marginBottom:10 }}>
          {signals.map(s=><SigBar key={s.key} {...s}/>)}
        </div>
      )}

      {insights.length > 0 && isTop && (
        <div style={{ background:'rgba(0,0,0,0.03)', borderRadius:10, padding:'10px 12px', marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:5, textTransform:'uppercase', letterSpacing:.3 }}>Análise</div>
          {insights.map((ins,i)=>(
            <div key={i} style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5, marginBottom:3 }}>• {ins}</div>
          ))}
        </div>
      )}

      {risks.map((r,i) => (
        <div key={i} style={{ fontSize:11, padding:'5px 10px', borderRadius:8, marginBottom:4, border:`1px solid ${r.lvl==='danger'?'#ff3b3030':r.lvl==='warn'?'#ff950030':'#86868b30'}`, background:r.lvl==='danger'?'#fff0f0':r.lvl==='warn'?'#fff8ed':'#f5f5f7', color:r.lvl==='danger'?'#ff3b30':r.lvl==='warn'?'#ff9500':'#86868b' }}>
          {r.lvl==='danger'?'🚨':r.lvl==='warn'?'⚠️':'ℹ️'} {r.msg}
        </div>
      ))}

      <a href={t.url} target="_blank" rel="noopener noreferrer" className="btn-primary"
        style={{ display:'block', textAlign:'center', textDecoration:'none', fontSize:12, marginTop:10 }}>
        Ver no DexScreener
      </a>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function CryptoTab() {
  const [tokens, setTokens]     = useState(DEMOS);
  const [isDemo, setIsDemo]     = useState(true);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [query, setQuery]       = useState('');
  const [searchMode, setSM]     = useState(false);
  const [filterChain, setFC]    = useState('all');
  const [minScore, setMS]       = useState(0);
  const [sortKey, setSK]        = useState('score');
  const [sortDir, setSD]        = useState('desc');
  const [watchlist, setWL]      = useState(loadWL);
  const [countdown, setCD]      = useState(REFRESH_SEC);
  const timerRef = useRef(null);

  function process(raw) {
    return raw
      .map(p => ({ ...normalize(p), _analysis: null }))
      .map(t => ({ ...t, _analysis: calcScore(t) }))
      .filter(t => t.liq >= 2000 && (t.mcap > 0 || t.vol.h24 > 0))
      .sort((a,b) => b._analysis.score - a._analysis.score);
  }

  const fetchTrending = useCallback(async () => {
    setLoading(true); setError(''); setSM(false);
    try {
      const raw = await loadTrending();
      if (raw.length === 0) throw new Error('Sem dados do DexScreener.');
      setTokens(process(raw)); setIsDemo(false); setCD(REFRESH_SEC);
    } catch (e) {
      setError(e.message);
      setTokens(DEMOS); setIsDemo(true);
    }
    setLoading(false);
  }, []);

  async function handleSearch(e) {
    e?.preventDefault();
    if (!query.trim()) { fetchTrending(); return; }
    setLoading(true); setError(''); setSM(true);
    try {
      const raw = await searchTokens(query.trim());
      if (raw.length === 0) throw new Error(`Sem resultados para "${query}".`);
      setTokens(process(raw)); setIsDemo(false);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => { fetchTrending(); }, []);

  useEffect(() => {
    if (loading || searchMode || isDemo) return;
    timerRef.current = setInterval(() => {
      setCD(c => { if (c <= 1) { fetchTrending(); return REFRESH_SEC; } return c - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, searchMode, isDemo, fetchTrending]);

  function sort(k) {
    if (sortKey === k) setSD(d => d==='asc'?'desc':'asc');
    else { setSK(k); setSD('desc'); }
  }
  function toggleWL(t) {
    const inWL = watchlist.some(w => w.id === t.id);
    if (inWL) { const u = watchlist.filter(w=>w.id!==t.id); setWL(u); saveWL(u); }
    else {
      const e = { id:t.id, name:t.name, chain:t.chain, score:t._analysis.score, url:t.url, savedAt:new Date().toLocaleDateString('pt-PT') };
      const u = [e,...watchlist]; setWL(u); saveWL(u);
    }
  }

  const chains = ['all', ...new Set(tokens.map(t=>t.chain).filter(Boolean))];
  const wlIds  = new Set(watchlist.map(w=>w.id));
  const sortFn = { score:t=>t._analysis.score, ch5m:t=>t.ch.m5, ch1h:t=>t.ch.h1, vol:t=>t.vol.h24, mcap:t=>t.mcap, liq:t=>t.liq };
  const filtered = tokens
    .filter(t => filterChain==='all' || t.chain===filterChain)
    .filter(t => t._analysis.score >= minScore)
    .sort((a,b) => {
      const fn = sortFn[sortKey] || (t=>t._analysis.score);
      return sortDir==='desc' ? fn(b)-fn(a) : fn(a)-fn(b);
    });

  const top3 = filtered.slice(0, 3);
  const rest  = filtered.slice(3);

  return (
    <div style={{ display:'grid', gap:16 }}>

      {/* Controls */}
      <div className="card">
        <form onSubmit={handleSearch} style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
          <input className="input" style={{ flex:1, minWidth:220 }}
            placeholder="Símbolo, nome ou endereço de contrato..."
            value={query} onChange={e=>setQuery(e.target.value)}/>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="loader"/> : 'Pesquisar'}
          </button>
          <button type="button" className="btn-secondary" onClick={()=>{setQuery('');fetchTrending();}} disabled={loading}>
            Trending
          </button>
        </form>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)' }}>CHAIN</span>
          {chains.map(ch => {
            const info = CHAINS[ch];
            const active = filterChain===ch;
            return (
              <button key={ch} onClick={()=>setFC(ch)} style={{
                background: active ? (info?.c||'#1d1d1f') : 'transparent',
                border:`1px solid ${active?(info?.c||'#1d1d1f'):'var(--border-mid)'}`,
                color: active ? '#fff' : 'var(--text-secondary)',
                fontSize:11, fontWeight:600, padding:'4px 11px', borderRadius:980, cursor:'pointer',
              }}>{ch==='all'?'Todas':(CHAINS[ch]?.l||ch.toUpperCase())}</button>
            );
          })}
          <div style={{ flex:1 }}/>
          <span style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)' }}>SCORE MÍN.</span>
          {[0,30,50,65].map(s=>(
            <button key={s} onClick={()=>setMS(s)} style={{
              background:minScore===s?'#0071e3':'transparent', border:`1px solid ${minScore===s?'#0071e3':'var(--border-mid)'}`,
              color:minScore===s?'#fff':'var(--text-secondary)', fontSize:11,fontWeight:600,padding:'4px 11px',borderRadius:980,cursor:'pointer',
            }}>{s===0?'Todos':`${s}+`}</button>
          ))}
          {!loading && !searchMode && !isDemo && (
            <span style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}>
              Refresh em {countdown}s
              <button className="btn-secondary" style={{ padding:'3px 10px', fontSize:11 }} onClick={fetchTrending}>↻</button>
            </span>
          )}
        </div>

        {/* Error / CORS notice */}
        {(error || isDemo) && (
          <div style={{ marginTop:12, padding:'12px 14px', borderRadius:12, background: isDemo&&!error ? '#f5f5f7' : '#fff5f5', border:`1px solid ${isDemo&&!error?'var(--border-dim)':'#ff3b3025'}` }}>
            {error && <div style={{ color:'#ff3b30', fontWeight:600, fontSize:13, marginBottom:8 }}>{error}</div>}
            {isDemo && (
              <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.6 }}>
                {!error && <span style={{ fontWeight:600, color:'var(--text-primary)' }}>A mostrar dados de demonstração. </span>}
                Para dados em tempo real, serve a app via HTTP:
                <div style={{ marginTop:6, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div style={{ background:'#fff', borderRadius:8, padding:'8px 10px', border:'1px solid var(--border-dim)' }}>
                    <div style={{ fontSize:11, fontWeight:700, marginBottom:3 }}>Dev mode (recomendado)</div>
                    <code style={{ fontSize:11, color:'#0071e3' }}>cd market-intel && npm run dev</code>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>→ http://localhost:5173</div>
                  </div>
                  <div style={{ background:'#fff', borderRadius:8, padding:'8px 10px', border:'1px solid var(--border-dim)' }}>
                    <div style={{ fontSize:11, fontWeight:700, marginBottom:3 }}>Servidor standalone</div>
                    <code style={{ fontSize:11, color:'#0071e3' }}>node market-intel/server.js</code>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>→ http://localhost:3000</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top 3 hero cards */}
      {top3.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr', gap:12 }}>
          {top3.map((t,i) => <HeroCard key={t.id} t={t} rank={i}/>)}
        </div>
      )}

      {/* Full table (rest of results) */}
      {rest.length > 0 && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border-dim)' }}>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.4 }}>
              Restantes ({rest.length})
            </span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Chain</th><th>Token</th>
                  <th onClick={()=>sort('ch5m')} style={{ cursor:'pointer' }}>5m% {sortKey==='ch5m'&&<span style={{opacity:.4}}>{sortDir==='asc'?'↑':'↓'}</span>}</th>
                  <th onClick={()=>sort('ch1h')} style={{ cursor:'pointer' }}>1h% {sortKey==='ch1h'&&<span style={{opacity:.4}}>{sortDir==='asc'?'↑':'↓'}</span>}</th>
                  <th>24h%</th>
                  <th onClick={()=>sort('vol')} style={{ cursor:'pointer' }}>Vol 24h {sortKey==='vol'&&<span style={{opacity:.4}}>{sortDir==='asc'?'↑':'↓'}</span>}</th>
                  <th onClick={()=>sort('mcap')} style={{ cursor:'pointer' }}>MCap {sortKey==='mcap'&&<span style={{opacity:.4}}>{sortDir==='asc'?'↑':'↓'}</span>}</th>
                  <th onClick={()=>sort('liq')} style={{ cursor:'pointer' }}>Liq {sortKey==='liq'&&<span style={{opacity:.4}}>{sortDir==='asc'?'↑':'↓'}</span>}</th>
                  <th>Buys 5m</th>
                  <th onClick={()=>sort('score')} style={{ cursor:'pointer' }}>Score {sortKey==='score'&&<span style={{opacity:.4}}>{sortDir==='asc'?'↑':'↓'}</span>}</th>
                  <th style={{ width:80 }}></th>
                </tr>
              </thead>
              <tbody>
                {rest.map(t => {
                  const { score:sc, risks } = t._analysis;
                  const tr = tier(sc);
                  const tot = t.txn.buys5m + t.txn.sells5m;
                  const bp  = tot > 0 ? Math.round(t.txn.buys5m/tot*100) : null;
                  return (
                    <tr key={t.id} style={{ background:risks.some(r=>r.lvl==='danger')?'#fff8f8':undefined }}>
                      <td><ChainBadge chain={t.chain}/></td>
                      <td>
                        <div style={{ fontWeight:700, fontSize:13 }}>{t.name}</div>
                        {t.ageH!=null && <div style={{ fontSize:10, color:'var(--text-muted)' }}>{ageStr(t.ageH)}</div>}
                      </td>
                      <td style={{ fontWeight:700, color:cc(t.ch.m5) }}>{pct(t.ch.m5)}</td>
                      <td style={{ fontWeight:600, color:cc(t.ch.h1) }}>{pct(t.ch.h1)}</td>
                      <td style={{ color:cc(t.ch.h24) }}>{pct(t.ch.h24,0)}</td>
                      <td>{fmt(t.vol.h24)}</td>
                      <td>{fmt(t.mcap)}</td>
                      <td style={{ color:t.liq<10000?'#ff3b30':undefined }}>{fmt(t.liq)}</td>
                      <td>
                        {bp!=null ? (
                          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                            <div style={{ width:36 }} className="bar-track"><div className="bar-fill" style={{ width:`${bp}%`, background:bp>65?'#34c759':bp>50?'#ff9500':'#ff3b30' }}/></div>
                            <span style={{ fontSize:11 }}>{bp}%</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        <span style={{ fontWeight:700, color:tr.color, fontSize:15 }}>{sc} </span>
                        <span style={{ fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:980, background:tr.color+'18', color:tr.color }}>{tr.label}</span>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:5 }}>
                          <a href={t.url} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize:11, padding:'3px 8px', borderRadius:980, border:'1px solid var(--border-mid)', color:'var(--blue-accent)', textDecoration:'none' }}>DEX</a>
                          <button onClick={()=>toggleWL(t)} style={{
                            fontSize:13, padding:'1px 8px', borderRadius:980, cursor:'pointer',
                            border:wlIds.has(t.id)?'1px solid #34c759':'1px solid var(--border-mid)',
                            background:wlIds.has(t.id)?'#34c75918':'transparent',
                            color:wlIds.has(t.id)?'#248a3d':'var(--text-muted)',
                          }}>{wlIds.has(t.id)?'★':'☆'}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Watchlist */}
      {watchlist.length > 0 && (
        <div className="card">
          <div className="section-title">Watchlist ({watchlist.length})</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {watchlist.map(w => {
              const tr = tier(w.score);
              return (
                <div key={w.id} style={{ padding:'10px 14px', borderRadius:12, border:'1px solid var(--border-dim)', display:'flex', alignItems:'center', gap:12 }}>
                  <div><div style={{ fontWeight:700 }}>{w.name}</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>{CHAINS[w.chain]?.l||w.chain}</div></div>
                  <div style={{ fontWeight:700, fontSize:18, color:tr.color }}>{w.score}</div>
                  <div style={{ display:'flex', gap:6 }}>
                    <a href={w.url} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, padding:'3px 9px', borderRadius:980, border:'1px solid var(--border-mid)', color:'var(--blue-accent)', textDecoration:'none' }}>DEX</a>
                    <button onClick={()=>{ const u=watchlist.filter(x=>x.id!==w.id); setWL(u); saveWL(u); }} style={{ fontSize:11, padding:'3px 9px', borderRadius:980, cursor:'pointer', border:'1px solid var(--border-mid)', background:'transparent', color:'var(--red)' }}>×</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Score methodology */}
      <div className="card" style={{ background:'#f5f5f7', padding:'14px 18px' }}>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:.4 }}>Metodologia do Score (100 pts)</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))', gap:5 }}>
          {[
            { l:'Momentum 5m',          max:25, c:'#ff3b30', d:'Subida de preço nos últimos 5min — o sinal mais imediato de pump' },
            { l:'Vol/MCap 24h',         max:20, c:'#ff9500', d:'Volume 24h relativo ao market cap. >100% = token muito activo' },
            { l:'Pressão compradora 5m',max:20, c:'#34c759', d:'% de transacções de compra. >75% = acumulação forte e coordenada' },
            { l:'Aceleração de volume', max:15, c:'#5856d6', d:'Vol 1h vs média das 6h. ×5 ou mais = surge de interesse agora' },
            { l:'MCap sweet spot',      max:12, c:'#0071e3', d:'<$200K = micro cap. Qualquer volume de compra move muito o preço' },
            { l:'Frescura do token',    max:8,  c:'#af52de', d:'Token <24h tem mais potencial de descoberta e primeiro pump' },
          ].map(r=>(
            <div key={r.l} style={{ display:'flex', gap:6, fontSize:12, alignItems:'flex-start' }}>
              <span style={{ width:8,height:8,borderRadius:'50%',background:r.c,display:'inline-block',flexShrink:0,marginTop:4 }}/>
              <div><span style={{ fontWeight:600 }}>{r.l}</span><span style={{ color:'var(--text-muted)' }}> ({r.max}pts)</span> — <span style={{ color:'var(--text-secondary)' }}>{r.d}</span></div>
            </div>
          ))}
        </div>
        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:10, lineHeight:1.5 }}>
          Dados via DexScreener (trending + boosts + pesquisa). Auto-refresh 60s. Meme coins têm risco de perda total — usa stop-loss e nunca aloques mais do que podes perder.
        </div>
      </div>
    </div>
  );
}
