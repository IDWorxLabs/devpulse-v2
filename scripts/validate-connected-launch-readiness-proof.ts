/**
 * Phase 26.12 — Connected Launch Readiness Proof validation.
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
import {
  assessConnectedVerificationExecutionProof,
  resetConnectedVerificationExecutionProofModuleForTests,
} from '../src/connected-verification-execution-proof/index.js';
import type { VerificationEvidenceFixture } from '../src/connected-verification-execution-proof/connected-verification-execution-proof-types.js';
import {
  CONNECTED_LAUNCH_READINESS_PROOF_PASS_TOKEN,
  assessConnectedLaunchReadinessProof,
  buildLaunchReadinessProofReportMarkdown,
  resetConnectedLaunchReadinessProofModuleForTests,
} from '../src/connected-launch-readiness-proof/index.js';
import {
  assessRequirementsToPlanExecutionContract,
  resetRequirementsToPlanContractModuleForTests,
} from '../src/requirements-to-plan-execution-contract/index.js';
import {
  resetFounderTestLaunchReadinessModuleForTests,
  runFounderTestLaunchReadiness,
} from '../src/founder-test-launch-readiness/index.js';
import { assessFounderTestIntegration } from '../src/founder-test-integration/index.js';

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
  'src/connected-launch-readiness-proof/connected-launch-readiness-proof-types.ts',
  'src/connected-launch-readiness-proof/connected-launch-readiness-proof-registry.ts',
  'src/connected-launch-readiness-proof/launch-blocker-analyzer.ts',
  'src/connected-launch-readiness-proof/launch-risk-analyzer.ts',
  'src/connected-launch-readiness-proof/launch-acceptance-analyzer.ts',
  'src/connected-launch-readiness-proof/launch-readiness-analyzer.ts',
  'src/connected-launch-readiness-proof/launch-simulation-analyzer.ts',
  'src/connected-launch-readiness-proof/launch-claim-reality-analyzer.ts',
  'src/connected-launch-readiness-proof/launch-manifest-analyzer.ts',
  'src/connected-launch-readiness-proof/launch-linkage-analyzer.ts',
  'src/connected-launch-readiness-proof/connected-launch-readiness-proof-authority.ts',
  'src/connected-launch-readiness-proof/connected-launch-readiness-proof-report-builder.ts',
  'architecture/CONNECTED_LAUNCH_READINESS_PROOF_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const crmPrompt =
  'Build a CRM for a small sales team with contacts, deals, tasks, login, dashboard, and admin role.';

function getProvenPreviewReport() {
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetConnectedRuntimeActivationProofModuleForTests();
  resetConnectedPreviewExperienceProofModuleForTests();

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
    runtimeSessionId: 'runtime-session-fixture-1',
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

  const runtimeReport = assessConnectedRuntimeActivationProof({
    rootDir: ROOT,
    buildMaterializationReport: buildReport,
    workspacePath,
    runtimeSessionEvidence: runtimeSession,
  }).report;

  const previewSession: PreviewSessionEvidence = {
    previewSessionId: 'preview-session-fixture-1',
    workspaceId: workspacePath,
    runtimeSessionId: 'runtime-session-fixture-1',
    previewUrl: 'http://localhost:5173',
    urlReachable: true,
    htmlResponse: true,
    applicationTitle: 'CRM Dashboard',
    applicationRoot: '#root',
    interactiveElements: ['nav-dashboard', 'btn-add-contact'],
    interactionEvidence: ['navigation: dashboard → contacts', 'click: add contact'],
  };

  const previewReport = assessConnectedPreviewExperienceProof({
    rootDir: ROOT,
    runtimeActivationProof: runtimeReport,
    previewSessionEvidence: previewSession,
  }).report;

  return {
    crmAssessment,
    materialization,
    buildReport,
    workspacePath,
    runtimeSession,
    previewSession,
    previewReport,
    runtimeReport,
  };
}

function baseVerificationTarget(workspacePath: string): Partial<VerificationEvidenceFixture> {
  return {
    previewSessionId: 'preview-session-fixture-1',
    workspaceId: workspacePath,
    runtimeSessionId: 'runtime-session-fixture-1',
    previewUrl: 'http://localhost:5173',
    targetLinkedToRuntime: true,
    targetLinkedToPreview: true,
    targetLinkedToBuild: true,
  };
}

function fullVerificationFixture(workspacePath: string): VerificationEvidenceFixture {
  const now = new Date().toISOString();
  return {
    ...baseVerificationTarget(workspacePath),
    verificationRunId: 'verify-run-fixture-1',
    runStatus: 'COMPLETED',
    startedAt: now,
    completedAt: now,
    executor: 'founder-test-verification',
    command: 'npm run validate:connected-launch-readiness-proof',
    scope: 'preview-e2e',
    passCount: 12,
    failCount: 0,
    warningCount: 0,
    skippedCount: 0,
    resultStatus: 'PASS',
    score: 100,
    summary: 'All verification checks passed',
    evidencePaths: [
      '.verification-evidence/run-report.json',
      '.verification-evidence/assertions.log',
    ],
    evidenceTypes: ['assertion_results', 'test_logs'],
    testLogs: ['[verify] 12/12 checks passed'],
  };
}

const fullLaunchFixture = {
  suppressBlockers: true,
  forceAcceptanceState: 'ACCEPTED' as const,
};

const ctx = getProvenPreviewReport();

resetConnectedVerificationExecutionProofModuleForTests();
const verifyReport = assessConnectedVerificationExecutionProof({
  rootDir: ROOT,
  previewExperienceProof: ctx.previewReport,
  verificationEvidenceFixture: fullVerificationFixture(ctx.workspacePath),
}).report;

resetConnectedLaunchReadinessProofModuleForTests();
const disconnected = assessConnectedLaunchReadinessProof({
  rootDir: ROOT,
  verificationExecutionProof: verifyReport,
  coreChainConnected: false,
  coreFirstBrokenStage: 'BUILD',
});
assert('A disconnected chain: NOT_PROVEN', disconnected.report.launchProofLevel === 'NOT_PROVEN', disconnected.report.launchProofLevel);

resetConnectedLaunchReadinessProofModuleForTests();
const noVerify = assessConnectedLaunchReadinessProof({
  rootDir: ROOT,
  coreChainConnected: true,
  launchReadinessFixture: fullLaunchFixture,
});
assert('B verification not proven: NOT_PROVEN', noVerify.report.launchProofLevel === 'NOT_PROVEN', noVerify.report.launchProofLevel);

resetConnectedLaunchReadinessProofModuleForTests();
const criticalBlocker = assessConnectedLaunchReadinessProof({
  rootDir: ROOT,
  verificationExecutionProof: verifyReport,
  coreChainConnected: true,
});
assert(
  'C critical blocker: PARTIAL or NOT_PROVEN',
  criticalBlocker.report.launchProofLevel === 'PARTIAL' ||
    criticalBlocker.report.launchProofLevel === 'NOT_PROVEN',
  criticalBlocker.report.launchProofLevel,
);

resetConnectedLaunchReadinessProofModuleForTests();
const claimViolation = assessConnectedLaunchReadinessProof({
  rootDir: ROOT,
  verificationExecutionProof: verifyReport,
  coreChainConnected: true,
  launchReadinessFixture: {
    ...fullLaunchFixture,
    forceClaimViolations: [
      {
        readOnly: true,
        violationId: 'fixture-critical-claim',
        severity: 'CRITICAL',
        claim: 'Launch ready',
        reality: 'Critical claim-reality violation injected',
        sourceAuthority: 'validate-connected-launch-readiness-proof',
      },
    ],
  },
});
assert(
  'D claim-reality violation: cannot be READY',
  claimViolation.report.launchState !== 'READY',
  claimViolation.report.launchState,
);

resetAutonomousBuildExecutionProofModuleForTests();
resetConnectedLaunchReadinessProofModuleForTests();
const fullProof = assessAutonomousBuildExecutionProof({
  rootDir: ROOT,
  requirementsToPlanContract: ctx.crmAssessment.report,
  observedBuildEvidence: {
    paths: ctx.materialization.expectedFiles,
    directories: ctx.materialization.workspaceTargets,
  },
  runtimeSessionEvidence: ctx.runtimeSession,
  previewSessionEvidence: ctx.previewSession,
  verificationEvidenceFixture: fullVerificationFixture(ctx.workspacePath),
  launchReadinessFixture: fullLaunchFixture,
});
const fullReport = fullProof.report;
const launchStage = fullReport.stageProofs.find((s) => s.stage === 'LAUNCH');
assert('E full fixture: LAUNCH PROVEN', launchStage?.proofLevel === 'PROVEN', launchStage?.proofLevel ?? 'missing');
assert('E chainConnected true', fullReport.chainConnected, String(fullReport.chainConnected));
assert('E firstBrokenStage null', fullReport.firstBrokenStage === null, String(fullReport.firstBrokenStage));

resetConnectedLaunchReadinessProofModuleForTests();
const rejected = assessConnectedLaunchReadinessProof({
  rootDir: ROOT,
  verificationExecutionProof: verifyReport,
  coreChainConnected: true,
  launchReadinessFixture: {
    suppressBlockers: true,
    forceAcceptanceState: 'REJECTED',
  },
});
assert('F rejected acceptance: NOT_PROVEN', rejected.report.launchProofLevel === 'NOT_PROVEN', rejected.report.launchProofLevel);

const launchSource = readFileSync(
  join(ROOT, 'src/autonomous-build-execution-proof/launch-stage-analyzer.ts'),
  'utf8',
);
assert(
  'G LAUNCH stage consumes connected-launch-readiness-proof',
  launchSource.includes('connected-launch-readiness-proof'),
  'yes',
);

const authoritySource = readFileSync(
  join(ROOT, 'src/autonomous-build-execution-proof/autonomous-build-execution-proof-authority.ts'),
  'utf8',
);
assert(
  'G authority uses assessConnectedLaunchReadinessProof',
  authoritySource.includes('assessConnectedLaunchReadinessProof'),
  'yes',
);

resetFounderTestLaunchReadinessModuleForTests();
const founderTest = runFounderTestLaunchReadiness({
  rootDir: ROOT,
  founderTestAssessment: assessFounderTestIntegration({ rootDir: ROOT }),
  autonomousBuildExecutionProof: fullReport,
  connectedBuildExecution: fullReport.inputSnapshot.connectedBuildMaterialization,
  connectedRuntimeActivationProof: fullReport.inputSnapshot.connectedRuntimeActivationProof,
  connectedPreviewExperienceProof: fullReport.inputSnapshot.connectedPreviewExperienceProof,
  connectedVerificationExecutionProof: fullReport.inputSnapshot.connectedVerificationExecutionProof,
  connectedLaunchReadinessProof: fullReport.inputSnapshot.connectedLaunchReadinessProof,
  skipAutonomousBuildExecutionProof: true,
  skipConnectedBuildExecution: true,
  skipConnectedRuntimeActivationProof: true,
  skipConnectedPreviewExperienceProof: true,
  skipConnectedVerificationExecutionProof: true,
  skipConnectedLaunchReadinessProof: true,
  skipChatStressSimulation: true,
  skipProductReadinessSimulation: true,
  skipHistoryRecording: true,
});
assert(
  'H founder test includes connected launch readiness proof',
  founderTest.report.connectedLaunchReadinessProof !== null,
  founderTest.report.connectedLaunchReadinessProofSummary ?? 'missing',
);

assert(
  'report markdown',
  buildLaunchReadinessProofReportMarkdown(fullReport.inputSnapshot.connectedLaunchReadinessProof!).includes(
    'CONNECTED LAUNCH READINESS PROOF',
  ),
  'yes',
);

const arch = readFileSync(join(ROOT, 'architecture/CONNECTED_LAUNCH_READINESS_PROOF_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(CONNECTED_LAUNCH_READINESS_PROOF_PASS_TOKEN), 'yes');

const failedChecks = results.filter((r) => !r.passed);
console.log('\n--- Connected Launch Readiness Proof Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failedChecks.length === 0) {
  console.log(`\n${CONNECTED_LAUNCH_READINESS_PROOF_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failedChecks.length} check(s) failed.`);
process.exit(1);
