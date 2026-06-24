/**
 * Serves built dist/ assets over HTTP for live preview runtime verification.
 */

import { createServer, type Server } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { DIST_PREVIEW_SERVER_TIMEOUT_MS } from './uvl-verification-execution-v1-bounds.js';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

export interface DistPreviewServerHandle {
  server: Server;
  port: number;
  url: string;
}

function resolveDistFile(workspaceDir: string, pathname: string): string | null {
  const distRoot = join(workspaceDir, 'dist');
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const relative = safePath === '/' || safePath === '' ? 'index.html' : safePath.replace(/^\//, '');
  const candidate = join(distRoot, relative);
  if (!candidate.startsWith(distRoot)) return null;
  return existsSync(candidate) ? candidate : null;
}

export async function startDistPreviewServer(workspaceDir: string): Promise<DistPreviewServerHandle> {
  const distIndex = join(workspaceDir, 'dist', 'index.html');
  if (!existsSync(distIndex)) {
    throw new Error(`dist/index.html missing in ${workspaceDir}`);
  }

  const server = createServer((req, res) => {
    const pathname = req.url?.split('?')[0] ?? '/';
    const filePath = resolveDistFile(workspaceDir, pathname);
    if (!filePath) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    let targetPath = filePath;
    try {
      if (statSync(filePath).isDirectory()) {
        const indexInDir = join(filePath, 'index.html');
        if (!existsSync(indexInDir) || statSync(indexInDir).isDirectory()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Not found');
          return;
        }
        targetPath = indexInDir;
      }
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const body = readFileSync(targetPath);
    const contentType = MIME[extname(targetPath).toLowerCase()] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(body);
  });

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Dist preview server bind timeout'));
    }, DIST_PREVIEW_SERVER_TIMEOUT_MS);
    server.listen(0, '127.0.0.1', () => {
      clearTimeout(timer);
      resolve();
    });
    server.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Failed to bind dist preview server');
  }

  return {
    server,
    port: address.port,
    url: `http://127.0.0.1:${address.port}/`,
  };
}

export async function stopDistPreviewServer(handle: DistPreviewServerHandle): Promise<void> {
  await new Promise<void>((resolve) => {
    handle.server.close(() => resolve());
  });
}
