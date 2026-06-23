/**
 * Evidence Propagation Reconciliation — authority orchestrator (Phase 26.88).
 * Read-only. No nested validators.
 */

import { createHash } from 'node:crypto';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import { assessRuntimeMaterializationTruthBridge } from '../runtime-materialization-truth-bridge/index.js';
import { assessBuildMaterializationTruthBridge } from '../build-materialization-truth-bridge/index.js';
import { assessFounderTestIntegration } from '../founder-test-integration/index.js';
import { assessAutonomousBuildExecutionProof } from '../autonomous-build-execution-proof/index.js';
import { scanAuthorityEvidenceSources } from './authority-evidence-source-scanner.js';
import { detectStaleEvidence, markStaleSources } from './stale-proof-detector.js';
import { buildAuthoritativeRuntimeTruth, auditRuntimeTruthConsumers } from './runtime-truth-consumer-audit.js';
import {
  applyEvidencePropagationReconciliationToClaims,
  detectAuthorityContradictions,
  reconcileAuthorityVerdicts,
} from './authority-verdict-reconciliation.js';
import {
  EVIDENCE_PROPAGATION_RECONCILIATION_CACHE_KEY_PREFIX,
  EVIDENCE_PROPAGATION_RECONCILIATION_CORE_QUESTION,
  EVIDENCE_PROPAGATION_RECONCILIATION_PASS,
} from './evidence-propagation-reconciliation-registry.js';
import {
  recordEvidencePropagationReconciliationAssessment,
  resetEvidencePropagationReconciliationHistoryForTests,
} from './evidence-propagation-history.js';
import { assessAuthorityEvidenceSourceRealignment } from '../authority-evidence-source-realignment/index.js';
import {
  buildFounderTestIntegrationRecursionFallback,
  guardHeavyOrchestrationCall,
  runWithAuthorityGuard,
} from '../authority-recursion-guard/index.js';
import { applyExecutionProofSourceUnificationSync } from '../execution-proof-source-unification/index.js';
import type {
  AssessEvidencePropagationReconciliationInput,
  EvidencePropagationReconciliationAssessment,
} from './evidence-propagation-reconciliation-types.js';
import type { ReconciledTruthClaim } from '../founder-truth-matrix-integration/founder-truth-matrix-integration-types.js';

let reconciliationCounter = 0;

export function resetEvidencePropagationReconciliationCounterForTests(): void {
  reconciliationCounter = 0;
}

export function resetEvidencePropagationReconciliationModuleForTests(): void {
  resetEvidencePropagationReconciliationCounterForTests();
  resetEvidencePropagationReconciliationHistoryForTests();
}

function nextReconciliationId(): string {
  reconciliationCounter += 1;
  return `evidence-propagation-reconciliation-${reconciliationCounter}-${Date.now()}`;
}

function stableCacheKey(reconciliationId: string, rootCause: string, agreement: boolean): string {
  const digest = createHash('sha256')
    .update([EVIDENCE_PROPAGATION_RECONCILIATION_PASS, reconciliationId, rootCause, String(agreement)].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${EVIDENCE_PROPAGATION_RECONCILIATION_CACHE_KEY_PREFIX}:${digest}`;
}

export function assessEvidencePropagationReconciliation(
  input: AssessEvidencePropagationReconciliationInput = {},
): EvidencePropagationReconciliationAssessment {
  return runWithAuthorityGuard({
    authorityName: 'EVIDENCE_PROPAGATION_RECONCILIATION',
    invoke: () => assessEvidencePropagationReconciliationCore(input),
    onRecursion: () => assessEvidencePropagationReconciliationCore({
      ...input,
      founderTestAssessment: input.founderTestAssessment ?? null,
      authorityEvidenceOverrides: input.authorityEvidenceOverrides ?? [],
    }),
  });
}

function assessEvidencePropagationReconciliationCore(
  input: AssessEvidencePropagationReconciliationInput,
): EvidencePropagationReconciliationAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const reconciliationId = nextReconciliationId();

  const founderTestAssessment =
    input.founderTestAssessment ??
    (input.authorityEvidenceOverrides?.length
      ? null
      : guardHeavyOrchestrationCall({
          authorityName: 'FOUNDER_TEST_INTEGRATION',
          invoke: () => assessFounderTestIntegration({ rootDir }),
          onBlocked: (detection) => buildFounderTestIntegrationRecursionFallback(detection, rootDir),
        }));

  const buildMaterializationReport =
    assessConnectedBuildExecution({
      rootDir,
      attemptBuildProofGapMaterialization: false,
    }).report;

  const buildMaterializationTruthBridge =
    input.buildMaterializationTruthBridge ??
    assessBuildMaterializationTruthBridge({
      rootDir,
      connectedBuild: buildMaterializationReport,
      skipHistoryRecording: true,
    });

  const runtimeMaterializationTruthBridge =
    input.runtimeMaterializationTruthBridge ??
    assessRuntimeMaterializationTruthBridge({
      rootDir,
      buildMaterializationTruthBridge,
      buildMaterializationReport,
      skipHistoryRecording: true,
    });

  const autonomousBuildExecutionProof =
    input.autonomousBuildExecutionProof ??
    (input.authorityEvidenceOverrides?.length
      ? null
      : guardHeavyOrchestrationCall({
          authorityName: 'AUTONOMOUS_BUILD_EXECUTION_PROOF',
          invoke: () =>
            assessAutonomousBuildExecutionProof({
              rootDir,
              founderTestAssessment: founderTestAssessment ?? undefined,
            }).report,
          onBlocked: () => null,
        }));

  const runId = input.runId ?? founderTestAssessment?.run.runId ?? null;

  const authoritative = buildAuthoritativeRuntimeTruth({
    runtimeMaterializationTruthBridge,
    runId,
  });

  let sources = scanAuthorityEvidenceSources({
    rootDir,
    runId,
    founderTestAssessment,
    autonomousBuildExecutionProof,
    runtimeMaterializationTruthBridge,
    buildMaterializationTruthBridge,
    launchReadinessVerdict: input.launchReadinessVerdict ?? null,
    overrides: input.authorityEvidenceOverrides,
  });

  const staleEvidence = detectStaleEvidence({ authoritative, sources });
  sources = markStaleSources(sources, staleEvidence);

  sources = sources.map((source) => ({
    ...source,
    contradictsAuthoritativeRuntime: detectAuthorityContradictions({
      authoritative,
      sources: [source],
    }).length > 0,
    consumesRuntimeBridge:
      source.consumesRuntimeBridge ||
      (authoritative.runtimeBridgeConsumed &&
        (source.authorityId === 'FOUNDER_TRUTH_MATRIX' ||
          source.authorityId === 'LAUNCH_READINESS_PROOF')),
  }));

  auditRuntimeTruthConsumers({ authoritative, sources });

  const contradictions = detectAuthorityContradictions({ authoritative, sources });

  const reconciledClaims =
    input.reconciledClaims ??
    applyEvidencePropagationReconciliationToClaims([], authoritative);

  const reconciliation = reconcileAuthorityVerdicts({
    reconciliationId,
    authoritative,
    sources,
    staleEvidence,
    contradictions,
    reconciledClaims,
    preLaunchVerdict: input.launchReadinessVerdict ?? null,
  });

  const report = {
    readOnly: true as const,
    advisoryOnly: true as const,
    reconciliationId,
    generatedAt: new Date().toISOString(),
    coreQuestion: EVIDENCE_PROPAGATION_RECONCILIATION_CORE_QUESTION,
    reconciliation,
    cacheKey: stableCacheKey(reconciliationId, reconciliation.rootCause, reconciliation.authorityAgreement),
  };

  const assessment: EvidencePropagationReconciliationAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'EVIDENCE_PROPAGATION_RECONCILIATION_COMPLETE',
    report,
    cacheKey: report.cacheKey,
  };

  if (!input.skipHistoryRecording) {
    recordEvidencePropagationReconciliationAssessment(assessment);
  }

  assessAuthorityEvidenceSourceRealignment({
    rootDir,
    runId,
    runtimeMaterializationTruthBridge,
    buildMaterializationTruthBridge,
    founderTestAssessment,
    autonomousBuildExecutionProof,
    launchReadinessVerdict: input.launchReadinessVerdict ?? null,
    skipHistoryRecording: true,
    skipHeavyOrchestration: Boolean(input.authorityEvidenceOverrides?.length),
  });

  applyExecutionProofSourceUnificationSync({
    rootDir,
    runId,
    runtimeMaterializationTruthBridge,
    buildMaterializationTruthBridge,
    launchReadinessVerdict: input.launchReadinessVerdict ?? null,
    skipHistoryRecording: true,
  });

  return assessment;
}

export function applyEvidencePropagationReconciliationSync(input: {
  reconciledClaims: ReconciledTruthClaim[];
  runtimeMaterializationTruthBridge?: AssessEvidencePropagationReconciliationInput['runtimeMaterializationTruthBridge'];
  launchReadinessVerdict?: AssessEvidencePropagationReconciliationInput['launchReadinessVerdict'];
  runId?: string | null;
  skipHistoryRecording?: boolean;
}): {
  readOnly: true;
  reconciledClaims: ReconciledTruthClaim[];
  assessment: EvidencePropagationReconciliationAssessment;
} {
  const authoritative = buildAuthoritativeRuntimeTruth({
    runtimeMaterializationTruthBridge: input.runtimeMaterializationTruthBridge,
    runId: input.runId,
  });

  const patchedClaims = applyEvidencePropagationReconciliationToClaims(
    input.reconciledClaims,
    authoritative,
  );

  const reconciliationId = nextReconciliationId();
  const reconciliation = reconcileAuthorityVerdicts({
    reconciliationId,
    authoritative,
    sources: [],
    staleEvidence: [],
    contradictions: [],
    reconciledClaims: patchedClaims,
    preLaunchVerdict: input.launchReadinessVerdict ?? null,
  });

  const report = {
    readOnly: true as const,
    advisoryOnly: true as const,
    reconciliationId,
    generatedAt: new Date().toISOString(),
    coreQuestion: EVIDENCE_PROPAGATION_RECONCILIATION_CORE_QUESTION,
    reconciliation: {
      ...reconciliation,
      reconciledClaims: patchedClaims,
    },
    cacheKey: stableCacheKey(reconciliationId, reconciliation.rootCause, reconciliation.authorityAgreement),
  };

  const assessment: EvidencePropagationReconciliationAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'EVIDENCE_PROPAGATION_RECONCILIATION_COMPLETE',
    report,
    cacheKey: report.cacheKey,
  };

  if (!input.skipHistoryRecording) {
    recordEvidencePropagationReconciliationAssessment(assessment);
  }

  return {
    readOnly: true,
    reconciledClaims: patchedClaims,
    assessment,
  };
}
