import { useState } from 'react';
import Navigation from './components/Navigation.jsx';
import DetectorTab from './components/detector/DetectorTab.jsx';
import IpoTab from './components/ipo/IpoTab.jsx';
import PortfolioSummary from './components/portfolio/PortfolioSummary.jsx';
import AssetList from './components/portfolio/AssetList.jsx';
import Projections from './components/portfolio/Projections.jsx';

const DEFAULT_PORTFOLIO = [
  { name: 'Dinheiro Active Saver',  value: '3441',  expectedReturn: '1.0',  notes: 'Fundo de emergência' },
  { name: 'Certificados de Aforro', value: '16137', expectedReturn: '3.0',  notes: 'Baixo risco, garantido' },
  { name: 'PPR Real Vida',          value: '8600',  expectedReturn: '1.5',  notes: 'Considerar PPR indexado' },
  { name: 'ETF IWDA MSCI World',    value: '17000', expectedReturn: '9.0',  notes: 'Motor de crescimento' },
  { name: 'XTB ETF Plan',          value: '705',   expectedReturn: '5.0',  notes: 'Crescer aportes' },
  { name: 'Criptomoedas BTC+ETH',  value: '3600',  expectedReturn: '10.0', notes: 'Manter ≤10% portfólio' },
];

export default function App() {
  const [tab, setTab] = useState('detector');
  const [assets, setAssets] = useState(DEFAULT_PORTFOLIO);
  const [monthlyContrib, setMonthlyContrib] = useState('4381');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border-dim)',
        padding: '14px 22px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3, color: 'var(--text-primary)' }}>
          Market Intelligence
        </span>
        <Navigation active={tab} onChange={setTab} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
          Bruno Costa · Dubai
        </span>
      </header>

      <main style={{ flex: 1, padding: '20px', maxWidth: 1040, width: '100%', margin: '0 auto' }}>
        {tab === 'detector'  && <DetectorTab />}
        {tab === 'ipo'       && <IpoTab />}
        {tab === 'portfolio' && (
          <div style={{ display: 'grid', gap: 16 }}>
            <PortfolioSummary assets={assets} monthlyContrib={monthlyContrib} />
            <AssetList assets={assets} onChange={setAssets} />
            <Projections assets={assets} monthlyContrib={monthlyContrib} onMonthlyContribChange={setMonthlyContrib} />
          </div>
        )}
      </main>

      <footer style={{
        borderTop: '1px solid var(--border-dim)',
        padding: '10px 22px', fontSize: 11,
        color: 'var(--text-muted)', display: 'flex',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 4,
      }}>
        <span>Market Intelligence v2.0</span>
        <span>Não é aconselhamento financeiro · Uso pessoal</span>
      </footer>
    </div>
  );
}
