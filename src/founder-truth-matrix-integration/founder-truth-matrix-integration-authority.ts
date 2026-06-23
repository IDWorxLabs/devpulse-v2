/**
 * Phase 26.71 — Founder Truth Matrix Integration authority orchestrator (V1).
 * Read-only reconciliation layer before launch verdict emission.
 */

import { createHash } from 'node:crypto';
import { assessFounderTestConsistencyAudit } from '../founder-test-consistency-audit/index.js';
import type { FounderTestConsistencyAuditAssessment } from '../founder-test-consistency-audit/founder-test-consistency-audit-types.js';
import type {
  FounderTestLaunchBlocker,
  FounderTestLaunchReadinessAssessment,
  LaunchReadinessVerdict,
} from '../founder-test-launch-readiness/founder-test-launch-readiness-types.js';
import { analyzeAllConsistencyClaims } from '../founder-test-consistency-audit/index.js';
import { buildFounderTruthSummary } from './founder-truth-summary-builder.js';
import { recordFounderTruthMatrixIntegrationAssessment, resetFounderTruthMatrixIntegrationHistoryForTests } from './founder-truth-matrix-integration-history.js';
import {
  FOUNDER_TRUTH_MATRIX_INTEGRATION_CACHE_KEY_PREFIX,
  FOUNDER_TRUTH_MATRIX_INTEGRATION_CORE_QUESTION,
} from './founder-truth-matrix-integration-registry.js';
import type {
  AssessFounderTruthMatrixIntegrationInput,
  FounderTruthMatrixIntegrationAssessment,
} from './founder-truth-matrix-integration-types.js';
import {
  buildConsistencyEvidenceFromLaunchContext,
  type LaunchReadinessTruthBridgeInput,
} from './launch-readiness-truth-bridge.js';
import { applyBuildMaterializationTruthToClaims } from '../build-materialization-truth-bridge/index.js';
import { applyRuntimeMaterializationTruthToClaims } from '../runtime-materialization-truth-bridge/index.js';
import { applyEvidencePropagationReconciliationSync } from '../evidence-propagation-reconciliation/index.js';
import { applyAuthorityEvidenceSourceRealignmentSync } from '../authority-evidence-source-realignment/index.js';
import { applyExecutionProofSourceUnificationSync } from '../execution-proof-source-unification/index.js';
import { applyAuthorityRealityConvergenceSync } from '../authority-reality-convergence/index.js';
import { applyExecutionProofContradictionEliminationSync } from '../execution-proof-contradiction-elimination/index.js';
import { applyChatIntelligenceScenarioConsumptionSync } from '../chat-intelligence-scenario-consumption-audit/index.js';
import { reconcileLaunchVerdictWithTruthMatrix } from './launch-verdict-reconciler.js';
import { buildTruthMatrixReconciliation, reconcileTruthClaims } from './truth-reconciler.js';
import { runWithAuthorityGuard } from '../authority-recursion-guard/index.js';

let integrationCounter = 0;

export function resetFounderTruthMatrixIntegrationCounterForTests(): void {
  integrationCounter = 0;
}

export function resetFounderTruthMatrixIntegrationModuleForTests(): void {
  resetFounderTruthMatrixIntegrationCounterForTests();
  resetFounderTruthMatrixIntegrationHistoryForTests();
}

function nextIntegrationId(): string {
  integrationCounter += 1;
  return `founder-truth-matrix-integration-${integrationCounter}-${Date.now()}`;
}

function buildCacheKey(integrationId: string, postVerdict: LaunchReadinessVerdict): string {
  const digest = createHash('sha256')
    .update([integrationId, postVerdict].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${FOUNDER_TRUTH_MATRIX_INTEGRATION_CACHE_KEY_PREFIX}:${digest}`;
}

export interface ApplyTruthMatrixLaunchReconciliationInput {
  rootDir?: string;
  preReconciliationVerdict: LaunchReadinessVerdict;
  topBlockers: FounderTestLaunchBlocker[];
  consistencyAudit?: FounderTestConsistencyAuditAssessment;
  launchReadinessPreReconciliation?: FounderTestLaunchReadinessAssessment;
  skipConsistencyAudit?: boolean;
  skipHistoryRecording?: boolean;
}

export interface ApplyTruthMatrixLaunchReconciliationResult {
  readOnly: true;
  postReconciliationVerdict: LaunchReadinessVerdict;
  integration: FounderTruthMatrixIntegrationAssessment;
}

export function applyTruthMatrixLaunchReconciliationSync(
  input: LaunchReadinessTruthBridgeInput & {
    skipHistoryRecording?: boolean;
  },
): ApplyTruthMatrixLaunchReconciliationResult {
  return runWithAuthorityGuard({
    authorityName: 'FOUNDER_TRUTH_MATRIX_LAUNCH_RECONCILIATION',
    invoke: () => applyTruthMatrixLaunchReconciliationSyncCore(input),
    onRecursion: () => applyTruthMatrixLaunchReconciliationSyncCore(input),
  });
}

function applyTruthMatrixLaunchReconciliationSyncCore(
  input: LaunchReadinessTruthBridgeInput & {
    skipHistoryRecording?: boolean;
  },
): ApplyTruthMatrixLaunchReconciliationResult {
  const evidence = buildConsistencyEvidenceFromLaunchContext(input);
  const claimAudits = analyzeAllConsistencyClaims(evidence);
  let reconciledClaims = reconcileTruthClaims(claimAudits);

  if (input.buildMaterializationTruthBridge) {
    reconciledClaims = applyBuildMaterializationTruthToClaims(
      reconciledClaims,
      input.buildMaterializationTruthBridge.report.reconciliation,
    );
  }

  if (input.runtimeMaterializationTruthBridge) {
    reconciledClaims = applyRuntimeMaterializationTruthToClaims(
      reconciledClaims,
      input.runtimeMaterializationTruthBridge.report.reconciliation,
    );
  }

  const propagationResult = applyEvidencePropagationReconciliationSync({
    reconciledClaims,
    runtimeMaterializationTruthBridge: input.runtimeMaterializationTruthBridge,
    launchReadinessVerdict: input.preReconciliationVerdict,
    runId: input.runId,
    skipHistoryRecording: input.skipHistoryRecording ?? true,
  });
  reconciledClaims = propagationResult.reconciledClaims;

  applyAuthorityEvidenceSourceRealignmentSync({
    runtimeMaterializationTruthBridge: input.runtimeMaterializationTruthBridge,
    runId: input.runId,
    launchBlockers: input.topBlockers.map((blocker) => ({
      id: blocker.sourceAuthority,
      explanation: blocker.explanation,
    })),
    skipHistoryRecording: input.skipHistoryRecording ?? true,
  });

  applyExecutionProofSourceUnificationSync({
    runtimeMaterializationTruthBridge: input.runtimeMaterializationTruthBridge,
    runId: input.runId,
    launchBlockers: input.topBlockers.map((blocker) => ({
      id: blocker.sourceAuthority,
      explanation: blocker.explanation,
    })),
    launchReadinessVerdict: input.preReconciliationVerdict,
    skipHistoryRecording: input.skipHistoryRecording ?? true,
  });

  applyAuthorityRealityConvergenceSync({
    rootDir: input.rootDir,
    runtimeMaterializationTruthBridge: input.runtimeMaterializationTruthBridge,
    runId: input.runId,
    launchBlockers: input.topBlockers.map((blocker) => ({
      id: blocker.sourceAuthority,
      explanation: blocker.explanation,
    })),
    launchReadinessVerdict: input.preReconciliationVerdict,
    chatCapabilityAnswerQuality: input.chatCapabilityAnswerQuality,
    chatStressSimulation: input.chatStressSimulation,
    skipHistoryRecording: input.skipHistoryRecording ?? true,
  });

  applyExecutionProofContradictionEliminationSync({
    rootDir: input.rootDir,
    runtimeMaterializationTruthBridge: input.runtimeMaterializationTruthBridge,
    buildMaterializationTruthBridge: input.buildMaterializationTruthBridge,
    runId: input.runId,
    launchBlockers: input.topBlockers.map((blocker) => ({
      id: blocker.sourceAuthority,
      explanation: blocker.explanation,
    })),
    launchReadinessVerdict: input.preReconciliationVerdict,
    skipHistoryRecording: input.skipHistoryRecording ?? true,
  });

  applyChatIntelligenceScenarioConsumptionSync({
    rootDir: input.rootDir,
    chatStressSimulation: input.chatStressSimulation,
    chatCapabilityAnswerQuality: input.chatCapabilityAnswerQuality,
    chatIntelligenceReality: input.chatIntelligenceReality,
    skipHistoryRecording: input.skipHistoryRecording ?? true,
  });

  const launchResult = reconcileLaunchVerdictWithTruthMatrix({
    preReconciliationVerdict: input.preReconciliationVerdict,
    topBlockers: input.topBlockers,
    reconciledClaims,
  });

  const integrationId = nextIntegrationId();
  const reconciliation = buildTruthMatrixReconciliation(
    reconciledClaims,
    input.preReconciliationVerdict,
    launchResult.postReconciliationVerdict,
    launchResult.overrideApplied,
    launchResult.overrideReason,
    integrationId,
  );

  const founderTruthSummary = buildFounderTruthSummary(
    reconciledClaims,
    reconciliation,
    launchResult,
    claimAudits,
  );

  const report = {
    readOnly: true as const,
    advisoryOnly: true as const,
    integrationId,
    generatedAt: new Date().toISOString(),
    coreQuestion: FOUNDER_TRUTH_MATRIX_INTEGRATION_CORE_QUESTION,
    reconciliation,
    founderTruthSummary,
    categorizedBlockers: launchResult.categorizedBlockers,
    consistencyAuditCacheKey: 'sync-launch-bridge',
  };

  const cacheKey = buildCacheKey(integrationId, launchResult.postReconciliationVerdict);
  const assessment: FounderTruthMatrixIntegrationAssessment = {
    readOnly: true,
    advisoryOnly: true,
    report,
    cacheKey,
  };

  if (!input.skipHistoryRecording) {
    recordFounderTruthMatrixIntegrationAssessment(assessment);
  }

  return {
    readOnly: true,
    postReconciliationVerdict: launchResult.postReconciliationVerdict,
    integration: assessment,
  };
}

export async function applyTruthMatrixLaunchReconciliation(
  input: ApplyTruthMatrixLaunchReconciliationInput,
): Promise<ApplyTruthMatrixLaunchReconciliationResult> {
  const integration = await assessFounderTruthMatrixIntegration({
    rootDir: input.rootDir,
    consistencyAudit: input.consistencyAudit,
    preReconciliationVerdict: input.preReconciliationVerdict,
    topBlockers: input.topBlockers,
    launchReadinessPreReconciliation: input.launchReadinessPreReconciliation,
    skipConsistencyAudit: input.skipConsistencyAudit,
    skipHistoryRecording: input.skipHistoryRecording,
  });

  return {
    readOnly: true,
    postReconciliationVerdict: integration.report.reconciliation.postReconciliationVerdict,
    integration,
  };
}

export async function assessFounderTruthMatrixIntegration(
  input: AssessFounderTruthMatrixIntegrationInput = {},
): Promise<FounderTruthMatrixIntegrationAssessment> {
  const preReconciliationVerdict = input.preReconciliationVerdict ?? 'INSUFFICIENT_EVIDENCE';
  const topBlockers = input.topBlockers ?? [];

  let consistencyAudit = input.consistencyAudit;
  if (!consistencyAudit && !input.skipConsistencyAudit) {
    consistencyAudit = await assessFounderTestConsistencyAudit({
      rootDir: input.rootDir,
      launchReadiness: input.launchReadinessPreReconciliation,
      founderTestAssessment: input.launchReadinessPreReconciliation?.report.inputSnapshot
        .founderTestAssessment,
      chatStressSimulation: input.launchReadinessPreReconciliation?.report.chatStressSimulation,
      productReadiness: input.launchReadinessPreReconciliation?.report.productReadinessSimulation,
      autonomousBuildExecutionProof:
        input.launchReadinessPreReconciliation?.report.autonomousBuildExecutionProof,
    });
  }

  const claimAudits = consistencyAudit?.report.claimAudits ?? [];
  const reconciledClaims = reconcileTruthClaims(claimAudits);

  const launchResult = reconcileLaunchVerdictWithTruthMatrix({
    preReconciliationVerdict,
    topBlockers,
    reconciledClaims,
  });

  const integrationId = nextIntegrationId();
  const reconciliation = buildTruthMatrixReconciliation(
    reconciledClaims,
    preReconciliationVerdict,
    launchResult.postReconciliationVerdict,
    launchResult.overrideApplied,
    launchResult.overrideReason,
    integrationId,
  );

  const founderTruthSummary = buildFounderTruthSummary(
    reconciledClaims,
    reconciliation,
    launchResult,
    claimAudits,
  );

  const report = {
    readOnly: true as const,
    advisoryOnly: true as const,
    integrationId,
    generatedAt: new Date().toISOString(),
    coreQuestion: FOUNDER_TRUTH_MATRIX_INTEGRATION_CORE_QUESTION,
    reconciliation,
    founderTruthSummary,
    categorizedBlockers: launchResult.categorizedBlockers,
    consistencyAuditCacheKey: consistencyAudit?.cacheKey ?? 'none',
  };

  const cacheKey = buildCacheKey(integrationId, launchResult.postReconciliationVerdict);
  const assessment: FounderTruthMatrixIntegrationAssessment = {
    readOnly: true,
    advisoryOnly: true,
    report,
    cacheKey,
  };

  if (!input.skipHistoryRecording) {
    recordFounderTruthMatrixIntegrationAssessment(assessment);
  }

  return assessment;
}
