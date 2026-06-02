// Post-build: produce a single .html that works via double-click (file://).
// Vite's single-file output puts a `<script type="module">` in <head>.
// On file:// Chrome blocks module scripts (CORS), and even as a plain script
// it would run before #root exists. So we strip type="module" and relocate
// the script to just before </body>, after the #root div.
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'dist/index.html';
const OUT = 'market-intelligence.html';

let html = readFileSync(SRC, 'utf8');

// Extract the inlined module script (the big bundle).
const scriptRe = /<script type="module"[^>]*>([\s\S]*?)<\/script>/;
const match = html.match(scriptRe);
if (!match) throw new Error('Inlined module script not found in build output.');

const scriptBody = match[1];

// Remove it from its original (head) position.
html = html.replace(scriptRe, '');

// Re-insert as a plain script right before </body>, so #root already exists.
// Use a function replacer so `$` sequences in the minified bundle aren't
// treated as special replacement patterns.
const injected = `  <script>\n${scriptBody}\n  </script>\n</body>`;
html = html.replace('</body>', () => injected);

writeFileSync(OUT, html);
console.log(`Wrote ${OUT} (${(html.length / 1024).toFixed(1)} kB)`);
