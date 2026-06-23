/**
 * Phase 27.01 — Execution Proof Contradiction Elimination authority (V1).
 * Read-only. No nested validators.
 */

import { createHash } from 'node:crypto';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import { assessBuildMaterializationTruthBridge } from '../build-materialization-truth-bridge/index.js';
import { assessRuntimeMaterializationTruthBridge } from '../runtime-materialization-truth-bridge/index.js';
import { resolveNewestReportTimestamp } from '../authority-evidence-source-realignment/authority-report-source-auditor.js';
import { resolveAuthoritativeManifestId } from '../authority-evidence-source-realignment/authority-manifest-source-auditor.js';
import {
  assessAuthorityRealityConvergence,
  AUTHORITY_REALITY_CONVERGENCE_PASS,
} from '../authority-reality-convergence/index.js';
import {
  assessExecutionProofSourceUnification,
  EXECUTION_PROOF_SOURCE_UNIFICATION_PASS,
} from '../execution-proof-source-unification/index.js';
import {
  buildAuthoritativeRuntimeTruth,
} from '../evidence-propagation-reconciliation/index.js';
import {
  resolveAuthoritativeExecutionRunId,
} from '../execution-proof-source-unification/authoritative-runid-resolver.js';
import {
  resolveAuthoritativeExecutionWorkspaceId,
} from '../execution-proof-source-unification/authoritative-workspace-resolver.js';
import { traceAuthorityVerdicts } from './authority-verdict-tracer.js';
import {
  detectExecutionProofContradictions,
  planContradictionElimination,
} from './execution-proof-contradiction-detector.js';
import {
  EXECUTION_PROOF_CONTRADICTION_ELIMINATION_CACHE_KEY_PREFIX,
  EXECUTION_PROOF_CONTRADICTION_ELIMINATION_CORE_QUESTION,
  EXECUTION_PROOF_CONTRADICTION_ELIMINATION_PASS,
  CONTRADICTION_AUDIT_TARGETS,
} from './execution-proof-contradiction-elimination-registry.js';
import {
  recordExecutionProofContradictionReport,
  resetExecutionProofContradictionHistoryForTests,
} from './execution-proof-contradiction-history.js';
import type {
  AssessExecutionProofContradictionEliminationInput,
  AuthoritativeContradictionContext,
  ExecutionProofContradictionEliminationAssessment,
  ExecutionProofContradictionEliminationReport,
} from './execution-proof-contradiction-elimination-types.js';

let eliminationCounter = 0;

export function resetExecutionProofContradictionEliminationCounterForTests(): void {
  eliminationCounter = 0;
}

export function resetExecutionProofContradictionEliminationModuleForTests(): void {
  resetExecutionProofContradictionEliminationCounterForTests();
  resetExecutionProofContradictionHistoryForTests();
}

function nextEliminationId(): string {
  eliminationCounter += 1;
  return `execution-proof-contradiction-elimination-${eliminationCounter}-${Date.now()}`;
}

function stableCacheKey(eliminationId: string, passed: boolean): string {
  const digest = createHash('sha256')
    .update([EXECUTION_PROOF_CONTRADICTION_ELIMINATION_PASS, eliminationId, String(passed)].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${EXECUTION_PROOF_CONTRADICTION_ELIMINATION_CACHE_KEY_PREFIX}:${digest}`;
}

function buildAuthoritativeContext(input: {
  runtimeBridge: ReturnType<typeof assessRuntimeMaterializationTruthBridge>;
  buildBridge: ReturnType<typeof assessBuildMaterializationTruthBridge>;
  runId: string | null;
  convergencePassToken: string | null;
  unificationPassToken: string | null;
}): AuthoritativeContradictionContext {
  const runtimeTruth = buildAuthoritativeRuntimeTruth({
    runtimeMaterializationTruthBridge: input.runtimeBridge,
    runId: input.runId,
  });

  const buildSnapshot = input.buildBridge.report.evidence.snapshot;
  const runtimeReport = input.runtimeBridge.report;

  return {
    readOnly: true,
    applicationProven: runtimeTruth.finalApplicationTruth === 'APPLICATION_PROVEN',
    authoritativeWorkspaceId: resolveAuthoritativeExecutionWorkspaceId({
      founderFlowWorkspaceId:
        runtimeReport.evidence.founderFlowRuntimeProof?.report.workspaceId ?? null,
      runtimeBridgeWorkspaceId: runtimeTruth.authoritativeWorkspaceId,
    }),
    authoritativeRunId: resolveAuthoritativeExecutionRunId({
      explicitRunId: input.runId,
      founderFlowRunId: runtimeTruth.authoritativeRunId,
    }),
    authoritativeManifestId: resolveAuthoritativeManifestId({
      buildManifestId:
        input.buildBridge.report.evidence.connectedBuild?.artifactToFileProof?.buildManifestId ??
        null,
    }),
    authoritativeProofTimestamp: resolveNewestReportTimestamp([
      runtimeReport.generatedAt,
      input.buildBridge.report.generatedAt,
    ]),
    diskMissingArtifacts: buildSnapshot.missingArtifacts,
    diskExistingArtifacts: buildSnapshot.existingArtifacts,
    runtimeBridgeVerdict: runtimeReport.finalApplicationTruth,
    convergencePassed: input.convergencePassToken === AUTHORITY_REALITY_CONVERGENCE_PASS,
    unificationPassed: input.unificationPassToken === EXECUTION_PROOF_SOURCE_UNIFICATION_PASS,
  };
}

export function assessExecutionProofContradictionElimination(
  input: AssessExecutionProofContradictionEliminationInput = {},
): ExecutionProofContradictionEliminationAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const eliminationId = nextEliminationId();
  const generatedAt = new Date().toISOString();
  const runId = input.runId ?? null;

  const buildMaterializationReport = assessConnectedBuildExecution({
    rootDir,
    attemptBuildProofGapMaterialization: false,
  }).report;

  const buildBridge =
    input.buildMaterializationTruthBridge ??
    assessBuildMaterializationTruthBridge({
      rootDir,
      connectedBuild: buildMaterializationReport,
      skipHistoryRecording: true,
    });

  const runtimeBridge =
    input.runtimeMaterializationTruthBridge ??
    assessRuntimeMaterializationTruthBridge({
      rootDir,
      buildMaterializationTruthBridge: buildBridge,
      buildMaterializationReport,
      skipHistoryRecording: true,
    });

  const unification = assessExecutionProofSourceUnification({
    rootDir,
    runId,
    runtimeMaterializationTruthBridge: runtimeBridge,
    buildMaterializationTruthBridge: buildBridge,
    launchBlockers: input.launchBlockers,
    launchReadinessVerdict: input.launchReadinessVerdict ?? null,
    skipHistoryRecording: true,
    skipHeavyOrchestration: input.skipHeavyOrchestration ?? true,
  });

  const convergence = assessAuthorityRealityConvergence({
    rootDir,
    runId,
    runtimeMaterializationTruthBridge: runtimeBridge,
    buildMaterializationTruthBridge: buildBridge,
    launchBlockers: input.launchBlockers,
    launchReadinessVerdict: input.launchReadinessVerdict ?? null,
    skipHistoryRecording: true,
    skipHeavyOrchestration: true,
  });

  const authoritative = buildAuthoritativeContext({
    runtimeBridge,
    buildBridge,
    runId,
    convergencePassToken: convergence.report.passToken,
    unificationPassToken: unification.report.passToken,
  });

  const authorityTraces = traceAuthorityVerdicts({
    rootDir,
    runId,
    authoritative,
    runtimeMaterializationTruthBridge: runtimeBridge,
    buildMaterializationTruthBridge: buildBridge,
    launchReadinessVerdict: input.launchReadinessVerdict ?? null,
    convergencePassToken: convergence.report.passToken,
    unificationPassToken: unification.report.passToken,
  });

  const contradictions = detectExecutionProofContradictions({
    traces: authorityTraces,
    authoritative,
  });

  const elimination = planContradictionElimination({ contradictions, authoritative });

  const tracedAuthorityIds = new Set(authorityTraces.map((t) => t.authorityId));
  const allAuthoritiesTraced = CONTRADICTION_AUDIT_TARGETS.every((id) => tracedAuthorityIds.has(id));

  const allContradictionsIdentified =
    contradictions.length === 0 ||
    contradictions.every((c) => c.rootCause !== 'UNKNOWN' && c.evidencePath.length > 0);

  const allInfrastructureDefects =
    contradictions.length === 0 ||
    contradictions.every((c) => c.reclassification === 'TESTING_INFRASTRUCTURE_DEFECT');

  const pass =
    allAuthoritiesTraced &&
    allContradictionsIdentified &&
    allInfrastructureDefects &&
    elimination.truthMatrixMisreportSuppressed &&
    Boolean(authoritative.authoritativeWorkspaceId) &&
    Boolean(authoritative.authoritativeRunId) &&
    (authoritative.applicationProven || contradictions.length === 0);

  const report: ExecutionProofContradictionEliminationReport = {
    readOnly: true,
    eliminationId,
    generatedAt,
    coreQuestion: EXECUTION_PROOF_CONTRADICTION_ELIMINATION_CORE_QUESTION,
    authoritative,
    authorityTraces,
    contradictions,
    elimination,
    allAuthoritiesTraced,
    allContradictionsIdentified,
    passToken: pass ? EXECUTION_PROOF_CONTRADICTION_ELIMINATION_PASS : null,
  };

  if (!input.skipHistoryRecording) {
    recordExecutionProofContradictionReport(report);
  }

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'EXECUTION_PROOF_CONTRADICTION_ELIMINATION_COMPLETE',
    report,
    cacheKey: stableCacheKey(eliminationId, pass),
  };
}

export function applyExecutionProofContradictionEliminationSync(input: {
  rootDir?: string;
  runId?: string | null;
  runtimeMaterializationTruthBridge?: AssessExecutionProofContradictionEliminationInput['runtimeMaterializationTruthBridge'];
  buildMaterializationTruthBridge?: AssessExecutionProofContradictionEliminationInput['buildMaterializationTruthBridge'];
  launchBlockers?: AssessExecutionProofContradictionEliminationInput['launchBlockers'];
  launchReadinessVerdict?: AssessExecutionProofContradictionEliminationInput['launchReadinessVerdict'];
  skipHistoryRecording?: boolean;
}): {
  readOnly: true;
  assessment: ExecutionProofContradictionEliminationAssessment;
  reclassifiedBlockerIds: string[];
  genuineBlockerIds: string[];
} {
  const assessment = assessExecutionProofContradictionElimination({
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
    const matchesMisreport = /ARTIFACTS_MISREPORTED|PROOF_STALE_VS_DISK|AUTHORITY_DISAGREEMENT/i.test(
      blocker.explanation,
    );
    const matchesExecutionContradiction =
      /BUILD.*PARTIAL|RUNTIME.*NOT_PROVEN|PREVIEW.*NOT_PROVEN|LAUNCH.*NOT_PROVEN/i.test(
        blocker.explanation,
      );

    if (
      assessment.report.authoritative.applicationProven &&
      assessment.report.authoritative.diskMissingArtifacts === 0 &&
      (matchesMisreport || matchesExecutionContradiction)
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
