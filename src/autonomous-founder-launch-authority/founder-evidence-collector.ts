/**
 * Autonomous Founder Launch Authority V1 — evidence collector.
 * Consumes upstream authority outputs only — no fabricated findings.
 */

import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import { inspectUniversalAppBlueprint } from '../universal-app-blueprint/index.js';
import { getLastBlueprintVisualAssessment } from '../universal-app-blueprint-visual/index.js';
import { getLastFeatureRealityAssessment } from '../feature-reality-validation/index.js';
import { getLastUniversalFeatureContractAssessment } from '../universal-feature-contract-intelligence/index.js';
import { getLastEngineeringRealityAssessment } from '../engineering-reality-authority/index.js';
import { getLatestLaunchReadinessAssessment } from '../launch-readiness-authority/index.js';
import {
  assessCqiMaturity,
  getLastCqiMaturityAssessment,
} from '../clarifying-question-intelligence/index.js';
import type {
  FounderEvidenceSnapshot,
  FounderEvidenceSource,
  FounderRequirementDiscoveryEvidence,
} from './autonomous-founder-launch-authority-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function unavailable(sourceId: string, sourceName: string): FounderEvidenceSource {
  return {
    readOnly: true,
    sourceId,
    sourceName,
    available: false,
    passed: false,
    score: 0,
    blockers: [`${sourceName} evidence not available`],
    warnings: [],
    findings: [],
  };
}

function buildBuildRealityEvidence(input: {
  projectRootDir: string | null;
  override: FounderEvidenceSource | null | undefined;
}): FounderEvidenceSource {
  if (input.override) return input.override;
  if (!input.projectRootDir) {
    return unavailable('build-reality', 'Build Reality');
  }

  const assessment = assessConnectedBuildExecution({ rootDir: input.projectRootDir });
  const report = assessment.report;
  const passed =
    report.proofLevel === 'PROVEN' ||
    (report.workspaceMaterialization.workspaceExists &&
      report.buildMaterialization.materializationState === 'MATERIALIZED');
  const score = passed
    ? clamp(
        report.generatedFileEvidence.confidence ||
          (report.workspaceMaterialization.workspaceExists ? 35 : 0) +
            (report.buildMaterialization.materializationState === 'MATERIALIZED' ? 35 : 0) +
            (report.artifactEvidence.filesObserved > 0 ? 30 : 0),
      )
    : clamp(report.generatedFileEvidence.confidence || report.linkageAnalysis.traceabilityScore || 0);

  return {
    readOnly: true,
    sourceId: 'build-reality',
    sourceName: 'Build Reality',
    available: true,
    passed,
    score,
    blockers: report.missingEvidence.slice(0, 6),
    warnings: report.recommendedNextActions.slice(0, 6),
    findings: [
      `Build proof level: ${report.proofLevel}`,
      `Materialization state: ${report.buildMaterialization.materializationState}`,
      `Workspace present: ${report.workspaceMaterialization.workspaceExists ? 'yes' : 'no'}`,
    ],
  };
}

function buildBlueprintStructureEvidence(input: {
  workspaceDir: string | null;
  override: FounderEvidenceSource | null | undefined;
}): FounderEvidenceSource {
  if (input.override) return input.override;
  if (!input.workspaceDir) {
    return unavailable('blueprint-structure', 'Blueprint Structure');
  }

  const inspection = inspectUniversalAppBlueprint(input.workspaceDir);
  const missingCount = inspection.missingArtifacts.length + inspection.missingPatterns.length;
  const score = inspection.passed ? 100 : clamp(Math.max(0, 100 - missingCount * 8));

  return {
    readOnly: true,
    sourceId: 'blueprint-structure',
    sourceName: 'Blueprint Structure',
    available: true,
    passed: inspection.passed,
    score,
    blockers: inspection.passed
      ? []
      : [
          ...inspection.missingArtifacts.slice(0, 3).map((item) => `Missing artifact: ${item}`),
          ...inspection.missingPatterns.slice(0, 3).map((item) => `Missing pattern: ${item}`),
        ],
    warnings: inspection.passed ? [] : [`Blueprint structure gaps: ${missingCount}`],
    findings: [
      `Checked artifacts: ${inspection.checkedArtifacts}`,
      `Missing artifacts: ${inspection.missingArtifacts.length}`,
      `Missing patterns: ${inspection.missingPatterns.length}`,
    ],
  };
}

function fromBlueprintVisual(): FounderEvidenceSource {
  const assessment = getLastBlueprintVisualAssessment();
  if (!assessment) {
    return unavailable('blueprint-visual', 'Blueprint Visual');
  }

  return {
    readOnly: true,
    sourceId: 'blueprint-visual',
    sourceName: 'Blueprint Visual',
    available: true,
    passed: assessment.passed,
    score: assessment.scores.overallBlueprintScore,
    blockers: assessment.blocksLaunchReadiness
      ? [assessment.blocksLaunchReadinessReason ?? 'Blueprint visual blocks launch']
      : [],
    warnings: assessment.failedChecks
      .filter((check) => !check.critical)
      .slice(0, 4)
      .map((check) => `${check.label}: ${check.detail}`),
    findings: assessment.failedChecks.slice(0, 4).map((check) => `${check.label}: ${check.detail}`),
  };
}

function fromFeatureReality(): FounderEvidenceSource {
  const universal = getLastUniversalFeatureContractAssessment();
  const assessment = getLastFeatureRealityAssessment();

  if (assessment?.passed) {
    return {
      readOnly: true,
      sourceId: 'feature-reality',
      sourceName: 'Feature Reality',
      available: true,
      passed: true,
      score: assessment.scores.overallFeatureScore,
      blockers: [],
      warnings: assessment.failedChecks
        .filter((check) => !check.critical)
        .slice(0, 4)
        .map((check) => `${check.label}: ${check.detail}`),
      findings: assessment.failedChecks.slice(0, 4).map((check) => `${check.label}: ${check.detail}`),
    };
  }

  if (universal?.passed) {
    return {
      readOnly: true,
      sourceId: 'feature-reality',
      sourceName: 'Feature Reality',
      available: true,
      passed: true,
      score: universal.scores.overallFeatureRealityScore,
      blockers: [],
      warnings: [],
      findings: [`Feature reality satisfied via Universal Feature Contract (${universal.verdict})`],
    };
  }

  if (assessment) {
    return {
      readOnly: true,
      sourceId: 'feature-reality',
      sourceName: 'Feature Reality',
      available: true,
      passed: false,
      score: assessment.scores.overallFeatureScore,
      blockers: assessment.blocksLaunchReadiness
        ? [assessment.blocksLaunchReadinessReason ?? 'Feature reality blocks launch']
        : [],
      warnings: assessment.failedChecks
        .filter((check) => !check.critical)
        .slice(0, 4)
        .map((check) => `${check.label}: ${check.detail}`),
      findings: assessment.failedChecks.slice(0, 4).map((check) => `${check.label}: ${check.detail}`),
    };
  }

  return unavailable('feature-reality', 'Feature Reality');
}

function fromUniversalFeatureContract(): FounderEvidenceSource {
  const assessment = getLastUniversalFeatureContractAssessment();
  if (!assessment) {
    return unavailable('universal-feature-contract', 'Universal Feature Contract');
  }

  return {
    readOnly: true,
    sourceId: 'universal-feature-contract',
    sourceName: 'Universal Feature Contract',
    available: true,
    passed: assessment.passed,
    score: assessment.scores.overallFeatureRealityScore,
    blockers: assessment.blocksLaunchReadiness
      ? [assessment.blocksLaunchReadinessReason ?? 'Universal feature contract blocks launch']
      : [],
    warnings: assessment.failedChecks
      .filter((check) => !check.critical)
      .slice(0, 4)
      .map((check) => `${check.label}: ${check.detail}`),
    findings: assessment.failedChecks.slice(0, 4).map((check) => `${check.label}: ${check.detail}`),
  };
}

function fromEngineeringReality(): FounderEvidenceSource {
  const assessment = getLastEngineeringRealityAssessment();
  if (!assessment) {
    return unavailable('engineering-reality', 'Engineering Reality');
  }

  return {
    readOnly: true,
    sourceId: 'engineering-reality',
    sourceName: 'Engineering Reality',
    available: true,
    passed: assessment.passed,
    score: assessment.scores.overallEngineeringScore,
    blockers: assessment.blocksLaunchReadiness
      ? [assessment.blocksLaunchReadinessReason ?? 'Engineering reality blocks launch']
      : [],
    warnings: [
      ...assessment.security.warnings.slice(0, 2),
      ...assessment.accessibility.findings.slice(0, 2),
    ],
    findings: [
      ...assessment.security.criticalFindings.slice(0, 2),
      ...assessment.failedChecks.slice(0, 3).map((check) => `${check.label}: ${check.detail}`),
    ],
  };
}

function fromLaunchReadiness(): FounderEvidenceSource {
  const assessment = getLatestLaunchReadinessAssessment();
  if (!assessment) {
    return unavailable('launch-readiness', 'Launch Readiness');
  }

  const passed =
    assessment.readinessState === 'READY' ||
    assessment.readinessState === 'CAUTION' ||
    assessment.recommendation !== 'NOT_READY_FOR_LAUNCH';

  return {
    readOnly: true,
    sourceId: 'launch-readiness',
    sourceName: 'Launch Readiness',
    available: true,
    passed,
    score: assessment.launchConfidenceScore,
    blockers: assessment.blockers.slice(0, 6),
    warnings: assessment.recommendations.slice(0, 4),
    findings: [
      `Recommendation: ${assessment.recommendation.replaceAll('_', ' ')}`,
      `Readiness state: ${assessment.readinessState}`,
      `Launch confidence: ${assessment.launchConfidenceScore}/100`,
    ],
  };
}

export function synthesizeLaunchReadinessEvidenceFromPipeline(
  sources: Omit<FounderEvidenceSnapshot, 'launchReadiness' | 'allPrerequisitesPassed' | 'missingPrerequisites'>,
): FounderEvidenceSource {
  const scores = [
    sources.buildReality.score,
    sources.blueprintStructure.score,
    sources.blueprintVisual.score,
    sources.featureReality.score,
    sources.universalFeatureContract.score,
    sources.engineeringReality.score,
  ].filter((score) => score > 0);

  const avg =
    scores.length === 0 ? 0 : Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  const blockers = [
    ...sources.buildReality.blockers,
    ...sources.blueprintStructure.blockers,
    ...sources.blueprintVisual.blockers,
    ...sources.featureReality.blockers,
    ...sources.universalFeatureContract.blockers,
    ...sources.engineeringReality.blockers,
  ].slice(0, 6);

  const passed =
    sources.buildReality.passed &&
    sources.blueprintStructure.passed &&
    sources.blueprintVisual.passed &&
    sources.featureReality.passed &&
    sources.universalFeatureContract.passed &&
    sources.engineeringReality.passed &&
    avg >= 75;

  return {
    readOnly: true,
    sourceId: 'launch-readiness',
    sourceName: 'Launch Readiness',
    available: true,
    passed,
    score: avg,
    blockers,
    warnings: [],
    findings: [`Synthesized launch confidence from pipeline evidence: ${avg}/100`],
  };
}

function buildRequirementDiscoveryEvidence(
  productPrompt?: string | null,
): FounderRequirementDiscoveryEvidence | null {
  const assessment = productPrompt
    ? assessCqiMaturity({ userPrompt: productPrompt })
    : getLastCqiMaturityAssessment();
  if (!assessment) return null;

  return {
    readOnly: true,
    requirementConfidenceScore: assessment.requirementConfidenceScore,
    coverageMatrix: assessment.coverageMatrix.map((row) => ({
      category: row.category,
      status: row.status,
    })),
    gapSummary: assessment.gapSummary,
    poorlyUnderstood: assessment.requirementConfidenceScore < 75 || assessment.criticalGapCount > 0,
    canProceedToPlanning: assessment.canProceedToPlanning,
  };
}

export function collectFounderLaunchEvidence(input: {
  projectRootDir?: string | null;
  workspaceDir?: string | null;
  buildReality?: FounderEvidenceSource | null;
  blueprintStructure?: FounderEvidenceSource | null;
  synthesizeLaunchReadiness?: boolean;
  productPrompt?: string | null;
}): FounderEvidenceSnapshot {
  const buildReality = buildBuildRealityEvidence({
    projectRootDir: input.projectRootDir ?? null,
    override: input.buildReality,
  });
  const blueprintStructure = buildBlueprintStructureEvidence({
    workspaceDir: input.workspaceDir ?? null,
    override: input.blueprintStructure,
  });
  const blueprintVisual = fromBlueprintVisual();
  const featureReality = fromFeatureReality();
  const universalFeatureContract = fromUniversalFeatureContract();
  const engineeringReality = fromEngineeringReality();

  const partial: Omit<
    FounderEvidenceSnapshot,
    'launchReadiness' | 'allPrerequisitesPassed' | 'missingPrerequisites'
  > = {
    readOnly: true,
    buildReality,
    blueprintStructure,
    blueprintVisual,
    featureReality,
    universalFeatureContract,
    engineeringReality,
    requirementDiscovery: buildRequirementDiscoveryEvidence(input.productPrompt ?? null),
  };

  const launchReadiness = input.synthesizeLaunchReadiness
    ? synthesizeLaunchReadinessEvidenceFromPipeline(partial)
    : fromLaunchReadiness();

  const prerequisites = [
    buildReality,
    blueprintStructure,
    blueprintVisual,
    featureReality,
    universalFeatureContract,
    engineeringReality,
  ];
  const missingPrerequisites = prerequisites
    .filter((source) => !source.available || !source.passed)
    .map((source) => source.sourceName);

  const requirementDiscovery = partial.requirementDiscovery;
  const extendedMissing = requirementDiscovery?.poorlyUnderstood
    ? [...missingPrerequisites, 'Requirement Discovery incomplete']
    : missingPrerequisites;

  return {
    ...partial,
    launchReadiness,
    allPrerequisitesPassed: extendedMissing.length === 0,
    missingPrerequisites: extendedMissing,
  };
}

export function buildBuildRealityEvidenceFromWorkspace(input: {
  npmInstallOk: boolean;
  npmBuildOk: boolean;
  devServerOk: boolean;
  workspacePresent: boolean;
}): FounderEvidenceSource {
  const passed =
    input.npmInstallOk && input.npmBuildOk && input.devServerOk && input.workspacePresent;
  const score = clamp(
    (input.workspacePresent ? 25 : 0) +
      (input.npmInstallOk ? 25 : 0) +
      (input.npmBuildOk ? 25 : 0) +
      (input.devServerOk ? 25 : 0),
  );

  const blockers: string[] = [];
  if (!input.workspacePresent) blockers.push('Workspace not materialized');
  if (!input.npmInstallOk) blockers.push('npm install failed');
  if (!input.npmBuildOk) blockers.push('npm run build failed');
  if (!input.devServerOk) blockers.push('Dev server not reachable');

  return {
    readOnly: true,
    sourceId: 'build-reality',
    sourceName: 'Build Reality',
    available: true,
    passed,
    score,
    blockers,
    warnings: [],
    findings: [
      `Workspace present: ${input.workspacePresent ? 'yes' : 'no'}`,
      `npm install: ${input.npmInstallOk ? 'pass' : 'fail'}`,
      `npm build: ${input.npmBuildOk ? 'pass' : 'fail'}`,
      `Dev server: ${input.devServerOk ? 'pass' : 'fail'}`,
    ],
  };
}
