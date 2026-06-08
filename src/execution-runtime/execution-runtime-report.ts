/**
 * Execution Package Runtime founder-readable report.
 */

import type {
  ExecutionPackageRuntimeReport,
  ExecutionPackageRuntimeState,
  RuntimeRecord,
} from './types.js';
import { RUNTIME_OWNER_MODULE } from './types.js';

export function buildExecutionPackageRuntimeReport(
  state: ExecutionPackageRuntimeState,
  records: RuntimeRecord[],
): ExecutionPackageRuntimeReport {
  const latestRecord = records.length > 0 ? records[records.length - 1] : null;

  let recommendation =
    'Execution Package Runtime accepts and classifies packages — Phase 6.2 foundation only, no execution performed.';
  if (state.blockedCount > 0) {
    recommendation =
      'Blocked packages require future gates (execution_command_gate, founder_approval_execution_gate, recovery_execution_engine, world2_isolation_or_autonomy_gate).';
  }

  return {
    ownerModule: RUNTIME_OWNER_MODULE,
    recordCount: state.recordCount,
    acceptedReadOnlyCount: state.acceptedReadOnlyCount,
    blockedCount: state.blockedCount,
    rejectedCount: state.rejectedCount,
    latestRecord,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
  };
}

export function formatExecutionPackageRuntimeReport(
  state: ExecutionPackageRuntimeState,
  records: RuntimeRecord[],
): string {
  const report = buildExecutionPackageRuntimeReport(state, records);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Execution Package Runtime Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Runtime ID: ${state.runtimeId}`,
    `Record count: ${report.recordCount}`,
    `Accepted read-only: ${report.acceptedReadOnlyCount}`,
    `Blocked: ${report.blockedCount}`,
    `Rejected invalid: ${report.rejectedCount}`,
    '',
  ];

  if (report.latestRecord) {
    const r = report.latestRecord;
    lines.push(`Latest packageId: ${r.packageId}`);
    lines.push(`Requested action: ${r.package.requestedAction}`);
    lines.push(
      `Classification: ${r.authorityDecision?.classification ?? r.runtimeDecision.classification}`,
    );
    lines.push(`Runtime decision: ${r.runtimeDecision.finalState}`);
    lines.push(
      `Authority decision: ${r.authorityDecision?.allowed ? 'ALLOWED' : 'BLOCKED'} — ${r.authorityDecision?.reason ?? 'n/a'}`,
    );
    lines.push(`Runtime state sequence: ${r.stateSequence.join(' → ')}`);
    if (r.runtimeDecision.blockedReason) {
      lines.push(`Blocked reason: ${r.runtimeDecision.blockedReason}`);
    }
    if (r.runtimeDecision.futureGateRequired) {
      lines.push(`Future gate required: ${r.runtimeDecision.futureGateRequired}`);
    }
    lines.push(
      `No execution occurred: ${r.runtimeDecision.noExecutionConfirmed ? 'CONFIRMED' : 'NOT CONFIRMED'}`,
    );
    lines.push('');
  }

  if (report.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of report.warnings) {
      lines.push(`  ⚠ ${w}`);
    }
    lines.push('');
  }

  if (report.errors.length > 0) {
    lines.push('Errors:');
    for (const e of report.errors) {
      lines.push(`  ✗ ${e}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}

export function formatRuntimeRecordReport(record: RuntimeRecord): string {
  return formatExecutionPackageRuntimeReport(
    {
      runtimeId: 'record',
      recordCount: 1,
      acceptedReadOnlyCount: record.runtimeDecision.accepted ? 1 : 0,
      blockedCount: record.runtimeDecision.finalState === 'BLOCKED_REQUIRES_GATE' ? 1 : 0,
      rejectedCount: record.runtimeDecision.finalState === 'REJECTED_INVALID_PACKAGE' ? 1 : 0,
      warnings: record.warnings,
      errors: record.errors,
    },
    [record],
  );
}
