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
import {
  assessUvlMaturity,
  getLastUvlMaturityAssessment,
} from '../unified-verification-lab/index.js';
import {
  assessProductArchitecture,
  computeProductArchitectureAflaPenalty,
  getLastProductArchitectureAssessment,
} from '../product-architect-intelligence-v1/index.js';
import {
  buildLaunchFaithfulnessEvidence,
  getLastPromptFaithfulnessV2Result,
  runPromptFaithfulnessEngineV2,
} from '../prompt-faithfulness-engine-v2/index.js';
import {
  buildLaunchCapabilityEvidence,
  getLastCapabilityPlanningPipelineResult,
  runCapabilityPlanningPipeline,
} from '../capability-planning-engine/index.js';
import {
  buildLaunchIncrementalBuildEvidence,
  getLastIncrementalBuildPipelineResult,
  runIncrementalBuildPipeline,
} from '../incremental-autonomous-builder/index.js';
import {
  buildLaunchBehaviorSimulationEvidence,
  getLastBehaviorSimulationPipelineResult,
  runBehaviorSimulationPipeline,
} from '../behavior-simulation-engine/index.js';
import {
  buildLaunchVirtualUserEvidence,
  getLastVirtualUserPipelineResult,
  runVirtualUserPipeline,
} from '../virtual-user-engine/index.js';
import {
  buildLaunchVirtualDeviceEvidence,
  getLastVirtualDevicePipelineResult,
  runVirtualDevicePipeline,
} from '../virtual-device-laboratory/index.js';
import {
  buildLaunchInteractionProofEvidence,
  getLastInteractionProofPipelineResult,
  runInteractionProofPipeline,
} from '../interaction-proof-engine/index.js';
import {
  buildLaunchAutonomousDebuggingEvidence,
  getLastAutonomousDebuggingPipelineResult,
  runAutonomousDebuggingPipeline,
} from '../autonomous-debugging-engine/index.js';
import {
  buildLaunchContinuousImprovementEvidence,
  getLastContinuousImprovementPipelineResult,
  runContinuousImprovementPipeline,
} from '../continuous-product-improvement-engine/index.js';
import { runIntentUnderstandingEngine } from '../intent-understanding-engine/index.js';
import type {
  FounderEvidenceSnapshot,
  FounderEvidenceSource,
  FounderProductArchitectureEvidence,
  FounderRequirementDiscoveryEvidence,
  FounderVerificationHubEvidence,
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
  useRegistered?: boolean,
): FounderRequirementDiscoveryEvidence | null {
  const registered = getLastCqiMaturityAssessment();
  const assessment =
    useRegistered && registered
      ? registered
      : productPrompt
        ? assessCqiMaturity({ userPrompt: productPrompt })
        : registered;
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

function buildProductArchitectureEvidence(
  productPrompt?: string | null,
  profile?: string | null,
  useRegistered?: boolean,
): FounderProductArchitectureEvidence | null {
  if (useRegistered) {
    const registered = getLastProductArchitectureAssessment();
    if (registered) {
      const penalty = computeProductArchitectureAflaPenalty(registered);
      return {
        readOnly: true,
        productReadinessScore: registered.scores.productReadinessScore,
        architectureScore: registered.scores.architectureScore,
        workflowCompletenessScore: registered.scores.workflowCompletenessScore,
        userJourneyScore: registered.scores.userJourneyScore,
        screenCoverageScore: registered.scores.screenCoverageScore,
        readinessLabel: registered.scores.readinessLabel,
        criticalProductGapCount: registered.gapReport.criticalGapCount,
        gapSummary: registered.gapReport.gapSummary,
        missingScreens: registered.missingScreens.map((screen) => screen.screen),
        missingWorkflows: registered.workflowAnalysis
          .filter((workflow) => !workflow.complete)
          .map((workflow) => workflow.workflow),
        architecturallyIncomplete: penalty.architecturallyIncomplete,
        productArchitecturePenalty: penalty.penalty,
        cqiRootCause: registered.cqiContext?.rootCause ?? null,
      };
    }
  }
  const assessment = productPrompt || profile
    ? assessProductArchitecture({
        productPrompt: productPrompt ?? undefined,
        profile: profile ?? undefined,
      })
    : getLastProductArchitectureAssessment();
  if (!assessment) return null;

  const penalty = computeProductArchitectureAflaPenalty(assessment);

  return {
    readOnly: true,
    productReadinessScore: assessment.scores.productReadinessScore,
    architectureScore: assessment.scores.architectureScore,
    workflowCompletenessScore: assessment.scores.workflowCompletenessScore,
    userJourneyScore: assessment.scores.userJourneyScore,
    screenCoverageScore: assessment.scores.screenCoverageScore,
    readinessLabel: assessment.scores.readinessLabel,
    criticalProductGapCount: assessment.gapReport.criticalGapCount,
    gapSummary: assessment.gapReport.gapSummary,
    missingScreens: assessment.missingScreens.map((screen) => screen.screen),
    missingWorkflows: assessment.workflowAnalysis
      .filter((workflow) => !workflow.complete)
      .map((workflow) => workflow.workflow),
    architecturallyIncomplete: penalty.architecturallyIncomplete,
    productArchitecturePenalty: penalty.penalty,
    cqiRootCause: assessment.cqiContext?.rootCause ?? null,
  };
}

function buildVerificationHubEvidence(
  productPrompt?: string | null,
  profile?: string | null,
  useRegistered?: boolean,
): FounderVerificationHubEvidence | null {
  if (useRegistered) {
    const registered = getLastUvlMaturityAssessment();
    if (registered) {
      return {
        readOnly: true,
        overallCoveragePercent: registered.overallCoveragePercent,
        verificationConfidenceScore: registered.verificationConfidenceScore,
        gapSummary: registered.verificationGapReport.gapSummary,
        missingVerificationAreas: registered.missingVerificationAreas,
        incompleteVerification: registered.incompleteVerification,
        verificationSufficientForLaunch: registered.verificationSufficientForLaunch,
        verificationConfidencePenalty: registered.verificationConfidencePenalty,
      };
    }
  }
  const assessment = productPrompt || profile
    ? assessUvlMaturity({ productPrompt: productPrompt ?? undefined, profile: profile ?? undefined })
    : getLastUvlMaturityAssessment();
  if (!assessment) return null;

  return {
    readOnly: true,
    overallCoveragePercent: assessment.overallCoveragePercent,
    verificationConfidenceScore: assessment.verificationConfidenceScore,
    gapSummary: assessment.verificationGapReport.gapSummary,
    missingVerificationAreas: assessment.missingVerificationAreas,
    incompleteVerification: assessment.incompleteVerification,
    verificationSufficientForLaunch: assessment.verificationSufficientForLaunch,
    verificationConfidencePenalty: assessment.verificationConfidencePenalty,
  };
}

function buildCapabilityPlanningEvidence(productPrompt: string | null): FounderEvidenceSource {
  if (!productPrompt?.trim()) {
    return unavailable('capability-planning', 'Capability Planning');
  }

  const cached = getLastCapabilityPlanningPipelineResult();
  const intent = runIntentUnderstandingEngine({ rawPrompt: productPrompt });
  const faithfulness = getLastPromptFaithfulnessV2Result() ??
    runPromptFaithfulnessEngineV2(productPrompt, { generatedModules: intent.productIntelligenceModel.architecture.moduleIds });
  const pipeline =
    cached?.rawPrompt === productPrompt
      ? cached
      : runCapabilityPlanningPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          promptFaithfulnessBlocked: !faithfulness.readyForGeneration,
        });
  const launchEvidence = buildLaunchCapabilityEvidence(pipeline);
  const score = clamp(
    pipeline.permissionVerdict === 'READY_FOR_GENERATION'
      ? 95
      : pipeline.permissionVerdict === 'NEEDS_CAPABILITY_EVOLUTION'
        ? 75
        : pipeline.permissionVerdict === 'NEEDS_HUMAN_REVIEW'
          ? 40
          : 15,
  );
  const passed =
    pipeline.permissionVerdict === 'READY_FOR_GENERATION' ||
    (pipeline.permissionVerdict === 'NEEDS_CAPABILITY_EVOLUTION' &&
      pipeline.generationPlans.every((p) => p.riskLevel === 'LOW'));

  return {
    readOnly: true,
    sourceId: 'capability-planning',
    sourceName: 'Capability Planning',
    available: true,
    passed,
    score,
    blockers: launchEvidence.blockers,
    warnings:
      pipeline.permissionVerdict === 'NEEDS_CAPABILITY_EVOLUTION'
        ? ['Capability evolution planned before generation']
        : [],
    findings: [
      `Required capabilities: ${launchEvidence.requiredCount}`,
      `Reused: ${launchEvidence.reusedCount}, composed: ${launchEvidence.composedCount}, generated: ${launchEvidence.generatedCount}`,
      `Permission verdict: ${launchEvidence.permissionVerdict}`,
      `Human review count: ${launchEvidence.humanReviewCount}`,
    ],
  };
}

function buildIncrementalBuildEvidence(productPrompt: string | null): FounderEvidenceSource {
  if (!productPrompt?.trim()) {
    return unavailable('incremental-build', 'Incremental Build');
  }

  const intent = runIntentUnderstandingEngine({ rawPrompt: productPrompt });
  const faithfulness = getLastPromptFaithfulnessV2Result() ??
    runPromptFaithfulnessEngineV2(productPrompt, { generatedModules: intent.productIntelligenceModel.architecture.moduleIds });
  const capability =
    getLastCapabilityPlanningPipelineResult()?.rawPrompt === productPrompt
      ? getLastCapabilityPlanningPipelineResult()!
      : runCapabilityPlanningPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          promptFaithfulnessBlocked: !faithfulness.readyForGeneration,
        });
  const cached = getLastIncrementalBuildPipelineResult();
  const pipeline =
    cached?.buildPlan.promptContractId === faithfulness.contract.id
      ? cached
      : runIncrementalBuildPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
        });
  const launchEvidence = buildLaunchIncrementalBuildEvidence(pipeline);
  const score = clamp(
    pipeline.permissionVerdict === 'READY_FOR_ASSEMBLY'
      ? 95
      : pipeline.permissionVerdict === 'RESUMABLE'
        ? 70
        : pipeline.permissionVerdict === 'NEEDS_REPAIR'
          ? 45
          : 20,
  );
  const passed =
    pipeline.permissionVerdict === 'READY_FOR_ASSEMBLY' &&
    launchEvidence.wholeAppAssemblyPassed &&
    launchEvidence.regressionGuardsPassed;

  return {
    readOnly: true,
    sourceId: 'incremental-build',
    sourceName: 'Incremental Build',
    available: true,
    passed,
    score,
    blockers: launchEvidence.blockers,
    warnings: pipeline.repairPlans.length ? [`${pipeline.repairPlans.length} feature repair(s) applied`] : [],
    findings: [
      `Planned features: ${launchEvidence.plannedCount}`,
      `Stabilized: ${launchEvidence.stabilizedCount}, repaired: ${launchEvidence.repairedCount}`,
      `Whole-app assembly: ${launchEvidence.wholeAppAssemblyPassed ? 'pass' : 'fail'}`,
      `Permission verdict: ${launchEvidence.permissionVerdict}`,
    ],
  };
}

function buildBehaviorSimulationEvidence(productPrompt: string | null): FounderEvidenceSource {
  if (!productPrompt?.trim()) {
    return unavailable('behavior-simulation', 'Behavior Simulation');
  }

  const intent = runIntentUnderstandingEngine({ rawPrompt: productPrompt });
  const faithfulness = getLastPromptFaithfulnessV2Result() ??
    runPromptFaithfulnessEngineV2(productPrompt, { generatedModules: intent.productIntelligenceModel.architecture.moduleIds });
  const capability =
    getLastCapabilityPlanningPipelineResult()?.rawPrompt === productPrompt
      ? getLastCapabilityPlanningPipelineResult()!
      : runCapabilityPlanningPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          promptFaithfulnessBlocked: !faithfulness.readyForGeneration,
        });
  const incremental =
    getLastIncrementalBuildPipelineResult()?.buildPlan.promptContractId === faithfulness.contract.id
      ? getLastIncrementalBuildPipelineResult()!
      : runIncrementalBuildPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
        });
  const cached = getLastBehaviorSimulationPipelineResult();
  const pipeline =
    cached?.scenarios.length && incremental.permissionVerdict === 'READY_FOR_ASSEMBLY'
      ? cached
      : runBehaviorSimulationPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
        });
  const launchEvidence = buildLaunchBehaviorSimulationEvidence(pipeline);
  const score = clamp(
    pipeline.permissionVerdict === 'READY_FOR_PREVIEW' ? 95 :
    pipeline.permissionVerdict === 'NEEDS_REPAIR' ? 50 : 20,
  );
  const passed = pipeline.permissionVerdict === 'READY_FOR_PREVIEW' && launchEvidence.wholeAppSweepPassed;

  return {
    readOnly: true,
    sourceId: 'behavior-simulation',
    sourceName: 'Behavior Simulation',
    available: true,
    passed,
    score,
    blockers: launchEvidence.blockers,
    warnings: launchEvidence.failedCount ? [`${launchEvidence.failedCount} behavior scenario(s) failed`] : [],
    findings: [
      `Required scenarios: ${launchEvidence.requiredCount}`,
      `Passed: ${launchEvidence.passedCount}, failed: ${launchEvidence.failedCount}`,
      `Whole-app sweep: ${launchEvidence.wholeAppSweepPassed ? 'pass' : 'fail'}`,
      `Verdict: ${launchEvidence.permissionVerdict}`,
    ],
  };
}

function buildVirtualUserSimulationEvidence(productPrompt: string | null): FounderEvidenceSource {
  if (!productPrompt?.trim()) {
    return unavailable('virtual-user-simulation', 'Virtual User Simulation');
  }

  const intent = runIntentUnderstandingEngine({ rawPrompt: productPrompt });
  const faithfulness = getLastPromptFaithfulnessV2Result() ??
    runPromptFaithfulnessEngineV2(productPrompt, {
      generatedModules: intent.productIntelligenceModel.architecture.moduleIds,
    });
  const capability =
    getLastCapabilityPlanningPipelineResult()?.rawPrompt === productPrompt
      ? getLastCapabilityPlanningPipelineResult()!
      : runCapabilityPlanningPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          promptFaithfulnessBlocked: !faithfulness.readyForGeneration,
        });
  const incremental =
    getLastIncrementalBuildPipelineResult()?.buildPlan.promptContractId === faithfulness.contract.id
      ? getLastIncrementalBuildPipelineResult()!
      : runIncrementalBuildPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
        });
  const behavior =
    getLastBehaviorSimulationPipelineResult()?.scenarios.length &&
    incremental.permissionVerdict === 'READY_FOR_ASSEMBLY'
      ? getLastBehaviorSimulationPipelineResult()!
      : runBehaviorSimulationPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
        });
  const cached = getLastVirtualUserPipelineResult();
  const pipeline =
    cached?.profiles.length && behavior.permissionVerdict === 'READY_FOR_PREVIEW'
      ? cached
      : runVirtualUserPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
          behaviorSimulation: behavior,
        });
  const launchEvidence = buildLaunchVirtualUserEvidence(pipeline);
  const score = clamp(
    pipeline.permissionVerdict === 'READY_FOR_PREVIEW' ? 95 :
    pipeline.permissionVerdict === 'NEEDS_REPAIR' ? 50 : 20,
  );
  const passed = pipeline.permissionVerdict === 'READY_FOR_PREVIEW' && launchEvidence.wholeAppSweepPassed;

  return {
    readOnly: true,
    sourceId: 'virtual-user-simulation',
    sourceName: 'Virtual User Simulation',
    available: true,
    passed,
    score,
    blockers: launchEvidence.blockers,
    warnings: launchEvidence.frictionCount ? [`${launchEvidence.frictionCount} friction event(s) detected`] : [],
    findings: [
      `Virtual users: ${launchEvidence.userCount}`,
      `Goals: ${launchEvidence.goalCount}, journeys: ${launchEvidence.journeyCount}`,
      `Completed: ${launchEvidence.completedCount}, failed: ${launchEvidence.failedCount}`,
      `Whole-app sweep: ${launchEvidence.wholeAppSweepPassed ? 'pass' : 'fail'}`,
      `Verdict: ${launchEvidence.permissionVerdict}`,
    ],
  };
}

function buildVirtualDeviceLaboratoryEvidence(productPrompt: string | null): FounderEvidenceSource {
  if (!productPrompt?.trim()) {
    return unavailable('virtual-device-laboratory', 'Virtual Device Laboratory');
  }

  const intent = runIntentUnderstandingEngine({ rawPrompt: productPrompt });
  const faithfulness = getLastPromptFaithfulnessV2Result() ??
    runPromptFaithfulnessEngineV2(productPrompt, { generatedModules: intent.productIntelligenceModel.architecture.moduleIds });
  const capability =
    getLastCapabilityPlanningPipelineResult()?.rawPrompt === productPrompt
      ? getLastCapabilityPlanningPipelineResult()!
      : runCapabilityPlanningPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          promptFaithfulnessBlocked: !faithfulness.readyForGeneration,
        });
  const incremental =
    getLastIncrementalBuildPipelineResult()?.buildPlan.promptContractId === faithfulness.contract.id
      ? getLastIncrementalBuildPipelineResult()!
      : runIncrementalBuildPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
        });
  const behavior =
    getLastBehaviorSimulationPipelineResult()?.scenarios.length &&
    incremental.permissionVerdict === 'READY_FOR_ASSEMBLY'
      ? getLastBehaviorSimulationPipelineResult()!
      : runBehaviorSimulationPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
        });
  const virtualUser =
    getLastVirtualUserPipelineResult()?.profiles.length
      ? getLastVirtualUserPipelineResult()!
      : runVirtualUserPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
          behaviorSimulation: behavior,
        });
  const cached = getLastVirtualDevicePipelineResult();
  const pipeline =
    cached?.profiles.length && virtualUser.permissionVerdict !== 'BLOCKED'
      ? cached
      : runVirtualDevicePipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
          behaviorSimulation: behavior,
          virtualUserSimulation: virtualUser,
        });
  const launchEvidence = buildLaunchVirtualDeviceEvidence(pipeline);
  const score = clamp(
    pipeline.permissionVerdict === 'READY_FOR_PREVIEW' ? 95 :
    pipeline.permissionVerdict === 'NEEDS_REPAIR' ? 50 : 20,
  );
  const passed = pipeline.permissionVerdict === 'READY_FOR_PREVIEW' && launchEvidence.wholeAppSweepPassed;

  return {
    readOnly: true,
    sourceId: 'virtual-device-laboratory',
    sourceName: 'Virtual Device Laboratory',
    available: true,
    passed,
    score,
    blockers: launchEvidence.blockers,
    warnings: launchEvidence.warnedCount ? [`${launchEvidence.warnedCount} device profile(s) performance warning`] : [],
    findings: [
      `Required profiles: ${launchEvidence.requiredProfileCount}`,
      `Passed: ${launchEvidence.passedCount}, failed: ${launchEvidence.failedCount}`,
      `Whole-app sweep: ${launchEvidence.wholeAppSweepPassed ? 'pass' : 'fail'}`,
      `Verdict: ${launchEvidence.permissionVerdict}`,
    ],
  };
}

function buildInteractionProofEvidence(productPrompt: string | null): FounderEvidenceSource {
  if (!productPrompt?.trim()) {
    return unavailable('interaction-proof', 'Interaction Proof');
  }

  const intent = runIntentUnderstandingEngine({ rawPrompt: productPrompt });
  const faithfulness = getLastPromptFaithfulnessV2Result() ??
    runPromptFaithfulnessEngineV2(productPrompt, { generatedModules: intent.productIntelligenceModel.architecture.moduleIds });
  const capability =
    getLastCapabilityPlanningPipelineResult()?.rawPrompt === productPrompt
      ? getLastCapabilityPlanningPipelineResult()!
      : runCapabilityPlanningPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          promptFaithfulnessBlocked: !faithfulness.readyForGeneration,
        });
  const incremental =
    getLastIncrementalBuildPipelineResult()?.buildPlan.promptContractId === faithfulness.contract.id
      ? getLastIncrementalBuildPipelineResult()!
      : runIncrementalBuildPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
        });
  const behavior =
    getLastBehaviorSimulationPipelineResult()?.scenarios.length &&
    incremental.permissionVerdict === 'READY_FOR_ASSEMBLY'
      ? getLastBehaviorSimulationPipelineResult()!
      : runBehaviorSimulationPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
        });
  const virtualUser =
    getLastVirtualUserPipelineResult()?.profiles.length
      ? getLastVirtualUserPipelineResult()!
      : runVirtualUserPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
          behaviorSimulation: behavior,
        });
  const virtualDevice =
    getLastVirtualDevicePipelineResult()?.profiles.length
      ? getLastVirtualDevicePipelineResult()!
      : runVirtualDevicePipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
          behaviorSimulation: behavior,
          virtualUserSimulation: virtualUser,
        });
  const cached = getLastInteractionProofPipelineResult();
  const pipeline =
    cached?.inventory.length && virtualDevice.profiles.length
      ? cached
      : runInteractionProofPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
          behaviorSimulation: behavior,
          virtualUserSimulation: virtualUser,
          virtualDeviceLaboratory: virtualDevice,
        });
  const launchEvidence = buildLaunchInteractionProofEvidence(pipeline);
  const score = clamp(
    pipeline.permissionVerdict === 'READY_FOR_PREVIEW' ? 95 :
    pipeline.permissionVerdict === 'NEEDS_REPAIR' ? 50 : 20,
  );
  const passed = pipeline.permissionVerdict === 'READY_FOR_PREVIEW' && launchEvidence.wholeAppSweepPassed;

  return {
    readOnly: true,
    sourceId: 'interaction-proof',
    sourceName: 'Interaction Proof',
    available: true,
    passed,
    score,
    blockers: launchEvidence.blockers,
    warnings: launchEvidence.unknownCount ? [`${launchEvidence.unknownCount} unknown interaction(s)`] : [],
    findings: [
      `Total interactions: ${launchEvidence.totalInteractions}`,
      `Required: ${launchEvidence.requiredCount}, passed: ${launchEvidence.passedCount}, failed: ${launchEvidence.failedCount}`,
      `Whole-app sweep: ${launchEvidence.wholeAppSweepPassed ? 'pass' : 'fail'}`,
      `Verdict: ${launchEvidence.permissionVerdict}`,
    ],
  };
}

function buildAutonomousDebuggingEvidence(productPrompt: string | null): FounderEvidenceSource {
  if (!productPrompt?.trim()) {
    return unavailable('autonomous-debugging', 'Autonomous Debugging');
  }

  const intent = runIntentUnderstandingEngine({ rawPrompt: productPrompt });
  const faithfulness = getLastPromptFaithfulnessV2Result() ??
    runPromptFaithfulnessEngineV2(productPrompt, { generatedModules: intent.productIntelligenceModel.architecture.moduleIds });
  const capability =
    getLastCapabilityPlanningPipelineResult()?.rawPrompt === productPrompt
      ? getLastCapabilityPlanningPipelineResult()!
      : runCapabilityPlanningPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          promptFaithfulnessBlocked: !faithfulness.readyForGeneration,
        });
  const incremental =
    getLastIncrementalBuildPipelineResult()?.buildPlan.promptContractId === faithfulness.contract.id
      ? getLastIncrementalBuildPipelineResult()!
      : runIncrementalBuildPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
        });
  const behavior =
    getLastBehaviorSimulationPipelineResult()?.scenarios.length &&
    incremental.permissionVerdict === 'READY_FOR_ASSEMBLY'
      ? getLastBehaviorSimulationPipelineResult()!
      : runBehaviorSimulationPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
        });
  const virtualUser =
    getLastVirtualUserPipelineResult()?.profiles.length
      ? getLastVirtualUserPipelineResult()!
      : runVirtualUserPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
          behaviorSimulation: behavior,
        });
  const virtualDevice =
    getLastVirtualDevicePipelineResult()?.profiles.length
      ? getLastVirtualDevicePipelineResult()!
      : runVirtualDevicePipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
          behaviorSimulation: behavior,
          virtualUserSimulation: virtualUser,
        });
  const interactionProof =
    getLastInteractionProofPipelineResult()?.inventory.length
      ? getLastInteractionProofPipelineResult()!
      : runInteractionProofPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
          behaviorSimulation: behavior,
          virtualUserSimulation: virtualUser,
          virtualDeviceLaboratory: virtualDevice,
        });
  const cached = getLastAutonomousDebuggingPipelineResult();
  const pipeline =
    cached?.pipelineId && interactionProof.permissionVerdict !== 'BLOCKED'
      ? cached
      : runAutonomousDebuggingPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
          behaviorSimulation: behavior,
          virtualUserSimulation: virtualUser,
          virtualDeviceLaboratory: virtualDevice,
          interactionProof,
        });
  const launchEvidence = buildLaunchAutonomousDebuggingEvidence(pipeline);
  const score = clamp(
    pipeline.permissionVerdict === 'READY_FOR_PREVIEW' ? 95 :
    pipeline.permissionVerdict === 'HUMAN_REVIEW' ? 40 : 20,
  );
  const passed = pipeline.permissionVerdict === 'READY_FOR_PREVIEW';

  return {
    readOnly: true,
    sourceId: 'autonomous-debugging',
    sourceName: 'Autonomous Debugging',
    available: true,
    passed,
    score,
    blockers: launchEvidence.blockers,
    warnings: launchEvidence.humanReviewRequired ? ['Human review required after autonomous repair'] : [],
    findings: [
      `Failures: ${launchEvidence.failureCount}, repaired: ${launchEvidence.repairedCount}, unresolved: ${launchEvidence.unresolvedCount}`,
      `Repair attempts: ${launchEvidence.repairAttemptCount}, patches applied: ${launchEvidence.patchesApplied}`,
      `Human review: ${launchEvidence.humanReviewRequired ? 'required' : 'not required'}`,
      `Verdict: ${launchEvidence.permissionVerdict}`,
    ],
  };
}

function buildContinuousProductImprovementEvidence(productPrompt: string | null): FounderEvidenceSource {
  if (!productPrompt?.trim()) {
    return unavailable('continuous-product-improvement', 'Continuous Product Improvement');
  }

  const intent = runIntentUnderstandingEngine({ rawPrompt: productPrompt });
  const faithfulness = getLastPromptFaithfulnessV2Result() ??
    runPromptFaithfulnessEngineV2(productPrompt, { generatedModules: intent.productIntelligenceModel.architecture.moduleIds });
  const capability =
    getLastCapabilityPlanningPipelineResult()?.rawPrompt === productPrompt
      ? getLastCapabilityPlanningPipelineResult()!
      : runCapabilityPlanningPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          promptFaithfulnessBlocked: !faithfulness.readyForGeneration,
        });
  const incremental =
    getLastIncrementalBuildPipelineResult()?.buildPlan.promptContractId === faithfulness.contract.id
      ? getLastIncrementalBuildPipelineResult()!
      : runIncrementalBuildPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
        });
  const behavior =
    getLastBehaviorSimulationPipelineResult()?.scenarios.length &&
    incremental.permissionVerdict === 'READY_FOR_ASSEMBLY'
      ? getLastBehaviorSimulationPipelineResult()!
      : runBehaviorSimulationPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
        });
  const virtualUser =
    getLastVirtualUserPipelineResult()?.profiles.length
      ? getLastVirtualUserPipelineResult()!
      : runVirtualUserPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
          behaviorSimulation: behavior,
        });
  const virtualDevice =
    getLastVirtualDevicePipelineResult()?.profiles.length
      ? getLastVirtualDevicePipelineResult()!
      : runVirtualDevicePipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
          behaviorSimulation: behavior,
          virtualUserSimulation: virtualUser,
        });
  const interactionProof =
    getLastInteractionProofPipelineResult()?.inventory.length
      ? getLastInteractionProofPipelineResult()!
      : runInteractionProofPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
          behaviorSimulation: behavior,
          virtualUserSimulation: virtualUser,
          virtualDeviceLaboratory: virtualDevice,
        });
  const autonomousDebugging =
    getLastAutonomousDebuggingPipelineResult()?.pipelineId
      ? getLastAutonomousDebuggingPipelineResult()!
      : runAutonomousDebuggingPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
          behaviorSimulation: behavior,
          virtualUserSimulation: virtualUser,
          virtualDeviceLaboratory: virtualDevice,
          interactionProof,
        });
  const cached = getLastContinuousImprovementPipelineResult();
  const pipeline =
    cached?.pipelineId
      ? cached
      : runContinuousImprovementPipeline({
          rawPrompt: productPrompt,
          productIntelligenceModel: intent.productIntelligenceModel,
          promptFaithfulness: faithfulness,
          capabilityPlanning: capability,
          incrementalBuild: incremental,
          behaviorSimulation: behavior,
          virtualUserSimulation: virtualUser,
          virtualDeviceLaboratory: virtualDevice,
          interactionProof,
          autonomousDebugging,
        });
  const launchEvidence = buildLaunchContinuousImprovementEvidence(pipeline);
  const score = clamp(launchEvidence.qualityScore);
  const passed =
    pipeline.permissionVerdict === 'READY_FOR_PREVIEW' ||
    pipeline.permissionVerdict === 'DEFERRED_ACCEPTABLE';

  return {
    readOnly: true,
    sourceId: 'continuous-product-improvement',
    sourceName: 'Continuous Product Improvement',
    available: true,
    passed,
    score,
    blockers: launchEvidence.blockers,
    warnings: launchEvidence.deferredCount
      ? [`${launchEvidence.deferredCount} improvement(s) deferred with evidence`]
      : [],
    findings: [
      `Signals: ${launchEvidence.signalCount}, opportunities: ${launchEvidence.opportunityCount}`,
      `Applied: ${launchEvidence.appliedCount}, deferred: ${launchEvidence.deferredCount}, blocked: ${launchEvidence.blockedCount}`,
      `Quality score: ${launchEvidence.qualityScore}/100`,
      `Verdict: ${launchEvidence.permissionVerdict}`,
    ],
  };
}

function buildPromptFaithfulnessEvidence(
  productPrompt: string | null,
  generatedModules: string[] = [],
): FounderEvidenceSource {
  if (!productPrompt?.trim()) {
    return unavailable('prompt-faithfulness', 'Prompt Faithfulness');
  }

  const result = getLastPromptFaithfulnessV2Result() ??
    runPromptFaithfulnessEngineV2(productPrompt, { generatedModules });
  const launchEvidence = buildLaunchFaithfulnessEvidence(result, generatedModules);
  const score = clamp(launchEvidence.overallFaithfulnessScore * 100);
  const passed = !launchEvidence.blocksLaunchApproval && result.faithfulnessScore.meetsThreshold;

  return {
    readOnly: true,
    sourceId: 'prompt-faithfulness',
    sourceName: 'Prompt Faithfulness',
    available: true,
    passed,
    score,
    blockers: launchEvidence.blockers,
    warnings: result.ambiguities.slice(0, 3).map((a) => a.clarificationQuestion),
    findings: [
      `Faithfulness score: ${(result.faithfulnessScore.overallScore * 100).toFixed(1)}%`,
      `Requirements: ${result.requirements.length}`,
      `Traceability links: ${launchEvidence.traceabilityLinkCount}`,
      `Drift detected: ${launchEvidence.driftDetected ? 'yes' : 'no'}`,
      `Contract ID: ${result.contract.id}`,
    ],
  };
}

export function collectFounderLaunchEvidence(input: {
  projectRootDir?: string | null;
  workspaceDir?: string | null;
  buildReality?: FounderEvidenceSource | null;
  blueprintStructure?: FounderEvidenceSource | null;
  synthesizeLaunchReadiness?: boolean;
  productPrompt?: string | null;
  profile?: string | null;
  useRegisteredProductArchitecture?: boolean;
  useRegisteredVerificationHub?: boolean;
  useRegisteredRequirementDiscovery?: boolean;
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
    requirementDiscovery: buildRequirementDiscoveryEvidence(
      input.productPrompt ?? null,
      input.useRegisteredRequirementDiscovery,
    ),
    verificationHub: buildVerificationHubEvidence(
      input.productPrompt ?? null,
      input.profile ?? null,
      input.useRegisteredVerificationHub,
    ),
    productArchitecture: buildProductArchitectureEvidence(
      input.productPrompt ?? null,
      input.profile ?? null,
      input.useRegisteredProductArchitecture,
    ),
    promptFaithfulness: buildPromptFaithfulnessEvidence(input.productPrompt ?? null),
    capabilityPlanning: buildCapabilityPlanningEvidence(input.productPrompt ?? null),
    incrementalBuild: buildIncrementalBuildEvidence(input.productPrompt ?? null),
    behaviorSimulation: buildBehaviorSimulationEvidence(input.productPrompt ?? null),
    virtualUserSimulation: buildVirtualUserSimulationEvidence(input.productPrompt ?? null),
    virtualDeviceLaboratory: buildVirtualDeviceLaboratoryEvidence(input.productPrompt ?? null),
    interactionProof: buildInteractionProofEvidence(input.productPrompt ?? null),
    autonomousDebugging: buildAutonomousDebuggingEvidence(input.productPrompt ?? null),
    continuousProductImprovement: buildContinuousProductImprovementEvidence(input.productPrompt ?? null),
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
  const verificationHub = partial.verificationHub;
  const productArchitecture = partial.productArchitecture;
  const extendedMissing = [
    ...(requirementDiscovery?.poorlyUnderstood ? ['Requirement Discovery incomplete'] : []),
    ...(verificationHub && !verificationHub.verificationSufficientForLaunch
      ? ['Verification Hub incomplete']
      : []),
    ...(productArchitecture?.architecturallyIncomplete ? ['Product Architecture incomplete'] : []),
    ...missingPrerequisites,
  ];

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
