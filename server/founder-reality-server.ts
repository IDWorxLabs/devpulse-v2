/**
 * DevPulse V2 Phase 10.3+ — Founder Reality Surface + Command Center Brain HTTP server.
 * Serves static surface and local brain API. No execution, no file writes.
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
import { handleBrainRespondRequest, sendBrainHealth } from './brain-api-handler.js';

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
    'X-DevPulse-Phase': '11.1',
    'X-DevPulse-Shell': 'command-center-runtime',
  });
  res.end(body);
}

function sendText(res: ServerResponse, status: number, contentType: string, body: string): void {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'founder-reality',
    'X-DevPulse-Phase': '11.1',
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
    const urlPath = (req.url ?? '/').split('?')[0] ?? '/';

    const forbiddenPaths = ['/api/exec', '/api/run-command', '/api/write', '/api/deploy', '/api/auto-fix'];
    if (forbiddenPaths.some((p) => urlPath.startsWith(p))) {
      sendJson(res, 403, JSON.stringify({ error: 'Forbidden endpoint — no command or write access' }));
      return;
    }

    if (urlPath === '/api/brain/health' && (req.method === 'GET' || req.method === 'HEAD')) {
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end();
        return;
      }
      sendBrainHealth(res);
      return;
    }

    if (urlPath === '/api/brain/respond' && req.method === 'POST') {
      await handleBrainRespondRequest(req, res);
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendJson(res, 405, JSON.stringify({
        error: 'Method not allowed — only GET and POST /api/brain/* endpoints are supported',
        hint: 'Restart DevPulse with npm run dev if Brain POST returns read-only errors',
      }));
      return;
    }

    if (urlPath.includes('exec') || urlPath.includes('/write') || urlPath.includes('deploy')) {
      sendJson(res, 403, JSON.stringify({ error: 'Forbidden endpoint' }));
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
    console.log('DevPulse V2 — Command Center + Unified Brain');
    console.log('============================================');
    console.log('');
    console.log(`Open: ${FOUNDER_REALITY_URL}`);
    console.log('');
    console.log('Phase 11.1A Brain Runtime — POST /api/brain/respond + GET /api/brain/health');
    console.log('If Brain fails with 405, stop stale servers on port 4321 and restart.');
    console.log('No execution, no external AI, no file modification.');
    console.log('');
  });
  return server;
}

if (process.argv[1]?.includes('founder-reality-server')) {
  startFounderRealityServer();
}

export { FOUNDER_REALITY_URL, FOUNDER_REALITY_PORT, FOUNDER_REALITY_HOST };
