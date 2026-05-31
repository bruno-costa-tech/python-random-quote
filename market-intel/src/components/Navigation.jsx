const TABS = [
  { id: 'detector',  label: 'Detector' },
  { id: 'ipo',       label: 'IPO' },
  { id: 'portfolio', label: 'Portfólio' },
];

export default function Navigation({ active, onChange }) {
  return (
    <nav style={{ display: 'flex', gap: 2 }}>
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            background: active === t.id ? '#f5f5f7' : 'transparent',
            border: 'none',
            color: active === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
            fontFamily: 'var(--font-sans)',
            fontSize: 14, fontWeight: active === t.id ? 600 : 400,
            padding: '7px 16px', borderRadius: 980,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
