/**
 * Phase 26.9 — Connected Runtime Activation Proof validation.
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
  CONNECTED_RUNTIME_ACTIVATION_PROOF_PASS_TOKEN,
  assessConnectedRuntimeActivationProof,
  buildRuntimeActivationProofReportMarkdown,
  resetConnectedRuntimeActivationProofModuleForTests,
} from '../src/connected-runtime-activation-proof/index.js';
import type { RuntimeSessionEvidence } from '../src/connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
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
  'src/connected-runtime-activation-proof/connected-runtime-activation-proof-types.ts',
  'src/connected-runtime-activation-proof/connected-runtime-activation-proof-registry.ts',
  'src/connected-runtime-activation-proof/runtime-command-resolver.ts',
  'src/connected-runtime-activation-proof/runtime-process-analyzer.ts',
  'src/connected-runtime-activation-proof/runtime-port-analyzer.ts',
  'src/connected-runtime-activation-proof/runtime-health-analyzer.ts',
  'src/connected-runtime-activation-proof/runtime-log-analyzer.ts',
  'src/connected-runtime-activation-proof/runtime-manifest-analyzer.ts',
  'src/connected-runtime-activation-proof/runtime-linkage-analyzer.ts',
  'src/connected-runtime-activation-proof/connected-runtime-activation-proof-authority.ts',
  'src/connected-runtime-activation-proof/connected-runtime-activation-proof-report-builder.ts',
  'architecture/CONNECTED_RUNTIME_ACTIVATION_PROOF_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const crmPrompt =
  'Build a CRM for a small sales team with contacts, deals, tasks, login, dashboard, and admin role.';

function getCrmBuildProvenReport() {
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
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
  return { crmAssessment, contract, materialization, buildReport };
}

function workspacePathFrom(buildReport: ReturnType<typeof getCrmBuildProvenReport>['buildReport']) {
  return (
    buildReport.workspaceMaterialization.workspacePath ??
    buildReport.buildMaterialization.workspaceTargets[0] ??
    `.generated-builder-workspaces/${buildReport.buildMaterialization.contractId}`
  ).replace(/\\/g, '/');
}

function fullRuntimeFixture(workspacePath: string): RuntimeSessionEvidence {
  return {
    runtimeSessionId: 'runtime-session-fixture-1',
    command: 'npm run dev',
    workingDirectory: workspacePath,
    scriptName: 'dev',
    frameworkHint: 'VITE',
    executionObserved: false,
    processId: '4242',
    processState: 'STARTED',
    startTime: new Date().toISOString(),
    exitStatus: null,
    port: 5173,
    host: 'localhost',
    url: 'http://localhost:5173',
    reachable: true,
    protocol: 'http',
    healthStatusCode: 200,
    healthResponseType: 'html',
    responseTimeMs: 38,
    healthEndpoint: 'http://localhost:5173',
    logLines: ['  ➜  Local:   http://localhost:5173/', 'ready in 480ms'],
  };
}

const { crmAssessment, buildReport, materialization } = getCrmBuildProvenReport();
const workspacePath = workspacePathFrom(buildReport);

assert('fixture: BUILD PROVEN', buildReport.proofLevel === 'PROVEN', buildReport.proofLevel);

resetConnectedRuntimeActivationProofModuleForTests();
const noEvidence = assessConnectedRuntimeActivationProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
});
assert('A no runtime evidence: NOT_PROVEN', noEvidence.report.runtimeProofLevel === 'NOT_PROVEN', noEvidence.report.runtimeProofLevel);

resetConnectedRuntimeActivationProofModuleForTests();
const commandOnly = assessConnectedRuntimeActivationProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  workspacePath,
  runtimeSessionEvidence: {
    command: 'npm run dev',
    workingDirectory: workspacePath,
    scriptName: 'dev',
  },
});
assert('B command only: PARTIAL', commandOnly.report.runtimeProofLevel === 'PARTIAL', commandOnly.report.runtimeProofLevel);
assert(
  'B activation state COMMAND_FOUND',
  commandOnly.report.runtimeActivationState === 'COMMAND_FOUND',
  commandOnly.report.runtimeActivationState,
);

resetConnectedRuntimeActivationProofModuleForTests();
const processNoPort = assessConnectedRuntimeActivationProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  workspacePath,
  runtimeSessionEvidence: {
    runtimeSessionId: 'session-process-only',
    command: 'npm run dev',
    workingDirectory: workspacePath,
    processId: '9999',
    processState: 'STARTED',
  },
});
assert('C process no port: PARTIAL', processNoPort.report.runtimeProofLevel === 'PARTIAL', processNoPort.report.runtimeProofLevel);
assert(
  'C activation state PROCESS_STARTED',
  processNoPort.report.runtimeActivationState === 'PROCESS_STARTED',
  processNoPort.report.runtimeActivationState,
);

resetConnectedRuntimeActivationProofModuleForTests();
const portNoHealth = assessConnectedRuntimeActivationProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  workspacePath,
  runtimeSessionEvidence: {
    runtimeSessionId: 'session-port-only',
    command: 'npm run dev',
    workingDirectory: workspacePath,
    processId: '8888',
    processState: 'STARTED',
    port: 3000,
    host: 'localhost',
    url: 'http://localhost:3000',
    reachable: true,
    protocol: 'http',
  },
});
assert('D port no health: PARTIAL', portNoHealth.report.runtimeProofLevel === 'PARTIAL', portNoHealth.report.runtimeProofLevel);
assert(
  'D activation state PORT_REACHABLE',
  portNoHealth.report.runtimeActivationState === 'PORT_REACHABLE',
  portNoHealth.report.runtimeActivationState,
);

resetConnectedRuntimeActivationProofModuleForTests();
const full = assessConnectedRuntimeActivationProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  workspacePath,
  runtimeSessionEvidence: fullRuntimeFixture(workspacePath),
});
assert('E fully linked fixture: PROVEN', full.report.runtimeProofLevel === 'PROVEN', full.report.runtimeProofLevel);
assert('E linkage connected', full.report.linkage.runtimeLinkageConnected, String(full.report.linkage.runtimeLinkageConnected));

resetConnectedRuntimeActivationProofModuleForTests();
const broken = assessConnectedRuntimeActivationProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  workspacePath,
  runtimeSessionEvidence: {
    ...fullRuntimeFixture(workspacePath),
    reachable: false,
    port: 5173,
  },
});
assert(
  'F linkage break: firstBrokenRuntimeLink identified',
  broken.report.linkage.firstBrokenRuntimeLink !== null,
  String(broken.report.linkage.firstBrokenRuntimeLink),
);

resetAutonomousBuildExecutionProofModuleForTests();
resetConnectedRuntimeActivationProofModuleForTests();
const proofAssessment = assessAutonomousBuildExecutionProof({
  rootDir: ROOT,
  requirementsToPlanContract: crmAssessment.report,
  observedBuildEvidence: {
    paths: materialization.expectedFiles,
    directories: materialization.workspaceTargets,
  },
  runtimeSessionEvidence: fullRuntimeFixture(workspacePath),
});
const proof = proofAssessment.report;
const runtimeStage = proof.stageProofs.find((s) => s.stage === 'RUNTIME');
assert(
  'G RUNTIME consumes connected-runtime-activation-proof',
  runtimeStage?.sourceAuthority === 'connected-runtime-activation-proof',
  runtimeStage?.sourceAuthority ?? 'missing',
);
assert('G RUNTIME PROVEN with fixture', runtimeStage?.proofLevel === 'PROVEN', runtimeStage?.proofLevel ?? 'missing');
assert(
  'G firstBrokenStage advances to PREVIEW',
  proof.firstBrokenStage === 'PREVIEW',
  String(proof.firstBrokenStage),
);

resetFounderTestLaunchReadinessModuleForTests();
const founderTest = runFounderTestLaunchReadiness({
  rootDir: ROOT,
  founderTestAssessment: assessFounderTestIntegration({ rootDir: ROOT }),
  autonomousBuildExecutionProof: proof,
  connectedBuildExecution: proof.inputSnapshot.connectedBuildMaterialization,
  connectedRuntimeActivationProof: proof.inputSnapshot.connectedRuntimeActivationProof,
  skipAutonomousBuildExecutionProof: true,
  skipConnectedBuildExecution: true,
  skipConnectedRuntimeActivationProof: true,
  skipChatStressSimulation: true,
  skipProductReadinessSimulation: true,
  skipHistoryRecording: true,
});
assert(
  'H founder test includes connected runtime activation proof',
  founderTest.report.connectedRuntimeActivationProof !== null,
  founderTest.report.connectedRuntimeActivationProofSummary ?? 'missing',
);

assert(
  'report markdown',
  buildRuntimeActivationProofReportMarkdown(full.report).includes('CONNECTED RUNTIME ACTIVATION PROOF'),
  'yes',
);

const runtimeSource = readFileSync(
  join(ROOT, 'src/autonomous-build-execution-proof/runtime-stage-analyzer.ts'),
  'utf8',
);
assert('runtime stage uses activation proof authority', runtimeSource.includes('connected-runtime-activation-proof'), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/CONNECTED_RUNTIME_ACTIVATION_PROOF_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(CONNECTED_RUNTIME_ACTIVATION_PROOF_PASS_TOKEN), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Connected Runtime Activation Proof Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${CONNECTED_RUNTIME_ACTIVATION_PROOF_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
