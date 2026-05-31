import { useState } from 'react';
import Header from './components/Header.jsx';
import Navigation from './components/Navigation.jsx';

import PriceBar from './components/dashboard/PriceBar.jsx';
import MarketSignals from './components/dashboard/MarketSignals.jsx';
import DailyBriefing from './components/dashboard/DailyBriefing.jsx';

import TickerSearch from './components/detector/TickerSearch.jsx';
import ScoreDisplay from './components/detector/ScoreDisplay.jsx';
import AnalysisOutput from './components/detector/AnalysisOutput.jsx';

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

const EMPTY_FIELDS = {
  price: '', mcap: '', float: '', short: '',
  dtc: '', relvol: '', premkt: '', inst: '', catalyst: 'none',
};

export default function App() {
  const [tab, setTab] = useState('dashboard');

  // Dashboard state
  const [indicators, setIndicators] = useState({
    yield10y: '', dxy: '', feargreed: '', btcflows: '', eurusd: '',
  });
  const [prices, setPrices] = useState({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Detector state
  const [detectorTicker, setDetectorTicker] = useState('');
  const [detectorFields, setDetectorFields] = useState(EMPTY_FIELDS);

  // Portfolio state
  const [assets, setAssets] = useState(DEFAULT_PORTFOLIO);
  const [monthlyContrib, setMonthlyContrib] = useState('4381');

  function handleIndicatorChange(key, val) {
    setIndicators(prev => ({ ...prev, [key]: val }));
  }

  function handlePricesUpdate(data, isLoading) {
    setLoadingPrices(isLoading);
    if (data) setPrices(data);
  }

  function handleDetectorFetched(ticker, mapped) {
    setDetectorTicker(ticker);
    setDetectorFields(mapped);
  }

  function handleDetectorFieldChange(key, val) {
    setDetectorFields(prev => ({ ...prev, [key]: val }));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Navigation active={tab} onChange={setTab} />

      <main style={{ flex: 1, padding: '16px 20px', maxWidth: 960, width: '100%', margin: '0 auto' }}>

        {tab === 'dashboard' && (
          <div>
            <PriceBar
              prices={prices}
              loading={loadingPrices}
              onRefresh={() => {}}
            />
            <MarketSignals values={indicators} onChange={handleIndicatorChange} />
            <DailyBriefing
              indicators={indicators}
              prices={prices}
              onPricesUpdate={handlePricesUpdate}
              loadingPrices={loadingPrices}
            />
          </div>
        )}

        {tab === 'detector' && (
          <div>
            <TickerSearch
              fields={detectorFields}
              onFieldChange={handleDetectorFieldChange}
              onFetched={handleDetectorFetched}
            />
            <ScoreDisplay ticker={detectorTicker} fields={detectorFields} />
            <AnalysisOutput ticker={detectorTicker} fields={detectorFields} />
          </div>
        )}

        {tab === 'portfolio' && (
          <div>
            <PortfolioSummary assets={assets} monthlyContrib={monthlyContrib} />
            <AssetList assets={assets} onChange={setAssets} />
            <Projections
              assets={assets}
              monthlyContrib={monthlyContrib}
              onMonthlyContribChange={setMonthlyContrib}
            />
          </div>
        )}

      </main>

      <footer style={{
        borderTop: '0.5px solid var(--border-dim)',
        padding: '8px 20px',
        fontSize: 9,
        color: 'var(--text-muted)',
        letterSpacing: 2,
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 4,
      }}>
        <span>MARKET INTELLIGENCE v1.0</span>
        <span>Não é aconselhamento financeiro · Uso pessoal</span>
      </footer>
    </div>
  );
}
