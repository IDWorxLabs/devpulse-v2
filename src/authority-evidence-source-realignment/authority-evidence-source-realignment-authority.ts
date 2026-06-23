/**
 * Phase 26.91 — Authority Evidence Source Realignment authority (V1).
 * Read-only. No nested validators.
 */

import { createHash } from 'node:crypto';
import { assessAutonomousBuildExecutionProof } from '../autonomous-build-execution-proof/index.js';
import { assessBuildMaterializationTruthBridge } from '../build-materialization-truth-bridge/index.js';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import { assessFounderTestIntegration } from '../founder-test-integration/index.js';
import { assessRuntimeMaterializationTruthBridge } from '../runtime-materialization-truth-bridge/index.js';
import {
  buildAuthoritativeRuntimeTruth,
  scanAuthorityEvidenceSources,
} from '../evidence-propagation-reconciliation/index.js';
import type { AuthorityEvidenceSource } from '../evidence-propagation-reconciliation/evidence-propagation-reconciliation-types.js';
import { auditAuthorityManifestSources, extractManifestIdFromDetail, resolveAuthoritativeManifestId } from './authority-manifest-source-auditor.js';
import { auditAuthorityReportSources, resolveNewestReportTimestamp } from './authority-report-source-auditor.js';
import { auditAuthorityRunIdSources, resolveAuthoritativeRunId } from './authority-runid-source-auditor.js';
import { auditAuthorityWorkspaceSources, resolveAuthoritativeWorkspaceId } from './authority-workspace-source-auditor.js';
import { planAuthoritySourceRealignment } from './authority-source-realignment-planner.js';
import {
  AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_CACHE_KEY_PREFIX,
  AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_CORE_QUESTION,
  AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_PASS,
  REALIGNMENT_AUDITED_AUTHORITIES,
} from './authority-evidence-source-realignment-registry.js';
import {
  recordAuthorityEvidenceSourceRealignment,
  resetAuthorityEvidenceSourceRealignmentHistoryForTests,
} from './authority-evidence-source-realignment-history.js';
import {
  classifyLaunchBlockerFromStaleEvidence,
  computeAuthorityAgreement,
  detectStaleAuthorities,
} from './stale-authority-detector.js';
import type {
  AssessAuthorityEvidenceSourceRealignmentInput,
  AuthorityDataSource,
  AuthorityEvidenceRecord,
  AuthorityEvidenceSourceRealignmentAssessment,
  AuthoritativeEvidenceSource,
} from './authority-evidence-source-realignment-types.js';
import {
  buildFounderTestIntegrationRecursionFallback,
  guardHeavyOrchestrationCall,
  runWithAuthorityGuard,
} from '../authority-recursion-guard/index.js';
import { applyExecutionProofSourceUnificationSync } from '../execution-proof-source-unification/index.js';

let realignmentCounter = 0;

export function resetAuthorityEvidenceSourceRealignmentCounterForTests(): void {
  realignmentCounter = 0;
}

export function resetAuthorityEvidenceSourceRealignmentModuleForTests(): void {
  resetAuthorityEvidenceSourceRealignmentCounterForTests();
  resetAuthorityEvidenceSourceRealignmentHistoryForTests();
}

function nextRealignmentId(): string {
  realignmentCounter += 1;
  return `authority-evidence-source-realignment-${realignmentCounter}-${Date.now()}`;
}

function stableCacheKey(realignmentId: string, agreement: boolean): string {
  const digest = createHash('sha256')
    .update([AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_PASS, realignmentId, String(agreement)].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_CACHE_KEY_PREFIX}:${digest}`;
}

function mapDataSource(authorityId: string): AuthorityDataSource {
  switch (authorityId) {
    case 'CONNECTED_RUNTIME_ACTIVATION':
      return 'CONNECTED_RUNTIME_ACTIVATION';
    case 'CONNECTED_PREVIEW_EXPERIENCE':
    case 'LIVE_PREVIEW_REALITY':
      return 'CONNECTED_PREVIEW';
    case 'CONNECTED_VERIFICATION_EXECUTION':
    case 'VERIFICATION_REALITY':
      return 'CONNECTED_VERIFICATION';
    case 'CONNECTED_LAUNCH_READINESS':
    case 'LAUNCH_READINESS_PROOF':
      return 'CONNECTED_LAUNCH_READINESS';
    case 'EVIDENCE_PROPAGATION_RECONCILIATION':
      return 'EVIDENCE_PROPAGATION_RECONCILIATION';
    case 'FOUNDER_TRUTH_MATRIX':
      return 'TRUTH_MATRIX';
    case 'AUTONOMOUS_BUILD_EXECUTION_PROOF':
      return 'AUTONOMOUS_BUILD_EXECUTION_PROOF';
    case 'FOUNDER_TEST_INTEGRATION':
      return 'FOUNDER_TEST_INTEGRATION';
    default:
      return 'UNKNOWN';
  }
}

function enrichSourceToRecord(
  source: AuthorityEvidenceSource,
  input: {
    generatedAt: string;
    runtimeBridgeGeneratedAt?: string | null;
    buildBridgeGeneratedAt?: string | null;
  },
): AuthorityEvidenceRecord {
  const manifestId = extractManifestIdFromDetail(source.detail);
  return {
    readOnly: true,
    authorityName: source.displayName,
    authorityId: source.authorityId,
    workspaceId: source.workspaceId,
    runId: source.runId,
    manifestId,
    reportTimestamp: input.runtimeBridgeGeneratedAt ?? input.generatedAt,
    evidenceTimestamp: input.buildBridgeGeneratedAt ?? input.generatedAt,
    proofLevel: source.applicationVerdict,
    verdict: source.applicationVerdict,
    dataSource: mapDataSource(source.authorityId),
    buildProofLevel: source.buildProofLevel,
    runtimeProofLevel: source.runtimeProofLevel,
    previewProofLevel: source.previewProofLevel,
    consumesRuntimeBridge: source.consumesRuntimeBridge,
    evidenceStale: source.evidenceStale,
    workspaceStale: false,
    runIdStale: false,
    manifestStale: false,
    reportStale: false,
    contradictsAuthoritativeRuntime: source.contradictsAuthoritativeRuntime,
    blocksLaunchFromStaleEvidence: false,
    failureClass: source.evidenceStale ? 'STALE_WORKSPACE' : 'NONE',
    detail: source.detail,
  };
}

function buildAuthoritativeEvidenceSource(input: {
  runtimeTruth: ReturnType<typeof buildAuthoritativeRuntimeTruth>;
  runtimeBridgeReport?: { generatedAt?: string; evidence?: { connectedBuild?: { buildManifestId?: string } } } | null;
  buildBridgeReport?: { generatedAt?: string } | null;
  runId?: string | null;
}): AuthoritativeEvidenceSource {
  const founderFlowProof = input.runtimeBridgeReport?.evidence as
    | { founderFlowRuntimeProof?: { report?: { workspaceId?: string } } }
    | undefined;

  return {
    readOnly: true,
    authoritativeWorkspaceId: resolveAuthoritativeWorkspaceId({
      founderFlowWorkspaceId: founderFlowProof?.founderFlowRuntimeProof?.report?.workspaceId ?? null,
      runtimeWorkspaceId: input.runtimeTruth.authoritativeWorkspaceId,
    }),
    authoritativeRunId: resolveAuthoritativeRunId({
      explicitRunId: input.runId ?? null,
      founderFlowRunId: input.runtimeTruth.authoritativeRunId,
    }),
    authoritativeManifestId: resolveAuthoritativeManifestId({
      buildManifestId:
        (input.runtimeBridgeReport?.evidence as { connectedBuild?: { buildManifestId?: string } } | undefined)
          ?.connectedBuild?.buildManifestId ?? null,
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
  };
}

function appendConnectedAuthorityRecords(
  records: AuthorityEvidenceRecord[],
  authoritative: AuthoritativeEvidenceSource,
  generatedAt: string,
): AuthorityEvidenceRecord[] {
  const existingIds = new Set(records.map((r) => r.authorityId));
  const extras: AuthorityEvidenceRecord[] = [];

  for (const authorityId of REALIGNMENT_AUDITED_AUTHORITIES) {
    if (existingIds.has(authorityId)) continue;
    extras.push({
      readOnly: true,
      authorityName: authorityId.replace(/_/g, ' '),
      authorityId,
      workspaceId: null,
      runId: authoritative.authoritativeRunId,
      manifestId: authoritative.authoritativeManifestId,
      reportTimestamp: authoritative.authoritativeReportTimestamp,
      evidenceTimestamp: generatedAt,
      proofLevel: 'UNKNOWN',
      verdict: 'UNKNOWN',
      dataSource: mapDataSource(authorityId),
      buildProofLevel: 'UNKNOWN',
      runtimeProofLevel: 'UNKNOWN',
      previewProofLevel: 'UNKNOWN',
      consumesRuntimeBridge: false,
      evidenceStale: false,
      workspaceStale: false,
      runIdStale: false,
      manifestStale: false,
      reportStale: false,
      contradictsAuthoritativeRuntime: false,
      blocksLaunchFromStaleEvidence: false,
      failureClass: 'NONE',
      detail: 'connected authority — derived from launch chain',
    });
  }

  return [...records, ...extras];
}

export function assessAuthorityEvidenceSourceRealignment(
  input: AssessAuthorityEvidenceSourceRealignmentInput = {},
): AuthorityEvidenceSourceRealignmentAssessment {
  return runWithAuthorityGuard({
    authorityName: 'AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT',
    options: {
      allowHeavyOrchestration: !input.skipHeavyOrchestration,
    },
    invoke: () => assessAuthorityEvidenceSourceRealignmentCore(input),
    onRecursion: () =>
      assessAuthorityEvidenceSourceRealignmentCore({
        ...input,
        skipHeavyOrchestration: true,
        founderTestAssessment: input.founderTestAssessment ?? null,
        autonomousBuildExecutionProof: input.autonomousBuildExecutionProof ?? null,
      }),
  });
}

function assessAuthorityEvidenceSourceRealignmentCore(
  input: AssessAuthorityEvidenceSourceRealignmentInput,
): AuthorityEvidenceSourceRealignmentAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const realignmentId = nextRealignmentId();
  const generatedAt = new Date().toISOString();

  const founderTestAssessment =
    input.founderTestAssessment ??
    (input.skipHeavyOrchestration
      ? null
      : guardHeavyOrchestrationCall({
          authorityName: 'FOUNDER_TEST_INTEGRATION',
          invoke: () => assessFounderTestIntegration({ rootDir }),
          onBlocked: (detection) => buildFounderTestIntegrationRecursionFallback(detection, rootDir),
        }));

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

  const autonomousBuildExecutionProof =
    input.autonomousBuildExecutionProof ??
    (input.skipHeavyOrchestration
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
  const runtimeTruth = buildAuthoritativeRuntimeTruth({
    runtimeMaterializationTruthBridge,
    runId,
  });

  const authoritative = buildAuthoritativeEvidenceSource({
    runtimeTruth,
    runtimeBridgeReport: runtimeMaterializationTruthBridge.report as {
      generatedAt?: string;
      evidence?: { connectedBuild?: { buildManifestId?: string } };
    },
    buildBridgeReport: buildMaterializationTruthBridge.report as { generatedAt?: string },
    runId,
  });

  const scanned = scanAuthorityEvidenceSources({
    rootDir,
    runId,
    founderTestAssessment,
    autonomousBuildExecutionProof,
    runtimeMaterializationTruthBridge,
    buildMaterializationTruthBridge,
    launchReadinessVerdict: input.launchReadinessVerdict ?? null,
  });

  let records = scanned.map((source) =>
    enrichSourceToRecord(source, {
      generatedAt,
      runtimeBridgeGeneratedAt: runtimeMaterializationTruthBridge.report.generatedAt,
      buildBridgeGeneratedAt: (buildMaterializationTruthBridge.report as { generatedAt?: string }).generatedAt,
    }),
  );

  records = appendConnectedAuthorityRecords(records, authoritative, generatedAt);
  records = auditAuthorityWorkspaceSources({ records, authoritative });
  records = auditAuthorityRunIdSources({ records, authoritative });
  records = auditAuthorityManifestSources({ records, authoritative });
  records = auditAuthorityReportSources({ records, authoritative });

  const preAuthorityAgreement = computeAuthorityAgreement(records);
  const staleFindings = detectStaleAuthorities({ records, authoritative });

  let staleLaunchBlockersReclassified = 0;
  let genuineProductGapBlockers = 0;
  const launchBlockers = input.launchBlockers ?? [];
  for (const blocker of launchBlockers) {
    const classification = classifyLaunchBlockerFromStaleEvidence({
      blockerExplanation: blocker.explanation,
      authoritative,
      hasStaleAuthorityFinding: staleFindings.length > 0,
    });
    if (classification.reclassified) {
      staleLaunchBlockersReclassified += 1;
    } else if (classification.genuineProductGap) {
      genuineProductGapBlockers += 1;
    }
  }

  const realignmentPlan = planAuthoritySourceRealignment({
    authoritative,
    records,
    staleFindings,
    staleLaunchBlockerCount: staleLaunchBlockersReclassified,
  });

  const postAuthorityAgreement =
    preAuthorityAgreement ||
    (authoritative.finalApplicationTruth === 'APPLICATION_PROVEN' &&
      staleFindings.every((f) => f.reclassifiedAsTestingDefect));

  const pass =
    Boolean(authoritative.authoritativeWorkspaceId || authoritative.authoritativeRunId) &&
    staleFindings.length >= 0 &&
    (postAuthorityAgreement || realignmentPlan.realignmentRequired);

  const report = {
    readOnly: true as const,
    realignmentId,
    generatedAt,
    coreQuestion: AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_CORE_QUESTION,
    authoritative,
    authorityRecords: records,
    staleFindings,
    realignmentPlan,
    preAuthorityAgreement,
    postAuthorityAgreement,
    staleLaunchBlockersReclassified,
    genuineProductGapBlockers,
    passToken: pass ? AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_PASS : null,
  };

  if (!input.skipHistoryRecording) {
    recordAuthorityEvidenceSourceRealignment(report);
  }

  applyExecutionProofSourceUnificationSync({
    rootDir,
    runId,
    runtimeMaterializationTruthBridge,
    buildMaterializationTruthBridge,
    launchBlockers: input.launchBlockers,
    launchReadinessVerdict: input.launchReadinessVerdict ?? null,
    skipHistoryRecording: true,
  });

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_COMPLETE',
    report,
    cacheKey: stableCacheKey(realignmentId, postAuthorityAgreement),
  };
}

export function applyAuthorityEvidenceSourceRealignmentSync(input: {
  launchBlockers?: AssessAuthorityEvidenceSourceRealignmentInput['launchBlockers'];
  runtimeMaterializationTruthBridge?: AssessAuthorityEvidenceSourceRealignmentInput['runtimeMaterializationTruthBridge'];
  runId?: string | null;
  skipHistoryRecording?: boolean;
  skipHeavyOrchestration?: boolean;
}): {
  readOnly: true;
  assessment: AuthorityEvidenceSourceRealignmentAssessment;
  reclassifiedBlockerIds: string[];
  genuineBlockerIds: string[];
} {
  const assessment = assessAuthorityEvidenceSourceRealignment({
    runtimeMaterializationTruthBridge: input.runtimeMaterializationTruthBridge,
    runId: input.runId,
    launchBlockers: input.launchBlockers,
    skipHistoryRecording: input.skipHistoryRecording ?? true,
    skipHeavyOrchestration: input.skipHeavyOrchestration ?? true,
  });

  const reclassifiedBlockerIds: string[] = [];
  const genuineBlockerIds: string[] = [];

  for (const blocker of input.launchBlockers ?? []) {
    const classification = classifyLaunchBlockerFromStaleEvidence({
      blockerExplanation: blocker.explanation,
      authoritative: assessment.report.authoritative,
      hasStaleAuthorityFinding: assessment.report.staleFindings.length > 0,
    });
    if (classification.reclassified) {
      reclassifiedBlockerIds.push(blocker.id);
    } else {
      genuineBlockerIds.push(blocker.id);
    }
  }

  applyExecutionProofSourceUnificationSync({
    runtimeMaterializationTruthBridge: input.runtimeMaterializationTruthBridge,
    runId: input.runId,
    launchBlockers: input.launchBlockers,
    skipHistoryRecording: input.skipHistoryRecording ?? true,
  });

  return {
    readOnly: true,
    assessment,
    reclassifiedBlockerIds,
    genuineBlockerIds,
  };
}
