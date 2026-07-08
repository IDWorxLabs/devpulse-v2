import http from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const requestedPort = Number(process.env.RUNTIME_PORT || 0);
const workspaceId = process.env.WORKSPACE_ID || 'unknown';
const workspaceRoot = process.cwd();

const UI_ENTRY_CANDIDATES = [
  'src/main.tsx',
  'src/main.jsx',
  'src/main.ts',
  'src/main.js',
  'src/index.tsx',
  'src/index.jsx',
  'src/App.tsx',
  'src/App.jsx',
];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8',
  '.ts': 'text/javascript; charset=utf-8',
  '.tsx': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function detectUiExposure() {
  const hasIndexHtml = existsSync(join(workspaceRoot, 'index.html'));
  const hasReactApp =
    existsSync(join(workspaceRoot, 'src/App.tsx')) ||
    existsSync(join(workspaceRoot, 'src/App.jsx'));
  let entrypoint = null;
  for (const rel of UI_ENTRY_CANDIDATES) {
    if (existsSync(join(workspaceRoot, rel))) {
      entrypoint = '/' + rel.replace(/\\/g, '/');
      break;
    }
  }
  const uiSourcePresent = hasIndexHtml || hasReactApp || entrypoint !== null;
  return { uiSourcePresent, entrypoint, hasIndexHtml };
}

function resolveWorkspaceFile(urlPath) {
  const pathname = decodeURIComponent((urlPath.split('?')[0] || '/'));
  const rel = pathname.replace(/^\/+/, '');
  if (!rel || rel.includes('..')) return null;
  const abs = join(workspaceRoot, rel);
  if (!abs.startsWith(workspaceRoot)) return null;
  if (!existsSync(abs)) return null;
  return abs;
}

function readIndexHtml() {
  const indexPath = join(workspaceRoot, 'index.html');
  if (!existsSync(indexPath)) return null;
  try {
    return readFileSync(indexPath, 'utf8');
  } catch {
    return null;
  }
}

function buildHtmlShell(entrypoint) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Generated App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="${entrypoint}"></script>
</body>
</html>`;
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function sendText(res, statusCode, contentType, body) {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(body);
}

function runtimeStatus(pathname) {
  return { status: 'ok', workspaceId, path: pathname };
}

const uiExposure = detectUiExposure();

const server = http.createServer((req, res) => {
  const pathname = req.url?.split('?')[0] || '/';

  if (pathname === '/health' || pathname === '/runtime/status') {
    sendJson(res, 200, runtimeStatus(pathname));
    return;
  }

  if (uiExposure.uiSourcePresent) {
    if (pathname === '/' || pathname === '/index.html') {
      const indexHtml = readIndexHtml();
      const html = indexHtml ?? buildHtmlShell(uiExposure.entrypoint ?? '/src/App.tsx');
      sendText(res, 200, 'text/html; charset=utf-8', html);
      return;
    }

    const filePath = resolveWorkspaceFile(pathname);
    if (filePath) {
      try {
        const body = readFileSync(filePath);
        const ext = extname(filePath).toLowerCase();
        const contentType = MIME[ext] ?? 'application/octet-stream';
        sendText(res, 200, contentType, body);
        return;
      } catch {
        sendJson(res, 500, { status: 'error', workspaceId, path: pathname });
        return;
      }
    }

    sendJson(res, 404, { status: 'not_found', workspaceId, path: pathname });
    return;
  }

  sendJson(res, 200, runtimeStatus(pathname));
});

server.listen(requestedPort > 0 ? requestedPort : 0, '127.0.0.1', () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : requestedPort;
  process.stdout.write(
    JSON.stringify({ ready: true, port, workspaceId, uiExposure: uiExposure.uiSourcePresent }) + '\n',
  );
});

