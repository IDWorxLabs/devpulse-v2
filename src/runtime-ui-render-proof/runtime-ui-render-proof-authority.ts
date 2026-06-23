/**
 * Runtime UI Render Proof — authority orchestrator (Phase 26.84).
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
import { discoverUiRoutes } from './ui-route-discovery.js';
import { runUiRenderProbeSession } from './ui-render-probe-runner.js';
import { classifyUiRender } from './ui-render-failure-classifier.js';
import {
  RUNTIME_UI_RENDER_PROOF_CACHE_KEY_PREFIX,
  RUNTIME_UI_RENDER_PROOF_CORE_QUESTION,
  RUNTIME_UI_RENDER_PROOF_PASS,
} from './runtime-ui-render-proof-registry.js';
import type {
  AssessRuntimeUiRenderProofInput,
  RuntimeUiRenderProofAssessment,
  RuntimeUiRenderProofReport,
} from './runtime-ui-render-proof-types.js';
import type {
  ResolvedStartupCommand,
  RuntimeEntrypointCandidate,
  RuntimeStartupProbeResult,
} from '../runtime-startup-proof-repair/runtime-startup-proof-repair-types.js';
import type { RuntimeRouteReachabilityProofReport } from '../runtime-route-reachability-proof/runtime-route-reachability-proof-types.js';

let proofCounter = 0;

export function resetRuntimeUiRenderProofCounterForTests(): void {
  proofCounter = 0;
}

export function resetRuntimeUiRenderProofModuleForTests(): void {
  resetRuntimeUiRenderProofCounterForTests();
}

function nextProofId(): string {
  proofCounter += 1;
  return `runtime-ui-render-proof-${proofCounter}-${Date.now()}`;
}

function stableCacheKey(proofId: string, failureClass: string, uiRenders: boolean): string {
  const digest = createHash('sha256')
    .update([RUNTIME_UI_RENDER_PROOF_PASS, proofId, failureClass, String(uiRenders)].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${RUNTIME_UI_RENDER_PROOF_CACHE_KEY_PREFIX}:${digest}`;
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
  uiRenders: boolean;
  uiSourceFilesPresent: boolean;
}): { recommendedFix: string; recommendedNextActions: string[] } {
  if (input.failureClass === 'RUNTIME_NOT_ROUTE_READY') {
    return {
      recommendedFix: 'Complete startup and route reachability proof before UI render assessment.',
      recommendedNextActions: [
        'Ensure applicationBoots=true from startup proof',
        'Ensure routesReachable=true from route reachability proof',
      ],
    };
  }
  if (input.uiRenders) {
    return {
      recommendedFix: 'UI renders — advance to founder flow and reporting proof.',
      recommendedNextActions: [
        'Run founder-critical workflow proof',
        'Do not claim APPLICATION_PROVEN until founder flow passes (Rule 5)',
      ],
    };
  }
  if (input.failureClass === 'JSON_ONLY_RUNTIME') {
    return {
      recommendedFix: 'Runtime serves JSON-only responses; expose HTML SPA entry or document JSON-only runtime.',
      recommendedNextActions: input.uiSourceFilesPresent
        ? [
            'Wire dev-server to serve index.html for UI routes',
            'UI source files exist — this is UI route exposure failure, not build failure (Rule 4)',
          ]
        : ['Confirm whether application is intentionally API/JSON-only', 'Add index.html and client bundle if UI required'],
    };
  }
  return {
    recommendedFix: 'Repair UI render — serve HTML with root mount and client bundle.',
    recommendedNextActions: [
      'Verify index.html and client entry are served at root',
      `Address failure class: ${input.failureClass}`,
    ],
  };
}

export function assessRuntimeUiRenderProof(
  input: AssessRuntimeUiRenderProofInput = {},
): RuntimeUiRenderProofAssessment {
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
    const classification = classifyUiRender({
      applicationBootsBeforeProbe: false,
      routesReachableBeforeProbe: false,
      discoveredUiRoutes: [],
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
        applicationBootsBeforeProbe: false,
        routesReachableBeforeProbe: false,
        probeSkipped: true,
        skipReason: 'no workspace',
        cleanupStatus: 'NOT_STARTED',
        elapsedMs: 0,
        fatalErrors: ['no workspace'],
      },
    });
    const rec = buildRecommendations({
      failureClass: classification.failureClass,
      uiRenders: classification.uiRenders,
      uiSourceFilesPresent: false,
    });
    const report: RuntimeUiRenderProofReport = {
      readOnly: true,
      advisoryOnly: true,
      proofId,
      generatedAt: new Date().toISOString(),
      coreQuestion: RUNTIME_UI_RENDER_PROOF_CORE_QUESTION,
      workspaceId: 'none',
      workspaceRoot: 'none',
      entrypoint: emptyEntrypoint,
      resolvedCommand: emptyResolved,
      startupProbe: input.startupProbe ?? null,
      routeReachabilityProof: input.routeReachabilityProof ?? null,
      applicationBootsBeforeProbe: false,
      routesReachableBeforeProbe: false,
      discoveredUiRoutes: [],
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
        applicationBootsBeforeProbe: false,
        routesReachableBeforeProbe: false,
        probeSkipped: true,
        skipReason: 'no workspace',
        cleanupStatus: 'NOT_STARTED',
        elapsedMs: 0,
        fatalErrors: ['no workspace'],
      },
      failureClass: classification.failureClass,
      uiRenders: classification.uiRenders,
      rootRouteJsonOnly: classification.rootRouteJsonOnly,
      uiFailureReason: classification.uiFailureReason,
      recommendedFix: rec.recommendedFix,
      recommendedNextActions: rec.recommendedNextActions,
      cacheKey: stableCacheKey(proofId, classification.failureClass, classification.uiRenders),
    };
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'RUNTIME_UI_RENDER_PROOF_COMPLETE',
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
  const routeReachabilityProof: RuntimeRouteReachabilityProofReport | null =
    input.routeReachabilityProof ?? null;
  const applicationBootsBeforeProbe = startupProbe?.applicationBoots === true;
  const routesReachableBeforeProbe = routeReachabilityProof?.routesReachable === true;

  const workspaceAbs = resolve(rootDir, entrypoint.workspaceRoot);
  const { routes: discoveredUiRoutes, uiSourceFiles } = discoverUiRoutes({
    rootDir,
    workspaceAbs,
    workspaceId: entrypoint.workspaceId,
    appType: entrypoint.appType,
    routeReachabilityProof,
  });

  const probeSession = runUiRenderProbeSession({
    rootDir,
    workspaceId: entrypoint.workspaceId,
    resolved: resolvedCommand,
    discoveredUiRoutes,
    applicationBootsBeforeProbe,
    routesReachableBeforeProbe,
    skipProbe: input.skipProbe,
  });

  const classification = classifyUiRender({
    applicationBootsBeforeProbe,
    routesReachableBeforeProbe,
    discoveredUiRoutes,
    uiSourceFiles,
    probeSession,
  });

  const rec = buildRecommendations({
    failureClass: classification.failureClass,
    uiRenders: classification.uiRenders,
    uiSourceFilesPresent: uiSourceFiles.uiSourceFilesPresent,
  });

  const report: RuntimeUiRenderProofReport = {
    readOnly: true,
    advisoryOnly: true,
    proofId,
    generatedAt: new Date().toISOString(),
    coreQuestion: RUNTIME_UI_RENDER_PROOF_CORE_QUESTION,
    workspaceId: entrypoint.workspaceId,
    workspaceRoot: entrypoint.workspaceRoot,
    entrypoint,
    resolvedCommand,
    startupProbe,
    routeReachabilityProof,
    applicationBootsBeforeProbe,
    routesReachableBeforeProbe,
    discoveredUiRoutes,
    uiSourceFiles,
    probeSession,
    failureClass: classification.failureClass,
    uiRenders: classification.uiRenders,
    rootRouteJsonOnly: classification.rootRouteJsonOnly,
    uiFailureReason: classification.uiFailureReason,
    recommendedFix: rec.recommendedFix,
    recommendedNextActions: rec.recommendedNextActions,
    cacheKey: stableCacheKey(proofId, classification.failureClass, classification.uiRenders),
  };

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'RUNTIME_UI_RENDER_PROOF_COMPLETE',
    report,
    cacheKey: report.cacheKey,
  };
}
