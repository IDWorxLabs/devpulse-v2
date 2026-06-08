/**
 * DevPulse V2 Verification-Gated Apply — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import {
  createReadOnlyPackage,
  resetDevPulseV2ExecutionPackageRuntimeForTests,
} from '../src/execution-runtime/index.js';
import { resetDevPulseV2ExecutionVerificationLoopForTests } from '../src/execution-verification/index.js';
import type { ExecutionVerificationResult } from '../src/execution-verification/types.js';
import { resetDevPulseV2RecoveryExecutionEngineForTests } from '../src/recovery-execution/index.js';
import { resetDevPulseV2FounderApprovalExecutionGateForTests } from '../src/founder-approval-execution/index.js';
import type { FounderApprovalRecord } from '../src/founder-approval-execution/types.js';
import { resetDevPulseV2ExecutionRealityValidationForTests } from '../src/execution-reality-validation/index.js';
import type { ExecutionRealityResult } from '../src/execution-reality-validation/types.js';
import { resetDevPulseV2ExecutionEvidenceLedgerForTests } from '../src/execution-evidence-ledger/index.js';
import { resetDevPulseV2RecoveryChainsForTests } from '../src/recovery-chains/index.js';
import type { RecoveryChain } from '../src/recovery-chains/types.js';
import { resetDevPulseV2AutoFixControlPanelForTests } from '../src/auto-fix-control/index.js';
import type { AutoFixPermissionRecord } from '../src/auto-fix-control/types.js';
import { resetDevPulseV2RollbackRetryEngineForTests } from '../src/rollback-retry-engine/index.js';
import type { RollbackRetryPlan } from '../src/rollback-retry-engine/types.js';
import {
  applyRecordStructuralKey,
  applyStateIncludes,
  countApplyEvidenceBySource,
  DevPulseV2VerificationGatedApply,
  evaluateApplyReadiness,
  evaluateVerificationGatedApply,
  formatVerificationGatedApplyReport,
  policyOutputKey,
  readinessOutputKey,
  runApplyGateChecks,
  verdictOutputKey,
  VERIFICATION_GATED_APPLY_OWNER_MODULE,
  VERIFICATION_GATED_APPLY_PASS_TOKEN,
  resetDevPulseV2VerificationGatedApplyForTests,
} from '../src/verification-gated-apply/index.js';
import { evaluateApplyRisk } from '../src/verification-gated-apply/apply-risk-engine.js';
import type { ApplyGateInput } from '../src/verification-gated-apply/types.js';
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

function mockVerification(verdict: ExecutionVerificationResult['verdict']): ExecutionVerificationResult {
  return {
    verificationId: 'verify-mock',
    packageId: 'mock',
    createdAt: Date.now(),
    runtimeRecord: null,
    runtimeDecision: null,
    authorityDecision: null,
    verdict,
    confidence: 'HIGH',
    stateSequence: [],
    evidence: [],
    warnings: [],
    failures: [],
    noExecutionConfirmedByLoop: true,
  };
}

function mockApproval(decision: FounderApprovalRecord['decision'], requirement: FounderApprovalRecord['approvalRequirement'] = 'NO_APPROVAL_REQUIRED'): FounderApprovalRecord {
  return {
    approvalRequestId: 'approval-mock',
    verificationId: 'verify-mock',
    recoveryPlanId: 'recovery-mock',
    packageId: 'mock',
    createdAt: Date.now(),
    approvalRequirement: requirement,
    riskLevel: 'LOW',
    decision,
    constitutionalRulesTriggered: [],
    affectedDomains: [],
    stateSequence: [],
    noExecutionOccurred: true,
    warnings: [],
    errors: [],
  };
}

function mockReality(verdict: ExecutionRealityResult['verdict'], contradictions: ExecutionRealityResult['contradictions'] = []): ExecutionRealityResult {
  return {
    realityValidationId: 'reality-mock',
    packageId: 'mock',
    createdAt: Date.now(),
    authorityStatus: { present: true, detail: 'ok' },
    runtimeStatus: { present: true, detail: 'ok' },
    verificationStatus: { present: true, detail: 'ok' },
    recoveryStatus: { present: true, detail: 'ok' },
    approvalStatus: { present: true, detail: 'ok' },
    contradictions,
    confidence: 'HIGH',
    verdict,
    chainComplete: true,
    stateSequence: [],
    warnings: [],
    errors: [],
    noExecutionOccurred: true,
  };
}

function mockRollbackPlan(rollbackState: RollbackRetryPlan['rollbackState'], retryState: RollbackRetryPlan['retryState'], riskLevel: RollbackRetryPlan['riskLevel'] = 'LOW'): RollbackRetryPlan {
  return {
    planId: 'rollback-plan-mock',
    packageId: 'mock',
    failureScenario: 'NONE',
    rollbackState,
    retryState,
    checkpoint: {
      checkpointId: 'cp-mock',
      checkpointType: 'GOVERNANCE_CHAIN_START',
      checkpointReason: 'mock',
      confidence: 'HIGH',
      packageId: 'mock',
    },
    approvalRequired: false,
    verificationRequired: false,
    riskLevel,
    evidenceLinks: [],
    stateSequence: [],
    createdAt: Date.now(),
    planningOnlyConfirmed: true,
    noRollbackExecuted: true,
    noRetryExecuted: true,
  };
}

function mockRecoveryChain(approvalRequired: boolean, riskLevel: RecoveryChain['riskLevel'] = 'MEDIUM'): RecoveryChain {
  return {
    chainId: 'chain-mock',
    packageId: 'mock',
    failureReason: 'mock',
    failureType: 'MONITOR_ONLY',
    recoverySteps: [],
    riskLevel,
    approvalRequired,
    verificationRequired: false,
    rollbackRequired: false,
    retryRequired: false,
    evidenceLinks: [],
    stateSequence: [],
    createdAt: Date.now(),
    planningOnlyConfirmed: true,
    noRecoveryExecuted: true,
  };
}

function mockAutoFix(fixType: AutoFixPermissionRecord['fixType'], permissionState: AutoFixPermissionRecord['permissionState']): AutoFixPermissionRecord {
  return {
    fixId: 'autofix-mock',
    packageId: 'mock',
    fixType,
    permissionState,
    approvalRequired: false,
    verificationRequired: false,
    riskLevel: 'LOW',
    evidenceLinks: [],
    stateSequence: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    controlLayerOnlyConfirmed: true,
    noFixExecuted: true,
  };
}

function trustedInput(packageId: string): ApplyGateInput {
  return {
    packageId,
    verificationResult: mockVerification('TRUSTED'),
    approvalRecord: mockApproval('APPROVED'),
    realityResult: mockReality('REALITY_TRUSTED'),
    recoveryChain: mockRecoveryChain(false, 'LOW'),
    autoFixRecord: mockAutoFix('READ_ONLY_FIX', 'ALLOWED'),
    rollbackRetryPlan: mockRollbackPlan('ROLLBACK_NOT_REQUIRED', 'RETRY_NOT_REQUIRED', 'LOW'),
    ledgerRecord: { ledgerRecordId: 'ledger-mock' } as ApplyGateInput['ledgerRecord'],
  };
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
    metadata: { source: 'vga-test', ...flags.metadata },
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
  recoveryChains: ReturnType<typeof resetDevPulseV2RecoveryChainsForTests>,
  autoFix: ReturnType<typeof resetDevPulseV2AutoFixControlPanelForTests>,
  rollbackEngine: ReturnType<typeof resetDevPulseV2RollbackRetryEngineForTests>,
) {
  runtime.processPackage(pkg);
  const verification = verificationLoop.verifyPackage(pkg.packageId);
  const recovery = recoveryEngine.planRecovery(verification);
  const approval = gate.evaluateApprovalRequest(recovery);
  const realityResult = reality.validatePackage(pkg.packageId);
  const ledgerRecord = ledger.recordPackage(pkg.packageId);
  const chain = recoveryChains.planChain({
    packageId: pkg.packageId,
    runtimeRecord: runtime.getRecord(pkg.packageId) ?? null,
    verificationResult: verification,
    recoveryRecord: recovery,
    approvalRecord: approval,
    realityResult,
    ledgerRecord,
  });
  const autoFixRecord = autoFix.evaluateFixType(pkg.packageId, 'CONFIGURATION_FIX');
  const rollbackPlan = rollbackEngine.planRollbackRetry({
    packageId: pkg.packageId,
    failureScenario: 'NONE',
    runtimeRecord: runtime.getRecord(pkg.packageId) ?? null,
    verificationResult: verification,
    recoveryChain: chain,
    autoFixRecord,
    approvalRecord: approval,
    realityResult,
    ledgerRecord,
  });
  return { verification, approval, realityResult, ledgerRecord, chain, autoFixRecord, rollbackPlan };
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Verification-Gated Apply');
  console.log('======================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  const runtime = resetDevPulseV2ExecutionPackageRuntimeForTests();
  const verificationLoop = resetDevPulseV2ExecutionVerificationLoopForTests();
  const recoveryEngine = resetDevPulseV2RecoveryExecutionEngineForTests();
  const gate = resetDevPulseV2FounderApprovalExecutionGateForTests();
  const reality = resetDevPulseV2ExecutionRealityValidationForTests();
  const ledger = resetDevPulseV2ExecutionEvidenceLedgerForTests();
  const recoveryChains = resetDevPulseV2RecoveryChainsForTests();
  const autoFix = resetDevPulseV2AutoFixControlPanelForTests();
  const rollbackEngine = resetDevPulseV2RollbackRetryEngineForTests();
  const applyGate = resetDevPulseV2VerificationGatedApplyForTests();

  const writePkg = blockedPackage('vga-write', 'write file', 'write', { requiresWrite: true });
  const pipeline = runFullPipeline(writePkg, runtime, verificationLoop, recoveryEngine, gate, reality, ledger, recoveryChains, autoFix, rollbackEngine);

  const trusted = applyGate.evaluateApply(trustedInput('vga-trusted'));

  const failedReality = applyGate.evaluateApply({
    ...trustedInput('vga-failed-reality'),
    realityResult: mockReality('REALITY_FAILED'),
  });

  const contradiction = applyGate.evaluateApply({
    ...trustedInput('vga-contradiction'),
    realityResult: mockReality('REALITY_TRUSTED', [
      { code: 'runtime_missing', severity: 'CRITICAL', message: 'test' },
    ]),
  });

  const rollbackRequired = applyGate.evaluateApply({
    ...trustedInput('vga-rollback'),
    rollbackRetryPlan: mockRollbackPlan('ROLLBACK_REQUIRED', 'RETRY_NOT_REQUIRED', 'HIGH'),
  });

  const criticalRisk = applyGate.evaluateApply({
    ...trustedInput('vga-critical'),
    autoFixRecord: mockAutoFix('AUTONOMY_FIX', 'BLOCKED'),
    recoveryChain: mockRecoveryChain(true, 'CRITICAL'),
  });

  const approvalPending = applyGate.evaluateApply({
    ...trustedInput('vga-approval-pending'),
    approvalRecord: mockApproval('PENDING', 'APPROVAL_REQUIRED'),
  });

  const retryRecommended = applyGate.evaluateApply({
    ...trustedInput('vga-retry-rec'),
    rollbackRetryPlan: mockRollbackPlan('ROLLBACK_NOT_REQUIRED', 'RETRY_RECOMMENDED', 'MEDIUM'),
  });

  const recoveryPending = applyGate.evaluateApply({
    ...trustedInput('vga-recovery-pending'),
    recoveryChain: mockRecoveryChain(true, 'MEDIUM'),
    approvalRecord: mockApproval('PENDING', 'APPROVAL_REQUIRED'),
  });

  assert('1. trusted chain => allow', trusted.applyVerdict === 'ALLOW', trusted.applyVerdict);
  assert('2. failed reality => block', failedReality.applyVerdict === 'BLOCK', failedReality.applyVerdict);
  assert('3. contradiction => block', contradiction.applyVerdict === 'BLOCK', contradiction.applyVerdict);
  assert('4. rollback required => block', rollbackRequired.applyVerdict === 'BLOCK', rollbackRequired.applyVerdict);
  assert('5. critical risk => block', criticalRisk.applyVerdict === 'BLOCK', criticalRisk.applyVerdict);

  assert('6. approval pending => pending', approvalPending.applyVerdict === 'PENDING', approvalPending.applyVerdict);
  assert('7. retry recommended => pending', retryRecommended.applyVerdict === 'PENDING', retryRecommended.applyVerdict);
  assert('8. recovery pending => pending', recoveryPending.applyVerdict === 'PENDING', recoveryPending.applyVerdict);

  assert('9. ready state supported', trusted.readinessState === 'READY', trusted.readinessState);
  assert('10. not ready state supported', failedReality.readinessState === 'NOT_READY', failedReality.readinessState);
  assert('11. pending approval state supported', approvalPending.readinessState === 'PENDING_APPROVAL', approvalPending.readinessState);

  assert('12. allow verdict supported', trusted.applyVerdict === 'ALLOW', trusted.applyVerdict);
  assert('13. block verdict supported', failedReality.applyVerdict === 'BLOCK', failedReality.applyVerdict);
  assert('14. pending verdict supported', approvalPending.applyVerdict === 'PENDING', approvalPending.applyVerdict);

  assert('15. low risk supported', trusted.riskLevel === 'LOW', trusted.riskLevel);
  assert('16. medium risk supported', retryRecommended.riskLevel === 'MEDIUM', retryRecommended.riskLevel);
  assert('17. high risk supported', rollbackRequired.riskLevel === 'HIGH', rollbackRequired.riskLevel);
  assert('18. critical risk supported', criticalRisk.riskLevel === 'CRITICAL', criticalRisk.riskLevel);

  assert('19. approval satisfied true', trusted.approvalSatisfied === true, String(trusted.approvalSatisfied));
  assert('20. approval satisfied false', approvalPending.approvalSatisfied === false, String(approvalPending.approvalSatisfied));
  assert('21. verification satisfied true', trusted.verificationSatisfied === true, String(trusted.verificationSatisfied));
  const badVerification = applyGate.evaluateApply({
    ...trustedInput('vga-bad-verify'),
    verificationResult: mockVerification('FAILED'),
  });
  assert('22. verification satisfied false', badVerification.verificationSatisfied === false, String(badVerification.verificationSatisfied));

  assert('23. reality satisfied true', trusted.realitySatisfied === true, String(trusted.realitySatisfied));
  assert('24. reality satisfied false', failedReality.realitySatisfied === false, String(failedReality.realitySatisfied));

  assert('25. contradiction count stored', contradiction.contradictionCount === 1, String(contradiction.contradictionCount));
  assert('26. evidence count stored', trusted.evidenceLinks.length >= 1, String(trusted.evidenceLinks.length));

  const evidenceInput: ApplyGateInput = {
    packageId: 'vga-evidence',
    verificationResult: pipeline.verification,
    approvalRecord: pipeline.approval,
    realityResult: pipeline.realityResult,
    recoveryChain: pipeline.chain,
    autoFixRecord: pipeline.autoFixRecord,
    rollbackRetryPlan: pipeline.rollbackPlan,
    ledgerRecord: pipeline.ledgerRecord,
  };
  const evidenceRecord = applyGate.evaluateApply(evidenceInput);

  assert('27. evidence from reality attached', countApplyEvidenceBySource(evidenceRecord.evidenceLinks, 'reality') >= 1, `${countApplyEvidenceBySource(evidenceRecord.evidenceLinks, 'reality')}`);
  assert('28. evidence from ledger attached', countApplyEvidenceBySource(evidenceRecord.evidenceLinks, 'ledger') >= 1, `${countApplyEvidenceBySource(evidenceRecord.evidenceLinks, 'ledger')}`);
  assert('29. evidence from recovery chains attached', countApplyEvidenceBySource(evidenceRecord.evidenceLinks, 'recovery_chains') >= 1, `${countApplyEvidenceBySource(evidenceRecord.evidenceLinks, 'recovery_chains')}`);
  assert('30. evidence from auto-fix attached', countApplyEvidenceBySource(evidenceRecord.evidenceLinks, 'auto_fix_control') >= 1, `${countApplyEvidenceBySource(evidenceRecord.evidenceLinks, 'auto_fix_control')}`);
  assert('31. evidence from rollback/retry attached', countApplyEvidenceBySource(evidenceRecord.evidenceLinks, 'rollback_retry_engine') >= 1, `${countApplyEvidenceBySource(evidenceRecord.evidenceLinks, 'rollback_retry_engine')}`);

  const states = trusted.stateSequence;
  assert('32. apply input state', applyStateIncludes(states, 'APPLY_INPUT_RECEIVED'), states.join(' → '));
  assert('33. readiness evaluated state', applyStateIncludes(states, 'READINESS_EVALUATED'), states.join(' → '));
  assert('34. policy check state', applyStateIncludes(states, 'POLICY_CHECK_COMPLETED'), states.join(' → '));
  assert('35. risk evaluated state', applyStateIncludes(states, 'RISK_EVALUATED'), states.join(' → '));
  assert('36. evidence attached state', applyStateIncludes(states, 'EVIDENCE_ATTACHED'), states.join(' → '));
  assert('37. apply allowed state', applyStateIncludes(states, 'APPLY_ALLOWED'), states.join(' → '));
  assert('38. apply blocked state', applyStateIncludes(failedReality.stateSequence, 'APPLY_BLOCKED'), failedReality.stateSequence.join(' → '));
  assert('39. apply pending approval state', applyStateIncludes(approvalPending.stateSequence, 'APPLY_PENDING_APPROVAL'), approvalPending.stateSequence.join(' → '));
  assert('40. apply record created state', applyStateIncludes(states, 'APPLY_RECORD_CREATED'), states.join(' → '));

  const reportText = formatVerificationGatedApplyReport(applyGate.getGateState(), applyGate.getRecords());
  assert('41. report contains apply record id', reportText.includes('Apply record ID:'), 'apply record id');
  assert('42. report contains package id', reportText.includes('Package ID:'), 'package id');
  assert('43. report contains readiness state', reportText.includes('Readiness state:'), 'readiness state');
  assert('44. report contains verdict', reportText.includes('Apply verdict:'), 'verdict');
  assert('45. report contains risk level', reportText.includes('Risk level:'), 'risk level');
  assert('46. report contains contradiction count', reportText.includes('Contradiction count:'), 'contradiction count');
  assert('47. report contains evidence count', reportText.includes('Evidence count:'), 'evidence count');
  assert('48. report confirms decision gate only', reportText.includes('Decision gate only: CONFIRMED'), 'decision gate');
  assert('49. report confirms no execution occurred', reportText.includes('No execution occurred: CONFIRMED'), 'no execution');
  assert('50. report confirms no files modified', reportText.includes('No files modified: CONFIRMED'), 'no files modified');

  assert('51. duplicate check passes', DevPulseV2VerificationGatedApply.assertDuplicateCheckPasses(), 'distinct ownership');

  const owner = getDevPulseV2Owner('verification_gated_apply');
  assert(
    '52. registry contains verification_gated_apply',
    owner.ownerModule === VERIFICATION_GATED_APPLY_OWNER_MODULE && owner.phase === 6.11,
    owner.ownerModule,
  );

  const depSummary = applyGate.getDependencySummary();
  assert('53. dependency reality present', depSummary.includes('execution_reality_validation@6.6'), depSummary);
  assert('54. dependency ledger present', depSummary.includes('execution_evidence_ledger@6.7'), depSummary);
  assert('55. dependency recovery chains present', depSummary.includes('recovery_chains@6.8'), depSummary);
  assert('56. dependency auto fix present', depSummary.includes('auto_fix_control_panel@6.9'), depSummary);
  assert('57. dependency rollback/retry present', depSummary.includes('rollback_retry_engine@6.10'), depSummary);

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('58. typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  assert('59. no execution path exists', DevPulseV2VerificationGatedApply.assertDoesNotExecute(), 'no executeApply');
  assert('60. no rollback path exists', DevPulseV2VerificationGatedApply.assertNoRollbackPath(), 'no performRollback');
  assert('61. no retry path exists', DevPulseV2VerificationGatedApply.assertNoRetryPath(), 'no performRetry');
  assert('62. no file modification path exists', DevPulseV2VerificationGatedApply.assertNoFileModificationPath(), 'no modifyFiles');

  const checks = runApplyGateChecks(trustedInput('vga-deterministic'));
  const risk = evaluateApplyRisk(trustedInput('vga-deterministic'), checks);
  const keyA = policyOutputKey(checks, risk);
  const keyB = policyOutputKey(checks, risk);
  assert('63. deterministic policy output', keyA === keyB, keyA);

  const readinessA = readinessOutputKey(evaluateApplyReadiness(checks));
  const readinessB = readinessOutputKey(evaluateApplyReadiness(checks));
  assert('64. deterministic readiness output', readinessA === readinessB, readinessA);

  const planA = evaluateVerificationGatedApply(trustedInput('vga-deterministic-a'));
  const planB = evaluateVerificationGatedApply(trustedInput('vga-deterministic-b'));
  assert('65. deterministic verdict output', applyRecordStructuralKey(planA) === applyRecordStructuralKey(planB), applyRecordStructuralKey(planA));

  void verdictOutputKey;

  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
  }

  const failed = results.filter((r) => !r.passed);
  console.log('======================================');
  if (failed.length === 0) {
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(VERIFICATION_GATED_APPLY_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:verification-gated-apply');
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
