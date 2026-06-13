/**
 * Phase 26.78 — Execution Proof Authority Synchronization validation.
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
  assessConnectedLaunchReadinessProof,
  resetConnectedLaunchReadinessProofModuleForTests,
} from '../src/connected-launch-readiness-proof/index.js';
import {
  assessFounderTestIntegration,
  buildFounderTestIntegrationReportMarkdown,
  EXECUTION_PROOF_AUTHORITY_SYNCHRONIZATION_V1_PASS,
  EXECUTION_PROOF_CONTRADICTION,
  resetFounderTestIntegrationModuleForTests,
  resolveConnectedExecutionChainTruth,
  resetExecutionChainStageResolverCacheForTests,
} from '../src/founder-test-integration/index.js';
import {
  assessRequirementsToPlanExecutionContract,
  resetRequirementsToPlanContractModuleForTests,
} from '../src/requirements-to-plan-execution-contract/index.js';
import { buildFounderTestIntegrationReport } from '../src/founder-test-integration/founder-test-integration-authority.js';

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
  'src/founder-test-integration/connected-execution-chain-truth.ts',
  'src/founder-test-integration/execution-proof-contradiction-detector.ts',
  'src/founder-test-integration/execution-proof-authority-sync.ts',
  'src/founder-test-integration/founder-test-integration-orchestrator.ts',
  'scripts/validate-execution-proof-authority-synchronization.ts',
  'architecture/EXECUTION_PROOF_AUTHORITY_SYNCHRONIZATION_REPORT.md',
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

resetConnectedRuntimeActivationProofModuleForTests();
const runtimeReport = assessConnectedRuntimeActivationProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
}).report;

resetConnectedPreviewExperienceProofModuleForTests();
const previewReport = assessConnectedPreviewExperienceProof({
  rootDir: ROOT,
  runtimeActivationProof: runtimeReport,
}).report;

resetConnectedVerificationExecutionProofModuleForTests();
const verifyReport = assessConnectedVerificationExecutionProof({
  rootDir: ROOT,
  previewExperienceProof: previewReport,
}).report;

resetConnectedLaunchReadinessProofModuleForTests();
const launchReport = assessConnectedLaunchReadinessProof({
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
}).report;

const truth = resolveConnectedExecutionChainTruth({
  readOnly: true,
  buildMaterializationProven: true,
  runtimeProven: true,
  previewProven: true,
  verificationProven: true,
  launchProven: launchReport.launchProofLevel === 'PROVEN',
  firstBrokenStage: launchReport.launchProofLevel === 'PROVEN' ? null : 'LAUNCH',
  builderMaterializationConnected: true,
  previewExperienceConnected: true,
  verificationExecutionConnected: true,
  launchExecutionConnected: launchReport.launchExecutionConnected,
  buildMaterializationReport: buildReport,
  verificationExecutionProof: verifyReport,
  launchReadinessProof: launchReport,
  resolvedAt: new Date().toISOString(),
});

assert('A truth source buildProven', truth.buildProven, String(truth.buildProven));
assert('A truth source chainConnected', truth.chainConnected, String(truth.chainConnected));

resetFounderTestIntegrationModuleForTests();
resetExecutionChainStageResolverCacheForTests();
const founderTest = assessFounderTestIntegration({ rootDir: ROOT });
const sync = founderTest.run.executionProofSynchronization;
const runTruth = founderTest.run.executionChainTruth;

assert('B founder test has truth source', runTruth != null, String(runTruth != null));
assert('B founder test buildProven when chain proven', runTruth?.buildProven === true, String(runTruth?.buildProven));
assert('B sync report exists', sync != null, String(sync != null));
assert('B consuming authorities listed', (sync?.authoritiesConsumingTruthSource.length ?? 0) >= 4, String(sync?.authoritiesConsumingTruthSource.length));

const staleBuildBlockers = (founderTest.blockers ?? []).filter((b) =>
  /executionconnected\s*=\s*false|build blocked|builder execution is not connected/i.test(b),
);
assert('C no stale BUILD blockers when truth proven', staleBuildBlockers.length === 0, staleBuildBlockers.join(' | '));

const requirementResult = founderTest.run.authorityResults.find((r) => r.authorityId === 'REQUIREMENT_REALITY');
const founderResult = founderTest.run.authorityResults.find((r) => r.authorityId === 'FOUNDER_REALITY');
const staleRequirement = (requirementResult?.blockers ?? []).some((b) =>
  /execution is not connected|executionconnected=false/i.test(b),
);
const staleFounder = (founderResult?.blockers ?? []).some((b) =>
  /execution is not connected|build blocked|executionconnected=false/i.test(b),
);
assert('C requirement reality synced', !staleRequirement, String(staleRequirement));
assert('C founder reality synced', !staleFounder, String(staleFounder));

assert(
  'D contradiction detector kind',
  sync?.contradictions.every((c) => c.kind === EXECUTION_PROOF_CONTRADICTION) ?? true,
  String(sync?.contradictionCount),
);
assert('D zero contradictions when synced', sync?.contradictionCount === 0, String(sync?.contradictionCount));

const reportMarkdown = buildFounderTestIntegrationReportMarkdown(
  buildFounderTestIntegrationReport(founderTest),
);
assert('E report includes Execution Proof Synchronization', reportMarkdown.includes('Execution Proof Synchronization'), 'yes');
assert('E report includes truth build proven', reportMarkdown.includes('| Build | true |'), 'yes');

const validatorSource = readFileSync(
  join(ROOT, 'scripts/validate-execution-proof-authority-synchronization.ts'),
  'utf8',
);
assert(
  'F no validator recursion',
  !/spawn(?:Sync)?\([^)]*validate-execution-proof-authority-synchronization/.test(validatorSource),
  'yes',
);

const orchestratorSource = readFileSync(
  join(ROOT, 'src/founder-test-integration/founder-test-integration-orchestrator.ts'),
  'utf8',
);
assert(
  'G orchestrator uses chain truth',
  orchestratorSource.includes('resolveConnectedExecutionChainTruth') &&
    orchestratorSource.includes('executionChainTruth: chainTruth'),
  'yes',
);
assert(
  'G no founder test verdict manipulation',
  !/deriveFounderTestVerdict/.test(orchestratorSource),
  'yes',
);

const arch = readFileSync(
  join(ROOT, 'architecture/EXECUTION_PROOF_AUTHORITY_SYNCHRONIZATION_REPORT.md'),
  'utf8',
);
assert('H architecture token', arch.includes(EXECUTION_PROOF_AUTHORITY_SYNCHRONIZATION_V1_PASS), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Execution Proof Authority Synchronization Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${EXECUTION_PROOF_AUTHORITY_SYNCHRONIZATION_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
