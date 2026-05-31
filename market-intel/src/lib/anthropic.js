const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

export async function callClaude({ prompt, useWebSearch = false, maxTokens = 1500 }) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  };

  if (useWebSearch) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
  }

  const headers = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
  if (apiKey) headers['x-api-key'] = apiKey;

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erro API (${res.status}): ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  return text;
}

export async function fetchWithWebSearch(prompt, maxTokens = 2000) {
  return callClaude({ prompt, useWebSearch: true, maxTokens });
}

export function parseJSON(text) {
  // Strip markdown code fences if present
  const stripped = text.replace(/```[\w]*\n?/g, '').trim();
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Resposta sem JSON válido');
  return JSON.parse(match[0]);
}
