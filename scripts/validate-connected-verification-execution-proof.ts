/**
 * Phase 26.76 — Connected Verification Execution Proof repair validation.
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessAutonomousBuildExecutionProof,
  resetAutonomousBuildExecutionProofModuleForTests,
} from '../src/autonomous-build-execution-proof/index.js';
import {
  assessConnectedBuildExecution,
  materializeBuildContractExpectations,
  materializeBuildProofGapArtifacts,
  resetConnectedBuildExecutionModuleForTests,
  WORKSPACE_ROOT_DIR,
} from '../src/connected-build-execution/index.js';
import {
  assessConnectedPreviewExperienceProof,
  resetConnectedPreviewExperienceProofModuleForTests,
} from '../src/connected-preview-experience-proof/index.js';
import {
  assessConnectedRuntimeActivationProof,
  resetConnectedRuntimeActivationProofModuleForTests,
} from '../src/connected-runtime-activation-proof/index.js';
import {
  assessConnectedLaunchReadinessProof,
  resetConnectedLaunchReadinessProofModuleForTests,
} from '../src/connected-launch-readiness-proof/index.js';
import {
  CONNECTED_VERIFICATION_EXECUTION_PROOF_REPAIR_V1_PASS,
  assessConnectedVerificationExecutionProof,
  buildVerificationExecutionProofReportMarkdown,
  resetConnectedVerificationExecutionProofModuleForTests,
} from '../src/connected-verification-execution-proof/index.js';
import type { VerificationEvidenceFixture } from '../src/connected-verification-execution-proof/connected-verification-execution-proof-types.js';
import {
  assessRequirementsToPlanExecutionContract,
  resetRequirementsToPlanContractModuleForTests,
} from '../src/requirements-to-plan-execution-contract/index.js';
import { assessFounderTestIntegration } from '../src/founder-test-integration/index.js';
import { resolveExecutionChainStageContext, resetExecutionChainStageResolverCacheForTests } from '../src/founder-test-integration/connected-execution-chain-stage-resolver.js';

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
  'src/connected-verification-execution-proof/verification-proof-gap-activator.ts',
  'src/connected-verification-execution-proof/verification-proof-gap-probe.mjs',
  'src/connected-verification-execution-proof/connected-verification-execution-proof-authority.ts',
  'src/founder-test-integration/connected-execution-chain-stage-resolver.ts',
  'scripts/validate-connected-verification-execution-proof.ts',
  'architecture/CONNECTED_VERIFICATION_EXECUTION_PROOF_REPAIR_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const CRM_PROMPT =
  'Build a CRM for a small sales team with contacts, deals, tasks, login, dashboard, and admin role.';

function cleanupWorkspace(contractId: string): void {
  const workspacePath = join(ROOT, WORKSPACE_ROOT_DIR, contractId);
  if (existsSync(workspacePath)) {
    rmSync(workspacePath, { recursive: true, force: true });
  }
}

function getBuildReadyIdea4Contract() {
  resetRequirementsToPlanContractModuleForTests();
  let contract = null;
  for (let i = 0; i < 4; i += 1) {
    const assessment = assessRequirementsToPlanExecutionContract({ rawPrompt: CRM_PROMPT });
    contract = assessment.report.buildReadyContract;
  }
  return contract!;
}

function baseVerificationTarget(workspacePath: string): Partial<VerificationEvidenceFixture> {
  return {
    previewSessionId: 'preview-session-fixture-1',
    workspaceId: workspacePath,
    runtimeSessionId: 'runtime-session-fixture-1',
    previewUrl: 'http://127.0.0.1:4173',
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
    command: 'npm run verify',
    scope: 'preview-e2e',
    passCount: 12,
    failCount: 0,
    warningCount: 0,
    skippedCount: 0,
    resultStatus: 'PASS',
    score: 100,
    summary: 'All verification checks passed',
    evidencePaths: ['verification/run-verify.mjs'],
    evidenceTypes: ['verification_output'],
    testLogs: ['[verify] 12/12 checks passed'],
  };
}

const contract = getBuildReadyIdea4Contract();
cleanupWorkspace(contract.contractId);

resetExecutionChainStageResolverCacheForTests();
resetConnectedBuildExecutionModuleForTests();
const materialization = materializeBuildContractExpectations(contract);
materializeBuildProofGapArtifacts({ projectRootDir: ROOT, contract });
const buildReport = assessConnectedBuildExecution({
  rootDir: ROOT,
  buildReadyContract: contract,
  observedEvidence: {
    paths: materialization.expectedFiles,
    directories: materialization.workspaceTargets,
  },
}).report;
assert('A BUILD PROVEN', buildReport.proofLevel === 'PROVEN', buildReport.proofLevel);

resetConnectedRuntimeActivationProofModuleForTests();
const runtimeReport = assessConnectedRuntimeActivationProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
}).report;
assert('A RUNTIME PROVEN', runtimeReport.runtimeProofLevel === 'PROVEN', runtimeReport.runtimeProofLevel);

resetConnectedPreviewExperienceProofModuleForTests();
const previewReport = assessConnectedPreviewExperienceProof({
  rootDir: ROOT,
  runtimeActivationProof: runtimeReport,
}).report;
assert('A PREVIEW PROVEN', previewReport.previewProofLevel === 'PROVEN', previewReport.previewProofLevel);

resetConnectedVerificationExecutionProofModuleForTests();
const noVerify = assessConnectedVerificationExecutionProof({
  rootDir: ROOT,
  previewExperienceProof: previewReport,
  skipVerificationProofGapActivation: true,
});
assert('B no verification evidence: NOT_PROVEN', noVerify.report.verificationProofLevel === 'NOT_PROVEN', noVerify.report.verificationProofLevel);
assert(
  'B command evidence missing',
  noVerify.report.activationEvidence?.commandDetected === false,
  String(noVerify.report.activationEvidence?.commandDetected),
);

resetConnectedVerificationExecutionProofModuleForTests();
const runStarted = assessConnectedVerificationExecutionProof({
  rootDir: ROOT,
  previewExperienceProof: previewReport,
  skipVerificationProofGapActivation: true,
  verificationEvidenceFixture: {
    ...baseVerificationTarget(buildReport.workspaceMaterialization.workspacePath ?? contract.contractId),
    runStatus: 'STARTED',
    startedAt: new Date().toISOString(),
    command: 'npm run verify',
  },
});
assert('C run started only: PARTIAL', runStarted.report.verificationProofLevel === 'PARTIAL', runStarted.report.verificationProofLevel);

resetConnectedVerificationExecutionProofModuleForTests();
const failedFixture = assessConnectedVerificationExecutionProof({
  rootDir: ROOT,
  previewExperienceProof: previewReport,
  skipVerificationProofGapActivation: true,
  verificationEvidenceFixture: {
    ...fullVerificationFixture(buildReport.workspaceMaterialization.workspacePath ?? contract.contractId),
    passCount: 9,
    failCount: 3,
    resultStatus: 'FAIL',
    summary: '3 verification checks failed',
  },
});
assert('D failed verification: PARTIAL not PROVEN', failedFixture.report.verificationProofLevel === 'PARTIAL', failedFixture.report.verificationProofLevel);
assert(
  'D first broken results→success',
  failedFixture.report.linkage.firstBrokenVerificationLink === 'results→success',
  String(failedFixture.report.linkage.firstBrokenVerificationLink),
);

resetConnectedVerificationExecutionProofModuleForTests();
const full = assessConnectedVerificationExecutionProof({
  rootDir: ROOT,
  previewExperienceProof: previewReport,
  skipVerificationProofGapActivation: true,
  verificationEvidenceFixture: fullVerificationFixture(
    buildReport.workspaceMaterialization.workspacePath ?? contract.contractId,
  ),
});
assert('E fixture PROVEN', full.report.verificationProofLevel === 'PROVEN', full.report.verificationProofLevel);
assert('E linkage connected', full.report.linkage.verificationLinkageConnected, String(full.report.linkage.verificationLinkageConnected));
assert('E execution observed', full.report.session.executionObserved, String(full.report.session.executionObserved));
assert('E verification succeeded', full.report.session.verificationSucceeded, String(full.report.session.verificationSucceeded));

resetConnectedVerificationExecutionProofModuleForTests();
const liveVerify = assessConnectedVerificationExecutionProof({
  rootDir: ROOT,
  previewExperienceProof: previewReport,
});
assert('F live VERIFY PROVEN', liveVerify.report.verificationProofLevel === 'PROVEN', liveVerify.report.verificationProofLevel);
assert(
  'F verification command detected',
  liveVerify.report.session.verificationCommand !== null,
  liveVerify.report.session.verificationCommand ?? 'none',
);
assert('F execution observed live', liveVerify.report.session.executionObserved, String(liveVerify.report.session.executionObserved));
assert(
  'F activation evidence',
  liveVerify.report.activationEvidence?.commandDetected === true,
  String(liveVerify.report.activationEvidence?.commandDetected),
);

resetAutonomousBuildExecutionProofModuleForTests();
resetConnectedVerificationExecutionProofModuleForTests();
const proofAssessment = assessAutonomousBuildExecutionProof({
  rootDir: ROOT,
  connectedBuildMaterialization: buildReport,
});
const proof = proofAssessment.report;
const buildStage = proof.stageProofs.find((s) => s.stage === 'BUILD');
const runtimeStage = proof.stageProofs.find((s) => s.stage === 'RUNTIME');
const previewStage = proof.stageProofs.find((s) => s.stage === 'PREVIEW');
const verifyStage = proof.stageProofs.find((s) => s.stage === 'VERIFY');
const launchStage = proof.stageProofs.find((s) => s.stage === 'LAUNCH');

assert('G BUILD intact', buildStage?.proofLevel === 'PROVEN', buildStage?.proofLevel ?? 'missing');
assert('G RUNTIME intact', runtimeStage?.proofLevel === 'PROVEN', runtimeStage?.proofLevel ?? 'missing');
assert('G PREVIEW intact', previewStage?.proofLevel === 'PROVEN', previewStage?.proofLevel ?? 'missing');
assert('G VERIFY PROVEN live', verifyStage?.proofLevel === 'PROVEN', verifyStage?.proofLevel ?? 'missing');
assert('G firstBrokenStage LAUNCH or null', proof.firstBrokenStage === 'LAUNCH' || proof.firstBrokenStage === null, String(proof.firstBrokenStage));

resetConnectedLaunchReadinessProofModuleForTests();
const notProvenLaunch = assessConnectedLaunchReadinessProof({
  rootDir: ROOT,
  verificationExecutionProof: proof.inputSnapshot.connectedVerificationExecutionProof ?? undefined,
  skipVerificationProofGapActivation: true,
  launchReadinessEvidence: {
    readOnly: true,
    requirementsProven: true,
    planProven: true,
    buildProven: true,
    runtimeProven: true,
    previewProven: true,
    verificationProven: true,
    launchCriteriaSatisfied: false,
    launchBlockers: [],
    readinessScore: 50,
    generatedAt: new Date().toISOString(),
    proofLevel: 'NOT_PROVEN',
    firstLaunchBlocker: null,
  },
}).report;
assert('G LAUNCH isolated check uses injected NOT_PROVEN', notProvenLaunch.launchProofLevel !== 'PROVEN' || notProvenLaunch.launchCriteriaSatisfied === false, notProvenLaunch.launchProofLevel);

const chainContext = resolveExecutionChainStageContext(ROOT, {
  skipLaunchProofGapResolution: true,
});
assert('H verification execution connected', chainContext.verificationExecutionConnected, String(chainContext.verificationExecutionConnected));
assert('H first broken LAUNCH when launch skipped', chainContext.firstBrokenStage === 'LAUNCH', String(chainContext.firstBrokenStage));

const founderTest = assessFounderTestIntegration({ rootDir: ROOT });
const verificationAuthority = founderTest.run.authorityResults.find((r) => r.authorityId === 'VERIFICATION_REALITY');
const verificationBlockers = (verificationAuthority?.blockers ?? []).join(' ').toLowerCase();
assert(
  'I stale verification blockers reduced',
  !verificationBlockers.includes('verification not executed') &&
    !verificationBlockers.includes('no verification evidence'),
  verificationBlockers.slice(0, 120) || 'none',
);

assert(
  'J founder test report includes verification proof',
  founderTest.run.executionChainStageContext?.verificationExecutionProof?.session.proofLevel === 'PROVEN',
  founderTest.run.executionChainStageContext?.verificationExecutionProof?.session.proofLevel ?? 'missing',
);

assert(
  'report markdown includes Verification Execution Proof',
  buildVerificationExecutionProofReportMarkdown(liveVerify.report).includes('Verification Execution Proof'),
  'yes',
);

const arch = readFileSync(
  join(ROOT, 'architecture/CONNECTED_VERIFICATION_EXECUTION_PROOF_REPAIR_REPORT.md'),
  'utf8',
);
assert('architecture repair token', arch.includes(CONNECTED_VERIFICATION_EXECUTION_PROOF_REPAIR_V1_PASS), 'yes');

const validatorSource = readFileSync(join(ROOT, 'scripts/validate-connected-verification-execution-proof.ts'), 'utf8');
assert(
  'no validator recursion',
  !/spawn(?:Sync)?\([^)]*validate-connected-verification-execution-proof/.test(validatorSource),
  'yes',
);

const authoritySource = readFileSync(
  join(ROOT, 'src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts'),
  'utf8',
);
assert('no scoring manipulation in launch readiness', !authoritySource.includes('verificationRealityScore = 100'), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Connected Verification Execution Proof Repair Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${CONNECTED_VERIFICATION_EXECUTION_PROOF_REPAIR_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
