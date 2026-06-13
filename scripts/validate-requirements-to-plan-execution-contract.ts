/**
 * Phase 26.7 — Requirements-to-Plan Execution Contract validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessAutonomousBuildExecutionProof,
  resetAutonomousBuildExecutionProofModuleForTests,
} from '../src/autonomous-build-execution-proof/index.js';
import {
  REQUIREMENTS_TO_PLAN_EXECUTION_CONTRACT_PASS_TOKEN,
  assessRequirementsToPlanExecutionContract,
  resetRequirementsToPlanContractModuleForTests,
  buildRequirementsToPlanContractReportMarkdown,
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
  'src/requirements-to-plan-execution-contract/requirements-to-plan-contract-types.ts',
  'src/requirements-to-plan-execution-contract/requirements-to-plan-contract-registry.ts',
  'src/requirements-to-plan-execution-contract/user-idea-contract-builder.ts',
  'src/requirements-to-plan-execution-contract/requirement-contract-builder.ts',
  'src/requirements-to-plan-execution-contract/clarifying-gap-analyzer.ts',
  'src/requirements-to-plan-execution-contract/plan-contract-builder.ts',
  'src/requirements-to-plan-execution-contract/build-ready-contract-builder.ts',
  'src/requirements-to-plan-execution-contract/contract-linkage-analyzer.ts',
  'src/requirements-to-plan-execution-contract/requirements-to-plan-contract-authority.ts',
  'src/requirements-to-plan-execution-contract/requirements-to-plan-contract-report-builder.ts',
  'architecture/REQUIREMENTS_TO_PLAN_EXECUTION_CONTRACT_REPORT.md',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

resetRequirementsToPlanContractModuleForTests();

const vague = assessRequirementsToPlanExecutionContract({ rawPrompt: 'Build me an app' });
assert(
  'A vague prompt: INSUFFICIENT_INPUT or NEEDS_CLARIFICATION',
  vague.report.userIdea.status === 'INSUFFICIENT_INPUT' ||
    vague.report.clarifyingGaps.contractReadiness === 'NEEDS_CLARIFICATION',
  `${vague.report.userIdea.status} / ${vague.report.clarifyingGaps.contractReadiness}`,
);
assert('A vague prompt: not PROVEN', vague.report.proofLevel !== 'PROVEN', vague.report.proofLevel);

const crmPrompt =
  'Build a CRM for a small sales team with contacts, deals, tasks, login, dashboard, and admin role.';
const crm = assessRequirementsToPlanExecutionContract({ rawPrompt: crmPrompt });
assert(
  'B clear prompt: requirements extracted',
  (crm.report.requirementContract?.requirements.length ?? 0) >= 5,
  String(crm.report.requirementContract?.requirements.length),
);
assert(
  'B clear prompt: plan tasks generated',
  (crm.report.planContract?.tasks.length ?? 0) >= 5,
  String(crm.report.planContract?.tasks.length),
);
assert('B clear prompt: linkage connected', crm.report.linkageAnalysis.linkageConnected, String(crm.report.linkageAnalysis.linkageConnected));
assert(
  'B clear prompt: BUILD_READY or PROVEN',
  crm.report.buildReadyContract?.readinessState === 'BUILD_READY' || crm.report.proofLevel === 'PROVEN',
  `${crm.report.buildReadyContract?.readinessState} / ${crm.report.proofLevel}`,
);

const booking = assessRequirementsToPlanExecutionContract({
  rawPrompt: 'Build a booking app for salons',
});
const authQuestion = booking.report.clarifyingGaps.clarifyingQuestions.some((q) =>
  /auth|login|role|staff|customer/i.test(q),
);
assert('C booking prompt: auth/roles clarifying question', authQuestion, booking.report.clarifyingGaps.clarifyingQuestions.join(' | '));
assert(
  'C booking prompt: NEEDS_CLARIFICATION',
  booking.report.clarifyingGaps.contractReadiness === 'NEEDS_CLARIFICATION',
  booking.report.clarifyingGaps.contractReadiness,
);

const tasks = crm.report.planContract?.tasks ?? [];
assert(
  'D traceability: every plan task links to requirements',
  tasks.filter((t) => t.layer !== 'DOCUMENTATION').every((t) => t.sourceRequirementIds.length >= 1),
  String(tasks.length),
);

const units = crm.report.buildReadyContract?.buildUnits ?? [];
assert(
  'E verification: every build unit has verification requirements',
  units.length > 0 && units.every((u) => u.verificationRequirements.length >= 1),
  String(units.length),
);

resetAutonomousBuildExecutionProofModuleForTests();
const executionProof = assessAutonomousBuildExecutionProof({
  rootDir: ROOT,
  rawPrompt: crmPrompt,
});
const reqStage = executionProof.report.stageProofs.find((s) => s.stage === 'REQUIREMENTS');
const planStage = executionProof.report.stageProofs.find((s) => s.stage === 'PLAN');
assert('F REQUIREMENTS stage uses contract', reqStage?.sourceAuthority === 'requirements-to-plan-execution-contract', reqStage?.sourceAuthority ?? 'missing');
assert('F PLAN stage uses contract', planStage?.sourceAuthority === 'requirements-to-plan-execution-contract', planStage?.sourceAuthority ?? 'missing');
assert(
  'F REQUIREMENTS PROVEN for clear CRM prompt',
  reqStage?.proofLevel === 'PROVEN',
  reqStage?.proofLevel ?? 'missing',
);
assert(
  'F PLAN PROVEN for clear CRM prompt',
  planStage?.proofLevel === 'PROVEN',
  planStage?.proofLevel ?? 'missing',
);
assert(
  'F first broken stage advances to BUILD',
  executionProof.report.firstBrokenStage === 'BUILD',
  String(executionProof.report.firstBrokenStage),
);

assert(
  'report markdown generated',
  buildRequirementsToPlanContractReportMarkdown(crm.report).includes('Extracted Requirements'),
  'yes',
);

const chainSource = readFileSync(
  join(ROOT, 'src/autonomous-build-execution-proof/execution-chain-analyzer.ts'),
  'utf8',
);
assert('execution chain consumes contract authority', chainSource.includes('requirements-to-plan-execution-contract'), 'yes');

const arch = readFileSync(join(ROOT, 'architecture/REQUIREMENTS_TO_PLAN_EXECUTION_CONTRACT_REPORT.md'), 'utf8');
assert('architecture pass token', arch.includes(REQUIREMENTS_TO_PLAN_EXECUTION_CONTRACT_PASS_TOKEN), 'yes');

const failed = results.filter((r) => !r.passed);
console.log('\n--- Requirements-to-Plan Execution Contract Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${REQUIREMENTS_TO_PLAN_EXECUTION_CONTRACT_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
