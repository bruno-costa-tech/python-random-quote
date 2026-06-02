import { useState } from 'react';
import { fetchWithWebSearch, callClaude } from '../../lib/anthropic.js';
import { parseJSON } from '../../lib/anthropic.js';

const PRICE_FETCH_PROMPT = `
Pesquisa os preços actuais de mercado (data de hoje) para os seguintes activos:
- IWDA.AS (iShares Core MSCI World UCITS ETF em EUR, cotado na Euronext Amsterdam)
- BTC-EUR (Bitcoin em euros)
- ETH-EUR (Ethereum em euros)
- XRP-USD (Ripple em dólares)
- SOL-USD (Solana em dólares)
- SUI-USD (Sui em dólares)
- CPMC / IE00BDD48R67 (Global Copper Miners UCITS ETF)
- URNM / URA (Uranium ETF)
- AGUA / IE00BMP3HG27 (Global Water UCITS ETF)
- RBOT / IE00BMW3QX54 (Automation & Robotics UCITS ETF)
- EXXY / IE00B4WPHX27 (Diversified Commodity Swap UCITS ETF)
- IEUR / IE00B4K48X80 (Core MSCI Europe UCITS ETF)

Devolve APENAS JSON válido sem markdown nem texto extra:
{
  "iwda": "123.45",
  "iwda_chg": 0.23,
  "btc": "67500",
  "btc_chg": -1.2,
  "eth": "1840",
  "eth_chg": -0.5,
  "xrp": "1.34",
  "xrp_chg": 0.8,
  "sol": "85.94",
  "sol_chg": 1.1,
  "sui": "1.04",
  "sui_chg": -0.3,
  "copper": "12.45",
  "copper_chg": 0.5,
  "uranium": "23.10",
  "uranium_chg": -0.2,
  "water": "45.67",
  "water_chg": 0.1,
  "robot": "34.56",
  "robot_chg": 1.3,
  "commodity": "18.90",
  "commodity_chg": -0.4,
  "europe": "67.89",
  "europe_chg": 0.6,
  "updatedAt": "timestamp ISO"
}

Se um preço não estiver disponível usa null.
`;

function buildBriefingPrompt(indicators, prices) {
  const priceStr = Object.entries(prices)
    .filter(([k]) => !k.endsWith('_chg') && k !== 'updatedAt')
    .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
    .join(' | ');

  return `
És um analista financeiro sénior. O utilizador é português residente em Dubai.
Portfólio actual: IWDA 35%, Certificados Aforro PT 33%, PPR 18%, Crypto BTC+ETH 7%, Cash 7%.
XTB satélite (10% total): Copper Miners 41%, Uranium 25%, Automation & Robotics 10%, Global Water 5%, Diversified Commodity 9%, Core MSCI Europe 9%.
Objectivo primário: acumular 400-600k AED para entrada em imóvel em Dubai nos próximos 0-24 meses.
Poupança mensal: ~18.934 AED (~4.381€).

INDICADORES MACRO ACTUAIS:
US 10Y Yield: ${indicators.yield10y || 'n/d'}%
DXY: ${indicators.dxy || 'n/d'}
Fear & Greed: ${indicators.feargreed || 'n/d'}/100
BTC ETF Flows: ${indicators.btcflows || 'n/d'} $M
EUR/USD: ${indicators.eurusd || 'n/d'}

PREÇOS ACTUAIS:
${priceStr || 'n/d'}

Gera um briefing diário COMPLETO em português (PT, não BR), directo, sem emojis, sem markdown especial.
Usa apenas texto simples com numeração e traços para estrutura:

1. DIAGNÓSTICO DE MERCADO
[2-3 frases sobre o estado macro actual]

2. IMPACTO NO PORTFÓLIO
IWDA: [análise]
BTC/ETH: [análise]
XTB Satélite: [análise — foco nos activos com maior exposição: Copper, Uranium]

3. SINAL MACRO DOMINANTE
[O factor mais importante a vigiar hoje]

4. O QUE VIGIAR ESTA SEMANA
- [item 1]
- [item 2]
- [item 3]

5. TABELA RESUMO
Activo | Preço | Var% | Sinal
IWDA | ... | ... | COMPRAR/MANTER/REDUZIR
BTC | ... | ... | COMPRAR/MANTER/REDUZIR
ETH | ... | ... | COMPRAR/MANTER/REDUZIR
XRP | ... | ... | VIGIAR/NEUTRO
SOL | ... | ... | VIGIAR/NEUTRO
SUI | ... | ... | VIGIAR/NEUTRO
`.trim();
}

export default function DailyBriefing({ indicators, prices, onPricesUpdate, loadingPrices }) {
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRefreshPrices() {
    onPricesUpdate(null, true); // set loading
    try {
      const raw = await fetchWithWebSearch(PRICE_FETCH_PROMPT, 1500);
      const data = parseJSON(raw);
      data.updatedAt = new Date().toLocaleString('pt-PT');
      onPricesUpdate(data, false);
    } catch (e) {
      onPricesUpdate(null, false, `Erro ao actualizar preços: ${e.message}`);
    }
  }

  async function handleBriefing() {
    setLoading(true);
    setError('');
    setBriefing('');
    try {
      const prompt = buildBriefingPrompt(indicators, prices);
      const result = await callClaude({ prompt, maxTokens: 2000 });
      setBriefing(result.trim());
    } catch (e) {
      setError(`Erro ao gerar briefing: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={handleRefreshPrices} disabled={loadingPrices}>
          {loadingPrices ? <><span className="loader" style={{ marginRight: 8 }} />A buscar preços...</> : 'Actualizar Preços'}
        </button>
        <button className="btn-primary" onClick={handleBriefing} disabled={loading}>
          {loading ? <><span className="loader" style={{ marginRight: 8 }} />A gerar...</> : 'Gerar Briefing'}
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {briefing && (
        <div className="card">
          <div className="section-title">Briefing Diário</div>
          <div className="output-block">{briefing}</div>
        </div>
      )}

      {!briefing && !loading && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, marginTop: 8 }}>
          Preenche os indicadores macro e clica "Gerar Briefing" para análise personalizada.
        </div>
      )}
    </div>
  );
}
