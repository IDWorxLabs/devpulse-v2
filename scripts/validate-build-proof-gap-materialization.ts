/**
 * Phase 26.71 — BUILD proof gap materialization repair validation.
 */

import { existsSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessAutonomousBuildExecutionProof,
  resetAutonomousBuildExecutionProofModuleForTests,
} from '../src/autonomous-build-execution-proof/index.js';
import {
  BUILD_PROOF_GAP_MATERIALIZATION_REPAIR_V1_PASS,
  assessConnectedBuildExecution,
  computeArtifactToFileProof,
  isPathUnderGeneratedBuilderWorkspaces,
  materializeBuildContractExpectations,
  materializeBuildProofGapArtifacts,
  resetConnectedBuildExecutionModuleForTests,
  WORKSPACE_ROOT_DIR,
} from '../src/connected-build-execution/index.js';
import {
  assessRequirementsToPlanExecutionContract,
  resetRequirementsToPlanContractModuleForTests,
} from '../src/requirements-to-plan-execution-contract/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const CRM_PROMPT =
  'Build a CRM for a small sales team with contacts, deals, tasks, login, dashboard, and admin role.';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function cleanupWorkspace(contractId: string): void {
  const workspacePath = join(ROOT, WORKSPACE_ROOT_DIR, contractId);
  if (existsSync(workspacePath)) {
    rmSync(workspacePath, { recursive: true, force: true });
  }
}

function fileNonEmpty(absPath: string): boolean {
  try {
    const stat = statSync(absPath);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
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

const REQUIRED = [
  'src/connected-build-execution/build-proof-gap-materializer.ts',
  'src/connected-build-execution/connected-build-execution-authority.ts',
  'src/connected-build-execution/connected-build-execution-types.ts',
  'scripts/validate-build-proof-gap-materialization.ts',
  'architecture/BUILD_PROOF_GAP_MATERIALIZATION_REPAIR_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const contract = getBuildReadyIdea4Contract();
assert('contract id is build-ready-idea-4', contract.contractId === 'build-ready-idea-4', contract.contractId);

cleanupWorkspace(contract.contractId);

const expectations = materializeBuildContractExpectations(contract);
const requiredUserPaths = [
  'package.json',
  'src/db/schema.ts',
  'src/auth/index.ts',
  'src/server/index.ts',
  'src/server/routes.ts',
  'src/App.tsx',
  'src/screens/index.ts',
];

for (const rel of requiredUserPaths) {
  const expected = `${WORKSPACE_ROOT_DIR}/${contract.contractId}/${rel}`.replace(/\\/g, '/');
  assert(
    `expected contract path listed: ${rel}`,
    expectations.expectedFiles.includes(expected),
    expected,
  );
}

resetConnectedBuildExecutionModuleForTests();
const before = assessConnectedBuildExecution({
  rootDir: ROOT,
  buildReadyContract: contract,
  attemptBuildProofGapMaterialization: false,
  observedEvidence: { paths: [], directories: [] },
});
assert('before repair: BUILD NOT_PROVEN', before.report.proofLevel === 'NOT_PROVEN', before.report.proofLevel);
assert(
  'before repair: missing artifacts listed',
  before.report.generatedFileEvidence.missingPaths.length > 0,
  String(before.report.generatedFileEvidence.missingPaths.length),
);

const proof = materializeBuildProofGapArtifacts({
  projectRootDir: ROOT,
  contract,
});

assert('artifact-to-file proof exists', proof.materializationAttempted, String(proof.materializationAttempted));
assert('proof workspace bounded', proof.workspacePath.startsWith(`${WORKSPACE_ROOT_DIR}/`), proof.workspacePath);
assert(
  'workspace path under generated root',
  isPathUnderGeneratedBuilderWorkspaces(ROOT, join(ROOT, proof.workspacePath)),
  proof.workspacePath,
);
assert('proof planId present', proof.planId.length > 0, proof.planId);
assert('proof buildManifestId present', proof.buildManifestId.length > 0, proof.buildManifestId);
assert(
  'missingArtifactCount zero after materialization',
  proof.missingArtifactCount === 0,
  String(proof.missingArtifactCount),
);
assert(
  'materializedFileCount meets expected',
  proof.materializedFileCount >= proof.expectedArtifactCount,
  `${proof.materializedFileCount}/${proof.expectedArtifactCount}`,
);
assert('artifact-to-file proof PROVEN', proof.proofLevel === 'PROVEN', proof.proofLevel);

for (const rel of requiredUserPaths) {
  const abs = join(ROOT, WORKSPACE_ROOT_DIR, contract.contractId, rel);
  assert(`disk file exists: ${rel}`, existsSync(abs), abs);
  assert(`disk file non-empty: ${rel}`, fileNonEmpty(abs), abs);
}

const forbiddenEnv = join(ROOT, WORKSPACE_ROOT_DIR, contract.contractId, '.env');
assert('no .env generated', !existsSync(forbiddenEnv), forbiddenEnv);

resetConnectedBuildExecutionModuleForTests();
const after = assessConnectedBuildExecution({
  rootDir: ROOT,
  buildReadyContract: contract,
});
assert('after repair: BUILD PROVEN', after.report.proofLevel === 'PROVEN', after.report.proofLevel);
assert(
  'after repair: artifact-to-file proof on report',
  after.report.artifactToFileProof?.proofLevel === 'PROVEN',
  after.report.artifactToFileProof?.proofLevel ?? 'missing',
);
assert(
  'after repair: materializationState MATERIALIZED',
  after.report.buildMaterialization.materializationState === 'MATERIALIZED',
  after.report.buildMaterialization.materializationState,
);
assert('after repair: linkage connected', after.report.linkageAnalysis.linkageConnected, String(after.report.linkageAnalysis.linkageConnected));

resetAutonomousBuildExecutionProofModuleForTests();
resetConnectedBuildExecutionModuleForTests();
resetRequirementsToPlanContractModuleForTests();

const crmForProof = assessRequirementsToPlanExecutionContract({ rawPrompt: CRM_PROMPT });
cleanupWorkspace(crmForProof.report.buildReadyContract!.contractId);

const executionProof = assessAutonomousBuildExecutionProof({
  rootDir: ROOT,
  requirementsToPlanContract: crmForProof.report,
});
const buildStage = executionProof.report.stageProofs.find((s) => s.stage === 'BUILD');
const runtimeStage = executionProof.report.stageProofs.find((s) => s.stage === 'RUNTIME');
const previewStage = executionProof.report.stageProofs.find((s) => s.stage === 'PREVIEW');
const verifyStage = executionProof.report.stageProofs.find((s) => s.stage === 'VERIFY');
const launchStage = executionProof.report.stageProofs.find((s) => s.stage === 'LAUNCH');

assert('chain BUILD PROVEN after materialization', buildStage?.proofLevel === 'PROVEN', buildStage?.proofLevel ?? 'missing');
assert(
  'first broken stage advances to RUNTIME',
  executionProof.report.firstBrokenStage === 'RUNTIME',
  String(executionProof.report.firstBrokenStage),
);
assert('RUNTIME not falsely PROVEN', runtimeStage?.proofLevel !== 'PROVEN', runtimeStage?.proofLevel ?? 'missing');
assert('PREVIEW not falsely PROVEN', previewStage?.proofLevel !== 'PROVEN', previewStage?.proofLevel ?? 'missing');
assert('VERIFY not falsely PROVEN', verifyStage?.proofLevel !== 'PROVEN', verifyStage?.proofLevel ?? 'missing');
assert('LAUNCH not falsely PROVEN', launchStage?.proofLevel !== 'PROVEN', launchStage?.proofLevel ?? 'missing');

const partialContract = crmForProof.report.buildReadyContract!;
cleanupWorkspace(partialContract.contractId);
const partialWorkspace = join(ROOT, WORKSPACE_ROOT_DIR, partialContract.contractId);
const partialExpectations = materializeBuildContractExpectations(partialContract);
materializeBuildProofGapArtifacts({ projectRootDir: ROOT, contract: partialContract });
const firstFile = partialExpectations.expectedFiles[0]!;
const relFirst = firstFile.replace(`${WORKSPACE_ROOT_DIR}/${partialContract.contractId}/`, '');
const absFirst = join(partialWorkspace, relFirst);
if (existsSync(absFirst)) {
  rmSync(absFirst);
}
const partialProof = computeArtifactToFileProof({
  contract: partialContract,
  projectRootDir: ROOT,
  materializationAttempted: true,
});
assert(
  'missing files prevent PROVEN',
  partialProof.proofLevel !== 'PROVEN',
  partialProof.proofLevel,
);
assert('partial proof has missing artifacts', partialProof.missingArtifactCount > 0, String(partialProof.missingArtifactCount));

const authoritySource = readFileSync(
  join(ROOT, 'src/connected-build-execution/connected-build-execution-authority.ts'),
  'utf8',
);
assert('authority wires gap materializer', authoritySource.includes('materializeBuildProofGapArtifacts'), 'yes');
assert('fixture path skips materialization', authoritySource.includes('observedEvidence === undefined'), 'yes');

const materializerSource = readFileSync(
  join(ROOT, 'src/connected-build-execution/build-proof-gap-materializer.ts'),
  'utf8',
);
assert('materializer blocks .env', materializerSource.includes('.env'), 'yes');
assert('materializer uses bounded workspace root', materializerSource.includes('GENERATED_BUILDER_WORKSPACES_DIR'), 'yes');

const arch = readFileSync(
  join(ROOT, 'architecture/BUILD_PROOF_GAP_MATERIALIZATION_REPAIR_REPORT.md'),
  'utf8',
);
assert('architecture pass token', arch.includes(BUILD_PROOF_GAP_MATERIALIZATION_REPAIR_V1_PASS), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- BUILD Proof Gap Materialization Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${BUILD_PROOF_GAP_MATERIALIZATION_REPAIR_V1_PASS}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
