/**
 * DevPulse V2 Execution Authority Foundation — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import { DevPulseV2AnswerAuthorityProtectionAuthority } from '../src/answer-authority-protection/index.js';
import { PROTECTION_OWNER_MODULE } from '../src/answer-authority-protection/types.js';
import {
  classifyExecutionRequest,
  DevPulseV2ExecutionAuthority,
  EXECUTION_OWNER_MODULE,
  EXECUTION_PASS_TOKEN,
  FUTURE_GATE_COMMAND,
  FUTURE_GATE_PROJECT_MODIFICATION,
  formatExecutionAuthorityReport,
  getLatestExecutionAuthoritySummary,
  getLastExecutionDecisionEventId,
  isAutonomousAction,
  isCommandExecution,
  isProjectModification,
  isReadOnlyOperation,
  isRecoveryAction,
  isWriteOperation,
  resetDevPulseV2ExecutionAuthorityForTests,
  validateFoundationSystemsNonExecuting,
} from '../src/execution-authority/index.js';
import { runDevPulseV2BuildGate } from '../src/foundation/build-gate.js';
import { formatFounderGateReportText } from '../src/foundation/founder-report.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import { DevPulseV2ValidationBudgetPolicyAuthority } from '../src/validation-budget/validation-budget-policy-authority.js';
import { POLICY_OWNER_MODULE } from '../src/validation-budget/types.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Execution Authority Foundation Validation');
  console.log('=======================================================');
  console.log('');

  const buildGate = runDevPulseV2BuildGate({
    phase: 6.1,
    systems: ['execution_authority'],
    eagerModuleCount: 2,
    answerAuthorities: ['devpulse_v2_chat_authority'],
    browserVerificationPresent: true,
    buildStage: 'foundation',
  });

  assert(
    '1. Build gate accepts execution_authority packet',
    buildGate.buildAllowed && buildGate.violationCount === 0,
    buildGate.summary,
  );

  if (!buildGate.buildAllowed) {
    console.log(formatFounderGateReportText(buildGate));
    failAndExit();
  }

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  const authority = resetDevPulseV2ExecutionAuthorityForTests();

  assert(
    '2. Execution Authority exists',
    authority instanceof DevPulseV2ExecutionAuthority,
    `ownerModule=${DevPulseV2ExecutionAuthority.ownerModule}`,
  );

  const owner = getDevPulseV2Owner('execution_authority');
  assert(
    '3. Ownership registry contains execution_authority',
    owner.ownerModule === EXECUTION_OWNER_MODULE &&
      DevPulseV2ExecutionAuthority.assertRegistryOwnership(),
    `registered=${owner.ownerModule}`,
  );

  assert(
    '4. classifyExecutionRequest works',
    classifyExecutionRequest('read timeline events') === 'READ_ONLY' &&
      classifyExecutionRequest('unknown request') === 'NO_EXECUTION',
    'classifier returns expected types',
  );

  assert(
    '5. READ_ONLY classification works',
    isReadOnlyOperation('read timeline events') &&
      classifyExecutionRequest('read timeline events') === 'READ_ONLY',
    'READ_ONLY',
  );

  assert(
    '6. WRITE_OPERATION classification works',
    isWriteOperation('write file') && classifyExecutionRequest('write file') === 'WRITE_OPERATION',
    'WRITE_OPERATION',
  );

  assert(
    '7. COMMAND_EXECUTION classification works',
    isCommandExecution('run npm test') &&
      classifyExecutionRequest('run npm test') === 'COMMAND_EXECUTION',
    'COMMAND_EXECUTION',
  );

  assert(
    '8. PROJECT_MODIFICATION classification works',
    isProjectModification('apply patch') &&
      classifyExecutionRequest('apply patch') === 'PROJECT_MODIFICATION',
    'PROJECT_MODIFICATION',
  );

  assert(
    '9. RECOVERY_ACTION classification works',
    isRecoveryAction('rollback to checkpoint') &&
      classifyExecutionRequest('rollback to checkpoint') === 'RECOVERY_ACTION',
    'RECOVERY_ACTION',
  );

  assert(
    '10. AUTONOMOUS_ACTION classification works',
    isAutonomousAction('continue autonomously') &&
      classifyExecutionRequest('continue autonomously') === 'AUTONOMOUS_ACTION',
    'AUTONOMOUS_ACTION',
  );

  const readDecision = authority.evaluateRequest({
    requestedBySystemId: 'test_system',
    requestText: 'read timeline events',
  });
  assert(
    '11. READ_ONLY request is allowed',
    readDecision.allowed && readDecision.classification === 'READ_ONLY',
    readDecision.reason,
  );

  const writeDecision = authority.evaluateRequest({
    requestedBySystemId: 'test_system',
    requestText: 'write file',
  });
  assert(
    '12. WRITE_OPERATION is blocked',
    !writeDecision.allowed && writeDecision.classification === 'WRITE_OPERATION',
    writeDecision.reason,
  );

  const commandDecision = authority.evaluateRequest({
    requestedBySystemId: 'test_system',
    requestText: 'run npm test',
  });
  assert(
    '13. COMMAND_EXECUTION is blocked',
    !commandDecision.allowed && commandDecision.classification === 'COMMAND_EXECUTION',
    commandDecision.reason,
  );

  const modDecision = authority.evaluateRequest({
    requestedBySystemId: 'test_system',
    requestText: 'apply patch',
  });
  assert(
    '14. PROJECT_MODIFICATION is blocked',
    !modDecision.allowed && modDecision.classification === 'PROJECT_MODIFICATION',
    modDecision.reason,
  );

  const recoveryDecision = authority.evaluateRequest({
    requestedBySystemId: 'test_system',
    requestText: 'rollback to checkpoint',
  });
  assert(
    '15. RECOVERY_ACTION is blocked',
    !recoveryDecision.allowed && recoveryDecision.classification === 'RECOVERY_ACTION',
    recoveryDecision.reason,
  );

  const autoDecision = authority.evaluateRequest({
    requestedBySystemId: 'test_system',
    requestText: 'continue autonomously',
  });
  assert(
    '16. AUTONOMOUS_ACTION is blocked',
    !autoDecision.allowed && autoDecision.classification === 'AUTONOMOUS_ACTION',
    autoDecision.reason,
  );

  assert(
    '17. Future gate is named for blocked command execution',
    commandDecision.requiredFutureGate === FUTURE_GATE_COMMAND,
    commandDecision.requiredFutureGate ?? 'missing',
  );

  assert(
    '18. Future gate is named for blocked project modification',
    modDecision.requiredFutureGate === FUTURE_GATE_PROJECT_MODIFICATION,
    modDecision.requiredFutureGate ?? 'missing',
  );

  const guardrail = validateFoundationSystemsNonExecuting();
  assert(
    '19. System guardrail confirms existing systems are non-executing',
    guardrail.length === 8 && guardrail.every((r) => r.nonExecuting),
    guardrail.map((r) => `${r.systemId}:${r.nonExecuting}`).join(', '),
  );

  const brainSummary = getLatestExecutionAuthoritySummary();
  assert(
    '20. Central Brain bridge works',
    brainSummary !== null &&
      brainSummary.decisionCount >= 6 &&
      authority.getLatestSummary() !== null,
    `decisions=${brainSummary?.decisionCount ?? 0}`,
  );

  const timelineEventId = getLastExecutionDecisionEventId();
  assert(
    '21. Timeline decision event works',
    timelineEventId !== null && authority.getLastTimelineEventId() === timelineEventId,
    timelineEventId ?? 'no event',
  );

  const reportText = formatExecutionAuthorityReport(
    authority.getAuthorityState(),
    authority.getDecisions(),
  );
  assert(
    '22. Report generated',
    reportText.includes('Execution Authority Report') &&
      authority.formatReport().includes('Recommendation:'),
    `decisions=${authority.getAuthorityState().decisionCount}`,
  );

  assert(
    '23. Execution Authority does not execute',
    DevPulseV2ExecutionAuthority.assertDoesNotExecute(),
    'no execute methods',
  );

  assert(
    '24. Execution Authority does not modify files',
    DevPulseV2ExecutionAuthority.assertDoesNotModifyFiles(),
    'no file modification methods',
  );

  assert(
    '25. Execution Authority does not run commands',
    DevPulseV2ExecutionAuthority.assertDoesNotRunCommands(),
    'no command methods',
  );

  assert(
    '26. Execution Authority does not approve itself',
    DevPulseV2ExecutionAuthority.assertDoesNotApproveItself(),
    'no self-approval methods',
  );

  assert(
    '27. Answer Authority Protection still passes',
    DevPulseV2ExecutionAuthority.assertAnswerAuthorityProtectionCompatible() &&
      DevPulseV2AnswerAuthorityProtectionAuthority.assertRegistryOwnership() &&
      getDevPulseV2Owner('answer_authority_protection_policy').ownerModule === PROTECTION_OWNER_MODULE,
    PROTECTION_OWNER_MODULE,
  );

  assert(
    '28. Validation Budget Policy still passes',
    DevPulseV2ExecutionAuthority.assertValidationBudgetCompatible() &&
      DevPulseV2ValidationBudgetPolicyAuthority.assertRegistryOwnership() &&
      getDevPulseV2Owner('validation_budget_policy').ownerModule === POLICY_OWNER_MODULE,
    POLICY_OWNER_MODULE,
  );

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), encoding: 'utf8', stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('29. Typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('=======================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(EXECUTION_PASS_TOKEN);
    console.log('');
    process.exit(0);
  }

  failAndExit();
}

function failAndExit(): never {
  console.error('EXECUTION AUTHORITY FOUNDATION VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
