/**
 * Founder Flow Runtime Proof — authority orchestrator (Phase 26.86).
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
import { discoverFounderFlowCandidates } from './founder-flow-candidate-discovery.js';
import { runFounderFlowProbe } from './founder-flow-probe-runner.js';
import { checkFounderFlowResultDelivery } from './founder-flow-result-store-checker.js';
import { classifyFounderFlow } from './founder-flow-failure-classifier.js';
import {
  FOUNDER_FLOW_RUNTIME_PROOF_CACHE_KEY_PREFIX,
  FOUNDER_FLOW_RUNTIME_PROOF_CORE_QUESTION,
  FOUNDER_FLOW_RUNTIME_PROOF_PASS,
} from './founder-flow-runtime-proof-registry.js';
import type {
  AssessFounderFlowRuntimeProofInput,
  FounderFlowRuntimeProofAssessment,
  FounderFlowRuntimeProofReport,
} from './founder-flow-runtime-proof-types.js';
import type {
  ResolvedStartupCommand,
  RuntimeEntrypointCandidate,
  RuntimeStartupProbeResult,
} from '../runtime-startup-proof-repair/runtime-startup-proof-repair-types.js';

let proofCounter = 0;

export function resetFounderFlowRuntimeProofCounterForTests(): void {
  proofCounter = 0;
}

export function resetFounderFlowRuntimeProofModuleForTests(): void {
  resetFounderFlowRuntimeProofCounterForTests();
}

function nextProofId(): string {
  proofCounter += 1;
  return `founder-flow-runtime-proof-${proofCounter}-${Date.now()}`;
}

function stableCacheKey(proofId: string, failureClass: string, proven: boolean): string {
  const digest = createHash('sha256')
    .update([FOUNDER_FLOW_RUNTIME_PROOF_PASS, proofId, failureClass, String(proven)].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${FOUNDER_FLOW_RUNTIME_PROOF_CACHE_KEY_PREFIX}:${digest}`;
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
  founderFlowProven: boolean;
}): { recommendedFix: string; recommendedNextActions: string[] } {
  if (input.failureClass === 'UI_RENDER_NOT_READY') {
    return {
      recommendedFix: 'Complete UI Render Proof before founder flow assessment.',
      recommendedNextActions: ['Run runtime UI render proof until uiRenders=true'],
    };
  }
  if (input.founderFlowProven) {
    return {
      recommendedFix: 'Founder flow proven — advance launch readiness and truth matrix reconciliation.',
      recommendedNextActions: ['Verify evidence propagation into reporting layers'],
    };
  }
  if (input.failureClass === 'REPORT_GENERATED_NOT_DELIVERED') {
    return {
      recommendedFix: 'Deliver final report to client cache — partial generation is not completion.',
      recommendedNextActions: [
        'Ensure finalReportReady=true on result payload',
        'Update client cache with final report markdown',
      ],
    };
  }
  if (input.failureClass === 'FINAL_RESULT_NOT_DELIVERED' || input.failureClass === 'RESULT_STORE_MISSING') {
    return {
      recommendedFix: 'Complete founder test run and persist final result to result store.',
      recommendedNextActions: [
        'Run founder test through completion',
        'Verify /api/founder-test/result returns final report payload',
      ],
    };
  }
  return {
    recommendedFix: 'Repair founder-critical workflow completion boundary.',
    recommendedNextActions: [`Address failure class: ${input.failureClass}`],
  };
}

export function assessFounderFlowRuntimeProof(
  input: AssessFounderFlowRuntimeProofInput = {},
): FounderFlowRuntimeProofAssessment {
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

  const emptyFlowProbe = runFounderFlowProbe({
    uiRenderProof: null,
    uiRendersBeforeProbe: false,
    routesReachableBeforeProbe: false,
    applicationBootsBeforeProbe: false,
    skipProbe: true,
  });
  const emptyResultCheck = checkFounderFlowResultDelivery({});

  if (!workspace) {
    const classification = classifyFounderFlow({
      uiRendersBeforeProbe: false,
      applicationBootsBeforeProbe: false,
      routesReachableBeforeProbe: false,
      filesExistOnDisk: false,
      dependenciesReady: false,
      discoveredCandidates: [],
      flowProbe: emptyFlowProbe,
      resultStoreCheck: emptyResultCheck,
    });
    const rec = buildRecommendations({
      failureClass: classification.failureClass,
      founderFlowProven: classification.founderFlowProven,
    });
    const report: FounderFlowRuntimeProofReport = {
      readOnly: true,
      advisoryOnly: true,
      proofId,
      generatedAt: new Date().toISOString(),
      coreQuestion: FOUNDER_FLOW_RUNTIME_PROOF_CORE_QUESTION,
      workspaceId: 'none',
      workspaceRoot: 'none',
      entrypoint: emptyEntrypoint,
      resolvedCommand: emptyResolved,
      startupProbe: input.startupProbe ?? null,
      routeReachabilityProof: input.routeReachabilityProof ?? null,
      uiRenderProof: input.uiRenderProof ?? null,
      filesExistOnDisk: false,
      dependenciesReady: false,
      applicationBootsBeforeProbe: false,
      routesReachableBeforeProbe: false,
      uiRendersBeforeProbe: false,
      discoveredCandidates: [],
      flowProbe: emptyFlowProbe,
      resultStoreCheck: emptyResultCheck,
      failureClass: classification.failureClass,
      founderFlowProven: classification.founderFlowProven,
      founderFlowFailureReason: classification.founderFlowFailureReason,
      recommendedFix: rec.recommendedFix,
      recommendedNextActions: rec.recommendedNextActions,
      cacheKey: stableCacheKey(proofId, classification.failureClass, classification.founderFlowProven),
    };
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'FOUNDER_FLOW_RUNTIME_PROOF_COMPLETE',
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
  const routeReachabilityProof = input.routeReachabilityProof ?? null;
  const uiRenderProof = input.uiRenderProof ?? null;

  const applicationBootsBeforeProbe = startupProbe?.applicationBoots === true;
  const routesReachableBeforeProbe = routeReachabilityProof?.routesReachable === true;
  const uiRendersBeforeProbe = uiRenderProof?.uiRenders === true;
  const dependenciesReady = input.dependenciesReady ?? false;
  const filesExistOnDisk =
    input.filesExistOnDisk ??
    (buildMaterializationReport.generatedFileEvidence?.fileCount ?? 0) > 0;

  const discoveredCandidates = discoverFounderFlowCandidates({
    rootDir,
    workspaceId: entrypoint.workspaceId,
    routeReachabilityProof,
    uiRenderProof,
  });

  const flowProbe = runFounderFlowProbe({
    uiRenderProof,
    uiRendersBeforeProbe,
    routesReachableBeforeProbe,
    applicationBootsBeforeProbe,
    skipProbe: input.skipProbe,
  });

  const resultStoreCheck = checkFounderFlowResultDelivery({
    bridgeFounderFlow: input.bridgeFounderFlow ?? null,
  });

  const classification = classifyFounderFlow({
    uiRendersBeforeProbe,
    applicationBootsBeforeProbe,
    routesReachableBeforeProbe,
    filesExistOnDisk,
    dependenciesReady,
    discoveredCandidates,
    flowProbe,
    resultStoreCheck,
  });

  const rec = buildRecommendations({
    failureClass: classification.failureClass,
    founderFlowProven: classification.founderFlowProven,
  });

  const report: FounderFlowRuntimeProofReport = {
    readOnly: true,
    advisoryOnly: true,
    proofId,
    generatedAt: new Date().toISOString(),
    coreQuestion: FOUNDER_FLOW_RUNTIME_PROOF_CORE_QUESTION,
    workspaceId: entrypoint.workspaceId,
    workspaceRoot: entrypoint.workspaceRoot,
    entrypoint,
    resolvedCommand,
    startupProbe,
    routeReachabilityProof,
    uiRenderProof,
    filesExistOnDisk,
    dependenciesReady,
    applicationBootsBeforeProbe,
    routesReachableBeforeProbe,
    uiRendersBeforeProbe,
    discoveredCandidates,
    flowProbe,
    resultStoreCheck,
    failureClass: classification.failureClass,
    founderFlowProven: classification.founderFlowProven,
    founderFlowFailureReason: classification.founderFlowFailureReason,
    recommendedFix: rec.recommendedFix,
    recommendedNextActions: rec.recommendedNextActions,
    cacheKey: stableCacheKey(proofId, classification.failureClass, classification.founderFlowProven),
  };

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'FOUNDER_FLOW_RUNTIME_PROOF_COMPLETE',
    report,
    cacheKey: report.cacheKey,
  };
}
