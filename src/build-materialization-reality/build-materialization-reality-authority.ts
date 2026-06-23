/**
 * Build Materialization Reality — authority orchestrator (Phase 26.74).
 * Read-only. No file mutation. No synthetic evidence.
 */

import { createHash } from 'node:crypto';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import {
  assessRequirementsToPlanExecutionContract,
  EXECUTION_PROOF_REFERENCE_PROMPT,
} from '../requirements-to-plan-execution-contract/index.js';
import { scanArtifactReality } from './artifact-scanner.js';
import {
  BUILD_MATERIALIZATION_REALITY_CACHE_KEY_PREFIX,
  BUILD_MATERIALIZATION_REALITY_CORE_QUESTION,
  BUILD_MATERIALIZATION_REALITY_PASS,
} from './build-materialization-reality-registry.js';
import { recordBuildMaterializationRealityAssessment, resetBuildMaterializationRealityHistoryForTests } from './build-materialization-reality-history.js';
import { buildBuildMaterializationRealityReportMarkdown } from './build-materialization-reality-report-builder.js';
import { buildMaterializationChain } from './chain-linker.js';
import {
  analyzeMaterializationVerdict,
  buildFounderAnswersFromVerdict,
} from './materialization-analyzer.js';
import type {
  AssessBuildMaterializationRealityInput,
  BuildMaterializationRealityAssessment,
  BuildMaterializationRealityReport,
} from './build-materialization-reality-types.js';

let assessmentCounter = 0;

export function resetBuildMaterializationRealityCounterForTests(): void {
  assessmentCounter = 0;
}

export function resetBuildMaterializationRealityModuleForTests(): void {
  resetBuildMaterializationRealityCounterForTests();
  resetBuildMaterializationRealityHistoryForTests();
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `build-materialization-reality-${assessmentCounter}-${Date.now()}`;
}

function stableCacheKey(assessmentId: string, verdict: string): string {
  const digest = createHash('sha256')
    .update([BUILD_MATERIALIZATION_REALITY_PASS, assessmentId, verdict].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${BUILD_MATERIALIZATION_REALITY_CACHE_KEY_PREFIX}:${digest}`;
}

export function assessBuildMaterializationReality(
  input: AssessBuildMaterializationRealityInput = {},
): BuildMaterializationRealityAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const assessmentId = nextAssessmentId();

  const contractAssessment = assessRequirementsToPlanExecutionContract({
    rawPrompt: EXECUTION_PROOF_REFERENCE_PROMPT,
  });
  const contractReport = contractAssessment.report;
  const buildReadyContract =
    input.buildReadyContract ?? contractReport.buildReadyContract;

  const connectedBuildReport =
    input.connectedBuildExecutionReport ??
    (input.skipConnectedBuildComparison
      ? null
      : assessConnectedBuildExecution({
          rootDir,
          buildReadyContract,
          attemptBuildProofGapMaterialization: false,
        }).report);

  const artifactScan = scanArtifactReality({
    rootDir,
    contract: buildReadyContract,
    connectedBuildReport,
  });

  const materializationChain = buildMaterializationChain({
    contractReport,
    buildReadyContract,
    artifactScan,
    connectedBuildReport,
  });

  const verdictAnalysis = analyzeMaterializationVerdict({
    artifactScan,
    materializationChain,
    connectedBuildReport,
    contractId: buildReadyContract?.contractId ?? null,
  });

  const founderAnswers = buildFounderAnswersFromVerdict({
    verdict: verdictAnalysis,
    artifactScan,
  });

  const missingEvidence = materializationChain
    .flatMap((step) => step.missingEvidence)
    .slice(0, 12);

  if (verdictAnalysis.firstBrokenFile && !missingEvidence.includes(verdictAnalysis.firstBrokenFile)) {
    missingEvidence.unshift(verdictAnalysis.firstBrokenFile);
  }

  const diskFull =
    artifactScan.totalExpectedArtifacts > 0 &&
    artifactScan.totalExistingArtifacts >= artifactScan.totalExpectedArtifacts;
  const proofFull = connectedBuildReport?.generatedFileEvidence.proofLevel === 'PROVEN';
  const evidencePropagationAligned =
    connectedBuildReport === null ? true : diskFull === proofFull || !diskFull;

  let recommendedFix = verdictAnalysis.verdictReason;
  if (verdictAnalysis.primaryVerdict === 'BUILD_MATERIALIZATION_PROVEN') {
    recommendedFix = 'Build materialization proven — advance RUNTIME execution proof.';
  }

  const cacheKey = stableCacheKey(assessmentId, verdictAnalysis.primaryVerdict);

  const report: BuildMaterializationRealityReport = {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    coreQuestion: BUILD_MATERIALIZATION_REALITY_CORE_QUESTION,
    contractId: buildReadyContract?.contractId ?? null,
    primaryVerdict: verdictAnalysis.primaryVerdict,
    gapKind: verdictAnalysis.gapKind,
    materializationChain,
    artifactScan,
    verdictAnalysis,
    connectedBuildProofLevel: connectedBuildReport?.proofLevel ?? null,
    evidencePropagationAligned,
    missingEvidence,
    recommendedFix,
    recommendedNextActions: founderAnswers.whatMustBeFixedNext,
    founderAnswers,
    cacheKey,
  };

  const assessment: BuildMaterializationRealityAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'MATERIALIZATION_REALITY_COMPLETE',
    report,
    cacheKey,
  };

  if (!input.skipHistoryRecording) {
    recordBuildMaterializationRealityAssessment(assessment);
  }

  return assessment;
}

export { buildBuildMaterializationRealityReportMarkdown };
