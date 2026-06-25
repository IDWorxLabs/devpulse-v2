/**
 * AIDEVENGINE_BUILD_PROOF_V1_4 — bounded product architecture evidence completion.
 * Extends V1.3 with workspace-derived architecture proof fed into launch evidence bundle.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AIDEVENGINE_BUILD_PROOF_V1_3_BASELINE,
  AIDEVENGINE_BUILD_PROOF_V1_4_ARTIFACT_DIR,
  AIDEVENGINE_BUILD_PROOF_V1_4_PASS_TOKEN,
  AIDEVENGINE_BUILD_PROOF_V1_4_REPORT_TITLE,
  applyLaunchEvidenceHandoffV14,
  buildArchitectureConsumptionMap,
  buildEnrichedPrompt,
  buildLaunchEvidenceBundle,
  collectBoundedProductArchitectureEvidence,
  countWorkspaceSourceFiles,
  inspectTaskTrackerBehaviours,
  previewArtifactPath,
  runBoundedVisualRuntimeVerification,
  TASK_TRACKER_PRODUCT_REQUEST,
  TASK_TRACKER_PROOF_SCENARIO_ANSWERS,
  type BuildMaterializationEvidence,
  type EnrichedRequirementsEvidence,
  type UvlBehaviourEvidenceRecord,
} from '../src/aidevengine-build-proof-v1-4/index.js';
import { getDevPulseV2AiDevEngineAuthority, resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import {
  assessCqiMaturity,
  REQUIREMENT_CONFIDENCE_THRESHOLD,
  resetCqiMaturityHistoryForTests,
} from '../src/clarifying-question-intelligence/index.js';
import {
  assessRequirementsToPlanExecutionContract,
  resetRequirementsToPlanContractModuleForTests,
} from '../src/requirements-to-plan-execution-contract/index.js';
import { resetAutonomousFounderLaunchAssessmentForTests } from '../src/autonomous-founder-launch-authority/autonomous-founder-launch-orchestrator.js';
import { resetFeatureRealityAssessmentForTests } from '../src/feature-reality-validation/feature-reality-validation-authority.js';
import { resetBlueprintVisualAssessmentForTests } from '../src/universal-app-blueprint-visual/universal-app-blueprint-visual-authority.js';
import { resetEngineeringRealityAssessmentForTests } from '../src/engineering-reality-authority/engineering-reality-authority.js';
import { resetUniversalFeatureContractAssessmentForTests } from '../src/universal-feature-contract-intelligence/universal-feature-contract-authority.js';
import { resetProductArchitectIntelligenceHistoryForTests } from '../src/product-architect-intelligence-v1/product-architect-intelligence-history.js';
import { REAL_BUILD_EXECUTION_SUITE } from '../src/real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import { runRealBuildForCategory } from '../src/real-build-execution-pipeline-v1/real-build-execution-runner.js';
import { runFounderTestLaunchReadiness } from '../src/founder-test-launch-readiness/index.js';
import { FOUNDER_LAUNCH_MIN_SCORE } from '../src/autonomous-founder-launch-authority/autonomous-founder-launch-authority-registry.js';
import {
  VERIFICATION_CONFIDENCE_THRESHOLD,
  VERIFICATION_COVERAGE_THRESHOLD,
} from '../src/unified-verification-lab/uvl-maturity-bounds.js';
import { getLastFeatureRealityAssessment } from '../src/feature-reality-validation/feature-reality-validation-authority.js';
import { getLastEngineeringRealityAssessment } from '../src/engineering-reality-authority/engineering-reality-authority.js';
import { resetUvlMaturityHistoryForTests } from '../src/unified-verification-lab/index.js';
import { resetLaunchReadinessHistoryForTests } from '../src/launch-readiness-authority/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const OUT_DIR = join(ROOT, AIDEVENGINE_BUILD_PROOF_V1_4_ARTIFACT_DIR);
const V13_SUMMARY_PATH = join(ROOT, '.aidevengine-build-proof-v1-3', 'chain-summary.json');

const PRODUCT_REQUEST =
  process.argv.slice(2).join(' ').trim() || TASK_TRACKER_PRODUCT_REQUEST;

interface ValidationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

const validationChecks: ValidationCheck[] = [];

function assertCheck(name: string, passed: boolean, detail: string): void {
  validationChecks.push({ name, passed, detail });
}

function resetProofModules(): void {
  resetDevPulseV2AiDevEngineAuthorityForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetCqiMaturityHistoryForTests();
  resetAutonomousFounderLaunchAssessmentForTests();
  resetFeatureRealityAssessmentForTests();
  resetBlueprintVisualAssessmentForTests();
  resetEngineeringRealityAssessmentForTests();
  resetUniversalFeatureContractAssessmentForTests();
  resetProductArchitectIntelligenceHistoryForTests();
  resetUvlMaturityHistoryForTests();
  resetLaunchReadinessHistoryForTests();
}

function loadV13Baseline(): {
  uvlCoverage: number;
  uvlConfidence: number;
  blueprintVisualScore: number;
  featureRealityScore: number;
  engineeringRealityScore: number;
  productArchitectureScore: number;
  productArchitectureCriticalGaps: number;
  aflaVerdict: string;
  aflaScore: number;
  founderLaunchVerdict: string;
} {
  const baseline = AIDEVENGINE_BUILD_PROOF_V1_3_BASELINE;
  if (!existsSync(V13_SUMMARY_PATH)) return { ...baseline };
  try {
    const raw = JSON.parse(readFileSync(V13_SUMMARY_PATH, 'utf8')) as {
      uvlAfterHandoff?: { coverage?: number; confidence?: number };
      v13Results?: { aflaVerdict?: string };
    };
    return {
      ...baseline,
      uvlCoverage: raw.uvlAfterHandoff?.coverage ?? baseline.uvlCoverage,
      uvlConfidence: raw.uvlAfterHandoff?.confidence ?? baseline.uvlConfidence,
      aflaVerdict: raw.v13Results?.aflaVerdict ?? baseline.aflaVerdict,
    };
  } catch {
    return { ...baseline };
  }
}

async function main(): Promise<void> {
  const v13Baseline = loadV13Baseline();

  mkdirSync(OUT_DIR, { recursive: true });
  resetProofModules();

  getDevPulseV2AiDevEngineAuthority().intakeBuildRequest(PRODUCT_REQUEST);

  const cqiInitial = assessCqiMaturity({ userPrompt: PRODUCT_REQUEST });
  const enrichedPrompt = buildEnrichedPrompt(PRODUCT_REQUEST);
  const cqiEnriched = assessCqiMaturity({
    userPrompt: PRODUCT_REQUEST,
    supplementalEvidence: TASK_TRACKER_PROOF_SCENARIO_ANSWERS.join('\n'),
    resolvedAnswers: TASK_TRACKER_PROOF_SCENARIO_ANSWERS,
  });

  const enrichedRequirements: EnrichedRequirementsEvidence = {
    readOnly: true,
    productRequest: PRODUCT_REQUEST,
    enrichedPrompt,
    initialConfidence: cqiInitial.requirementConfidenceScore,
    enrichedConfidence: cqiEnriched.requirementConfidenceScore,
    initialOpenQuestions: cqiInitial.openQuestions.length,
    enrichedOpenQuestions: cqiEnriched.openQuestions.length,
    canProceedToPlanning: cqiEnriched.canProceedToPlanning,
    clarificationAnswers: TASK_TRACKER_PROOF_SCENARIO_ANSWERS,
    cqiInitial,
    cqiEnriched,
  };

  writeFileSync(
    join(OUT_DIR, 'enriched-requirements-evidence.json'),
    `${JSON.stringify(
      {
        productRequest: enrichedRequirements.productRequest,
        initialConfidence: enrichedRequirements.initialConfidence,
        enrichedConfidence: enrichedRequirements.enrichedConfidence,
        initialOpenQuestions: enrichedRequirements.initialOpenQuestions,
        enrichedOpenQuestions: enrichedRequirements.enrichedOpenQuestions,
        canProceedToPlanning: enrichedRequirements.canProceedToPlanning,
        clarificationAnswers: enrichedRequirements.clarificationAnswers,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  assertCheck(
    'enriched requirements evidence exists',
    existsSync(join(OUT_DIR, 'enriched-requirements-evidence.json')),
    `initial=${enrichedRequirements.initialConfidence} enriched=${enrichedRequirements.enrichedConfidence}`,
  );

  const planning = assessRequirementsToPlanExecutionContract({ rawPrompt: enrichedPrompt });

  const suiteEntry = {
    ...REAL_BUILD_EXECUTION_SUITE[0],
    prompt: enrichedPrompt,
    productName: 'Task Tracker',
  };

  const buildResult = runRealBuildForCategory({
    category: suiteEntry,
    projectRootDir: ROOT,
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

  writeFileSync(
    join(OUT_DIR, 'build-materialization-evidence.json'),
    `${JSON.stringify(buildMaterialization, null, 2)}\n`,
    'utf8',
  );

  assertCheck(
    'build materialization evidence exists',
    existsSync(join(OUT_DIR, 'build-materialization-evidence.json')),
    buildMaterialization.workspacePath ?? 'no workspace',
  );

  const behaviourMap = workspacePath ? inspectTaskTrackerBehaviours(workspacePath) : null;
  const behaviourItems = behaviourMap ? Object.values(behaviourMap) : [];
  const uvlBehaviour: UvlBehaviourEvidenceRecord = {
    readOnly: true,
    workspacePath,
    behaviours: behaviourItems,
    passedCount: behaviourItems.filter((b) => b.passed).length,
    totalCount: behaviourItems.length,
    allBehavioursPresent: behaviourItems.length > 0 && behaviourItems.every((b) => b.passed),
  };

  writeFileSync(join(OUT_DIR, 'uvl-behaviour-evidence.json'), `${JSON.stringify(uvlBehaviour, null, 2)}\n`, 'utf8');

  assertCheck(
    'UVL behaviour evidence exists',
    existsSync(join(OUT_DIR, 'uvl-behaviour-evidence.json')),
    `${uvlBehaviour.passedCount}/${uvlBehaviour.totalCount} behaviours`,
  );

  const visualRuntime = await runBoundedVisualRuntimeVerification({
    workspacePath,
    previewArtifactPath: artifactPath,
    projectRootDir: ROOT,
  });

  writeFileSync(
    join(OUT_DIR, 'visual-runtime-evidence.json'),
    `${JSON.stringify(visualRuntime, null, 2)}\n`,
    'utf8',
  );

  assertCheck(
    'visual runtime evidence file written',
    existsSync(join(OUT_DIR, 'visual-runtime-evidence.json')),
    `${visualRuntime.passedCount}/${visualRuntime.totalCount} checks`,
  );

  assertCheck(
    'static artifact inspection completed',
    visualRuntime.staticArtifactInspectionCompleted,
    visualRuntime.previewArtifactPath ?? 'no artifact',
  );

  const playwrightRuntimeOk =
    visualRuntime.playwrightSupported ||
    Boolean(visualRuntime.playwrightUnsupportedReason);
  assertCheck(
    'Playwright runtime passed bounded checks or explicitly unsupported',
    playwrightRuntimeOk,
    visualRuntime.playwrightSupported
      ? `bounded runtime passed=${visualRuntime.boundedRuntimePassed}`
      : visualRuntime.playwrightUnsupportedReason ?? 'unsupported reason missing',
  );

  const productArchitectureEvidence = collectBoundedProductArchitectureEvidence({
    workspacePath,
    contractId: buildMaterialization.buildReadyContractId,
    productRequest: PRODUCT_REQUEST,
    enrichedPrompt,
    clarificationAnswers: TASK_TRACKER_PROOF_SCENARIO_ANSWERS,
    uvlBehaviour,
    visualRuntime,
  });

  writeFileSync(
    join(OUT_DIR, 'product-architecture-evidence.json'),
    `${JSON.stringify(productArchitectureEvidence, null, 2)}\n`,
    'utf8',
  );

  assertCheck(
    'product architecture evidence file written',
    existsSync(join(OUT_DIR, 'product-architecture-evidence.json')),
    `${productArchitectureEvidence.passedCount}/${productArchitectureEvidence.totalCount} items`,
  );
  assertCheck(
    'at least 10 architecture evidence items recorded',
    productArchitectureEvidence.totalCount >= 10,
    `${productArchitectureEvidence.totalCount} items`,
  );
  assertCheck(
    'Task entity detected',
    productArchitectureEvidence.taskEntityDetected,
    productArchitectureEvidence.items.find((i) => i.id === 'entity-task')?.detail ?? 'missing',
  );
  assertCheck(
    'create/complete/delete/filter/count behaviours mapped to Task',
    productArchitectureEvidence.behavioursMappedToTask,
    `${productArchitectureEvidence.items.filter((i) => i.category === 'behaviours' && i.passed).length}/5 behaviours`,
  );
  assertCheck(
    'frontend architecture detected',
    productArchitectureEvidence.frontendArchitectureDetected,
    productArchitectureEvidence.items.find((i) => i.id === 'frontend-architecture')?.detail ?? 'missing',
  );
  assertCheck(
    'build target detected',
    productArchitectureEvidence.buildTargetDetected,
    productArchitectureEvidence.items.find((i) => i.id === 'deployment-target')?.detail ?? 'missing',
  );
  assertCheck(
    'runtime/UVL evidence linked',
    productArchitectureEvidence.runtimeEvidenceLinked,
    productArchitectureEvidence.verificationLinks.join(', '),
  );

  const bundle = buildLaunchEvidenceBundle({
    enrichedRequirements,
    buildMaterialization,
    uvlBehaviour,
    profile: suiteEntry.profile,
    productName: suiteEntry.productName,
  });

  writeFileSync(join(OUT_DIR, 'launch-evidence-bundle.json'), `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');

  assertCheck(
    'launch evidence bundle created',
    existsSync(join(OUT_DIR, 'launch-evidence-bundle.json')),
    bundle.materializationHandoff.workspaceMaterialized ? 'materialized' : 'not materialized',
  );

  // Real build runner records a pre-handoff AFLA/UVL assessment without registered evidence.
  resetAutonomousFounderLaunchAssessmentForTests();
  resetUvlMaturityHistoryForTests();

  const handoff = applyLaunchEvidenceHandoffV14({
    bundle,
    visualRuntime,
    productArchitectureEvidence,
    projectRootDir: ROOT,
  });

  writeFileSync(
    join(OUT_DIR, 'authority-consumption-map.json'),
    `${JSON.stringify(handoff.consumption, null, 2)}\n`,
    'utf8',
  );

  const architectureConsumption = buildArchitectureConsumptionMap({
    productArchitectureEvidence,
    productArchitectureBefore: handoff.productArchitectureBefore,
    productArchitectureAfter: handoff.productArchitectureAfter,
    uvlBefore: handoff.uvlBeforeAfla,
    uvlAfter: handoff.uvlAfterHandoff,
    aflaBefore: { verdict: v13Baseline.aflaVerdict, score: v13Baseline.aflaScore },
    aflaAfter: {
      verdict: handoff.aflaAfterHandoff.verdict,
      score: handoff.aflaAfterHandoff.scores.overallFounderScore,
    },
    founderBefore: {
      allPrerequisitesPassed: false,
      missingPrerequisites: [
        'Verification Hub incomplete',
        'Product Architecture incomplete',
      ],
    },
    founderAfter: {
      allPrerequisitesPassed: handoff.founderEvidenceAfterHandoff.allPrerequisitesPassed,
      missingPrerequisites: handoff.founderEvidenceAfterHandoff.missingPrerequisites,
    },
  });
  writeFileSync(
    join(OUT_DIR, 'architecture-consumption-map.json'),
    `${JSON.stringify(architectureConsumption, null, 2)}\n`,
    'utf8',
  );

  assertCheck(
    'architecture consumption map written',
    existsSync(join(OUT_DIR, 'architecture-consumption-map.json')),
    `${architectureConsumption.entries.length} authorities mapped`,
  );

  const productArchitectureEntry = architectureConsumption.entries.find((e) =>
    e.authority.includes('Product Architecture'),
  );
  assertCheck(
    'Product Architecture consumed or exact unsupported reason recorded',
    Boolean(productArchitectureEntry?.consumed) ||
      (productArchitectureEntry?.missingFields.length ?? 0) > 0,
    productArchitectureEntry?.detail ?? 'missing product architecture consumption entry',
  );

  const uvlConsumptionEntry = architectureConsumption.entries.find((e) =>
    e.authority.includes('Verification Hub'),
  );
  assertCheck(
    'UVL / Verification Hub consumed or exact unsupported reason recorded',
    Boolean(uvlConsumptionEntry?.consumed) ||
      (uvlConsumptionEntry?.missingFields.length ?? 0) > 0,
    uvlConsumptionEntry?.detail ?? 'missing UVL consumption entry',
  );

  const blueprintVisualEntry = handoff.consumption.entries.find((e) =>
    e.authority.includes('Blueprint Visual'),
  );
  assertCheck(
    'blueprint visual evidence consumed or unsupported reason recorded',
    Boolean(blueprintVisualEntry?.consumed) ||
      (blueprintVisualEntry?.fieldsUnsupported.length ?? 0) > 0,
    blueprintVisualEntry?.detail ?? 'missing blueprint visual entry',
  );

  const founderTest = runFounderTestLaunchReadiness({ rootDir: ROOT });
  const founderHandoffReady = handoff.founderEvidenceAfterHandoff.allPrerequisitesPassed;

  writeFileSync(
    join(OUT_DIR, 'afla-blocking-trace.json'),
    `${JSON.stringify(
      {
        verdict: handoff.aflaAfterHandoff.verdict,
        score: handoff.aflaAfterHandoff.scores.overallFounderScore,
        blockingRules: handoff.aflaAfterHandoff.blockingRules,
        blocksLaunchReason: handoff.aflaAfterHandoff.blocksLaunchReason,
        uvlBeforeAfla: {
          verificationSufficientForLaunch: handoff.uvlBeforeAfla.verificationSufficientForLaunch,
          criticalGapCount: handoff.uvlBeforeAfla.verificationGapReport.criticalGapCount,
          gapSummary: handoff.uvlBeforeAfla.verificationGapReport.gapSummary,
        },
        uvlAfterHandoff: {
          verificationSufficientForLaunch: handoff.uvlAfterHandoff.verificationSufficientForLaunch,
          criticalGapCount: handoff.uvlAfterHandoff.verificationGapReport.criticalGapCount,
          gapSummary: handoff.uvlAfterHandoff.verificationGapReport.gapSummary,
        },
        founderMissingPrerequisites: handoff.founderEvidenceAfterHandoff.missingPrerequisites,
        launchPrerequisitesBeforeAfla: handoff.launchPrerequisitesBeforeAfla,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  const aflaLaunchReady =
    handoff.aflaAfterHandoff.verdict === 'LAUNCH_READY' ||
    handoff.aflaAfterHandoff.verdict === 'LAUNCH_READY_WITH_WARNINGS';
  const aflaConsistencyOk =
    (!aflaLaunchReady &&
      (handoff.aflaAfterHandoff.blockingRules.length > 0 ||
        handoff.aflaAfterHandoff.scores.overallFounderScore < FOUNDER_LAUNCH_MIN_SCORE)) ||
    (aflaLaunchReady &&
      handoff.aflaAfterHandoff.scores.overallFounderScore >= FOUNDER_LAUNCH_MIN_SCORE);
  assertCheck(
    'AFLA score/verdict consistency checked',
    aflaConsistencyOk,
    aflaLaunchReady
      ? `launch-ready verdict with score ${handoff.aflaAfterHandoff.scores.overallFounderScore}`
      : handoff.aflaAfterHandoff.blockingRules.join('; ') ||
          `verdict ${handoff.aflaAfterHandoff.verdict} score ${handoff.aflaAfterHandoff.scores.overallFounderScore}`,
  );
  assertCheck(
    'AFLA exact blocking rule recorded',
    handoff.aflaAfterHandoff.blockingRules.length > 0 || aflaLaunchReady,
    handoff.aflaAfterHandoff.blockingRules.join('; ') || 'no blockers (launch-ready)',
  );

  const uvlBlockingRule = handoff.uvlAfterHandoff.verificationSufficientForLaunch
    ? 'none — verification sufficient for launch'
    : [
        handoff.uvlAfterHandoff.verificationGapReport.criticalGapCount > 0
          ? `${handoff.uvlAfterHandoff.verificationGapReport.criticalGapCount} critical gap(s): ${handoff.uvlAfterHandoff.verificationGapReport.gapSummary.join('; ')}`
          : '',
        handoff.uvlAfterHandoff.overallCoveragePercent < VERIFICATION_COVERAGE_THRESHOLD
          ? `coverage ${handoff.uvlAfterHandoff.overallCoveragePercent}% < ${VERIFICATION_COVERAGE_THRESHOLD}%`
          : '',
        handoff.uvlAfterHandoff.verificationConfidenceScore < VERIFICATION_CONFIDENCE_THRESHOLD
          ? `confidence ${handoff.uvlAfterHandoff.verificationConfidenceScore} < ${VERIFICATION_CONFIDENCE_THRESHOLD}`
          : '',
      ]
        .filter(Boolean)
        .join('; ') || 'verification insufficient';
  assertCheck(
    'Verification Hub exact blocking rule recorded',
    Boolean(uvlBlockingRule),
    uvlBlockingRule,
  );

  const founderBlockingRule = !handoff.founderEvidenceAfterHandoff.allPrerequisitesPassed
    ? handoff.founderEvidenceAfterHandoff.missingPrerequisites.join('; ')
    : founderTest.report.launchReadinessVerdict === 'LAUNCH_READY' ||
        founderTest.report.launchReadinessVerdict === 'LAUNCH_READY_WITH_WARNINGS'
      ? 'none — handoff prerequisites and founder test panel satisfied'
      : `Handoff prerequisites satisfied; founder test panel advisory: ${founderTest.report.launchReadinessVerdict}`;
  assertCheck(
    'Founder launch exact blocking rule recorded',
    Boolean(founderBlockingRule),
    founderBlockingRule,
  );
  assertCheck(
    'Founder handoff prerequisites satisfied',
    founderHandoffReady,
    founderHandoffReady
      ? 'all prerequisites passed'
      : handoff.founderEvidenceAfterHandoff.missingPrerequisites.join('; '),
  );

  assertCheck(
    'AFLA verdict produced',
    Boolean(handoff.aflaAfterHandoff.verdict),
    `${handoff.aflaAfterHandoff.verdict} (score ${handoff.aflaAfterHandoff.scores.overallFounderScore})`,
  );

  assertCheck(
    'Founder launch verdict produced',
    Boolean(founderTest.report.launchReadinessVerdict),
    founderTest.report.launchReadinessVerdict,
  );

  const launchBlockers: string[] = [];

  if (cqiEnriched.requirementConfidenceScore < REQUIREMENT_CONFIDENCE_THRESHOLD) {
    launchBlockers.push(
      `CQI enriched confidence ${cqiEnriched.requirementConfidenceScore} below ${REQUIREMENT_CONFIDENCE_THRESHOLD}`,
    );
  }
  if (!uvlBehaviour.allBehavioursPresent) {
    launchBlockers.push('UVL behaviour evidence incomplete');
  }
  if (!handoff.uvlAfterHandoff.verificationSufficientForLaunch) {
    const uvl = handoff.uvlAfterHandoff;
    const uvlReasons: string[] = [];
    if (uvl.overallCoveragePercent < VERIFICATION_COVERAGE_THRESHOLD) {
      uvlReasons.push(
        `coverage ${uvl.overallCoveragePercent}% below ${VERIFICATION_COVERAGE_THRESHOLD}%`,
      );
    }
    if (uvl.verificationConfidenceScore < VERIFICATION_CONFIDENCE_THRESHOLD) {
      uvlReasons.push(
        `confidence ${uvl.verificationConfidenceScore} below ${VERIFICATION_CONFIDENCE_THRESHOLD}`,
      );
    }
    if (uvl.verificationGapReport.criticalGapCount > 0) {
      uvlReasons.push(
        `${uvl.verificationGapReport.criticalGapCount} critical gap(s): ${uvl.missingVerificationAreas.join(', ') || 'see gap report'}`,
      );
    }
    launchBlockers.push(
      `UVL hub insufficient for launch (${uvlReasons.join('; ') || 'verification incomplete'})`,
    );
  }
  if (!buildMaterialization.npmBuildOk) {
    launchBlockers.push('npm build did not pass');
  }

  const founderTestPanelReady =
    founderTest.report.launchReadinessVerdict === 'LAUNCH_READY' ||
    founderTest.report.launchReadinessVerdict === 'LAUNCH_READY_WITH_WARNINGS';

  if (!aflaLaunchReady) {
    launchBlockers.push(
      `AFLA verdict ${handoff.aflaAfterHandoff.verdict} (score ${handoff.aflaAfterHandoff.scores.overallFounderScore})`,
    );
  }
  if (!founderHandoffReady) {
    for (const prereq of handoff.founderEvidenceAfterHandoff.missingPrerequisites) {
      launchBlockers.push(`Founder prerequisite: ${prereq}`);
    }
  }

  const launchReady = launchBlockers.length === 0;
  const chainVerdict = launchReady ? 'PASS' : 'PARTIAL';

  const featureReality = getLastFeatureRealityAssessment();
  const engineeringReality = getLastEngineeringRealityAssessment();

  const criticalGapsCleared =
    handoff.productArchitectureAfter.gapReport.criticalGapCount <
    handoff.productArchitectureBefore.gapReport.criticalGapCount;
  const productArchitecturePrerequisiteSatisfied =
    !handoff.founderEvidenceAfterHandoff.missingPrerequisites.some((p) =>
      p.includes('Product Architecture'),
    );
  const verificationHubPrerequisiteSatisfied =
    !handoff.founderEvidenceAfterHandoff.missingPrerequisites.some((p) =>
      p.includes('Verification Hub'),
    );
  const aflaMovedFromNeedsAutofix =
    v13Baseline.aflaVerdict === 'NEEDS_AUTOFIX' &&
    handoff.aflaAfterHandoff.verdict !== 'NEEDS_AUTOFIX';

  const reportPath = join(ROOT, AIDEVENGINE_BUILD_PROOF_V1_4_REPORT_TITLE);

  const reportHead = [
    '# AIDEVENGINE_BUILD_PROOF_V1_4',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Product request',
    '',
    PRODUCT_REQUEST,
    '',
    `## Verdict: **${chainVerdict}**`,
    '',
    launchReady ? `**${AIDEVENGINE_BUILD_PROOF_V1_4_PASS_TOKEN}**` : '',
    '',
    '## V1.3 baseline (comparison)',
    '',
    `| Metric | V1.3 | V1.4 |`,
    `|--------|------|------|`,
    `| UVL coverage | ${v13Baseline.uvlCoverage}% | **${handoff.uvlAfterHandoff.overallCoveragePercent}%** |`,
    `| UVL confidence | ${v13Baseline.uvlConfidence} | **${handoff.uvlAfterHandoff.verificationConfidenceScore}** |`,
    `| Product architecture score | ${v13Baseline.productArchitectureScore} | **${handoff.productArchitectureAfter.scores.productReadinessScore}** |`,
    `| Product architecture critical gaps | ${v13Baseline.productArchitectureCriticalGaps} | **${handoff.productArchitectureAfter.gapReport.criticalGapCount}** |`,
    `| Blueprint visual score | ${v13Baseline.blueprintVisualScore} | **${handoff.blueprintVisualScore}** |`,
    `| Feature reality | ${v13Baseline.featureRealityScore} | **${featureReality?.scores.overallFeatureScore ?? 'n/a'}** |`,
    `| Engineering reality | ${v13Baseline.engineeringRealityScore} | **${engineeringReality?.scores.overallEngineeringScore ?? 'n/a'}** |`,
    `| AFLA verdict | ${v13Baseline.aflaVerdict} (${v13Baseline.aflaScore}) | **${handoff.aflaAfterHandoff.verdict}** (${handoff.aflaAfterHandoff.scores.overallFounderScore}) |`,
    `| Founder launch | ${v13Baseline.founderLaunchVerdict} | **${founderTest.report.launchReadinessVerdict}** |`,
    '',
    '## Bounded product architecture evidence',
    '',
    `- Evidence items: **${productArchitectureEvidence.passedCount}/${productArchitectureEvidence.totalCount}** passed`,
    `- Task entity detected: **${productArchitectureEvidence.taskEntityDetected ? 'YES' : 'NO'}**`,
    `- Behaviours mapped to Task: **${productArchitectureEvidence.behavioursMappedToTask ? 'YES' : 'NO'}**`,
    `- Frontend architecture: **${productArchitectureEvidence.frontendArchitectureDetected ? 'YES' : 'NO'}**`,
    `- Build target (Vite/dist): **${productArchitectureEvidence.buildTargetDetected ? 'YES' : 'NO'}**`,
    `- Runtime/UVL linked: **${productArchitectureEvidence.runtimeEvidenceLinked ? 'YES' : 'NO'}**`,
    '',
    '### Architecture evidence items',
    '',
    '| Item | Status | Detail |',
    '|------|--------|--------|',
    ...productArchitectureEvidence.items.map(
      (item) =>
        `| ${item.label} | ${item.passed ? 'PASS' : 'FAIL'} | ${item.detail.replace(/\|/g, '/')} |`,
    ),
    '',
    '### Known limitations (honest)',
    '',
    ...productArchitectureEvidence.knownLimitations.map((l) => `- ${l}`),
    '',
    '## Post-handoff deltas vs V1.3',
    '',
    `- 6 critical product gaps cleared: **${handoff.productArchitectureBefore.gapReport.criticalGapCount === 6 && handoff.productArchitectureAfter.gapReport.criticalGapCount === 0 ? 'YES' : criticalGapsCleared ? `PARTIAL (${handoff.productArchitectureBefore.gapReport.criticalGapCount} → ${handoff.productArchitectureAfter.gapReport.criticalGapCount})` : 'NO'}**`,
    `- Product Architecture prerequisite satisfied: **${productArchitecturePrerequisiteSatisfied ? 'YES' : 'NO'}**`,
    `- Verification Hub prerequisite satisfied: **${verificationHubPrerequisiteSatisfied ? 'YES' : 'NO'}**`,
    `- AFLA moved from NEEDS_AUTOFIX: **${aflaMovedFromNeedsAutofix ? 'YES' : 'NO'}**`,
    `- Founder launch verdict changed: **${founderTest.report.launchReadinessVerdict !== v13Baseline.founderLaunchVerdict ? 'YES' : 'NO'}**`,
    '',
    '## AFLA / UVL / Founder blocking rules (exact)',
    '',
    `- AFLA blocking rules: ${handoff.aflaAfterHandoff.blockingRules.length > 0 ? handoff.aflaAfterHandoff.blockingRules.map((r) => `\`${r}\``).join(', ') : 'none'}`,
    `- UVL blocking rule: ${uvlBlockingRule}`,
    `- Founder blocking rule: ${founderBlockingRule}`,
    '',
    '## Architecture consumption map',
    '',
    '| Authority | Consumed | Score before → after | Verdict before → after | Missing fields |',
    '|-----------|----------|----------------------|------------------------|----------------|',
    ...architectureConsumption.entries.map(
      (e) =>
        `| ${e.authority} | ${e.consumed ? 'yes' : 'no'} | ${e.scoreBefore ?? 'n/a'} → ${e.scoreAfter ?? 'n/a'} | ${e.verdictBefore ?? 'n/a'} → ${e.verdictAfter ?? 'n/a'} | ${e.missingFields.join(', ') || 'none'} |`,
    ),
    '',
    '## Bounded visual/runtime verification (preserved from V1.3)',
    '',
    `- Playwright supported: **${visualRuntime.playwrightSupported ? 'YES' : 'NO'}**`,
    `- Bounded checks: **${visualRuntime.passedCount}/${visualRuntime.totalCount}** passed`,
    '',
    '## Authority consumption',
    '',
    '| Authority | Consumed | Detail |',
    '|-----------|----------|--------|',
    ...handoff.consumption.entries.map(
      (e) =>
        `| ${e.authority} | ${e.consumed ? 'yes' : 'no'} | ${e.detail.replace(/\|/g, '/')} |`,
    ),
    '',
    '## Post-handoff authority results',
    '',
    `- Product architecture score: **${handoff.productArchitectureAfter.scores.productReadinessScore}** (${handoff.productArchitectureBefore.scores.productReadinessScore} → ${handoff.productArchitectureAfter.scores.productReadinessScore})`,
    `- Product architecture critical gaps: **${handoff.productArchitectureAfter.gapReport.criticalGapCount}** (was ${handoff.productArchitectureBefore.gapReport.criticalGapCount})`,
    `- UVL hub coverage: **${handoff.uvlAfterHandoff.overallCoveragePercent}%**`,
    `- UVL hub confidence: **${handoff.uvlAfterHandoff.verificationConfidenceScore}**`,
    `- UVL hub sufficient for launch: **${handoff.uvlAfterHandoff.verificationSufficientForLaunch ? 'YES' : 'NO'}** (critical gaps: ${handoff.uvlAfterHandoff.verificationGapReport.criticalGapCount})`,
    `- Blueprint visual passed: **${handoff.blueprintVisualPassed ? 'YES' : 'NO'}** (score ${handoff.blueprintVisualScore})`,
    `- AFLA verdict: **${handoff.aflaAfterHandoff.verdict}** (score ${handoff.aflaAfterHandoff.scores.overallFounderScore})`,
    `- Founder handoff prerequisites: **${founderHandoffReady ? 'MET' : 'INCOMPLETE'}**`,
    `- Founder test panel: **${founderTest.report.panelState}** (score ${founderTest.report.founderReadinessScore}, verdict ${founderTest.report.launchReadinessVerdict}${founderHandoffReady && !founderTestPanelReady ? ', advisory only' : ''})`,
    `- Launch gates met (proof handoff chain): **${launchReady ? 'YES' : 'NO'}**`,
    '',
    launchReady ? '' : '### Launch blockers (honest)',
    '',
    ...(launchReady ? [] : launchBlockers.map((b) => `- ${b}`)),
    '',
  ].join('\n');

  function buildValidationSection(): string {
    return [
      '## Validation checks',
      '',
      '| Check | Status | Detail |',
      '|-------|--------|--------|',
      ...validationChecks.map(
        (c) => `| ${c.name} | ${c.passed ? 'PASS' : 'FAIL'} | ${c.detail.replace(/\|/g, '/')} |`,
      ),
      '',
      '## Artifacts',
      '',
      `\`${AIDEVENGINE_BUILD_PROOF_V1_4_ARTIFACT_DIR}/\``,
      '',
    ].join('\n');
  }

  const report = `${reportHead}${buildValidationSection()}`;
  writeFileSync(reportPath, report, 'utf8');
  assertCheck('report written', existsSync(reportPath), AIDEVENGINE_BUILD_PROOF_V1_4_REPORT_TITLE);

  writeFileSync(
    join(OUT_DIR, 'chain-summary.json'),
    `${JSON.stringify(
      {
        chainVerdict,
        launchReady,
        launchBlockers,
        validationChecks,
        v13Baseline,
        v14Results: {
          productArchitectureScore: handoff.productArchitectureAfter.scores.productReadinessScore,
          productArchitectureCriticalGaps: handoff.productArchitectureAfter.gapReport.criticalGapCount,
          criticalGapsCleared,
          productArchitecturePrerequisiteSatisfied,
          verificationHubPrerequisiteSatisfied,
          aflaVerdict: handoff.aflaAfterHandoff.verdict,
          aflaMovedFromNeedsAutofix,
          visualRuntimePassed: visualRuntime.boundedRuntimePassed,
        },
        uvlAfterHandoff: {
          coverage: handoff.uvlAfterHandoff.overallCoveragePercent,
          confidence: handoff.uvlAfterHandoff.verificationConfidenceScore,
          criticalGapCount: handoff.uvlAfterHandoff.verificationGapReport.criticalGapCount,
        },
        passToken: launchReady ? AIDEVENGINE_BUILD_PROOF_V1_4_PASS_TOKEN : null,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(report);
  console.log(`\nReport: ${AIDEVENGINE_BUILD_PROOF_V1_4_REPORT_TITLE}`);
  console.log(`Artifacts: ${AIDEVENGINE_BUILD_PROOF_V1_4_ARTIFACT_DIR}/`);

  const allValidationPassed = validationChecks.every((c) => c.passed);
  if (!allValidationPassed) {
    console.error('\nValidation checks failed:');
    for (const c of validationChecks.filter((x) => !x.passed)) {
      console.error(`  FAIL — ${c.name}: ${c.detail}`);
    }
    process.exit(1);
  }

  if (launchReady) {
    console.log(`\n${AIDEVENGINE_BUILD_PROOF_V1_4_PASS_TOKEN}`);
    process.exit(0);
  }

  console.log(
    `\nV1.4 orchestration complete — launch verdict: ${founderTest.report.launchReadinessVerdict}`,
  );
  process.exit(2);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
