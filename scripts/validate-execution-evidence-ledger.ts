/**
 * DevPulse V2 Execution Evidence Ledger — validation scenarios.
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
import {
  countLinksByType,
  DevPulseV2ExecutionEvidenceLedger,
  EVIDENCE_LEDGER_OWNER_MODULE,
  EVIDENCE_LEDGER_PASS_TOKEN,
  formatExecutionEvidenceReport,
  getEvidenceDependencyChainSummary,
  ledgerStateIncludes,
  resetDevPulseV2ExecutionEvidenceLedgerForTests,
} from '../src/execution-evidence-ledger/index.js';
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
    metadata: { source: 'evidence-test', ...flags.metadata },
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
) {
  runtime.processPackage(pkg);
  const verification = verificationLoop.verifyPackage(pkg.packageId);
  const recovery = recoveryEngine.planRecovery(verification);
  gate.evaluateApprovalRequest(recovery);
  reality.validatePackage(pkg.packageId);
}

async function main(): Promise<void> {
  console.log('');
  console.log('DevPulse V2 — Execution Evidence Ledger');
  console.log('=======================================');
  console.log('');

  resetDevPulseV2TimelineLedgerAuthorityForTests();
  const runtime = resetDevPulseV2ExecutionPackageRuntimeForTests();
  const verificationLoop = resetDevPulseV2ExecutionVerificationLoopForTests();
  const recoveryEngine = resetDevPulseV2RecoveryExecutionEngineForTests();
  const gate = resetDevPulseV2FounderApprovalExecutionGateForTests();
  const reality = resetDevPulseV2ExecutionRealityValidationForTests();
  const ledger = resetDevPulseV2ExecutionEvidenceLedgerForTests();

  const packages = [
    { id: 'ev-read', pkg: createReadOnlyPackage({ packageId: 'ev-read', metadata: { source: 'test' } }) },
    {
      id: 'ev-write',
      pkg: blockedPackage('ev-write', 'write file', 'write', { requiresWrite: true }),
    },
    {
      id: 'ev-recovery',
      pkg: blockedPackage('ev-recovery', 'rollback to checkpoint', 'rollback', { requiresRecovery: true }),
    },
    {
      id: 'ev-auto',
      pkg: blockedPackage('ev-auto', 'continue autonomously', 'autonomous', { requiresAutonomy: true }),
    },
  ];

  for (const { pkg } of packages) {
    runFullPipeline(pkg, runtime, verificationLoop, recoveryEngine, gate, reality);
  }

  const readRecord = ledger.recordPackage('ev-read');
  const writeRecord = ledger.recordPackage('ev-write');
  const recoveryRecord = ledger.recordPackage('ev-recovery');
  const autoRecord = ledger.recordPackage('ev-auto');

  assert(
    '1. complete read-only chain records',
    readRecord.packageId === 'ev-read' && readRecord.ledgerRecordId.length > 0,
    readRecord.ledgerRecordId,
  );
  assert(
    '2. complete write chain records',
    writeRecord.packageId === 'ev-write' && writeRecord.verificationVerdict === 'TRUSTED',
    writeRecord.ledgerRecordId,
  );
  assert(
    '3. complete recovery chain records',
    recoveryRecord.packageId === 'ev-recovery' && recoveryRecord.recoveryNeed !== null,
    recoveryRecord.ledgerRecordId,
  );
  assert(
    '4. complete autonomy chain records',
    autoRecord.packageId === 'ev-auto' && autoRecord.approvalRequestId !== null,
    autoRecord.ledgerRecordId,
  );

  const sample = writeRecord;

  assert('5. package id stored', sample.packageId === 'ev-write', sample.packageId);
  assert('6. authority id stored', sample.authorityId.length > 0, sample.authorityId);
  assert('7. runtime id stored', sample.runtimeRecordId !== null, sample.runtimeRecordId ?? 'null');
  assert('8. verification id stored', sample.verificationId !== null, sample.verificationId ?? 'null');
  assert('9. recovery id stored', sample.recoveryPlanId !== null, sample.recoveryPlanId ?? 'null');
  assert('10. approval id stored', sample.approvalRequestId !== null, sample.approvalRequestId ?? 'null');
  assert('11. reality id stored', sample.realityValidationId !== null, sample.realityValidationId ?? 'null');

  assert('12. runtime decision stored', sample.runtimeDecision === 'BLOCKED_REQUIRES_GATE', sample.runtimeDecision ?? 'null');
  assert('13. verification verdict stored', sample.verificationVerdict === 'TRUSTED', sample.verificationVerdict ?? 'null');
  assert('14. recovery need stored', sample.recoveryNeed === 'BLOCKED_REQUIRES_FUTURE_GATE', sample.recoveryNeed ?? 'null');
  assert('15. approval decision stored', sample.approvalDecision === 'PENDING', sample.approvalDecision ?? 'null');
  assert('16. reality verdict stored', sample.realityVerdict === 'REALITY_TRUSTED', sample.realityVerdict ?? 'null');

  assert('17. confidence stored', sample.confidence === 'HIGH', sample.confidence ?? 'null');
  assert('18. chain completeness stored', sample.chainComplete === true, String(sample.chainComplete));
  assert('19. contradictions stored', Array.isArray(sample.contradictions), `${sample.contradictions.length} items`);

  assert(
    '20. authority evidence link created',
    countLinksByType(sample.evidenceLinks, 'authority') >= 1,
    `${countLinksByType(sample.evidenceLinks, 'authority')} authority links`,
  );
  assert(
    '21. runtime evidence link created',
    countLinksByType(sample.evidenceLinks, 'runtime') >= 1,
    `${countLinksByType(sample.evidenceLinks, 'runtime')} runtime links`,
  );
  assert(
    '22. verification evidence link created',
    countLinksByType(sample.evidenceLinks, 'verification') >= 1,
    `${countLinksByType(sample.evidenceLinks, 'verification')} verification links`,
  );
  assert(
    '23. recovery evidence link created',
    countLinksByType(sample.evidenceLinks, 'recovery') >= 1,
    `${countLinksByType(sample.evidenceLinks, 'recovery')} recovery links`,
  );
  assert(
    '24. approval evidence link created',
    countLinksByType(sample.evidenceLinks, 'approval') >= 1,
    `${countLinksByType(sample.evidenceLinks, 'approval')} approval links`,
  );
  assert(
    '25. reality evidence link created',
    countLinksByType(sample.evidenceLinks, 'reality') >= 1,
    `${countLinksByType(sample.evidenceLinks, 'reality')} reality links`,
  );

  assert('26. ledger history supports multiple entries', ledger.getLedgerHistory().length === 4, `${ledger.getLedgerCount()} entries`);
  const countBefore = ledger.getLedgerCount();
  ledger.recordPackage('ev-read');
  assert('27. ledger count increases', ledger.getLedgerCount() === countBefore + 1, `${ledger.getLedgerCount()}`);

  assert(
    '28. lookup by package id works',
    ledger.findByPackageId('ev-write').length >= 1,
    `${ledger.findByPackageId('ev-write').length} records`,
  );
  assert(
    '29. lookup by verification id works',
    sample.verificationId !== null && ledger.findByVerificationId(sample.verificationId).length >= 1,
    sample.verificationId ?? 'null',
  );
  assert(
    '30. lookup by approval id works',
    sample.approvalRequestId !== null && ledger.findByApprovalRequestId(sample.approvalRequestId).length >= 1,
    sample.approvalRequestId ?? 'null',
  );
  assert(
    '31. lookup by reality id works',
    sample.realityValidationId !== null && ledger.findByRealityValidationId(sample.realityValidationId).length >= 1,
    sample.realityValidationId ?? 'null',
  );

  const states = sample.stateSequence;
  assert('32. ledger state includes LEDGER_INPUT_RECEIVED', ledgerStateIncludes(states, 'LEDGER_INPUT_RECEIVED'), states.join(' → '));
  assert('33. ledger state includes CHAIN_REFERENCES_CAPTURED', ledgerStateIncludes(states, 'CHAIN_REFERENCES_CAPTURED'), states.join(' → '));
  assert('34. ledger state includes EVIDENCE_LINKS_CREATED', ledgerStateIncludes(states, 'EVIDENCE_LINKS_CREATED'), states.join(' → '));
  assert('35. ledger state includes LEDGER_RECORD_CREATED', ledgerStateIncludes(states, 'LEDGER_RECORD_CREATED'), states.join(' → '));
  assert('36. ledger state includes LEDGER_INDEX_UPDATED', ledgerStateIncludes(states, 'LEDGER_INDEX_UPDATED'), states.join(' → '));
  assert('37. ledger state includes LEDGER_STORAGE_CONFIRMED', ledgerStateIncludes(states, 'LEDGER_STORAGE_CONFIRMED'), states.join(' → '));

  const reportText = formatExecutionEvidenceReport(ledger.getLedgerState(), ledger.getLedgerHistory());
  assert('38. report contains ledgerRecordId', reportText.includes('Ledger record ID:'), 'ledgerRecordId section');
  assert('39. report contains packageId', reportText.includes('Package ID:'), 'packageId section');
  assert('40. report contains confidence', reportText.includes('Confidence:'), 'confidence line');
  assert('41. report contains reality verdict', reportText.includes('Reality verdict:'), 'reality verdict line');
  assert('42. report contains approval decision', reportText.includes('Approval decision:'), 'approval decision line');
  assert('43. report contains verification verdict', reportText.includes('Verification verdict:'), 'verification verdict line');
  assert('44. report contains contradiction count', reportText.includes('Contradiction count:'), 'contradiction count line');
  assert('45. report contains evidence link count', reportText.includes('Evidence link count:'), 'evidence link count line');
  assert('46. report confirms history-only behavior', reportText.includes('History-only behavior: CONFIRMED'), 'history-only');
  assert('47. report confirms no execution occurred', reportText.includes('No execution occurred: CONFIRMED'), 'no execution');

  const owner = getDevPulseV2Owner('execution_evidence_ledger');
  assert(
    '48. registry contains execution_evidence_ledger',
    owner.ownerModule === EVIDENCE_LEDGER_OWNER_MODULE && owner.phase === 6.7,
    owner.ownerModule,
  );

  const depChain = getEvidenceDependencyChainSummary();
  assert(
    '49. dependency chain references Phase 6.1–6.6',
    DevPulseV2ExecutionEvidenceLedger.assertDependencyChain() &&
      depChain.includes('execution_authority@6.1') &&
      depChain.includes('execution_reality_validation@6.6'),
    depChain,
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
  console.log('=======================================');
  if (failed.length === 0) {
    console.log('ALL SCENARIOS PASSED');
    console.log('');
    console.log(EVIDENCE_LEDGER_PASS_TOKEN);
    console.log('');
    console.log('npm run validate:execution-evidence');
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
