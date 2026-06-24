/**
 * UVL Maturity V1 — verification coverage assessment per application.
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
import { getLastAutonomousFounderLaunchAssessment } from '../autonomous-founder-launch-authority/autonomous-founder-launch-orchestrator.js';
import type {
  VerificationCoverageCategory,
  VerificationCoverageRow,
  VerificationTimelineEntry,
  VerificationTimelineStatus,
} from './uvl-maturity-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function statusFromScore(score: number, available: boolean): 'Complete' | 'Partial' | 'Missing' {
  if (!available) return 'Missing';
  if (score >= 90) return 'Complete';
  if (score >= 50) return 'Partial';
  return 'Missing';
}

function timelineStatus(available: boolean, passed: boolean): VerificationTimelineStatus {
  if (!available) return 'NOT_RUN';
  if (passed) return 'PASSED';
  return 'FAILED';
}

export interface BuildVerificationCoverageInput {
  productPrompt: string;
  projectRootDir?: string | null;
  workspaceDir?: string | null;
}

export function buildVerificationCoverageAssessment(
  input: BuildVerificationCoverageInput,
): {
  categoryCoverage: VerificationCoverageRow[];
  timeline: VerificationTimelineEntry[];
} {
  const buildAssessment =
    input.projectRootDir
      ? assessConnectedBuildExecution({ rootDir: input.projectRootDir })
      : null;
  const buildPassed =
    buildAssessment?.report.proofLevel === 'PROVEN' ||
    (buildAssessment?.report.workspaceMaterialization.workspaceExists &&
      buildAssessment?.report.buildMaterialization.materializationState === 'MATERIALIZED');
  const buildScore = buildAssessment
    ? clamp(
        buildAssessment.report.generatedFileEvidence.confidence ||
          (buildAssessment.report.workspaceMaterialization.workspaceExists ? 35 : 0) +
            (buildAssessment.report.buildMaterialization.materializationState === 'MATERIALIZED'
              ? 35
              : 0) +
            (buildAssessment.report.artifactEvidence.filesObserved > 0 ? 30 : 0),
      )
    : 0;
  const buildAvailable = Boolean(buildAssessment);

  const blueprintInspection = input.workspaceDir
    ? inspectUniversalAppBlueprint(input.workspaceDir)
    : null;
  const structureScore = blueprintInspection
    ? blueprintInspection.passed
      ? 100
      : clamp(Math.max(0, 100 - (blueprintInspection.missingArtifacts.length + blueprintInspection.missingPatterns.length) * 8))
    : 0;
  const structureAvailable = Boolean(blueprintInspection);
  const structurePassed = blueprintInspection?.passed ?? false;

  const visualAssessment = getLastBlueprintVisualAssessment();
  const visualAvailable = Boolean(visualAssessment);
  const visualScore = visualAssessment?.scores.overallBlueprintScore ?? 0;
  const visualPassed = visualAssessment?.passed ?? false;

  const featureAssessment = getLastFeatureRealityAssessment();
  const contractAssessment = getLastUniversalFeatureContractAssessment();
  const featureAvailable = Boolean(featureAssessment || contractAssessment);
  const featureScore = featureAssessment?.passed
    ? featureAssessment.scores.overallFeatureScore
    : contractAssessment?.passed
      ? contractAssessment.scores.overallFeatureRealityScore
      : Math.max(
          featureAssessment?.scores.overallFeatureScore ?? 0,
          contractAssessment?.scores.overallFeatureRealityScore ?? 0,
        );
  const featurePassed =
    featureAssessment?.passed === true || contractAssessment?.passed === true;

  const engineeringAssessment = getLastEngineeringRealityAssessment();
  const engineeringAvailable = Boolean(engineeringAssessment);
  const engineeringScore = engineeringAssessment?.scores.overallEngineeringScore ?? 0;
  const engineeringPassed = engineeringAssessment?.passed ?? false;

  const cqiAssessment =
    getLastCqiMaturityAssessment() ?? assessCqiMaturity({ userPrompt: input.productPrompt });
  const requirementScore = cqiAssessment.requirementConfidenceScore;
  const requirementAvailable = true;
  const requirementPassed =
    cqiAssessment.canProceedToPlanning && cqiAssessment.criticalGapCount === 0;

  const aflaAssessment = getLastAutonomousFounderLaunchAssessment();
  const launchReadiness = getLatestLaunchReadinessAssessment();
  const launchAvailable = Boolean(aflaAssessment || launchReadiness);
  const launchScore = aflaAssessment
    ? aflaAssessment.scores.overallFounderScore
    : launchReadiness?.launchConfidenceScore ?? 0;
  const launchPassed = aflaAssessment
    ? aflaAssessment.passed && !aflaAssessment.blocksLaunch
    : launchReadiness
      ? launchReadiness.readinessState === 'READY' ||
        launchReadiness.recommendation !== 'NOT_READY_FOR_LAUNCH'
      : false;

  const categoryCoverage: VerificationCoverageRow[] = [
    buildStructureRow('Structure', structureScore, structureAvailable, structurePassed, [
      structureAvailable && !structurePassed ? 'Blueprint structure validation incomplete' : '',
      !structureAvailable ? 'Blueprint structure not evaluated' : '',
    ]),
    buildStructureRow('Visual', visualScore, visualAvailable, visualPassed, [
      visualAvailable && !visualPassed ? 'Blueprint visual proof missing or failing' : '',
      !visualAvailable ? 'Visual verification not run' : '',
    ]),
    buildStructureRow('Feature', featureScore, featureAvailable, featurePassed, [
      featureAvailable && !featurePassed ? 'Feature workflows not validated' : '',
      !featureAvailable ? 'Feature reality not evaluated' : '',
    ]),
    buildStructureRow('Engineering', engineeringScore, engineeringAvailable, engineeringPassed, [
      engineeringAvailable && !engineeringPassed ? 'Engineering assessment incomplete' : '',
      !engineeringAvailable ? 'Engineering reality not evaluated' : '',
    ]),
    buildStructureRow('Requirement', requirementScore, requirementAvailable, requirementPassed, [
      !requirementPassed ? 'Requirement discovery insufficient' : '',
      cqiAssessment.criticalGapCount > 0 ? `${cqiAssessment.criticalGapCount} critical requirement gaps` : '',
    ]),
    buildStructureRow('Launch', launchScore, launchAvailable, launchPassed, [
      launchAvailable && !launchPassed ? 'Founder review or launch readiness incomplete' : '',
      !launchAvailable ? 'Founder review not completed' : '',
    ]),
  ];

  const timeline: VerificationTimelineEntry[] = [
    buildTimelineEntry('build-reality', 'Build Reality', buildAvailable, buildPassed, buildAvailable ? (buildPassed ? 'Build proof satisfied' : 'Build proof incomplete') : 'Build not evaluated'),
    buildTimelineEntry('blueprint-validation', 'Blueprint Validation', structureAvailable, structurePassed, structureAvailable ? (structurePassed ? 'Blueprint structure validated' : 'Blueprint structure gaps remain') : 'Blueprint validation pending'),
    buildTimelineEntry('blueprint-visual', 'Blueprint Visual', visualAvailable, visualPassed, visualAvailable ? (visualPassed ? 'Visual blueprint validated' : 'Visual proof incomplete') : 'Blueprint visual pending'),
    buildTimelineEntry('feature-reality', 'Feature Reality', featureAvailable, featurePassed, featureAvailable ? (featurePassed ? 'Feature workflows validated' : 'Feature validation incomplete') : 'Feature reality pending'),
    buildTimelineEntry('engineering-reality', 'Engineering Reality', engineeringAvailable, engineeringPassed, engineeringAvailable ? (engineeringPassed ? 'Engineering reality validated' : 'Engineering concerns remain') : 'Engineering reality pending'),
    buildTimelineEntry('founder-review', 'Founder Review', launchAvailable, launchPassed, launchAvailable ? (launchPassed ? 'Founder review satisfied' : 'Founder review incomplete or blocked') : 'Founder review pending'),
  ];

  return { categoryCoverage, timeline };
}

function buildStructureRow(
  category: VerificationCoverageCategory,
  score: number,
  available: boolean,
  passed: boolean,
  missingHints: string[],
): VerificationCoverageRow {
  const coveragePercent = available ? clamp(score) : 0;
  const confidencePercent = available ? clamp(passed ? score : score * 0.7) : 0;
  const missingAreas = missingHints.filter(Boolean);

  return {
    readOnly: true,
    category,
    coveragePercent,
    confidencePercent,
    status: statusFromScore(coveragePercent, available),
    missingAreas,
  };
}

function buildTimelineEntry(
  stepId: string,
  label: string,
  available: boolean,
  passed: boolean,
  detail: string,
): VerificationTimelineEntry {
  const status = timelineStatus(available, passed);
  return {
    readOnly: true,
    stepId,
    label,
    status,
    ran: available,
    passed: available && passed,
    pending: !available,
    detail,
  };
}

export function computeOverallCoveragePercent(rows: readonly VerificationCoverageRow[]): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((total, row) => total + row.coveragePercent, 0);
  return clamp(sum / rows.length);
}
