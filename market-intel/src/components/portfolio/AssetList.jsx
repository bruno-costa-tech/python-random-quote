export default function AssetList({ assets, onChange }) {
  const totalValue = assets.reduce((s, a) => s + (parseFloat(a.value) || 0), 0);

  function handleChange(idx, field, val) {
    const updated = assets.map((a, i) => i === idx ? { ...a, [field]: val } : a);
    onChange(updated);
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="section-title">Activos</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Activo</th>
              <th>Valor (€)</th>
              <th>% Portfólio</th>
              <th>Retorno Esp. (%)</th>
              <th>Retorno Anual (€)</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a, idx) => {
              const val = parseFloat(a.value) || 0;
              const ret = parseFloat(a.expectedReturn) || 0;
              const pct = totalValue > 0 ? (val / totalValue * 100).toFixed(1) : '0.0';
              const annualRet = val * (ret / 100);
              return (
                <tr key={idx}>
                  <td>
                    <input
                      className="input"
                      value={a.name}
                      onChange={e => handleChange(idx, 'name', e.target.value)}
                      style={{ fontSize: 11, minWidth: 140 }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input"
                      value={a.value}
                      onChange={e => handleChange(idx, 'value', e.target.value)}
                      style={{ width: 90 }}
                    />
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{pct}%</span>
                  </td>
                  <td>
                    <input
                      type="number"
                      className="input"
                      value={a.expectedReturn}
                      onChange={e => handleChange(idx, 'expectedReturn', e.target.value)}
                      step="0.1"
                      style={{ width: 70 }}
                    />
                  </td>
                  <td>
                    <span style={{
                      color: annualRet > 0 ? 'var(--green-bright)' : 'var(--text-muted)',
                      fontSize: 12,
                    }}>
                      €{annualRet.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}
                    </span>
                  </td>
                  <td>
                    <input
                      className="input"
                      value={a.notes || ''}
                      onChange={e => handleChange(idx, 'notes', e.target.value)}
                      style={{ fontSize: 11, minWidth: 160, color: 'var(--text-muted)' }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ color: 'var(--text-secondary)', fontSize: 11, paddingTop: 10 }}>
                TOTAL
              </td>
              <td style={{ color: 'var(--text-primary)', fontSize: 13, paddingTop: 10 }}>
                €{totalValue.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}
              </td>
              <td style={{ color: 'var(--text-secondary)', fontSize: 11, paddingTop: 10 }}>100%</td>
              <td></td>
              <td style={{ color: 'var(--green-bright)', fontSize: 13, paddingTop: 10 }}>
                €{assets.reduce((s, a) => s + (parseFloat(a.value) || 0) * ((parseFloat(a.expectedReturn) || 0) / 100), 0)
                  .toLocaleString('pt-PT', { maximumFractionDigits: 0 })}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
