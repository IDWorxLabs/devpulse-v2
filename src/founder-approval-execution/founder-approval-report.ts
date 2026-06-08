/**
 * Founder Approval Execution Gate founder-readable report.
 */

import type {
  FounderApprovalGateState,
  FounderApprovalRecord,
  FounderApprovalReport,
} from './types.js';
import { APPROVAL_GATE_OWNER_MODULE } from './types.js';

export function buildFounderApprovalReport(
  state: FounderApprovalGateState,
  records: FounderApprovalRecord[],
): FounderApprovalReport {
  const latestRecord = records.length > 0 ? records[records.length - 1] : null;

  let recommendation =
    'Founder Approval Execution Gate governs constitutional approval — no execution, modification, or recovery performed.';
  if (state.pendingCount > 0) {
    recommendation =
      'Approval requests pending founder decision — no auto-approval; execution remains blocked.';
  }

  return {
    ownerModule: APPROVAL_GATE_OWNER_MODULE,
    requestCount: state.requestCount,
    latestRecord,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
  };
}

export function formatFounderApprovalReport(
  state: FounderApprovalGateState,
  records: FounderApprovalRecord[],
): string {
  const report = buildFounderApprovalReport(state, records);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Founder Approval Execution Gate Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Gate ID: ${state.gateId}`,
    `Request count: ${report.requestCount}`,
    '',
  ];

  if (report.latestRecord) {
    const r = report.latestRecord;
    lines.push(`Approval request ID: ${r.approvalRequestId}`);
    lines.push(`Verification ID: ${r.verificationId}`);
    lines.push(`Recovery plan ID: ${r.recoveryPlanId}`);
    lines.push(`Package ID: ${r.packageId}`);
    lines.push(`Approval requirement: ${r.approvalRequirement}`);
    lines.push(`Risk level: ${r.riskLevel}`);
    lines.push(`Decision: ${r.decision}`);
    lines.push(`Constitutional rules: ${r.constitutionalRulesTriggered.join(', ') || 'none'}`);
    lines.push(`Affected domains: ${r.affectedDomains.join(', ') || 'none'}`);
    lines.push(`Future gate unlocked if approved: ${r.futureGateUnlockedIfApproved ?? 'none'}`);
    lines.push(`State sequence: ${r.stateSequence.join(' → ')}`);
    lines.push(`No execution occurred: ${r.noExecutionOccurred ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}
