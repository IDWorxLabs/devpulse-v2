/**
 * Phase 27.00 — Authority Reality Convergence authority (V1).
 * Read-only. No nested validators.
 */

import { createHash } from 'node:crypto';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import { assessBuildMaterializationTruthBridge } from '../build-materialization-truth-bridge/index.js';
import { assessRuntimeMaterializationTruthBridge } from '../runtime-materialization-truth-bridge/index.js';
import {
  buildAuthoritativeRuntimeTruth,
  scanAuthorityEvidenceSources,
} from '../evidence-propagation-reconciliation/index.js';
import { resolveNewestReportTimestamp } from '../authority-evidence-source-realignment/authority-report-source-auditor.js';
import {
  assessExecutionProofSourceUnification,
  auditAuthoritySourceConsumers,
  computeExecutionProofSourceAgreement,
} from '../execution-proof-source-unification/index.js';
import { CHAT_CAPABILITY_ANSWER_QUALITY_PASS } from '../chat-capability-answer-quality/chat-capability-answer-quality-registry.js';
import { auditAuthoritativeManifest } from './authoritative-manifest-auditor.js';
import { auditAuthoritativeRunId } from './authoritative-runid-auditor.js';
import { auditAuthoritativeWorkspace } from './authoritative-workspace-auditor.js';
import { auditProofTimestamps } from './proof-timestamp-auditor.js';
import { auditVerdictDivergence } from './verdict-divergence-auditor.js';
import { reconcileAuthorityReality } from './authority-reality-convergence-reconciliation.js';
import {
  AUTHORITY_REALITY_CONVERGENCE_CACHE_KEY_PREFIX,
  AUTHORITY_REALITY_CONVERGENCE_CORE_QUESTION,
  AUTHORITY_REALITY_CONVERGENCE_PASS,
} from './authority-reality-convergence-registry.js';
import {
  recordAuthorityRealityConvergenceReport,
  resetAuthorityRealityConvergenceHistoryForTests,
} from './authority-reality-convergence-history.js';
import {
  computeLaunchCriticalAlignment,
  traceLaunchCriticalAuthorities,
} from './launch-critical-authority-tracer.js';
import { detectStaleConsumers } from './stale-consumer-detector.js';
import type {
  AssessAuthorityRealityConvergenceInput,
  AuthoritativeRealitySource,
  AuthorityRealityConvergenceAssessment,
  AuthorityRealityConvergenceReport,
} from './authority-reality-convergence-types.js';

let convergenceCounter = 0;

export function resetAuthorityRealityConvergenceCounterForTests(): void {
  convergenceCounter = 0;
}

export function resetAuthorityRealityConvergenceModuleForTests(): void {
  resetAuthorityRealityConvergenceCounterForTests();
  resetAuthorityRealityConvergenceHistoryForTests();
}

function nextConvergenceId(): string {
  convergenceCounter += 1;
  return `authority-reality-convergence-${convergenceCounter}-${Date.now()}`;
}

function stableCacheKey(convergenceId: string, agreement: boolean): string {
  const digest = createHash('sha256')
    .update([AUTHORITY_REALITY_CONVERGENCE_PASS, convergenceId, String(agreement)].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${AUTHORITY_REALITY_CONVERGENCE_CACHE_KEY_PREFIX}:${digest}`;
}

function buildAuthoritativeRealitySource(input: {
  executionAuthoritative: ReturnType<
    typeof assessExecutionProofSourceUnification
  >['report']['authoritative'];
  buildBridgeReport?: {
    generatedAt?: string;
    evidence?: {
      snapshot?: {
        missingArtifacts?: number;
        existingArtifacts?: number;
        workspaceCount?: number;
        workspaceExists?: boolean;
      };
    };
  } | null;
  runtimeBridgeReport?: { generatedAt?: string } | null;
}): AuthoritativeRealitySource {
  const snapshot = input.buildBridgeReport?.evidence?.snapshot;
  return {
    ...input.executionAuthoritative,
    readOnly: true,
    authoritativeProofTimestamp: resolveNewestReportTimestamp([
      input.runtimeBridgeReport?.generatedAt,
      input.buildBridgeReport?.generatedAt,
      input.executionAuthoritative.authoritativeReportTimestamp,
    ]),
    diskMissingArtifacts: snapshot?.missingArtifacts ?? 0,
    diskExistingArtifacts: snapshot?.existingArtifacts ?? 0,
    workspaceExistsOnDisk: snapshot?.workspaceExists ?? (snapshot?.workspaceCount ?? 0) > 0,
  };
}

function evaluateChatCapabilityPropagation(input: {
  chatCapabilityAnswerQuality?: AssessAuthorityRealityConvergenceInput['chatCapabilityAnswerQuality'];
  chatStressSimulation?: AssessAuthorityRealityConvergenceInput['chatStressSimulation'];
}): boolean {
  const capabilityPass =
    input.chatCapabilityAnswerQuality?.report.passToken === CHAT_CAPABILITY_ANSWER_QUALITY_PASS;
  if (!capabilityPass) return true;

  const stressScenarios = input.chatStressSimulation?.scenariosExecuted ?? 0;
  const stressPassed = input.chatStressSimulation?.passedCount ?? 0;
  if (stressScenarios === 0) return true;

  return stressPassed > 0 || (input.chatStressSimulation?.overallScore ?? 0) >= 85;
}

export function assessAuthorityRealityConvergence(
  input: AssessAuthorityRealityConvergenceInput = {},
): AuthorityRealityConvergenceAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const convergenceId = nextConvergenceId();
  const generatedAt = new Date().toISOString();

  const buildMaterializationReport = assessConnectedBuildExecution({
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

  const runId = input.runId ?? null;

  const unification = assessExecutionProofSourceUnification({
    rootDir,
    runId,
    runtimeMaterializationTruthBridge,
    buildMaterializationTruthBridge,
    launchBlockers: input.launchBlockers,
    launchReadinessVerdict: input.launchReadinessVerdict ?? null,
    skipHistoryRecording: true,
    skipHeavyOrchestration: input.skipHeavyOrchestration ?? true,
  });

  const buildBridgeReport = buildMaterializationTruthBridge.report as {
    generatedAt?: string;
    evidence?: {
      snapshot?: {
        missingArtifacts?: number;
        existingArtifacts?: number;
        workspaceCount?: number;
        workspaceExists?: boolean;
      };
    };
  };

  const authoritative = buildAuthoritativeRealitySource({
    executionAuthoritative: unification.report.authoritative,
    buildBridgeReport,
    runtimeBridgeReport: runtimeMaterializationTruthBridge.report as { generatedAt?: string },
  });

  const runtimeTruth = buildAuthoritativeRuntimeTruth({
    runtimeMaterializationTruthBridge,
    runId,
  });

  const sources = scanAuthorityEvidenceSources({
    rootDir,
    runId,
    runtimeMaterializationTruthBridge,
    buildMaterializationTruthBridge,
    launchReadinessVerdict: input.launchReadinessVerdict ?? null,
  });

  const consumerRecords = auditAuthoritySourceConsumers({ sources, authoritative });
  const workspaceFindings = auditAuthoritativeWorkspace({ authoritative, consumerRecords });
  const runIdFindings = auditAuthoritativeRunId({ authoritative, consumerRecords });
  const manifestFindings = auditAuthoritativeManifest({ authoritative, consumerRecords });
  const proofTimestampFindings = auditProofTimestamps({ authoritative, consumerRecords });
  const verdictFindings = auditVerdictDivergence({ authoritative, consumerRecords });
  const auditFindings = [
    ...workspaceFindings,
    ...runIdFindings,
    ...manifestFindings,
    ...proofTimestampFindings,
    ...verdictFindings,
  ];

  const launchCriticalTraces = traceLaunchCriticalAuthorities({
    authoritative,
    consumerRecords,
    auditFindings,
  });

  const divergences = detectStaleConsumers({ authoritative, auditFindings });
  const preConvergenceAgreement = computeExecutionProofSourceAgreement(consumerRecords);

  const reconciliation = reconcileAuthorityReality({
    authoritative,
    launchCriticalTraces,
    divergences,
    auditFindings,
    launchBlockers: input.launchBlockers,
  });

  const chatCapabilityPropagationAligned = evaluateChatCapabilityPropagation({
    chatCapabilityAnswerQuality: input.chatCapabilityAnswerQuality,
    chatStressSimulation: input.chatStressSimulation,
  });

  const noArtifactsMisreportWhenDiskClean =
    authoritative.diskMissingArtifacts !== 0 ||
    !divergences.some((d) => d.divergenceReason === 'ARTIFACTS_MISREPORTED');

  const onlyInfrastructureDivergences = divergences.every(
    (d) => d.launchImpact !== 'REAL_PRODUCT_GAP',
  );

  const postConvergenceAgreement =
    preConvergenceAgreement ||
    reconciliation.allLaunchCriticalAligned ||
    computeLaunchCriticalAlignment(launchCriticalTraces) ||
    (authoritative.finalApplicationTruth === 'APPLICATION_PROVEN' &&
      Boolean(authoritative.authoritativeWorkspaceId) &&
      Boolean(authoritative.authoritativeRunId) &&
      noArtifactsMisreportWhenDiskClean &&
      onlyInfrastructureDivergences);

  const pass =
    Boolean(authoritative.authoritativeWorkspaceId) &&
    Boolean(authoritative.authoritativeRunId) &&
    runtimeTruth.finalApplicationTruth === 'APPLICATION_PROVEN' &&
    noArtifactsMisreportWhenDiskClean &&
    chatCapabilityPropagationAligned &&
    postConvergenceAgreement;

  const report: AuthorityRealityConvergenceReport = {
    readOnly: true,
    convergenceId,
    generatedAt,
    coreQuestion: AUTHORITY_REALITY_CONVERGENCE_CORE_QUESTION,
    authoritative,
    auditFindings,
    launchCriticalTraces,
    divergences,
    reconciliation,
    preConvergenceAgreement,
    postConvergenceAgreement,
    chatCapabilityPropagationAligned,
    passToken: pass ? AUTHORITY_REALITY_CONVERGENCE_PASS : null,
  };

  if (!input.skipHistoryRecording) {
    recordAuthorityRealityConvergenceReport(report);
  }

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'AUTHORITY_REALITY_CONVERGENCE_COMPLETE',
    report,
    cacheKey: stableCacheKey(convergenceId, postConvergenceAgreement),
  };
}

export function applyAuthorityRealityConvergenceSync(input: {
  rootDir?: string;
  runId?: string | null;
  runtimeMaterializationTruthBridge?: AssessAuthorityRealityConvergenceInput['runtimeMaterializationTruthBridge'];
  buildMaterializationTruthBridge?: AssessAuthorityRealityConvergenceInput['buildMaterializationTruthBridge'];
  launchBlockers?: AssessAuthorityRealityConvergenceInput['launchBlockers'];
  launchReadinessVerdict?: AssessAuthorityRealityConvergenceInput['launchReadinessVerdict'];
  chatCapabilityAnswerQuality?: AssessAuthorityRealityConvergenceInput['chatCapabilityAnswerQuality'];
  chatStressSimulation?: AssessAuthorityRealityConvergenceInput['chatStressSimulation'];
  skipHistoryRecording?: boolean;
}): {
  readOnly: true;
  assessment: AuthorityRealityConvergenceAssessment;
  reclassifiedBlockerIds: string[];
  genuineBlockerIds: string[];
} {
  const assessment = assessAuthorityRealityConvergence({
    rootDir: input.rootDir,
    runId: input.runId,
    runtimeMaterializationTruthBridge: input.runtimeMaterializationTruthBridge,
    buildMaterializationTruthBridge: input.buildMaterializationTruthBridge,
    launchBlockers: input.launchBlockers,
    launchReadinessVerdict: input.launchReadinessVerdict,
    chatCapabilityAnswerQuality: input.chatCapabilityAnswerQuality,
    chatStressSimulation: input.chatStressSimulation,
    skipHistoryRecording: input.skipHistoryRecording ?? true,
    skipHeavyOrchestration: true,
  });

  const reclassifiedBlockerIds: string[] = [];
  const genuineBlockerIds: string[] = [];

  for (const blocker of input.launchBlockers ?? []) {
    const isAuthorityDisagreement = assessment.report.divergences.some(
      (d) =>
        d.launchImpact === 'TESTING_INFRASTRUCTURE_DEFECT' ||
        d.launchImpact === 'EVIDENCE_PROPAGATION_FAILURE',
    );
    const matchesStalePattern =
      /missing artifacts|NOT_PROVEN|PROOF_STALE|ARTIFACTS_MISREPORTED|AUTHORITY_DISAGREEMENT|EVIDENCE_PROPAGATION/i.test(
        blocker.explanation,
      );

    if (
      isAuthorityDisagreement &&
      matchesStalePattern &&
      assessment.report.authoritative.finalApplicationTruth === 'APPLICATION_PROVEN' &&
      assessment.report.authoritative.diskMissingArtifacts === 0
    ) {
      reclassifiedBlockerIds.push(blocker.id);
    } else if (
      assessment.report.reconciliation.staleOnlyBlockersReclassified > 0 &&
      matchesStalePattern
    ) {
      reclassifiedBlockerIds.push(blocker.id);
    } else {
      genuineBlockerIds.push(blocker.id);
    }
  }

  return {
    readOnly: true,
    assessment,
    reclassifiedBlockerIds,
    genuineBlockerIds,
  };
}

