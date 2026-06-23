/**
 * Phase 27.06 — Launch-critical authority evidence isolator (V1).
 * Composes existing tracers — no new reconciliation layer.
 */

import {
  assessExecutionProofContradictionElimination,
  traceAuthorityVerdicts,
  isContradictoryVerdict,
  expectedVerdictForDimension,
} from '../execution-proof-contradiction-elimination/index.js';
import {
  assessAuthorityRealityConvergence,
  AUTHORITY_REALITY_CONVERGENCE_PASS,
} from '../authority-reality-convergence/index.js';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import { assessBuildMaterializationTruthBridge } from '../build-materialization-truth-bridge/index.js';
import { assessRuntimeMaterializationTruthBridge } from '../runtime-materialization-truth-bridge/index.js';
import {
  EXECUTION_PROOF_CONTRADICTION_ELIMINATION_PASS,
} from '../execution-proof-contradiction-elimination/execution-proof-contradiction-elimination-registry.js';
import {
  EXECUTION_PROOF_SOURCE_UNIFICATION_PASS,
} from '../execution-proof-source-unification/execution-proof-source-unification-registry.js';
import { analyzeAllConsistencyClaims, collectConsistencyAuditEvidence } from '../founder-test-consistency-audit/index.js';
import type { ConsistencyClaimAudit } from '../founder-test-consistency-audit/founder-test-consistency-audit-types.js';
import type {
  AuthoritativeConvergedEvidence,
  AuthorityEvidenceConsumption,
} from './execution-proof-final-contradiction-isolation-types.js';
import {
  CLAIM_TO_DIMENSION,
  STALE_FOUNDER_TEST_AUTHORITY_IDS,
} from './execution-proof-final-contradiction-isolation-registry.js';
import { classifyFinalContradictionDivergence } from './stale-evidence-classifier.js';

function mapVerdict(value: string | null | undefined): string {
  if (!value) return 'UNKNOWN';
  return String(value).toUpperCase();
}

function expectedFromAuthoritative(
  dimension: string,
  authoritative: AuthoritativeConvergedEvidence,
): string {
  if (!authoritative.applicationProven || authoritative.missingArtifacts !== 0) {
    return 'UNKNOWN';
  }
  if (dimension === 'BUILD' || dimension === 'RUNTIME' || dimension === 'PREVIEW' || dimension === 'LAUNCH') {
    return expectedVerdictForDimension(dimension as 'BUILD' | 'RUNTIME' | 'PREVIEW' | 'LAUNCH');
  }
  return 'PROVEN';
}

export async function isolateLaunchCriticalAuthorityEvidence(input: {
  rootDir: string;
  runId: string | null;
}): Promise<{
  authoritative: AuthoritativeConvergedEvidence;
  consumptions: AuthorityEvidenceConsumption[];
  claimAudits: ConsistencyClaimAudit[];
}> {
  const buildMaterializationReport = assessConnectedBuildExecution({
    rootDir: input.rootDir,
    attemptBuildProofGapMaterialization: false,
  }).report;

  const buildBridge = assessBuildMaterializationTruthBridge({
    rootDir: input.rootDir,
    connectedBuild: buildMaterializationReport,
    skipHistoryRecording: true,
  });

  const runtimeBridge = assessRuntimeMaterializationTruthBridge({
    rootDir: input.rootDir,
    buildMaterializationTruthBridge: buildBridge,
    buildMaterializationReport,
    skipHistoryRecording: true,
  });

  const convergence = assessAuthorityRealityConvergence({
    rootDir: input.rootDir,
    runId: input.runId,
    skipHistoryRecording: true,
  });

  const elimination = assessExecutionProofContradictionElimination({
    rootDir: input.rootDir,
    runId: input.runId,
    buildMaterializationTruthBridge: buildBridge,
    runtimeMaterializationTruthBridge: runtimeBridge,
    skipHistoryRecording: true,
  });

  const authoritativeContext = elimination.report.authoritative;
  const authoritative: AuthoritativeConvergedEvidence = {
    readOnly: true,
    workspaceId: authoritativeContext.authoritativeWorkspaceId,
    runId: authoritativeContext.authoritativeRunId,
    manifestId: authoritativeContext.authoritativeManifestId,
    proofTimestamp: authoritativeContext.authoritativeProofTimestamp,
    proofLevel: authoritativeContext.runtimeBridgeVerdict,
    sourceAuthority: 'RUNTIME_MATERIALIZATION_TRUTH_BRIDGE',
    missingArtifacts: authoritativeContext.diskMissingArtifacts,
    applicationProven: authoritativeContext.applicationProven,
    convergencePassed: convergence.report.passToken === AUTHORITY_REALITY_CONVERGENCE_PASS,
    contradictionEliminationPassed:
      elimination.report.passToken === EXECUTION_PROOF_CONTRADICTION_ELIMINATION_PASS,
  };

  const traces = traceAuthorityVerdicts({
    rootDir: input.rootDir,
    runId: input.runId,
    authoritative: authoritativeContext,
    runtimeMaterializationTruthBridge: runtimeBridge,
    buildMaterializationTruthBridge: buildBridge,
    launchReadinessVerdict: null,
    convergencePassToken: convergence.report.passToken,
    unificationPassToken: EXECUTION_PROOF_SOURCE_UNIFICATION_PASS,
  });

  const evidence = await collectConsistencyAuditEvidence({ rootDir: input.rootDir });
  const claimAudits = analyzeAllConsistencyClaims(evidence);

  const consumptions: AuthorityEvidenceConsumption[] = [];

  for (const trace of traces) {
    if (!isContradictoryVerdict(String(trace.verdict))) continue;
    const divergence = classifyFinalContradictionDivergence({
      authoritative,
      consumerTimestamp: trace.proofTimestamp,
      consumerVerdict: String(trace.verdict),
      expectedVerdict: expectedFromAuthoritative(trace.dimension, authoritative),
      workspaceId: trace.workspaceId,
      runId: trace.runId,
      manifestId: trace.manifestId,
      convergencePassed: authoritative.convergencePassed,
      contradictionEliminationPassed: authoritative.contradictionEliminationPassed,
    });

    consumptions.push({
      readOnly: true,
      authorityName: trace.authorityName,
      authorityId: trace.authorityId,
      dimension: trace.dimension,
      inputEvidence: {
        workspaceId: authoritative.workspaceId,
        runId: authoritative.runId,
        manifestId: authoritative.manifestId,
        proofTimestamp: authoritative.proofTimestamp,
        proofLevel: authoritative.proofLevel,
        sourceAuthority: authoritative.sourceAuthority,
      },
      consumedEvidence: {
        workspaceId: trace.workspaceId,
        runId: trace.runId,
        manifestId: trace.manifestId,
        proofTimestamp: trace.proofTimestamp,
        proofLevel: trace.proofLevel,
        detail: trace.detail,
      },
      currentVerdict: mapVerdict(String(trace.verdict)),
      expectedVerdict: expectedFromAuthoritative(trace.dimension, authoritative),
      divergence,
      rootCause: `${divergence} — ${trace.sourceChain}`,
    });
  }

  for (const audit of claimAudits) {
    if (!isContradictoryVerdict(audit.finalTruth)) continue;

    const dimension = CLAIM_TO_DIMENSION[audit.claimId] ?? 'APPLICATION';
    const staleAuthority = audit.authorityVerdicts.find((record) =>
      STALE_FOUNDER_TEST_AUTHORITY_IDS.includes(
        record.authorityId as (typeof STALE_FOUNDER_TEST_AUTHORITY_IDS)[number],
      ),
    );

    const chainTruth = audit.authorityVerdicts.find((record) =>
      record.evidenceSource.includes('connected-execution-chain-truth'),
    );

    const divergence = classifyFinalContradictionDivergence({
      authoritative,
      consumerTimestamp: null,
      consumerVerdict: audit.finalTruth,
      expectedVerdict: chainTruth?.verdict ?? expectedFromAuthoritative(dimension, authoritative),
      workspaceId: authoritative.workspaceId,
      runId: authoritative.runId,
      manifestId: authoritative.manifestId,
      convergencePassed: authoritative.convergencePassed,
      contradictionEliminationPassed: authoritative.contradictionEliminationPassed,
      rootCauseHint: audit.rootCause,
      staleConsumer: Boolean(staleAuthority),
    });

    consumptions.push({
      readOnly: true,
      authorityName: staleAuthority?.displayName ?? 'Founder Truth Matrix',
      authorityId: staleAuthority?.authorityId ?? 'FOUNDER_TRUTH_MATRIX',
      dimension: 'CLAIM',
      claim: audit.claim,
      claimId: audit.claimId,
      inputEvidence: {
        workspaceId: authoritative.workspaceId,
        runId: authoritative.runId,
        manifestId: authoritative.manifestId,
        proofTimestamp: authoritative.proofTimestamp,
        proofLevel: authoritative.proofLevel,
        sourceAuthority: chainTruth?.evidenceSource ?? authoritative.sourceAuthority,
      },
      consumedEvidence: {
        workspaceId: authoritative.workspaceId,
        runId: authoritative.runId,
        manifestId: authoritative.manifestId,
        proofTimestamp: null,
        proofLevel: staleAuthority?.verdict ?? audit.finalTruth,
        detail: audit.contradictionReason ?? audit.rootCause,
      },
      currentVerdict: audit.finalTruth,
      expectedVerdict: chainTruth?.verdict ?? expectedFromAuthoritative(dimension, authoritative),
      divergence,
      rootCause: `${audit.rootCause} — stale consumer ${staleAuthority?.authorityId ?? 'consistency-audit'} vs ${chainTruth?.evidenceSource ?? 'authoritative chain'}`,
    });
  }

  return { authoritative, consumptions, claimAudits };
}
