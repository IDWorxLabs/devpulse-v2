/**
 * Execution Verification Loop founder-readable report.
 */

import type {
  ExecutionVerificationLoopState,
  ExecutionVerificationReport,
  ExecutionVerificationResult,
} from './types.js';
import { VERIFICATION_OWNER_MODULE } from './types.js';
import { summarizeEvidence } from './execution-verification-evidence.js';

export function buildExecutionVerificationReport(
  state: ExecutionVerificationLoopState,
  results: ExecutionVerificationResult[],
): ExecutionVerificationReport {
  const latestResult = results.length > 0 ? results[results.length - 1] : null;

  let recommendation =
    'Execution Verification Loop validates runtime outcomes — verification only, no execution performed.';
  if (state.failedCount > 0) {
    recommendation =
      'Review failed verifications — runtime and authority misalignment or missing evidence must be resolved.';
  } else if (state.warningCount > 0) {
    recommendation = 'Warning verifications have incomplete non-critical evidence — review before trusting fully.';
  }

  return {
    ownerModule: VERIFICATION_OWNER_MODULE,
    verificationCount: state.verificationCount,
    trustedCount: state.trustedCount,
    warningCount: state.warningCount,
    failedCount: state.failedCount,
    latestResult,
    warnings: [...state.warnings],
    errors: [...state.errors],
    recommendation,
  };
}

export function formatExecutionVerificationReport(
  state: ExecutionVerificationLoopState,
  results: ExecutionVerificationResult[],
): string {
  const report = buildExecutionVerificationReport(state, results);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Execution Verification Loop Report',
    '═══════════════════════════════════════════════════',
    '',
    `Authority owner: ${report.ownerModule}`,
    `Loop ID: ${state.loopId}`,
    `Verification count: ${report.verificationCount}`,
    `Trusted: ${report.trustedCount} | Warning: ${report.warningCount} | Failed: ${report.failedCount}`,
    '',
  ];

  if (report.latestResult) {
    const r = report.latestResult;
    lines.push(`Verification ID: ${r.verificationId}`);
    lines.push(`Package ID: ${r.packageId}`);
    lines.push(`Runtime decision: ${r.runtimeDecision?.finalState ?? 'n/a'}`);
    lines.push(
      `Authority decision: ${r.authorityDecision ? `${r.authorityDecision.classification} allowed=${r.authorityDecision.allowed}` : 'n/a'}`,
    );
    lines.push(`Verdict: ${r.verdict}`);
    lines.push(`Confidence: ${r.confidence}`);
    lines.push(`State sequence: ${r.stateSequence.join(' → ')}`);
    lines.push(`Evidence summary: ${summarizeEvidence(r.evidence)}`);
    lines.push(
      `No execution by this loop: ${r.noExecutionConfirmedByLoop ? 'CONFIRMED' : 'NOT CONFIRMED'}`,
    );
    lines.push('');

    if (r.warnings.length > 0) {
      lines.push('Warnings:');
      for (const w of r.warnings) {
        lines.push(`  ⚠ ${w}`);
      }
      lines.push('');
    }

    if (r.failures.length > 0) {
      lines.push('Failures:');
      for (const f of r.failures) {
        lines.push(`  ✗ ${f}`);
      }
      lines.push('');
    }
  }

  if (report.warnings.length > 0) {
    lines.push('Loop warnings:');
    for (const w of report.warnings) {
      lines.push(`  ⚠ ${w}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation: ${report.recommendation}`);
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}
