const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'detector',  label: 'Detector' },
  { id: 'portfolio', label: 'Portfólio' },
];

export default function Navigation({ active, onChange }) {
  return (
    <nav style={{
      display: 'flex',
      gap: 4,
      padding: '12px 22px',
      borderBottom: '1px solid var(--border-dim)',
      background: 'var(--bg-secondary)',
    }}>
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            background: active === t.id ? 'var(--blue-accent)' : 'transparent',
            border: 'none',
            color: active === t.id ? '#ffffff' : 'var(--text-secondary)',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: 0,
            padding: '7px 16px',
            borderRadius: 980,
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
