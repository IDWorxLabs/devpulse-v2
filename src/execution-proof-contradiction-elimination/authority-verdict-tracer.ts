/**
 * Phase 27.01 — Authority verdict tracer (V1).
 */

import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import { extractManifestIdFromDetail } from '../authority-evidence-source-realignment/authority-manifest-source-auditor.js';
import { scanAuthorityEvidenceSources } from '../evidence-propagation-reconciliation/index.js';
import { auditAuthoritySourceConsumers } from '../execution-proof-source-unification/index.js';
import type { ConsistencyVerdict } from '../founder-test-consistency-audit/founder-test-consistency-audit-types.js';
import {
  AUTHORITY_SOURCE_FILES,
  CONTRADICTION_AUDIT_TARGETS,
  CONTRADICTION_DISPLAY_NAMES,
} from './execution-proof-contradiction-elimination-registry.js';
import type {
  AuthoritativeContradictionContext,
  AuthorityVerdictTrace,
  ExecutionProofDimension,
} from './execution-proof-contradiction-elimination-types.js';
import { traceManifestSource } from './manifest-source-tracer.js';
import { traceRunIdSource } from './runid-source-tracer.js';
import { traceTimestampSource } from './timestamp-source-tracer.js';
import { traceWorkspaceSource } from './workspace-source-tracer.js';

function stageToVerdict(level: string | null | undefined): ConsistencyVerdict {
  if (level === 'PROVEN') return 'PROVEN';
  if (level === 'PARTIAL') return 'PARTIAL';
  if (level === 'NOT_PROVEN') return 'NOT_PROVEN';
  return 'UNKNOWN';
}

function buildTrace(input: {
  authorityId: (typeof CONTRADICTION_AUDIT_TARGETS)[number];
  dimension: ExecutionProofDimension;
  workspaceId: string | null;
  runId: string | null;
  manifestId: string | null;
  proofTimestamp: string | null;
  verdict: string;
  proofLevel: string;
  consumesRuntimeBridge: boolean;
  detail: string;
  authoritative: AuthoritativeContradictionContext;
}): AuthorityVerdictTrace {
  const workspaceTrace = traceWorkspaceSource({
    workspaceId: input.workspaceId,
    authoritativeWorkspaceId: input.authoritative.authoritativeWorkspaceId,
    authorityId: input.authorityId,
  });
  const runIdTrace = traceRunIdSource({
    runId: input.runId,
    authoritativeRunId: input.authoritative.authoritativeRunId,
    authorityId: input.authorityId,
  });
  const manifestTrace = traceManifestSource({
    manifestId: input.manifestId,
    authoritativeManifestId: input.authoritative.authoritativeManifestId,
    authorityId: input.authorityId,
  });
  const timestampTrace = traceTimestampSource({
    proofTimestamp: input.proofTimestamp,
    authoritativeProofTimestamp: input.authoritative.authoritativeProofTimestamp,
    authorityId: input.authorityId,
    consumesRuntimeBridge: input.consumesRuntimeBridge,
  });

  const sourceChain = [
    workspaceTrace.sourceChain,
    runIdTrace.sourceChain,
    manifestTrace.sourceChain,
    timestampTrace.sourceChain,
  ].join(' | ');

  return {
    readOnly: true,
    authorityId: input.authorityId,
    authorityName: CONTRADICTION_DISPLAY_NAMES[input.authorityId],
    dimension: input.dimension,
    workspaceId: input.workspaceId,
    runId: input.runId,
    manifestId: input.manifestId,
    proofTimestamp: input.proofTimestamp,
    verdict: input.verdict,
    proofLevel: input.proofLevel,
    sourceFile: AUTHORITY_SOURCE_FILES[input.authorityId],
    sourceChain,
    consumesRuntimeBridge: input.consumesRuntimeBridge,
    detail: input.detail,
  };
}

export function traceAuthorityVerdicts(input: {
  rootDir: string;
  runId: string | null;
  authoritative: AuthoritativeContradictionContext;
  runtimeMaterializationTruthBridge?: import('../runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-types.js').RuntimeMaterializationTruthBridgeAssessment | null;
  buildMaterializationTruthBridge?: import('../build-materialization-truth-bridge/build-materialization-truth-bridge-types.js').BuildMaterializationTruthBridgeAssessment | null;
  launchReadinessVerdict?: import('../founder-test-launch-readiness/founder-test-launch-readiness-types.js').LaunchReadinessVerdict | null;
  convergencePassToken?: string | null;
  unificationPassToken?: string | null;
}): AuthorityVerdictTrace[] {
  const traces: AuthorityVerdictTrace[] = [];
  const runtimeReport = input.runtimeMaterializationTruthBridge?.report ?? null;
  const buildReport = input.buildMaterializationTruthBridge?.report ?? null;
  const connectedBuild = assessConnectedBuildExecution({
    rootDir: input.rootDir,
    attemptBuildProofGapMaterialization: false,
  }).report;

  const workspaceId =
    input.authoritative.authoritativeWorkspaceId ??
    runtimeReport?.evidence.founderFlowRuntimeProof?.report.workspaceId ??
    connectedBuild.artifactToFileProof?.workspaceId ??
    null;

  const manifestId =
    input.authoritative.authoritativeManifestId ??
    connectedBuild.artifactToFileProof?.buildManifestId ??
    null;

  const proofTimestamp = input.authoritative.authoritativeProofTimestamp;
  const runId = input.authoritative.authoritativeRunId ?? input.runId;

  traces.push(
    buildTrace({
      authorityId: 'CONNECTED_BUILD_EXECUTION',
      dimension: 'BUILD',
      workspaceId: connectedBuild.artifactToFileProof?.workspaceId ?? workspaceId,
      runId,
      manifestId: connectedBuild.artifactToFileProof?.buildManifestId ?? manifestId,
      proofTimestamp: connectedBuild.generatedAt ?? proofTimestamp,
      verdict: connectedBuild.proofLevel,
      proofLevel: connectedBuild.proofLevel,
      consumesRuntimeBridge: false,
      detail: `artifactToFile=${connectedBuild.artifactToFileProof?.proofLevel ?? 'n/a'}, missing=${connectedBuild.buildManifest.missingArtifacts.length}`,
      authoritative: input.authoritative,
    }),
  );

  const runtimeActivation = runtimeReport?.evidence.runtimeActivationProof ?? null;
  traces.push(
    buildTrace({
      authorityId: 'CONNECTED_RUNTIME_ACTIVATION',
      dimension: 'RUNTIME',
      workspaceId:
        runtimeActivation?.activationEvidence?.workspaceId ??
        runtimeReport?.evidence.startupProofRepair?.report.entrypoint.workspaceId ??
        workspaceId,
      runId,
      manifestId,
      proofTimestamp: runtimeActivation?.generatedAt ?? proofTimestamp,
      verdict: stageToVerdict(
        runtimeReport?.evidence.startup.runtimeProofLevel ?? runtimeActivation?.runtimeProofLevel,
      ),
      proofLevel:
        runtimeReport?.evidence.startup.runtimeProofLevel ??
        runtimeActivation?.runtimeProofLevel ??
        'UNKNOWN',
      consumesRuntimeBridge: true,
      detail: `boots=${String(runtimeReport?.evidence.proofAnalysis.applicationBoots ?? false)}`,
      authoritative: input.authoritative,
    }),
  );

  const previewProof = runtimeReport?.evidence.previewExperienceProof ?? null;
  traces.push(
    buildTrace({
      authorityId: 'CONNECTED_PREVIEW_EXPERIENCE',
      dimension: 'PREVIEW',
      workspaceId: previewProof?.activationEvidence?.workspaceId ?? workspaceId,
      runId,
      manifestId,
      proofTimestamp: previewProof?.generatedAt ?? proofTimestamp,
      verdict: stageToVerdict(
        previewProof?.previewProofLevel ?? runtimeReport?.evidence.snapshot.previewProofLevel,
      ),
      proofLevel:
        previewProof?.previewProofLevel ??
        runtimeReport?.evidence.snapshot.previewProofLevel ??
        'UNKNOWN',
      consumesRuntimeBridge: true,
      detail: `urlReachable=${String(previewProof?.url.urlReachable ?? false)}`,
      authoritative: input.authoritative,
    }),
  );

  const sources = scanAuthorityEvidenceSources({
    rootDir: input.rootDir,
    runId,
    runtimeMaterializationTruthBridge: input.runtimeMaterializationTruthBridge ?? null,
    buildMaterializationTruthBridge: input.buildMaterializationTruthBridge ?? null,
    launchReadinessVerdict: input.launchReadinessVerdict ?? null,
  });

  const consumerRecords = auditAuthoritySourceConsumers({
    sources,
    authoritative: {
      readOnly: true,
      authoritativeWorkspaceId: input.authoritative.authoritativeWorkspaceId,
      authoritativeRunId: input.authoritative.authoritativeRunId,
      authoritativeManifestId: input.authoritative.authoritativeManifestId,
      authoritativeReportTimestamp: input.authoritative.authoritativeProofTimestamp,
      finalApplicationTruth: input.authoritative.applicationProven ? 'APPLICATION_PROVEN' : 'APPLICATION_NOT_PROVEN',
      applicationBoots: input.authoritative.applicationProven,
      routesReachable: input.authoritative.applicationProven,
      uiRenders: input.authoritative.applicationProven,
      founderFlowProven: input.authoritative.applicationProven,
      runtimeBridgeConsumed: true,
    },
  });

  const byId = new Map(sources.map((s) => [s.authorityId, s]));
  const consumerById = new Map(consumerRecords.map((r) => [r.authorityId, r]));

  const verificationSource = sources.find(
    (s) => s.authorityId === 'VERIFICATION_REALITY' || s.authorityId === 'CONNECTED_VERIFICATION_EXECUTION',
  );
  traces.push(
    buildTrace({
      authorityId: 'CONNECTED_VERIFICATION_EXECUTION',
      dimension: 'VERIFY',
      workspaceId: verificationSource?.workspaceId ?? workspaceId,
      runId: verificationSource?.runId ?? runId,
      manifestId: extractManifestIdFromDetail(verificationSource?.detail ?? '') ?? manifestId,
      proofTimestamp: proofTimestamp,
      verdict: verificationSource?.applicationVerdict ?? 'UNKNOWN',
      proofLevel: verificationSource?.applicationVerdict ?? 'UNKNOWN',
      consumesRuntimeBridge: verificationSource?.consumesRuntimeBridge ?? false,
      detail: verificationSource?.detail ?? 'verification authority scan',
      authoritative: input.authoritative,
    }),
  );

  const launchConsumer = consumerById.get('CONNECTED_LAUNCH_READINESS');
  const launchSource = byId.get('LAUNCH_READINESS_PROOF');
  traces.push(
    buildTrace({
      authorityId: 'CONNECTED_LAUNCH_READINESS',
      dimension: 'LAUNCH',
      workspaceId: launchConsumer?.workspaceId ?? launchSource?.workspaceId ?? workspaceId,
      runId: launchConsumer?.runId ?? launchSource?.runId ?? runId,
      manifestId: launchConsumer?.manifestId ?? manifestId,
      proofTimestamp: launchConsumer?.reportTimestamp ?? proofTimestamp,
      verdict: launchSource?.applicationVerdict ?? launchConsumer?.verdict ?? 'UNKNOWN',
      proofLevel: launchSource?.applicationVerdict ?? launchConsumer?.verdict ?? 'UNKNOWN',
      consumesRuntimeBridge: launchConsumer?.consumesRuntimeBridge ?? launchSource?.consumesRuntimeBridge ?? false,
      detail: launchSource?.detail ?? launchConsumer?.detail ?? 'launch readiness proof',
      authoritative: input.authoritative,
    }),
  );

  const truthMatrixSource = byId.get('FOUNDER_TRUTH_MATRIX');
  traces.push(
    buildTrace({
      authorityId: 'FOUNDER_TRUTH_MATRIX',
      dimension: 'APPLICATION',
      workspaceId: truthMatrixSource?.workspaceId ?? workspaceId,
      runId: truthMatrixSource?.runId ?? runId,
      manifestId: manifestId,
      proofTimestamp: proofTimestamp,
      verdict: truthMatrixSource?.applicationVerdict ?? runtimeReport?.finalApplicationTruth ?? 'UNKNOWN',
      proofLevel: truthMatrixSource?.applicationVerdict ?? 'UNKNOWN',
      consumesRuntimeBridge: truthMatrixSource?.consumesRuntimeBridge ?? true,
      detail: truthMatrixSource?.detail ?? 'truth matrix integration',
      authoritative: input.authoritative,
    }),
  );

  traces.push(
    buildTrace({
      authorityId: 'AUTHORITY_REALITY_CONVERGENCE',
      dimension: 'APPLICATION',
      workspaceId,
      runId,
      manifestId,
      proofTimestamp,
      verdict: input.convergencePassToken ? 'PROVEN' : 'PARTIAL',
      proofLevel: input.convergencePassToken ?? 'NO_PASS',
      consumesRuntimeBridge: true,
      detail: `convergencePass=${input.convergencePassToken ?? 'none'}`,
      authoritative: input.authoritative,
    }),
  );

  traces.push(
    buildTrace({
      authorityId: 'EXECUTION_PROOF_SOURCE_UNIFICATION',
      dimension: 'APPLICATION',
      workspaceId,
      runId,
      manifestId,
      proofTimestamp,
      verdict: input.unificationPassToken ? 'PROVEN' : 'PARTIAL',
      proofLevel: input.unificationPassToken ?? 'NO_PASS',
      consumesRuntimeBridge: true,
      detail: `unificationPass=${input.unificationPassToken ?? 'none'}`,
      authoritative: input.authoritative,
    }),
  );

  const founderTestSource = byId.get('FOUNDER_TEST_INTEGRATION');
  traces.push(
    buildTrace({
      authorityId: 'FOUNDER_TEST_INTEGRATION',
      dimension: 'APPLICATION',
      workspaceId: founderTestSource?.workspaceId ?? workspaceId,
      runId: founderTestSource?.runId ?? runId,
      manifestId,
      proofTimestamp,
      verdict: founderTestSource?.applicationVerdict ?? 'UNKNOWN',
      proofLevel: founderTestSource?.runtimeProofLevel ?? 'UNKNOWN',
      consumesRuntimeBridge: founderTestSource?.consumesRuntimeBridge ?? false,
      detail: founderTestSource?.detail ?? 'founder test integration',
      authoritative: input.authoritative,
    }),
  );

  const autonomousSource = byId.get('AUTONOMOUS_BUILD_EXECUTION_PROOF');
  traces.push(
    buildTrace({
      authorityId: 'AUTONOMOUS_BUILD_EXECUTION_PROOF',
      dimension: 'BUILD',
      workspaceId: autonomousSource?.workspaceId ?? workspaceId,
      runId: autonomousSource?.runId ?? runId,
      manifestId,
      proofTimestamp,
      verdict: autonomousSource?.buildProofLevel ?? 'UNKNOWN',
      proofLevel: autonomousSource?.buildProofLevel ?? 'UNKNOWN',
      consumesRuntimeBridge: false,
      detail: autonomousSource?.detail ?? `runtime=${autonomousSource?.runtimeProofLevel ?? 'n/a'}, preview=${autonomousSource?.previewProofLevel ?? 'n/a'}`,
      authoritative: input.authoritative,
    }),
  );

  if (autonomousSource) {
    traces.push(
      buildTrace({
        authorityId: 'AUTONOMOUS_BUILD_EXECUTION_PROOF',
        dimension: 'RUNTIME',
        workspaceId: autonomousSource.workspaceId ?? workspaceId,
        runId: autonomousSource.runId ?? runId,
        manifestId,
        proofTimestamp,
        verdict: autonomousSource.runtimeProofLevel,
        proofLevel: autonomousSource.runtimeProofLevel,
        consumesRuntimeBridge: false,
        detail: 'autonomous chain runtime stage',
        authoritative: input.authoritative,
      }),
    );
    traces.push(
      buildTrace({
        authorityId: 'AUTONOMOUS_BUILD_EXECUTION_PROOF',
        dimension: 'PREVIEW',
        workspaceId: autonomousSource.workspaceId ?? workspaceId,
        runId: autonomousSource.runId ?? runId,
        manifestId,
        proofTimestamp,
        verdict: autonomousSource.previewProofLevel,
        proofLevel: autonomousSource.previewProofLevel,
        consumesRuntimeBridge: false,
        detail: 'autonomous chain preview stage',
        authoritative: input.authoritative,
      }),
    );
  }

  return traces.filter((t) =>
    CONTRADICTION_AUDIT_TARGETS.includes(t.authorityId as (typeof CONTRADICTION_AUDIT_TARGETS)[number]),
  );
}

export function findTraceByDimension(
  traces: readonly AuthorityVerdictTrace[],
  dimension: ExecutionProofDimension,
  contradictoryVerdict: string,
): AuthorityVerdictTrace | null {
  return (
    traces.find(
      (t) =>
        t.dimension === dimension &&
        String(t.verdict).toUpperCase() === contradictoryVerdict.toUpperCase(),
    ) ?? null
  );
}
