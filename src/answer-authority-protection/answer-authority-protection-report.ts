/**
 * Answer Authority Protection founder-readable report.
 */

import type { AnswerAuthorityProtectionReport } from './types.js';
import { PROTECTION_OWNER_MODULE } from './types.js';

export interface FormattedProtectionReport extends AnswerAuthorityProtectionReport {
  violationCount: number;
  warningCount: number;
  recommendation: string;
}

export function buildFormattedProtectionReport(
  report: AnswerAuthorityProtectionReport,
): FormattedProtectionReport {
  let recommendation =
    'Answer authority protection intact — only Chat Authority produces user-visible answers.';
  if (report.status === 'MULTIPLE_AUTHORITIES') {
    recommendation =
      'CRITICAL: Multiple answer authorities detected — remove competing owners immediately.';
  } else if (report.status === 'UNREGISTERED') {
    recommendation =
      'CRITICAL: Answer authority not registered — register Chat Authority before any user-facing work.';
  } else if (report.violations.length > 0) {
    recommendation =
      'Resolve answer authority violations before adding intelligence or AiDev systems.';
  }

  return {
    ...report,
    violationCount: report.violations.length,
    warningCount: report.warnings.length,
    recommendation,
  };
}

export function formatAnswerAuthorityProtectionReport(
  report: AnswerAuthorityProtectionReport,
): string {
  const formatted = buildFormattedProtectionReport(report);
  const lines: string[] = [
    '═══════════════════════════════════════════════════',
    'Answer Authority Protection Report',
    '═══════════════════════════════════════════════════',
    '',
    `Policy owner: ${PROTECTION_OWNER_MODULE}`,
    `Report ID: ${formatted.reportId}`,
    `Status: ${formatted.status}`,
    `Visible answer owner: ${formatted.visibleAnswerOwner}`,
    `Registered answer authorities: ${formatted.registeredAuthorities.join(', ') || 'none'}`,
    `Violation count: ${formatted.violationCount}`,
    `Warning count: ${formatted.warningCount}`,
    '',
  ];

  if (formatted.violations.length > 0) {
    lines.push('Violations:');
    for (const v of formatted.violations) {
      lines.push(`  ✗ ${v}`);
    }
    lines.push('');
  }

  if (formatted.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of formatted.warnings) {
      lines.push(`  ⚠ ${w}`);
    }
    lines.push('');
  }

  if (formatted.errors.length > 0) {
    lines.push('Errors:');
    for (const e of formatted.errors) {
      lines.push(`  ✗ ${e}`);
    }
    lines.push('');
  }

  lines.push(`Recommendation: ${formatted.recommendation}`);
  lines.push('═══════════════════════════════════════════════════');

  return lines.join('\n');
}
