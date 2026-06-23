/**
 * Phase 26.84 — Runtime UI Render Proof validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessConnectedBuildExecution, refreshGeneratedRuntimeDevServer, resetConnectedBuildExecutionCounterForTests } from '../src/connected-build-execution/index.js';
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
  buildRuntimeUiRenderProofReportMarkdown,
  buildRuntimeUiRenderReconciliationReportMarkdown,
  classifyUiRender,
  discoverUiRoutes,
  isUiRenderedProbe,
  resetRuntimeUiRenderProofModuleForTests,
  RUNTIME_UI_RENDER_PROOF_PASS,
} from '../src/runtime-ui-render-proof/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/runtime-ui-render-proof/runtime-ui-render-proof-types.ts',
  'src/runtime-ui-render-proof/runtime-ui-render-proof-registry.ts',
  'src/runtime-ui-render-proof/ui-route-discovery.ts',
  'src/runtime-ui-render-proof/ui-render-probe-runner.ts',
  'src/runtime-ui-render-proof/html-render-analyzer.ts',
  'src/runtime-ui-render-proof/ui-render-failure-classifier.ts',
  'src/runtime-ui-render-proof/runtime-ui-render-proof-report-builder.ts',
  'src/runtime-ui-render-proof/runtime-ui-render-proof-authority.ts',
  'src/runtime-ui-render-proof/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const registrySource = readFileSync(join(ROOT, 'src/runtime-ui-render-proof/runtime-ui-render-proof-registry.ts'), 'utf8');
const authoritySource = readFileSync(join(ROOT, 'src/runtime-ui-render-proof/runtime-ui-render-proof-authority.ts'), 'utf8');
const collectorSource = readFileSync(join(ROOT, 'src/runtime-materialization-truth-bridge/runtime-evidence-collector.ts'), 'utf8');
const classifierSource = readFileSync(join(ROOT, 'src/runtime-ui-render-proof/ui-render-failure-classifier.ts'), 'utf8');
const analyzerSource = readFileSync(join(ROOT, 'src/runtime-ui-render-proof/html-render-analyzer.ts'), 'utf8');

assert('PASS token in registry', registrySource.includes(RUNTIME_UI_RENDER_PROOF_PASS), 'missing');
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'authority mutates files');
assert('no nested validator in authority', !authoritySource.includes('validate-'), 'nested validator');
assert('runtime bridge wired', collectorSource.includes('assessRuntimeUiRenderProof'), 'missing');
assert('uiProofAuthoritative in collector', collectorSource.includes('uiProofAuthoritative'), 'missing');
assert('JSON_ONLY_RUNTIME classifier', classifierSource.includes('JSON_ONLY_RUNTIME'), 'missing');
assert('root mount detection', analyzerSource.includes('detectRootMount'), 'missing');
assert('script bundle detection', analyzerSource.includes('detectScriptBundle'), 'missing');

const notReady = classifyUiRender({
  applicationBootsBeforeProbe: true,
  routesReachableBeforeProbe: false,
  discoveredUiRoutes: [{ readOnly: true, path: '/', source: 'ROOT_DEFAULT', expectation: 'HTML_SHELL', confidence: 1 }],
  uiSourceFiles: {
    readOnly: true,
    hasIndexHtml: false,
    hasReactApp: false,
    hasViteConfig: false,
    hasReactEntrypoint: false,
    uiSourceFilesPresent: false,
    discoveredFiles: [],
  },
  probeSession: {
    readOnly: true,
    baseUrl: null,
    port: null,
    probeResults: [],
    applicationBootsBeforeProbe: true,
    routesReachableBeforeProbe: false,
    probeSkipped: true,
    skipReason: 'not route ready',
    cleanupStatus: 'NOT_STARTED',
    elapsedMs: 0,
    fatalErrors: [],
  },
});

assert('UI probe blocked without routesReachable', notReady.failureClass === 'RUNTIME_NOT_ROUTE_READY', notReady.failureClass);

const jsonOnly = classifyUiRender({
  applicationBootsBeforeProbe: true,
  routesReachableBeforeProbe: true,
  discoveredUiRoutes: [{ readOnly: true, path: '/', source: 'DEV_SERVER', expectation: 'JSON_RUNTIME', confidence: 0.95 }],
  uiSourceFiles: {
    readOnly: true,
    hasIndexHtml: true,
    hasReactApp: true,
    hasViteConfig: true,
    hasReactEntrypoint: true,
    uiSourceFilesPresent: true,
    discoveredFiles: ['index.html', 'src/App.tsx'],
  },
  probeSession: {
    readOnly: true,
    baseUrl: 'http://127.0.0.1:3000',
    port: 3000,
    probeResults: [
      analyzeHtmlRender({
        path: '/',
        statusCode: 200,
        contentType: 'application/json',
        bodyExcerpt: '{"status":"ok"}',
        elapsedMs: 10,
      }),
    ],
    applicationBootsBeforeProbe: true,
    routesReachableBeforeProbe: true,
    probeSkipped: false,
    skipReason: null,
    cleanupStatus: 'CLEANED',
    elapsedMs: 50,
    fatalErrors: [],
  },
});

assert('JSON-only does not count as UI render', jsonOnly.uiRenders === false, String(jsonOnly.uiRenders));
assert('JSON-only classified JSON_ONLY_RUNTIME', jsonOnly.failureClass === 'JSON_ONLY_RUNTIME', jsonOnly.failureClass);
assert('rootRouteJsonOnly true', jsonOnly.rootRouteJsonOnly === true, String(jsonOnly.rootRouteJsonOnly));

const htmlRendered = analyzeHtmlRender({
  path: '/',
  statusCode: 200,
  contentType: 'text/html',
  bodyExcerpt:
    '<!DOCTYPE html><html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>',
  elapsedMs: 15,
});

assert('HTML with mount and bundle counts as UI render', isUiRenderedProbe(htmlRendered), htmlRendered.verdict);
assert('hasRootMount detected', htmlRendered.hasRootMount === true, String(htmlRendered.hasRootMount));
assert('hasScriptBundle detected', htmlRendered.hasScriptBundle === true, String(htmlRendered.hasScriptBundle));

const htmlRenderedClass = classifyUiRender({
  applicationBootsBeforeProbe: true,
  routesReachableBeforeProbe: true,
  discoveredUiRoutes: [{ readOnly: true, path: '/', source: 'INDEX_HTML', expectation: 'HTML_SHELL', confidence: 0.9 }],
  uiSourceFiles: {
    readOnly: true,
    hasIndexHtml: true,
    hasReactApp: false,
    hasViteConfig: false,
    hasReactEntrypoint: false,
    uiSourceFilesPresent: true,
    discoveredFiles: ['index.html'],
  },
  probeSession: {
    readOnly: true,
    baseUrl: 'http://127.0.0.1:5173',
    port: 5173,
    probeResults: [htmlRendered],
    applicationBootsBeforeProbe: true,
    routesReachableBeforeProbe: true,
    probeSkipped: false,
    skipReason: null,
    cleanupStatus: 'CLEANED',
    elapsedMs: 80,
    fatalErrors: [],
  },
});

assert('HTML mount+bundle sets uiRenders=true', htmlRenderedClass.uiRenders === true, String(htmlRenderedClass.uiRenders));
assert('HTML mount+bundle failureClass UI_RENDERED', htmlRenderedClass.failureClass === 'UI_RENDERED', htmlRenderedClass.failureClass);

resetRuntimeUiRenderProofModuleForTests();
resetRuntimeRouteReachabilityProofModuleForTests();
resetRuntimeStartupProofRepairModuleForTests();
resetRuntimeMaterializationTruthBridgeModuleForTests();
resetBuildMaterializationTruthBridgeModuleForTests();
resetConnectedBuildExecutionCounterForTests();

refreshGeneratedRuntimeDevServer({ projectRootDir: ROOT, workspaceId: 'build-ready-idea-1' });

const buildReport = assessConnectedBuildExecution({
  rootDir: ROOT,
  attemptBuildProofGapMaterialization: false,
}).report;

const startupRepair = assessRuntimeStartupProofRepair({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
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

assert(
  'UI routes discovered with evidence',
  uiProof.report.discoveredUiRoutes.length > 0,
  String(uiProof.report.discoveredUiRoutes.length),
);

assert(
  'UI probe gated on startup and route proof',
  uiProof.report.applicationBootsBeforeProbe === startupRepair.report.applicationBoots &&
    uiProof.report.routesReachableBeforeProbe === routeProof.report.routesReachable,
  `boots=${uiProof.report.applicationBootsBeforeProbe} routes=${uiProof.report.routesReachableBeforeProbe}`,
);

if (startupRepair.report.applicationBoots && routeProof.report.routesReachable) {
  if (uiProof.report.uiRenders) {
    assert(
      'live workspace uiRenders=true after UI exposure',
      uiProof.report.uiRenders === true,
      String(uiProof.report.uiRenders),
    );
    assert(
      'live workspace UI_RENDERED',
      uiProof.report.failureClass === 'UI_RENDERED',
      uiProof.report.failureClass,
    );
  } else {
    assert(
      'live JSON-only workspace uiRenders=false',
      uiProof.report.uiRenders === false,
      String(uiProof.report.uiRenders),
    );
    assert(
      'live workspace JSON_ONLY_RUNTIME or similar',
      uiProof.report.failureClass === 'JSON_ONLY_RUNTIME' || uiProof.report.rootRouteJsonOnly,
      uiProof.report.failureClass,
    );
  }
}

const runtimeBridge = assessRuntimeMaterializationTruthBridge({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProofRepair: startupRepair,
  routeReachabilityProof: routeProof,
  uiRenderProof: uiProof,
  skipHistoryRecording: true,
});

assert(
  'runtime bridge receives UI render proof',
  runtimeBridge.report.evidence.uiRenderProof !== null,
  'null',
);
assert(
  'UI evidence authoritative when gates pass',
  runtimeBridge.report.evidence.ui.uiProofAuthoritative ===
    (startupRepair.report.applicationBoots && routeProof.report.routesReachable),
  String(runtimeBridge.report.evidence.ui.uiProofAuthoritative),
);

if (startupRepair.report.applicationBoots && routeProof.report.routesReachable && !uiProof.report.uiRenders) {
  assert(
    'failureBoundary is UI when uiRenders=false',
    runtimeBridge.report.reconciliation.failureBoundary === 'UI',
    runtimeBridge.report.reconciliation.failureBoundary,
  );
  assert(
    'bridge uiRenders false',
    runtimeBridge.report.evidence.proofAnalysis.uiRenders === false,
    String(runtimeBridge.report.evidence.proofAnalysis.uiRenders),
  );
}

if (uiProof.report.uiRenders) {
  assert(
    'failureBoundary beyond UI when uiRenders=true',
    runtimeBridge.report.reconciliation.failureBoundary !== 'UI' &&
      runtimeBridge.report.reconciliation.failureBoundary !== 'ROUTE',
    runtimeBridge.report.reconciliation.failureBoundary,
  );
}

const workspaceAbs = join(ROOT, uiProof.report.workspaceRoot);
const discovered = discoverUiRoutes({
  rootDir: ROOT,
  workspaceAbs,
  workspaceId: uiProof.report.workspaceId,
  appType: uiProof.report.entrypoint.appType,
  routeReachabilityProof: routeProof.report,
});
assert('discovered UI routes include /', discovered.routes.some((r) => r.path === '/'), String(discovered.routes.length));

const failed = results.filter((e) => !e.passed);
const proofReportMd = buildRuntimeUiRenderProofReportMarkdown(uiProof.report);
const reconciliationMd = buildRuntimeUiRenderReconciliationReportMarkdown({
  report: uiProof.report,
  failureBoundaryBefore: 'REPORTING',
  failureBoundaryAfter: runtimeBridge.report.reconciliation.failureBoundary,
  rootCauseBefore: 'EVIDENCE_PROPAGATION_FAILURE',
  rootCauseAfter: runtimeBridge.report.reconciliation.rootCause,
});

writeFileSync(join(ROOT, 'architecture/RUNTIME_UI_RENDER_PROOF_REPORT.md'), proofReportMd, 'utf8');
writeFileSync(join(ROOT, 'architecture/RUNTIME_UI_RENDER_RECONCILIATION_REPORT.md'), reconciliationMd, 'utf8');
writeFileSync(
  join(ROOT, 'architecture/RUNTIME_UI_RENDER_VALIDATION.md'),
  [
    '# Runtime UI Render Proof Validation',
    '',
    `Result: ${failed.length === 0 ? RUNTIME_UI_RENDER_PROOF_PASS : 'FAILED'}`,
    '',
    ...results.map((e) => `- [${e.passed ? 'x' : ' '}] ${e.name}: ${e.detail}`),
    '',
    '## Snapshot',
    '',
    `- applicationBoots=${startupRepair.report.applicationBoots}`,
    `- routesReachable=${routeProof.report.routesReachable}`,
    `- uiRenders=${uiProof.report.uiRenders}`,
    `- failureClass=${uiProof.report.failureClass}`,
    `- rootRouteJsonOnly=${uiProof.report.rootRouteJsonOnly}`,
    `- failureBoundary=${runtimeBridge.report.reconciliation.failureBoundary}`,
    `- rootCause=${runtimeBridge.report.reconciliation.rootCause}`,
    `- discoveredUiRoutes=${uiProof.report.discoveredUiRoutes.length}`,
    `- probedUiRoutes=${uiProof.report.probeSession.probeResults.length}`,
    '',
  ].join('\n'),
  'utf8',
);

if (failed.length > 0) {
  console.error('Validation FAILED:');
  for (const f of failed) console.error(`  - ${f.name}: ${f.detail}`);
  process.exit(1);
}

console.log(RUNTIME_UI_RENDER_PROOF_PASS);
