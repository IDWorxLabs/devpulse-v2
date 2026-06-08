/**
 * Recovery Execution Engine founder-readable report.
 */

import type {
  RecoveryExecutionEngineState,
  RecoveryExecutionReport,
  RecoveryRecord,
} from './types.js';
import { RECOVERY_EXECUTION_OWNER_MODULE } from './types.js';

export function buildRecoveryExecutionReport(
  state: RecoveryExecutionEngineState,
  records: RecoveryRecord[],
): RecoveryExecutionReport {
  const latestRecord = records.length > 0 ? records[records.length - 1] : null;

  let recommendation =
    'Recovery Execution Engine produces recovery plans only — no commands, writes, or rollback executed.';
  if (state.blockedPendingGateCount > 0) {
    recommendation =
      'Recovery plans pending future gates — founder approval or gate expansion required before execution.';
  }

  return {
    ownerModule: RECOVERY_EXECUTION_OWNER_MODULE,
    planCount: state.planCount,
    latestRecord,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
  };
}

export function formatRecoveryExecutionReport(
  state: RecoveryExecutionEngineState,
  records: RecoveryRecord[],
): string {
  const report = buildRecoveryExecutionReport(state, records);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Recovery Execution Engine Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Engine ID: ${state.engineId}`,
    `Plan count: ${report.planCount}`,
    '',
  ];

  if (report.latestRecord) {
    const r = report.latestRecord;
    const p = r.plan;
    lines.push(`Recovery plan ID: ${p.recoveryPlanId}`);
    lines.push(`Verification ID: ${p.verificationId}`);
    lines.push(`Package ID: ${p.packageId}`);
    lines.push(`Verification verdict: ${p.verificationVerdict}`);
    lines.push(`Recovery need: ${p.recoveryNeed}`);
    lines.push(`Selected strategy: ${p.strategy}`);
    lines.push(`Required gate: ${p.requiredGate ?? 'none'}`);
    lines.push(`Rollback required: ${p.rollbackRequired}`);
    lines.push(`Retry allowed: ${p.retryAllowed}`);
    lines.push(`Founder approval required: ${p.founderApprovalRequired}`);
    lines.push(`State sequence: ${r.stateSequence.join(' → ')}`);
    lines.push(`No recovery executed: ${r.noRecoveryExecuted ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
    lines.push('');
  }

  if (report.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of report.warnings) {
      lines.push(`  ⚠ ${w}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}
