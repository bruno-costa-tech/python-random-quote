export default function PortfolioSummary({ assets, monthlyContrib }) {
  const totalValue = assets.reduce((s, a) => s + (parseFloat(a.value) || 0), 0);
  const weightedReturn = assets.reduce((s, a) => {
    const v = parseFloat(a.value) || 0;
    const r = parseFloat(a.expectedReturn) || 0;
    return s + (v / totalValue) * r;
  }, 0);
  const annualReturn = totalValue * (weightedReturn / 100);
  const monthlyReturn = annualReturn / 12;

  const items = [
    { label: 'Total Portfólio',    value: `€${totalValue.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}` },
    { label: 'Retorno Ponderado',  value: `${weightedReturn.toFixed(2)}%` },
    { label: 'Retorno Anual Est.', value: `€${annualReturn.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}` },
    { label: 'Retorno Mensal Est.',value: `€${monthlyReturn.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}` },
    { label: 'Aporte Mensal',      value: `€${(parseFloat(monthlyContrib) || 0).toLocaleString('pt-PT', { maximumFractionDigits: 0 })}` },
  ];

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="section-title">Resumo</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
        {items.map(item => (
          <div key={item.label}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 4 }}>
              {item.label.toUpperCase()}
            </div>
            <div style={{ fontSize: 20, color: 'var(--text-primary)' }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
