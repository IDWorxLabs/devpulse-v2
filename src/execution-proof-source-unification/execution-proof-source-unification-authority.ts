/**
 * Phase 26.94 — Execution Proof Source Unification authority (V1).
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
import { resolveAuthoritativeManifestId } from '../authority-evidence-source-realignment/authority-manifest-source-auditor.js';
import { resolveNewestReportTimestamp } from '../authority-evidence-source-realignment/authority-report-source-auditor.js';
import {
  auditAuthoritySourceConsumers,
  computeExecutionProofSourceAgreement,
} from './authority-source-consumer-auditor.js';
import { resolveAuthoritativeExecutionRunId } from './authoritative-runid-resolver.js';
import { resolveAuthoritativeExecutionWorkspaceId } from './authoritative-workspace-resolver.js';
import { reconcileExecutionProofSources } from './execution-proof-source-reconciliation.js';
import {
  EXECUTION_PROOF_SOURCE_UNIFICATION_CACHE_KEY_PREFIX,
  EXECUTION_PROOF_SOURCE_UNIFICATION_CORE_QUESTION,
  EXECUTION_PROOF_SOURCE_UNIFICATION_PASS,
} from './execution-proof-source-unification-registry.js';
import {
  recordExecutionProofSourceUnificationReport,
  resetExecutionProofSourceUnificationHistoryForTests,
} from './execution-proof-source-unification-history.js';
import { detectStaleExecutionSources } from './stale-execution-source-detector.js';
import type {
  AssessExecutionProofSourceUnificationInput,
  AuthoritativeExecutionSource,
  ExecutionProofSourceUnificationAssessment,
  ExecutionProofSourceUnificationReport,
} from './execution-proof-source-unification-types.js';

let unificationCounter = 0;

export function resetExecutionProofSourceUnificationCounterForTests(): void {
  unificationCounter = 0;
}

export function resetExecutionProofSourceUnificationModuleForTests(): void {
  resetExecutionProofSourceUnificationCounterForTests();
  resetExecutionProofSourceUnificationHistoryForTests();
}

function nextUnificationId(): string {
  unificationCounter += 1;
  return `execution-proof-source-unification-${unificationCounter}-${Date.now()}`;
}

function stableCacheKey(unificationId: string, agreement: boolean): string {
  const digest = createHash('sha256')
    .update([EXECUTION_PROOF_SOURCE_UNIFICATION_PASS, unificationId, String(agreement)].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${EXECUTION_PROOF_SOURCE_UNIFICATION_CACHE_KEY_PREFIX}:${digest}`;
}

function buildAuthoritativeExecutionSource(input: {
  runtimeTruth: ReturnType<typeof buildAuthoritativeRuntimeTruth>;
  runtimeBridgeReport?: {
    generatedAt?: string;
    evidence?: {
      connectedBuild?: { buildManifestId?: string };
      founderFlowRuntimeProof?: { report?: { workspaceId?: string } };
    };
  } | null;
  buildBridgeReport?: { generatedAt?: string } | null;
  runId?: string | null;
}): AuthoritativeExecutionSource {
  const founderFlowWorkspace =
    input.runtimeBridgeReport?.evidence?.founderFlowRuntimeProof?.report?.workspaceId ?? null;

  return {
    readOnly: true,
    authoritativeWorkspaceId: resolveAuthoritativeExecutionWorkspaceId({
      founderFlowWorkspaceId: founderFlowWorkspace,
      runtimeBridgeWorkspaceId: input.runtimeTruth.authoritativeWorkspaceId,
    }),
    authoritativeRunId: resolveAuthoritativeExecutionRunId({
      explicitRunId: input.runId ?? null,
      founderFlowRunId: input.runtimeTruth.authoritativeRunId,
    }),
    authoritativeManifestId: resolveAuthoritativeManifestId({
      buildManifestId:
        input.runtimeBridgeReport?.evidence?.connectedBuild?.buildManifestId ?? null,
    }),
    authoritativeReportTimestamp: resolveNewestReportTimestamp([
      input.runtimeBridgeReport?.generatedAt,
      input.buildBridgeReport?.generatedAt,
    ]),
    finalApplicationTruth: input.runtimeTruth.finalApplicationTruth,
    applicationBoots: input.runtimeTruth.applicationBoots,
    routesReachable: input.runtimeTruth.routesReachable,
    uiRenders: input.runtimeTruth.uiRenders,
    founderFlowProven: input.runtimeTruth.founderFlowProven,
    runtimeBridgeConsumed: input.runtimeTruth.runtimeBridgeConsumed,
  };
}

export function assessExecutionProofSourceUnification(
  input: AssessExecutionProofSourceUnificationInput = {},
): ExecutionProofSourceUnificationAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const unificationId = nextUnificationId();
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
  const runtimeTruth = buildAuthoritativeRuntimeTruth({
    runtimeMaterializationTruthBridge,
    runId,
  });

  const authoritative = buildAuthoritativeExecutionSource({
    runtimeTruth,
    runtimeBridgeReport: runtimeMaterializationTruthBridge.report as {
      generatedAt?: string;
      evidence?: {
        connectedBuild?: { buildManifestId?: string };
        founderFlowRuntimeProof?: { report?: { workspaceId?: string } };
      };
    },
    buildBridgeReport: buildMaterializationTruthBridge.report as { generatedAt?: string },
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
  const preUnificationAgreement = computeExecutionProofSourceAgreement(consumerRecords);
  const staleFindings = detectStaleExecutionSources({ records: consumerRecords, authoritative });
  const reconciliation = reconcileExecutionProofSources({
    authoritative,
    consumerRecords,
    staleFindings,
    launchBlockers: input.launchBlockers,
  });
  const postUnificationAgreement =
    preUnificationAgreement || reconciliation.singleAuthoritativeChain;

  const pass =
    Boolean(authoritative.authoritativeWorkspaceId) &&
    Boolean(authoritative.authoritativeRunId) &&
    authoritative.finalApplicationTruth === 'APPLICATION_PROVEN' &&
    (reconciliation.singleAuthoritativeChain || postUnificationAgreement);

  const report: ExecutionProofSourceUnificationReport = {
    readOnly: true,
    unificationId,
    generatedAt,
    coreQuestion: EXECUTION_PROOF_SOURCE_UNIFICATION_CORE_QUESTION,
    authoritative,
    consumerRecords,
    staleFindings,
    reconciliation,
    preUnificationAgreement,
    postUnificationAgreement,
    passToken: pass ? EXECUTION_PROOF_SOURCE_UNIFICATION_PASS : null,
  };

  if (!input.skipHistoryRecording) {
    recordExecutionProofSourceUnificationReport(report);
  }

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'EXECUTION_PROOF_SOURCE_UNIFICATION_COMPLETE',
    report,
    cacheKey: stableCacheKey(unificationId, postUnificationAgreement),
  };
}

export function applyExecutionProofSourceUnificationSync(input: {
  runtimeMaterializationTruthBridge?: AssessExecutionProofSourceUnificationInput['runtimeMaterializationTruthBridge'];
  buildMaterializationTruthBridge?: AssessExecutionProofSourceUnificationInput['buildMaterializationTruthBridge'];
  runId?: string | null;
  launchBlockers?: AssessExecutionProofSourceUnificationInput['launchBlockers'];
  launchReadinessVerdict?: AssessExecutionProofSourceUnificationInput['launchReadinessVerdict'];
  rootDir?: string;
  skipHistoryRecording?: boolean;
}): {
  readOnly: true;
  assessment: ExecutionProofSourceUnificationAssessment;
  reclassifiedBlockerIds: string[];
  genuineBlockerIds: string[];
} {
  const assessment = assessExecutionProofSourceUnification({
    rootDir: input.rootDir,
    runId: input.runId,
    runtimeMaterializationTruthBridge: input.runtimeMaterializationTruthBridge,
    buildMaterializationTruthBridge: input.buildMaterializationTruthBridge,
    launchBlockers: input.launchBlockers,
    launchReadinessVerdict: input.launchReadinessVerdict,
    skipHistoryRecording: input.skipHistoryRecording ?? true,
    skipHeavyOrchestration: true,
  });

  const reclassifiedBlockerIds: string[] = [];
  const genuineBlockerIds: string[] = [];

  for (const blocker of input.launchBlockers ?? []) {
    const staleFinding = assessment.report.staleFindings.some((f) =>
      /not proven|disconnected|missing artifacts|build_broken/i.test(blocker.explanation),
    );
    if (
      assessment.report.authoritative.finalApplicationTruth === 'APPLICATION_PROVEN' &&
      (staleFinding || assessment.report.staleFindings.length > 0) &&
      /not proven|disconnected|missing artifacts|build_broken|runtime|preview|build/i.test(
        blocker.explanation,
      )
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

export {
  classifyLaunchBlockerFromStaleExecutionSource,
  detectStaleExecutionSources,
} from './stale-execution-source-detector.js';

export { auditAuthoritySourceConsumers, computeExecutionProofSourceAgreement } from './authority-source-consumer-auditor.js';
