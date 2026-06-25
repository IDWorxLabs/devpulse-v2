/**
 * AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1 — single-scenario V1.4-parity orchestration.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getDevPulseV2AiDevEngineAuthority } from '../aidev-engine/aidev-engine-authority.js';
import { assessCqiMaturity } from '../clarifying-question-intelligence/index.js';
import { REQUIREMENT_CONFIDENCE_THRESHOLD } from '../clarifying-question-intelligence/cqi-maturity-bounds.js';
import { assessRequirementsToPlanExecutionContract } from '../requirements-to-plan-execution-contract/index.js';
import { runRealBuildForCategory } from '../real-build-execution-pipeline-v1/real-build-execution-runner.js';
import { runFounderTestLaunchReadiness } from '../founder-test-launch-readiness/index.js';
import { buildLaunchEvidenceBundle } from '../aidevengine-build-proof-v1-2/launch-evidence-handoff-adapter.js';
import { countWorkspaceSourceFiles } from '../aidevengine-build-proof-v1-2/task-tracker-proof-scenario.js';
import type {
  BuildMaterializationEvidence,
  EnrichedRequirementsEvidence,
  UvlBehaviourEvidenceRecord,
  UvlBehaviourKey,
} from '../aidevengine-build-proof-v1-2/launch-evidence-handoff-types.js';
import { getLastFeatureRealityAssessment } from '../feature-reality-validation/feature-reality-validation-authority.js';
import { getLastEngineeringRealityAssessment } from '../engineering-reality-authority/engineering-reality-authority.js';
import {
  VERIFICATION_CONFIDENCE_THRESHOLD,
  VERIFICATION_COVERAGE_THRESHOLD,
} from '../unified-verification-lab/uvl-maturity-bounds.js';
import { resetAutonomousFounderLaunchAssessmentForTests } from '../autonomous-founder-launch-authority/autonomous-founder-launch-orchestrator.js';
import { resetUvlMaturityHistoryForTests } from '../unified-verification-lab/index.js';
import { inspectDomainBehaviours } from './domain-behaviour-inspector.js';
import { collectDomainProductArchitectureEvidence } from './domain-architecture-collector.js';
import { runDomainBoundedVisualRuntimeVerification } from './domain-visual-runtime-verifier.js';
import {
  applyMultiDomainLaunchEvidenceHandoff,
  previewArtifactPath,
} from './multi-domain-launch-handoff.js';
import { buildScenarioEnrichedPrompt } from './multi-domain-scenario-registry.js';
import { resetMultiDomainProofModules } from './reset-proof-modules.js';
import type { MultiDomainScenarioDefinition, MultiDomainScenarioResult } from './multi-domain-scenario-types.js';

function toBundleBehaviourRecord(
  domainBehaviours: ReturnType<typeof inspectDomainBehaviours>,
): UvlBehaviourEvidenceRecord {
  return {
    readOnly: true,
    workspacePath: domainBehaviours.workspacePath,
    behaviours: domainBehaviours.behaviours.map((item) => ({
      readOnly: true,
      behaviour: item.id as UvlBehaviourKey,
      passed: item.passed,
      detail: item.detail,
      source: item.source,
    })),
    passedCount: domainBehaviours.passedCount,
    totalCount: domainBehaviours.totalCount,
    allBehavioursPresent: domainBehaviours.allBehavioursPresent,
  };
}

function computeLaunchBlockers(input: {
  enrichedRequirements: EnrichedRequirementsEvidence;
  buildMaterialization: BuildMaterializationEvidence;
  visualRuntime: NonNullable<MultiDomainScenarioResult['visualRuntime']>;
  handoff: NonNullable<MultiDomainScenarioResult['handoff']>;
  domainBehaviour: NonNullable<MultiDomainScenarioResult['behaviourEvidence']>;
}): string[] {
  const blockers: string[] = [];
  const { enrichedRequirements, buildMaterialization, visualRuntime, handoff, domainBehaviour } = input;

  if (enrichedRequirements.enrichedConfidence < REQUIREMENT_CONFIDENCE_THRESHOLD) {
    blockers.push(
      `CQI enriched confidence ${enrichedRequirements.enrichedConfidence} below ${REQUIREMENT_CONFIDENCE_THRESHOLD}`,
    );
  }
  if (!domainBehaviour.allBehavioursPresent) {
    blockers.push('Domain UVL behaviour evidence incomplete');
  }
  if (!visualRuntime.playwrightSupported) {
    blockers.push(
      `Runtime verification unsupported: ${visualRuntime.playwrightUnsupportedReason ?? 'Playwright unavailable'}`,
    );
  } else if (!visualRuntime.boundedRuntimePassed) {
    blockers.push(
      `Bounded runtime verification incomplete (${visualRuntime.passedCount}/${visualRuntime.totalCount} checks passed)`,
    );
  }
  if (!handoff.uvlAfterHandoff.verificationSufficientForLaunch) {
    const uvl = handoff.uvlAfterHandoff;
    const reasons: string[] = [];
    if (uvl.overallCoveragePercent < VERIFICATION_COVERAGE_THRESHOLD) {
      reasons.push(`coverage ${uvl.overallCoveragePercent}% below ${VERIFICATION_COVERAGE_THRESHOLD}%`);
    }
    if (uvl.verificationConfidenceScore < VERIFICATION_CONFIDENCE_THRESHOLD) {
      reasons.push(`confidence ${uvl.verificationConfidenceScore} below ${VERIFICATION_CONFIDENCE_THRESHOLD}`);
    }
    if (uvl.verificationGapReport.criticalGapCount > 0) {
      reasons.push(
        `${uvl.verificationGapReport.criticalGapCount} critical gap(s): ${uvl.missingVerificationAreas.join(', ') || uvl.verificationGapReport.gapSummary.join('; ')}`,
      );
    }
    blockers.push(`UVL hub insufficient for launch (${reasons.join('; ') || 'verification incomplete'})`);
  }
  if (!buildMaterialization.npmBuildOk) {
    blockers.push('npm build did not pass');
  }
  const aflaLaunchReady =
    handoff.aflaAfterHandoff.verdict === 'LAUNCH_READY' ||
    handoff.aflaAfterHandoff.verdict === 'LAUNCH_READY_WITH_WARNINGS';
  if (!aflaLaunchReady) {
    blockers.push(
      `AFLA verdict ${handoff.aflaAfterHandoff.verdict} (score ${handoff.aflaAfterHandoff.scores.overallFounderScore})`,
    );
  }
  if (!handoff.founderEvidenceAfterHandoff.allPrerequisitesPassed) {
    for (const prereq of handoff.founderEvidenceAfterHandoff.missingPrerequisites) {
      blockers.push(`Founder prerequisite: ${prereq}`);
    }
  }
  return blockers;
}

export async function runMultiDomainProofScenario(input: {
  scenario: MultiDomainScenarioDefinition;
  projectRootDir: string;
  artifactRootDir: string;
  useRegisteredRequirementDiscovery?: boolean;
}): Promise<MultiDomainScenarioResult> {
  const { scenario, projectRootDir, artifactRootDir, useRegisteredRequirementDiscovery = false } = input;
  const scenarioDir = join(artifactRootDir, scenario.id);
  mkdirSync(scenarioDir, { recursive: true });
  resetMultiDomainProofModules();

  const base: MultiDomainScenarioResult = {
    scenario,
    enrichedRequirements: null,
    buildMaterialization: null,
    behaviourEvidence: null,
    visualRuntime: null,
    productArchitectureEvidence: null,
    launchEvidenceBundle: null,
    handoff: null,
    founderLaunchVerdict: 'NOT_LAUNCH_READY',
    launchBlockers: ['Scenario not completed'],
    scenarioVerdict: 'FAIL',
    launchReady: false,
    failureReason: null,
    requirementCount: 0,
    architectureScore: null,
    featureRealityScore: null,
    engineeringRealityScore: null,
    uvlCoverage: null,
    uvlConfidence: null,
    aflaVerdict: null,
    aflaScore: null,
  };

  try {
    getDevPulseV2AiDevEngineAuthority().intakeBuildRequest(scenario.productRequest);

    const cqiInitial = assessCqiMaturity({ userPrompt: scenario.productRequest });
    const enrichedPrompt = buildScenarioEnrichedPrompt(
      scenario.productRequest,
      scenario.clarificationAnswers,
    );
    const cqiEnriched = assessCqiMaturity({
      userPrompt: scenario.productRequest,
      supplementalEvidence: scenario.clarificationAnswers.join('\n'),
      resolvedAnswers: scenario.clarificationAnswers,
    });

    const enrichedRequirements: EnrichedRequirementsEvidence = {
      readOnly: true,
      productRequest: scenario.productRequest,
      enrichedPrompt,
      initialConfidence: cqiInitial.requirementConfidenceScore,
      enrichedConfidence: cqiEnriched.requirementConfidenceScore,
      initialOpenQuestions: cqiInitial.openQuestions.length,
      enrichedOpenQuestions: cqiEnriched.openQuestions.length,
      canProceedToPlanning: cqiEnriched.canProceedToPlanning,
      clarificationAnswers: scenario.clarificationAnswers,
      cqiInitial,
      cqiEnriched,
    };

    writeFileSync(
      join(scenarioDir, 'requirements-evidence.json'),
      `${JSON.stringify(
        {
          scenarioId: scenario.id,
          productDomain: scenario.productDomain,
          productRequest: scenario.productRequest,
          clarificationAnswers: scenario.clarificationAnswers,
          initialConfidence: enrichedRequirements.initialConfidence,
          enrichedConfidence: enrichedRequirements.enrichedConfidence,
          initialOpenQuestions: enrichedRequirements.initialOpenQuestions,
          enrichedOpenQuestions: enrichedRequirements.enrichedOpenQuestions,
          canProceedToPlanning: enrichedRequirements.canProceedToPlanning,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    const planning = assessRequirementsToPlanExecutionContract({ rawPrompt: enrichedPrompt });
    const requirementCount =
      planning.report.buildReadyContract?.requirementIds?.length ??
      planning.report.requirementContract?.requirements?.length ??
      cqiEnriched.coverageMatrix.length;

    const suiteEntry = {
      profile: scenario.suiteProfile,
      domain: scenario.productDomain,
      productName: scenario.productName,
      prompt: enrichedPrompt,
      codegenProfile: scenario.codegenProfile,
    };

    const buildResult = runRealBuildForCategory({
      category: suiteEntry,
      projectRootDir,
      runNpmBuild: true,
    });

    const workspacePath = buildResult.workspacePath;
    const artifactPath = previewArtifactPath(workspacePath);
    const generatedFileCount = workspacePath ? countWorkspaceSourceFiles(workspacePath) : 0;

    const buildMaterialization: BuildMaterializationEvidence = {
      readOnly: true,
      workspacePath,
      generatedFileCount,
      npmBuildExitCode: buildResult.stageResults?.npmBuildOk ? 0 : 1,
      npmBuildOk: buildResult.metrics.buildSuccess && buildResult.stageResults?.npmBuildOk === true,
      previewArtifactPath: artifactPath,
      previewArtifactExists: Boolean(artifactPath && existsSync(artifactPath)),
      buildReadyContractId: planning.report.buildReadyContract?.contractId ?? null,
    };

    if (!workspacePath) {
      const failureReason = buildResult.failureDetail ?? 'Workspace materialization failed';
      writeFileSync(
        join(scenarioDir, 'chain-summary.json'),
        `${JSON.stringify({ scenarioId: scenario.id, failureReason, scenarioVerdict: 'FAIL' }, null, 2)}\n`,
        'utf8',
      );
      return {
        ...base,
        enrichedRequirements,
        buildMaterialization,
        failureReason,
        requirementCount,
        launchBlockers: [failureReason],
      };
    }

    const domainBehaviour = inspectDomainBehaviours({
      workspaceDir: workspacePath,
      behaviourSpecs: scenario.behaviourSpecs,
    });
    writeFileSync(
      join(scenarioDir, 'behaviour-evidence.json'),
      `${JSON.stringify(domainBehaviour, null, 2)}\n`,
      'utf8',
    );

    const visualRuntime = await runDomainBoundedVisualRuntimeVerification({
      scenario,
      workspacePath,
      previewArtifactPath: artifactPath,
      projectRootDir,
    });
    writeFileSync(
      join(scenarioDir, 'visual-runtime-evidence.json'),
      `${JSON.stringify(visualRuntime, null, 2)}\n`,
      'utf8',
    );

    const productArchitectureEvidence = collectDomainProductArchitectureEvidence({
      scenario,
      workspacePath,
      contractId: buildMaterialization.buildReadyContractId,
      enrichedPrompt,
      uvlBehaviour: domainBehaviour,
      visualRuntime,
    });
    writeFileSync(
      join(scenarioDir, 'product-architecture-evidence.json'),
      `${JSON.stringify(productArchitectureEvidence, null, 2)}\n`,
      'utf8',
    );

    const bundle = buildLaunchEvidenceBundle({
      enrichedRequirements,
      buildMaterialization,
      uvlBehaviour: toBundleBehaviourRecord(domainBehaviour),
      profile: scenario.suiteProfile,
      productName: scenario.productName,
    });
    writeFileSync(
      join(scenarioDir, 'launch-evidence-bundle.json'),
      `${JSON.stringify(bundle, null, 2)}\n`,
      'utf8',
    );

    resetAutonomousFounderLaunchAssessmentForTests();
    resetUvlMaturityHistoryForTests();

    const handoff = applyMultiDomainLaunchEvidenceHandoff({
      bundle,
      domainBehaviour,
      visualRuntime,
      productArchitectureEvidence,
      projectRootDir,
      codegenProfile: scenario.codegenProfile,
      useRegisteredRequirementDiscovery,
    });

    const founderTest = runFounderTestLaunchReadiness({ rootDir: projectRootDir });
    const launchBlockers = computeLaunchBlockers({
      enrichedRequirements,
      buildMaterialization,
      visualRuntime,
      handoff,
      domainBehaviour,
    });
    const launchReady = launchBlockers.length === 0;
    const scenarioVerdict = launchReady ? 'LAUNCH_READY' : launchBlockers.length > 0 ? 'PARTIAL' : 'FAIL';

    const featureReality = getLastFeatureRealityAssessment();
    const engineeringReality = getLastEngineeringRealityAssessment();

    writeFileSync(
      join(scenarioDir, 'blocking-trace.json'),
      `${JSON.stringify(
        {
          scenarioId: scenario.id,
          launchBlockers,
          launchReady,
          aflaVerdict: handoff.aflaAfterHandoff.verdict,
          aflaScore: handoff.aflaAfterHandoff.scores.overallFounderScore,
          aflaBlockingRules: handoff.aflaAfterHandoff.blockingRules,
          uvlCoverage: handoff.uvlAfterHandoff.overallCoveragePercent,
          uvlConfidence: handoff.uvlAfterHandoff.verificationConfidenceScore,
          uvlSufficient: handoff.uvlAfterHandoff.verificationSufficientForLaunch,
          founderMissingPrerequisites: handoff.founderEvidenceAfterHandoff.missingPrerequisites,
          visualRuntimeSupported: visualRuntime.playwrightSupported,
          boundedRuntimePassed: visualRuntime.boundedRuntimePassed,
          founderLaunchVerdict: founderTest.report.launchReadinessVerdict,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    writeFileSync(
      join(scenarioDir, 'chain-summary.json'),
      `${JSON.stringify(
        {
          scenarioId: scenario.id,
          productDomain: scenario.productDomain,
          productRequest: scenario.productRequest,
          initialCqiConfidence: enrichedRequirements.initialConfidence,
          enrichedCqiConfidence: enrichedRequirements.enrichedConfidence,
          requirementCount,
          architectureScore: handoff.productArchitectureAfter.scores.productReadinessScore,
          workspacePath,
          generatedFileCount,
          npmBuildExitCode: buildMaterialization.npmBuildExitCode,
          previewResult: visualRuntime.playwrightSupported
            ? `bounded runtime ${visualRuntime.passedCount}/${visualRuntime.totalCount}`
            : visualRuntime.playwrightUnsupportedReason,
          visualRuntimePassed: visualRuntime.passedCount,
          visualRuntimeTotal: visualRuntime.totalCount,
          featureRealityScore: featureReality?.scores.overallFeatureScore ?? null,
          engineeringRealityScore: engineeringReality?.scores.overallEngineeringScore ?? null,
          productArchitectureScore: handoff.productArchitectureAfter.scores.productReadinessScore,
          uvlCoverage: handoff.uvlAfterHandoff.overallCoveragePercent,
          uvlConfidence: handoff.uvlAfterHandoff.verificationConfidenceScore,
          aflaVerdict: handoff.aflaAfterHandoff.verdict,
          aflaScore: handoff.aflaAfterHandoff.scores.overallFounderScore,
          founderLaunchVerdict: founderTest.report.launchReadinessVerdict,
          launchBlockers,
          scenarioVerdict: launchReady ? 'LAUNCH_READY' : 'PARTIAL',
          launchReady,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    return {
      scenario,
      enrichedRequirements,
      buildMaterialization,
      behaviourEvidence: domainBehaviour,
      visualRuntime,
      productArchitectureEvidence,
      launchEvidenceBundle: bundle,
      handoff,
      founderLaunchVerdict: founderTest.report.launchReadinessVerdict,
      launchBlockers,
      scenarioVerdict: launchReady ? 'LAUNCH_READY' : 'PARTIAL',
      launchReady,
      failureReason: null,
      requirementCount,
      architectureScore: handoff.productArchitectureAfter.scores.productReadinessScore,
      featureRealityScore: featureReality?.scores.overallFeatureScore ?? null,
      engineeringRealityScore: engineeringReality?.scores.overallEngineeringScore ?? null,
      uvlCoverage: handoff.uvlAfterHandoff.overallCoveragePercent,
      uvlConfidence: handoff.uvlAfterHandoff.verificationConfidenceScore,
      aflaVerdict: handoff.aflaAfterHandoff.verdict,
      aflaScore: handoff.aflaAfterHandoff.scores.overallFounderScore,
    };
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : String(error);
    writeFileSync(
      join(scenarioDir, 'chain-summary.json'),
      `${JSON.stringify({ scenarioId: scenario.id, failureReason, scenarioVerdict: 'FAIL' }, null, 2)}\n`,
      'utf8',
    );
    return {
      ...base,
      failureReason,
      launchBlockers: [failureReason],
      scenarioVerdict: 'FAIL',
    };
  }
}
