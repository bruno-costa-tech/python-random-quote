import { useState } from 'react';

export default function ApiKeyModal({ currentKey, onSave, onClose }) {
  const [key, setKey] = useState(currentKey || '');

  const valid = key.startsWith('sk-ant-');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, letterSpacing: -0.4 }}>
          Anthropic API Key
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
          Introduz a tua chave para activar a análise IA, a pesquisa de preços
          em tempo real e o detector de stocks. A chave é guardada apenas
          localmente no teu browser (localStorage) — nunca sai do teu dispositivo.
        </p>

        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>
          API Key
        </label>
        <input
          type="password"
          className="input"
          placeholder="sk-ant-api03-..."
          value={key}
          onChange={e => setKey(e.target.value.trim())}
          onKeyDown={e => e.key === 'Enter' && valid && onSave(key)}
          autoFocus
          style={{ marginBottom: 8 }}
        />
        {key && !valid && (
          <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>
            A chave deve começar por "sk-ant-".
          </div>
        )}
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 22 }}>
          Obtém a tua chave em{' '}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--blue-accent)', textDecoration: 'none' }}
          >
            console.anthropic.com
          </a>
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
          {currentKey && (
            <button
              className="btn-secondary"
              style={{ color: 'var(--red)', borderColor: 'var(--border-mid)', marginRight: 'auto' }}
              onClick={() => onSave('')}
            >
              Remover chave
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={() => onSave(key)} disabled={!valid}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
