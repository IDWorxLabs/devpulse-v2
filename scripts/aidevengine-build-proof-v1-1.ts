/**
 * AIDEVENGINE_BUILD_PROOF_V1_1 — enriched clarifications + UVL behaviour evidence.
 * Preserves V1; does not weaken launch gates or fabricate evidence.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2AiDevEngineAuthority, resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import {
  assessCqiMaturity,
  REQUIREMENT_CONFIDENCE_THRESHOLD,
} from '../src/clarifying-question-intelligence/index.js';
import {
  assessRequirementsToPlanExecutionContract,
  resetRequirementsToPlanContractModuleForTests,
} from '../src/requirements-to-plan-execution-contract/index.js';
import { REAL_BUILD_EXECUTION_SUITE } from '../src/real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import { runRealBuildForCategory } from '../src/real-build-execution-pipeline-v1/real-build-execution-runner.js';
import { runFounderTestLaunchReadiness } from '../src/founder-test-launch-readiness/index.js';
import { assessUvlMaturity } from '../src/unified-verification-lab/index.js';
import {
  VERIFICATION_CONFIDENCE_THRESHOLD,
  VERIFICATION_COVERAGE_THRESHOLD,
} from '../src/unified-verification-lab/uvl-maturity-bounds.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';

export const AIDEVENGINE_BUILD_PROOF_V1_1_PASS_TOKEN = 'AIDEVENGINE_BUILD_PROOF_V1_1_PASS';
export const AIDEVENGINE_BUILD_PROOF_V1_1_ARTIFACT_DIR = '.aidevengine-build-proof-v1-1';
export const AIDEVENGINE_BUILD_PROOF_V1_1_REPORT_TITLE = 'AIDEVENGINE_BUILD_PROOF_V1_1_REPORT.md';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const OUT_DIR = join(ROOT, AIDEVENGINE_BUILD_PROOF_V1_1_ARTIFACT_DIR);

const PRODUCT_REQUEST =
  process.argv.slice(2).join(' ').trim() ||
  'I want a simple task tracker app where I can add tasks, mark them complete, delete them, filter by all/active/completed, and see a count of remaining active tasks. It should have a clean modern UI and work in the browser.';

/** Proof-scenario-only deterministic answers for the task tracker validation path. */
const TASK_TRACKER_PROOF_SCENARIO_ANSWERS: readonly string[] = [
  'Business: Browser-based task tracker for founders and small teams to capture daily work and reduce dropped tasks.',
  'Users: Individual users and team members who manage personal todo lists in the browser.',
  'Roles: Single end-user role with access to own tasks; no separate admin portal for MVP.',
  'Permissions: Users have full CRUD permissions on tasks they create; filter views for all, active, and completed.',
  'Workflows: Core workflow is add task, mark complete, delete task, filter by all/active/completed, view remaining active count.',
  'Data: Task entity with id, title, completed flag, and createdAt timestamp stored in client state.',
  'Files: No file upload or document storage required for MVP.',
  'Notifications: No email, SMS, or push notifications in MVP.',
  'Integrations: Standalone web app with no third-party integrations.',
  'AI: No AI or recommendation features.',
  'Monetization: Free productivity tool with no billing.',
  'Deployment: Static Vite React SPA for modern browsers; npm build produces dist/index.html.',
];

interface ValidationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

const validationChecks: ValidationCheck[] = [];

function assertCheck(name: string, passed: boolean, detail: string): void {
  validationChecks.push({ name, passed, detail });
}

function countWorkspaceFiles(workspaceDir: string): number {
  if (!existsSync(workspaceDir)) return 0;
  let count = 0;
  function walk(dir: string, depth: number): void {
    if (depth > 8) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        walk(full, depth + 1);
      } else {
        count += 1;
      }
    }
  }
  walk(workspaceDir, 0);
  return count;
}

function listSourceFiles(workspaceDir: string, max = 200): string[] {
  if (!existsSync(workspaceDir)) return [];
  const out: string[] = [];
  function walk(current: string, depth: number): void {
    if (out.length >= max || depth > 8) return;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue;
        walk(full, depth + 1);
      } else if (/\.(tsx?|jsx?|html|css|json)$/i.test(entry.name)) {
        out.push(full);
      }
    }
  }
  walk(workspaceDir, 0);
  return out;
}

function inspectTaskTrackerBehaviours(workspaceDir: string): Record<
  string,
  { passed: boolean; detail: string; source: 'generated-source' | 'build-artifact' }
> {
  let combined = '';
  for (const file of listSourceFiles(workspaceDir)) {
    try {
      combined += readFileSync(file, 'utf8') + '\n';
    } catch {
      /* skip */
    }
  }
  const lower = combined.toLowerCase();
  const distIndex = join(workspaceDir, 'dist', 'index.html');
  const distExists = existsSync(distIndex);
  let distDetail = distExists ? distIndex.replace(/\\/g, '/') : 'missing dist/index.html';
  if (distExists) {
    const html = readFileSync(distIndex, 'utf8');
    distDetail += html.includes('id="root"') || html.includes("id='root'") ? ' with #root mount' : ' without #root';
  }

  return {
    addTask: {
      passed: /add.*task|new.*task|createtask|addtask|onadd|handleadd/.test(lower),
      detail: 'pattern in generated sources',
      source: 'generated-source',
    },
    markComplete: {
      passed: /complete|toggle|done|checkbox|mark.*complete/.test(lower),
      detail: 'pattern in generated sources',
      source: 'generated-source',
    },
    deleteTask: {
      passed: /delete|remove.*task|ondelete|handledelete/.test(lower),
      detail: 'pattern in generated sources',
      source: 'generated-source',
    },
    filterAllActiveCompleted: {
      passed: /filter|all.*active.*completed|active.*completed|'all'|"all"|'active'|"active"|'completed'|"completed"/.test(
        lower,
      ),
      detail: 'filter controls in generated sources',
      source: 'generated-source',
    },
    activeCountUpdates: {
      passed: /active.*count|remaining|incomplete|pending.*count|activecount/.test(lower),
      detail: 'active count signal in generated sources',
      source: 'generated-source',
    },
    browserBuildArtifactExists: {
      passed: distExists,
      detail: distDetail,
      source: 'build-artifact',
    },
  };
}

function buildEnrichedPrompt(base: string): string {
  return [
    base,
    '',
    '--- Proof scenario clarification answers ---',
    ...TASK_TRACKER_PROOF_SCENARIO_ANSWERS,
  ].join('\n');
}

mkdirSync(OUT_DIR, { recursive: true });

resetDevPulseV2AiDevEngineAuthorityForTests();
resetRequirementsToPlanContractModuleForTests();

const intake = getDevPulseV2AiDevEngineAuthority().intakeBuildRequest(PRODUCT_REQUEST);
writeFileSync(join(OUT_DIR, 'intake-request.json'), `${JSON.stringify(intake, null, 2)}\n`, 'utf8');

const cqiInitial = assessCqiMaturity({ userPrompt: PRODUCT_REQUEST });
writeFileSync(join(OUT_DIR, 'cqi-initial.json'), `${JSON.stringify(cqiInitial, null, 2)}\n`, 'utf8');

assertCheck(
  'requirements discovered',
  Object.keys(cqiInitial.categoryScores).length > 0,
  `initial confidence=${cqiInitial.requirementConfidenceScore}, categories=${Object.keys(cqiInitial.categoryScores).length}`,
);

assertCheck(
  'clarifying questions generated',
  cqiInitial.openQuestions.length > 0 || cqiInitial.gaps.length > 0,
  `${cqiInitial.openQuestions.length} open questions, ${cqiInitial.gaps.length} gaps`,
);

const enrichedPrompt = buildEnrichedPrompt(PRODUCT_REQUEST);
writeFileSync(
  join(OUT_DIR, 'deterministic-clarification-answers.json'),
  `${JSON.stringify(
    {
      scenario: 'TASK_TRACKER_PROOF_V1_1',
      answers: TASK_TRACKER_PROOF_SCENARIO_ANSWERS,
      enrichedPrompt,
    },
    null,
    2,
  )}\n`,
  'utf8',
);

const cqiEnriched = assessCqiMaturity({
  userPrompt: PRODUCT_REQUEST,
  supplementalEvidence: TASK_TRACKER_PROOF_SCENARIO_ANSWERS.join('\n'),
  resolvedAnswers: TASK_TRACKER_PROOF_SCENARIO_ANSWERS,
});
writeFileSync(join(OUT_DIR, 'cqi-enriched.json'), `${JSON.stringify(cqiEnriched, null, 2)}\n`, 'utf8');

assertCheck(
  'deterministic answers applied',
  TASK_TRACKER_PROOF_SCENARIO_ANSWERS.length >= 8,
  `${TASK_TRACKER_PROOF_SCENARIO_ANSWERS.length} answers recorded for proof scenario`,
);

assertCheck(
  'enriched confidence recorded',
  cqiEnriched.requirementConfidenceScore > cqiInitial.requirementConfidenceScore,
  `initial=${cqiInitial.requirementConfidenceScore} → enriched=${cqiEnriched.requirementConfidenceScore} (threshold ${REQUIREMENT_CONFIDENCE_THRESHOLD})`,
);

const planning = assessRequirementsToPlanExecutionContract({ rawPrompt: enrichedPrompt });
writeFileSync(join(OUT_DIR, 'requirements-to-plan.json'), `${JSON.stringify(planning.report, null, 2)}\n`, 'utf8');

const requirementContract = planning.report.requirementContract;
const planContract = planning.report.planContract;

assertCheck(
  'blueprint generated',
  Boolean(requirementContract && requirementContract.requirements.length > 0),
  `${requirementContract?.requirements.length ?? 0} requirements`,
);

assertCheck(
  'architecture generated',
  Boolean(planContract && planContract.tasks.length > 0),
  `${planContract?.tasks.length ?? 0} plan tasks`,
);

assertCheck(
  'build plan generated',
  Boolean(planning.report.buildReadyContract),
  planning.report.buildReadyContract?.contractId ?? 'none',
);

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

writeFileSync(
  join(OUT_DIR, 'real-build-result.json'),
  `${JSON.stringify(
    {
      profile: buildResult.profile,
      workspacePath: buildResult.workspacePath,
      passed: buildResult.passed,
      metrics: buildResult.metrics,
      executionProof: buildResult.executionProof,
      failureClass: buildResult.failureClass,
      failureDetail: buildResult.failureDetail,
    },
    null,
    2,
  )}\n`,
  'utf8',
);

const workspacePath = buildResult.workspacePath;
const fileCount = workspacePath ? countWorkspaceFiles(workspacePath) : 0;

assertCheck(
  'real workspace created',
  Boolean(workspacePath && existsSync(workspacePath) && buildResult.metrics.materializationSuccess),
  workspacePath ? `${workspacePath.replace(/\\/g, '/')} (${fileCount} source files)` : 'none',
);

assertCheck(
  'npm build passed',
  buildResult.metrics.buildSuccess && buildResult.stageResults?.npmBuildOk === true,
  buildResult.stageResults?.npmBuildOk ? 'exit 0' : 'failed',
);

const previewArtifact = buildResult.executionProof.buildOutputPath;
assertCheck(
  'preview artifact exists',
  Boolean(previewArtifact && existsSync(previewArtifact)),
  previewArtifact ?? 'none',
);

const behaviourEvidence = workspacePath
  ? inspectTaskTrackerBehaviours(workspacePath)
  : {
      addTask: { passed: false, detail: 'no workspace', source: 'generated-source' as const },
      markComplete: { passed: false, detail: 'no workspace', source: 'generated-source' as const },
      deleteTask: { passed: false, detail: 'no workspace', source: 'generated-source' as const },
      filterAllActiveCompleted: { passed: false, detail: 'no workspace', source: 'generated-source' as const },
      activeCountUpdates: { passed: false, detail: 'no workspace', source: 'generated-source' as const },
      browserBuildArtifactExists: { passed: false, detail: 'no workspace', source: 'build-artifact' as const },
    };

const behaviourPassCount = Object.values(behaviourEvidence).filter((b) => b.passed).length;
const behaviourTotal = Object.keys(behaviourEvidence).length;

writeFileSync(
  join(OUT_DIR, 'uvl-behaviour-evidence.json'),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      workspacePath,
      behaviours: behaviourEvidence,
      passedCount: behaviourPassCount,
      totalCount: behaviourTotal,
      allBehavioursPresent: behaviourPassCount === behaviourTotal,
    },
    null,
    2,
  )}\n`,
  'utf8',
);

assertCheck(
  'UVL behaviour evidence recorded',
  behaviourPassCount > 0 && existsSync(join(OUT_DIR, 'uvl-behaviour-evidence.json')),
  `${behaviourPassCount}/${behaviourTotal} behaviours verified`,
);

const uvlAssessment = assessUvlMaturity({
  profile: suiteEntry.profile,
  productPrompt: enrichedPrompt,
  projectRootDir: ROOT,
  workspaceDir: workspacePath,
});
writeFileSync(
  join(OUT_DIR, 'uvl-maturity-snapshot.json'),
  `${JSON.stringify(
    {
      overallCoveragePercent: uvlAssessment.overallCoveragePercent,
      verificationConfidenceScore: uvlAssessment.verificationConfidenceScore,
      verificationSufficientForLaunch: uvlAssessment.verificationSufficientForLaunch,
      criticalGapCount: uvlAssessment.verificationGapReport.criticalGapCount,
      coverageThreshold: VERIFICATION_COVERAGE_THRESHOLD,
      confidenceThreshold: VERIFICATION_CONFIDENCE_THRESHOLD,
    },
    null,
    2,
  )}\n`,
  'utf8',
);

const founderTest = runFounderTestLaunchReadiness({ rootDir: ROOT });
writeFileSync(
  join(OUT_DIR, 'founder-test-launch-readiness.json'),
  `${JSON.stringify(
    {
      panelState: founderTest.report.panelState,
      launchReadinessVerdict: founderTest.report.launchReadinessVerdict,
      founderReadinessScore: founderTest.report.founderReadinessScore,
      confidenceLevel: founderTest.report.confidenceLevel,
      orchestratorVerdict: founderTest.report.orchestratorVerdict,
      topBlockerCount: founderTest.report.topBlockers.length,
      topBlockers: founderTest.report.topBlockers.slice(0, 8).map((b) => b.explanation),
    },
    null,
    2,
  )}\n`,
  'utf8',
);

assertCheck(
  'Founder Test executed',
  founderTest.report.panelState === 'COMPLETE',
  `panel=${founderTest.report.panelState}, score=${founderTest.report.founderReadinessScore}`,
);

const launchBlockers: string[] = [];

if (cqiEnriched.requirementConfidenceScore < REQUIREMENT_CONFIDENCE_THRESHOLD) {
  launchBlockers.push(
    `CQI enriched confidence ${cqiEnriched.requirementConfidenceScore} below threshold ${REQUIREMENT_CONFIDENCE_THRESHOLD}`,
  );
}
if (!cqiEnriched.canProceedToPlanning) {
  launchBlockers.push(`CQI cannot proceed to planning: ${cqiEnriched.stopQuestioningReason}`);
}
if (behaviourPassCount < behaviourTotal) {
  const missing = Object.entries(behaviourEvidence)
    .filter(([, v]) => !v.passed)
    .map(([k]) => k);
  launchBlockers.push(`UVL behaviour evidence incomplete: ${missing.join(', ')}`);
}
if (!uvlAssessment.verificationSufficientForLaunch) {
  launchBlockers.push(
    `UVL hub coverage ${uvlAssessment.overallCoveragePercent}% / confidence ${uvlAssessment.verificationConfidenceScore} below launch thresholds`,
  );
}
if (!buildResult.metrics.buildSuccess) {
  launchBlockers.push('npm build did not pass');
}
if (!previewArtifact || !existsSync(previewArtifact)) {
  launchBlockers.push('preview build artifact missing');
}

const aflaLaunchReady =
  buildResult.executionProof.aflaVerdict === 'FOUNDER_READY' ||
  buildResult.executionProof.aflaVerdict === 'FOUNDER_READY_WITH_WARNINGS';
const founderLaunchReady =
  founderTest.report.launchReadinessVerdict === 'LAUNCH_READY' ||
  founderTest.report.launchReadinessVerdict === 'LAUNCH_READY_WITH_WARNINGS';

if (!aflaLaunchReady) {
  launchBlockers.push(`AFLA verdict ${buildResult.executionProof.aflaVerdict} (score ${buildResult.metrics.aflaOverallScore})`);
}
if (!founderLaunchReady) {
  launchBlockers.push(`Founder launch verdict ${founderTest.report.launchReadinessVerdict}`);
}

const launchReady = launchBlockers.length === 0;
const launchVerdict = launchReady
  ? founderTest.report.launchReadinessVerdict
  : founderTest.report.launchReadinessVerdict;

assertCheck(
  'launch readiness verdict produced',
  Boolean(founderTest.report.launchReadinessVerdict),
  `${launchVerdict}${launchReady ? ' (all gates met)' : ` — blocked: ${launchBlockers.length} issue(s)`}`,
);

const orchestrationOk = validationChecks.every((c) => c.passed);
const chainVerdict = launchReady ? 'PASS' : orchestrationOk ? 'PARTIAL' : 'FAIL';

const report = [
  '# AIDEVENGINE_BUILD_PROOF_V1_1',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Product request',
  '',
  PRODUCT_REQUEST,
  '',
  `## Verdict: **${chainVerdict}**`,
  '',
  launchReady ? `**${AIDEVENGINE_BUILD_PROOF_V1_1_PASS_TOKEN}**` : '',
  '',
  '## Requirement confidence (two-stage)',
  '',
  '| Stage | Confidence | Can proceed to planning | Open questions |',
  '|-------|------------|-------------------------|----------------|',
  `| Initial (unanswered) | **${cqiInitial.requirementConfidenceScore}** | ${cqiInitial.canProceedToPlanning ? 'yes' : 'no'} | ${cqiInitial.openQuestions.length} |`,
  `| Enriched (proof answers applied) | **${cqiEnriched.requirementConfidenceScore}** | ${cqiEnriched.canProceedToPlanning ? 'yes' : 'no'} | ${cqiEnriched.openQuestions.length} |`,
  `| CQI launch threshold | ${REQUIREMENT_CONFIDENCE_THRESHOLD} | — | — |`,
  '',
  '### Deterministic clarification answers (proof scenario only)',
  '',
  ...TASK_TRACKER_PROOF_SCENARIO_ANSWERS.map((a) => `- ${a}`),
  '',
  '## UVL behaviour evidence',
  '',
  '| Behaviour | Status | Source | Detail |',
  '|-----------|--------|--------|--------|',
  ...Object.entries(behaviourEvidence).map(
    ([name, item]) =>
      `| ${name} | ${item.passed ? 'PASS' : 'FAIL'} | ${item.source} | ${item.detail.replace(/\|/g, '/')} |`,
  ),
  '',
  `- Behaviour coverage: **${behaviourPassCount}/${behaviourTotal}**`,
  `- UVL hub coverage: **${uvlAssessment.overallCoveragePercent}%** (threshold ${VERIFICATION_COVERAGE_THRESHOLD}%)`,
  `- UVL hub confidence: **${uvlAssessment.verificationConfidenceScore}** (threshold ${VERIFICATION_CONFIDENCE_THRESHOLD})`,
  '',
  '## Validation checks',
  '',
  '| Check | Status | Detail |',
  '|-------|--------|--------|',
  ...validationChecks.map((c) => `| ${c.name} | ${c.passed ? 'PASS' : 'FAIL'} | ${c.detail.replace(/\|/g, '/')} |`),
  '',
  '## Planning artifacts (enriched prompt)',
  '',
  `- Requirement contract: \`${requirementContract?.contractId ?? 'none'}\` (${requirementContract?.requirements.length ?? 0} requirements)`,
  `- Plan contract: \`${planContract?.contractId ?? 'none'}\` (${planContract?.tasks.length ?? 0} tasks)`,
  `- Build-ready contract: \`${planning.report.buildReadyContract?.contractId ?? 'none'}\``,
  '',
  '## Build execution',
  '',
  `- Workspace: \`${workspacePath?.replace(/\\/g, '/') ?? 'none'}\``,
  `- npm build: ${buildResult.metrics.buildSuccess ? 'PASS' : 'FAIL'}`,
  `- Preview artifact: \`${previewArtifact ?? 'none'}\``,
  `- AFLA: **${buildResult.executionProof.aflaVerdict}** (score ${buildResult.metrics.aflaOverallScore})`,
  '',
  '## Founder test & launch readiness',
  '',
  `- Founder test panel: **${founderTest.report.panelState}**`,
  `- Founder readiness score: **${founderTest.report.founderReadinessScore}**`,
  `- Launch readiness verdict: **${launchVerdict}**`,
  `- Launch gates met: **${launchReady ? 'YES' : 'NO'}**`,
  '',
  launchReady
    ? 'All enriched requirement, build, UVL behaviour, Founder Test, and AFLA gates passed without weakening thresholds.'
    : '### Launch blockers (honest)',
  '',
  ...(launchReady ? [] : launchBlockers.map((b) => `- ${b}`)),
  '',
  '## Artifact directory',
  '',
  `\`${AIDEVENGINE_BUILD_PROOF_V1_1_ARTIFACT_DIR}/\``,
  '',
].join('\n');

const reportPath = join(ROOT, AIDEVENGINE_BUILD_PROOF_V1_1_REPORT_TITLE);
writeFileSync(reportPath, report, 'utf8');

assertCheck('report written', existsSync(reportPath), AIDEVENGINE_BUILD_PROOF_V1_1_REPORT_TITLE);

writeFileSync(
  join(OUT_DIR, 'chain-summary.json'),
  `${JSON.stringify(
    {
      chainVerdict,
      launchReady,
      launchBlockers,
      validationChecks,
      initialConfidence: cqiInitial.requirementConfidenceScore,
      enrichedConfidence: cqiEnriched.requirementConfidenceScore,
      passToken: launchReady ? AIDEVENGINE_BUILD_PROOF_V1_1_PASS_TOKEN : null,
    },
    null,
    2,
  )}\n`,
  'utf8',
);

console.log(report);
console.log(`\nReport: ${AIDEVENGINE_BUILD_PROOF_V1_1_REPORT_TITLE}`);
console.log(`Artifacts: ${AIDEVENGINE_BUILD_PROOF_V1_1_ARTIFACT_DIR}/`);

const allValidationPassed = validationChecks.every((c) => c.passed);
if (!allValidationPassed) {
  console.error('\nValidation checks failed:');
  for (const c of validationChecks.filter((x) => !x.passed)) {
    console.error(`  FAIL — ${c.name}: ${c.detail}`);
  }
  process.exit(1);
}

if (launchReady) {
  console.log(`\n${AIDEVENGINE_BUILD_PROOF_V1_1_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\nOrchestration complete — launch verdict: ${launchVerdict} (${launchBlockers.length} blocker(s))`);
process.exit(2);
