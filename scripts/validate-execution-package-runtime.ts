/**
 * DevPulse V2 Execution Package Runtime — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import {
  createReadOnlyPackage,
  DevPulseV2ExecutionPackageRuntime,
  formatExecutionPackageRuntimeReport,
  resetDevPulseV2ExecutionPackageRuntimeForTests,
  RUNTIME_FUTURE_GATE_AUTONOMY,
  RUNTIME_FUTURE_GATE_COMMAND,
  RUNTIME_FUTURE_GATE_FOUNDER_APPROVAL,
  RUNTIME_FUTURE_GATE_RECOVERY,
  RUNTIME_OWNER_MODULE,
  RUNTIME_PASS_TOKEN,
  stateSequenceIncludes,
} from '../src/execution-runtime/index.js';
import type { ExecutionPackage } from '../src/execution-runtime/types.js';
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

function blockedPackage(
  requestText: string,
  requestedAction: string,
  flags: Partial<ExecutionPackage>,
  packageId: string,
): ExecutionPackage {
  return createReadOnlyPackage({
    packageId,
    requestText,
    requestedAction,
    executionIntent: requestedAction,
    requiresWrite: false,
    requiresCommand: false,
    requiresRecovery: false,
    requiresAutonomy: false,
    ...flags,
  });
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Execution Package Runtime Validation');
  console.log('==================================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  const runtime = resetDevPulseV2ExecutionPackageRuntimeForTests();

  const readOnly = runtime.processPackage(createReadOnlyPackage({ packageId: 'pkg-read-001' }));
  assert(
    '1. valid read-only package accepted',
    readOnly.runtimeDecision.accepted &&
      readOnly.runtimeDecision.finalState === 'ACCEPTED_READ_ONLY',
    readOnly.runtimeDecision.finalState,
  );

  const noId = runtime.processPackage(createReadOnlyPackage({ packageId: '' }));
  assert(
    '2. missing packageId rejected',
    noId.runtimeDecision.finalState === 'REJECTED_INVALID_PACKAGE',
    noId.runtimeDecision.blockedReason ?? '',
  );

  const noText = runtime.processPackage(createReadOnlyPackage({ packageId: 'pkg-no-text', requestText: '' }));
  assert(
    '3. missing requestText rejected',
    noText.runtimeDecision.finalState === 'REJECTED_INVALID_PACKAGE',
    noText.runtimeDecision.blockedReason ?? '',
  );

  const noAction = runtime.processPackage(
    createReadOnlyPackage({ packageId: 'pkg-no-action', requestedAction: '' }),
  );
  assert(
    '4. missing requestedAction rejected',
    noAction.runtimeDecision.finalState === 'REJECTED_INVALID_PACKAGE',
    noAction.runtimeDecision.blockedReason ?? '',
  );

  const badRisk = runtime.processPackage(
    createReadOnlyPackage({
      packageId: 'pkg-bad-risk',
      riskLevel: 'UNKNOWN' as ExecutionPackage['riskLevel'],
    }),
  );
  assert(
    '5. invalid riskLevel rejected',
    badRisk.runtimeDecision.finalState === 'REJECTED_INVALID_PACKAGE',
    badRisk.runtimeDecision.blockedReason ?? '',
  );

  const badBy = runtime.processPackage(
    createReadOnlyPackage({ packageId: 'pkg-bad-by', requestedBy: 'Invalid System!' }),
  );
  assert(
    '6. invalid requestedBy rejected',
    badBy.runtimeDecision.finalState === 'REJECTED_INVALID_PACKAGE',
    badBy.runtimeDecision.blockedReason ?? '',
  );

  const cmdPkg = runtime.processPackage(
    blockedPackage('run npm test', 'run', { requiresCommand: true }, 'pkg-cmd'),
  );
  assert(
    '7. command package blocked',
    cmdPkg.runtimeDecision.finalState === 'BLOCKED_REQUIRES_GATE' && !cmdPkg.runtimeDecision.accepted,
    cmdPkg.runtimeDecision.finalState,
  );

  const writePkg = runtime.processPackage(
    blockedPackage('write file', 'write', { requiresWrite: true }, 'pkg-write'),
  );
  assert(
    '8. write package blocked',
    writePkg.runtimeDecision.finalState === 'BLOCKED_REQUIRES_GATE',
    writePkg.runtimeDecision.finalState,
  );

  const modPkg = runtime.processPackage(
    blockedPackage('apply patch', 'apply', { requiresWrite: true }, 'pkg-mod'),
  );
  assert(
    '9. project modification blocked',
    modPkg.runtimeDecision.finalState === 'BLOCKED_REQUIRES_GATE',
    modPkg.runtimeDecision.finalState,
  );

  const recoveryPkg = runtime.processPackage(
    blockedPackage('rollback to checkpoint', 'rollback', { requiresRecovery: true }, 'pkg-recovery'),
  );
  assert(
    '10. recovery package blocked',
    recoveryPkg.runtimeDecision.finalState === 'BLOCKED_REQUIRES_GATE',
    recoveryPkg.runtimeDecision.finalState,
  );

  const autoPkg = runtime.processPackage(
    blockedPackage('continue autonomously', 'autonomous', { requiresAutonomy: true }, 'pkg-auto'),
  );
  assert(
    '11. autonomy package blocked',
    autoPkg.runtimeDecision.finalState === 'BLOCKED_REQUIRES_GATE',
    autoPkg.runtimeDecision.finalState,
  );

  assert(
    '12. read-only package confirms no execution occurred',
    readOnly.runtimeDecision.noExecutionConfirmed === true,
    String(readOnly.runtimeDecision.noExecutionConfirmed),
  );

  assert(
    '13. blocked command identifies future command gate',
    cmdPkg.runtimeDecision.futureGateRequired === RUNTIME_FUTURE_GATE_COMMAND,
    cmdPkg.runtimeDecision.futureGateRequired ?? 'missing',
  );

  assert(
    '14. blocked write identifies founder approval gate',
    writePkg.runtimeDecision.futureGateRequired === RUNTIME_FUTURE_GATE_FOUNDER_APPROVAL,
    writePkg.runtimeDecision.futureGateRequired ?? 'missing',
  );

  assert(
    '15. blocked project modification identifies founder approval gate',
    modPkg.runtimeDecision.futureGateRequired === RUNTIME_FUTURE_GATE_FOUNDER_APPROVAL,
    modPkg.runtimeDecision.futureGateRequired ?? 'missing',
  );

  assert(
    '16. blocked recovery identifies recovery engine gate',
    recoveryPkg.runtimeDecision.futureGateRequired === RUNTIME_FUTURE_GATE_RECOVERY,
    recoveryPkg.runtimeDecision.futureGateRequired ?? 'missing',
  );

  assert(
    '17. blocked autonomy identifies World 2 gate',
    autoPkg.runtimeDecision.futureGateRequired === RUNTIME_FUTURE_GATE_AUTONOMY,
    autoPkg.runtimeDecision.futureGateRequired ?? 'missing',
  );

  assert(
    '18. state machine records PACKAGE_RECEIVED',
    stateSequenceIncludes(readOnly.stateSequence, 'PACKAGE_RECEIVED'),
    readOnly.stateSequence.join(' → '),
  );

  assert(
    '19. state machine records SCHEMA_VALIDATED',
    stateSequenceIncludes(readOnly.stateSequence, 'SCHEMA_VALIDATED'),
    readOnly.stateSequence.join(' → '),
  );

  assert(
    '20. state machine records AUTHORITY_CHECKED',
    stateSequenceIncludes(readOnly.stateSequence, 'AUTHORITY_CHECKED'),
    readOnly.stateSequence.join(' → '),
  );

  assert(
    '21. accepted package records ACCEPTED_READ_ONLY',
    stateSequenceIncludes(readOnly.stateSequence, 'ACCEPTED_READ_ONLY'),
    readOnly.stateSequence.join(' → '),
  );

  assert(
    '22. blocked package records BLOCKED_REQUIRES_GATE',
    stateSequenceIncludes(cmdPkg.stateSequence, 'BLOCKED_REQUIRES_GATE'),
    cmdPkg.stateSequence.join(' → '),
  );

  assert(
    '23. invalid package records REJECTED_INVALID_PACKAGE',
    stateSequenceIncludes(noId.stateSequence, 'REJECTED_INVALID_PACKAGE'),
    noId.stateSequence.join(' → '),
  );

  const structuralPackages = [readOnly, cmdPkg, writePkg];
  assert(
    '24. runtime record created for every valid structural package',
    structuralPackages.every((r) => stateSequenceIncludes(r.stateSequence, 'RUNTIME_RECORD_CREATED')),
    structuralPackages.map((r) => r.packageId).join(', '),
  );

  const reportText = formatExecutionPackageRuntimeReport(
    runtime.getRuntimeState(),
    runtime.getRecords(),
  );
  assert(
    '25. report includes packageId',
    reportText.includes('pkg-read-001') || reportText.includes('Latest packageId'),
    'report has packageId section',
  );

  assert(
    '26. report includes authority decision',
    reportText.includes('Authority decision'),
    'authority decision line present',
  );

  assert(
    '27. report includes runtime decision',
    reportText.includes('Runtime decision'),
    'runtime decision line present',
  );

  assert(
    '28. report includes no-execution confirmation',
    reportText.includes('No execution occurred') && reportText.includes('CONFIRMED'),
    'no-execution confirmed in report',
  );

  const owner = getDevPulseV2Owner('execution_package_runtime');
  assert(
    '29. registry contains execution_package_runtime',
    owner.ownerModule === RUNTIME_OWNER_MODULE &&
      DevPulseV2ExecutionPackageRuntime.assertRegistryOwnership(),
    owner.ownerModule,
  );

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), encoding: 'utf8', stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('30. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

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
    console.log(RUNTIME_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:execution-runtime');
    console.log('npm run typecheck');
    console.log('');
    process.exit(0);
  }

  console.error('EXECUTION PACKAGE RUNTIME VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
