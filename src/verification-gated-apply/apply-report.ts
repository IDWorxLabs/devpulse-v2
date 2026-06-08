/**
 * Verification-Gated Apply founder-readable report.
 */

import type {
  VerificationGatedApplyRecord,
  VerificationGatedApplyReport,
  VerificationGatedApplyState,
} from './types.js';
import { VERIFICATION_GATED_APPLY_OWNER_MODULE } from './types.js';

export function buildVerificationGatedApplyReport(
  state: VerificationGatedApplyState,
  records: VerificationGatedApplyRecord[],
): VerificationGatedApplyReport {
  const latestRecord = records.length > 0 ? records[records.length - 1] : null;

  return {
    ownerModule: VERIFICATION_GATED_APPLY_OWNER_MODULE,
    evaluationCount: state.evaluationCount,
    latestRecord,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation:
      'Verification-Gated Apply is a decision gate only — no execution, rollback, retry, or file modification.',
  };
}

export function formatVerificationGatedApplyReport(
  state: VerificationGatedApplyState,
  records: VerificationGatedApplyRecord[],
): string {
  const report = buildVerificationGatedApplyReport(state, records);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Verification-Gated Apply Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Gate ID: ${state.gateId}`,
    `Evaluation count: ${report.evaluationCount}`,
    '',
  ];

  if (report.latestRecord) {
    const r = report.latestRecord;
    lines.push(`Apply record ID: ${r.applyRecordId}`);
    lines.push(`Package ID: ${r.packageId}`);
    lines.push(`Readiness state: ${r.readinessState}`);
    lines.push(`Apply verdict: ${r.applyVerdict}`);
    lines.push(`Risk level: ${r.riskLevel}`);
    lines.push(`Approval satisfied: ${r.approvalSatisfied}`);
    lines.push(`Verification satisfied: ${r.verificationSatisfied}`);
    lines.push(`Reality satisfied: ${r.realitySatisfied}`);
    lines.push(`Contradiction count: ${r.contradictionCount}`);
    lines.push(`Evidence count: ${r.evidenceLinks.length}`);
    lines.push(`Decision gate only: ${r.decisionGateOnlyConfirmed ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
    lines.push(`No execution occurred: ${r.noExecutionOccurred ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
    lines.push(`No files modified: ${r.noFilesModified ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}
