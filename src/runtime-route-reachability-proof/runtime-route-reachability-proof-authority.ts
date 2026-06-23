/**
 * Runtime Route Reachability Proof — authority orchestrator (Phase 26.83).
 * Read-only. No nested validators.
 */

import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import {
  discoverRuntimeEntrypoint,
  resolvePrimaryWorkspace,
} from '../runtime-startup-proof-repair/runtime-entrypoint-discovery.js';
import { resolveStartupCommand } from '../runtime-startup-proof-repair/runtime-start-command-resolver.js';
import { discoverExpectedRoutes } from './route-discovery.js';
import { runRouteProbeSession } from './route-probe-runner.js';
import { classifyRouteReachability } from './route-failure-classifier.js';
import {
  RUNTIME_ROUTE_REACHABILITY_PROOF_CACHE_KEY_PREFIX,
  RUNTIME_ROUTE_REACHABILITY_PROOF_CORE_QUESTION,
  RUNTIME_ROUTE_REACHABILITY_PROOF_PASS,
} from './runtime-route-reachability-proof-registry.js';
import type {
  AssessRuntimeRouteReachabilityProofInput,
  RuntimeRouteReachabilityProofAssessment,
  RuntimeRouteReachabilityProofReport,
} from './runtime-route-reachability-proof-types.js';
import type {
  ResolvedStartupCommand,
  RuntimeEntrypointCandidate,
  RuntimeStartupProbeResult,
} from '../runtime-startup-proof-repair/runtime-startup-proof-repair-types.js';

let proofCounter = 0;

export function resetRuntimeRouteReachabilityProofCounterForTests(): void {
  proofCounter = 0;
}

export function resetRuntimeRouteReachabilityProofModuleForTests(): void {
  resetRuntimeRouteReachabilityProofCounterForTests();
}

function nextProofId(): string {
  proofCounter += 1;
  return `runtime-route-reachability-proof-${proofCounter}-${Date.now()}`;
}

function stableCacheKey(proofId: string, failureClass: string, routesReachable: boolean): string {
  const digest = createHash('sha256')
    .update([RUNTIME_ROUTE_REACHABILITY_PROOF_PASS, proofId, failureClass, String(routesReachable)].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${RUNTIME_ROUTE_REACHABILITY_PROOF_CACHE_KEY_PREFIX}:${digest}`;
}

const emptyEntrypoint: RuntimeEntrypointCandidate = {
  readOnly: true,
  appType: 'UNKNOWN',
  workspaceRoot: 'none',
  workspaceId: 'none',
  startCommand: null,
  expectedPort: 4173,
  entryFile: null,
  confidence: 0,
  missingPrerequisites: ['no workspace resolved'],
  discoverySources: [],
};

const emptyResolved: ResolvedStartupCommand = {
  readOnly: true,
  command: null,
  cwd: 'none',
  expectedPort: 4173,
  entryFile: null,
  appType: 'UNKNOWN',
  evidenceSource: 'NO_COMMAND_FOUND',
  evidenceDetail: 'No command resolved',
  confidence: 0,
  resolved: false,
};

function buildRecommendations(input: {
  failureClass: string;
  routesReachable: boolean;
  uiRenderProven: boolean;
}): { recommendedFix: string; recommendedNextActions: string[] } {
  if (input.failureClass === 'RUNTIME_NOT_BOOTED') {
    return {
      recommendedFix: 'Complete startup proof before route reachability assessment.',
      recommendedNextActions: [
        'Run runtime startup proof repair until applicationBoots=true',
        'Re-run route reachability proof after boot confirmation',
      ],
    };
  }
  if (input.routesReachable && !input.uiRenderProven) {
    return {
      recommendedFix: 'Routes are reachable; advance failure boundary to UI render proof.',
      recommendedNextActions: [
        'Run preview experience proof for HTML/UI render',
        'Do not treat JSON health response as UI render proof',
      ],
    };
  }
  if (input.routesReachable) {
    return {
      recommendedFix: 'Routes reachable — continue founder flow and reporting proof.',
      recommendedNextActions: ['Verify UI render if HTML expected', 'Continue founder-critical workflow proof'],
    };
  }
  return {
    recommendedFix: 'Repair route configuration or runtime server routing.',
    recommendedNextActions: [
      'Inspect dev-server route handlers and build manifest routes',
      'Confirm expected port and base URL match startup probe',
      `Address failure class: ${input.failureClass}`,
    ],
  };
}

export function assessRuntimeRouteReachabilityProof(
  input: AssessRuntimeRouteReachabilityProofInput = {},
): RuntimeRouteReachabilityProofAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const proofId = nextProofId();

  const buildMaterializationReport =
    input.buildMaterializationReport ??
    assessConnectedBuildExecution({
      rootDir,
      attemptBuildProofGapMaterialization: false,
    }).report;

  const workspace = resolvePrimaryWorkspace({
    rootDir,
    buildMaterializationReport,
    workspacePath: input.workspacePath,
    workspaceId: input.workspaceId,
  });

  if (!workspace) {
    const classification = classifyRouteReachability({
      applicationBootsBeforeProbe: false,
      discoveredRoutes: [],
      probeSession: {
        readOnly: true,
        baseUrl: null,
        port: null,
        probeResults: [],
        runtimeBootedBeforeProbe: false,
        probeSkipped: true,
        skipReason: 'no workspace',
        cleanupStatus: 'NOT_STARTED',
        elapsedMs: 0,
        fatalErrors: ['no workspace'],
      },
    });
    const rec = buildRecommendations({
      failureClass: classification.failureClass,
      routesReachable: classification.routesReachable,
      uiRenderProven: classification.uiRenderProven,
    });
    const report: RuntimeRouteReachabilityProofReport = {
      readOnly: true,
      advisoryOnly: true,
      proofId,
      generatedAt: new Date().toISOString(),
      coreQuestion: RUNTIME_ROUTE_REACHABILITY_PROOF_CORE_QUESTION,
      workspaceId: 'none',
      workspaceRoot: 'none',
      entrypoint: emptyEntrypoint,
      resolvedCommand: emptyResolved,
      startupProbe: input.startupProbe ?? null,
      applicationBootsBeforeProbe: false,
      discoveredRoutes: [],
      probeSession: {
        readOnly: true,
        baseUrl: null,
        port: null,
        probeResults: [],
        runtimeBootedBeforeProbe: false,
        probeSkipped: true,
        skipReason: 'no workspace',
        cleanupStatus: 'NOT_STARTED',
        elapsedMs: 0,
        fatalErrors: ['no workspace'],
      },
      failureClass: classification.failureClass,
      routesReachable: classification.routesReachable,
      rootRouteReachable: classification.rootRouteReachable,
      uiRenderProven: classification.uiRenderProven,
      routeFailureReason: classification.routeFailureReason,
      recommendedFix: rec.recommendedFix,
      recommendedNextActions: rec.recommendedNextActions,
      cacheKey: stableCacheKey(proofId, classification.failureClass, classification.routesReachable),
    };
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'RUNTIME_ROUTE_REACHABILITY_PROOF_COMPLETE',
      report,
      cacheKey: report.cacheKey,
    };
  }

  const entrypoint =
    input.entrypoint ??
    discoverRuntimeEntrypoint({
      rootDir,
      workspaceRoot: workspace.workspaceRoot,
      workspaceId: workspace.workspaceId,
      workspaceAbs: workspace.workspaceAbs,
      buildMaterializationReport,
    });

  const resolvedCommand =
    input.resolvedCommand ??
    resolveStartupCommand({
      rootDir,
      entrypoint,
      buildMaterializationReport,
    });

  const startupProbe: RuntimeStartupProbeResult | null = input.startupProbe ?? null;
  const applicationBootsBeforeProbe = startupProbe?.applicationBoots === true;

  const workspaceAbs = resolve(rootDir, entrypoint.workspaceRoot);
  const discoveredRoutes = discoverExpectedRoutes({
    rootDir,
    workspaceAbs,
    workspaceId: entrypoint.workspaceId,
    appType: entrypoint.appType,
  });

  const probeSession = runRouteProbeSession({
    rootDir,
    workspaceId: entrypoint.workspaceId,
    resolved: resolvedCommand,
    discoveredRoutes,
    applicationBootsBeforeProbe,
    skipProbe: input.skipProbe,
  });

  const classification = classifyRouteReachability({
    applicationBootsBeforeProbe,
    discoveredRoutes,
    probeSession,
  });

  const rec = buildRecommendations({
    failureClass: classification.failureClass,
    routesReachable: classification.routesReachable,
    uiRenderProven: classification.uiRenderProven,
  });

  const report: RuntimeRouteReachabilityProofReport = {
    readOnly: true,
    advisoryOnly: true,
    proofId,
    generatedAt: new Date().toISOString(),
    coreQuestion: RUNTIME_ROUTE_REACHABILITY_PROOF_CORE_QUESTION,
    workspaceId: entrypoint.workspaceId,
    workspaceRoot: entrypoint.workspaceRoot,
    entrypoint,
    resolvedCommand,
    startupProbe,
    applicationBootsBeforeProbe,
    discoveredRoutes,
    probeSession,
    failureClass: classification.failureClass,
    routesReachable: classification.routesReachable,
    rootRouteReachable: classification.rootRouteReachable,
    uiRenderProven: classification.uiRenderProven,
    routeFailureReason: classification.routeFailureReason,
    recommendedFix: rec.recommendedFix,
    recommendedNextActions: rec.recommendedNextActions,
    cacheKey: stableCacheKey(proofId, classification.failureClass, classification.routesReachable),
  };

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'RUNTIME_ROUTE_REACHABILITY_PROOF_COMPLETE',
    report,
    cacheKey: report.cacheKey,
  };
}
