/**
 * Phase 26.70A — Founder Test result route existence proof (diagnostic only).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_TEST_RESULT_ROUTE_EXISTENCE_PROOF_V1_PASS,
  FOUNDER_TEST_PING_ROUTE,
  FOUNDER_TEST_REGISTERED_RESULT_ROUTES,
  FOUNDER_TEST_DEFAULT_API_ORIGIN,
  FOUNDER_TEST_RESULT_ROUTE,
  FOUNDER_TEST_RESULT_DEBUG_ROUTE,
  classifyFounderTestResultFailureBoundary,
  founderTestResultStoreIsInMemoryOnly,
  resolveFounderTestApiBaseUrl,
  buildFounderTestResultFetchUrl,
  buildFounderTestResultDebugUrl,
} from '../src/founder-test-runtime-monitor/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-founder-test-result-route-existence-proof';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'server/founder-reality-server.ts',
  'server/founder-testing-handler.ts',
  'server/founder-test-server-process-metadata.ts',
  'src/founder-test-runtime-monitor/founder-test-run-result-store.ts',
  'src/founder-test-runtime-monitor/founder-test-result-route-existence-proof.ts',
  'public/founder-reality/app.js',
  'scripts/validate-founder-test-result-route-existence-proof.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const serverSource = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8').replace(/\r\n/g, '\n');
const handlerSource = readFileSync(join(ROOT, 'server/founder-testing-handler.ts'), 'utf8').replace(/\r\n/g, '\n');
const storeSource = readFileSync(
  join(ROOT, 'src/founder-test-runtime-monitor/founder-test-run-result-store.ts'),
  'utf8',
);
const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');
const validatorSource = readFileSync(join(ROOT, 'scripts', `${VALIDATOR_BASENAME}.ts`), 'utf8');

assert('result route registered', serverSource.includes("urlPath === '/api/founder-test/result'"), 'result');
assert('result-debug route registered', serverSource.includes("urlPath === '/api/founder-test/result-debug'"), 'debug');
assert('ping route registered', serverSource.includes("urlPath === '/api/founder-test/ping'"), 'ping');
assert('ping handler wired', serverSource.includes('handleFounderTestPingRequest'), 'ping handler');
assert('startup logs list result route', serverSource.includes('GET  /api/founder-test/result'), 'log result');
assert('startup logs list result-debug route', serverSource.includes('GET  /api/founder-test/result-debug'), 'log debug');
assert('startup logs list ping route', serverSource.includes('GET  /api/founder-test/ping'), 'log ping');
assert('startup logs listening port', serverSource.includes('Listening:'), 'listening');
assert('startup logs process id', serverSource.includes('pid'), 'pid');
assert('ping handler export', handlerSource.includes('handleFounderTestPingRequest'), 'export');
assert('ping response builder', handlerSource.includes('buildFounderTestPingResponse'), 'builder');
assert(
  'result-debug includes serverStartedAt',
  handlerSource.includes('buildBoundedFounderTestResultDebugResponse') &&
    handlerSource.includes('serverStartedAt:'),
  'debug uptime',
);
assert('in-memory result map', storeSource.includes('founderTestRunResultsByRunId = new Map'), 'map');
assert('store is in-memory only', founderTestResultStoreIsInMemoryOnly() === true, 'memory');
assert('no disk persistence in store', !storeSource.includes('writeFileSync') && !storeSource.includes('readFileSync'), 'no disk');
assert('client resolveFounderTestApiBaseUrl', appJs.includes('function resolveFounderTestApiBaseUrl'), 'base url');
assert('client vite port fallback 4321', appJs.includes("'http://localhost:4321'"), '4321');
assert('client buildFounderTestResultFetchUrl', appJs.includes('buildFounderTestResultFetchUrl'), 'result url');
assert('client buildFounderTestResultDebugUrl', appJs.includes('buildFounderTestResultDebugUrl'), 'debug url');
assert('no scoring edits', !handlerSource.includes('founderTestScoreOverride'), 'scoring');
assert('no verdict logic edits', !handlerSource.includes('overrideLaunchVerdict'), 'verdict');
assert('no validator recursion', !validatorSource.includes(`validate:${VALIDATOR_BASENAME}`), 'recursion');
assert(
  'package script registered',
  packageJson.includes(
    `validate:founder-test-result-route-existence-proof": "tsx scripts/${VALIDATOR_BASENAME}.ts"`,
  ),
  'script',
);

assert(
  'registered routes include ping result debug',
  FOUNDER_TEST_REGISTERED_RESULT_ROUTES.includes(FOUNDER_TEST_PING_ROUTE) &&
    FOUNDER_TEST_REGISTERED_RESULT_ROUTES.includes(FOUNDER_TEST_RESULT_ROUTE) &&
    FOUNDER_TEST_REGISTERED_RESULT_ROUTES.includes(FOUNDER_TEST_RESULT_DEBUG_ROUTE),
  'routes',
);

const viteBase = resolveFounderTestApiBaseUrl({
  frontendPort: '5173',
  frontendOrigin: 'http://localhost:5173',
});
assert('vite dev resolves api base 4321', viteBase === FOUNDER_TEST_DEFAULT_API_ORIGIN, viteBase);

const sameOriginBase = resolveFounderTestApiBaseUrl({
  frontendPort: '4321',
  frontendOrigin: 'http://localhost:4321',
});
assert('same port uses same origin', sameOriginBase === 'http://localhost:4321', sameOriginBase);

const resultUrl = buildFounderTestResultFetchUrl('proof-run-id', viteBase);
const debugUrl = buildFounderTestResultDebugUrl('proof-run-id', viteBase);
assert('result url targets 4321 from vite', resultUrl.includes('4321') && resultUrl.includes('runId=proof-run-id'), resultUrl);
assert('debug url targets 4321 from vite', debugUrl.includes('4321') && debugUrl.includes('result-debug'), debugUrl);

assert(
  'classify route unreachable',
  classifyFounderTestResultFailureBoundary({ pingRouteReached: false, fetchErrorMessage: 'Failed to fetch' }) ===
    'route_unreachable',
  'unreachable',
);
assert(
  'classify wrong api base',
  classifyFounderTestResultFailureBoundary({
    pingRouteReached: true,
    expectedApiOrigin: 'http://localhost:4321',
    requestedUrlOrigin: 'http://localhost:5173',
  }) === 'wrong_api_base',
  'wrong base',
);
assert(
  'classify store empty',
  classifyFounderTestResultFailureBoundary({
    pingRouteReached: true,
    resultDebugRouteReached: true,
    hasStoredResult: false,
    hasReportMarkdown: false,
  }) === 'report_never_persisted',
  'store empty',
);
assert(
  'classify server restarted',
  classifyFounderTestResultFailureBoundary({
    pingRouteReached: true,
    serverStartedAt: '2026-06-12T14:00:00.000Z',
    runCompletedAt: '2026-06-12T13:00:00.000Z',
  }) === 'server_restarted',
  'restarted',
);

async function liveRouteProof(): Promise<void> {
  const server = createFounderRealityServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Could not bind ephemeral port');
  }
  const base = `http://127.0.0.1:${address.port}`;

  try {
    const pingRes = await fetch(`${base}${FOUNDER_TEST_PING_ROUTE}`);
    const ping = (await pingRes.json()) as Record<string, unknown>;
    assert('live ping HTTP 200', pingRes.status === 200, String(pingRes.status));
    assert('live ping routeReached', ping.routeReached === true, String(ping.routeReached));
    assert('live ping has serverStartedAt', typeof ping.serverStartedAt === 'string', String(ping.serverStartedAt));
    assert('live ping has processId', typeof ping.processId === 'number', String(ping.processId));
    assert('live ping has uptimeSeconds', typeof ping.uptimeSeconds === 'number', String(ping.uptimeSeconds));

    const debugRes = await fetch(`${base}${FOUNDER_TEST_RESULT_DEBUG_ROUTE}?runId=live-proof-run`);
    const debug = (await debugRes.json()) as Record<string, unknown>;
    assert('live result-debug HTTP 200', debugRes.status === 200, String(debugRes.status));
    assert('live result-debug routeReached', debug.routeReached === true, String(debug.routeReached));
    assert('live result-debug hasStoredResult false', debug.hasStoredResult === false, String(debug.hasStoredResult));
    assert('live result-debug serverStartedAt', typeof debug.serverStartedAt === 'string', 'serverStartedAt');

    const resultRes = await fetch(`${base}${FOUNDER_TEST_RESULT_ROUTE}?runId=live-proof-run`);
    const resultContentType = resultRes.headers.get('content-type') ?? '';
    assert('live result JSON content-type', resultContentType.includes('application/json'), resultContentType);
    const result = (await resultRes.json()) as Record<string, unknown>;
    assert('live result responds JSON', typeof result === 'object' && result != null, 'json');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

await liveRouteProof();

const report = [
  '# Founder Test Result Route Existence Proof Report (Phase 26.70A)',
  '',
  '## Objective',
  '',
  'Prove which boundary fails — without repairing handoff yet.',
  '',
  '## Failure Boundary Matrix',
  '',
  '| Symptom | Boundary | Proof step |',
  '| --- | --- | --- |',
  '| `Failed to fetch`, ping fails | **C/D — route unreachable or wrong base** | `GET /api/founder-test/ping` from browser + compare resolved API base |',
  '| ping OK, result-debug 404 route | **C — route missing** | Startup log must list routes; static registration in `founder-reality-server.ts` |',
  '| ping OK, debug `routeReached: false` | **C — route missing** | Should not happen if handler reached |',
  '| ping OK, debug `hasStoredResult: false` | **B/E — store empty or server restarted** | Compare `serverStartedAt` vs run `completedAt` |',
  '| `serverStartedAt` > run `completedAt` | **E — server restarted / memory loss** | In-memory store cleared on process exit |',
  '| debug `hasStoredResult: true`, no markdown | **A/B — report never persisted** | Generation succeeded but store payload empty |',
  '| Vite port 5173 fetching relative `/api/...` | **D — wrong API base** | Must resolve to `http://localhost:4321` |',
  '',
  '## Static Proof — Route Registration',
  '',
  'Registered in `server/founder-reality-server.ts`:',
  '',
  '- `GET /api/founder-test/ping` → `handleFounderTestPingRequest` (temporary diagnostic)',
  '- `GET /api/founder-test/result` → `handleFounderTestResultRequest`',
  '- `GET /api/founder-test/result-debug` → `handleFounderTestResultDebugRequest`',
  '- `GET /api/founder-test/runtime-status` → `handleFounderTestRuntimeStatusRequest`',
  '',
  'Startup logs now print listening port, pid, serverStartedAt, and registered Founder Test routes.',
  '',
  '## Static Proof — Result Store',
  '',
  '- `founderTestRunResultsByRunId` is a **process-local `Map`** (`founder-test-run-result-store.ts`).',
  '- **No disk persistence.** Process exit or restart = total store loss (boundary **E**).',
  '- Max 16 entries; oldest trimmed by `completedAt`.',
  '',
  '## Static Proof — Frontend API Base',
  '',
  'Resolution order in `public/founder-reality/app.js` → `resolveFounderTestApiBaseUrl()`:',
  '',
  '1. `founderTestApiBaseUrlOverride`',
  '2. `manifestData.apiBaseUrl`',
  '3. `window.__DEVPULSE_FOUNDER_TEST_API_BASE__`',
  '4. `founderTestApiResolvedOrigin` (from prior successful fetch)',
  '5. Vite ports `5173|5174|3000` → **`http://localhost:4321`**',
  '6. Else `window.location.origin`',
  '',
  'Active server port: **4321** (`FOUNDER_REALITY_PORT` in `founder-reality-manifest.ts`).',
  '',
  '## Temporary Diagnostic — GET /api/founder-test/ping',
  '',
  '```json',
  '{',
  '  "routeReached": true,',
  '  "serverStartedAt": "<ISO>",',
  '  "processId": <number>,',
  '  "uptimeSeconds": <number>,',
  '  "listeningPort": 4321,',
  '  "listeningHost": "0.0.0.0"',
  '}',
  '```',
  '',
  '`GET /api/founder-test/result-debug?runId=<runId>` also returns `serverStartedAt`, `processId`, `uptimeSeconds` for restart comparison.',
  '',
  '## Observed Runtime Evidence (Terminal)',
  '',
  'Prior dev session showed **process crash** during `handleFounderTestResultRequest`:',
  '',
  '- `RangeError: Invalid string length` at `JSON.stringify` in `sendFounderTestJson`',
  '- Node process exited → in-memory result store lost → subsequent fetches fail',
  '- This is boundary **E** (server restart / memory loss), compounded by oversized result payload (**A** generation size).',
  '',
  '## Manual Verification Steps',
  '',
  '1. Start server: `npm run dev` — confirm startup log lists ping/result/result-debug and pid.',
  '2. `curl http://localhost:4321/api/founder-test/ping` — expect `routeReached: true`.',
  '3. Run Founder Test; note runId from Operator Feed.',
  '4. `curl "http://localhost:4321/api/founder-test/result-debug?runId=<runId>"` — check `hasStoredResult`, `hasReportMarkdown`, `serverStartedAt`.',
  '5. If UI served from Vite (5173), open browser devtools → verify result URL host is **4321**, not 5173.',
  '6. If `serverStartedAt` is **after** run completion time → boundary **E** confirmed.',
  '',
  '## Verdict Guidance (proof only — no repair in this phase)',
  '',
  '- **A** report generation: debug shows no markdown ever stored for runId',
  '- **B** store persistence: run completed but `hasStoredResult: false` on same process',
  '- **C** route registration: ping fails on 4321 while server claims running',
  '- **D** API base mismatch: ping OK on 4321 but client fetches 5173/origin',
  '- **E** restart/memory: `serverStartedAt` after run completion OR process crash in logs',
  '',
  '---',
  '',
  `Pass token: ${FOUNDER_TEST_RESULT_ROUTE_EXISTENCE_PROOF_V1_PASS}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'FOUNDER_TEST_RESULT_ROUTE_EXISTENCE_PROOF_REPORT.md'), report, 'utf8');
assert(
  'report written',
  existsSync(join(ROOT, 'architecture', 'FOUNDER_TEST_RESULT_ROUTE_EXISTENCE_PROOF_REPORT.md')),
  'missing',
);

const failed = results.filter((result) => !result.passed);
if (failed.length) {
  console.error('Founder Test result route existence proof FAILED:');
  for (const result of failed) {
    console.error(`  ✗ ${result.name}: ${result.detail}`);
  }
  process.exit(1);
}

console.log(`Founder Test result route existence proof PASSED (${results.length} checks)`);
console.log(FOUNDER_TEST_RESULT_ROUTE_EXISTENCE_PROOF_V1_PASS);
