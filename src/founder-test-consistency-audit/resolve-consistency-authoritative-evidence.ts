/**
 * Phase 27.07 — Resolve authoritative post-convergence evidence for consistency audit (V1).
 * Small helper only — not a new authority.
 */

import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import { assessBuildMaterializationTruthBridge } from '../build-materialization-truth-bridge/index.js';
import { assessRuntimeMaterializationTruthBridge } from '../runtime-materialization-truth-bridge/index.js';
import {
  assessAuthorityRealityConvergence,
  AUTHORITY_REALITY_CONVERGENCE_PASS,
} from '../authority-reality-convergence/index.js';
import {
  assessExecutionProofContradictionElimination,
  EXECUTION_PROOF_CONTRADICTION_ELIMINATION_PASS,
} from '../execution-proof-contradiction-elimination/index.js';
import {
  assessExecutionProofSourceUnification,
  EXECUTION_PROOF_SOURCE_UNIFICATION_PASS,
} from '../execution-proof-source-unification/index.js';
import { resolveAuthoritativeExecutionRunId } from '../execution-proof-source-unification/authoritative-runid-resolver.js';
import { resolveAuthoritativeExecutionWorkspaceId } from '../execution-proof-source-unification/authoritative-workspace-resolver.js';
import { resolveAuthoritativeManifestId } from '../authority-evidence-source-realignment/authority-manifest-source-auditor.js';
import { resolveNewestReportTimestamp } from '../authority-evidence-source-realignment/authority-report-source-auditor.js';
import type { ConnectedExecutionChainTruth } from '../founder-test-integration/connected-execution-chain-truth.js';
import type { ConsistencyVerdict } from './founder-test-consistency-audit-types.js';
import { CONSISTENCY_AUDIT_AUTHORITATIVE_EVIDENCE_REPOINT_PASS } from './founder-test-consistency-audit-registry.js';

export interface ConsistencyAuthoritativeEvidence {
  readOnly: true;
  buildVerdict: ConsistencyVerdict;
  runtimeVerdict: ConsistencyVerdict;
  previewVerdict: ConsistencyVerdict;
  launchVerdict: ConsistencyVerdict;
  workspaceId: string | null;
  runId: string | null;
  manifestId: string | null;
  evidenceSource: string;
  generatedAt: string;
  applicationProven: boolean;
  buildMaterializationProven: boolean;
  missingArtifacts: number;
  authoritativeActive: boolean;
  staleAuthorityResultsSuppressed: boolean;
  convergencePassed: boolean;
  contradictionEliminationPassed: boolean;
  sourceUnificationPassed: boolean;
  passToken: typeof CONSISTENCY_AUDIT_AUTHORITATIVE_EVIDENCE_REPOINT_PASS | null;
}

function mapBuildTruthVerdict(verdict: string | null | undefined): ConsistencyVerdict {
  switch (verdict) {
    case 'BUILD_PROVEN':
    case 'BUILD_MATERIALIZATION_PROVEN':
    case 'PROVEN':
      return 'PROVEN';
    case 'BUILD_PARTIAL':
    case 'PARTIAL':
      return 'PARTIAL';
    case 'BUILD_NOT_PROVEN':
    case 'NOT_PROVEN':
      return 'NOT_PROVEN';
    default:
      return 'UNKNOWN';
  }
}

function mapApplicationTruthVerdict(verdict: string | null | undefined): ConsistencyVerdict {
  switch (verdict) {
    case 'APPLICATION_PROVEN':
    case 'PROVEN':
      return 'PROVEN';
    case 'APPLICATION_PARTIAL':
    case 'PARTIAL':
      return 'PARTIAL';
    case 'APPLICATION_NOT_PROVEN':
    case 'NOT_PROVEN':
      return 'NOT_PROVEN';
    default:
      return 'UNKNOWN';
  }
}

function mapProofLevel(level: string | null | undefined): ConsistencyVerdict {
  if (level === 'PROVEN') return 'PROVEN';
  if (level === 'PARTIAL') return 'PARTIAL';
  if (level === 'NOT_PROVEN') return 'NOT_PROVEN';
  return 'UNKNOWN';
}

function booleanChainVerdict(proven: boolean): ConsistencyVerdict {
  return proven ? 'PROVEN' : 'NOT_PROVEN';
}

export function resolveConsistencyAuthoritativeEvidence(input: {
  rootDir: string;
  runId?: string | null;
  executionChainTruth?: ConnectedExecutionChainTruth | null;
  skipBridgeAssessment?: boolean;
}): ConsistencyAuthoritativeEvidence {
  const chain = input.executionChainTruth ?? null;

  if (input.skipBridgeAssessment) {
    return {
      readOnly: true,
      buildVerdict: booleanChainVerdict(chain?.buildProven ?? false),
      runtimeVerdict: booleanChainVerdict(chain?.runtimeProven ?? false),
      previewVerdict: booleanChainVerdict(chain?.previewProven ?? false),
      launchVerdict: booleanChainVerdict(chain?.launchProven ?? false),
      workspaceId: null,
      runId: input.runId ?? null,
      manifestId: null,
      evidenceSource: 'connected-execution-chain-truth',
      generatedAt: new Date().toISOString(),
      applicationProven: Boolean(chain?.runtimeProven && chain?.previewProven),
      buildMaterializationProven: Boolean(chain?.buildProven),
      missingArtifacts: -1,
      authoritativeActive: false,
      staleAuthorityResultsSuppressed: false,
      convergencePassed: false,
      contradictionEliminationPassed: false,
      sourceUnificationPassed: false,
      passToken: null,
    };
  }

  const connectedBuild = assessConnectedBuildExecution({
    rootDir: input.rootDir,
    attemptBuildProofGapMaterialization: false,
  }).report;

  const buildBridge = assessBuildMaterializationTruthBridge({
    rootDir: input.rootDir,
    connectedBuild,
    skipHistoryRecording: true,
  });

  const runtimeBridge = assessRuntimeMaterializationTruthBridge({
    rootDir: input.rootDir,
    buildMaterializationTruthBridge: buildBridge,
    buildMaterializationReport: connectedBuild,
    skipHistoryRecording: true,
  });

  const unification = assessExecutionProofSourceUnification({
    rootDir: input.rootDir,
    runtimeMaterializationTruthBridge: runtimeBridge,
    buildMaterializationTruthBridge: buildBridge,
    skipHistoryRecording: true,
  });

  const convergence = assessAuthorityRealityConvergence({
    rootDir: input.rootDir,
    runId: input.runId ?? null,
    runtimeMaterializationTruthBridge: runtimeBridge,
    buildMaterializationTruthBridge: buildBridge,
    skipHistoryRecording: true,
  });

  const elimination = assessExecutionProofContradictionElimination({
    rootDir: input.rootDir,
    runId: input.runId ?? null,
    runtimeMaterializationTruthBridge: runtimeBridge,
    buildMaterializationTruthBridge: buildBridge,
    skipHistoryRecording: true,
  });

  const buildReport = buildBridge.report;
  const runtimeReport = runtimeBridge.report;
  const buildSnapshot = buildReport.evidence.snapshot;
  const runtimeSnapshot = runtimeReport.evidence.snapshot;
  const buildReconciliation = buildReport.reconciliation;
  const runtimeReconciliation = runtimeReport.reconciliation;

  const buildMaterializationProven =
    buildReconciliation.rootCause === 'BUILD_MATERIALIZATION_PROVEN' ||
    buildSnapshot.materializationVerdict === 'BUILD_MATERIALIZATION_PROVEN' ||
    buildReconciliation.postReconciliationBuildVerdict === 'BUILD_PROVEN';

  const applicationProven =
    runtimeReport.finalApplicationTruth === 'APPLICATION_PROVEN' ||
    runtimeReconciliation.postReconciliationApplicationVerdict === 'APPLICATION_PROVEN';

  const missingArtifacts = buildSnapshot.missingArtifacts;
  const convergencePassed = convergence.report.passToken === AUTHORITY_REALITY_CONVERGENCE_PASS;
  const contradictionEliminationPassed =
    elimination.report.passToken === EXECUTION_PROOF_CONTRADICTION_ELIMINATION_PASS;
  const sourceUnificationPassed =
    unification.report.passToken === EXECUTION_PROOF_SOURCE_UNIFICATION_PASS;

  const authoritativeActive =
    missingArtifacts === 0 &&
    (buildMaterializationProven || applicationProven || Boolean(chain?.buildProven));

  const buildVerdict = authoritativeActive
    ? mapBuildTruthVerdict(buildReconciliation.postReconciliationBuildVerdict) !== 'UNKNOWN'
      ? mapBuildTruthVerdict(buildReconciliation.postReconciliationBuildVerdict)
      : buildMaterializationProven
        ? 'PROVEN'
        : mapProofLevel(buildSnapshot.connectedBuildProofLevel)
    : booleanChainVerdict(chain?.buildProven ?? false);

  const runtimeVerdict = authoritativeActive
    ? applicationProven
      ? 'PROVEN'
      : mapApplicationTruthVerdict(runtimeReport.finalApplicationTruth) !== 'UNKNOWN'
        ? mapApplicationTruthVerdict(runtimeReport.finalApplicationTruth)
        : booleanChainVerdict(runtimeSnapshot.executionChainRuntimeProven)
    : booleanChainVerdict(chain?.runtimeProven ?? false);

  const previewVerdict = authoritativeActive
    ? applicationProven
      ? 'PROVEN'
      : mapProofLevel(runtimeSnapshot.previewProofLevel) !== 'UNKNOWN'
        ? mapProofLevel(runtimeSnapshot.previewProofLevel)
        : booleanChainVerdict(runtimeSnapshot.executionChainPreviewProven)
    : booleanChainVerdict(chain?.previewProven ?? false);

  const launchVerdict = authoritativeActive
    ? applicationProven && buildMaterializationProven
      ? 'PROVEN'
      : booleanChainVerdict(chain?.launchProven ?? false)
    : booleanChainVerdict(chain?.launchProven ?? false);

  const workspaceId = resolveAuthoritativeExecutionWorkspaceId({
    founderFlowWorkspaceId:
      runtimeReport.evidence.founderFlowRuntimeProof?.report.workspaceId ?? null,
    runtimeBridgeWorkspaceId: connectedBuild.artifactToFileProof?.workspaceId ?? null,
  });

  const runId = resolveAuthoritativeExecutionRunId({
    explicitRunId: input.runId ?? null,
    founderFlowRunId: null,
  });

  const manifestId = resolveAuthoritativeManifestId({
    buildManifestId: connectedBuild.artifactToFileProof?.buildManifestId ?? null,
  });

  const generatedAt = resolveNewestReportTimestamp([
    runtimeReport.generatedAt,
    buildReport.generatedAt,
    unification.report.generatedAt,
    convergence.report.generatedAt,
    elimination.report.generatedAt,
  ]);

  const evidenceSource = [
    'runtime-materialization-truth-bridge',
    'build-materialization-truth-bridge',
    'execution-proof-source-unification',
    'authority-reality-convergence',
    'execution-proof-contradiction-elimination',
  ].join('+');

  const staleAuthorityResultsSuppressed =
    authoritativeActive &&
    (convergencePassed || contradictionEliminationPassed || sourceUnificationPassed);

  return {
    readOnly: true,
    buildVerdict,
    runtimeVerdict,
    previewVerdict,
    launchVerdict,
    workspaceId,
    runId,
    manifestId,
    evidenceSource,
    generatedAt: generatedAt ?? new Date().toISOString(),
    applicationProven,
    buildMaterializationProven,
    missingArtifacts,
    authoritativeActive,
    staleAuthorityResultsSuppressed,
    convergencePassed,
    contradictionEliminationPassed,
    sourceUnificationPassed,
    passToken: staleAuthorityResultsSuppressed
      ? CONSISTENCY_AUDIT_AUTHORITATIVE_EVIDENCE_REPOINT_PASS
      : null,
  };
}

export function authoritativeOverridesStaleVerdict(
  authoritative: ConsistencyAuthoritativeEvidence | null | undefined,
  dimension: 'build' | 'runtime' | 'preview' | 'launch',
  staleVerdict: ConsistencyVerdict,
): boolean {
  if (!authoritative?.authoritativeActive) return false;
  const authoritativeVerdict =
    dimension === 'build'
      ? authoritative.buildVerdict
      : dimension === 'runtime'
        ? authoritative.runtimeVerdict
        : dimension === 'preview'
          ? authoritative.previewVerdict
          : authoritative.launchVerdict;
  if (authoritativeVerdict !== 'PROVEN') return false;
  return staleVerdict === 'PARTIAL' || staleVerdict === 'NOT_PROVEN';
}

export function shouldSuppressMisreportTokens(
  authoritative: ConsistencyAuthoritativeEvidence | null | undefined,
): boolean {
  if (!authoritative?.authoritativeActive) return false;
  return authoritative.missingArtifacts === 0;
}
