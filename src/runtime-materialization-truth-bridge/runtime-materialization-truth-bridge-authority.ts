/**
 * Runtime Materialization Truth Bridge — authority orchestrator (Phase 26.76).
 * Read-only. No file mutation. No synthetic runtime claims.
 */

import { createHash } from 'node:crypto';
import {
  RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_CACHE_KEY_PREFIX,
  RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_CORE_QUESTION,
  RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_PASS,
} from './runtime-materialization-truth-bridge-registry.js';
import {
  recordRuntimeMaterializationTruthBridgeAssessment,
  resetRuntimeMaterializationTruthBridgeHistoryForTests,
} from './runtime-materialization-truth-bridge-history.js';
import {
  buildRuntimeMaterializationTruthBridgeReportMarkdown,
  buildRuntimeMaterializationTruthReconciliationReportMarkdown,
} from './runtime-materialization-truth-bridge-report-builder.js';
import { collectRuntimeMaterializationTruthEvidence } from './runtime-evidence-collector.js';
import { reconcileRuntimeMaterializationTruth } from './runtime-truth-reconciler.js';
import type {
  AssessRuntimeMaterializationTruthBridgeInput,
  RuntimeMaterializationTruthBridgeAssessment,
  RuntimeMaterializationTruthBridgeReport,
} from './runtime-materialization-truth-bridge-types.js';

let bridgeCounter = 0;

export function resetRuntimeMaterializationTruthBridgeCounterForTests(): void {
  bridgeCounter = 0;
}

export function resetRuntimeMaterializationTruthBridgeModuleForTests(): void {
  resetRuntimeMaterializationTruthBridgeCounterForTests();
  resetRuntimeMaterializationTruthBridgeHistoryForTests();
}

function nextBridgeId(): string {
  bridgeCounter += 1;
  return `runtime-materialization-truth-bridge-${bridgeCounter}-${Date.now()}`;
}

function stableCacheKey(bridgeId: string, finalTruth: string): string {
  const digest = createHash('sha256')
    .update([RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_PASS, bridgeId, finalTruth].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_CACHE_KEY_PREFIX}:${digest}`;
}

function buildSummaries(
  partial: Omit<RuntimeMaterializationTruthBridgeReport, 'cacheKey'>,
): Pick<
  RuntimeMaterializationTruthBridgeReport,
  'runtimeEvidenceSummary' | 'founderTestVerdictSummary' | 'truthMatrixVerdictSummary'
> {
  const snap = partial.evidence.snapshot;
  const rec = partial.reconciliation;
  return {
    runtimeEvidenceSummary:
      `Runtime: ${snap.runtimeProofLevel}, preview: ${snap.previewProofLevel ?? 'n/a'}, ` +
      `boots=${partial.evidence.proofAnalysis.applicationBoots}, ` +
      `routes=${partial.evidence.proofAnalysis.routesReachable}, ` +
      `ui=${partial.evidence.proofAnalysis.uiRenders}. ` +
      `Boundary: ${rec.failureBoundary}.`,
    founderTestVerdictSummary:
      `Founder RUNTIME=${snap.founderRuntimeProofLevel}, PREVIEW=${snap.founderPreviewProofLevel}. ` +
      `Pre-reconciliation: ${rec.preReconciliationApplicationVerdict}.` +
      (rec.founderTestVerdictReconciled ? ' **Reconciled against runtime evidence.**' : ''),
    truthMatrixVerdictSummary:
      rec.truthMatrixVerdictUpdated
        ? 'Truth Matrix application claims updated by RUNTIME_MATERIALIZATION_TRUTH.'
        : 'Truth Matrix will receive RUNTIME_MATERIALIZATION_TRUTH on launch reconciliation.',
  };
}

export function assessRuntimeMaterializationTruthBridge(
  input: AssessRuntimeMaterializationTruthBridgeInput = {},
): RuntimeMaterializationTruthBridgeAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const bridgeId = nextBridgeId();

  const evidence = collectRuntimeMaterializationTruthEvidence({
    rootDir,
    runtimeActivationProof: input.runtimeActivationProof,
    previewExperienceProof: input.previewExperienceProof,
    buildMaterializationTruthBridge: input.buildMaterializationTruthBridge,
    buildMaterializationReport: input.buildMaterializationReport,
    skipRuntimeAssessment: input.skipRuntimeAssessment,
    skipPreviewAssessment: input.skipPreviewAssessment,
    startupProofRepair: input.startupProofRepair,
    skipStartupProofRepair: input.skipStartupProofRepair,
    dependencyMaterialization: input.dependencyMaterialization,
    skipDependencyMaterialization: input.skipDependencyMaterialization,
    dependencyInstallationExecutor: input.dependencyInstallationExecutor,
    crashDiagnosis: input.crashDiagnosis,
    routeReachabilityProof: input.routeReachabilityProof,
    skipRouteReachabilityProof: input.skipRouteReachabilityProof,
    uiRenderProof: input.uiRenderProof,
    skipUiRenderProof: input.skipUiRenderProof,
    founderFlowRuntimeProof: input.founderFlowRuntimeProof,
    skipFounderFlowRuntimeProof: input.skipFounderFlowRuntimeProof,
    dependencyInstallExecutionMode: input.dependencyInstallExecutionMode,
    workspacePath: input.workspacePath,
    workspaceId: input.workspaceId,
  });

  const reconciliation = reconcileRuntimeMaterializationTruth({
    evidence,
    reconciliationId: bridgeId,
  });

  const partialReport: Omit<RuntimeMaterializationTruthBridgeReport, 'cacheKey'> = {
    readOnly: true,
    advisoryOnly: true,
    bridgeId,
    generatedAt: new Date().toISOString(),
    coreQuestion: RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_CORE_QUESTION,
    evidence,
    reconciliation,
    finalApplicationTruth: reconciliation.postReconciliationApplicationVerdict,
    runtimeEvidenceSummary: '',
    founderTestVerdictSummary: '',
    truthMatrixVerdictSummary: '',
  };

  const cacheKey = stableCacheKey(bridgeId, reconciliation.postReconciliationApplicationVerdict);
  const report: RuntimeMaterializationTruthBridgeReport = {
    ...partialReport,
    ...buildSummaries(partialReport),
    cacheKey,
  };

  const assessment: RuntimeMaterializationTruthBridgeAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'RUNTIME_MATERIALIZATION_TRUTH_COMPLETE',
    report,
    cacheKey,
  };

  if (!input.skipHistoryRecording) {
    recordRuntimeMaterializationTruthBridgeAssessment(assessment);
  }

  return assessment;
}

export {
  buildRuntimeMaterializationTruthBridgeReportMarkdown,
  buildRuntimeMaterializationTruthReconciliationReportMarkdown,
};
