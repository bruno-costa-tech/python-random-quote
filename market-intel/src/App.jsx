import { useState } from 'react';
import Navigation from './components/Navigation.jsx';
import DetectorTab from './components/detector/DetectorTab.jsx';
import IpoTab from './components/ipo/IpoTab.jsx';
import CryptoTab from './components/crypto/CryptoTab.jsx';

export default function App() {
  const [tab, setTab] = useState('detector');

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <header style={{
        borderBottom:'1px solid var(--border-dim)',
        padding:'14px 22px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'rgba(255,255,255,0.85)',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
        position:'sticky', top:0, zIndex:100,
      }}>
        <span style={{ fontSize:17, fontWeight:600, letterSpacing:-.3, color:'var(--text-primary)' }}>
          Market Intelligence
        </span>
        <Navigation active={tab} onChange={setTab} />
        <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:500 }}>
          Bruno Costa · Dubai
        </span>
      </header>

      <main style={{ flex:1, padding:'20px', maxWidth:1080, width:'100%', margin:'0 auto' }}>
        {tab === 'detector' && <DetectorTab />}
        {tab === 'ipo'      && <IpoTab />}
        {tab === 'crypto'   && <CryptoTab />}
      </main>

      <footer style={{
        borderTop:'1px solid var(--border-dim)', padding:'10px 22px',
        fontSize:11, color:'var(--text-muted)',
        display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:4,
      }}>
        <span>Market Intelligence v2.1</span>
        <span>Não é aconselhamento financeiro · Uso pessoal</span>
      </footer>
    </div>
  );
}
