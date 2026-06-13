/**
 * Bounded preview experience probe — starts runtime, fetches preview URL, records render evidence.
 */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { get as httpGet } from 'node:http';
import { join } from 'node:path';

const [, , workspaceRoot, portStr, workspaceId] = process.argv;
const requestedPort = Number(portStr || 0);
const timeoutMs = Number(process.env.PREVIEW_PROBE_TIMEOUT_MS || 8000);

function resolveServerEntry() {
  const serverPath = join(workspaceRoot, 'runtime', 'dev-server.mjs');
  return existsSync(serverPath) ? serverPath : null;
}

function waitForReady(child, timeout) {
  return new Promise((resolve) => {
    let output = '';
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => finish({ ready: false, port: requestedPort, output }), timeout);
    child.stdout?.on('data', (chunk) => {
      output += String(chunk);
      for (const line of output.trim().split('\n')) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.ready && parsed.port) {
            finish({ ready: true, port: parsed.port, output });
            return;
          }
        } catch {
          // wait for complete JSON line
        }
      }
    });
    child.on('exit', () => finish({ ready: false, port: requestedPort, output }));
  });
}

function fetchPreview(url) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const req = httpGet(url, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += String(chunk);
      });
      res.on('end', () => {
        const contentType = String(res.headers['content-type'] ?? '');
        resolve({
          urlChecked: true,
          httpStatus: res.statusCode ?? null,
          reachable: res.statusCode !== null && res.statusCode >= 200 && res.statusCode < 400,
          checkedAt: new Date().toISOString(),
          contentType,
          responseLength: body.length,
          body,
          responseTimeMs: Date.now() - startedAt,
        });
      });
    });
    req.on('error', () =>
      resolve({
        urlChecked: true,
        httpStatus: null,
        reachable: false,
        checkedAt: new Date().toISOString(),
        contentType: null,
        responseLength: 0,
        body: '',
        responseTimeMs: Date.now() - startedAt,
      }),
    );
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({
        urlChecked: true,
        httpStatus: null,
        reachable: false,
        checkedAt: new Date().toISOString(),
        contentType: null,
        responseLength: 0,
        body: '',
        responseTimeMs: Date.now() - startedAt,
      });
    });
  });
}

function detectRenderEvidence(body, contentType) {
  const lowerType = (contentType ?? '').toLowerCase();
  if (body.length === 0) {
    return {
      renderEvidenceType: null,
      renderObserved: false,
      htmlResponse: false,
      applicationTitle: null,
      applicationRoot: null,
    };
  }

  if (lowerType.includes('json')) {
    try {
      const parsed = JSON.parse(body);
      if (parsed.status === 'ok' && parsed.workspaceId) {
        return {
          renderEvidenceType: 'JSON_INDEX_RESPONSE',
          renderObserved: true,
          htmlResponse: true,
          applicationTitle: `Workspace ${parsed.workspaceId}`,
          applicationRoot: parsed.path ?? '/',
        };
      }
    } catch {
      // fall through
    }
  }

  if (lowerType.includes('html') || body.includes('<html') || body.includes('<!DOCTYPE')) {
    const titleMatch = body.match(/<title>([^<]+)<\/title>/i);
    const rootMatch = body.match(/id=["'](root|app|__next)["']/i);
    return {
      renderEvidenceType: 'HTML_DOCUMENT',
      renderObserved: true,
      htmlResponse: true,
      applicationTitle: titleMatch?.[1] ?? null,
      applicationRoot: rootMatch?.[1] ?? null,
    };
  }

  return {
    renderEvidenceType: 'CONTENT_RESPONSE',
    renderObserved: body.length > 0,
    htmlResponse: body.length > 0,
    applicationTitle: null,
    applicationRoot: null,
  };
}

async function main() {
  const serverPath = resolveServerEntry();
  const base = {
    workspaceId: workspaceId ?? 'unknown',
    workspacePath: workspaceRoot.replace(/\\/g, '/'),
    previewUrl: null,
    runtimePort: null,
    previewDetected: false,
    generatedAt: new Date().toISOString(),
    urlChecked: false,
    httpStatus: null,
    reachable: false,
    checkedAt: null,
    renderEvidenceType: null,
    renderObserved: false,
    responseLength: 0,
    contentType: null,
    renderCheckedAt: null,
    responseCode: null,
    proofLevel: 'NOT_PROVEN',
    activationAttempted: false,
    firstBrokenPreviewLink: 'runtime→url',
  };

  if (!serverPath) {
    process.stdout.write(`${JSON.stringify(base)}\n`);
    process.exit(0);
  }

  base.activationAttempted = true;
  const child = spawn(process.execPath, [serverPath], {
    cwd: workspaceRoot,
    env: {
      ...process.env,
      RUNTIME_PORT: requestedPort > 0 ? String(requestedPort) : '0',
      WORKSPACE_ID: workspaceId ?? 'unknown',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  const ready = await waitForReady(child, timeoutMs);
  if (!ready.ready) {
    base.firstBrokenPreviewLink = 'runtime→url';
    try {
      child.kill();
    } catch {
      /* ignore */
    }
    process.stdout.write(`${JSON.stringify(base)}\n`);
    process.exit(0);
  }

  const host = '127.0.0.1';
  const previewUrl = `http://${host}:${ready.port}/`;
  base.previewUrl = previewUrl;
  base.runtimePort = ready.port;
  base.previewDetected = true;

  const fetchResult = await fetchPreview(previewUrl);
  base.urlChecked = fetchResult.urlChecked;
  base.httpStatus = fetchResult.httpStatus;
  base.responseCode = fetchResult.httpStatus;
  base.reachable = fetchResult.reachable;
  base.checkedAt = fetchResult.checkedAt;
  base.contentType = fetchResult.contentType;
  base.responseLength = fetchResult.responseLength;

  const render = detectRenderEvidence(fetchResult.body, fetchResult.contentType);
  base.renderEvidenceType = render.renderEvidenceType;
  base.renderObserved = render.renderObserved;
  base.renderCheckedAt = new Date().toISOString();
  base.htmlResponse = render.htmlResponse;
  base.applicationTitle = render.applicationTitle;
  base.applicationRoot = render.applicationRoot;

  if (!base.previewUrl) base.firstBrokenPreviewLink = 'runtime→url';
  else if (!base.reachable) base.firstBrokenPreviewLink = 'url→reachable';
  else if (!base.renderObserved) base.firstBrokenPreviewLink = 'reachable→render';
  else base.firstBrokenPreviewLink = null;

  if (base.previewDetected && base.reachable && base.renderObserved) {
    base.proofLevel = 'PROVEN';
  } else if (base.activationAttempted) {
    base.proofLevel = 'PARTIAL';
  }

  try {
    child.kill();
  } catch {
    /* ignore */
  }

  process.stdout.write(`${JSON.stringify(base)}\n`);
}

main().catch((err) => {
  process.stdout.write(
    `${JSON.stringify({
      activationAttempted: true,
      proofLevel: 'NOT_PROVEN',
      error: err instanceof Error ? err.message : String(err),
    })}\n`,
  );
  process.exit(1);
});
