/**
 * AIDEVENGINE_BUILD_PROOF_V1_2 — launch evidence handoff repair.
 * Extends V1.1 with authority consumption of real build-proof evidence.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AIDEVENGINE_BUILD_PROOF_V1_2_ARTIFACT_DIR,
  AIDEVENGINE_BUILD_PROOF_V1_2_PASS_TOKEN,
  AIDEVENGINE_BUILD_PROOF_V1_2_REPORT_TITLE,
  applyLaunchEvidenceHandoff,
  buildEnrichedPrompt,
  buildLaunchEvidenceBundle,
  countWorkspaceSourceFiles,
  inspectTaskTrackerBehaviours,
  previewArtifactPath,
  TASK_TRACKER_PRODUCT_REQUEST,
  TASK_TRACKER_PROOF_SCENARIO_ANSWERS,
  type BuildMaterializationEvidence,
  type EnrichedRequirementsEvidence,
  type UvlBehaviourEvidenceRecord,
} from '../src/aidevengine-build-proof-v1-2/index.js';
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
import { REAL_BUILD_EXECUTION_SUITE } from '../src/real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import { runRealBuildForCategory } from '../src/real-build-execution-pipeline-v1/real-build-execution-runner.js';
import { runFounderTestLaunchReadiness } from '../src/founder-test-launch-readiness/index.js';
import {
  VERIFICATION_CONFIDENCE_THRESHOLD,
  VERIFICATION_COVERAGE_THRESHOLD,
} from '../src/unified-verification-lab/uvl-maturity-bounds.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const OUT_DIR = join(ROOT, AIDEVENGINE_BUILD_PROOF_V1_2_ARTIFACT_DIR);

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
}

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

const handoff = applyLaunchEvidenceHandoff({ bundle, projectRootDir: ROOT });

writeFileSync(
  join(OUT_DIR, 'authority-consumption-map.json'),
  `${JSON.stringify(handoff.consumption, null, 2)}\n`,
  'utf8',
);

const uvlEntry = handoff.consumption.entries.find((e) => e.authority.includes('UVL'));
assertCheck(
  'UVL hub consumes behaviour evidence or explicit unsupported mapping',
  Boolean(uvlEntry?.consumed),
  uvlEntry?.detail ?? 'missing UVL consumption entry',
);

const aflaEntry = handoff.consumption.entries.find((e) => e.authority.includes('AFLA'));
assertCheck(
  'AFLA consumes build/UVL evidence or explicit unsupported mapping',
  Boolean(aflaEntry?.consumed),
  aflaEntry?.detail ?? 'missing AFLA consumption entry',
);

const founderEntry = handoff.consumption.entries.find((e) =>
  e.authority.includes('Founder Launch Readiness'),
);
assertCheck(
  'Founder launch consumes evidence or explicit unsupported mapping',
  Boolean(founderEntry?.consumed),
  founderEntry?.detail ?? 'missing Founder consumption entry',
);

const founderTest = runFounderTestLaunchReadiness({ rootDir: ROOT });

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

assertCheck(
  'verdict produced',
  Boolean(founderTest.report.launchReadinessVerdict),
  `${founderTest.report.launchReadinessVerdict} (${launchBlockers.length} blocker(s))`,
);

const reportPath = join(ROOT, AIDEVENGINE_BUILD_PROOF_V1_2_REPORT_TITLE);

const reportHead = [
  '# AIDEVENGINE_BUILD_PROOF_V1_2',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Product request',
  '',
  PRODUCT_REQUEST,
  '',
  `## Verdict: **${chainVerdict}**`,
  '',
  launchReady ? `**${AIDEVENGINE_BUILD_PROOF_V1_2_PASS_TOKEN}**` : '',
  '',
  '## Requirement confidence (two-stage)',
  '',
  `| Stage | Confidence | Can proceed | Open questions |`,
  `|-------|------------|-------------|----------------|`,
  `| Initial | **${enrichedRequirements.initialConfidence}** | ${cqiInitial.canProceedToPlanning ? 'yes' : 'no'} | ${enrichedRequirements.initialOpenQuestions} |`,
  `| Enriched (handoff) | **${enrichedRequirements.enrichedConfidence}** | ${enrichedRequirements.canProceedToPlanning ? 'yes' : 'no'} | ${enrichedRequirements.enrichedOpenQuestions} |`,
  '',
  '## Evidence produced',
  '',
  `- Workspace: \`${workspacePath?.replace(/\\/g, '/') ?? 'none'}\``,
  `- Generated source files: ${generatedFileCount}`,
  `- npm build: ${buildMaterialization.npmBuildOk ? 'PASS' : 'FAIL'}`,
  `- Preview artifact: \`${artifactPath ?? 'none'}\``,
  `- UVL behaviours: **${uvlBehaviour.passedCount}/${uvlBehaviour.totalCount}**`,
  '',
  '## UVL behaviour evidence',
  '',
  '| Behaviour | Status | Detail |',
  '|-----------|--------|--------|',
  ...uvlBehaviour.behaviours.map(
    (b) => `| ${b.behaviour} | ${b.passed ? 'PASS' : 'FAIL'} | ${b.detail.replace(/\|/g, '/')} |`,
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
  '### Fields used / unsupported',
  '',
  ...handoff.consumption.entries.flatMap((e) => [
    `**${e.authority}**`,
    `- Used: ${e.fieldsUsed.join(', ') || 'none'}`,
    `- Ignored: ${e.fieldsIgnored.join(', ') || 'none'}`,
    `- Unsupported: ${e.fieldsUnsupported.join(', ') || 'none'}`,
    '',
  ]),
  '',
  '## Post-handoff authority results',
  '',
  `- UVL hub coverage: **${handoff.uvlAfterHandoff.overallCoveragePercent}%** (was 35% pre-handoff in V1.1)`,
  `- UVL hub confidence: **${handoff.uvlAfterHandoff.verificationConfidenceScore}**`,
  `- UVL hub sufficient for launch: **${handoff.uvlAfterHandoff.verificationSufficientForLaunch ? 'YES' : 'NO'}** (critical gaps: ${handoff.uvlAfterHandoff.verificationGapReport.criticalGapCount})`,
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
    `\`${AIDEVENGINE_BUILD_PROOF_V1_2_ARTIFACT_DIR}/\``,
    '',
  ].join('\n');
}

writeFileSync(reportPath, `${reportHead}${buildValidationSection()}`, 'utf8');
assertCheck('report written', existsSync(reportPath), AIDEVENGINE_BUILD_PROOF_V1_2_REPORT_TITLE);

const report = `${reportHead}${buildValidationSection()}`;
writeFileSync(reportPath, report, 'utf8');

writeFileSync(
  join(OUT_DIR, 'chain-summary.json'),
  `${JSON.stringify(
    {
      chainVerdict,
      launchReady,
      launchBlockers,
      validationChecks,
      uvlAfterHandoff: {
        coverage: handoff.uvlAfterHandoff.overallCoveragePercent,
        confidence: handoff.uvlAfterHandoff.verificationConfidenceScore,
      },
      passToken: launchReady ? AIDEVENGINE_BUILD_PROOF_V1_2_PASS_TOKEN : null,
    },
    null,
    2,
  )}\n`,
  'utf8',
);

console.log(report);
console.log(`\nReport: ${AIDEVENGINE_BUILD_PROOF_V1_2_REPORT_TITLE}`);
console.log(`Artifacts: ${AIDEVENGINE_BUILD_PROOF_V1_2_ARTIFACT_DIR}/`);

const allValidationPassed = validationChecks.every((c) => c.passed);
if (!allValidationPassed) {
  console.error('\nValidation checks failed:');
  for (const c of validationChecks.filter((x) => !x.passed)) {
    console.error(`  FAIL — ${c.name}: ${c.detail}`);
  }
  process.exit(1);
}

if (launchReady) {
  console.log(`\n${AIDEVENGINE_BUILD_PROOF_V1_2_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\nV1.2 orchestration complete — launch verdict: ${founderTest.report.launchReadinessVerdict}`);
process.exit(2);
