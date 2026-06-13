/**
 * Phase 26.77 — Connected Launch Readiness Proof repair validation.
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
  assessConnectedVerificationExecutionProof,
  resetConnectedVerificationExecutionProofModuleForTests,
} from '../src/connected-verification-execution-proof/index.js';
import {
  CONNECTED_LAUNCH_READINESS_PROOF_REPAIR_V1_PASS,
  assessConnectedLaunchReadinessProof,
  buildLaunchReadinessProofReportMarkdown,
  resetConnectedLaunchReadinessProofModuleForTests,
} from '../src/connected-launch-readiness-proof/index.js';
import {
  assessRequirementsToPlanExecutionContract,
  resetRequirementsToPlanContractModuleForTests,
} from '../src/requirements-to-plan-execution-contract/index.js';
import { assessFounderTestIntegration, resetFounderTestIntegrationModuleForTests } from '../src/founder-test-integration/index.js';
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
  'src/connected-launch-readiness-proof/launch-proof-chain-resolver.ts',
  'src/connected-launch-readiness-proof/connected-launch-readiness-proof-authority.ts',
  'src/founder-test-integration/connected-execution-chain-stage-resolver.ts',
  'scripts/validate-connected-launch-readiness-proof.ts',
  'architecture/CONNECTED_LAUNCH_READINESS_PROOF_REPAIR_REPORT.md',
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

const contract = getBuildReadyIdea4Contract();
cleanupWorkspace(contract.contractId);

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
const verifyReport = assessConnectedVerificationExecutionProof({
  rootDir: ROOT,
  previewExperienceProof: previewReport,
}).report;
assert('A VERIFY PROVEN', verifyReport.verificationProofLevel === 'PROVEN', verifyReport.verificationProofLevel);

resetConnectedLaunchReadinessProofModuleForTests();
const disconnected = assessConnectedLaunchReadinessProof({
  rootDir: ROOT,
  verificationExecutionProof: verifyReport,
  launchReadinessEvidence: {
    readOnly: true,
    requirementsProven: true,
    planProven: true,
    buildProven: true,
    runtimeProven: true,
    previewProven: true,
    verificationProven: false,
    launchCriteriaSatisfied: false,
    launchBlockers: [],
    readinessScore: 80,
    generatedAt: new Date().toISOString(),
    proofLevel: 'NOT_PROVEN',
    firstLaunchBlocker: null,
  },
});
assert('B verify not satisfied: NOT_PROVEN', disconnected.report.launchProofLevel === 'NOT_PROVEN', disconnected.report.launchProofLevel);

resetConnectedLaunchReadinessProofModuleForTests();
const noUpstream = assessConnectedLaunchReadinessProof({
  rootDir: ROOT,
  coreChainConnected: false,
  launchReadinessFixture: { suppressBlockers: true, forceAcceptanceState: 'ACCEPTED' },
});
assert('C upstream chain broken: NOT_PROVEN', noUpstream.report.launchProofLevel === 'NOT_PROVEN', noUpstream.report.launchProofLevel);

resetConnectedLaunchReadinessProofModuleForTests();
const claimViolation = assessConnectedLaunchReadinessProof({
  rootDir: ROOT,
  verificationExecutionProof: verifyReport,
  coreChainConnected: true,
  launchReadinessEvidence: {
    readOnly: true,
    requirementsProven: true,
    planProven: true,
    buildProven: true,
    runtimeProven: true,
    previewProven: true,
    verificationProven: true,
    launchCriteriaSatisfied: true,
    launchBlockers: [],
    readinessScore: 100,
    generatedAt: new Date().toISOString(),
    proofLevel: 'PROVEN',
    firstLaunchBlocker: null,
  },
  launchReadinessFixture: {
    suppressBlockers: true,
    forceAcceptanceState: 'ACCEPTED',
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
  'D claim violation blocks PROVEN',
  claimViolation.report.launchProofLevel !== 'PROVEN',
  claimViolation.report.launchProofLevel,
);

resetConnectedLaunchReadinessProofModuleForTests();
const liveLaunch = assessConnectedLaunchReadinessProof({
  rootDir: ROOT,
  verificationExecutionProof: verifyReport,
  buildMaterializationReport: buildReport,
  skipFounderTestReassessment: true,
  coreStageProofs: [
    { readOnly: true, stage: 'REQUIREMENTS', proofLevel: 'PROVEN', score: 100, sourceAuthority: 'test', upstreamState: 'READY', evidence: [], missingEvidence: [], recommendedFix: '', downstreamBlocked: false },
    { readOnly: true, stage: 'PLAN', proofLevel: 'PROVEN', score: 100, sourceAuthority: 'test', upstreamState: 'READY', evidence: [], missingEvidence: [], recommendedFix: '', downstreamBlocked: false },
    { readOnly: true, stage: 'BUILD', proofLevel: 'PROVEN', score: 100, sourceAuthority: 'connected-build-execution', upstreamState: 'READY', evidence: [], missingEvidence: [], recommendedFix: '', downstreamBlocked: false },
    { readOnly: true, stage: 'RUNTIME', proofLevel: 'PROVEN', score: 100, sourceAuthority: 'connected-runtime-activation-proof', upstreamState: 'READY', evidence: [], missingEvidence: [], recommendedFix: '', downstreamBlocked: false },
    { readOnly: true, stage: 'PREVIEW', proofLevel: 'PROVEN', score: 100, sourceAuthority: 'connected-preview-experience-proof', upstreamState: 'READY', evidence: [], missingEvidence: [], recommendedFix: '', downstreamBlocked: false },
    { readOnly: true, stage: 'VERIFY', proofLevel: 'PROVEN', score: 100, sourceAuthority: 'connected-verification-execution-proof', upstreamState: 'READY', evidence: [], missingEvidence: [], recommendedFix: '', downstreamBlocked: false },
  ],
});
assert('E live LAUNCH PROVEN', liveLaunch.report.launchProofLevel === 'PROVEN', liveLaunch.report.launchProofLevel);
assert('E launch criteria satisfied', liveLaunch.report.launchCriteriaSatisfied, String(liveLaunch.report.launchCriteriaSatisfied));
assert('E launch execution connected', liveLaunch.report.launchExecutionConnected, String(liveLaunch.report.launchExecutionConnected));
assert('E all upstream proven in evidence', liveLaunch.report.evidence.verificationProven, String(liveLaunch.report.evidence.verificationProven));
assert(
  'E no stale execution chain blocker',
  !liveLaunch.report.blockers.blockers.some((b) => b.blockerId === 'execution-chain-disconnected'),
  String(liveLaunch.report.blockers.blockers.map((b) => b.blockerId)),
);

resetAutonomousBuildExecutionProofModuleForTests();
resetConnectedLaunchReadinessProofModuleForTests();
const proofAssessment = assessAutonomousBuildExecutionProof({
  rootDir: ROOT,
  connectedBuildMaterialization: buildReport,
});
const proof = proofAssessment.report;
const verifyStage = proof.stageProofs.find((s) => s.stage === 'VERIFY');
const launchStage = proof.stageProofs.find((s) => s.stage === 'LAUNCH');

assert('F VERIFY intact', verifyStage?.proofLevel === 'PROVEN', verifyStage?.proofLevel ?? 'missing');
assert('F LAUNCH PROVEN live', launchStage?.proofLevel === 'PROVEN', launchStage?.proofLevel ?? 'missing');
assert('F chainConnected true', proof.chainConnected, String(proof.chainConnected));
assert('F firstBrokenStage null', proof.firstBrokenStage === null, String(proof.firstBrokenStage));

const chainContext = resolveExecutionChainStageContext(ROOT, {
  verificationExecutionProof: verifyReport,
  buildMaterializationReport: buildReport,
  launchReadinessProof: liveLaunch.report,
  launchProven: liveLaunch.report.launchProofLevel === 'PROVEN',
  launchExecutionConnected: liveLaunch.report.launchExecutionConnected,
});
assert('G launch execution connected', chainContext.launchExecutionConnected, String(chainContext.launchExecutionConnected));
assert('G launch proven', chainContext.launchProven, String(chainContext.launchProven));
assert('G first broken null', chainContext.firstBrokenStage === null, String(chainContext.firstBrokenStage));

resetExecutionChainStageResolverCacheForTests();
resetFounderTestIntegrationModuleForTests();
const founderTest = assessFounderTestIntegration({ rootDir: ROOT });
assert(
  'H founder test launch proof visible',
  founderTest.run.executionChainStageContext?.launchReadinessProof?.launchProofLevel === 'PROVEN',
  founderTest.run.executionChainStageContext?.launchReadinessProof?.launchProofLevel ?? 'missing',
);

assert(
  'report markdown includes Connected Launch Readiness Proof',
  buildLaunchReadinessProofReportMarkdown(liveLaunch.report).includes('Connected Launch Readiness Proof'),
  'yes',
);

const arch = readFileSync(
  join(ROOT, 'architecture/CONNECTED_LAUNCH_READINESS_PROOF_REPAIR_REPORT.md'),
  'utf8',
);
assert('architecture repair token', arch.includes(CONNECTED_LAUNCH_READINESS_PROOF_REPAIR_V1_PASS), 'yes');

const validatorSource = readFileSync(join(ROOT, 'scripts/validate-connected-launch-readiness-proof.ts'), 'utf8');
assert(
  'no validator recursion',
  !/spawn(?:Sync)?\([^)]*validate-connected-launch-readiness-proof/.test(validatorSource),
  'yes',
);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Connected Launch Readiness Proof Repair Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${CONNECTED_LAUNCH_READINESS_PROOF_REPAIR_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
