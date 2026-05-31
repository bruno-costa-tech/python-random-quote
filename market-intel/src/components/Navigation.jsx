const TABS = [
  { id: 'dashboard', label: 'DASHBOARD' },
  { id: 'detector',  label: 'DETECTOR' },
  { id: 'portfolio', label: 'PORTFÓLIO' },
];

export default function Navigation({ active, onChange }) {
  return (
    <nav style={{
      display: 'flex',
      gap: 2,
      padding: '10px 20px',
      borderBottom: '0.5px solid var(--border-dim)',
      background: 'var(--bg-secondary)',
    }}>
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            background: active === t.id ? 'var(--blue-dim)' : 'transparent',
            border: active === t.id
              ? '0.5px solid var(--blue-accent)'
              : '0.5px solid transparent',
            color: active === t.id ? '#9999ff' : 'var(--text-muted)',
            fontFamily: 'Courier New, monospace',
            fontSize: 10,
            letterSpacing: 2,
            padding: '6px 14px',
            borderRadius: 3,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
