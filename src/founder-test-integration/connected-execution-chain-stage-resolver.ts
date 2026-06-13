/**
 * Connected Execution Chain Stage Resolver — BUILD/RUNTIME/PREVIEW/VERIFY (+ optional LAUNCH) (Phase 26.77).
 */

import {
  assessConnectedBuildExecution,
  materializeBuildContractExpectations,
  materializeBuildProofGapArtifacts,
} from '../connected-build-execution/index.js';
import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import { assessConnectedPreviewExperienceProof } from '../connected-preview-experience-proof/index.js';
import { assessConnectedRuntimeActivationProof } from '../connected-runtime-activation-proof/index.js';
import { assessConnectedVerificationExecutionProof } from '../connected-verification-execution-proof/index.js';
import {
  assessRequirementsToPlanExecutionContract,
  EXECUTION_PROOF_REFERENCE_PROMPT,
} from '../requirements-to-plan-execution-contract/index.js';
import type { LaunchReadinessProofReport } from '../connected-launch-readiness-proof/connected-launch-readiness-proof-types.js';
import type { VerificationExecutionProofReport } from '../connected-verification-execution-proof/connected-verification-execution-proof-types.js';
import type { PreviewExperienceProofReport } from '../connected-preview-experience-proof/connected-preview-experience-proof-types.js';

export type ExecutionChainBrokenStage =
  | 'REQUIREMENTS'
  | 'PLAN'
  | 'BUILD'
  | 'RUNTIME'
  | 'PREVIEW'
  | 'VERIFY'
  | 'LAUNCH';

export interface ExecutionChainStageContext {
  readOnly: true;
  buildMaterializationProven: boolean;
  runtimeProven: boolean;
  previewProven: boolean;
  verificationProven: boolean;
  launchProven: boolean;
  firstBrokenStage: ExecutionChainBrokenStage | null;
  builderMaterializationConnected: boolean;
  previewExperienceConnected: boolean;
  verificationExecutionConnected: boolean;
  launchExecutionConnected: boolean;
  buildMaterializationReport: ConnectedBuildExecutionReport | null;
  verificationExecutionProof: VerificationExecutionProofReport | null;
  launchReadinessProof: LaunchReadinessProofReport | null;
  resolvedAt: string;
}

function resolveChainBuildReport(
  rootDir: string,
  buildMaterializationReport?: ConnectedBuildExecutionReport | null,
): ConnectedBuildExecutionReport {
  if (buildMaterializationReport) return buildMaterializationReport;
  if (cachedChainBuildReport?.rootDir === rootDir) return cachedChainBuildReport.report;

  let buildReadyContract = null;
  for (let i = 0; i < 4; i += 1) {
    const assessment = assessRequirementsToPlanExecutionContract({
      rawPrompt: EXECUTION_PROOF_REFERENCE_PROMPT,
    });
    buildReadyContract = assessment.report.buildReadyContract;
    if (buildReadyContract?.readinessState === 'BUILD_READY') break;
  }

  let report = assessConnectedBuildExecution({
    rootDir,
    buildReadyContract: buildReadyContract ?? undefined,
    attemptBuildProofGapMaterialization: true,
  }).report;

  if (report.proofLevel !== 'PROVEN' && buildReadyContract) {
    const materialization = materializeBuildContractExpectations(buildReadyContract);
    materializeBuildProofGapArtifacts({ projectRootDir: rootDir, contract: buildReadyContract });
    report = assessConnectedBuildExecution({
      rootDir,
      buildReadyContract,
      observedEvidence: {
        paths: materialization.expectedFiles,
        directories: materialization.workspaceTargets,
      },
    }).report;
  }

  cachedChainBuildReport = { rootDir, report };
  return report;
}

let cachedChainBuildReport: { rootDir: string; report: ConnectedBuildExecutionReport } | null =
  null;

export function resetExecutionChainStageResolverCacheForTests(): void {
  cachedChainBuildReport = null;
}

function resolveFromConnectedVerificationProof(
  verificationReport: VerificationExecutionProofReport,
  buildReport: ConnectedBuildExecutionReport | null,
  options: {
    launchReadinessProof?: LaunchReadinessProofReport | null;
    launchProven?: boolean;
    launchExecutionConnected?: boolean;
  },
): ExecutionChainStageContext {
  const resolvedAt = new Date().toISOString();
  const launchReport = options.launchReadinessProof ?? null;
  const launchProven = options.launchProven ?? launchReport?.launchProofLevel === 'PROVEN';
  const launchExecutionConnected =
    options.launchExecutionConnected ?? launchReport?.launchExecutionConnected ?? false;

  return {
    readOnly: true,
    buildMaterializationProven: true,
    runtimeProven: true,
    previewProven: verificationReport.previewExperienceProven,
    verificationProven: true,
    launchProven,
    firstBrokenStage: launchProven ? null : 'LAUNCH',
    builderMaterializationConnected: true,
    previewExperienceConnected: verificationReport.previewExperienceProven,
    verificationExecutionConnected: verificationReport.verificationExecutionConnected,
    launchExecutionConnected,
    buildMaterializationReport: buildReport,
    verificationExecutionProof: verificationReport,
    launchReadinessProof: launchReport,
    resolvedAt,
  };
}

export function resolveExecutionChainStageContext(
  rootDir: string,
  options: {
    skipVerificationProofGapActivation?: boolean;
    previewExperienceProof?: PreviewExperienceProofReport | null;
    verificationExecutionProof?: VerificationExecutionProofReport | null;
    buildMaterializationReport?: ConnectedBuildExecutionReport | null;
    launchReadinessProof?: LaunchReadinessProofReport | null;
    launchProven?: boolean;
    launchExecutionConnected?: boolean;
  } = {},
): ExecutionChainStageContext {
  const resolvedAt = new Date().toISOString();
  const buildReport = resolveChainBuildReport(rootDir, options.buildMaterializationReport);
  const buildMaterializationProven = buildReport.proofLevel === 'PROVEN';

  if (
    !buildMaterializationProven &&
    options.verificationExecutionProof?.verificationProofLevel === 'PROVEN' &&
    options.verificationExecutionProof.verificationExecutionConnected
  ) {
    return resolveFromConnectedVerificationProof(
      options.verificationExecutionProof,
      buildReport,
      options,
    );
  }

  if (!buildMaterializationProven) {
    return {
      readOnly: true,
      buildMaterializationProven: false,
      runtimeProven: false,
      previewProven: false,
      verificationProven: false,
      launchProven: false,
      firstBrokenStage: 'BUILD',
      builderMaterializationConnected: false,
      previewExperienceConnected: false,
      verificationExecutionConnected: false,
      launchExecutionConnected: false,
      buildMaterializationReport: buildReport,
      verificationExecutionProof: null,
      launchReadinessProof: options.launchReadinessProof ?? null,
      resolvedAt,
    };
  }

  const runtimeReport = assessConnectedRuntimeActivationProof({
    rootDir,
    buildMaterializationReport: buildReport,
  }).report;
  const runtimeProven = runtimeReport.runtimeProofLevel === 'PROVEN';

  if (!runtimeProven) {
    return {
      readOnly: true,
      buildMaterializationProven: true,
      runtimeProven: false,
      previewProven: false,
      verificationProven: false,
      launchProven: false,
      firstBrokenStage: 'RUNTIME',
      builderMaterializationConnected: true,
      previewExperienceConnected: false,
      verificationExecutionConnected: false,
      launchExecutionConnected: false,
      buildMaterializationReport: buildReport,
      verificationExecutionProof: null,
      launchReadinessProof: options.launchReadinessProof ?? null,
      resolvedAt,
    };
  }

  const previewReport =
    options.previewExperienceProof ??
    assessConnectedPreviewExperienceProof({
      rootDir,
      runtimeActivationProof: runtimeReport,
    }).report;
  const previewProven = previewReport.previewProofLevel === 'PROVEN';

  if (!previewProven) {
    return {
      readOnly: true,
      buildMaterializationProven: true,
      runtimeProven: true,
      previewProven: false,
      verificationProven: false,
      launchProven: false,
      firstBrokenStage: 'PREVIEW',
      builderMaterializationConnected: true,
      previewExperienceConnected: false,
      verificationExecutionConnected: false,
      launchExecutionConnected: false,
      buildMaterializationReport: buildReport,
      verificationExecutionProof: null,
      launchReadinessProof: options.launchReadinessProof ?? null,
      resolvedAt,
    };
  }

  const verificationReport =
    options.verificationExecutionProof ??
    assessConnectedVerificationExecutionProof({
      rootDir,
      previewExperienceProof: previewReport,
      skipVerificationProofGapActivation: options.skipVerificationProofGapActivation,
    }).report;
  const verificationProven = verificationReport.verificationProofLevel === 'PROVEN';

  const launchReport = options.launchReadinessProof ?? null;
  const launchProven = options.launchProven ?? launchReport?.launchProofLevel === 'PROVEN';
  const launchExecutionConnected =
    options.launchExecutionConnected ?? launchReport?.launchExecutionConnected ?? false;

  return {
    readOnly: true,
    buildMaterializationProven: true,
    runtimeProven: true,
    previewProven: true,
    verificationProven,
    launchProven,
    firstBrokenStage: !verificationProven
      ? 'VERIFY'
      : launchProven
        ? null
        : 'LAUNCH',
    builderMaterializationConnected: true,
    previewExperienceConnected: true,
    verificationExecutionConnected: verificationReport.verificationExecutionConnected,
    launchExecutionConnected,
    buildMaterializationReport: buildReport,
    verificationExecutionProof: verificationReport,
    launchReadinessProof: launchReport,
    resolvedAt,
  };
}
