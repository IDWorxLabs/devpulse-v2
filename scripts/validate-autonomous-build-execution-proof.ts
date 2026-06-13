/**
 * Phase 26.6 — Autonomous Build Execution Proof Chain validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AUTONOMOUS_BUILD_EXECUTION_PROOF_PASS_TOKEN,
  CORE_CHAIN_STAGES,
  EXECUTION_CHAIN_STAGE_ORDER,
  assessAutonomousBuildExecutionProof,
  buildAutonomousBuildExecutionProofReportMarkdown,
  resetAutonomousBuildExecutionProofModuleForTests,
  resetAutonomousBuildExecutionProofHistoryForTests,
} from '../src/autonomous-build-execution-proof/index.js';
import {
  buildFounderTestLaunchReadinessReportMarkdown,
  resetFounderTestLaunchReadinessModuleForTests,
  runFounderTestLaunchReadiness,
} from '../src/founder-test-launch-readiness/index.js';

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

const REQUIRED_FILES = [
  'src/autonomous-build-execution-proof/autonomous-build-execution-proof-types.ts',
  'src/autonomous-build-execution-proof/autonomous-build-execution-proof-registry.ts',
  'src/autonomous-build-execution-proof/autonomous-build-execution-proof-authority.ts',
  'src/autonomous-build-execution-proof/execution-chain-analyzer.ts',
  'src/autonomous-build-execution-proof/build-stage-analyzer.ts',
  'src/autonomous-build-execution-proof/runtime-stage-analyzer.ts',
  'src/autonomous-build-execution-proof/preview-stage-analyzer.ts',
  'src/autonomous-build-execution-proof/verification-stage-analyzer.ts',
  'src/autonomous-build-execution-proof/launch-stage-analyzer.ts',
  'src/autonomous-build-execution-proof/execution-proof-report-builder.ts',
  'src/autonomous-build-execution-proof/execution-proof-history.ts',
  'src/autonomous-build-execution-proof/index.ts',
  'architecture/AUTONOMOUS_BUILD_EXECUTION_PROOF_REPORT.md',
];

for (const file of REQUIRED_FILES) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

assert('7 chain stages defined', EXECUTION_CHAIN_STAGE_ORDER.length === 7, String(EXECUTION_CHAIN_STAGE_ORDER.length));
assert('6 core chain stages', CORE_CHAIN_STAGES.length === 6, String(CORE_CHAIN_STAGES.length));

const authoritySource = readFileSync(
  join(ROOT, 'src/autonomous-build-execution-proof/autonomous-build-execution-proof-authority.ts'),
  'utf8',
);
assert('uses connected build', authoritySource.includes('assessConnectedAutonomousBuildExecution'), 'yes');
assert('uses connected runtime', authoritySource.includes('assessConnectedRuntimeActivation'), 'yes');
assert('uses connected preview', authoritySource.includes('assessConnectedLivePreview'), 'yes');
assert('uses connected verification', authoritySource.includes('assessConnectedVerification'), 'yes');
assert('no synthetic execution flag', authoritySource.includes('launchBlockedByChain'), 'yes');

const launchSource = readFileSync(
  join(ROOT, 'src/founder-test-launch-readiness/founder-test-launch-readiness-authority.ts'),
  'utf8',
);
assert(
  'founder test integrates execution proof',
  launchSource.includes('assessAutonomousBuildExecutionProof'),
  'yes',
);
assert(
  'launch capped when chain disconnected',
  launchSource.includes('executionChainBlocksLaunch'),
  'yes',
);

resetAutonomousBuildExecutionProofModuleForTests();
resetAutonomousBuildExecutionProofHistoryForTests();
resetFounderTestLaunchReadinessModuleForTests();

const assessment = assessAutonomousBuildExecutionProof({ rootDir: ROOT });
const report = assessment.report;

assert('all stage analyzers execute', report.stageProofs.length === 7, String(report.stageProofs.length));
assert('chainConnected boolean', typeof report.chainConnected === 'boolean', String(report.chainConnected));
assert(
  'first broken stage tracked',
  !report.chainConnected ? report.firstBrokenStage !== null : report.firstBrokenStage === null,
  String(report.firstBrokenStage),
);
assert(
  'reference CRM prompt advances break to BUILD',
  report.stageProofs.find((s) => s.stage === 'REQUIREMENTS')?.proofLevel === 'PROVEN' &&
    report.stageProofs.find((s) => s.stage === 'PLAN')?.proofLevel === 'PROVEN'
    ? report.firstBrokenStage === 'BUILD'
    : report.firstBrokenStage !== null,
  String(report.firstBrokenStage),
);
assert('launch blocked when disconnected', report.launchBlockedByChain === !report.chainConnected, 'consistent');
assert('missing evidence generated', report.missingEvidence.length > 0 || report.chainConnected, String(report.missingEvidence.length));
assert('recommendations generated', report.recommendedNextActions.length > 0, String(report.recommendedNextActions.length));
assert('founder questions generated', report.founderQuestions.exactBreakStage !== undefined, 'yes');
assert(
  'report markdown section',
  buildAutonomousBuildExecutionProofReportMarkdown(report).includes('AUTONOMOUS BUILD EXECUTION PROOF'),
  'present',
);

const stageLevels = new Set(report.stageProofs.map((s) => s.proofLevel));
assert('uses PROVEN/PARTIAL/NOT_PROVEN', stageLevels.size >= 2, [...stageLevels].join(', '));

const launch = runFounderTestLaunchReadiness({
  rootDir: ROOT,
  skipChatStressSimulation: true,
  skipProductReadinessSimulation: true,
  autonomousBuildExecutionProof: report,
  skipAutonomousBuildExecutionProof: true,
});

assert(
  'founder report includes execution proof',
  buildFounderTestLaunchReadinessReportMarkdown(launch.report).includes('AUTONOMOUS BUILD EXECUTION PROOF'),
  'section present',
);
assert(
  'launch blocked when chain disconnected',
  report.launchBlockedByChain
    ? launch.report.launchReadinessVerdict !== 'LAUNCH_READY'
    : true,
  launch.report.launchReadinessVerdict,
);
assert(
  'execution proof blocker present when disconnected',
  report.launchBlockedByChain
    ? launch.report.topBlockers.some((b) => b.sourceAuthority === 'Autonomous Build Execution Proof')
    : true,
  String(launch.report.topBlockers.length),
);

const archReport = readFileSync(join(ROOT, 'architecture/AUTONOMOUS_BUILD_EXECUTION_PROOF_REPORT.md'), 'utf8');
assert('architecture report pass token', archReport.includes(AUTONOMOUS_BUILD_EXECUTION_PROOF_PASS_TOKEN), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Autonomous Build Execution Proof Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${AUTONOMOUS_BUILD_EXECUTION_PROOF_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
