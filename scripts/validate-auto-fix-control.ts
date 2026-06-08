/**
 * DevPulse V2 Auto-Fix Control Panel — validation scenarios.
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
import {
  planRecoveryChainFromContext,
  resetDevPulseV2RecoveryChainsForTests,
} from '../src/recovery-chains/index.js';
import {
  classifyFixType,
  countAutoFixEvidenceBySource,
  DevPulseV2AutoFixControlPanel,
  fixStateIncludes,
  formatAutoFixControlReport,
  AUTO_FIX_CONTROL_OWNER_MODULE,
  AUTO_FIX_CONTROL_PASS_TOKEN,
  resetDevPulseV2AutoFixControlPanelForTests,
} from '../src/auto-fix-control/index.js';
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
    metadata: { source: 'auto-fix-test', ...flags.metadata },
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
  return { verification, recovery, approval, realityResult, ledgerRecord, chain };
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Auto-Fix Control Panel');
  console.log('====================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  const runtime = resetDevPulseV2ExecutionPackageRuntimeForTests();
  const verificationLoop = resetDevPulseV2ExecutionVerificationLoopForTests();
  const recoveryEngine = resetDevPulseV2RecoveryExecutionEngineForTests();
  const gate = resetDevPulseV2FounderApprovalExecutionGateForTests();
  const reality = resetDevPulseV2ExecutionRealityValidationForTests();
  const ledger = resetDevPulseV2ExecutionEvidenceLedgerForTests();
  const recoveryChains = resetDevPulseV2RecoveryChainsForTests();
  const panel = resetDevPulseV2AutoFixControlPanelForTests();

  const readPkg = createReadOnlyPackage({ packageId: 'afc-read', metadata: { source: 'test' } });
  const writePkg = blockedPackage('afc-write', 'write file', 'write', { requiresWrite: true });
  const recoveryPkg = blockedPackage('afc-recovery', 'rollback', 'rollback', { requiresRecovery: true });
  const autoPkg = blockedPackage('afc-auto', 'autonomous', 'autonomous', { requiresAutonomy: true });

  const readPipeline = runFullPipeline(readPkg, runtime, verificationLoop, recoveryEngine, gate, reality, ledger, recoveryChains);
  const writePipeline = runFullPipeline(writePkg, runtime, verificationLoop, recoveryEngine, gate, reality, ledger, recoveryChains);
  runFullPipeline(recoveryPkg, runtime, verificationLoop, recoveryEngine, gate, reality, ledger, recoveryChains);
  const autoPipeline = runFullPipeline(autoPkg, runtime, verificationLoop, recoveryEngine, gate, reality, ledger, recoveryChains);

  const monitorChain = planRecoveryChainFromContext({
    packageId: 'afc-monitor',
    failureType: 'MONITOR_ONLY',
    runtimeRecord: null,
    verificationResult: null,
    recoveryRecord: null,
    approvalRecord: null,
    realityResult: null,
    ledgerRecord: null,
  });
  const configChain = planRecoveryChainFromContext({
    packageId: 'afc-config',
    failureType: 'MISSING_APPROVAL',
    runtimeRecord: writePipeline.chain.recoverySteps.length > 0 ? runtime.getRecord('afc-write')! : null,
    verificationResult: writePipeline.verification,
    recoveryRecord: writePipeline.recovery,
    approvalRecord: null,
    realityResult: writePipeline.realityResult,
    ledgerRecord: null,
  });
  const recoveryChainPlan = planRecoveryChainFromContext({
    packageId: 'afc-recovery-plan',
    failureType: 'FAILED_VERIFICATION',
    runtimeRecord: runtime.getRecord('afc-recovery')!,
    verificationResult: writePipeline.verification,
    recoveryRecord: writePipeline.recovery,
    approvalRecord: writePipeline.approval,
    realityResult: writePipeline.realityResult,
    ledgerRecord: null,
  });
  const rollbackChainPlan = planRecoveryChainFromContext({
    packageId: 'afc-rollback',
    failureType: 'FAILED_VERIFICATION',
    rollbackRequired: true,
    runtimeRecord: runtime.getRecord('afc-recovery')!,
    verificationResult: writePipeline.verification,
    recoveryRecord: writePipeline.recovery,
    approvalRecord: writePipeline.approval,
    realityResult: writePipeline.realityResult,
    ledgerRecord: null,
  });

  assert(
    '1. read-only fix classified correctly',
    classifyFixType({ packageId: 't', fixType: 'READ_ONLY_FIX' }) === 'READ_ONLY_FIX' &&
      classifyFixType({ packageId: 't', recoveryChain: monitorChain }) === 'READ_ONLY_FIX',
    'READ_ONLY_FIX',
  );
  assert(
    '2. configuration fix classified correctly',
    classifyFixType({ packageId: 't', fixType: 'CONFIGURATION_FIX' }) === 'CONFIGURATION_FIX' &&
      classifyFixType({ packageId: 't', recoveryChain: configChain }) === 'CONFIGURATION_FIX',
    'CONFIGURATION_FIX',
  );
  assert(
    '3. recovery fix classified correctly',
    classifyFixType({ packageId: 't', fixType: 'RECOVERY_FIX' }) === 'RECOVERY_FIX' &&
      classifyFixType({ packageId: 't', recoveryChain: recoveryChainPlan }) === 'RECOVERY_FIX',
    'RECOVERY_FIX',
  );
  assert(
    '4. rollback fix classified correctly',
    classifyFixType({ packageId: 't', fixType: 'ROLLBACK_FIX' }) === 'ROLLBACK_FIX' &&
      classifyFixType({ packageId: 't', recoveryChain: rollbackChainPlan }) === 'ROLLBACK_FIX',
    'ROLLBACK_FIX',
  );
  assert(
    '5. autonomy fix classified correctly',
    classifyFixType({ packageId: 't', fixType: 'AUTONOMY_FIX' }) === 'AUTONOMY_FIX' &&
      classifyFixType({ packageId: 't', recoveryChain: autoPipeline.chain }) === 'AUTONOMY_FIX',
    'AUTONOMY_FIX',
  );

  const readFix = panel.evaluateFixType('afc-read', 'READ_ONLY_FIX');
  const configFix = panel.evaluateFixType('afc-config', 'CONFIGURATION_FIX');
  const recoveryFix = panel.evaluateFixType('afc-recovery-plan', 'RECOVERY_FIX');
  const rollbackFix = panel.evaluateFixType('afc-rollback', 'ROLLBACK_FIX');
  const autonomyFix = panel.evaluateFixType('afc-auto', 'AUTONOMY_FIX');
  const world2Fix = panel.evaluateFix({ packageId: 'afc-world2', fixType: 'WORLD2_FIX', world2Related: true });

  assert('6. read-only fix allowed', readFix.permissionState === 'ALLOWED', readFix.permissionState);
  assert('7. configuration fix pending approval', configFix.permissionState === 'PENDING_APPROVAL', configFix.permissionState);
  assert('8. recovery fix pending approval', recoveryFix.permissionState === 'PENDING_APPROVAL', recoveryFix.permissionState);
  assert('9. rollback fix pending approval', rollbackFix.permissionState === 'PENDING_APPROVAL', rollbackFix.permissionState);
  assert('10. autonomy fix blocked', autonomyFix.permissionState === 'BLOCKED', autonomyFix.permissionState);
  assert('11. world2 fix blocked', world2Fix.permissionState === 'BLOCKED', world2Fix.permissionState);

  assert('12. allowed state supported', readFix.permissionState === 'ALLOWED', readFix.permissionState);
  assert('13. blocked state supported', autonomyFix.permissionState === 'BLOCKED', autonomyFix.permissionState);
  assert('14. pending state supported', configFix.permissionState === 'PENDING_APPROVAL', configFix.permissionState);

  const pendingForReject = panel.evaluateFixType('afc-reject', 'CONFIGURATION_FIX');
  const rejected = panel.rejectFix(pendingForReject.fixId);
  assert('15. rejected state supported', rejected?.permissionState === 'REJECTED', rejected?.permissionState ?? 'null');

  const pendingForAllow = panel.evaluateFixType('afc-allow', 'CONFIGURATION_FIX');
  const allowed = panel.allowFix(pendingForAllow.fixId);
  assert('16. allowFix works', allowed?.permissionState === 'ALLOWED', allowed?.permissionState ?? 'null');

  const pendingForBlock = panel.evaluateFixType('afc-block', 'RECOVERY_FIX');
  const blocked = panel.blockFix(pendingForBlock.fixId);
  assert('17. blockFix works', blocked?.permissionState === 'BLOCKED', blocked?.permissionState ?? 'null');

  const rejectResult = panel.rejectFix(pendingForReject.fixId);
  assert('18. rejectFix works', rejectResult?.permissionState === 'REJECTED', rejectResult?.permissionState ?? 'null');

  const fetched = panel.getFixPermission(readFix.fixId);
  assert('19. getFixPermission works', fetched?.fixId === readFix.fixId, fetched?.fixId ?? 'null');

  const all = panel.getAllFixPermissions();
  assert('20. getAllFixPermissions works', all.length >= 8, `${all.length} permissions`);

  const evidenceFix = panel.evaluateFix({
    packageId: 'afc-write',
    fixType: 'CONFIGURATION_FIX',
    recoveryChain: writePipeline.chain,
    approvalRecord: writePipeline.approval,
    realityResult: writePipeline.realityResult,
    ledgerRecord: writePipeline.ledgerRecord,
  });

  assert('21. evidence link from recovery chains', countAutoFixEvidenceBySource(evidenceFix.evidenceLinks, 'recovery_chains') >= 1, `${countAutoFixEvidenceBySource(evidenceFix.evidenceLinks, 'recovery_chains')}`);
  assert('22. evidence link from approval', countAutoFixEvidenceBySource(evidenceFix.evidenceLinks, 'approval') >= 1, `${countAutoFixEvidenceBySource(evidenceFix.evidenceLinks, 'approval')}`);
  assert('23. evidence link from reality', countAutoFixEvidenceBySource(evidenceFix.evidenceLinks, 'reality') >= 1, `${countAutoFixEvidenceBySource(evidenceFix.evidenceLinks, 'reality')}`);
  assert('24. evidence link from ledger', countAutoFixEvidenceBySource(evidenceFix.evidenceLinks, 'ledger') >= 1, `${countAutoFixEvidenceBySource(evidenceFix.evidenceLinks, 'ledger')}`);

  assert('25. approvalRequired true supported', configFix.approvalRequired === true, String(configFix.approvalRequired));
  assert('26. approvalRequired false supported', readFix.approvalRequired === false, String(readFix.approvalRequired));
  assert('27. verificationRequired true supported', recoveryFix.verificationRequired === true, String(recoveryFix.verificationRequired));
  assert('28. verificationRequired false supported', readFix.verificationRequired === false, String(readFix.verificationRequired));

  const states = configFix.stateSequence;
  assert('29. fix discovered state', fixStateIncludes(states, 'FIX_DISCOVERED'), states.join(' → '));
  assert('30. fix classified state', fixStateIncludes(states, 'FIX_CLASSIFIED'), states.join(' → '));
  assert('31. permission evaluated state', fixStateIncludes(states, 'FIX_PERMISSION_EVALUATED'), states.join(' → '));
  assert('32. fix pending state', fixStateIncludes(states, 'FIX_PENDING'), states.join(' → '));
  assert('33. fix allowed state', fixStateIncludes(readFix.stateSequence, 'FIX_ALLOWED'), readFix.stateSequence.join(' → '));
  assert('34. fix blocked state', fixStateIncludes(autonomyFix.stateSequence, 'FIX_BLOCKED'), autonomyFix.stateSequence.join(' → '));
  assert('35. fix rejected state', fixStateIncludes(rejected!.stateSequence, 'FIX_REJECTED'), rejected!.stateSequence.join(' → '));
  assert('36. fix record created state', fixStateIncludes(states, 'FIX_RECORD_CREATED'), states.join(' → '));

  const reportText = formatAutoFixControlReport(panel.getPanelState(), panel.getAllFixPermissions());
  assert('37. report contains fix id', reportText.includes('Fix ID:'), 'fix id line');
  assert('38. report contains package id', reportText.includes('Package ID:'), 'package id line');
  assert('39. report contains fix type', reportText.includes('Fix type:'), 'fix type line');
  assert('40. report contains permission state', reportText.includes('Permission state:'), 'permission state line');
  assert('41. report contains evidence count', reportText.includes('Evidence count:'), 'evidence count line');
  assert('42. report contains risk level', reportText.includes('Risk level:'), 'risk level line');
  assert('43. report confirms control layer only', reportText.includes('Control layer only: CONFIRMED'), 'control layer');
  assert('44. report confirms no fix executed', reportText.includes('No fix executed: CONFIRMED'), 'no fix executed');

  assert('45. duplicate check passes', DevPulseV2AutoFixControlPanel.assertDuplicateCheckPasses(), 'no duplicate ownership');

  const owner = getDevPulseV2Owner('auto_fix_control_panel');
  assert(
    '46. registry contains auto_fix_control_panel',
    owner.ownerModule === AUTO_FIX_CONTROL_OWNER_MODULE && owner.phase === 6.9,
    owner.ownerModule,
  );

  const depSummary = panel.getDependencySummary();
  assert('47. recovery chain dependency present', depSummary.includes('recovery_chains@6.8'), depSummary);
  assert('48. approval dependency present', depSummary.includes('founder_approval_execution_gate@6.5'), depSummary);
  assert('49. reality dependency present', depSummary.includes('execution_reality_validation@6.6'), depSummary);
  assert('50. ledger dependency present', depSummary.includes('execution_evidence_ledger@6.7'), depSummary);

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('51. typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  assert('52. no execution path exists', DevPulseV2AutoFixControlPanel.assertNoExecutionPath(), 'no executeFix');
  assert('53. no rollback path exists', DevPulseV2AutoFixControlPanel.assertNoRollbackPath(), 'no performRollback');
  assert('54. no retry path exists', DevPulseV2AutoFixControlPanel.assertNoRetryPath(), 'no performRetry');
  assert('55. no file modification path exists', DevPulseV2AutoFixControlPanel.assertNoFileModificationPath(), 'no modifyFiles');

  void readPipeline;

  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
  }

  const failed = results.filter((r) => !r.passed);
  console.log('====================================');
  if (failed.length === 0) {
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(AUTO_FIX_CONTROL_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:auto-fix-control');
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
