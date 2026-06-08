/**
 * DevPulse V2 Execution Verification Loop — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import {
  createReadOnlyPackage,
  resetDevPulseV2ExecutionPackageRuntimeForTests,
  RUNTIME_FUTURE_GATE_AUTONOMY,
  RUNTIME_FUTURE_GATE_COMMAND,
  RUNTIME_FUTURE_GATE_FOUNDER_APPROVAL,
  RUNTIME_FUTURE_GATE_RECOVERY,
} from '../src/execution-runtime/index.js';
import type { RuntimeRecord } from '../src/execution-runtime/types.js';
import {
  DevPulseV2ExecutionVerificationLoop,
  formatExecutionVerificationReport,
  getDependencyChainSummary,
  resetDevPulseV2ExecutionVerificationLoopForTests,
  VERIFICATION_OWNER_MODULE,
  VERIFICATION_PASS_TOKEN,
  verificationStateIncludes,
} from '../src/execution-verification/index.js';
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
): ReturnType<typeof createReadOnlyPackage> {
  return createReadOnlyPackage({
    packageId,
    requestText,
    requestedAction,
    executionIntent: requestedAction,
    metadata: { source: 'verification-test' },
    requiresWrite: false,
    requiresCommand: false,
    requiresRecovery: false,
    requiresAutonomy: false,
    ...flags,
  });
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Execution Verification Loop Validation');
  console.log('===================================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  const runtime = resetDevPulseV2ExecutionPackageRuntimeForTests();
  const loop = resetDevPulseV2ExecutionVerificationLoopForTests();

  const readOnlyRecord = runtime.processPackage(
    createReadOnlyPackage({ packageId: 'ver-read-001', metadata: { source: 'test' } }),
  );
  const cmdRecord = runtime.processPackage(
    blockedPackage('ver-cmd', 'run npm test', 'run', {
      requiresCommand: true,
    }),
  );
  const writeRecord = runtime.processPackage(
    blockedPackage('ver-write', 'write file', 'write', { requiresWrite: true }),
  );
  const modRecord = runtime.processPackage(
    blockedPackage('ver-mod', 'apply patch', 'apply', { requiresWrite: true }),
  );
  const recoveryRecord = runtime.processPackage(
    blockedPackage('ver-recovery', 'rollback to checkpoint', 'rollback', {
      requiresRecovery: true,
    }),
  );
  const autoRecord = runtime.processPackage(
    blockedPackage('ver-auto', 'continue autonomously', 'autonomous', {
      requiresAutonomy: true,
    }),
  );

  const trustedRead = loop.verifyPackage('ver-read-001');
  assert('1. read-only accepted runtime record verifies TRUSTED', trustedRead.verdict === 'TRUSTED', trustedRead.verdict);

  const trustedCmd = loop.verifyPackage('ver-cmd');
  assert('2. command blocked runtime record verifies TRUSTED', trustedCmd.verdict === 'TRUSTED', trustedCmd.verdict);

  const trustedWrite = loop.verifyPackage('ver-write');
  assert('3. write blocked runtime record verifies TRUSTED', trustedWrite.verdict === 'TRUSTED', trustedWrite.verdict);

  const trustedMod = loop.verifyPackage('ver-mod');
  assert(
    '4. project modification blocked runtime record verifies TRUSTED',
    trustedMod.verdict === 'TRUSTED',
    trustedMod.verdict,
  );

  const trustedRecovery = loop.verifyPackage('ver-recovery');
  assert(
    '5. recovery blocked runtime record verifies TRUSTED',
    trustedRecovery.verdict === 'TRUSTED',
    trustedRecovery.verdict,
  );

  const trustedAuto = loop.verifyPackage('ver-auto');
  assert(
    '6. autonomy blocked runtime record verifies TRUSTED',
    trustedAuto.verdict === 'TRUSTED',
    trustedAuto.verdict,
  );

  const missingRecord = loop.verifyPackage('missing-package-id');
  assert('7. missing runtime record verifies FAILED', missingRecord.verdict === 'FAILED', missingRecord.verdict);

  const noAuthority = cloneRecord(readOnlyRecord);
  noAuthority.authorityDecision = null;
  const failedAuthority = loop.verifyRecord(noAuthority, 'ver-no-auth');
  assert(
    '8. missing authority decision verifies FAILED',
    failedAuthority.verdict === 'FAILED',
    failedAuthority.failures.join('; '),
  );

  const acceptedCmd = cloneRecord(cmdRecord);
  acceptedCmd.runtimeDecision = {
    ...acceptedCmd.runtimeDecision,
    accepted: true,
    finalState: 'ACCEPTED_READ_ONLY',
  };
  const failedAcceptedCmd = loop.verifyRecord(acceptedCmd, 'ver-bad-cmd');
  assert(
    '9. accepted command package verifies FAILED',
    failedAcceptedCmd.verdict === 'FAILED',
    failedAcceptedCmd.verdict,
  );

  const acceptedWrite = cloneRecord(writeRecord);
  acceptedWrite.runtimeDecision = {
    ...acceptedWrite.runtimeDecision,
    accepted: true,
    finalState: 'ACCEPTED_READ_ONLY',
  };
  const failedAcceptedWrite = loop.verifyRecord(acceptedWrite, 'ver-bad-write');
  assert(
    '10. accepted write package verifies FAILED',
    failedAcceptedWrite.verdict === 'FAILED',
    failedAcceptedWrite.verdict,
  );

  const acceptedRecovery = cloneRecord(recoveryRecord);
  acceptedRecovery.runtimeDecision = {
    ...acceptedRecovery.runtimeDecision,
    accepted: true,
    finalState: 'ACCEPTED_READ_ONLY',
  };
  const failedAcceptedRecovery = loop.verifyRecord(acceptedRecovery, 'ver-bad-recovery');
  assert(
    '11. accepted recovery package verifies FAILED',
    failedAcceptedRecovery.verdict === 'FAILED',
    failedAcceptedRecovery.verdict,
  );

  const wrongCmdGate = cloneRecord(cmdRecord);
  wrongCmdGate.runtimeDecision = {
    ...wrongCmdGate.runtimeDecision,
    futureGateRequired: 'wrong_gate',
  };
  const failedCmdGate = loop.verifyRecord(wrongCmdGate, 'ver-wrong-cmd-gate');
  assert(
    '12. blocked command with wrong gate verifies FAILED',
    failedCmdGate.verdict === 'FAILED',
    failedCmdGate.verdict,
  );

  const wrongWriteGate = cloneRecord(writeRecord);
  wrongWriteGate.runtimeDecision = {
    ...wrongWriteGate.runtimeDecision,
    futureGateRequired: RUNTIME_FUTURE_GATE_COMMAND,
  };
  const failedWriteGate = loop.verifyRecord(wrongWriteGate, 'ver-wrong-write-gate');
  assert(
    '13. blocked write with wrong gate verifies FAILED',
    failedWriteGate.verdict === 'FAILED',
    failedWriteGate.verdict,
  );

  const wrongRecoveryGate = cloneRecord(recoveryRecord);
  wrongRecoveryGate.runtimeDecision = {
    ...wrongRecoveryGate.runtimeDecision,
    futureGateRequired: RUNTIME_FUTURE_GATE_FOUNDER_APPROVAL,
  };
  const failedRecoveryGate = loop.verifyRecord(wrongRecoveryGate, 'ver-wrong-recovery-gate');
  assert(
    '14. blocked recovery with wrong gate verifies FAILED',
    failedRecoveryGate.verdict === 'FAILED',
    failedRecoveryGate.verdict,
  );

  const noExecConfirm = cloneRecord(readOnlyRecord);
  noExecConfirm.runtimeDecision = {
    ...noExecConfirm.runtimeDecision,
    noExecutionConfirmed: false,
  };
  const failedNoExec = loop.verifyRecord(noExecConfirm, 'ver-no-exec');
  assert(
    '15. missing no-execution confirmation verifies FAILED',
    failedNoExec.verdict === 'FAILED',
    failedNoExec.verdict,
  );

  const sparseMetaRecord = runtime.processPackage(
    createReadOnlyPackage({ packageId: 'ver-sparse-meta', metadata: {} }),
  );
  const warningResult = loop.verifyRecord(sparseMetaRecord, 'ver-sparse-meta');
  assert(
    '16. incomplete non-critical evidence verifies WARNING',
    warningResult.verdict === 'WARNING',
    warningResult.verdict,
  );

  assert(
    '17. state sequence includes VERIFICATION_RECEIVED',
    verificationStateIncludes(trustedRead.stateSequence, 'VERIFICATION_RECEIVED'),
    trustedRead.stateSequence.join(' → '),
  );

  assert(
    '18. state sequence includes RUNTIME_RECORD_FOUND',
    verificationStateIncludes(trustedRead.stateSequence, 'RUNTIME_RECORD_FOUND'),
    trustedRead.stateSequence.join(' → '),
  );

  assert(
    '19. state sequence includes AUTHORITY_ALIGNMENT_CHECKED',
    verificationStateIncludes(trustedRead.stateSequence, 'AUTHORITY_ALIGNMENT_CHECKED'),
    trustedRead.stateSequence.join(' → '),
  );

  assert(
    '20. state sequence includes GATE_ALIGNMENT_CHECKED',
    verificationStateIncludes(trustedRead.stateSequence, 'GATE_ALIGNMENT_CHECKED'),
    trustedRead.stateSequence.join(' → '),
  );

  assert(
    '21. state sequence includes NO_EXECUTION_CONFIRMED',
    verificationStateIncludes(trustedRead.stateSequence, 'NO_EXECUTION_CONFIRMED'),
    trustedRead.stateSequence.join(' → '),
  );

  assert(
    '22. state sequence includes EVIDENCE_ATTACHED',
    verificationStateIncludes(trustedRead.stateSequence, 'EVIDENCE_ATTACHED'),
    trustedRead.stateSequence.join(' → '),
  );

  assert(
    '23. trusted result includes VERIFICATION_PASSED',
    verificationStateIncludes(trustedRead.stateSequence, 'VERIFICATION_PASSED'),
    trustedRead.stateSequence.join(' → '),
  );

  assert(
    '24. warning result includes VERIFICATION_WARNING',
    verificationStateIncludes(warningResult.stateSequence, 'VERIFICATION_WARNING'),
    warningResult.stateSequence.join(' → '),
  );

  assert(
    '25. failed result includes VERIFICATION_FAILED',
    verificationStateIncludes(missingRecord.stateSequence, 'VERIFICATION_FAILED'),
    missingRecord.stateSequence.join(' → '),
  );

  const reportText = formatExecutionVerificationReport(loop.getLoopState(), loop.getResults());
  assert(
    '26. report includes verificationId',
    reportText.includes('Verification ID:'),
    'verificationId section',
  );

  assert(
    '27. report includes packageId',
    reportText.includes('Package ID:'),
    'packageId section',
  );

  assert(
    '28. report includes runtime decision',
    reportText.includes('Runtime decision:'),
    'runtime decision line',
  );

  assert(
    '29. report includes authority decision',
    reportText.includes('Authority decision:'),
    'authority decision line',
  );

  assert(
    '30. report includes evidence summary',
    reportText.includes('Evidence summary:'),
    'evidence summary line',
  );

  assert(
    '31. report includes no-execution confirmation',
    reportText.includes('No execution by this loop') && reportText.includes('CONFIRMED'),
    'loop no-execution confirmed',
  );

  const owner = getDevPulseV2Owner('execution_verification_loop');
  assert(
    '32. registry contains execution_verification_loop',
    owner.ownerModule === VERIFICATION_OWNER_MODULE &&
      DevPulseV2ExecutionVerificationLoop.assertRegistryOwnership(),
    owner.ownerModule,
  );

  assert(
    '33. dependency chain points to 6.1 and 6.2',
    DevPulseV2ExecutionVerificationLoop.assertDependencyChain() &&
      getDependencyChainSummary().includes('execution_authority@6.1') &&
      getDependencyChainSummary().includes('execution_package_runtime@6.2'),
    getDependencyChainSummary(),
  );

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), encoding: 'utf8', stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('34. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('===================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(VERIFICATION_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:execution-verification');
    console.log('npm run typecheck');
    console.log('');
    process.exit(0);
  }

  console.error('EXECUTION VERIFICATION LOOP VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
