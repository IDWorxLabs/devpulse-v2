/**
 * DevPulse V2 Recovery Chains — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import {
  createReadOnlyPackage,
  resetDevPulseV2ExecutionPackageRuntimeForTests,
} from '../src/execution-runtime/index.js';
import type { RuntimeRecord } from '../src/execution-runtime/types.js';
import { resetDevPulseV2ExecutionVerificationLoopForTests } from '../src/execution-verification/index.js';
import type { ExecutionVerificationResult } from '../src/execution-verification/types.js';
import { resetDevPulseV2RecoveryExecutionEngineForTests } from '../src/recovery-execution/index.js';
import { resetDevPulseV2FounderApprovalExecutionGateForTests } from '../src/founder-approval-execution/index.js';
import { resetDevPulseV2ExecutionRealityValidationForTests } from '../src/execution-reality-validation/index.js';
import { resetDevPulseV2ExecutionEvidenceLedgerForTests } from '../src/execution-evidence-ledger/index.js';
import {
  chainIncludesStepType,
  chainStateIncludes,
  countEvidenceBySource,
  formatRecoveryChainReport,
  RECOVERY_CHAINS_OWNER_MODULE,
  RECOVERY_CHAINS_PASS_TOKEN,
  resetDevPulseV2RecoveryChainsForTests,
} from '../src/recovery-chains/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import type { RecoveryChainGovernanceContext } from '../src/recovery-chains/types.js';

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
    metadata: { source: 'recovery-chains-test', ...flags.metadata },
    requiresWrite: false,
    requiresCommand: false,
    requiresRecovery: false,
    requiresAutonomy: false,
    ...flags,
  });
}

function runFullPipeline(
  pkg: ReturnType<typeof createReadOnlyPackage>,
  runtime: ReturnType<typeof resetDevPulseV2ExecutionPackageRuntimeForTests>,
  verificationLoop: ReturnType<typeof resetDevPulseV2ExecutionVerificationLoopForTests>,
  recoveryEngine: ReturnType<typeof resetDevPulseV2RecoveryExecutionEngineForTests>,
  gate: ReturnType<typeof resetDevPulseV2FounderApprovalExecutionGateForTests>,
  reality: ReturnType<typeof resetDevPulseV2ExecutionRealityValidationForTests>,
  ledger: ReturnType<typeof resetDevPulseV2ExecutionEvidenceLedgerForTests>,
) {
  runtime.processPackage(pkg);
  const verification = verificationLoop.verifyPackage(pkg.packageId);
  const recovery = recoveryEngine.planRecovery(verification);
  gate.evaluateApprovalRequest(recovery);
  reality.validatePackage(pkg.packageId);
  ledger.recordPackage(pkg.packageId);
  return { verification, recovery };
}

function emptyContext(packageId: string): RecoveryChainGovernanceContext {
  return {
    packageId,
    runtimeRecord: null,
    verificationResult: null,
    recoveryRecord: null,
    approvalRecord: null,
    realityResult: null,
    ledgerRecord: null,
  };
}

function failedVerificationResult(
  packageId: string,
  runtimeRecord: RuntimeRecord | null,
): ExecutionVerificationResult {
  return {
    verificationId: `exec-verification-failed-${packageId}`,
    packageId,
    createdAt: Date.now(),
    runtimeRecord,
    runtimeDecision: runtimeRecord?.runtimeDecision ?? null,
    authorityDecision: runtimeRecord?.authorityDecision ?? null,
    verdict: 'FAILED',
    confidence: 'LOW',
    stateSequence: ['VERIFICATION_FAILED'],
    evidence: [],
    warnings: [],
    failures: ['Simulated verification failure for recovery chain test'],
    noExecutionConfirmedByLoop: true,
  };
}

function wrongGateRuntimeRecord(base: RuntimeRecord): RuntimeRecord {
  return {
    ...base,
    authorityDecision: base.authorityDecision
      ? { ...base.authorityDecision, allowed: false }
      : {
          decisionId: 'authority-blocked-test',
          createdAt: Date.now(),
          requestedBySystemId: 'test',
          classification: 'WRITE_OPERATION',
          allowed: false,
          reason: 'Blocked for gate mapping test',
          warnings: [],
          errors: [],
        },
    runtimeDecision: {
      ...base.runtimeDecision,
      accepted: true,
      finalState: 'ACCEPTED_READ_ONLY',
    },
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Recovery Chains');
  console.log('=============================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  const runtime = resetDevPulseV2ExecutionPackageRuntimeForTests();
  const verificationLoop = resetDevPulseV2ExecutionVerificationLoopForTests();
  const recoveryEngine = resetDevPulseV2RecoveryExecutionEngineForTests();
  const gate = resetDevPulseV2FounderApprovalExecutionGateForTests();
  const reality = resetDevPulseV2ExecutionRealityValidationForTests();
  const ledger = resetDevPulseV2ExecutionEvidenceLedgerForTests();
  const recoveryChains = resetDevPulseV2RecoveryChainsForTests();

  const writePkg = blockedPackage('rc-write', 'write file', 'write', { requiresWrite: true });
  const autoPkg = blockedPackage('rc-auto', 'continue autonomously', 'autonomous', { requiresAutonomy: true });
  const recoveryPkg = blockedPackage('rc-recovery', 'rollback', 'rollback', { requiresRecovery: true });

  runFullPipeline(writePkg, runtime, verificationLoop, recoveryEngine, gate, reality, ledger);
  const autoPipeline = runFullPipeline(autoPkg, runtime, verificationLoop, recoveryEngine, gate, reality, ledger);
  runFullPipeline(recoveryPkg, runtime, verificationLoop, recoveryEngine, gate, reality, ledger);

  const writeRuntime = runtime.getRecord('rc-write')!;
  const writeLedger = ledger.findByPackageId('rc-write')[0]!;
  const writeReality = reality.getResults().filter((r) => r.packageId === 'rc-write').pop()!;
  const writeVerification = verificationLoop.getResults().filter((r) => r.packageId === 'rc-write').pop()!;
  const writeRecovery = recoveryEngine.getRecords().filter((r) => r.plan.packageId === 'rc-write').pop()!;
  const writeApproval = gate.listRecords().filter((r) => r.packageId === 'rc-write').pop()!;

  const missingRuntimeChain = recoveryChains.planChain({
    ...emptyContext('rc-missing-runtime'),
    failureType: 'MISSING_RUNTIME',
  });

  const missingApprovalChain = recoveryChains.planChain({
    packageId: 'rc-missing-approval',
    failureType: 'MISSING_APPROVAL',
    runtimeRecord: writeRuntime,
    verificationResult: writeVerification,
    recoveryRecord: writeRecovery ?? null,
    approvalRecord: null,
    realityResult: writeReality,
    ledgerRecord: null,
  });

  const failedVerificationChain = recoveryChains.planChain({
    packageId: 'rc-failed-verify',
    failureType: 'FAILED_VERIFICATION',
    runtimeRecord: writeRuntime,
    verificationResult: failedVerificationResult('rc-failed-verify', writeRuntime),
    recoveryRecord: writeRecovery ?? null,
    approvalRecord: writeApproval,
    realityResult: writeReality,
    ledgerRecord: null,
  });

  const wrongGateChain = recoveryChains.planChain({
    packageId: 'rc-wrong-gate',
    failureType: 'WRONG_GATE_MAPPING',
    runtimeRecord: wrongGateRuntimeRecord(writeRuntime),
    verificationResult: writeVerification,
    recoveryRecord: writeRecovery ?? null,
    approvalRecord: writeApproval,
    realityResult: writeReality,
    ledgerRecord: null,
  });

  const autonomyChain = recoveryChains.planChain({
    packageId: 'rc-auto',
    failureType: 'AUTONOMY_FAILURE',
    runtimeRecord: runtime.getRecord('rc-auto')!,
    verificationResult: autoPipeline.verification,
    recoveryRecord: autoPipeline.recovery,
    approvalRecord: gate.listRecords().filter((r) => r.packageId === 'rc-auto').pop() ?? null,
    realityResult: reality.getResults().filter((r) => r.packageId === 'rc-auto').pop() ?? null,
    ledgerRecord: ledger.findByPackageId('rc-auto')[0] ?? null,
  });

  const lowRiskChain = recoveryChains.planChain({
    ...emptyContext('rc-low'),
    failureType: 'MONITOR_ONLY',
  });

  const rollbackChain = recoveryChains.planChain({
    packageId: 'rc-rollback',
    failureType: 'FAILED_VERIFICATION',
    rollbackRequired: true,
    runtimeRecord: writeRuntime,
    verificationResult: failedVerificationResult('rc-rollback', writeRuntime),
    recoveryRecord: writeRecovery ?? null,
    approvalRecord: writeApproval,
    realityResult: writeReality,
    ledgerRecord: null,
  });

  const evidenceChain = recoveryChains.planChain({
    packageId: 'rc-write',
    runtimeRecord: writeRuntime,
    verificationResult: writeVerification,
    recoveryRecord: writeRecovery ?? null,
    approvalRecord: writeApproval,
    realityResult: writeReality,
    ledgerRecord: writeLedger,
    failureType: 'MISSING_APPROVAL',
  });

  assert(
    '1. missing runtime creates investigate chain',
    chainIncludesStepType(missingRuntimeChain.recoverySteps, 'INVESTIGATE') &&
      chainIncludesStepType(missingRuntimeChain.recoverySteps, 'VERIFY'),
    missingRuntimeChain.recoverySteps.map((s) => s.stepType).join(' → '),
  );
  assert(
    '2. missing approval creates approval chain',
    chainIncludesStepType(missingApprovalChain.recoverySteps, 'REQUEST_APPROVAL') &&
      chainIncludesStepType(missingApprovalChain.recoverySteps, 'WAIT_FOR_GATE'),
    missingApprovalChain.recoverySteps.map((s) => s.stepType).join(' → '),
  );
  assert(
    '3. failed verification creates retry chain',
    chainIncludesStepType(failedVerificationChain.recoverySteps, 'RETRY'),
    failedVerificationChain.recoverySteps.map((s) => s.stepType).join(' → '),
  );
  assert(
    '4. wrong gate creates approval chain',
    chainIncludesStepType(wrongGateChain.recoverySteps, 'REQUEST_APPROVAL') &&
      chainIncludesStepType(wrongGateChain.recoverySteps, 'INVESTIGATE'),
    wrongGateChain.recoverySteps.map((s) => s.stepType).join(' → '),
  );
  assert(
    '5. autonomy failure creates escalation chain',
    chainIncludesStepType(autonomyChain.recoverySteps, 'ESCALATE'),
    autonomyChain.recoverySteps.map((s) => s.stepType).join(' → '),
  );

  const sample = missingApprovalChain;
  assert('6. chain contains package id', sample.packageId === 'rc-missing-approval', sample.packageId);
  assert('7. chain contains failure reason', sample.failureReason.length > 0, sample.failureReason);
  assert('8. chain contains risk level', sample.riskLevel === 'HIGH', sample.riskLevel);
  assert('9. chain contains evidence links', Array.isArray(sample.evidenceLinks), `${sample.evidenceLinks.length} links`);

  const allSteps = missingRuntimeChain.recoverySteps
    .concat(missingApprovalChain.recoverySteps)
    .concat(failedVerificationChain.recoverySteps)
    .concat(autonomyChain.recoverySteps)
    .concat(lowRiskChain.recoverySteps);

  assert('10. investigate step supported', allSteps.some((s) => s.stepType === 'INVESTIGATE'), 'INVESTIGATE');
  assert('11. verify step supported', allSteps.some((s) => s.stepType === 'VERIFY'), 'VERIFY');
  assert('12. approval step supported', allSteps.some((s) => s.stepType === 'REQUEST_APPROVAL'), 'REQUEST_APPROVAL');
  assert('13. wait step supported', allSteps.some((s) => s.stepType === 'WAIT_FOR_GATE'), 'WAIT_FOR_GATE');
  assert('14. retry step supported', allSteps.some((s) => s.stepType === 'RETRY'), 'RETRY');
  assert('15. rollback step supported', rollbackChain.recoverySteps.some((s) => s.stepType === 'ROLLBACK'), 'ROLLBACK');
  assert('16. monitor step supported', lowRiskChain.recoverySteps.some((s) => s.stepType === 'MONITOR'), 'MONITOR');
  assert('17. escalate step supported', autonomyChain.recoverySteps.some((s) => s.stepType === 'ESCALATE'), 'ESCALATE');

  assert('18. low risk supported', lowRiskChain.riskLevel === 'LOW', lowRiskChain.riskLevel);
  assert('19. medium risk supported', missingRuntimeChain.riskLevel === 'MEDIUM', missingRuntimeChain.riskLevel);
  assert('20. high risk supported', missingApprovalChain.riskLevel === 'HIGH', missingApprovalChain.riskLevel);
  assert('21. critical risk supported', autonomyChain.riskLevel === 'CRITICAL', autonomyChain.riskLevel);

  assert('22. approvalRequired true supported', missingApprovalChain.approvalRequired === true, String(missingApprovalChain.approvalRequired));
  assert('23. approvalRequired false supported', missingRuntimeChain.approvalRequired === false, String(missingRuntimeChain.approvalRequired));
  assert('24. verificationRequired true supported', failedVerificationChain.verificationRequired === true, String(failedVerificationChain.verificationRequired));
  assert('25. retryRequired true supported', failedVerificationChain.retryRequired === true, String(failedVerificationChain.retryRequired));
  assert('26. retryRequired false supported', missingRuntimeChain.retryRequired === false, String(missingRuntimeChain.retryRequired));
  assert('27. rollbackRequired true supported', rollbackChain.rollbackRequired === true, String(rollbackChain.rollbackRequired));
  assert('28. rollbackRequired false supported', missingRuntimeChain.rollbackRequired === false, String(missingRuntimeChain.rollbackRequired));

  assert('29. evidence link attached from verification', countEvidenceBySource(evidenceChain.evidenceLinks, 'verification') >= 1, `${countEvidenceBySource(evidenceChain.evidenceLinks, 'verification')}`);
  assert('30. evidence link attached from recovery', countEvidenceBySource(evidenceChain.evidenceLinks, 'recovery') >= 1, `${countEvidenceBySource(evidenceChain.evidenceLinks, 'recovery')}`);
  assert('31. evidence link attached from approval', countEvidenceBySource(evidenceChain.evidenceLinks, 'approval') >= 1, `${countEvidenceBySource(evidenceChain.evidenceLinks, 'approval')}`);
  assert('32. evidence link attached from reality', countEvidenceBySource(evidenceChain.evidenceLinks, 'reality') >= 1, `${countEvidenceBySource(evidenceChain.evidenceLinks, 'reality')}`);
  assert('33. evidence link attached from ledger', countEvidenceBySource(evidenceChain.evidenceLinks, 'ledger') >= 1, `${countEvidenceBySource(evidenceChain.evidenceLinks, 'ledger')}`);

  const states = sample.stateSequence;
  assert('34. state includes CHAIN_INPUT_RECEIVED', chainStateIncludes(states, 'CHAIN_INPUT_RECEIVED'), states.join(' → '));
  assert('35. state includes FAILURE_ANALYZED', chainStateIncludes(states, 'FAILURE_ANALYZED'), states.join(' → '));
  assert('36. state includes CHAIN_GENERATED', chainStateIncludes(states, 'CHAIN_GENERATED'), states.join(' → '));
  assert('37. state includes CHAIN_VALIDATED', chainStateIncludes(states, 'CHAIN_VALIDATED'), states.join(' → '));
  assert('38. state includes RISK_EVALUATED', chainStateIncludes(states, 'RISK_EVALUATED'), states.join(' → '));
  assert('39. state includes EVIDENCE_ATTACHED', chainStateIncludes(states, 'EVIDENCE_ATTACHED'), states.join(' → '));
  assert('40. state includes CHAIN_READY', chainStateIncludes(states, 'CHAIN_READY'), states.join(' → '));

  const reportText = formatRecoveryChainReport(recoveryChains.getChainsState(), recoveryChains.getChains());
  assert('41. report contains chain id', reportText.includes('Chain ID:'), 'chain id line');
  assert('42. report contains package id', reportText.includes('Package ID:'), 'package id line');
  assert('43. report contains failure reason', reportText.includes('Failure reason:'), 'failure reason line');
  assert('44. report contains step count', reportText.includes('Step count:'), 'step count line');
  assert('45. report contains risk level', reportText.includes('Risk level:'), 'risk level line');
  assert('46. report contains evidence count', reportText.includes('Evidence count:'), 'evidence count line');
  assert('47. report confirms planning-only behavior', reportText.includes('Planning-only behavior: CONFIRMED'), 'planning-only');
  assert('48. report confirms no recovery executed', reportText.includes('No recovery executed: CONFIRMED'), 'no recovery');

  const owner = getDevPulseV2Owner('recovery_chains');
  assert(
    '49. registry contains recovery_chains',
    owner.ownerModule === RECOVERY_CHAINS_OWNER_MODULE && owner.phase === 6.8,
    owner.ownerModule,
  );

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('50. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
  }

  const failed = results.filter((r) => !r.passed);
  console.log('=============================');
  if (failed.length === 0) {
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(RECOVERY_CHAINS_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:recovery-chains');
    console.log('npm run typecheck');
    console.log('');
    process.exit(0);
  }

  console.log(`${failed.length} SCENARIO(S) FAILED`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
