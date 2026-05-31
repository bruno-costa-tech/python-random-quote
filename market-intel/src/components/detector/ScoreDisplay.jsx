import { calcScore, scoreTier } from '../../lib/scoring.js';

export default function ScoreDisplay({ ticker, fields }) {
  const { score, signals } = calcScore(fields);
  const tier = scoreTier(score);

  const barColor = tier.color;

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="section-title">Score de Explosão</div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: 44, color: tier.color, lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 4 }}>/100</span>
        </div>
        <div>
          {ticker && (
            <div style={{ fontSize: 16, color: 'var(--text-secondary)', letterSpacing: 3, marginBottom: 4 }}>
              {ticker}
            </div>
          )}
          <div style={{
            fontSize: 10,
            letterSpacing: 2,
            padding: '3px 8px',
            border: `0.5px solid ${tier.color}`,
            color: tier.color,
            borderRadius: 3,
            display: 'inline-block',
          }}>
            {tier.label}
          </div>
        </div>
      </div>

      <div className="bar-track" style={{ marginBottom: 14 }}>
        <div
          className="bar-fill"
          style={{ width: `${score}%`, background: barColor }}
        />
      </div>

      {signals.length > 0 ? (
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 8 }}>
            SINAIS ACTIVOS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {signals.map((s, i) => (
              <span key={i} style={{
                fontSize: 10,
                padding: '3px 8px',
                background: 'var(--bg-secondary)',
                border: '0.5px solid var(--border-dim)',
                borderRadius: 3,
                color: 'var(--text-secondary)',
                letterSpacing: 0.5,
              }}>
                {s.label}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          Preenche os campos obrigatórios para calcular o score.
        </div>
      )}
    </div>
  );
}
