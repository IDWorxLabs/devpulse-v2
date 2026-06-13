/**
 * Phase 26.11 — Connected Verification Execution Proof validation.
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
  CONNECTED_VERIFICATION_EXECUTION_PROOF_PASS_TOKEN,
  assessConnectedVerificationExecutionProof,
  buildVerificationExecutionProofReportMarkdown,
  resetConnectedVerificationExecutionProofModuleForTests,
} from '../src/connected-verification-execution-proof/index.js';
import type { VerificationEvidenceFixture } from '../src/connected-verification-execution-proof/connected-verification-execution-proof-types.js';
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
  'src/connected-verification-execution-proof/connected-verification-execution-proof-types.ts',
  'src/connected-verification-execution-proof/connected-verification-execution-proof-registry.ts',
  'src/connected-verification-execution-proof/verification-run-analyzer.ts',
  'src/connected-verification-execution-proof/verification-target-analyzer.ts',
  'src/connected-verification-execution-proof/verification-result-analyzer.ts',
  'src/connected-verification-execution-proof/verification-evidence-analyzer.ts',
  'src/connected-verification-execution-proof/verification-failure-analyzer.ts',
  'src/connected-verification-execution-proof/verification-readiness-analyzer.ts',
  'src/connected-verification-execution-proof/verification-manifest-analyzer.ts',
  'src/connected-verification-execution-proof/verification-linkage-analyzer.ts',
  'src/connected-verification-execution-proof/connected-verification-execution-proof-authority.ts',
  'src/connected-verification-execution-proof/connected-verification-execution-proof-report-builder.ts',
  'architecture/CONNECTED_VERIFICATION_EXECUTION_PROOF_REPORT.md',
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
    command: 'npm run validate:connected-verification-execution-proof',
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

const ctx = getProvenPreviewReport();
assert('fixture: PREVIEW PROVEN', ctx.previewReport.previewProofLevel === 'PROVEN', ctx.previewReport.previewProofLevel);

resetConnectedVerificationExecutionProofModuleForTests();
const noVerify = assessConnectedVerificationExecutionProof({
  rootDir: ROOT,
  previewExperienceProof: ctx.previewReport,
});
assert('A no verification evidence: NOT_PROVEN', noVerify.report.verificationProofLevel === 'NOT_PROVEN', noVerify.report.verificationProofLevel);

resetConnectedVerificationExecutionProofModuleForTests();
const runStarted = assessConnectedVerificationExecutionProof({
  rootDir: ROOT,
  previewExperienceProof: ctx.previewReport,
  verificationEvidenceFixture: {
    ...baseVerificationTarget(ctx.workspacePath),
    runStatus: 'STARTED',
    startedAt: new Date().toISOString(),
  },
});
assert('B run started only: PARTIAL', runStarted.report.verificationProofLevel === 'PARTIAL', runStarted.report.verificationProofLevel);

resetConnectedVerificationExecutionProofModuleForTests();
const noTargetLink = assessConnectedVerificationExecutionProof({
  rootDir: ROOT,
  previewExperienceProof: ctx.previewReport,
  verificationEvidenceFixture: {
    verificationRunId: 'verify-run-partial',
    runStatus: 'COMPLETED',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    passCount: 5,
    failCount: 0,
    resultStatus: 'PASS',
    targetLinkedToPreview: false,
    targetLinkedToRuntime: false,
    targetLinkedToBuild: false,
    previewSessionId: 'preview-session-fixture-1',
    workspaceId: ctx.workspacePath,
  },
});
assert('C no target linkage: PARTIAL', noTargetLink.report.verificationProofLevel === 'PARTIAL', noTargetLink.report.verificationProofLevel);

resetConnectedVerificationExecutionProofModuleForTests();
const noEvidence = assessConnectedVerificationExecutionProof({
  rootDir: ROOT,
  previewExperienceProof: ctx.previewReport,
  verificationEvidenceFixture: {
    ...baseVerificationTarget(ctx.workspacePath),
    verificationRunId: 'verify-run-no-evidence',
    runStatus: 'COMPLETED',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    passCount: 8,
    failCount: 0,
    resultStatus: 'PASS',
    evidencePaths: [],
    evidenceTypes: [],
  },
});
assert('D results no evidence: PARTIAL', noEvidence.report.verificationProofLevel === 'PARTIAL', noEvidence.report.verificationProofLevel);

resetConnectedVerificationExecutionProofModuleForTests();
const full = assessConnectedVerificationExecutionProof({
  rootDir: ROOT,
  previewExperienceProof: ctx.previewReport,
  verificationEvidenceFixture: fullVerificationFixture(ctx.workspacePath),
});
assert('E fully linked fixture: PROVEN', full.report.verificationProofLevel === 'PROVEN', full.report.verificationProofLevel);
assert('E linkage connected', full.report.linkage.verificationLinkageConnected, String(full.report.linkage.verificationLinkageConnected));

resetConnectedVerificationExecutionProofModuleForTests();
const failed = assessConnectedVerificationExecutionProof({
  rootDir: ROOT,
  previewExperienceProof: ctx.previewReport,
  verificationEvidenceFixture: {
    ...fullVerificationFixture(ctx.workspacePath),
    passCount: 9,
    failCount: 3,
    resultStatus: 'FAIL',
    summary: '3 verification checks failed',
    failures: [
      {
        failureId: 'verify-fail-login',
        severity: 'HIGH',
        message: 'Login form validation failed',
        source: 'e2e-verification',
        affectedStage: 'VERIFY',
        recommendedFix: 'Fix login form validation before launch.',
      },
    ],
  },
});
assert('F failed verification: PROVEN proof', failed.report.verificationProofLevel === 'PROVEN', failed.report.verificationProofLevel);
assert(
  'F failed verification: readiness FAILED',
  failed.report.readiness.readinessState === 'VERIFICATION_FAILED',
  failed.report.readiness.readinessState,
);

resetConnectedVerificationExecutionProofModuleForTests();
const broken = assessConnectedVerificationExecutionProof({
  rootDir: ROOT,
  previewExperienceProof: ctx.previewReport,
  verificationEvidenceFixture: {
    ...fullVerificationFixture(ctx.workspacePath),
    targetLinkedToPreview: false,
  },
});
assert(
  'G linkage break: firstBrokenVerificationLink identified',
  broken.report.linkage.firstBrokenVerificationLink !== null,
  String(broken.report.linkage.firstBrokenVerificationLink),
);

resetAutonomousBuildExecutionProofModuleForTests();
resetConnectedVerificationExecutionProofModuleForTests();
const proofAssessment = assessAutonomousBuildExecutionProof({
  rootDir: ROOT,
  requirementsToPlanContract: ctx.crmAssessment.report,
  observedBuildEvidence: {
    paths: ctx.materialization.expectedFiles,
    directories: ctx.materialization.workspaceTargets,
  },
  runtimeSessionEvidence: ctx.runtimeSession,
  previewSessionEvidence: ctx.previewSession,
  verificationEvidenceFixture: fullVerificationFixture(ctx.workspacePath),
});
const proof = proofAssessment.report;
const verifyStage = proof.stageProofs.find((s) => s.stage === 'VERIFY');
assert(
  'H VERIFY consumes connected-verification-execution-proof',
  verifyStage?.sourceAuthority === 'connected-verification-execution-proof',
  verifyStage?.sourceAuthority ?? 'missing',
);
assert('H VERIFY PROVEN with fixture', verifyStage?.proofLevel === 'PROVEN', verifyStage?.proofLevel ?? 'missing');
assert(
  'H firstBrokenStage advances to LAUNCH',
  proof.firstBrokenStage === 'LAUNCH',
  String(proof.firstBrokenStage),
);

resetFounderTestLaunchReadinessModuleForTests();
const founderTest = runFounderTestLaunchReadiness({
  rootDir: ROOT,
  founderTestAssessment: assessFounderTestIntegration({ rootDir: ROOT }),
  autonomousBuildExecutionProof: proof,
  connectedBuildExecution: proof.inputSnapshot.connectedBuildMaterialization,
  connectedRuntimeActivationProof: proof.inputSnapshot.connectedRuntimeActivationProof,
  connectedPreviewExperienceProof: proof.inputSnapshot.connectedPreviewExperienceProof,
  connectedVerificationExecutionProof: proof.inputSnapshot.connectedVerificationExecutionProof,
  skipAutonomousBuildExecutionProof: true,
  skipConnectedBuildExecution: true,
  skipConnectedRuntimeActivationProof: true,
  skipConnectedPreviewExperienceProof: true,
  skipConnectedVerificationExecutionProof: true,
  skipChatStressSimulation: true,
  skipProductReadinessSimulation: true,
  skipHistoryRecording: true,
});
assert(
  'I founder test includes connected verification execution proof',
  founderTest.report.connectedVerificationExecutionProof !== null,
  founderTest.report.connectedVerificationExecutionProofSummary ?? 'missing',
);

assert(
  'report markdown',
  buildVerificationExecutionProofReportMarkdown(full.report).includes('CONNECTED VERIFICATION EXECUTION PROOF'),
  'yes',
);

const verifySource = readFileSync(
  join(ROOT, 'src/autonomous-build-execution-proof/verification-stage-analyzer.ts'),
  'utf8',
);
assert('verify stage uses execution proof authority', verifySource.includes('connected-verification-execution-proof'), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/CONNECTED_VERIFICATION_EXECUTION_PROOF_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(CONNECTED_VERIFICATION_EXECUTION_PROOF_PASS_TOKEN), 'yes');

const failedChecks = results.filter((r) => !r.passed);
console.log('\n--- Connected Verification Execution Proof Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failedChecks.length === 0) {
  console.log(`\n${CONNECTED_VERIFICATION_EXECUTION_PROOF_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failedChecks.length} check(s) failed.`);
process.exit(1);
