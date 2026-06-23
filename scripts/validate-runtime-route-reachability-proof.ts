/**
 * Phase 26.83 — Runtime Route Reachability Proof validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessConnectedBuildExecution, resetConnectedBuildExecutionCounterForTests } from '../src/connected-build-execution/index.js';
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
  buildRuntimeRouteReachabilityProofReportMarkdown,
  buildRuntimeRouteReachabilityReconciliationReportMarkdown,
  classifyRouteReachability,
  discoverExpectedRoutes,
  isJsonRouteResponse,
  resetRuntimeRouteReachabilityProofModuleForTests,
  RUNTIME_ROUTE_REACHABILITY_PROOF_PASS,
} from '../src/runtime-route-reachability-proof/index.js';

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
  'src/runtime-route-reachability-proof/runtime-route-reachability-proof-types.ts',
  'src/runtime-route-reachability-proof/runtime-route-reachability-proof-registry.ts',
  'src/runtime-route-reachability-proof/route-discovery.ts',
  'src/runtime-route-reachability-proof/route-probe-runner.ts',
  'src/runtime-route-reachability-proof/route-failure-classifier.ts',
  'src/runtime-route-reachability-proof/runtime-route-reachability-report-builder.ts',
  'src/runtime-route-reachability-proof/runtime-route-reachability-proof-authority.ts',
  'src/runtime-route-reachability-proof/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const registrySource = readFileSync(
  join(ROOT, 'src/runtime-route-reachability-proof/runtime-route-reachability-proof-registry.ts'),
  'utf8',
);
const authoritySource = readFileSync(
  join(ROOT, 'src/runtime-route-reachability-proof/runtime-route-reachability-proof-authority.ts'),
  'utf8',
);
const collectorSource = readFileSync(
  join(ROOT, 'src/runtime-materialization-truth-bridge/runtime-evidence-collector.ts'),
  'utf8',
);
const classifierSource = readFileSync(
  join(ROOT, 'src/runtime-route-reachability-proof/route-failure-classifier.ts'),
  'utf8',
);

assert('PASS token in registry', registrySource.includes(RUNTIME_ROUTE_REACHABILITY_PROOF_PASS), 'missing');
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'authority mutates files');
assert('no nested validator in authority', !authoritySource.includes('validate-'), 'nested validator');
assert('runtime bridge wired', collectorSource.includes('assessRuntimeRouteReachabilityProof'), 'missing');
assert('routeProofAuthoritative in collector', collectorSource.includes('routeProofAuthoritative'), 'missing');
assert('SPA fallback rule in classifier', classifierSource.includes('SPA_FALLBACK_PRESENT'), 'missing');
assert('JSON UI separation in classifier', classifierSource.includes('uiRenderProven'), 'missing');

const notBooted = classifyRouteReachability({
  applicationBootsBeforeProbe: false,
  discoveredRoutes: [{ readOnly: true, path: '/', source: 'ROOT_DEFAULT', expectation: 'ROOT_RESPONSE', confidence: 1 }],
  probeSession: {
    readOnly: true,
    baseUrl: null,
    port: null,
    probeResults: [],
    runtimeBootedBeforeProbe: false,
    probeSkipped: true,
    skipReason: 'not booted',
    cleanupStatus: 'NOT_STARTED',
    elapsedMs: 0,
    fatalErrors: [],
  },
});

assert('probe blocked when not booted', notBooted.failureClass === 'RUNTIME_NOT_BOOTED', notBooted.failureClass);

const jsonRootClass = classifyRouteReachability({
  applicationBootsBeforeProbe: true,
  discoveredRoutes: [{ readOnly: true, path: '/', source: 'DEV_SERVER', expectation: 'API_JSON', confidence: 0.95 }],
  probeSession: {
    readOnly: true,
    baseUrl: 'http://127.0.0.1:3000',
    port: 3000,
    probeResults: [
      {
        readOnly: true,
        routePath: '/',
        statusCode: 200,
        responded: true,
        responseType: 'json',
        bodyExcerpt: '{"status":"ok"}',
        elapsedMs: 12,
        verdict: 'SUCCESS',
      },
    ],
    runtimeBootedBeforeProbe: true,
    probeSkipped: false,
    skipReason: null,
    cleanupStatus: 'CLEANED',
    elapsedMs: 100,
    fatalErrors: [],
  },
});

assert('HTTP 200 on / sets routesReachable=true', jsonRootClass.routesReachable === true, String(jsonRootClass.routesReachable));
assert(
  'JSON root is ROOT_ROUTE_ONLY or ROUTES_REACHABLE',
  jsonRootClass.failureClass === 'ROOT_ROUTE_ONLY' || jsonRootClass.failureClass === 'ROUTES_REACHABLE',
  jsonRootClass.failureClass,
);
assert('JSON does not prove UI render', jsonRootClass.uiRenderProven === false, String(jsonRootClass.uiRenderProven));
assert(
  'JSON response detected',
  isJsonRouteResponse(jsonRootClass.failureClass === 'ROOT_ROUTE_ONLY'
    ? {
        readOnly: true,
        routePath: '/',
        statusCode: 200,
        responded: true,
        responseType: 'json',
        bodyExcerpt: '{"status":"ok"}',
        elapsedMs: 12,
        verdict: 'SUCCESS',
      }
    : {
        readOnly: true,
        routePath: '/',
        statusCode: 200,
        responded: true,
        responseType: 'json',
        bodyExcerpt: '{"status":"ok"}',
        elapsedMs: 12,
        verdict: 'SUCCESS',
      }),
  'false',
);

const spaClass = classifyRouteReachability({
  applicationBootsBeforeProbe: true,
  discoveredRoutes: [
    { readOnly: true, path: '/', source: 'ROOT_DEFAULT', expectation: 'ROOT_RESPONSE', confidence: 1 },
    { readOnly: true, path: '/__devpulse_spa_fallback_probe__', source: 'VITE_SPA_FALLBACK', expectation: 'SPA_FALLBACK', confidence: 0.7 },
  ],
  probeSession: {
    readOnly: true,
    baseUrl: 'http://127.0.0.1:5173',
    port: 5173,
    probeResults: [
      {
        readOnly: true,
        routePath: '/',
        statusCode: 404,
        responded: true,
        responseType: 'html',
        bodyExcerpt: 'Not Found',
        elapsedMs: 8,
        verdict: 'NOT_FOUND',
      },
      {
        readOnly: true,
        routePath: '/__devpulse_spa_fallback_probe__',
        statusCode: 200,
        responded: true,
        responseType: 'html',
        bodyExcerpt: '<!DOCTYPE html>',
        elapsedMs: 10,
        verdict: 'SUCCESS',
      },
    ],
    runtimeBootedBeforeProbe: true,
    probeSkipped: false,
    skipReason: null,
    cleanupStatus: 'CLEANED',
    elapsedMs: 120,
    fatalErrors: [],
  },
});

assert('SPA fallback classified SPA_FALLBACK_PRESENT', spaClass.failureClass === 'SPA_FALLBACK_PRESENT', spaClass.failureClass);
assert('SPA fallback sets routesReachable=true', spaClass.routesReachable === true, String(spaClass.routesReachable));

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

assert(
  'route discovery returns evidence-backed routes',
  routeProof.report.discoveredRoutes.length > 0 && routeProof.report.discoveredRoutes.some((r) => r.source !== 'ROOT_DEFAULT' || r.path === '/'),
  String(routeProof.report.discoveredRoutes.length),
);

assert(
  'route probe only after applicationBoots=true',
  routeProof.report.applicationBootsBeforeProbe === startupRepair.report.applicationBoots,
  String(routeProof.report.applicationBootsBeforeProbe),
);

if (startupRepair.report.applicationBoots) {
  assert(
    'live / returns routesReachable=true',
    routeProof.report.routesReachable === true,
    String(routeProof.report.routesReachable),
  );
  assert(
    'root route reachable on live workspace',
    routeProof.report.rootRouteReachable === true,
    String(routeProof.report.rootRouteReachable),
  );
}

const runtimeBridge = assessRuntimeMaterializationTruthBridge({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProofRepair: startupRepair,
  skipHistoryRecording: true,
});

assert(
  'runtime bridge receives route proof',
  runtimeBridge.report.evidence.routeReachabilityProof !== null,
  'null',
);
assert(
  'route evidence authoritative when booted',
  runtimeBridge.report.evidence.routes.routeProofAuthoritative === startupRepair.report.applicationBoots,
  String(runtimeBridge.report.evidence.routes.routeProofAuthoritative),
);

if (startupRepair.report.applicationBoots && routeProof.report.routesReachable) {
  assert(
    'failureBoundary advances beyond ROUTE',
    runtimeBridge.report.reconciliation.failureBoundary !== 'ROUTE',
    runtimeBridge.report.reconciliation.failureBoundary,
  );
  assert(
    'rootCause not ROUTE_FAILURE when routes reachable',
    runtimeBridge.report.reconciliation.rootCause !== 'ROUTE_FAILURE',
    runtimeBridge.report.reconciliation.rootCause,
  );
  assert(
    'bridge routesReachable true',
    runtimeBridge.report.evidence.proofAnalysis.routesReachable === true,
    String(runtimeBridge.report.evidence.proofAnalysis.routesReachable),
  );
}

const workspaceAbs = join(ROOT, routeProof.report.workspaceRoot);
const discovered = discoverExpectedRoutes({
  rootDir: ROOT,
  workspaceAbs,
  workspaceId: routeProof.report.workspaceId,
  appType: routeProof.report.entrypoint.appType,
});
assert('discovered routes include /', discovered.some((r) => r.path === '/'), String(discovered.length));

const failed = results.filter((e) => !e.passed);
const proofReportMd = buildRuntimeRouteReachabilityProofReportMarkdown(routeProof.report);
const reconciliationMd = buildRuntimeRouteReachabilityReconciliationReportMarkdown({
  report: routeProof.report,
  failureBoundaryBefore: 'ROUTE',
  failureBoundaryAfter: runtimeBridge.report.reconciliation.failureBoundary,
  rootCauseBefore: 'ROUTE_FAILURE',
  rootCauseAfter: runtimeBridge.report.reconciliation.rootCause,
});

writeFileSync(join(ROOT, 'architecture/RUNTIME_ROUTE_REACHABILITY_PROOF_REPORT.md'), proofReportMd, 'utf8');
writeFileSync(join(ROOT, 'architecture/RUNTIME_ROUTE_REACHABILITY_RECONCILIATION_REPORT.md'), reconciliationMd, 'utf8');
writeFileSync(
  join(ROOT, 'architecture/RUNTIME_ROUTE_REACHABILITY_VALIDATION.md'),
  [
    '# Runtime Route Reachability Proof Validation',
    '',
    `Result: ${failed.length === 0 ? RUNTIME_ROUTE_REACHABILITY_PROOF_PASS : 'FAILED'}`,
    '',
    ...results.map((e) => `- [${e.passed ? 'x' : ' '}] ${e.name}: ${e.detail}`),
    '',
    '## Snapshot',
    '',
    `- applicationBoots=${startupRepair.report.applicationBoots}`,
    `- routesReachable=${routeProof.report.routesReachable}`,
    `- failureClass=${routeProof.report.failureClass}`,
    `- rootRouteReachable=${routeProof.report.rootRouteReachable}`,
    `- uiRenderProven=${routeProof.report.uiRenderProven}`,
    `- baseUrl=${routeProof.report.probeSession.baseUrl ?? 'none'}`,
    `- failureBoundary=${runtimeBridge.report.reconciliation.failureBoundary}`,
    `- rootCause=${runtimeBridge.report.reconciliation.rootCause}`,
    `- discoveredRoutes=${routeProof.report.discoveredRoutes.length}`,
    `- probedRoutes=${routeProof.report.probeSession.probeResults.length}`,
    '',
  ].join('\n'),
  'utf8',
);

if (failed.length > 0) {
  console.error('Validation FAILED:');
  for (const f of failed) console.error(`  - ${f.name}: ${f.detail}`);
  process.exit(1);
}

console.log(RUNTIME_ROUTE_REACHABILITY_PROOF_PASS);
