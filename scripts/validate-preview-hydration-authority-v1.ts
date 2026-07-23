/**
 * Preview Hydration Authority V1 — readiness handshake, identity binding, false-positive guard.
 */
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PREVIEW_READY_SELECTOR,
  PREVIEW_READY_ATTR,
  ensurePreviewReadinessHandshake,
  htmlSignalsPreviewReady,
  readPreviewProjectIdFromHtml,
  classifyPreviewDomFailure,
} from '../src/end-to-end-build-reality-engine-v1/preview-readiness-contract.js';
import { stampPreviewWorkspaceIdentity } from '../src/end-to-end-build-reality-engine-v1/preview-workspace-identity.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
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

const dir = mkdtempSync(join(tmpdir(), 'aidev-preview-hydrate-'));
const srcDir = join(dir, 'src');
mkdirSync(srcDir, { recursive: true });

writeFileSync(
  join(dir, 'index.html'),
  `<!DOCTYPE html><html><head><title>Test</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
);
writeFileSync(
  join(srcDir, 'App.tsx'),
  `export default function App(){return <main data-direct-feature-app="true" data-root-feature="demo">Demo</main>}`,
);
writeFileSync(
  join(srcDir, 'main.tsx'),
  `import { createRoot } from 'react-dom/client';\nimport App from './App';\ncreateRoot(document.getElementById('root')!).render(<App />);\n`,
);

const stamped = stampPreviewWorkspaceIdentity({
  workspaceDir: dir,
  workspaceHash: 'abc123hashfingerprint0001',
  projectId: 'demo-project-1',
});
check('stampPreviewWorkspaceIdentity returns identity', Boolean(stamped));
const mainAfter = readFileSync(join(srcDir, 'main.tsx'), 'utf8');
check('handshake injected into main.tsx', mainAfter.includes('AIDEVENGINE_PREVIEW_READINESS_HANDSHAKE_V1'));
check('handshake sets preview-ready attr', mainAfter.includes(PREVIEW_READY_ATTR));
check('handshake binds project id', mainAfter.includes('demo-project-1'));

const indexHtml = readFileSync(join(dir, 'index.html'), 'utf8');
check('index has project-id meta', indexHtml.includes('aidevengine-project-id'));

const handshake = ensurePreviewReadinessHandshake({
  workspaceDir: dir,
  projectId: 'demo-project-2',
  workspaceHash: 'hash-two',
});
check('handshake re-stamp succeeds', handshake.patched === true);
const mainV2 = readFileSync(join(srcDir, 'main.tsx'), 'utf8');
check('re-stamp updates project id', mainV2.includes('demo-project-2'));

const hydratedHtml = `<html ${PREVIEW_READY_ATTR}="1" data-aidev-project-id="demo-project-2"><body><main data-direct-feature-app="true"></main></body></html>`;
check('htmlSignalsPreviewReady true for hydrated', htmlSignalsPreviewReady(hydratedHtml));
check(
  'readPreviewProjectIdFromHtml',
  readPreviewProjectIdFromHtml(hydratedHtml) === 'demo-project-2',
);

const shellHtml = `<html><body><div id="root"></div></body></html>`;
check('htmlSignalsPreviewReady false for shell', !htmlSignalsPreviewReady(shellHtml));
check(
  'shell classified HTML_SHELL_NOT_HYDRATED',
  classifyPreviewDomFailure({
    html: shellHtml,
    bodyText: '',
    expectedProjectId: 'demo-project-2',
    httpOk: true,
  }) === 'HTML_SHELL_NOT_HYDRATED',
);
check(
  'wrong identity classified',
  classifyPreviewDomFailure({
    html: hydratedHtml.replace('demo-project-2', 'other-project'),
    bodyText: 'demo',
    expectedProjectId: 'demo-project-2',
    httpOk: true,
  }) === 'WRONG_PREVIEW_IDENTITY',
);
check(
  'unavailable classified',
  classifyPreviewDomFailure({
    html: '',
    bodyText: '',
    expectedProjectId: 'x',
    httpOk: false,
  }) === 'PREVIEW_SERVER_UNAVAILABLE',
);

const auditSrc = readFileSync(
  join(ROOT, 'src/end-to-end-build-reality-engine-v1/preview-authority-audit.ts'),
  'utf8',
);
check('authority waits for PREVIEW_READY_SELECTOR', auditSrc.includes('PREVIEW_READY_SELECTOR'));
check('authority documents bare-root pitfall', auditSrc.includes('never treat bare #root'));
check('authority compares project id', auditSrc.includes('preview-project-identity-aligned'));
check('selector export stable', PREVIEW_READY_SELECTOR.includes('data-aidev-preview-ready'));

const runnerSrc = readFileSync(
  join(ROOT, 'src/end-to-end-build-reality-engine-v1/e2e-dom-reality-runner.ts'),
  'utf8',
);
check('playwright goto waits for readiness attr', runnerSrc.includes('data-aidev-preview-ready'));

const viteMgrSrc = readFileSync(
  join(ROOT, 'src/one-prompt-live-preview/generated-dev-server-manager.ts'),
  'utf8',
);
check('vite manager stamps handshake before spawn', viteMgrSrc.includes('ensureHandshakeBeforeVite'));
const handshakeCallIdx = viteMgrSrc.indexOf('ensureHandshakeBeforeVite(input.workspaceDir');
const spawnCallIdx = viteMgrSrc.indexOf('resolveViteDevSpawnTarget(input.workspaceDir)');
check(
  'vite stamp runs before resolveViteDevSpawnTarget',
  handshakeCallIdx >= 0 &&
    spawnCallIdx >= 0 &&
    handshakeCallIdx < spawnCallIdx &&
    viteMgrSrc.includes('stampPreviewWorkspaceIdentity'),
);
check(
  'vite stamp never invents pre-vite placeholder hash',
  !viteMgrSrc.includes('pre-vite-${') && viteMgrSrc.includes('resolvePreviewWorkspaceHash'),
);

const e2eAuthSrc = readFileSync(
  join(ROOT, 'src/end-to-end-build-reality-engine-v1/e2e-build-reality-authority.ts'),
  'utf8',
);
check('preview audit uses isolated browser context', e2eAuthSrc.includes('browser.newContext'));
check('isolated context blocks service workers', e2eAuthSrc.includes("serviceWorkers: 'block'"));

const auditSrcFull = readFileSync(
  join(ROOT, 'src/end-to-end-build-reality-engine-v1/preview-authority-audit.ts'),
  'utf8',
);
check(
  'fetch-only path is BROWSER_AUTOMATION_FAILURE not false unhydrated',
  auditSrcFull.includes("readinessClass: 'BROWSER_AUTOMATION_FAILURE'") &&
    auditSrcFull.includes('browserDomInspected'),
);
check(
  'initial DOM contract not critically failed without Playwright page',
  auditSrcFull.includes('critical: browserDomInspected'),
);

try {
  rmSync(dir, { recursive: true, force: true });
} catch {
  /* ignore */
}

console.log('');
console.log(`${passed}/${passed + failed} checks passed`);
if (failed > 0) process.exit(1);
console.log('AIDEVENGINE_PREVIEW_HYDRATION_AUTHORITY_V1_PASS');
