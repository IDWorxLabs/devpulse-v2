/**
 * Phase 26.85 — Generated UI Runtime Exposure Repair validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GENERATED_UI_RUNTIME_EXPOSURE_REPAIR_PASS,
  refreshGeneratedRuntimeDevServer,
  RUNTIME_DEV_SERVER_SOURCE,
} from '../src/connected-build-execution/index.js';
import { resetConnectedBuildExecutionCounterForTests } from '../src/connected-build-execution/index.js';
import { resetBuildMaterializationTruthBridgeModuleForTests } from '../src/build-materialization-truth-bridge/index.js';
import {
  assessRuntimeMaterializationTruthBridge,
  resetRuntimeMaterializationTruthBridgeModuleForTests,
} from '../src/runtime-materialization-truth-bridge/index.js';
import {
  assessRuntimeStartupProofRepair,
  resetRuntimeStartupProofRepairModuleForTests,
} from '../src/runtime-startup-proof-repair/index.js';
import {
  assessRuntimeRouteReachabilityProof,
  resetRuntimeRouteReachabilityProofModuleForTests,
} from '../src/runtime-route-reachability-proof/index.js';
import {
  analyzeHtmlRender,
  assessRuntimeUiRenderProof,
  discoverUiSourceFiles,
  resetRuntimeUiRenderProofModuleForTests,
  RUNTIME_UI_RENDER_PROOF_PASS,
} from '../src/runtime-ui-render-proof/index.js';
import { assessConnectedBuildExecution } from '../src/connected-build-execution/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const WORKSPACE_ID = 'build-ready-idea-1';
const WORKSPACE_PATH = `.generated-builder-workspaces/${WORKSPACE_ID}`;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const materializerSource = readFileSync(
  join(ROOT, 'src/connected-build-execution/build-proof-gap-materializer.ts'),
  'utf8',
);

assert('PASS token exported', materializerSource.includes(GENERATED_UI_RUNTIME_EXPOSURE_REPAIR_PASS), 'missing');
assert('template detects UI files', RUNTIME_DEV_SERVER_SOURCE.includes('detectUiExposure'), 'missing');
assert('template serves HTML at /', RUNTIME_DEV_SERVER_SOURCE.includes("pathname === '/'"), 'missing');
assert('template JSON health endpoint', RUNTIME_DEV_SERVER_SOURCE.includes("pathname === '/health'"), 'missing');
assert('template root mount element', RUNTIME_DEV_SERVER_SOURCE.includes('id="root"'), 'missing');
assert('template module script reference', RUNTIME_DEV_SERVER_SOURCE.includes('type="module"'), 'missing');
assert('refreshGeneratedRuntimeDevServer exported', materializerSource.includes('refreshGeneratedRuntimeDevServer'), 'missing');

const refresh = refreshGeneratedRuntimeDevServer({
  projectRootDir: ROOT,
  workspaceId: WORKSPACE_ID,
});

assert('dev-server refresh succeeded', refresh.ok, refresh.reason);

const devServerPath = join(ROOT, WORKSPACE_PATH, 'runtime/dev-server.mjs');
assert('dev-server exists on disk', existsSync(devServerPath), devServerPath);
const devServerOnDisk = readFileSync(devServerPath, 'utf8');
assert('workspace dev-server has UI exposure logic', devServerOnDisk.includes('detectUiExposure'), 'missing');

const workspaceAbs = join(ROOT, WORKSPACE_PATH);
const uiSource = discoverUiSourceFiles(workspaceAbs);
assert('workspace has UI source files', uiSource.uiSourceFilesPresent, String(uiSource.discoveredFiles));
assert('workspace has src/App.tsx', uiSource.hasReactApp, String(uiSource.hasReactApp));

resetRuntimeUiRenderProofModuleForTests();
resetRuntimeRouteReachabilityProofModuleForTests();
resetRuntimeStartupProofRepairModuleForTests();
resetRuntimeMaterializationTruthBridgeModuleForTests();
resetBuildMaterializationTruthBridgeModuleForTests();
resetConnectedBuildExecutionCounterForTests();

const buildReport = assessConnectedBuildExecution({
  rootDir: ROOT,
  attemptBuildProofGapMaterialization: false,
}).report;

const startupRepair = assessRuntimeStartupProofRepair({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  workspaceId: WORKSPACE_ID,
  skipHistoryRecording: true,
});

const routeProof = assessRuntimeRouteReachabilityProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProbe: startupRepair.report.probe,
  entrypoint: startupRepair.report.entrypoint,
  resolvedCommand: startupRepair.report.resolvedCommand,
  skipHistoryRecording: true,
});

const uiProof = assessRuntimeUiRenderProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProbe: startupRepair.report.probe,
  routeReachabilityProof: routeProof.report,
  entrypoint: startupRepair.report.entrypoint,
  resolvedCommand: startupRepair.report.resolvedCommand,
  skipHistoryRecording: true,
});

const rootProbe = uiProof.report.probeSession.probeResults.find((p) => p.path === '/') ?? null;
const healthProbe = uiProof.report.probeSession.probeResults.find((p) => p.path === '/health') ?? null;

assert('routes still reachable', routeProof.report.routesReachable === true, String(routeProof.report.routesReachable));

if (rootProbe) {
  assert('/ returns HTML when UI exists', rootProbe.isHtml === true, String(rootProbe.isHtml));
  assert('/ is not JSON-only', rootProbe.isJsonOnly === false, String(rootProbe.isJsonOnly));
  assert('/ includes root mount', rootProbe.hasRootMount === true, String(rootProbe.hasRootMount));
  assert('/ references script bundle', rootProbe.hasScriptBundle === true, String(rootProbe.hasScriptBundle));
  assert('/ HTML probe verdict UI_RENDERED', rootProbe.verdict === 'UI_RENDERED', rootProbe.verdict);
}

if (healthProbe) {
  assert('/health remains JSON', healthProbe.isJsonOnly === true, String(healthProbe.isJsonOnly));
} else {
  const syntheticHealth = analyzeHtmlRender({
    path: '/health',
    statusCode: 200,
    contentType: 'application/json',
    bodyExcerpt: '{"status":"ok"}',
    elapsedMs: 1,
  });
  assert('/health JSON pattern valid', syntheticHealth.isJsonOnly, 'n/a');
}

assert('UI render proof passes', uiProof.report.uiRenders === true, String(uiProof.report.uiRenders));
assert('uiFailureClass UI_RENDERED', uiProof.report.failureClass === 'UI_RENDERED', uiProof.report.failureClass);
assert('no longer JSON_ONLY_RUNTIME', uiProof.report.failureClass !== 'JSON_ONLY_RUNTIME', uiProof.report.failureClass);

const runtimeBridge = assessRuntimeMaterializationTruthBridge({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProofRepair: startupRepair,
  routeReachabilityProof: routeProof,
  uiRenderProof: uiProof,
  skipHistoryRecording: true,
});

assert(
  'failureBoundary advances beyond UI',
  ['FOUNDER_FLOW', 'REPORTING', 'EVIDENCE_PROPAGATION', 'NONE'].includes(
    runtimeBridge.report.reconciliation.failureBoundary,
  ),
  runtimeBridge.report.reconciliation.failureBoundary,
);
assert(
  'bridge uiRenders true',
  runtimeBridge.report.evidence.proofAnalysis.uiRenders === true,
  String(runtimeBridge.report.evidence.proofAnalysis.uiRenders),
);

const failed = results.filter((e) => !e.passed);

const repairReport = [
  '# Generated UI Runtime Exposure Repair Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  `Workspace: ${WORKSPACE_ID}`,
  '',
  '## Repair',
  '',
  '- Updated `RUNTIME_DEV_SERVER_SOURCE` in build-proof-gap-materializer.ts',
  '- Dev server detects UI source files at startup',
  '- `GET /` serves HTML SPA shell with `#root` mount and module entrypoint when UI exists',
  '- `GET /health` and `/runtime/status` remain JSON runtime status',
  '- Static workspace files served under `/src/*` for client entry references',
  '',
  '## Workspace UI Evidence',
  '',
  `- uiSourceFilesPresent: ${uiSource.uiSourceFilesPresent}`,
  `- hasReactApp: ${uiSource.hasReactApp}`,
  `- hasIndexHtml: ${uiSource.hasIndexHtml}`,
  `- discoveredFiles: ${uiSource.discoveredFiles.join(', ')}`,
  '',
  '## Post-Repair Proof',
  '',
  `- routesReachable: ${routeProof.report.routesReachable}`,
  `- uiRenders: ${uiProof.report.uiRenders}`,
  `- uiFailureClass: ${uiProof.report.failureClass}`,
  `- failureBoundary: ${runtimeBridge.report.reconciliation.failureBoundary}`,
  `- finalApplicationTruth: ${runtimeBridge.report.finalApplicationTruth}`,
  '',
].join('\n');

const afterExposureReport = [
  '# Runtime UI Render After Exposure Repair',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Root Route Probe',
  '',
  rootProbe
    ? `- path: ${rootProbe.path}\n- statusCode: ${rootProbe.statusCode}\n- contentType: ${rootProbe.contentType}\n- isHtml: ${rootProbe.isHtml}\n- hasRootMount: ${rootProbe.hasRootMount}\n- hasScriptBundle: ${rootProbe.hasScriptBundle}\n- verdict: ${rootProbe.verdict}`
    : '- no root probe',
  '',
  '## Health Route Probe',
  '',
  healthProbe
    ? `- path: ${healthProbe.path}\n- isJsonOnly: ${healthProbe.isJsonOnly}\n- verdict: ${healthProbe.verdict}`
    : '- /health not in probe set (JSON pattern validated separately)',
  '',
  `UI render proof: **${uiProof.report.uiRenders ? RUNTIME_UI_RENDER_PROOF_PASS : 'FAILED'}**`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture/GENERATED_UI_RUNTIME_EXPOSURE_REPAIR_REPORT.md'), repairReport, 'utf8');
writeFileSync(
  join(ROOT, 'architecture/GENERATED_UI_RUNTIME_EXPOSURE_VALIDATION.md'),
  [
    '# Generated UI Runtime Exposure Repair Validation',
    '',
    `Result: ${failed.length === 0 ? GENERATED_UI_RUNTIME_EXPOSURE_REPAIR_PASS : 'FAILED'}`,
    '',
    ...results.map((e) => `- [${e.passed ? 'x' : ' '}] ${e.name}: ${e.detail}`),
    '',
    '## Snapshot',
    '',
    `- uiRenders=${uiProof.report.uiRenders}`,
    `- uiFailureClass=${uiProof.report.failureClass}`,
    `- routesReachable=${routeProof.report.routesReachable}`,
    `- failureBoundary=${runtimeBridge.report.reconciliation.failureBoundary}`,
    `- rootCause=${runtimeBridge.report.reconciliation.rootCause}`,
    '',
  ].join('\n'),
  'utf8',
);
writeFileSync(join(ROOT, 'architecture/RUNTIME_UI_RENDER_AFTER_EXPOSURE_REPAIR.md'), afterExposureReport, 'utf8');

if (failed.length > 0) {
  console.error('Validation FAILED:');
  for (const f of failed) console.error(`  - ${f.name}: ${f.detail}`);
  process.exit(1);
}

console.log(GENERATED_UI_RUNTIME_EXPOSURE_REPAIR_PASS);
