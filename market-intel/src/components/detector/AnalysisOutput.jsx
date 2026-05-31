import { useState } from 'react';
import { callClaude } from '../../lib/anthropic.js';
import { calcScore } from '../../lib/scoring.js';

function buildPrompt(ticker, fields) {
  const { score, signals } = calcScore(fields);
  return `
És um trader especialista em micro caps e momentum stocks.

TICKER: ${ticker}
SCORE: ${score}/100
SINAIS: ${signals.map(s => `${s.label} (+${s.pts}pts)`).join(', ') || 'nenhum'}

DADOS:
Float: ${fields.float || 'n/d'}M acções
Short Float: ${fields.short || 'n/d'}%
Days to Cover: ${fields.dtc || 'n/d'} dias
Relative Volume: ${fields.relvol || 'n/d'}x
Premarket Volume: ${fields.premkt || 'n/d'}M
Inst. Ownership: ${fields.inst || 'n/d'}%
Market Cap: $${fields.mcap || 'n/d'}M
Preço: $${fields.price || 'n/d'}
Catalisador: ${fields.catalyst || 'none'}

Responde em português (PT), directo, sem emojis:

1. DIAGNÓSTICO
[2 frases sobre o setup]

2. TIPO DE MOVIMENTO
[squeeze, news catalyst, combinação? Explica qual é o driver principal]

3. RISCO PRINCIPAL
[O que pode correr mal? Ser específico]

4. ENTRADA / STOP
[Condições concretas de entrada e nível de stop loss]

5. PROBABILIDADE REAL
[% honesta com justificação de 2 linhas]
`.trim();
}

export default function AnalysisOutput({ ticker, fields }) {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { score } = calcScore(fields);
  const hasRequiredFields = fields.float && fields.short && fields.dtc && fields.relvol && fields.inst;

  async function handleAnalyse() {
    if (!ticker || !hasRequiredFields) return;
    setLoading(true);
    setError('');
    setAnalysis('');
    try {
      const result = await callClaude({ prompt: buildPrompt(ticker, fields), maxTokens: 1200 });
      setAnalysis(result.trim());
    } catch (e) {
      setError(`Erro na análise: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <button
          className="btn-primary"
          onClick={handleAnalyse}
          disabled={loading || !ticker || !hasRequiredFields}
        >
          {loading
            ? <><span className="loader" style={{ marginRight: 8 }} />A analisar...</>
            : 'Análise Completa'
          }
        </button>
        {!ticker && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 12 }}>
            Busca dados de um ticker primeiro.
          </span>
        )}
        {ticker && !hasRequiredFields && (
          <span style={{ fontSize: 10, color: 'var(--amber)', marginLeft: 12 }}>
            Preenche todos os campos obrigatórios (*).
          </span>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {analysis && (
        <div className="card">
          <div className="section-title">Análise IA — {ticker}</div>
          <div className="output-block">{analysis}</div>
        </div>
      )}
    </div>
  );
}
