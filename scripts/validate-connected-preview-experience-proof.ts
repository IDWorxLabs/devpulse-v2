/**
 * Phase 26.75 — Connected Preview Experience Proof repair validation.
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
  resetConnectedBuildExecutionModuleForTests,
  WORKSPACE_ROOT_DIR,
} from '../src/connected-build-execution/index.js';
import {
  assessConnectedRuntimeActivationProof,
  resetConnectedRuntimeActivationProofModuleForTests,
} from '../src/connected-runtime-activation-proof/index.js';
import {
  CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPAIR_V1_PASS,
  assessConnectedPreviewExperienceProof,
  buildPreviewExperienceProofReportMarkdown,
  resetConnectedPreviewExperienceProofModuleForTests,
} from '../src/connected-preview-experience-proof/index.js';
import type { PreviewSessionEvidence } from '../src/connected-preview-experience-proof/connected-preview-experience-proof-types.js';
import {
  assessConnectedVerificationExecutionProof,
  resetConnectedVerificationExecutionProofModuleForTests,
} from '../src/connected-verification-execution-proof/index.js';
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
  'src/connected-preview-experience-proof/preview-proof-gap-activator.ts',
  'src/connected-preview-experience-proof/preview-proof-gap-probe.mjs',
  'src/connected-preview-experience-proof/connected-preview-experience-proof-authority.ts',
  'src/founder-test-integration/connected-execution-chain-stage-resolver.ts',
  'scripts/validate-connected-preview-experience-proof.ts',
  'architecture/CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPAIR_REPORT.md',
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

function fullPreviewFixture(previewUrl: string): PreviewSessionEvidence {
  return {
    previewSessionId: 'preview-fixture-1',
    workspaceId: 'build-ready-idea-4',
    previewUrl,
    host: '127.0.0.1',
    port: 4173,
    protocol: 'http',
    urlReachable: true,
    urlChecked: true,
    httpStatus: 200,
    responseCode: 200,
    responseLength: 48,
    contentType: 'application/json',
    renderEvidenceType: 'JSON_INDEX_RESPONSE',
    renderObserved: true,
    htmlResponse: true,
    applicationTitle: 'Workspace build-ready-idea-4',
    applicationRoot: '/',
  };
}

const contract = getBuildReadyIdea4Contract();
cleanupWorkspace(contract.contractId);

resetConnectedBuildExecutionModuleForTests();
const buildReport = assessConnectedBuildExecution({
  rootDir: ROOT,
  buildReadyContract: contract,
}).report;
assert('A BUILD PROVEN', buildReport.proofLevel === 'PROVEN', buildReport.proofLevel);

resetConnectedRuntimeActivationProofModuleForTests();
const runtimeReport = assessConnectedRuntimeActivationProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
}).report;
assert('A RUNTIME PROVEN', runtimeReport.runtimeProofLevel === 'PROVEN', runtimeReport.runtimeProofLevel);

resetConnectedPreviewExperienceProofModuleForTests();
const noPreview = assessConnectedPreviewExperienceProof({
  rootDir: ROOT,
  runtimeActivationProof: { ...runtimeReport, runtimeProofLevel: 'NOT_PROVEN' },
});
assert('B requires runtime PROVEN', noPreview.report.previewProofLevel === 'NOT_PROVEN', noPreview.report.previewProofLevel);

resetConnectedPreviewExperienceProofModuleForTests();
const urlOnly = assessConnectedPreviewExperienceProof({
  rootDir: ROOT,
  runtimeActivationProof: runtimeReport,
  skipPreviewProofGapActivation: true,
  previewSessionEvidence: {
    previewUrl: 'http://127.0.0.1:9999',
    urlReachable: false,
    workspaceId: contract.contractId,
  },
});
assert('C unreachable URL: PARTIAL', urlOnly.report.previewProofLevel === 'PARTIAL', urlOnly.report.previewProofLevel);

resetConnectedPreviewExperienceProofModuleForTests();
const livePreview = assessConnectedPreviewExperienceProof({
  rootDir: ROOT,
  runtimeActivationProof: runtimeReport,
});
assert('D preview URL evidence', livePreview.report.url.previewUrl !== null, livePreview.report.url.previewUrl ?? 'none');
assert('D reachability evidence', livePreview.report.url.urlReachable, String(livePreview.report.url.urlReachable));
assert('D render evidence', livePreview.report.render.applicationRendered, String(livePreview.report.render.applicationRendered));
assert('D PREVIEW PROVEN', livePreview.report.previewProofLevel === 'PROVEN', livePreview.report.previewProofLevel);
assert('D linkage connected', livePreview.report.linkage.previewLinkageConnected, String(livePreview.report.linkage.previewLinkageConnected));
assert(
  'D activation evidence PROVEN',
  livePreview.report.activationEvidence?.proofLevel === 'PROVEN',
  livePreview.report.activationEvidence?.proofLevel ?? 'missing',
);

resetConnectedPreviewExperienceProofModuleForTests();
const broken = assessConnectedPreviewExperienceProof({
  rootDir: ROOT,
  runtimeActivationProof: runtimeReport,
  skipPreviewProofGapActivation: true,
  previewSessionEvidence: {
    ...fullPreviewFixture('http://127.0.0.1:9999'),
    urlReachable: false,
  },
});
assert(
  'E broken link reported',
  broken.report.linkage.firstBrokenPreviewLink === 'url→reachable',
  String(broken.report.linkage.firstBrokenPreviewLink),
);

resetAutonomousBuildExecutionProofModuleForTests();
resetConnectedPreviewExperienceProofModuleForTests();
resetConnectedVerificationExecutionProofModuleForTests();
const notProvenVerify = assessConnectedVerificationExecutionProof({
  rootDir: ROOT,
  previewExperienceProof: livePreview.report,
  skipVerificationProofGapActivation: true,
}).report;
const proofAssessment = assessAutonomousBuildExecutionProof({
  rootDir: ROOT,
  connectedBuildMaterialization: buildReport,
  connectedVerificationExecutionProof: notProvenVerify,
});
const proof = proofAssessment.report;
const buildStage = proof.stageProofs.find((s) => s.stage === 'BUILD');
const runtimeStage = proof.stageProofs.find((s) => s.stage === 'RUNTIME');
const previewStage = proof.stageProofs.find((s) => s.stage === 'PREVIEW');
const verifyStage = proof.stageProofs.find((s) => s.stage === 'VERIFY');
const launchStage = proof.stageProofs.find((s) => s.stage === 'LAUNCH');

assert('F BUILD intact', buildStage?.proofLevel === 'PROVEN', buildStage?.proofLevel ?? 'missing');
assert('F RUNTIME intact', runtimeStage?.proofLevel === 'PROVEN', runtimeStage?.proofLevel ?? 'missing');
assert('F PREVIEW PROVEN live', previewStage?.proofLevel === 'PROVEN', previewStage?.proofLevel ?? 'missing');
assert('F firstBrokenStage VERIFY', proof.firstBrokenStage === 'VERIFY', String(proof.firstBrokenStage));
assert('F VERIFY not falsely PROVEN', verifyStage?.proofLevel !== 'PROVEN', verifyStage?.proofLevel ?? 'missing');
assert('F LAUNCH not falsely PROVEN', launchStage?.proofLevel !== 'PROVEN', launchStage?.proofLevel ?? 'missing');

const chainContext = resolveExecutionChainStageContext(ROOT, {
  skipVerificationProofGapActivation: true,
  verificationExecutionProof: notProvenVerify,
});
assert('G preview experience connected', chainContext.previewExperienceConnected, String(chainContext.previewExperienceConnected));
assert('G first broken VERIFY', chainContext.firstBrokenStage === 'VERIFY', chainContext.firstBrokenStage);

const founderTest = assessFounderTestIntegration({ rootDir: ROOT });
const livePreviewAuthority = founderTest.run.authorityResults.find((r) => r.authorityId === 'LIVE_PREVIEW_REALITY');
const previewBlockers = (livePreviewAuthority?.blockers ?? []).join(' ').toLowerCase();
assert(
  'H stale preview blockers reduced',
  !previewBlockers.includes('builder execution is not connected'),
  previewBlockers.slice(0, 120) || 'none',
);

assert(
  'report markdown includes Preview Experience Proof',
  buildPreviewExperienceProofReportMarkdown(livePreview.report).includes('Preview Experience Proof'),
  'yes',
);

const arch = readFileSync(
  join(ROOT, 'architecture/CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPAIR_REPORT.md'),
  'utf8',
);
assert('architecture repair token', arch.includes(CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPAIR_V1_PASS), 'yes');

const validatorSource = readFileSync(join(ROOT, 'scripts/validate-connected-preview-experience-proof.ts'), 'utf8');
assert(
  'no validator recursion',
  !/spawn(?:Sync)?\([^)]*validate-connected-preview-experience-proof/.test(validatorSource),
  'yes',
);

const failed = results.filter((r) => !r.passed);
console.log('\n--- Connected Preview Experience Proof Repair Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${CONNECTED_PREVIEW_EXPERIENCE_PROOF_REPAIR_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
