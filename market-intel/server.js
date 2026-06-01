/**
 * Market Intelligence — servidor local com proxy de API
 * Usa: node server.js
 * Abre: http://localhost:3000
 */
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const { URL } = require('url');

const PORT     = 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const HTML_FIL = path.join(DIST_DIR, 'index.html');

const ALLOWED_HOSTS = [
  'api.geckoterminal.com',
  'api.dexscreener.com',
  'api.coingecko.com',
];

function proxyFetch(targetUrl) {
  return new Promise((resolve, reject) => {
    let parsed;
    try { parsed = new URL(targetUrl); } catch { return reject(new Error('URL inválida')); }
    if (!ALLOWED_HOSTS.includes(parsed.hostname)) return reject(new Error(`Host não permitido: ${parsed.hostname}`));
    const mod = parsed.protocol === 'https:' ? https : http;
    const req = mod.get(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; MarketIntel/2.0)',
      }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.setTimeout(12000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const reqUrl = new URL(req.url, `http://localhost:${PORT}`);

  // /api/proxy?url=<encoded>  — proxies API calls server-side
  if (reqUrl.pathname === '/api/proxy') {
    const target = decodeURIComponent(reqUrl.searchParams.get('url') || '');
    if (!target) { res.writeHead(400); res.end('{"error":"url param required"}'); return; }
    try {
      const { status, body } = await proxyFetch(target);
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(body);
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Static files from dist/
  let filePath = path.join(DIST_DIR, reqUrl.pathname === '/' ? 'index.html' : reqUrl.pathname);
  if (!filePath.startsWith(DIST_DIR)) { res.writeHead(403); res.end(); return; }
  if (!fs.existsSync(filePath)) filePath = HTML_FIL; // SPA fallback

  const ext = path.extname(filePath);
  const mime = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css' }[ext] || 'application/octet-stream';
  try {
    res.writeHead(200, { 'Content-Type': mime + '; charset=utf-8' });
    fs.createReadStream(filePath).pipe(res);
  } catch { res.writeHead(404); res.end(); }
});

server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   Market Intelligence  →  http://localhost:' + PORT + '   ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  console.log('  Proxy API activo (DexScreener + GeckoTerminal)');
  console.log('  Ctrl+C para parar\n');
});
