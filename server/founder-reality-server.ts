/**
 * DevPulse V2 Phase 10.3 — Founder Reality Surface HTTP server.
 * Serves static visibility surface only. No execution, no file writes, no command endpoints.
 */

import { readFileSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildFounderRealityManifest,
  FOUNDER_REALITY_HOST,
  FOUNDER_REALITY_PORT,
  FOUNDER_REALITY_URL,
} from './founder-reality-manifest.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT_DIR, 'public', 'founder-reality');
const PACKAGE_JSON_PATH = join(ROOT_DIR, 'package.json');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function loadValidatorScripts(): string[] {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')) as { scripts?: Record<string, string> };
  return Object.keys(pkg.scripts ?? {})
    .filter((key) => key.startsWith('validate:'))
    .sort();
}

const MANIFEST = buildFounderRealityManifest(loadValidatorScripts());
const MANIFEST_JSON = JSON.stringify(MANIFEST, null, 2);

function sendJson(res: ServerResponse, status: number, body: string): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'founder-reality',
    'X-DevPulse-Phase': '10.3.1',
    'X-DevPulse-Shell': 'command-center-runtime',
  });
  res.end(body);
}

function sendText(res: ServerResponse, status: number, contentType: string, body: string): void {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'founder-reality',
    'X-DevPulse-Phase': '10.3.1',
    'X-DevPulse-Shell': 'command-center-runtime',
  });
  res.end(body);
}

function resolvePublicPath(urlPath: string): string | null {
  const safePath = urlPath === '/' ? '/index.html' : urlPath;
  const normalized = normalize(safePath).replace(/^(\.\.[/\\])+/, '');
  if (normalized.includes('..')) return null;

  const filePath = join(PUBLIC_DIR, normalized.replace(/^\//, ''));
  if (!filePath.startsWith(PUBLIC_DIR)) return null;
  return filePath;
}

async function serveStaticFile(res: ServerResponse, filePath: string): Promise<void> {
  const ext = filePath.slice(filePath.lastIndexOf('.'));
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
  const content = await readFile(filePath);
  sendText(res, 200, contentType, content.toString('utf8'));
}

export function createFounderRealityServer() {
  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendJson(res, 405, JSON.stringify({ error: 'Method not allowed — Founder Reality Surface is read-only' }));
      return;
    }

    const urlPath = (req.url ?? '/').split('?')[0] ?? '/';

    if (urlPath.includes('exec') || urlPath.includes('write') || urlPath.includes('command') || urlPath.includes('deploy')) {
      sendJson(res, 403, JSON.stringify({ error: 'Forbidden endpoint — no command or write access' }));
      return;
    }

    if (urlPath === '/api/founder-reality.json') {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendJson(res, 200, MANIFEST_JSON);
      return;
    }

    const allowedStatic = ['/', '/index.html', '/styles.css', '/app.js'];
    if (!allowedStatic.includes(urlPath)) {
      sendJson(res, 404, JSON.stringify({ error: 'Not found' }));
      return;
    }

    const filePath = resolvePublicPath(urlPath);
    if (!filePath) {
      sendJson(res, 403, JSON.stringify({ error: 'Forbidden path' }));
      return;
    }

    try {
      statSync(filePath);
      if (req.method === 'HEAD') {
        res.writeHead(200);
        res.end();
        return;
      }
      await serveStaticFile(res, filePath);
    } catch {
      sendJson(res, 404, JSON.stringify({ error: 'File not found' }));
    }
  });
}

export function getFounderRealityManifest(): typeof MANIFEST {
  return MANIFEST;
}

export function getFounderRealityManifestJson(): string {
  return MANIFEST_JSON;
}

export function startFounderRealityServer(port = FOUNDER_REALITY_PORT, host = FOUNDER_REALITY_HOST): ReturnType<typeof createFounderRealityServer> {
  const server = createFounderRealityServer();
  server.listen(port, host, () => {
    console.log('');
    console.log('DevPulse V2 — Command Center Runtime Shell');
    console.log('==========================================');
    console.log('');
    console.log(`Open: ${FOUNDER_REALITY_URL}`);
    console.log('');
    console.log('Visibility only — no execution, no validator auto-run.');
    console.log('');
  });
  return server;
}

if (process.argv[1]?.includes('founder-reality-server')) {
  startFounderRealityServer();
}

export { FOUNDER_REALITY_URL, FOUNDER_REALITY_PORT, FOUNDER_REALITY_HOST };
