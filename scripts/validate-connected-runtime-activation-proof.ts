/**
 * Phase 26.74 — Connected Runtime Activation Proof repair validation.
 */

import { existsSync, readFileSync, rmSync, statSync } from 'node:fs';
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
  WORKSPACE_ROOT_DIR,
} from '../src/connected-build-execution/index.js';
import {
  CONNECTED_RUNTIME_ACTIVATION_PROOF_REPAIR_V1_PASS,
  assessConnectedRuntimeActivationProof,
  buildRuntimeActivationProofReportMarkdown,
  resetConnectedRuntimeActivationProofModuleForTests,
} from '../src/connected-runtime-activation-proof/index.js';
import {
  assessConnectedPreviewExperienceProof,
  resetConnectedPreviewExperienceProofModuleForTests,
} from '../src/connected-preview-experience-proof/index.js';
import type { RuntimeSessionEvidence } from '../src/connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import {
  assessRequirementsToPlanExecutionContract,
  resetRequirementsToPlanContractModuleForTests,
} from '../src/requirements-to-plan-execution-contract/index.js';
import { assessFounderTestIntegration } from '../src/founder-test-integration/index.js';
import { resolveExecutionChainStageContext } from '../src/founder-test-integration/connected-execution-chain-stage-resolver.js';

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
  'src/connected-runtime-activation-proof/runtime-proof-gap-activator.ts',
  'src/connected-runtime-activation-proof/runtime-proof-gap-probe.mjs',
  'src/connected-runtime-activation-proof/connected-runtime-activation-proof-authority.ts',
  'src/connected-build-execution/build-proof-gap-materializer.ts',
  'src/founder-test-integration/connected-execution-chain-stage-resolver.ts',
  'scripts/validate-connected-runtime-activation-proof.ts',
  'architecture/CONNECTED_RUNTIME_ACTIVATION_PROOF_REPAIR_REPORT.md',
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

function fileNonEmpty(absPath: string): boolean {
  try {
    const stat = statSync(absPath);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

function fullRuntimeFixture(workspacePath: string): RuntimeSessionEvidence {
  return {
    runtimeSessionId: 'runtime-session-fixture-1',
    command: 'npm run dev',
    workingDirectory: workspacePath,
    scriptName: 'dev',
    frameworkHint: 'NODE',
    executionObserved: true,
    processId: '4242',
    processState: 'STARTED',
    startTime: new Date().toISOString(),
    exitStatus: null,
    port: 4173,
    host: '127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reachable: true,
    protocol: 'http',
    healthStatusCode: 200,
    healthResponseType: 'json',
    responseTimeMs: 38,
    healthEndpoint: 'http://127.0.0.1:4173',
    logLines: ['{"ready":true,"port":4173}'],
  };
}

const contract = getBuildReadyIdea4Contract();
cleanupWorkspace(contract.contractId);

resetConnectedBuildExecutionModuleForTests();
const buildAssessment = assessConnectedBuildExecution({
  rootDir: ROOT,
  buildReadyContract: contract,
});
const buildReport = buildAssessment.report;
assert('A BUILD materialization PROVEN', buildReport.proofLevel === 'PROVEN', buildReport.proofLevel);

const workspacePath = (
  buildReport.workspaceMaterialization.workspacePath ??
  `${WORKSPACE_ROOT_DIR}/${contract.contractId}`
).replace(/\\/g, '/');

const pkgPath = join(ROOT, workspacePath, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { scripts?: Record<string, string> };
assert('A package.json has dev script', Boolean(pkg.scripts?.dev), pkg.scripts?.dev ?? 'missing');
assert('A package.json has start script', Boolean(pkg.scripts?.start), pkg.scripts?.start ?? 'missing');
assert(
  'A runtime dev-server materialized',
  fileNonEmpty(join(ROOT, workspacePath, 'runtime/dev-server.mjs')),
  join(ROOT, workspacePath, 'runtime/dev-server.mjs'),
);

resetConnectedRuntimeActivationProofModuleForTests();
const noScriptWorkspace = assessConnectedRuntimeActivationProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  skipRuntimeProofGapActivation: true,
  workspacePath: '.generated-builder-workspaces/missing-workspace',
  runtimeSessionEvidence: { command: 'npm run dev' },
});
assert(
  'B fixture without process: PARTIAL',
  noScriptWorkspace.report.runtimeProofLevel === 'PARTIAL',
  noScriptWorkspace.report.runtimeProofLevel,
);

resetConnectedRuntimeActivationProofModuleForTests();
const liveRuntime = assessConnectedRuntimeActivationProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  workspacePath,
});
assert('C live activation: runtime command evidence', liveRuntime.report.command.runtimeCommandFound, liveRuntime.report.command.command ?? 'none');
assert(
  'C live activation: package.json inspected',
  liveRuntime.report.activationEvidence?.packageJsonDetected === true,
  String(liveRuntime.report.activationEvidence?.packageJsonDetected),
);
assert(
  'C live activation: script detected',
  liveRuntime.report.activationEvidence?.scriptDetected === true,
  String(liveRuntime.report.activationEvidence?.scriptDetected),
);
assert(
  'C live activation: process observed',
  liveRuntime.report.process.processState === 'STARTED',
  liveRuntime.report.process.processState,
);
assert(
  'C live activation: port reachable',
  liveRuntime.report.port.reachable,
  String(liveRuntime.report.port.reachable),
);
assert(
  'C live activation: health verified',
  liveRuntime.report.health.healthState === 'HEALTHY' || liveRuntime.report.health.healthState === 'PARTIAL',
  liveRuntime.report.health.healthState,
);
assert('C live activation: RUNTIME PROVEN', liveRuntime.report.runtimeProofLevel === 'PROVEN', liveRuntime.report.runtimeProofLevel);
assert('C live activation: linkage connected', liveRuntime.report.linkage.runtimeLinkageConnected, String(liveRuntime.report.linkage.runtimeLinkageConnected));
assert(
  'C activation evidence proof level PROVEN',
  liveRuntime.report.activationEvidence?.proofLevel === 'PROVEN',
  liveRuntime.report.activationEvidence?.proofLevel ?? 'missing',
);

resetConnectedRuntimeActivationProofModuleForTests();
const broken = assessConnectedRuntimeActivationProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  workspacePath,
  skipRuntimeProofGapActivation: true,
  runtimeSessionEvidence: {
    ...fullRuntimeFixture(workspacePath),
    reachable: false,
    port: 4173,
  },
});
assert(
  'D broken port reports firstBrokenRuntimeLink',
  broken.report.linkage.firstBrokenRuntimeLink === 'process→port' ||
    broken.report.linkage.firstBrokenRuntimeLink === 'port→health',
  String(broken.report.linkage.firstBrokenRuntimeLink),
);

resetAutonomousBuildExecutionProofModuleForTests();
resetConnectedRuntimeActivationProofModuleForTests();
resetConnectedPreviewExperienceProofModuleForTests();
const previewNotProven = assessConnectedPreviewExperienceProof({
  rootDir: ROOT,
  runtimeActivationProof: liveRuntime.report,
  skipPreviewProofGapActivation: true,
}).report;
const proofAssessment = assessAutonomousBuildExecutionProof({
  rootDir: ROOT,
  connectedBuildMaterialization: buildReport,
  connectedPreviewExperienceProof: previewNotProven,
});
const proof = proofAssessment.report;
const buildStage = proof.stageProofs.find((s) => s.stage === 'BUILD');
const runtimeStage = proof.stageProofs.find((s) => s.stage === 'RUNTIME');
const previewStage = proof.stageProofs.find((s) => s.stage === 'PREVIEW');
const verifyStage = proof.stageProofs.find((s) => s.stage === 'VERIFY');
const launchStage = proof.stageProofs.find((s) => s.stage === 'LAUNCH');

assert('E BUILD remains PROVEN', buildStage?.proofLevel === 'PROVEN', buildStage?.proofLevel ?? 'missing');
assert(
  'E RUNTIME consumes connected-runtime-activation-proof',
  runtimeStage?.sourceAuthority === 'connected-runtime-activation-proof',
  runtimeStage?.sourceAuthority ?? 'missing',
);
assert('E RUNTIME PROVEN with live activation', runtimeStage?.proofLevel === 'PROVEN', runtimeStage?.proofLevel ?? 'missing');
assert('E firstBrokenStage advances to PREVIEW', proof.firstBrokenStage === 'PREVIEW', String(proof.firstBrokenStage));
assert('E PREVIEW not falsely PROVEN', previewStage?.proofLevel !== 'PROVEN', previewStage?.proofLevel ?? 'missing');
assert('E VERIFY not falsely PROVEN', verifyStage?.proofLevel !== 'PROVEN', verifyStage?.proofLevel ?? 'missing');
assert('E LAUNCH not falsely PROVEN', launchStage?.proofLevel !== 'PROVEN', launchStage?.proofLevel ?? 'missing');

const chainContext = resolveExecutionChainStageContext(ROOT);
assert('F builder materialization connected', chainContext.builderMaterializationConnected, String(chainContext.builderMaterializationConnected));
assert(
  'F first broken stage PREVIEW or VERIFY',
  chainContext.firstBrokenStage === 'PREVIEW' || chainContext.firstBrokenStage === 'VERIFY',
  String(chainContext.firstBrokenStage),
);

const founderTest = assessFounderTestIntegration({ rootDir: ROOT });
const requirementReality = founderTest.run.authorityResults.find((r) => r.authorityId === 'REQUIREMENT_REALITY');
const blockersJoined = (requirementReality?.blockers ?? []).join(' ').toLowerCase();
assert(
  'G stale BUILD blockers removed from requirement reality',
  !blockersJoined.includes('execution is not connected to real build output') &&
    !blockersJoined.includes('build blocked'),
  blockersJoined.slice(0, 120) || 'none',
);

assert(
  'report markdown includes Runtime Activation Proof',
  buildRuntimeActivationProofReportMarkdown(liveRuntime.report).includes('Runtime Activation Proof'),
  'yes',
);

const arch = readFileSync(
  join(ROOT, 'architecture/CONNECTED_RUNTIME_ACTIVATION_PROOF_REPAIR_REPORT.md'),
  'utf8',
);
assert('architecture repair token', arch.includes(CONNECTED_RUNTIME_ACTIVATION_PROOF_REPAIR_V1_PASS), 'yes');

const validatorSource = readFileSync(join(ROOT, 'scripts/validate-connected-runtime-activation-proof.ts'), 'utf8');
assert(
  'no validator recursion',
  !/spawn(?:Sync)?\([^)]*validate-connected-runtime-activation-proof/.test(validatorSource),
  'yes',
);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Connected Runtime Activation Proof Repair Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${CONNECTED_RUNTIME_ACTIVATION_PROOF_REPAIR_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
