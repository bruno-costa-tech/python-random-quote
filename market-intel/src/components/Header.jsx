export default function Header() {
  return (
    <header style={{
      borderBottom: '0.5px solid var(--border-dim)',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--bg-secondary)',
    }}>
      <span style={{
        fontSize: 13,
        letterSpacing: 4,
        color: 'var(--text-secondary)',
        fontWeight: 'normal',
      }}>
        ◈ MARKET INTELLIGENCE
      </span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2 }}>
        BRUNO COSTA · DUBAI
      </span>
    </header>
  );
}
