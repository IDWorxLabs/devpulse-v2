/**
 * DevPulse V2 Execution Reality Validation — validation scenarios.
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
} from '../src/execution-verification/index.js';
import type { ExecutionVerificationResult } from '../src/execution-verification/types.js';
import {
  resetDevPulseV2RecoveryExecutionEngineForTests,
} from '../src/recovery-execution/index.js';
import {
  resetDevPulseV2FounderApprovalExecutionGateForTests,
} from '../src/founder-approval-execution/index.js';
import {
  buildRealityChainFromSystems,
  DevPulseV2ExecutionRealityValidation,
  formatExecutionRealityReport,
  REALITY_VALIDATION_OWNER_MODULE,
  REALITY_VALIDATION_PASS_TOKEN,
  realityStateIncludes,
  resetDevPulseV2ExecutionRealityValidationForTests,
  validateRealityChainCompleteness,
  type ExecutionRealityChainInput,
} from '../src/execution-reality-validation/index.js';
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
  packageId: string,
  requestText: string,
  requestedAction: string,
  flags: Parameters<typeof createReadOnlyPackage>[0] = {},
) {
  return createReadOnlyPackage({
    packageId,
    requestText,
    requestedAction,
    executionIntent: requestedAction,
    metadata: { source: 'reality-test', ...flags.metadata },
    requiresWrite: false,
    requiresCommand: false,
    requiresRecovery: false,
    requiresAutonomy: false,
    ...flags,
  });
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

function runFullPipeline(
  pkg: ReturnType<typeof createReadOnlyPackage>,
  runtime: ReturnType<typeof resetDevPulseV2ExecutionPackageRuntimeForTests>,
  verificationLoop: ReturnType<typeof resetDevPulseV2ExecutionVerificationLoopForTests>,
  recoveryEngine: ReturnType<typeof resetDevPulseV2RecoveryExecutionEngineForTests>,
  gate: ReturnType<typeof resetDevPulseV2FounderApprovalExecutionGateForTests>,
) {
  runtime.processPackage(pkg);
  const verification = verificationLoop.verifyPackage(pkg.packageId);
  const recovery = recoveryEngine.planRecovery(verification);
  const approval = gate.evaluateApprovalRequest(recovery);
  return { verification, recovery, approval };
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Execution Reality Validation');
  console.log('==========================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  const runtime = resetDevPulseV2ExecutionPackageRuntimeForTests();
  const verificationLoop = resetDevPulseV2ExecutionVerificationLoopForTests();
  const recoveryEngine = resetDevPulseV2RecoveryExecutionEngineForTests();
  const gate = resetDevPulseV2FounderApprovalExecutionGateForTests();
  const reality = resetDevPulseV2ExecutionRealityValidationForTests();

  runFullPipeline(
    createReadOnlyPackage({ packageId: 'real-read', metadata: { source: 'test' } }),
    runtime,
    verificationLoop,
    recoveryEngine,
    gate,
  );
  runFullPipeline(
    blockedPackage('real-write', 'write file', 'write', { requiresWrite: true }),
    runtime,
    verificationLoop,
    recoveryEngine,
    gate,
  );
  runFullPipeline(
    blockedPackage('real-recovery', 'rollback to checkpoint', 'rollback', { requiresRecovery: true }),
    runtime,
    verificationLoop,
    recoveryEngine,
    gate,
  );
  runFullPipeline(
    blockedPackage('real-auto', 'continue autonomously', 'autonomous', { requiresAutonomy: true }),
    runtime,
    verificationLoop,
    recoveryEngine,
    gate,
  );

  const readResult = reality.validatePackage('real-read');
  const writeResult = reality.validatePackage('real-write');
  const recoveryResult = reality.validatePackage('real-recovery');
  const autoResult = reality.validatePackage('real-auto');

  assert(
    '1. complete read-only chain validates',
    readResult.chainComplete && readResult.verificationStatus.present,
    `${readResult.verdict} complete=${readResult.chainComplete}`,
  );

  assert(
    '2. complete write chain validates',
    writeResult.chainComplete && writeResult.verdict !== 'REALITY_FAILED',
    `${writeResult.verdict} complete=${writeResult.chainComplete}`,
  );

  assert(
    '3. complete recovery chain validates',
    recoveryResult.chainComplete && recoveryResult.verificationStatus.present,
    `${recoveryResult.verdict} complete=${recoveryResult.chainComplete}`,
  );

  assert(
    '4. complete autonomy chain validates',
    autoResult.chainComplete && autoResult.verificationStatus.present,
    `${autoResult.verdict} complete=${autoResult.chainComplete}`,
  );

  const baseRead = buildRealityChainFromSystems('real-read');
  const noAuthority: ExecutionRealityChainInput = { ...baseRead, authorityDecision: null };
  const failAuthority = reality.validateChain(noAuthority);
  assert(
    '5. missing authority fails',
    failAuthority.verdict === 'REALITY_FAILED',
    failAuthority.verdict,
  );

  const noRuntime: ExecutionRealityChainInput = { ...baseRead, runtimeRecord: null, authorityDecision: null };
  const failRuntime = reality.validateChain(noRuntime);
  assert(
    '6. missing runtime fails',
    failRuntime.verdict === 'REALITY_FAILED',
    failRuntime.verdict,
  );

  const noVerification: ExecutionRealityChainInput = { ...baseRead, verificationResult: null };
  const failVerification = reality.validateChain(noVerification);
  assert(
    '7. missing verification fails',
    failVerification.verdict === 'REALITY_FAILED',
    failVerification.verdict,
  );

  const writeBase = buildRealityChainFromSystems('real-write');
  const noRecoveryOnWrite: ExecutionRealityChainInput = { ...writeBase, recoveryRecord: null };
  const failRecoveryMissing = reality.validateChain(noRecoveryOnWrite);
  assert(
    '8. required recovery missing fails',
    failRecoveryMissing.verdict === 'REALITY_FAILED',
    failRecoveryMissing.verdict,
  );

  const noApprovalOnWrite: ExecutionRealityChainInput = { ...writeBase, approvalRecord: null };
  const failApprovalMissing = reality.validateChain(noApprovalOnWrite);
  assert(
    '9. required approval missing fails',
    failApprovalMissing.verdict === 'REALITY_FAILED',
    failApprovalMissing.verdict,
  );

  const allowedBlocked = cloneRecord(runtime.getRecord('real-write')!);
  allowedBlocked.runtimeDecision = {
    ...allowedBlocked.runtimeDecision,
    accepted: true,
    finalState: 'ACCEPTED_READ_ONLY',
  };
  const mismatchChain: ExecutionRealityChainInput = {
    ...writeBase,
    runtimeRecord: allowedBlocked,
  };
  const failAllowedBlocked = reality.validateChain(mismatchChain);
  assert(
    '10. runtime allowed while authority blocked fails',
    failAllowedBlocked.contradictions.some((c) => c.code === 'runtime_allowed_authority_blocked'),
    failAllowedBlocked.verdict,
  );

  const trustedNoAuth: ExecutionRealityChainInput = {
    ...baseRead,
    authorityDecision: null,
    verificationResult: {
      ...baseRead.verificationResult!,
      verdict: 'TRUSTED',
    },
  };
  const failTrustedNoAuth = reality.validateChain(trustedNoAuth);
  assert(
    '11. trusted verification with missing authority fails',
    failTrustedNoAuth.contradictions.some((c) => c.code === 'trusted_verification_authority_missing'),
    failTrustedNoAuth.verdict,
  );

  const trustedNoRuntime: ExecutionRealityChainInput = {
    ...baseRead,
    runtimeRecord: null,
    verificationResult: { ...baseRead.verificationResult!, verdict: 'TRUSTED' },
  };
  const failTrustedNoRuntime = reality.validateChain(trustedNoRuntime);
  assert(
    '12. trusted verification with missing runtime fails',
    failTrustedNoRuntime.contradictions.some((c) => c.code === 'trusted_verification_runtime_missing'),
    failTrustedNoRuntime.verdict,
  );

  assert(
    '13. approval approved when not required warning',
    readResult.contradictions.some((c) => c.code === 'approval_approved_when_not_required'),
    readResult.contradictions.map((c) => c.code).join(', '),
  );

  assert(
    '14. recovery exists when not needed warning',
    readResult.contradictions.some((c) => c.code === 'recovery_exists_when_not_needed'),
    readResult.contradictions.map((c) => c.code).join(', '),
  );

  const failedVerification: ExecutionVerificationResult = {
    ...writeBase.verificationResult!,
    verdict: 'FAILED',
    failures: ['Missing runtime record'],
    runtimeRecord: null,
  };
  const recoveryMissingFail: ExecutionRealityChainInput = {
    packageId: 'real-fail-rec',
    authorityDecision: null,
    runtimeRecord: null,
    verificationResult: failedVerification,
    recoveryRecord: null,
    approvalRecord: null,
  };
  const failRecoveryRequired = reality.validateChain(recoveryMissingFail);
  assert(
    '15. recovery missing when required fail',
    failRecoveryRequired.contradictions.some((c) => c.code === 'recovery_missing_when_required'),
    failRecoveryRequired.verdict,
  );

  assert(
    '16. chain completeness true for complete chain',
    validateRealityChainCompleteness(buildRealityChainFromSystems('real-write')),
    String(writeResult.chainComplete),
  );

  assert(
    '17. chain completeness false for incomplete chain',
    !validateRealityChainCompleteness(noRuntime),
    String(failRuntime.chainComplete),
  );

  assert(
    '18. confidence HIGH supported',
    writeResult.confidence === 'HIGH' || recoveryResult.confidence === 'HIGH',
    `write=${writeResult.confidence} recovery=${recoveryResult.confidence}`,
  );

  assert(
    '19. confidence MEDIUM supported',
    readResult.confidence === 'MEDIUM',
    readResult.confidence,
  );

  assert(
    '20. confidence LOW supported',
    failRuntime.confidence === 'LOW',
    failRuntime.confidence,
  );

  assert(
    '21. reality trusted supported',
    writeResult.verdict === 'REALITY_TRUSTED' || recoveryResult.verdict === 'REALITY_TRUSTED',
    `write=${writeResult.verdict} recovery=${recoveryResult.verdict}`,
  );

  assert(
    '22. reality warning supported',
    readResult.verdict === 'REALITY_WARNING',
    readResult.verdict,
  );

  assert(
    '23. reality failed supported',
    failRuntime.verdict === 'REALITY_FAILED',
    failRuntime.verdict,
  );

  assert(
    '24. state includes REALITY_INPUT_RECEIVED',
    realityStateIncludes(writeResult.stateSequence, 'REALITY_INPUT_RECEIVED'),
    writeResult.stateSequence.join(' → '),
  );

  assert(
    '25. state includes AUTHORITY_VALIDATED',
    realityStateIncludes(writeResult.stateSequence, 'AUTHORITY_VALIDATED'),
    writeResult.stateSequence.join(' → '),
  );

  assert(
    '26. state includes RUNTIME_VALIDATED',
    realityStateIncludes(writeResult.stateSequence, 'RUNTIME_VALIDATED'),
    writeResult.stateSequence.join(' → '),
  );

  assert(
    '27. state includes VERIFICATION_VALIDATED',
    realityStateIncludes(writeResult.stateSequence, 'VERIFICATION_VALIDATED'),
    writeResult.stateSequence.join(' → '),
  );

  assert(
    '28. state includes RECOVERY_VALIDATED',
    realityStateIncludes(writeResult.stateSequence, 'RECOVERY_VALIDATED'),
    writeResult.stateSequence.join(' → '),
  );

  assert(
    '29. state includes APPROVAL_VALIDATED',
    realityStateIncludes(writeResult.stateSequence, 'APPROVAL_VALIDATED'),
    writeResult.stateSequence.join(' → '),
  );

  assert(
    '30. state includes CONSISTENCY_CHECK_COMPLETED',
    realityStateIncludes(writeResult.stateSequence, 'CONSISTENCY_CHECK_COMPLETED'),
    writeResult.stateSequence.join(' → '),
  );

  assert(
    '31. state includes CONTRADICTION_CHECK_COMPLETED',
    realityStateIncludes(writeResult.stateSequence, 'CONTRADICTION_CHECK_COMPLETED'),
    writeResult.stateSequence.join(' → '),
  );

  assert(
    '32. state includes CONFIDENCE_COMPUTED',
    realityStateIncludes(writeResult.stateSequence, 'CONFIDENCE_COMPUTED'),
    writeResult.stateSequence.join(' → '),
  );

  assert(
    '33. state includes REALITY_VALIDATION_COMPLETE',
    realityStateIncludes(writeResult.stateSequence, 'REALITY_VALIDATION_COMPLETE'),
    writeResult.stateSequence.join(' → '),
  );

  const reportText = formatExecutionRealityReport(reality.getValidatorState(), reality.getResults());
  assert(
    '34. report contains realityValidationId',
    reportText.includes('Reality validation ID:'),
    'realityValidationId section',
  );

  assert(
    '35. report contains packageId',
    reportText.includes('Package ID:'),
    'packageId section',
  );

  assert(
    '36. report contains authority status',
    reportText.includes('Authority status:'),
    'authority status line',
  );

  assert(
    '37. report contains runtime status',
    reportText.includes('Runtime status:'),
    'runtime status line',
  );

  assert(
    '38. report contains verification status',
    reportText.includes('Verification status:'),
    'verification status line',
  );

  assert(
    '39. report contains recovery status',
    reportText.includes('Recovery status:'),
    'recovery status line',
  );

  assert(
    '40. report contains approval status',
    reportText.includes('Approval status:'),
    'approval status line',
  );

  assert(
    '41. report contains contradictions',
    reportText.includes('Contradictions:'),
    'contradictions line',
  );

  assert(
    '42. report contains confidence',
    reportText.includes('Confidence:'),
    'confidence line',
  );

  assert(
    '43. report contains verdict',
    reportText.includes('Verdict:'),
    'verdict line',
  );

  const owner = getDevPulseV2Owner('execution_reality_validation');
  assert(
    '44. registry contains execution_reality_validation',
    owner.ownerModule === REALITY_VALIDATION_OWNER_MODULE &&
      DevPulseV2ExecutionRealityValidation.assertRegistryOwnership(),
    owner.ownerModule,
  );

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), encoding: 'utf8', stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('45. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('==========================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(REALITY_VALIDATION_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:execution-reality');
    console.log('npm run typecheck');
    console.log('');
    process.exit(0);
  }

  console.error('EXECUTION REALITY VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
