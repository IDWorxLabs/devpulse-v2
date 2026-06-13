/**
 * Connected Build Execution — materialization proof authority.
 * Read-only — scans filesystem for real artifact evidence; does not generate code.
 */

import { createHash } from 'node:crypto';
import {
  assessRequirementsToPlanExecutionContract,
  EXECUTION_PROOF_REFERENCE_PROMPT,
} from '../requirements-to-plan-execution-contract/index.js';
import type { BuildReadyExecutionContract } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';
import { analyzeArtifactEvidence } from './artifact-evidence-analyzer.js';
import {
  deriveMaterializationStateFromEvidence,
  materializeBuildContractExpectations,
} from './build-contract-materializer.js';
import { analyzeBuildManifest } from './build-manifest-analyzer.js';
import { analyzeBuildOutputLinkage } from './build-output-linkage-analyzer.js';
import {
  CONNECTED_BUILD_EXECUTION_CACHE_KEY_PREFIX,
  CONNECTED_BUILD_EXECUTION_CORE_QUESTION,
  CONNECTED_BUILD_EXECUTION_PASS_TOKEN,
  WORKSPACE_ROOT_DIR,
} from './connected-build-execution-registry.js';
import { recordConnectedBuildExecutionAssessment } from './connected-build-execution-history.js';
import { buildConnectedBuildExecutionReportMarkdown } from './connected-build-execution-report-builder.js';
import type {
  AssessConnectedBuildExecutionInput,
  BuildExecutionProofLevel,
  ConnectedBuildExecutionArtifacts,
  ConnectedBuildExecutionAssessment,
  ConnectedBuildExecutionReport,
  ConnectedBuildFounderQuestions,
} from './connected-build-execution-types.js';
import {
  analyzeGeneratedFiles,
  mergeObservedEvidence,
  scanObservedFileEvidence,
} from './generated-file-analyzer.js';
import { analyzeWorkspaceMaterialization } from './workspace-materialization-analyzer.js';

let assessmentCounter = 0;

export function resetConnectedBuildExecutionCounterForTests(): void {
  assessmentCounter = 0;
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `connected-build-execution-${assessmentCounter}`;
}

function stableCacheKey(assessmentId: string, proofLevel: BuildExecutionProofLevel): string {
  const digest = createHash('sha256')
    .update([CONNECTED_BUILD_EXECUTION_PASS_TOKEN, assessmentId, proofLevel].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${CONNECTED_BUILD_EXECUTION_CACHE_KEY_PREFIX}:${digest}`;
}

function resolveBuildReadyContract(
  input: AssessConnectedBuildExecutionInput,
): BuildReadyExecutionContract | null {
  if (input.buildReadyContract !== undefined) return input.buildReadyContract;
  const assessment = assessRequirementsToPlanExecutionContract({
    rawPrompt: EXECUTION_PROOF_REFERENCE_PROMPT,
  });
  return assessment.report.buildReadyContract;
}

function deriveProofLevel(input: {
  linkageConnected: boolean;
  artifactLevel: string;
  workspaceValid: boolean;
  materializationState: string;
}): BuildExecutionProofLevel {
  if (
    input.linkageConnected &&
    input.artifactLevel === 'PROVEN' &&
    input.workspaceValid &&
    input.materializationState === 'MATERIALIZED'
  ) {
    return 'PROVEN';
  }
  if (input.artifactLevel === 'PARTIAL' || input.materializationState === 'PARTIAL') {
    return 'PARTIAL';
  }
  if (input.artifactLevel === 'PROVEN' && !input.linkageConnected) {
    return 'PARTIAL';
  }
  return 'NOT_PROVEN';
}

function buildEmptyReport(assessmentId: string, reason: string): ConnectedBuildExecutionReport {
  const emptyMaterialization = {
    readOnly: true as const,
    contractId: 'none',
    buildUnits: [],
    expectedArtifacts: [],
    expectedFiles: [],
    workspaceTargets: [],
    executionOrder: [],
    materializationState: 'NOT_STARTED' as const,
  };

  return {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    proofLevel: 'NOT_PROVEN',
    buildMaterialization: emptyMaterialization,
    generatedFileEvidence: {
      readOnly: true,
      proofLevel: 'NOT_PROVEN',
      fileCount: 0,
      artifactCount: 0,
      generatedPaths: [],
      missingPaths: [],
      confidence: 0,
      byCategory: {},
    },
    buildManifest: {
      readOnly: true,
      manifestExists: false,
      linkedArtifacts: [],
      orphanArtifacts: [],
      missingArtifacts: [],
      traceabilityScore: 0,
    },
    artifactEvidence: {
      readOnly: true,
      artifactEvidenceLevel: 'NOT_PROVEN',
      filesObserved: 0,
      directoriesObserved: 0,
      buildManifestObserved: false,
      workspaceEvidenceObserved: false,
      evidenceSummary: reason,
    },
    workspaceMaterialization: {
      readOnly: true,
      workspaceExists: false,
      workspaceStructureValid: false,
      artifactCoverage: 0,
      missingAreas: [reason],
      workspacePath: null,
    },
    linkageAnalysis: {
      readOnly: true,
      linkageConnected: false,
      firstBrokenLink: 'contract→buildUnits',
      missingLinks: [reason],
      traceabilityScore: 0,
      contractToBuildUnits: false,
      buildUnitsToArtifacts: false,
      artifactsToFiles: false,
      filesToWorkspace: false,
    },
    missingEvidence: [reason],
    recommendedFix: 'Produce a BUILD_READY execution contract before materialization assessment.',
    recommendedNextActions: ['Complete requirements-to-plan contract through Phase 26.7.'],
    founderQuestions: {
      readOnly: true,
      canProveGeneratedArtifacts: false,
      canProveWorkspaceCreation: false,
      canProveBuildMaterialization: false,
      exactMissingBuildEvidence: [reason],
      whatShouldBeBuiltNext: ['Generate build-ready contract from clear user idea.'],
    },
    cacheKey: stableCacheKey(assessmentId, 'NOT_PROVEN'),
  };
}

export function assessConnectedBuildExecution(
  input: AssessConnectedBuildExecutionInput = {},
): ConnectedBuildExecutionAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const assessmentId = nextAssessmentId();
  const contract = resolveBuildReadyContract(input);

  if (!contract || contract.readinessState !== 'BUILD_READY') {
    const report = buildEmptyReport(
      assessmentId,
      contract
        ? `Build-ready contract readiness state: ${contract.readinessState}`
        : 'No build-ready execution contract available',
    );
    const assessment: ConnectedBuildExecutionAssessment = {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'BUILD_EXECUTION_COMPLETE',
      report,
    };
    recordConnectedBuildExecutionAssessment(assessment);
    return assessment;
  }

  const materialization = materializeBuildContractExpectations(contract);
  const scanned = scanObservedFileEvidence(rootDir);
  const observed = mergeObservedEvidence(scanned, input.observedEvidence);
  const workspacePrefix = `${WORKSPACE_ROOT_DIR}/${contract.contractId}`;

  const generatedFileEvidence = analyzeGeneratedFiles({
    rootDir,
    expectedPaths: materialization.expectedFiles,
    observed,
  });

  const buildManifest = analyzeBuildManifest({
    expectedArtifacts: materialization.expectedArtifacts,
    generatedFileEvidence,
    observed,
    workspacePrefix,
  });

  const workspaceMaterialization = analyzeWorkspaceMaterialization({
    rootDir,
    materialization,
    generatedFileEvidence,
  });

  const artifactEvidence = analyzeArtifactEvidence({
    generatedFileEvidence,
    buildManifest,
    workspaceMaterialization,
  });

  const linkageAnalysis = analyzeBuildOutputLinkage({
    contract,
    materialization: {
      ...materialization,
      materializationState: deriveMaterializationStateFromEvidence({
        expectedCount: materialization.expectedArtifacts.length,
        observedCount: generatedFileEvidence.generatedPaths.length,
        linkageConnected: false,
      }),
    },
    generatedFileEvidence,
    buildManifest,
    workspaceMaterialization,
  });

  const materializationState = deriveMaterializationStateFromEvidence({
    expectedCount: materialization.expectedArtifacts.length,
    observedCount: generatedFileEvidence.generatedPaths.length,
    linkageConnected: linkageAnalysis.linkageConnected,
  });

  const buildMaterialization = {
    ...materialization,
    materializationState,
  };

  const proofLevel = deriveProofLevel({
    linkageConnected: linkageAnalysis.linkageConnected,
    artifactLevel: artifactEvidence.artifactEvidenceLevel,
    workspaceValid: workspaceMaterialization.workspaceStructureValid,
    materializationState,
  });

  const missingEvidence: string[] = [
    ...linkageAnalysis.missingLinks,
    ...buildManifest.missingArtifacts.slice(0, 8),
    ...workspaceMaterialization.missingAreas,
    ...generatedFileEvidence.missingPaths.slice(0, 8).map((p) => `Missing file: ${p}`),
  ];

  let recommendedFix = 'Materialize build-ready contract into workspace with all expected artifact paths.';
  if (proofLevel === 'PROVEN') {
    recommendedFix = 'Build materialization proven — proceed to RUNTIME execution proof.';
  } else if (proofLevel === 'PARTIAL') {
    recommendedFix =
      linkageAnalysis.firstBrokenLink !== null
        ? `Fix broken link ${linkageAnalysis.firstBrokenLink} and generate missing artifacts.`
        : 'Complete partial artifact materialization before claiming BUILD proven.';
  }

  const founderQuestions: ConnectedBuildFounderQuestions = {
    readOnly: true,
    canProveGeneratedArtifacts: artifactEvidence.artifactEvidenceLevel === 'PROVEN',
    canProveWorkspaceCreation: workspaceMaterialization.workspaceStructureValid,
    canProveBuildMaterialization: proofLevel === 'PROVEN',
    exactMissingBuildEvidence: missingEvidence.slice(0, 10),
    whatShouldBeBuiltNext:
      proofLevel === 'PROVEN'
        ? ['Connect materialized workspace to runtime activation proof.']
        : [
            recommendedFix,
            ...generatedFileEvidence.missingPaths.slice(0, 3).map((p) => `Create: ${p}`),
          ],
  };

  const report: ConnectedBuildExecutionReport = {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    proofLevel,
    buildMaterialization,
    generatedFileEvidence,
    buildManifest,
    artifactEvidence,
    workspaceMaterialization,
    linkageAnalysis,
    missingEvidence: [...new Set(missingEvidence)].slice(0, 12),
    recommendedFix,
    recommendedNextActions: founderQuestions.whatShouldBeBuiltNext,
    founderQuestions,
    cacheKey: stableCacheKey(assessmentId, proofLevel),
  };

  const assessment: ConnectedBuildExecutionAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'BUILD_EXECUTION_COMPLETE',
    report,
  };

  recordConnectedBuildExecutionAssessment(assessment);
  return assessment;
}

export function buildConnectedBuildExecutionArtifacts(
  input: AssessConnectedBuildExecutionInput = {},
): ConnectedBuildExecutionArtifacts {
  const connectedBuildExecutionAssessment = assessConnectedBuildExecution(input);
  return {
    connectedBuildExecutionAssessment,
    connectedBuildExecutionReportMarkdown: buildConnectedBuildExecutionReportMarkdown(
      connectedBuildExecutionAssessment.report,
    ),
  };
}

export function resetConnectedBuildExecutionModuleForTests(): void {
  resetConnectedBuildExecutionCounterForTests();
}
