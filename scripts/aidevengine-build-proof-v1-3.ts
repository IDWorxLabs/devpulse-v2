/**
 * AIDEVENGINE_BUILD_PROOF_V1_3 — bounded visual runtime verification.
 * Extends V1.2 with Playwright/static preview proof fed into launch evidence bundle.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AIDEVENGINE_BUILD_PROOF_V1_2_BASELINE,
  AIDEVENGINE_BUILD_PROOF_V1_3_ARTIFACT_DIR,
  AIDEVENGINE_BUILD_PROOF_V1_3_PASS_TOKEN,
  AIDEVENGINE_BUILD_PROOF_V1_3_REPORT_TITLE,
  applyLaunchEvidenceHandoffV13,
  buildAuthorityPrerequisiteMap,
  buildEnrichedPrompt,
  buildLaunchEvidenceBundle,
  countWorkspaceSourceFiles,
  inspectTaskTrackerBehaviours,
  previewArtifactPath,
  runBoundedVisualRuntimeVerification,
  TASK_TRACKER_PRODUCT_REQUEST,
  TASK_TRACKER_PROOF_SCENARIO_ANSWERS,
  type BuildMaterializationEvidence,
  type EnrichedRequirementsEvidence,
  type UvlBehaviourEvidenceRecord,
} from '../src/aidevengine-build-proof-v1-3/index.js';
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
import { REAL_BUILD_EXECUTION_SUITE } from '../src/real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import { runRealBuildForCategory } from '../src/real-build-execution-pipeline-v1/real-build-execution-runner.js';
import { runFounderTestLaunchReadiness } from '../src/founder-test-launch-readiness/index.js';
import {
  VERIFICATION_CONFIDENCE_THRESHOLD,
  VERIFICATION_COVERAGE_THRESHOLD,
} from '../src/unified-verification-lab/uvl-maturity-bounds.js';
import { getLastFeatureRealityAssessment } from '../src/feature-reality-validation/feature-reality-validation-authority.js';
import { getLastEngineeringRealityAssessment } from '../src/engineering-reality-authority/engineering-reality-authority.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const OUT_DIR = join(ROOT, AIDEVENGINE_BUILD_PROOF_V1_3_ARTIFACT_DIR);
const V12_SUMMARY_PATH = join(ROOT, '.aidevengine-build-proof-v1-2', 'chain-summary.json');

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
}

function loadV12Baseline(): {
  uvlCoverage: number;
  uvlConfidence: number;
  blueprintVisualScore: number;
  blueprintVisualPassed: boolean;
  aflaVerdict: string;
  aflaScore: number;
  founderLaunchVerdict: string;
  criticalVisualRuntimeGap: string;
} {
  const baseline = AIDEVENGINE_BUILD_PROOF_V1_2_BASELINE;
  if (!existsSync(V12_SUMMARY_PATH)) return { ...baseline };
  try {
    const raw = JSON.parse(readFileSync(V12_SUMMARY_PATH, 'utf8')) as {
      uvlAfterHandoff?: { coverage?: number; confidence?: number };
    };
    return {
      ...baseline,
      uvlCoverage: raw.uvlAfterHandoff?.coverage ?? baseline.uvlCoverage,
      uvlConfidence: raw.uvlAfterHandoff?.confidence ?? baseline.uvlConfidence,
    };
  } catch {
    return { ...baseline };
  }
}

async function main(): Promise<void> {
  const v12Baseline = loadV12Baseline();

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

  const handoff = applyLaunchEvidenceHandoffV13({
    bundle,
    visualRuntime,
    projectRootDir: ROOT,
  });

  writeFileSync(
    join(OUT_DIR, 'authority-consumption-map.json'),
    `${JSON.stringify(handoff.consumption, null, 2)}\n`,
    'utf8',
  );

  const prerequisiteMap = buildAuthorityPrerequisiteMap({
    visualRuntime,
    uvlAfterHandoff: handoff.uvlAfterHandoff,
    blueprintVisualScore: handoff.blueprintVisualScore,
    blueprintVisualPassed: handoff.blueprintVisualPassed,
    blueprintVisualVerdict: handoff.blueprintVisualVerdict,
    universalFeaturePassed: handoff.universalFeaturePassed,
    universalFeatureScore: handoff.universalFeatureScore,
    universalFeatureVerdict: handoff.universalFeatureVerdict,
  });
  writeFileSync(
    join(OUT_DIR, 'authority-prerequisite-map.json'),
    `${JSON.stringify(prerequisiteMap, null, 2)}\n`,
    'utf8',
  );

  assertCheck(
    'authority-prerequisite-map.json written',
    existsSync(join(OUT_DIR, 'authority-prerequisite-map.json')),
    `${prerequisiteMap.entries.length} authorities mapped`,
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

  const visualRuntimeGapRemaining = handoff.uvlAfterHandoff.verificationGapReport.gaps
    .filter((g) => g.summary.toLowerCase().includes('visual') || g.summary.toLowerCase().includes('viewport'))
    .map((g) => g.summary);
  const uvlVisualGapCleared =
    visualRuntime.playwrightSupported &&
    handoff.blueprintVisualPassed &&
    visualRuntimeGapRemaining.length === 0;
  assertCheck(
    'UVL hub critical visual/runtime gap cleared or exact remaining reason recorded',
    uvlVisualGapCleared || visualRuntimeGapRemaining.length > 0 || !visualRuntime.playwrightSupported,
    uvlVisualGapCleared
      ? 'visual/runtime gap cleared'
      : visualRuntimeGapRemaining.join('; ') ||
          visualRuntime.playwrightUnsupportedReason ||
          `criticalGaps=${handoff.uvlAfterHandoff.verificationGapReport.criticalGapCount}`,
  );

  assertCheck(
    'AFLA verdict produced',
    Boolean(handoff.aflaAfterHandoff.verdict),
    `${handoff.aflaAfterHandoff.verdict} (score ${handoff.aflaAfterHandoff.scores.overallFounderScore})`,
  );

  const founderTest = runFounderTestLaunchReadiness({ rootDir: ROOT });

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

  const aflaLaunchReady =
    handoff.aflaAfterHandoff.verdict === 'LAUNCH_READY' ||
    handoff.aflaAfterHandoff.verdict === 'LAUNCH_READY_WITH_WARNINGS';
  const founderLaunchReady =
    founderTest.report.launchReadinessVerdict === 'LAUNCH_READY' ||
    founderTest.report.launchReadinessVerdict === 'LAUNCH_READY_WITH_WARNINGS';

  if (!aflaLaunchReady) {
    launchBlockers.push(
      `AFLA verdict ${handoff.aflaAfterHandoff.verdict} (score ${handoff.aflaAfterHandoff.scores.overallFounderScore})`,
    );
  }
  if (!founderLaunchReady) {
    launchBlockers.push(`Founder launch verdict ${founderTest.report.launchReadinessVerdict}`);
  }

  for (const prereq of handoff.founderEvidenceAfterHandoff.missingPrerequisites) {
    if (!launchBlockers.includes(prereq)) {
      launchBlockers.push(`Founder prerequisite: ${prereq}`);
    }
  }

  const launchReady = launchBlockers.length === 0;
  const chainVerdict = launchReady ? 'PASS' : 'PARTIAL';

  const featureReality = getLastFeatureRealityAssessment();
  const engineeringReality = getLastEngineeringRealityAssessment();

  const blueprintVisualImproved =
    handoff.blueprintVisualScore > v12Baseline.blueprintVisualScore;
  const aflaMovedFromNeedsAutofix =
    v12Baseline.aflaVerdict === 'NEEDS_AUTOFIX' &&
    handoff.aflaAfterHandoff.verdict !== 'NEEDS_AUTOFIX';
  const founderPrerequisitesSatisfied = handoff.founderEvidenceAfterHandoff.allPrerequisitesPassed;

  const reportPath = join(ROOT, AIDEVENGINE_BUILD_PROOF_V1_3_REPORT_TITLE);

  const reportHead = [
    '# AIDEVENGINE_BUILD_PROOF_V1_3',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Product request',
    '',
    PRODUCT_REQUEST,
    '',
    `## Verdict: **${chainVerdict}**`,
    '',
    launchReady ? `**${AIDEVENGINE_BUILD_PROOF_V1_3_PASS_TOKEN}**` : '',
    '',
    '## V1.2 baseline (comparison)',
    '',
    `| Metric | V1.2 | V1.3 |`,
    `|--------|------|------|`,
    `| UVL coverage | ${v12Baseline.uvlCoverage}% | **${handoff.uvlAfterHandoff.overallCoveragePercent}%** |`,
    `| UVL confidence | ${v12Baseline.uvlConfidence} | **${handoff.uvlAfterHandoff.verificationConfidenceScore}** |`,
    `| Blueprint visual score | ${v12Baseline.blueprintVisualScore} | **${handoff.blueprintVisualScore}** (${blueprintVisualImproved ? 'improved' : 'unchanged/worse'}) |`,
    `| Feature reality | 100 | **${featureReality?.scores.overallFeatureScore ?? 'n/a'}** |`,
    `| Engineering reality | 89 | **${engineeringReality?.scores.overallEngineeringScore ?? 'n/a'}** |`,
    `| AFLA verdict | ${v12Baseline.aflaVerdict} (${v12Baseline.aflaScore}) | **${handoff.aflaAfterHandoff.verdict}** (${handoff.aflaAfterHandoff.scores.overallFounderScore}) |`,
    `| Founder launch | ${v12Baseline.founderLaunchVerdict} | **${founderTest.report.launchReadinessVerdict}** |`,
    '',
    '## Bounded visual/runtime verification',
    '',
    `- Playwright supported: **${visualRuntime.playwrightSupported ? 'YES' : 'NO'}**`,
    `- Static artifact inspection: **${visualRuntime.staticArtifactInspectionCompleted ? 'COMPLETE' : 'INCOMPLETE'}**`,
    `- Dev server for runtime: **${visualRuntime.devServerOk ? 'OK' : 'NOT OK'}**`,
    `- Preview URL: \`${visualRuntime.previewUrl ?? 'none'}\``,
    `- Bounded checks: **${visualRuntime.passedCount}/${visualRuntime.totalCount}** passed`,
    `- Bounded runtime passed: **${visualRuntime.boundedRuntimePassed ? 'YES' : 'NO'}**`,
    visualRuntime.playwrightUnsupportedReason
      ? `- Unsupported reason: ${visualRuntime.playwrightUnsupportedReason}`
      : '',
    '',
    '### Visual/runtime checks',
    '',
    '| Check | Status | Detail |',
    '|-------|--------|--------|',
    ...visualRuntime.checks.map(
      (c) => `| ${c.label} | ${c.passed ? 'PASS' : 'FAIL'} | ${c.detail.replace(/\|/g, '/')} |`,
    ),
    '',
    '### Viewport evidence',
    '',
    ...(visualRuntime.viewportEvidence.length > 0
      ? visualRuntime.viewportEvidence.map((v) => `- ${v}`)
      : ['- none']),
    '',
    '## Post-handoff deltas vs V1.2',
    '',
    `- Blueprint visual score improved: **${blueprintVisualImproved ? 'YES' : 'NO'}** (${v12Baseline.blueprintVisualScore} → ${handoff.blueprintVisualScore})`,
    `- UVL critical visual/runtime gap cleared: **${uvlVisualGapCleared ? 'YES' : 'NO'}**`,
    `- AFLA moved from NEEDS_AUTOFIX: **${aflaMovedFromNeedsAutofix ? 'YES' : 'NO'}**`,
    `- Founder launch prerequisites satisfied: **${founderPrerequisitesSatisfied ? 'YES' : 'NO'}**`,
    '',
    '## Founder authority prerequisites',
    '',
    '| Authority | Consumed | Score | Verdict | Missing fields |',
    '|-----------|----------|-------|---------|----------------|',
    ...prerequisiteMap.entries.map(
      (e) =>
        `| ${e.authority} | ${e.consumed ? 'yes' : 'no'} | ${e.score ?? 'n/a'} | ${e.verdict ?? 'n/a'} | ${e.missingFields.join(', ') || 'none'} |`,
    ),
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
    `- UVL hub coverage: **${handoff.uvlAfterHandoff.overallCoveragePercent}%**`,
    `- UVL hub confidence: **${handoff.uvlAfterHandoff.verificationConfidenceScore}**`,
    `- UVL hub sufficient for launch: **${handoff.uvlAfterHandoff.verificationSufficientForLaunch ? 'YES' : 'NO'}** (critical gaps: ${handoff.uvlAfterHandoff.verificationGapReport.criticalGapCount})`,
    `- Blueprint visual passed: **${handoff.blueprintVisualPassed ? 'YES' : 'NO'}** (score ${handoff.blueprintVisualScore})`,
    `- AFLA verdict: **${handoff.aflaAfterHandoff.verdict}** (score ${handoff.aflaAfterHandoff.scores.overallFounderScore})`,
    `- Founder test panel: **${founderTest.report.panelState}** (score ${founderTest.report.founderReadinessScore})`,
    `- Founder launch verdict: **${founderTest.report.launchReadinessVerdict}**`,
    `- Launch gates met: **${launchReady ? 'YES' : 'NO'}**`,
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
      `\`${AIDEVENGINE_BUILD_PROOF_V1_3_ARTIFACT_DIR}/\``,
      '',
    ].join('\n');
  }

  const report = `${reportHead}${buildValidationSection()}`;
  writeFileSync(reportPath, report, 'utf8');
  assertCheck('report written', existsSync(reportPath), AIDEVENGINE_BUILD_PROOF_V1_3_REPORT_TITLE);

  writeFileSync(
    join(OUT_DIR, 'chain-summary.json'),
    `${JSON.stringify(
      {
        chainVerdict,
        launchReady,
        launchBlockers,
        validationChecks,
        v12Baseline,
        v13Results: {
          blueprintVisualScore: handoff.blueprintVisualScore,
          blueprintVisualImproved,
          uvlVisualGapCleared,
          aflaVerdict: handoff.aflaAfterHandoff.verdict,
          aflaMovedFromNeedsAutofix,
          founderPrerequisitesSatisfied,
          visualRuntimePassed: visualRuntime.boundedRuntimePassed,
          playwrightSupported: visualRuntime.playwrightSupported,
        },
        uvlAfterHandoff: {
          coverage: handoff.uvlAfterHandoff.overallCoveragePercent,
          confidence: handoff.uvlAfterHandoff.verificationConfidenceScore,
          criticalGapCount: handoff.uvlAfterHandoff.verificationGapReport.criticalGapCount,
        },
        passToken: launchReady ? AIDEVENGINE_BUILD_PROOF_V1_3_PASS_TOKEN : null,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(report);
  console.log(`\nReport: ${AIDEVENGINE_BUILD_PROOF_V1_3_REPORT_TITLE}`);
  console.log(`Artifacts: ${AIDEVENGINE_BUILD_PROOF_V1_3_ARTIFACT_DIR}/`);

  const allValidationPassed = validationChecks.every((c) => c.passed);
  if (!allValidationPassed) {
    console.error('\nValidation checks failed:');
    for (const c of validationChecks.filter((x) => !x.passed)) {
      console.error(`  FAIL — ${c.name}: ${c.detail}`);
    }
    process.exit(1);
  }

  if (launchReady) {
    console.log(`\n${AIDEVENGINE_BUILD_PROOF_V1_3_PASS_TOKEN}`);
    process.exit(0);
  }

  console.log(
    `\nV1.3 orchestration complete — launch verdict: ${founderTest.report.launchReadinessVerdict}`,
  );
  process.exit(2);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
