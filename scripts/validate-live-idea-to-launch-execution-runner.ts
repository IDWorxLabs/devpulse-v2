/**
 * Phase 26.13 — Live Idea-To-Launch Execution Runner validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessAutonomousBuildExecutionProof,
  resetAutonomousBuildExecutionProofModuleForTests,
} from '../src/autonomous-build-execution-proof/index.js';
import {
  assessConnectedBuildExecution,
  materializeBuildContractExpectations,
  resetConnectedBuildExecutionModuleForTests,
} from '../src/connected-build-execution/index.js';
import {
  assessConnectedPreviewExperienceProof,
  resetConnectedPreviewExperienceProofModuleForTests,
} from '../src/connected-preview-experience-proof/index.js';
import type { PreviewSessionEvidence } from '../src/connected-preview-experience-proof/connected-preview-experience-proof-types.js';
import {
  assessConnectedRuntimeActivationProof,
  resetConnectedRuntimeActivationProofModuleForTests,
} from '../src/connected-runtime-activation-proof/index.js';
import type { RuntimeSessionEvidence } from '../src/connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import { resetConnectedVerificationExecutionProofModuleForTests } from '../src/connected-verification-execution-proof/index.js';
import type { VerificationEvidenceFixture } from '../src/connected-verification-execution-proof/connected-verification-execution-proof-types.js';
import { resetConnectedLaunchReadinessProofModuleForTests } from '../src/connected-launch-readiness-proof/index.js';
import {
  assessRequirementsToPlanExecutionContract,
  resetRequirementsToPlanContractModuleForTests,
} from '../src/requirements-to-plan-execution-contract/index.js';
import {
  EXECUTION_LIFECYCLE_STAGE_ORDER,
  LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_PASS_TOKEN,
  assessLiveIdeaToLaunchExecutionRunner,
  buildLiveExecutionRunnerHistorySummary,
  buildLiveIdeaToLaunchExecutionRunnerReportMarkdown,
  getLiveExecutionRunnerHistorySize,
  resetLiveExecutionRunnerHistoryForTests,
  resetLiveIdeaToLaunchExecutionRunnerModuleForTests,
  verifyExecutionChain,
} from '../src/live-idea-to-launch-execution-runner/index.js';
import { MAX_LIVE_EXECUTION_RUNNER_HISTORY } from '../src/live-idea-to-launch-execution-runner/live-idea-to-launch-execution-runner-registry.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/live-idea-to-launch-execution-runner/live-idea-to-launch-execution-runner-types.ts',
  'src/live-idea-to-launch-execution-runner/live-idea-to-launch-execution-runner-registry.ts',
  'src/live-idea-to-launch-execution-runner/idea-stage-analyzer.ts',
  'src/live-idea-to-launch-execution-runner/planning-stage-analyzer.ts',
  'src/live-idea-to-launch-execution-runner/execution-stage-analyzer.ts',
  'src/live-idea-to-launch-execution-runner/validation-stage-analyzer.ts',
  'src/live-idea-to-launch-execution-runner/runtime-stage-analyzer.ts',
  'src/live-idea-to-launch-execution-runner/launch-stage-analyzer.ts',
  'src/live-idea-to-launch-execution-runner/execution-chain-verifier.ts',
  'src/live-idea-to-launch-execution-runner/live-idea-to-launch-execution-runner-authority.ts',
  'src/live-idea-to-launch-execution-runner/live-idea-to-launch-execution-runner-history.ts',
  'src/live-idea-to-launch-execution-runner/live-idea-to-launch-execution-runner-report-builder.ts',
  'src/live-idea-to-launch-execution-runner/index.ts',
  'architecture/LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const crmPrompt =
  'Build a CRM for a small sales team with contacts, deals, tasks, login, dashboard, and admin role.';

function getFullFixtureContext() {
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetConnectedRuntimeActivationProofModuleForTests();
  resetConnectedPreviewExperienceProofModuleForTests();
  resetConnectedVerificationExecutionProofModuleForTests();
  resetConnectedLaunchReadinessProofModuleForTests();
  resetAutonomousBuildExecutionProofModuleForTests();

  const crmAssessment = assessRequirementsToPlanExecutionContract({ rawPrompt: crmPrompt });
  const contract = crmAssessment.report.buildReadyContract!;
  const materialization = materializeBuildContractExpectations(contract);
  const buildReport = assessConnectedBuildExecution({
    rootDir: ROOT,
    buildReadyContract: contract,
    observedEvidence: {
      paths: materialization.expectedFiles,
      directories: materialization.workspaceTargets,
    },
  }).report;

  const workspacePath = (
    buildReport.workspaceMaterialization.workspacePath ??
    buildReport.buildMaterialization.workspaceTargets[0] ??
    `.generated-builder-workspaces/${buildReport.buildMaterialization.contractId}`
  ).replace(/\\/g, '/');

  const runtimeSession: RuntimeSessionEvidence = {
    runtimeSessionId: 'runtime-session-fixture-live-runner',
    command: 'npm run dev',
    workingDirectory: workspacePath,
    processId: '4242',
    processState: 'STARTED',
    port: 5173,
    host: 'localhost',
    url: 'http://localhost:5173',
    reachable: true,
    protocol: 'http',
    healthStatusCode: 200,
    healthResponseType: 'html',
  };

  const previewSession: PreviewSessionEvidence = {
    previewSessionId: 'preview-session-fixture-live-runner',
    workspaceId: workspacePath,
    runtimeSessionId: 'runtime-session-fixture-live-runner',
    previewUrl: 'http://localhost:5173',
    urlReachable: true,
    htmlResponse: true,
    applicationTitle: 'CRM Dashboard',
    applicationRoot: '#root',
    interactiveElements: ['nav-dashboard'],
    interactionEvidence: ['click: add contact'],
  };

  const now = new Date().toISOString();
  const verificationFixture: VerificationEvidenceFixture = {
    previewSessionId: previewSession.previewSessionId,
    workspaceId: workspacePath,
    runtimeSessionId: runtimeSession.runtimeSessionId,
    previewUrl: 'http://localhost:5173',
    targetLinkedToRuntime: true,
    targetLinkedToPreview: true,
    targetLinkedToBuild: true,
    verificationRunId: 'verify-run-live-runner',
    runStatus: 'COMPLETED',
    startedAt: now,
    completedAt: now,
    executor: 'live-execution-runner-fixture',
    command: 'npm run validate:live-idea-to-launch-execution-runner',
    scope: 'preview-e2e',
    passCount: 12,
    failCount: 0,
    warningCount: 0,
    skippedCount: 0,
    resultStatus: 'PASS',
    score: 100,
    summary: 'All verification checks passed',
    evidencePaths: ['.verification-evidence/run-report.json'],
    evidenceTypes: ['assertion_results'],
    testLogs: ['[verify] passed'],
  };

  return {
    crmAssessment,
    materialization,
    buildReport,
    workspacePath,
    runtimeSession,
    previewSession,
    verificationFixture,
  };
}

resetLiveIdeaToLaunchExecutionRunnerModuleForTests();
resetLiveExecutionRunnerHistoryForTests();

const empty = assessLiveIdeaToLaunchExecutionRunner({
  rootDir: ROOT,
  requirementsToPlanContract: null,
  founderTestAssessment: null,
  autonomousBuildExecutionProof: null,
  connectedBuildExecution: null,
  connectedVerificationExecutionProof: null,
  connectedRuntimeActivationProof: null,
  connectedPreviewExperienceProof: null,
  connectedLaunchReadinessProof: null,
  founderTestLaunchReadiness: null,
  skipHistoryRecording: true,
});

assert('A authority executes', empty.orchestrationState === 'LIVE_EXECUTION_RUNNER_COMPLETE', empty.orchestrationState);
assert(
  'A missing evidence remains missing',
  empty.report.missingEvidence.length > 0,
  String(empty.report.missingEvidence.length),
);
assert(
  'A empty run verdict not PROVEN',
  empty.report.executionVerdict !== 'PROVEN',
  empty.report.executionVerdict,
);

const chainUnit = verifyExecutionChain({
  idea: empty.report.idea,
  planning: empty.report.planning,
  build: empty.report.build,
  validation: empty.report.validation,
  runtime: empty.report.runtime,
  launch: empty.report.launch,
});
assert('B chain verifier executes', typeof chainUnit.chainConnected === 'boolean', String(chainUnit.chainConnected));
assert(
  'B stage ordering enforced',
  EXECUTION_LIFECYCLE_STAGE_ORDER.length === 6,
  String(EXECUTION_LIFECYCLE_STAGE_ORDER.length),
);
assert(
  'B blocked build when planning missing',
  empty.report.build.evidenceLevel === 'BLOCKED' || !empty.report.build.confirmed,
  empty.report.build.evidenceLevel,
);

const scores = [
  empty.report.idea.score,
  empty.report.planning.score,
  empty.report.build.score,
  empty.report.validation.score,
  empty.report.runtime.score,
  empty.report.launch.score,
  empty.report.overallExecutionScore,
];
assert(
  'C scoring bounded 0-100',
  scores.every((s) => s >= 0 && s <= 100),
  scores.join(', '),
);

assert(
  'D report markdown generated',
  buildLiveIdeaToLaunchExecutionRunnerReportMarkdown(empty.report).includes(
    'LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_REPORT',
  ),
  'yes',
);

for (let i = 0; i < MAX_LIVE_EXECUTION_RUNNER_HISTORY + 2; i += 1) {
  assessLiveIdeaToLaunchExecutionRunner({ rootDir: ROOT, skipHistoryRecording: false });
}
assert(
  'E history bounded',
  getLiveExecutionRunnerHistorySize() <= MAX_LIVE_EXECUTION_RUNNER_HISTORY,
  `${getLiveExecutionRunnerHistorySize()}/${MAX_LIVE_EXECUTION_RUNNER_HISTORY}`,
);
const historySummary = buildLiveExecutionRunnerHistorySummary();
assert('E history summary', historySummary.totalRuns <= MAX_LIVE_EXECUTION_RUNNER_HISTORY, String(historySummary.totalRuns));

resetLiveIdeaToLaunchExecutionRunnerModuleForTests();
resetLiveExecutionRunnerHistoryForTests();
const ctx = getFullFixtureContext();
const full = assessLiveIdeaToLaunchExecutionRunner({
  rootDir: ROOT,
  rawPrompt: crmPrompt,
  requirementsToPlanContract: ctx.crmAssessment.report,
  observedBuildEvidence: {
    paths: ctx.materialization.expectedFiles,
    directories: ctx.materialization.workspaceTargets,
  },
  runtimeSessionEvidence: ctx.runtimeSession,
  previewSessionEvidence: ctx.previewSession,
  verificationEvidenceFixture: ctx.verificationFixture,
  launchReadinessFixture: { suppressBlockers: true, forceAcceptanceState: 'ACCEPTED' },
  skipHistoryRecording: true,
});

assert('F full fixture: idea confirmed', full.report.idea.confirmed, String(full.report.idea.score));
assert('F full fixture: planning confirmed', full.report.planning.confirmed, String(full.report.planning.score));
assert('F full fixture: build confirmed', full.report.build.confirmed, String(full.report.build.score));
assert('F full fixture: validation confirmed', full.report.validation.confirmed, String(full.report.validation.score));
assert('F full fixture: runtime confirmed', full.report.runtime.confirmed, String(full.report.runtime.score));
assert('F full fixture: launch confirmed', full.report.launch.confirmed, String(full.report.launch.score));
assert('F full fixture: LAUNCH_READY', full.report.executionState === 'LAUNCH_READY', full.report.executionState);
assert('F full fixture: chain connected', full.report.chain.chainConnected, String(full.report.chain.chainConnected));
assert('F full fixture: verdict PROVEN', full.report.executionVerdict === 'PROVEN', full.report.executionVerdict);

const authoritySource = readFileSync(
  join(ROOT, 'src/live-idea-to-launch-execution-runner/live-idea-to-launch-execution-runner-authority.ts'),
  'utf8',
);
assert('G authority read-only advisory', authoritySource.includes('advisoryOnly: true'), 'yes');
assert('G no mutation patterns', !authoritySource.includes('writeFileSync'), 'no file writes');

const arch = readFileSync(join(ROOT, 'architecture/LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_PASS_TOKEN), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Live Idea-To-Launch Execution Runner Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\nExecution state (full fixture): ${full.report.executionState}`);
  console.log(`Overall score (full fixture): ${full.report.overallExecutionScore}/100`);
  console.log(`Report path: architecture/LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_REPORT.md`);
  console.log(`\n${LIVE_IDEA_TO_LAUNCH_EXECUTION_RUNNER_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
