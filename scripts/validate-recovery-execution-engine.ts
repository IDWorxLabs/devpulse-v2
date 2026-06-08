/**
 * DevPulse V2 Recovery Execution Engine — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import {
  createReadOnlyPackage,
  resetDevPulseV2ExecutionPackageRuntimeForTests,
} from '../src/execution-runtime/index.js';
import type { RuntimeRecord } from '../src/execution-runtime/types.js';
import {
  resetDevPulseV2ExecutionVerificationLoopForTests,
  verifyRuntimeRecord,
} from '../src/execution-verification/index.js';
import type { ExecutionVerificationResult } from '../src/execution-verification/types.js';
import {
  DevPulseV2RecoveryExecutionEngine,
  formatRecoveryExecutionReport,
  GATE_EXECUTION_COMMAND,
  GATE_FOUNDER_APPROVAL,
  GATE_RECOVERY_EXECUTION,
  GATE_WORLD2_AUTONOMY,
  RECOVERY_EXECUTION_OWNER_MODULE,
  RECOVERY_EXECUTION_PASS_TOKEN,
  recoveryStateIncludes,
  resetDevPulseV2RecoveryExecutionEngineForTests,
} from '../src/recovery-execution/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function cloneRecord(record: RuntimeRecord): RuntimeRecord {
  return {
    ...record,
    stateSequence: [...record.stateSequence],
    warnings: [...record.warnings],
    errors: [...record.errors],
    package: { ...record.package, metadata: { ...record.package.metadata } },
    runtimeDecision: { ...record.runtimeDecision },
    authorityDecision: record.authorityDecision
      ? {
          ...record.authorityDecision,
          warnings: [...record.authorityDecision.warnings],
          errors: [...record.authorityDecision.errors],
        }
      : null,
  };
}

function blockedPackage(
  packageId: string,
  requestText: string,
  requestedAction: string,
  flags: Parameters<typeof createReadOnlyPackage>[0],
) {
  return createReadOnlyPackage({
    packageId,
    requestText,
    requestedAction,
    executionIntent: requestedAction,
    metadata: { source: 'recovery-test' },
    requiresWrite: false,
    requiresCommand: false,
    requiresRecovery: false,
    requiresAutonomy: false,
    ...flags,
  });
}

function makeFailedVerification(
  base: ExecutionVerificationResult,
  overrides: Partial<ExecutionVerificationResult>,
): ExecutionVerificationResult {
  return { ...base, ...overrides, failures: overrides.failures ?? base.failures };
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Recovery Execution Engine Validation');
  console.log('==================================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  const runtime = resetDevPulseV2ExecutionPackageRuntimeForTests();
  const verificationLoop = resetDevPulseV2ExecutionVerificationLoopForTests();
  const engine = resetDevPulseV2RecoveryExecutionEngineForTests();

  runtime.processPackage(
    createReadOnlyPackage({ packageId: 'rec-read', metadata: { source: 'test' } }),
  );
  runtime.processPackage(
    blockedPackage('rec-cmd', 'run npm test', 'run', { requiresCommand: true }),
  );
  runtime.processPackage(
    blockedPackage('rec-write', 'write file', 'write', { requiresWrite: true }),
  );
  runtime.processPackage(
    blockedPackage('rec-mod', 'apply patch', 'apply', { requiresWrite: true }),
  );
  runtime.processPackage(
    blockedPackage('rec-recovery', 'rollback to checkpoint', 'rollback', {
      requiresRecovery: true,
    }),
  );
  runtime.processPackage(
    blockedPackage('rec-auto', 'continue autonomously', 'autonomous', {
      requiresAutonomy: true,
    }),
  );

  const trustedRead = verificationLoop.verifyPackage('rec-read');
  const trustedCmd = verificationLoop.verifyPackage('rec-cmd');
  const trustedWrite = verificationLoop.verifyPackage('rec-write');
  const trustedMod = verificationLoop.verifyPackage('rec-mod');
  const trustedRecovery = verificationLoop.verifyPackage('rec-recovery');
  const trustedAuto = verificationLoop.verifyPackage('rec-auto');

  const sparseRecord = runtime.processPackage(
    createReadOnlyPackage({ packageId: 'rec-sparse', metadata: {} }),
  );
  const warningVerification = verificationLoop.verifyRecord(sparseRecord, 'rec-sparse');
  const missingVerification = verificationLoop.verifyPackage('rec-missing');

  const readOnlyRuntime = runtime.getRecord('rec-read')!;
  const cmdRuntime = runtime.getRecord('rec-cmd')!;

  const failedAcceptedCmd = verifyRuntimeRecord(
    (() => {
      const r = cloneRecord(cmdRuntime);
      r.runtimeDecision = { ...r.runtimeDecision, accepted: true, finalState: 'ACCEPTED_READ_ONLY' };
      return r;
    })(),
    'rec-bad-cmd',
  );
  const failedAcceptedWrite = verifyRuntimeRecord(
    (() => {
      const r = cloneRecord(runtime.getRecord('rec-write')!);
      r.runtimeDecision = { ...r.runtimeDecision, accepted: true, finalState: 'ACCEPTED_READ_ONLY' };
      return r;
    })(),
    'rec-bad-write',
  );
  const failedAcceptedRecovery = verifyRuntimeRecord(
    (() => {
      const r = cloneRecord(runtime.getRecord('rec-recovery')!);
      r.runtimeDecision = { ...r.runtimeDecision, accepted: true, finalState: 'ACCEPTED_READ_ONLY' };
      return r;
    })(),
    'rec-bad-recovery',
  );
  const failedWrongCmdGate = verifyRuntimeRecord(
    (() => {
      const r = cloneRecord(cmdRuntime);
      r.runtimeDecision = { ...r.runtimeDecision, futureGateRequired: 'wrong_gate' };
      return r;
    })(),
    'rec-wrong-cmd-gate',
  );
  const failedWrongWriteGate = verifyRuntimeRecord(
    (() => {
      const r = cloneRecord(runtime.getRecord('rec-write')!);
      r.runtimeDecision = { ...r.runtimeDecision, futureGateRequired: GATE_EXECUTION_COMMAND };
      return r;
    })(),
    'rec-wrong-write-gate',
  );
  const failedNoExec = verifyRuntimeRecord(
    (() => {
      const r = cloneRecord(readOnlyRuntime);
      r.runtimeDecision = { ...r.runtimeDecision, noExecutionConfirmed: false };
      return r;
    })(),
    'rec-no-exec',
  );

  const planTrusted = engine.planRecovery(trustedRead);
  assert(
    '1. TRUSTED read-only verification produces NO_RECOVERY_REQUIRED',
    planTrusted.plan.recoveryNeed === 'NO_RECOVERY_REQUIRED',
    planTrusted.plan.recoveryNeed,
  );

  const planWarning = engine.planRecovery(warningVerification);
  assert(
    '2. WARNING verification produces WARNING_MONITOR_ONLY',
    planWarning.plan.recoveryNeed === 'WARNING_MONITOR_ONLY',
    planWarning.plan.recoveryNeed,
  );

  const planMissing = engine.planRecovery(missingVerification);
  assert(
    '3. FAILED missing runtime record produces MANUAL_INVESTIGATION_REQUIRED',
    planMissing.plan.strategy === 'MANUAL_INVESTIGATION_REQUIRED',
    planMissing.plan.strategy,
  );

  const planBadCmd = engine.planRecovery(failedAcceptedCmd);
  assert(
    '4. FAILED accepted command produces FOUNDER_REVIEW_REQUIRED',
    planBadCmd.plan.strategy === 'FOUNDER_REVIEW_REQUIRED',
    planBadCmd.plan.strategy,
  );

  const planBadWrite = engine.planRecovery(failedAcceptedWrite);
  assert(
    '5. FAILED accepted write produces FOUNDER_REVIEW_REQUIRED',
    planBadWrite.plan.strategy === 'FOUNDER_REVIEW_REQUIRED',
    planBadWrite.plan.strategy,
  );

  const planBadRecovery = engine.planRecovery(failedAcceptedRecovery);
  assert(
    '6. FAILED accepted recovery produces FOUNDER_REVIEW_REQUIRED',
    planBadRecovery.plan.strategy === 'FOUNDER_REVIEW_REQUIRED',
    planBadRecovery.plan.strategy,
  );

  const planWrongCmd = engine.planRecovery(failedWrongCmdGate);
  assert(
    '7. FAILED wrong command gate produces FOUNDER_REVIEW_REQUIRED',
    planWrongCmd.plan.strategy === 'FOUNDER_REVIEW_REQUIRED',
    planWrongCmd.plan.strategy,
  );

  const planWrongWrite = engine.planRecovery(failedWrongWriteGate);
  assert(
    '8. FAILED wrong write gate produces FOUNDER_REVIEW_REQUIRED',
    planWrongWrite.plan.strategy === 'FOUNDER_REVIEW_REQUIRED',
    planWrongWrite.plan.strategy,
  );

  const planNoExec = engine.planRecovery(failedNoExec);
  assert(
    '9. FAILED missing no-execution confirmation produces FOUNDER_REVIEW_REQUIRED',
    planNoExec.plan.strategy === 'FOUNDER_REVIEW_REQUIRED',
    planNoExec.plan.strategy,
  );

  const planBlockedCmd = engine.planRecovery(trustedCmd);
  assert(
    '10. blocked command maps to execution_command_gate',
    planBlockedCmd.plan.requiredGate === GATE_EXECUTION_COMMAND,
    planBlockedCmd.plan.requiredGate ?? 'missing',
  );

  const planBlockedWrite = engine.planRecovery(trustedWrite);
  assert(
    '11. blocked write maps to founder_approval_execution_gate',
    planBlockedWrite.plan.requiredGate === GATE_FOUNDER_APPROVAL,
    planBlockedWrite.plan.requiredGate ?? 'missing',
  );

  const planBlockedMod = engine.planRecovery(trustedMod);
  assert(
    '12. blocked project modification maps to founder_approval_execution_gate',
    planBlockedMod.plan.requiredGate === GATE_FOUNDER_APPROVAL,
    planBlockedMod.plan.requiredGate ?? 'missing',
  );

  const planBlockedRecovery = engine.planRecovery(trustedRecovery);
  assert(
    '13. blocked recovery maps to recovery_execution_gate',
    planBlockedRecovery.plan.requiredGate === GATE_RECOVERY_EXECUTION,
    planBlockedRecovery.plan.requiredGate ?? 'missing',
  );

  const planBlockedAuto = engine.planRecovery(trustedAuto);
  assert(
    '14. blocked autonomy maps to world2_isolation_or_autonomy_gate',
    planBlockedAuto.plan.requiredGate === GATE_WORLD2_AUTONOMY,
    planBlockedAuto.plan.requiredGate ?? 'missing',
  );

  assert(
    '15. trusted result has retryAllowed false',
    planTrusted.plan.retryAllowed === false,
    String(planTrusted.plan.retryAllowed),
  );

  assert(
    '16. warning result has retryAllowed false',
    planWarning.plan.retryAllowed === false,
    String(planWarning.plan.retryAllowed),
  );

  assert(
    '17. failed result can create recovery plan',
    planMissing.plan.recoveryNeed === 'FAILED_NEEDS_RECOVERY_PLAN' &&
      planMissing.plan.recoveryPlanId.length > 0,
    planMissing.plan.recoveryPlanId,
  );

  const rollbackVerification = makeFailedVerification(trustedRecovery, {
    verdict: 'FAILED',
    failures: ['Recovery path requires rollback planning'],
  });
  const planRollback = engine.planRecovery(rollbackVerification);
  assert(
    '18. rollback strategy requires rollbackRequired true',
    planRollback.plan.strategy === 'ROLLBACK_AND_RETRY_AFTER_GATE' &&
      planRollback.plan.rollbackRequired === true,
    `${planRollback.plan.strategy} rollback=${planRollback.plan.rollbackRequired}`,
  );

  assert(
    '19. founder review strategy requires founderApprovalRequired true',
    planBadCmd.plan.founderApprovalRequired === true,
    String(planBadCmd.plan.founderApprovalRequired),
  );

  const world2Verification = makeFailedVerification(trustedAuto, {
    verdict: 'FAILED',
    failures: ['Autonomy boundary violation'],
  });
  const planWorld2 = engine.planRecovery(world2Verification);
  assert(
    '20. world2 isolation strategy requires founderApprovalRequired true',
    planWorld2.plan.strategy === 'WORLD2_ISOLATION_REQUIRED' &&
      planWorld2.plan.founderApprovalRequired === true,
    planWorld2.plan.strategy,
  );

  assert(
    '21. no recovery strategy requires no gate',
    planTrusted.plan.strategy === 'NONE' && planTrusted.plan.requiredGate === undefined,
    String(planTrusted.plan.requiredGate),
  );

  assert(
    '22. state sequence includes RECOVERY_INPUT_RECEIVED',
    recoveryStateIncludes(planTrusted.stateSequence, 'RECOVERY_INPUT_RECEIVED'),
    planTrusted.stateSequence.join(' → '),
  );

  assert(
    '23. state sequence includes VERIFICATION_RESULT_READ',
    recoveryStateIncludes(planTrusted.stateSequence, 'VERIFICATION_RESULT_READ'),
    planTrusted.stateSequence.join(' → '),
  );

  assert(
    '24. state sequence includes RECOVERY_NEED_CLASSIFIED',
    recoveryStateIncludes(planTrusted.stateSequence, 'RECOVERY_NEED_CLASSIFIED'),
    planTrusted.stateSequence.join(' → '),
  );

  assert(
    '25. state sequence includes RECOVERY_STRATEGY_SELECTED',
    recoveryStateIncludes(planTrusted.stateSequence, 'RECOVERY_STRATEGY_SELECTED'),
    planTrusted.stateSequence.join(' → '),
  );

  assert(
    '26. state sequence includes RECOVERY_GATES_CHECKED',
    recoveryStateIncludes(planTrusted.stateSequence, 'RECOVERY_GATES_CHECKED'),
    planTrusted.stateSequence.join(' → '),
  );

  assert(
    '27. state sequence includes RECOVERY_PLAN_CREATED',
    recoveryStateIncludes(planTrusted.stateSequence, 'RECOVERY_PLAN_CREATED'),
    planTrusted.stateSequence.join(' → '),
  );

  assert(
    '28. blocked plan includes RECOVERY_BLOCKED_PENDING_GATE',
    recoveryStateIncludes(planBlockedCmd.stateSequence, 'RECOVERY_BLOCKED_PENDING_GATE'),
    planBlockedCmd.stateSequence.join(' → '),
  );

  assert(
    '29. no recovery plan includes RECOVERY_NOT_REQUIRED',
    recoveryStateIncludes(planTrusted.stateSequence, 'RECOVERY_NOT_REQUIRED'),
    planTrusted.stateSequence.join(' → '),
  );

  const validInputs = [planTrusted, planBlockedCmd, planMissing];
  assert(
    '30. every valid input creates RECOVERY_RECORD_CREATED',
    validInputs.every((r) => recoveryStateIncludes(r.stateSequence, 'RECOVERY_RECORD_CREATED')),
    validInputs.map((r) => r.plan.packageId).join(', '),
  );

  const reportText = formatRecoveryExecutionReport(engine.getEngineState(), engine.getRecords());
  assert(
    '31. report includes recoveryPlanId',
    reportText.includes('Recovery plan ID:'),
    'recoveryPlanId section',
  );

  assert(
    '32. report includes verificationId',
    reportText.includes('Verification ID:'),
    'verificationId section',
  );

  assert(
    '33. report includes packageId',
    reportText.includes('Package ID:'),
    'packageId section',
  );

  assert(
    '34. report includes selected strategy',
    reportText.includes('Selected strategy:'),
    'strategy line',
  );

  assert(
    '35. report includes required gate',
    reportText.includes('Required gate:'),
    'gate line',
  );

  assert(
    '36. report includes no-recovery-executed confirmation',
    reportText.includes('No recovery executed') && reportText.includes('CONFIRMED'),
    'no recovery confirmed',
  );

  const owner = getDevPulseV2Owner('recovery_execution_engine');
  assert(
    '37. registry contains recovery_execution_engine',
    owner.ownerModule === RECOVERY_EXECUTION_OWNER_MODULE &&
      DevPulseV2RecoveryExecutionEngine.assertRegistryOwnership(),
    owner.ownerModule,
  );

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), encoding: 'utf8', stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('38. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('==================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(RECOVERY_EXECUTION_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:recovery-execution');
    console.log('npm run typecheck');
    console.log('');
    process.exit(0);
  }

  console.error('RECOVERY EXECUTION ENGINE VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
