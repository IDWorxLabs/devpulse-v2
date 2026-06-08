/**
 * DevPulse V2 Rollback & Retry Engine — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import {
  createReadOnlyPackage,
  resetDevPulseV2ExecutionPackageRuntimeForTests,
} from '../src/execution-runtime/index.js';
import { resetDevPulseV2ExecutionVerificationLoopForTests } from '../src/execution-verification/index.js';
import { resetDevPulseV2RecoveryExecutionEngineForTests } from '../src/recovery-execution/index.js';
import { resetDevPulseV2FounderApprovalExecutionGateForTests } from '../src/founder-approval-execution/index.js';
import { resetDevPulseV2ExecutionRealityValidationForTests } from '../src/execution-reality-validation/index.js';
import { resetDevPulseV2ExecutionEvidenceLedgerForTests } from '../src/execution-evidence-ledger/index.js';
import { resetDevPulseV2RecoveryChainsForTests } from '../src/recovery-chains/index.js';
import { resetDevPulseV2AutoFixControlPanelForTests } from '../src/auto-fix-control/index.js';
import {
  CheckpointStore,
  countEvidenceBySource,
  createRollbackRetryPlan,
  DevPulseV2RollbackRetryEngine,
  engineStateIncludes,
  evaluateRollbackRetryPolicy,
  formatRollbackRetryReport,
  planStructuralKey,
  policyOutputKey,
  ROLLBACK_RETRY_ENGINE_OWNER_MODULE,
  ROLLBACK_RETRY_ENGINE_PASS_TOKEN,
  resetDevPulseV2RollbackRetryEngineForTests,
} from '../src/rollback-retry-engine/index.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { resetDevPulseV2TimelineLedgerAuthorityForTests } from '../src/timeline-ledger/timeline-ledger-authority.js';
import type { RollbackRetryPlanInput } from '../src/rollback-retry-engine/types.js';

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
    metadata: { source: 'rollback-retry-test', ...flags.metadata },
    requiresWrite: false,
    requiresCommand: false,
    requiresRecovery: false,
    requiresAutonomy: false,
    ...flags,
  });
}

function emptyInput(packageId: string, scenario: RollbackRetryPlanInput['failureScenario']): RollbackRetryPlanInput {
  return {
    packageId,
    failureScenario: scenario,
    runtimeRecord: null,
    verificationResult: null,
    recoveryChain: null,
    autoFixRecord: null,
    approvalRecord: null,
    realityResult: null,
    ledgerRecord: null,
  };
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
    failureType: pkg.requiresAutonomy ? 'AUTONOMY_FAILURE' : undefined,
  });
  const autoFixRecord = autoFix.evaluateFixType(pkg.packageId, 'CONFIGURATION_FIX');
  return { verification, recovery, approval, realityResult, ledgerRecord, chain, autoFixRecord };
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Rollback & Retry Engine');
  console.log('=====================================');
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
  const engine = resetDevPulseV2RollbackRetryEngineForTests();

  const writePkg = blockedPackage('rr-write', 'write file', 'write', { requiresWrite: true });
  const autoPkg = blockedPackage('rr-auto', 'autonomous', 'autonomous', { requiresAutonomy: true });
  const writePipeline = runFullPipeline(writePkg, runtime, verificationLoop, recoveryEngine, gate, reality, ledger, recoveryChains, autoFix);
  runFullPipeline(autoPkg, runtime, verificationLoop, recoveryEngine, gate, reality, ledger, recoveryChains, autoFix);

  const missingRuntimePlan = engine.planRollbackRetry(emptyInput('rr-missing-runtime', 'MISSING_RUNTIME'));
  const missingVerificationPlan = engine.planRollbackRetry(emptyInput('rr-missing-verify', 'MISSING_VERIFICATION'));
  const contradictionPlan = engine.planRollbackRetry(emptyInput('rr-contradiction', 'CONTRADICTION_PRESENT'));
  const failedRealityPlan = engine.planRollbackRetry(emptyInput('rr-failed-reality', 'FAILED_REALITY_VALIDATION'));
  const autonomyPlan = engine.planRollbackRetry(emptyInput('rr-autonomy', 'AUTONOMY_FAILURE'));

  assert('1. missing runtime => retry required', missingRuntimePlan.retryState === 'RETRY_REQUIRED', missingRuntimePlan.retryState);
  assert('2. missing verification => retry required', missingVerificationPlan.retryState === 'RETRY_REQUIRED', missingVerificationPlan.retryState);
  assert('3. contradiction => rollback recommended', contradictionPlan.rollbackState === 'ROLLBACK_RECOMMENDED', contradictionPlan.rollbackState);
  assert('4. failed reality => rollback required', failedRealityPlan.rollbackState === 'ROLLBACK_REQUIRED', failedRealityPlan.rollbackState);
  assert('5. autonomy failure => rollback required', autonomyPlan.rollbackState === 'ROLLBACK_REQUIRED', autonomyPlan.rollbackState);

  const notRequiredPlan = engine.planRollbackRetry(emptyInput('rr-none', 'NONE'));
  const wrongGatePlan = engine.planRollbackRetry(emptyInput('rr-wrong-gate', 'WRONG_GATE_MAPPING'));

  assert('6. rollback not required supported', notRequiredPlan.rollbackState === 'ROLLBACK_NOT_REQUIRED', notRequiredPlan.rollbackState);
  assert('7. rollback recommended supported', contradictionPlan.rollbackState === 'ROLLBACK_RECOMMENDED', contradictionPlan.rollbackState);
  assert('8. rollback required supported', failedRealityPlan.rollbackState === 'ROLLBACK_REQUIRED', failedRealityPlan.rollbackState);

  assert('9. retry not required supported', notRequiredPlan.retryState === 'RETRY_NOT_REQUIRED', notRequiredPlan.retryState);
  assert('10. retry recommended supported', contradictionPlan.retryState === 'RETRY_RECOMMENDED', contradictionPlan.retryState);
  assert('11. retry required supported', missingRuntimePlan.retryState === 'RETRY_REQUIRED', missingRuntimePlan.retryState);

  assert('12. checkpoint selected', missingRuntimePlan.checkpoint.checkpointId.length > 0, missingRuntimePlan.checkpoint.checkpointId);
  assert('13. checkpoint confidence stored', missingRuntimePlan.checkpoint.confidence === 'MEDIUM', missingRuntimePlan.checkpoint.confidence);
  assert('14. checkpoint reason stored', missingRuntimePlan.checkpoint.checkpointReason.length > 0, missingRuntimePlan.checkpoint.checkpointReason);

  const approvalRequiredPlan = engine.planRollbackRetry(emptyInput('rr-approval', 'AUTONOMY_FAILURE'));
  const noApprovalPlan = engine.planRollbackRetry(emptyInput('rr-no-approval', 'NONE'));
  assert('15. approval required true supported', approvalRequiredPlan.approvalRequired === true, String(approvalRequiredPlan.approvalRequired));
  assert('16. approval required false supported', noApprovalPlan.approvalRequired === false, String(noApprovalPlan.approvalRequired));
  assert('17. verification required true supported', wrongGatePlan.verificationRequired === true, String(wrongGatePlan.verificationRequired));
  assert('18. verification required false supported', noApprovalPlan.verificationRequired === false, String(noApprovalPlan.verificationRequired));

  const evidencePlan = engine.planRollbackRetry({
    packageId: 'rr-write',
    failureScenario: 'WRONG_GATE_MAPPING',
    runtimeRecord: runtime.getRecord('rr-write') ?? null,
    verificationResult: writePipeline.verification,
    recoveryChain: writePipeline.chain,
    autoFixRecord: writePipeline.autoFixRecord,
    approvalRecord: writePipeline.approval,
    realityResult: writePipeline.realityResult,
    ledgerRecord: writePipeline.ledgerRecord,
  });

  assert('19. evidence from recovery chains attached', countEvidenceBySource(evidencePlan.evidenceLinks, 'recovery_chains') >= 1, `${countEvidenceBySource(evidencePlan.evidenceLinks, 'recovery_chains')}`);
  assert('20. evidence from auto-fix attached', countEvidenceBySource(evidencePlan.evidenceLinks, 'auto_fix_control') >= 1, `${countEvidenceBySource(evidencePlan.evidenceLinks, 'auto_fix_control')}`);
  assert('21. evidence from approval attached', countEvidenceBySource(evidencePlan.evidenceLinks, 'approval') >= 1, `${countEvidenceBySource(evidencePlan.evidenceLinks, 'approval')}`);
  assert('22. evidence from reality attached', countEvidenceBySource(evidencePlan.evidenceLinks, 'reality') >= 1, `${countEvidenceBySource(evidencePlan.evidenceLinks, 'reality')}`);
  assert('23. evidence from ledger attached', countEvidenceBySource(evidencePlan.evidenceLinks, 'ledger') >= 1, `${countEvidenceBySource(evidencePlan.evidenceLinks, 'ledger')}`);

  const states = missingRuntimePlan.stateSequence;
  assert('24. input received state', engineStateIncludes(states, 'INPUT_RECEIVED'), states.join(' → '));
  assert('25. failure classified state', engineStateIncludes(states, 'FAILURE_CLASSIFIED'), states.join(' → '));
  assert('26. checkpoint selected state', engineStateIncludes(states, 'CHECKPOINT_SELECTED'), states.join(' → '));
  assert('27. rollback evaluated state', engineStateIncludes(states, 'ROLLBACK_EVALUATED'), states.join(' → '));
  assert('28. retry evaluated state', engineStateIncludes(states, 'RETRY_EVALUATED'), states.join(' → '));
  assert('29. policy check completed state', engineStateIncludes(states, 'POLICY_CHECK_COMPLETED'), states.join(' → '));
  assert('30. evidence attached state', engineStateIncludes(states, 'EVIDENCE_ATTACHED'), states.join(' → '));
  assert('31. plan created state', engineStateIncludes(states, 'PLAN_CREATED'), states.join(' → '));

  const reportText = formatRollbackRetryReport(engine.getEngineState(), engine.getPlans());
  assert('32. rollback report contains plan id', reportText.includes('Plan ID:'), 'plan id line');
  assert('33. rollback report contains package id', reportText.includes('Package ID:'), 'package id line');
  assert('34. rollback report contains rollback state', reportText.includes('Rollback state:'), 'rollback state line');
  assert('35. rollback report contains retry state', reportText.includes('Retry state:'), 'retry state line');
  assert('36. rollback report contains checkpoint id', reportText.includes('Checkpoint ID:'), 'checkpoint id line');
  assert('37. rollback report contains evidence count', reportText.includes('Evidence count:'), 'evidence count line');
  assert('38. report confirms planning only', reportText.includes('Planning only: CONFIRMED'), 'planning only');
  assert('39. report confirms no rollback executed', reportText.includes('No rollback executed: CONFIRMED'), 'no rollback');
  assert('40. report confirms no retry executed', reportText.includes('No retry executed: CONFIRMED'), 'no retry');

  assert('41. duplicate check passes', DevPulseV2RollbackRetryEngine.assertDuplicateCheckPasses(), 'distinct ownership');

  const owner = getDevPulseV2Owner('rollback_retry_engine');
  assert(
    '42. registry contains rollback_retry_engine',
    owner.ownerModule === ROLLBACK_RETRY_ENGINE_OWNER_MODULE && owner.phase === 6.10,
    owner.ownerModule,
  );

  const depSummary = engine.getDependencySummary();
  assert('43. dependency recovery chains present', depSummary.includes('recovery_chains@6.8'), depSummary);
  assert('44. dependency auto fix present', depSummary.includes('auto_fix_control_panel@6.9'), depSummary);
  assert('45. dependency approval present', depSummary.includes('founder_approval_execution_gate@6.5'), depSummary);
  assert('46. dependency reality present', depSummary.includes('execution_reality_validation@6.6'), depSummary);
  assert('47. dependency ledger present', depSummary.includes('execution_evidence_ledger@6.7'), depSummary);

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('48. typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  assert('49. no file modification path exists', DevPulseV2RollbackRetryEngine.assertNoFileModificationPath(), 'no modifyFiles');
  assert('50. no rollback execution path exists', DevPulseV2RollbackRetryEngine.assertNoRollbackExecutionPath(), 'no executeRollback');
  assert('51. no retry execution path exists', DevPulseV2RollbackRetryEngine.assertNoRetryExecutionPath(), 'no executeRetry');

  const lowPlan = engine.planRollbackRetry(emptyInput('rr-low', 'NONE'));
  const mediumPlan = engine.planRollbackRetry(emptyInput('rr-medium', 'MISSING_RUNTIME'));
  const highPlan = engine.planRollbackRetry(emptyInput('rr-high', 'WRONG_GATE_MAPPING'));
  const criticalPlan = engine.planRollbackRetry(emptyInput('rr-critical', 'AUTONOMY_FAILURE'));

  assert('52. low risk supported', lowPlan.riskLevel === 'LOW', lowPlan.riskLevel);
  assert('53. medium risk supported', mediumPlan.riskLevel === 'MEDIUM', mediumPlan.riskLevel);
  assert('54. high risk supported', highPlan.riskLevel === 'HIGH', highPlan.riskLevel);
  assert('55. critical risk supported', criticalPlan.riskLevel === 'CRITICAL', criticalPlan.riskLevel);

  engine.registerAdditionalCheckpoints('rr-multi');
  const multiCheckpoints = engine.getCheckpoints('rr-multi');
  assert('56. multiple checkpoints supported', multiCheckpoints.length >= 2, `${multiCheckpoints.length} checkpoints`);

  const lookup = engine.lookupCheckpoint(missingRuntimePlan.checkpoint.checkpointId);
  assert('57. checkpoint lookup works', lookup?.checkpointId === missingRuntimePlan.checkpoint.checkpointId, lookup?.checkpointId ?? 'null');

  assert('58. evidence count correct', evidencePlan.evidenceLinks.length === 5, `${evidencePlan.evidenceLinks.length}`);

  const keyA = policyOutputKey('MISSING_RUNTIME');
  const keyB = policyOutputKey('MISSING_RUNTIME');
  assert('59. policy engine output deterministic', keyA === keyB, keyA);

  const store1 = new CheckpointStore();
  const store2 = new CheckpointStore();
  const input: RollbackRetryPlanInput = emptyInput('rr-deterministic', 'MISSING_VERIFICATION');
  const planA = createRollbackRetryPlan(input, store1);
  const planB = createRollbackRetryPlan(input, store2);
  assert('60. plan generation deterministic', planStructuralKey(planA) === planStructuralKey(planB), planStructuralKey(planA));

  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
  }

  const failed = results.filter((r) => !r.passed);
  console.log('=====================================');
  if (failed.length === 0) {
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(ROLLBACK_RETRY_ENGINE_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:rollback-retry');
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
