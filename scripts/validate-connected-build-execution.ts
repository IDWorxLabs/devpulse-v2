/**
 * Phase 26.8 — Connected Build Execution Materialization validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessAutonomousBuildExecutionProof,
  resetAutonomousBuildExecutionProofModuleForTests,
} from '../src/autonomous-build-execution-proof/index.js';
import {
  CONNECTED_BUILD_EXECUTION_PASS_TOKEN,
  assessConnectedBuildExecution,
  materializeBuildContractExpectations,
  resetConnectedBuildExecutionModuleForTests,
  buildConnectedBuildExecutionReportMarkdown,
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

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const REQUIRED = [
  'src/connected-build-execution/connected-build-execution-types.ts',
  'src/connected-build-execution/connected-build-execution-registry.ts',
  'src/connected-build-execution/build-contract-materializer.ts',
  'src/connected-build-execution/generated-file-analyzer.ts',
  'src/connected-build-execution/build-manifest-analyzer.ts',
  'src/connected-build-execution/artifact-evidence-analyzer.ts',
  'src/connected-build-execution/workspace-materialization-analyzer.ts',
  'src/connected-build-execution/build-output-linkage-analyzer.ts',
  'src/connected-build-execution/connected-build-execution-authority.ts',
  'src/connected-build-execution/connected-build-execution-report-builder.ts',
  'architecture/CONNECTED_BUILD_EXECUTION_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const crmPrompt =
  'Build a CRM for a small sales team with contacts, deals, tasks, login, dashboard, and admin role.';

function getCrmAssessment() {
  resetRequirementsToPlanContractModuleForTests();
  return assessRequirementsToPlanExecutionContract({ rawPrompt: crmPrompt });
}

resetConnectedBuildExecutionModuleForTests();

const crmAssessment = getCrmAssessment();
const contract = crmAssessment.report.buildReadyContract!;

const empty = assessConnectedBuildExecution({
  rootDir: ROOT,
  buildReadyContract: contract,
  observedEvidence: { paths: [], directories: [] },
});
assert('A empty evidence: BUILD NOT_PROVEN', empty.report.proofLevel === 'NOT_PROVEN', empty.report.proofLevel);
assert(
  'A missing artifacts listed',
  empty.report.missingEvidence.length > 0,
  String(empty.report.missingEvidence.length),
);

const materialization = materializeBuildContractExpectations(contract);
const partialPaths = materialization.expectedFiles.slice(0, Math.ceil(materialization.expectedFiles.length / 2));

resetConnectedBuildExecutionModuleForTests();
const partial = assessConnectedBuildExecution({
  rootDir: ROOT,
  buildReadyContract: contract,
  observedEvidence: { paths: partialPaths, directories: [materialization.workspaceTargets[0]!] },
});
assert('B partial artifacts: BUILD PARTIAL', partial.report.proofLevel === 'PARTIAL', partial.report.proofLevel);

resetConnectedBuildExecutionModuleForTests();
const full = assessConnectedBuildExecution({
  rootDir: ROOT,
  buildReadyContract: contract,
  observedEvidence: {
    paths: materialization.expectedFiles,
    directories: materialization.workspaceTargets,
  },
});
assert('C fully linked fixture: BUILD PROVEN', full.report.proofLevel === 'PROVEN', full.report.proofLevel);
assert('C linkage connected', full.report.linkageAnalysis.linkageConnected, String(full.report.linkageAnalysis.linkageConnected));
assert('C materialized', full.report.buildMaterialization.materializationState === 'MATERIALIZED', full.report.buildMaterialization.materializationState);

resetConnectedBuildExecutionModuleForTests();
const broken = assessConnectedBuildExecution({
  rootDir: ROOT,
  buildReadyContract: contract,
  observedEvidence: {
    paths: materialization.expectedFiles.slice(0, 3),
    directories: materialization.workspaceTargets,
  },
});
assert(
  'D linkage break: firstBrokenLink identified',
  broken.report.linkageAnalysis.firstBrokenLink !== null,
  String(broken.report.linkageAnalysis.firstBrokenLink),
);

resetAutonomousBuildExecutionProofModuleForTests();
resetConnectedBuildExecutionModuleForTests();
const proof = assessAutonomousBuildExecutionProof({
  rootDir: ROOT,
  requirementsToPlanContract: crmAssessment.report,
  observedBuildEvidence: {
    paths: materialization.expectedFiles,
    directories: materialization.workspaceTargets,
  },
});
const buildStage = proof.report.stageProofs.find((s) => s.stage === 'BUILD');
assert(
  'E BUILD consumes connected-build-execution',
  buildStage?.sourceAuthority === 'connected-build-execution',
  buildStage?.sourceAuthority ?? 'missing',
);
assert('E BUILD PROVEN with fixture evidence', buildStage?.proofLevel === 'PROVEN', buildStage?.proofLevel ?? 'missing');
assert(
  'E firstBrokenStage advances to RUNTIME',
  proof.report.firstBrokenStage === 'RUNTIME',
  String(proof.report.firstBrokenStage),
);

assert(
  'report markdown',
  buildConnectedBuildExecutionReportMarkdown(full.report).includes('CONNECTED BUILD EXECUTION'),
  'yes',
);

const buildSource = readFileSync(
  join(ROOT, 'src/autonomous-build-execution-proof/build-stage-analyzer.ts'),
  'utf8',
);
assert('build stage uses materialization authority', buildSource.includes('connected-build-execution'), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/CONNECTED_BUILD_EXECUTION_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(CONNECTED_BUILD_EXECUTION_PASS_TOKEN), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Connected Build Execution Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${CONNECTED_BUILD_EXECUTION_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
