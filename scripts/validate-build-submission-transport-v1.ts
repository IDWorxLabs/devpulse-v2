/**
 * Focused regression: frontend→backend build submission transport.
 * Covers healthy submission, large ContinuityHub-scale prompts, readiness, and body limits.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const {
  BRAIN_MAX_BODY_BYTES,
  BUILD_MAX_BODY_BYTES,
  RequestBodyTooLargeError,
  readRequestBody,
} = await import('../server/brain-api-handler.ts');
const { handleBuildReadyRequest, handleBuildFromPromptRequest } = await import(
  '../server/build-from-prompt-handler.ts'
);

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    passed += 1;
    console.log(`PASS — ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL — ${name}${detail ? ` :: ${detail}` : ''}`);
  }
}

function continuityHubPrompt(minBytes: number): string {
  const fixturePath = join(ROOT, 'scripts/fixtures/continuityhub-production-prompt.txt');
  let base: string;
  if (existsSync(fixturePath)) {
    base = readFileSync(fixturePath, 'utf8');
  } else {
    base = [
      'Build ContinuityHub, a production operations continuity platform.',
      'Core modules: incident timeline, stakeholder contacts, runbooks, escalation paths,',
      'dependency maps, status pages, post-incident reviews, evidence lockers, on-call rotations,',
      'change windows, risk registers, communication templates, and audit trails.',
      'Not a generic CRM. Not a task tracker. Contacts are stakeholders. Inventory means spare failover capacity records.',
    ].join(' ');
  }
  if (Buffer.byteLength(base, 'utf8') >= minBytes) return base;
  const pad = '\nAdditional production specification detail. '.repeat(
    Math.ceil((minBytes - Buffer.byteLength(base, 'utf8')) / 48),
  );
  return base + pad;
}

async function withTempServer(
  handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>,
  fn: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const server = createServer((req, res) => {
    void Promise.resolve(handler(req, res)).catch((err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(err) }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  assert(addr && typeof addr === 'object');
  const baseUrl = `http://127.0.0.1:${addr.port}`;
  try {
    await fn(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  }
}

// --- unit: body reader ---
{
  const oversized = Buffer.alloc(BRAIN_MAX_BODY_BYTES + 50, 0x61);
  await withTempServer(
    async (req, res) => {
      try {
        await readRequestBody(req, BRAIN_MAX_BODY_BYTES);
        res.writeHead(200);
        res.end('ok');
      } catch (err) {
        check(
          'oversized brain body throws RequestBodyTooLargeError',
          err instanceof RequestBodyTooLargeError,
        );
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ code: 'PAYLOAD_TOO_LARGE' }));
      }
    },
    async (baseUrl) => {
      const res = await fetch(`${baseUrl}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: oversized,
      });
      check('oversized brain body returns HTTP 413 (not connection destroy)', res.status === 413);
      const json = (await res.json()) as { code?: string };
      check('413 payload includes PAYLOAD_TOO_LARGE', json.code === 'PAYLOAD_TOO_LARGE');
    },
  );
}

{
  const largeOk = Buffer.alloc(20_000, 0x62);
  check('20KB exceeds brain limit', largeOk.length > BRAIN_MAX_BODY_BYTES);
  check('20KB under build limit', largeOk.length < BUILD_MAX_BODY_BYTES);
  await withTempServer(
    async (req, res) => {
      const body = await readRequestBody(req, BUILD_MAX_BODY_BYTES);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ bytes: Buffer.byteLength(body) }));
    },
    async (baseUrl) => {
      const res = await fetch(`${baseUrl}/`, {
        method: 'POST',
        body: largeOk,
      });
      check('large body accepted under BUILD_MAX_BODY_BYTES', res.status === 200);
      const json = (await res.json()) as { bytes: number };
      check('large body fully read', json.bytes === largeOk.length);
    },
  );
}

// --- build ready route ---
await withTempServer(
  (req, res) => {
    if (req.url?.startsWith('/api/build/ready')) {
      handleBuildReadyRequest(req, res);
      return;
    }
    res.writeHead(404);
    res.end();
  },
  async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/build/ready`);
    const json = (await res.json()) as {
      ok?: boolean;
      submissionReady?: boolean;
      endpoint?: string;
      maxBodyBytes?: number;
    };
    check('GET /api/build/ready returns 200', res.status === 200);
    check('ready.ok true', json.ok === true);
    check('ready.submissionReady true', json.submissionReady === true);
    check('ready.endpoint is build submission', json.endpoint === '/api/build/from-prompt');
    check(
      'ready.maxBodyBytes matches BUILD_MAX',
      json.maxBodyBytes === BUILD_MAX_BODY_BYTES,
      String(json.maxBodyBytes),
    );
  },
);

// --- ContinuityHub-scale prompt reaches handler (acceptance recorded before pipeline work) ---
{
  const prompt = continuityHubPrompt(18_000);
  check('ContinuityHub fixture exceeds former 16KB brain limit', Buffer.byteLength(prompt, 'utf8') > 16_384);
  let acceptedPrompt: string | null = null;
  await withTempServer(
    async (req, res) => {
      if (req.method === 'POST' && req.url === '/api/build/from-prompt') {
        try {
          const raw = await readRequestBody(req, BUILD_MAX_BODY_BYTES);
          const body = JSON.parse(raw) as { prompt?: string };
          acceptedPrompt = body.prompt ?? null;
          res.writeHead(202, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              ok: true,
              accepted: true,
              promptBytes: Buffer.byteLength(acceptedPrompt ?? '', 'utf8'),
              promptPrefix: (acceptedPrompt ?? '').slice(0, 32),
            }),
          );
        } catch (err) {
          const status = err instanceof RequestBodyTooLargeError ? 413 : 400;
          res.writeHead(status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
        }
        return;
      }
      if (req.url?.startsWith('/api/build/ready')) {
        handleBuildReadyRequest(req, res);
        return;
      }
      res.writeHead(404);
      res.end();
    },
    async (baseUrl) => {
      const ready = await fetch(`${baseUrl}/api/build/ready`);
      const readyJson = (await ready.json()) as { ok?: boolean };
      check('health and submission agree (ready before post)', readyJson.ok === true);

      const res = await fetch(`${baseUrl}/api/build/from-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, forceBuildIntent: true, forceFreshProject: true }),
      });
      const json = (await res.json()) as {
        accepted?: boolean;
        promptBytes?: number;
        promptPrefix?: string;
      };
      check('large ContinuityHub POST returns success (not Failed to fetch)', res.status === 202);
      check('backend recorded full ContinuityHub prompt', acceptedPrompt === prompt);
      check(
        'response promptBytes matches',
        json.promptBytes === Buffer.byteLength(prompt, 'utf8'),
        String(json.promptBytes),
      );
      check('prompt prefix ContinuityHub', Boolean(json.promptPrefix && /ContinuityHub/i.test(json.promptPrefix)));
    },
  );
}

// --- frontend classification helpers present ---
{
  const js = readFileSync(join(ROOT, 'public/founder-reality/builder-home.js'), 'utf8');
  check('builder uses /api/build/ready', js.includes("'/api/build/ready'") || js.includes('"/api/build/ready"') || js.includes('BUILD_READY_API'));
  check('builder classifies Failed to fetch', js.includes('classifyTransportError') && js.includes('BACKEND_UNAVAILABLE'));
  check('builder distinguishes payload too large', js.includes('PAYLOAD_TOO_LARGE'));
  check('builder gates on readiness', js.includes('submissionReady') && js.includes('BUILD_READY_API'));
  check('builder no longer shows Runtime status unknown as terminal happy path', !/Runtime status unknown/.test(js));
  check('builder uses npm run dev recovery copy', js.includes('npm run dev'));
}

// --- duplicate-click guard ---
{
  const js = readFileSync(join(ROOT, 'public/founder-reality/builder-home.js'), 'utf8');
  check('duplicate Build clicks blocked by state.building', /if\s*\(\s*state\.building\s*\)\s*return/.test(js));
}

console.log('');
console.log(`${passed}/${passed + failed} checks passed`);
if (failed > 0) process.exit(1);
console.log('AIDEVENGINE_BUILD_SUBMISSION_TRANSPORT_V1_PASS');
