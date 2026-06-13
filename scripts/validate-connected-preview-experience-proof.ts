/**
 * Phase 26.10 — Connected Preview Experience Proof validation.
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
  assessConnectedRuntimeActivationProof,
  resetConnectedRuntimeActivationProofModuleForTests,
} from '../src/connected-runtime-activation-proof/index.js';
import type { RuntimeSessionEvidence } from '../src/connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import {
  CONNECTED_PREVIEW_EXPERIENCE_PROOF_PASS_TOKEN,
  assessConnectedPreviewExperienceProof,
  buildPreviewExperienceProofReportMarkdown,
  resetConnectedPreviewExperienceProofModuleForTests,
} from '../src/connected-preview-experience-proof/index.js';
import type { PreviewSessionEvidence } from '../src/connected-preview-experience-proof/connected-preview-experience-proof-types.js';
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
  'src/connected-preview-experience-proof/connected-preview-experience-proof-types.ts',
  'src/connected-preview-experience-proof/connected-preview-experience-proof-registry.ts',
  'src/connected-preview-experience-proof/preview-session-analyzer.ts',
  'src/connected-preview-experience-proof/preview-url-analyzer.ts',
  'src/connected-preview-experience-proof/preview-render-analyzer.ts',
  'src/connected-preview-experience-proof/preview-interaction-analyzer.ts',
  'src/connected-preview-experience-proof/preview-capture-analyzer.ts',
  'src/connected-preview-experience-proof/preview-manifest-analyzer.ts',
  'src/connected-preview-experience-proof/preview-linkage-analyzer.ts',
  'src/connected-preview-experience-proof/connected-preview-experience-proof-authority.ts',
  'src/connected-preview-experience-proof/connected-preview-experience-proof-report-builder.ts',
  'architecture/CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const crmPrompt =
  'Build a CRM for a small sales team with contacts, deals, tasks, login, dashboard, and admin role.';

function getProvenRuntimeReport() {
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetConnectedRuntimeActivationProofModuleForTests();
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
    scriptName: 'dev',
    processId: '4242',
    processState: 'STARTED',
    port: 5173,
    host: 'localhost',
    url: 'http://localhost:5173',
    reachable: true,
    protocol: 'http',
    healthStatusCode: 200,
    healthResponseType: 'html',
    logLines: ['  ➜  Local:   http://localhost:5173/', 'ready in 480ms'],
  };

  const runtimeReport = assessConnectedRuntimeActivationProof({
    rootDir: ROOT,
    buildMaterializationReport: buildReport,
    workspacePath,
    runtimeSessionEvidence: runtimeSession,
  }).report;

  return { crmAssessment, materialization, buildReport, workspacePath, runtimeReport, runtimeSession };
}

function basePreviewSession(
  workspacePath: string,
  overrides: Partial<PreviewSessionEvidence> = {},
): PreviewSessionEvidence {
  return {
    previewSessionId: 'preview-session-fixture-1',
    workspaceId: workspacePath,
    runtimeSessionId: 'runtime-session-fixture-1',
    previewTimestamp: new Date().toISOString(),
    previewSource: 'founder-preview-panel',
    previewUrl: 'http://localhost:5173',
    host: 'localhost',
    port: 5173,
    protocol: 'http',
    urlReachable: true,
    ...overrides,
  };
}

function fullPreviewFixture(workspacePath: string): PreviewSessionEvidence {
  return basePreviewSession(workspacePath, {
    htmlResponse: true,
    applicationTitle: 'CRM Dashboard',
    applicationRoot: '#root',
    domSnapshot: '<div id="root"><nav>Dashboard</nav></div>',
    renderCapturePath: '.preview-captures/crm-dashboard.png',
    capturePaths: ['.preview-captures/crm-dashboard.png'],
    interactiveElements: ['nav-dashboard', 'btn-add-contact', 'form-login'],
    interactionEvidence: [
      'navigation: dashboard → contacts',
      'click: add contact button',
      'form: login email field focus',
    ],
  });
}

const { crmAssessment, materialization, buildReport, workspacePath, runtimeReport, runtimeSession } =
  getProvenRuntimeReport();

assert('fixture: RUNTIME PROVEN', runtimeReport.runtimeProofLevel === 'PROVEN', runtimeReport.runtimeProofLevel);

resetConnectedPreviewExperienceProofModuleForTests();
const noPreview = assessConnectedPreviewExperienceProof({
  rootDir: ROOT,
  runtimeActivationProof: runtimeReport,
});
assert('A no preview evidence: NOT_PROVEN', noPreview.report.previewProofLevel === 'NOT_PROVEN', noPreview.report.previewProofLevel);

resetConnectedPreviewExperienceProofModuleForTests();
const urlOnly = assessConnectedPreviewExperienceProof({
  rootDir: ROOT,
  runtimeActivationProof: runtimeReport,
  previewSessionEvidence: basePreviewSession(workspacePath),
});
assert('B URL only: PARTIAL', urlOnly.report.previewProofLevel === 'PARTIAL', urlOnly.report.previewProofLevel);
assert('B preview state URL_REACHABLE', urlOnly.report.previewState === 'URL_REACHABLE', urlOnly.report.previewState);

resetConnectedPreviewExperienceProofModuleForTests();
const renderOnly = assessConnectedPreviewExperienceProof({
  rootDir: ROOT,
  runtimeActivationProof: runtimeReport,
  previewSessionEvidence: basePreviewSession(workspacePath, {
    htmlResponse: true,
    applicationTitle: 'CRM Dashboard',
    applicationRoot: '#root',
    domSnapshot: '<div id="root"></div>',
  }),
});
assert('C render only: PARTIAL', renderOnly.report.previewProofLevel === 'PARTIAL', renderOnly.report.previewProofLevel);
assert('C preview state RENDERED', renderOnly.report.previewState === 'RENDERED', renderOnly.report.previewState);

resetConnectedPreviewExperienceProofModuleForTests();
const renderAndInteraction = assessConnectedPreviewExperienceProof({
  rootDir: ROOT,
  runtimeActivationProof: runtimeReport,
  previewSessionEvidence: fullPreviewFixture(workspacePath),
});
assert('D render + interaction: PROVEN', renderAndInteraction.report.previewProofLevel === 'PROVEN', renderAndInteraction.report.previewProofLevel);
assert('D linkage connected', renderAndInteraction.report.linkage.previewLinkageConnected, String(renderAndInteraction.report.linkage.previewLinkageConnected));

resetConnectedPreviewExperienceProofModuleForTests();
const broken = assessConnectedPreviewExperienceProof({
  rootDir: ROOT,
  runtimeActivationProof: runtimeReport,
  previewSessionEvidence: {
    ...fullPreviewFixture(workspacePath),
    urlReachable: false,
  },
});
assert(
  'E linkage break: firstBrokenPreviewLink identified',
  broken.report.linkage.firstBrokenPreviewLink !== null,
  String(broken.report.linkage.firstBrokenPreviewLink),
);

resetAutonomousBuildExecutionProofModuleForTests();
resetConnectedPreviewExperienceProofModuleForTests();
const proofAssessment = assessAutonomousBuildExecutionProof({
  rootDir: ROOT,
  requirementsToPlanContract: crmAssessment.report,
  observedBuildEvidence: {
    paths: materialization.expectedFiles,
    directories: materialization.workspaceTargets,
  },
  runtimeSessionEvidence: runtimeSession,
  previewSessionEvidence: fullPreviewFixture(workspacePath),
});
const proof = proofAssessment.report;
const previewStage = proof.stageProofs.find((s) => s.stage === 'PREVIEW');
assert(
  'F PREVIEW consumes connected-preview-experience-proof',
  previewStage?.sourceAuthority === 'connected-preview-experience-proof',
  previewStage?.sourceAuthority ?? 'missing',
);
assert('F PREVIEW PROVEN with fixture', previewStage?.proofLevel === 'PROVEN', previewStage?.proofLevel ?? 'missing');
assert(
  'F firstBrokenStage advances to VERIFY',
  proof.firstBrokenStage === 'VERIFY',
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
  skipAutonomousBuildExecutionProof: true,
  skipConnectedBuildExecution: true,
  skipConnectedRuntimeActivationProof: true,
  skipConnectedPreviewExperienceProof: true,
  skipChatStressSimulation: true,
  skipProductReadinessSimulation: true,
  skipHistoryRecording: true,
});
assert(
  'G founder test includes connected preview experience proof',
  founderTest.report.connectedPreviewExperienceProof !== null,
  founderTest.report.connectedPreviewExperienceProofSummary ?? 'missing',
);

assert(
  'report markdown',
  buildPreviewExperienceProofReportMarkdown(renderAndInteraction.report).includes('CONNECTED PREVIEW EXPERIENCE PROOF'),
  'yes',
);

const previewSource = readFileSync(
  join(ROOT, 'src/autonomous-build-execution-proof/preview-stage-analyzer.ts'),
  'utf8',
);
assert('preview stage uses experience proof authority', previewSource.includes('connected-preview-experience-proof'), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(CONNECTED_PREVIEW_EXPERIENCE_PROOF_PASS_TOKEN), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Connected Preview Experience Proof Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${CONNECTED_PREVIEW_EXPERIENCE_PROOF_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
