export default function Header({ hasKey, onOpenKeyModal }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-dim)',
      padding: '16px 22px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(255,255,255,0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <span style={{
        fontSize: 17,
        letterSpacing: -0.3,
        color: 'var(--text-primary)',
        fontWeight: 600,
      }}>
        ◈ Market Intelligence
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          className="btn-secondary"
          onClick={onOpenKeyModal}
          style={{ display: 'flex', alignItems: 'center', gap: 7 }}
        >
          <span className={`dot ${hasKey ? 'dot-green' : 'dot-gray'}`} />
          API Key
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
          Bruno Costa · Dubai
        </span>
      </div>
    </header>
  );
}
