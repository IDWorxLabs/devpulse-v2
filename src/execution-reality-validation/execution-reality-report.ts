/**
 * Execution Reality Validation founder-readable report.
 */

import type {
  ExecutionRealityReport,
  ExecutionRealityResult,
  ExecutionRealityValidationState,
} from './types.js';
import { REALITY_VALIDATION_OWNER_MODULE } from './types.js';

export function buildExecutionRealityReport(
  state: ExecutionRealityValidationState,
  results: ExecutionRealityResult[],
): ExecutionRealityReport {
  const latestResult = results.length > 0 ? results[results.length - 1] : null;

  let recommendation =
    'Execution Reality Validation verifies Phase 6 governance chain alignment — validation only, no execution.';
  if (state.failedCount > 0) {
    recommendation =
      'Reality validation failures detected — resolve contradictions before trusting execution governance chain.';
  }

  return {
    ownerModule: REALITY_VALIDATION_OWNER_MODULE,
    validationCount: state.validationCount,
    latestResult,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
  };
}

export function formatExecutionRealityReport(
  state: ExecutionRealityValidationState,
  results: ExecutionRealityResult[],
): string {
  const report = buildExecutionRealityReport(state, results);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Execution Reality Validation Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Validator ID: ${state.validatorId}`,
    `Validation count: ${report.validationCount}`,
    '',
  ];

  if (report.latestResult) {
    const r = report.latestResult;
    lines.push(`Reality validation ID: ${r.realityValidationId}`);
    lines.push(`Package ID: ${r.packageId}`);
    lines.push(`Authority status: ${r.authorityStatus.detail}`);
    lines.push(`Runtime status: ${r.runtimeStatus.detail}`);
    lines.push(`Verification status: ${r.verificationStatus.detail}`);
    lines.push(`Recovery status: ${r.recoveryStatus.detail}`);
    lines.push(`Approval status: ${r.approvalStatus.detail}`);
    lines.push(
      `Contradictions: ${r.contradictions.length > 0 ? r.contradictions.map((c) => c.code).join(', ') : 'none'}`,
    );
    lines.push(`Confidence: ${r.confidence}`);
    lines.push(`Verdict: ${r.verdict}`);
    lines.push(`Chain completeness: ${r.chainComplete ? 'COMPLETE' : 'INCOMPLETE'}`);
    lines.push(`State sequence: ${r.stateSequence.join(' → ')}`);
    lines.push(`No execution occurred: ${r.noExecutionOccurred ? 'CONFIRMED' : 'NOT CONFIRMED'}`);
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}
