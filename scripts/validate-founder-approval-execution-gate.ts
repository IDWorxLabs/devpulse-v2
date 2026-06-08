/**
 * DevPulse V2 Founder Approval Execution Gate — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { execSync } from 'node:child_process';
import {
  createReadOnlyPackage,
  resetDevPulseV2ExecutionPackageRuntimeForTests,
} from '../src/execution-runtime/index.js';
import {
  resetDevPulseV2ExecutionVerificationLoopForTests,
} from '../src/execution-verification/index.js';
import {
  resetDevPulseV2RecoveryExecutionEngineForTests,
} from '../src/recovery-execution/index.js';
import {
  approvalStateIncludes,
  APPROVAL_GATE_OWNER_MODULE,
  APPROVAL_GATE_PASS_TOKEN,
  DevPulseV2FounderApprovalExecutionGate,
  formatFounderApprovalReport,
  resetDevPulseV2FounderApprovalExecutionGateForTests,
  riskAtLeast,
  runConstitutionCheck,
} from '../src/founder-approval-execution/index.js';
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
    metadata: { source: 'approval-test', ...flags.metadata },
    requiresWrite: false,
    requiresCommand: false,
    requiresRecovery: false,
    requiresAutonomy: false,
    ...flags,
  });
}

function runPipeline(
  pkg: ReturnType<typeof createReadOnlyPackage>,
  verificationLoop: ReturnType<typeof resetDevPulseV2ExecutionVerificationLoopForTests>,
  recoveryEngine: ReturnType<typeof resetDevPulseV2RecoveryExecutionEngineForTests>,
  runtime: ReturnType<typeof resetDevPulseV2ExecutionPackageRuntimeForTests>,
) {
  runtime.processPackage(pkg);
  const verification = verificationLoop.verifyPackage(pkg.packageId);
  const recovery = recoveryEngine.planRecovery(verification);
  return { verification, recovery };
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Founder Approval Execution Gate Validation');
  console.log('=========================================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  const runtime = resetDevPulseV2ExecutionPackageRuntimeForTests();
  const verificationLoop = resetDevPulseV2ExecutionVerificationLoopForTests();
  const recoveryEngine = resetDevPulseV2RecoveryExecutionEngineForTests();
  const gate = resetDevPulseV2FounderApprovalExecutionGateForTests();

  const readPipeline = runPipeline(
    createReadOnlyPackage({ packageId: 'fa-read', metadata: { source: 'test' } }),
    verificationLoop,
    recoveryEngine,
    runtime,
  );
  const writePipeline = runPipeline(
    blockedPackage('fa-write', 'write file', 'write', { requiresWrite: true }),
    verificationLoop,
    recoveryEngine,
    runtime,
  );
  const modPipeline = runPipeline(
    blockedPackage('fa-mod', 'apply patch', 'apply', { requiresWrite: true }),
    verificationLoop,
    recoveryEngine,
    runtime,
  );
  const recoveryPipeline = runPipeline(
    blockedPackage('fa-recovery', 'rollback to checkpoint', 'rollback', { requiresRecovery: true }),
    verificationLoop,
    recoveryEngine,
    runtime,
  );
  const autoPipeline = runPipeline(
    blockedPackage('fa-auto', 'continue autonomously', 'autonomous', { requiresAutonomy: true }),
    verificationLoop,
    recoveryEngine,
    runtime,
  );
  const world2Pipeline = runPipeline(
    blockedPackage('fa-world2', 'world2 sandbox action', 'world2', {
      metadata: { source: 'approval-test', world2_activity: 'true' },
    }),
    verificationLoop,
    recoveryEngine,
    runtime,
  );

  const readApproval = gate.evaluateApprovalRequest(readPipeline.recovery);
  const writeApproval = gate.evaluateApprovalRequest(writePipeline.recovery);
  const modApproval = gate.evaluateApprovalRequest(modPipeline.recovery);
  const recoveryApproval = gate.evaluateApprovalRequest(recoveryPipeline.recovery);
  const autoApproval = gate.evaluateApprovalRequest(autoPipeline.recovery);
  const world2Approval = gate.evaluateApprovalRequest(world2Pipeline.recovery);

  assert(
    '1. read-only package requires no approval',
    readApproval.approvalRequirement === 'NO_APPROVAL_REQUIRED',
    readApproval.approvalRequirement,
  );

  assert(
    '2. write package requires modification approval',
    writeApproval.approvalRequirement === 'APPROVAL_REQUIRED_MODIFICATION',
    writeApproval.approvalRequirement,
  );

  assert(
    '3. project modification requires modification approval',
    modApproval.approvalRequirement === 'APPROVAL_REQUIRED_MODIFICATION',
    modApproval.approvalRequirement,
  );

  assert(
    '4. recovery requires recovery approval',
    recoveryApproval.approvalRequirement === 'APPROVAL_REQUIRED_RECOVERY',
    recoveryApproval.approvalRequirement,
  );

  assert(
    '5. autonomy requires autonomy approval',
    autoApproval.approvalRequirement === 'APPROVAL_REQUIRED_AUTONOMY',
    autoApproval.approvalRequirement,
  );

  assert(
    '6. world2 activity requires autonomy approval',
    world2Approval.approvalRequirement === 'APPROVAL_REQUIRED_AUTONOMY',
    world2Approval.approvalRequirement,
  );

  assert(
    '7. low-risk read-only classified LOW',
    readApproval.riskLevel === 'LOW',
    readApproval.riskLevel,
  );

  assert(
    '8. write classified MEDIUM or higher',
    riskAtLeast(writeApproval.riskLevel, 'MEDIUM'),
    writeApproval.riskLevel,
  );

  assert(
    '9. recovery classified HIGH or higher',
    riskAtLeast(recoveryApproval.riskLevel, 'HIGH'),
    recoveryApproval.riskLevel,
  );

  assert(
    '10. autonomy classified CRITICAL',
    autoApproval.riskLevel === 'CRITICAL',
    autoApproval.riskLevel,
  );

  assert(
    '11. pending decision supported',
    writeApproval.decision === 'PENDING',
    writeApproval.decision,
  );

  const approved = gate.grantFounderApproval(writeApproval.approvalRequestId)!;
  assert(
    '12. approved decision supported',
    approved.decision === 'APPROVED',
    approved.decision,
  );

  const denyPipeline = runPipeline(
    blockedPackage('fa-deny', 'write file', 'write', { requiresWrite: true, packageId: 'fa-deny' }),
    verificationLoop,
    recoveryEngine,
    runtime,
  );
  const denyPending = gate.evaluateApprovalRequest(denyPipeline.recovery);
  const denied = gate.denyFounderApproval(denyPending.approvalRequestId)!;
  assert(
    '13. denied decision supported',
    denied.decision === 'DENIED',
    denied.decision,
  );

  assert(
    '14. pending state recorded',
    approvalStateIncludes(denyPending.stateSequence, 'APPROVAL_PENDING'),
    denyPending.stateSequence.join(' → '),
  );

  assert(
    '15. approved state recorded',
    approvalStateIncludes(approved.stateSequence, 'APPROVAL_GRANTED'),
    approved.stateSequence.join(' → '),
  );

  assert(
    '16. denied state recorded',
    approvalStateIncludes(denied.stateSequence, 'APPROVAL_DENIED'),
    denied.stateSequence.join(' → '),
  );

  assert(
    '17. constitution check completed',
    approvalStateIncludes(writeApproval.stateSequence, 'CONSTITUTION_CHECK_COMPLETED'),
    writeApproval.stateSequence.join(' → '),
  );

  assert(
    '18. risk evaluation completed',
    approvalStateIncludes(writeApproval.stateSequence, 'RISK_EVALUATED'),
    writeApproval.stateSequence.join(' → '),
  );

  assert(
    '19. approval requirement determined',
    approvalStateIncludes(writeApproval.stateSequence, 'APPROVAL_REQUIREMENT_DETERMINED'),
    writeApproval.stateSequence.join(' → '),
  );

  assert(
    '20. approval record created',
    approvalStateIncludes(readApproval.stateSequence, 'APPROVAL_RECORD_CREATED'),
    readApproval.stateSequence.join(' → '),
  );

  assert(
    '21. approval request contains package id',
    readApproval.packageId === 'fa-read',
    readApproval.packageId,
  );

  assert(
    '22. approval request contains verification id',
    readApproval.verificationId.length > 0,
    readApproval.verificationId,
  );

  assert(
    '23. approval request contains recovery plan id',
    readApproval.recoveryPlanId.length > 0,
    readApproval.recoveryPlanId,
  );

  const reportText = formatFounderApprovalReport(gate.getGateState(), gate.listRecords());
  assert(
    '24. approval report contains risk level',
    reportText.includes('Risk level:'),
    'risk level line',
  );

  assert(
    '25. approval report contains decision',
    reportText.includes('Decision:'),
    'decision line',
  );

  assert(
    '26. approval report contains constitutional rules',
    reportText.includes('Constitutional rules:'),
    'constitutional rules line',
  );

  assert(
    '27. approval report contains affected domains',
    reportText.includes('Affected domains:'),
    'affected domains line',
  );

  assert(
    '28. approval report contains future gate unlock',
    reportText.includes('Future gate unlocked if approved:'),
    'future gate line',
  );

  assert(
    '29. read-only approval path remains no-execution',
    readApproval.noExecutionOccurred === true,
    String(readApproval.noExecutionOccurred),
  );

  assert(
    '30. write approval path remains no-execution',
    writeApproval.noExecutionOccurred === true && approved.noExecutionOccurred === true,
    String(writeApproval.noExecutionOccurred),
  );

  assert(
    '31. recovery approval path remains no-execution',
    recoveryApproval.noExecutionOccurred === true,
    String(recoveryApproval.noExecutionOccurred),
  );

  assert(
    '32. autonomy approval path remains no-execution',
    autoApproval.noExecutionOccurred === true,
    String(autoApproval.noExecutionOccurred),
  );

  assert(
    '33. world2 approval path remains no-execution',
    world2Approval.noExecutionOccurred === true,
    String(world2Approval.noExecutionOccurred),
  );

  const writeRules = runConstitutionCheck(writePipeline.recovery);
  assert(
    '34. constitutional rule WRITE_OPERATION detected',
    writeRules.includes('WRITE_OPERATION'),
    writeRules.join(', '),
  );

  const modRules = runConstitutionCheck(modPipeline.recovery);
  assert(
    '35. constitutional rule PROJECT_MODIFICATION detected',
    modRules.includes('PROJECT_MODIFICATION'),
    modRules.join(', '),
  );

  const recoveryRules = runConstitutionCheck(recoveryPipeline.recovery);
  assert(
    '36. constitutional rule RECOVERY_ACTION detected',
    recoveryRules.includes('RECOVERY_ACTION'),
    recoveryRules.join(', '),
  );

  const autoRules = runConstitutionCheck(autoPipeline.recovery);
  assert(
    '37. constitutional rule AUTONOMOUS_ACTION detected',
    autoRules.includes('AUTONOMOUS_ACTION'),
    autoRules.join(', '),
  );

  const world2Rules = runConstitutionCheck(world2Pipeline.recovery);
  assert(
    '38. constitutional rule WORLD2_ACTIVITY detected',
    world2Rules.includes('WORLD2_ACTIVITY'),
    world2Rules.join(', '),
  );

  const owner = getDevPulseV2Owner('founder_approval_execution_gate');
  assert(
    '39. registry contains founder_approval_execution_gate',
    owner.ownerModule === APPROVAL_GATE_OWNER_MODULE &&
      DevPulseV2FounderApprovalExecutionGate.assertRegistryOwnership(),
    owner.ownerModule,
  );

  let typecheckOk = false;
  try {
    execSync('npm run typecheck', { cwd: process.cwd(), encoding: 'utf8', stdio: 'pipe' });
    typecheckOk = true;
  } catch {
    typecheckOk = false;
  }
  assert('40. npm run typecheck passes', typecheckOk, typecheckOk ? 'tsc clean' : 'tsc failed');

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    console.log(`${icon} ${r.name}`);
    console.log(`  ${r.detail}`);
    console.log('');
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('=========================================================');
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(APPROVAL_GATE_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:founder-approval');
    console.log('npm run typecheck');
    console.log('');
    process.exit(0);
  }

  console.error('FOUNDER APPROVAL EXECUTION GATE VALIDATION FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
