/**
 * Phase 27.07 — Final Founder Report Delivery Trace report builder (diagnostic only).
 */

import {
  FINAL_FOUNDER_REPORT_DELIVERY_TRACE_CORE_QUESTION,
  FINAL_FOUNDER_REPORT_DELIVERY_TRACE_REPORT_TITLE,
} from './final-founder-report-delivery-trace-registry.js';
import type { DeliveryTraceReport } from './final-founder-report-delivery-trace-types.js';

export function buildFinalFounderReportDeliveryTraceMarkdown(report: DeliveryTraceReport): string {
  const lines = [
    `# ${FINAL_FOUNDER_REPORT_DELIVERY_TRACE_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Core Question',
    '',
    FINAL_FOUNDER_REPORT_DELIVERY_TRACE_CORE_QUESTION,
    '',
    '## Verdict',
    '',
    report.analysis.verdict,
    '',
    '## Summary',
    '',
    `1. **Last successful boundary:** ${report.analysis.lastSuccessfulBoundary ?? 'none'}`,
    `2. **First failed boundary:** ${report.analysis.firstFailedBoundary ?? 'none'}`,
    `3. **Exact file:** ${report.analysis.sourceFile ?? 'n/a'}`,
    `4. **Exact function:** ${report.analysis.sourceFunction ?? 'n/a'}`,
    `5. **Exact line:** ${report.analysis.sourceLine ?? 'n/a'}`,
    `6. **Exact exception:** ${report.analysis.exception ?? 'none'}`,
    `7. **Exact runId:** ${report.analysis.runId ?? 'n/a'}`,
    `8. **Exact missing artifact:** ${report.analysis.missingArtifact ?? 'none'}`,
    '',
    '## Boundary Trace',
    '',
    '| Boundary | Entered | Completed | Elapsed ms | Output | Size | Next | Success |',
    '|----------|---------|-----------|------------|--------|------|------|---------|',
  ];

  for (const boundary of report.boundaries) {
    lines.push(
      `| ${boundary.boundaryId} | ${boundary.entered ? 'yes' : 'no'} | ${boundary.completed ? 'yes' : 'no'} | ${boundary.elapsedMs ?? 'n/a'} | ${boundary.outputExists ? 'yes' : 'no'} | ${boundary.outputSize ?? 'n/a'} | ${boundary.nextBoundaryInvoked ?? 'n/a'} | ${boundary.succeeded ? 'yes' : 'no'} |`,
    );
  }

  lines.push('', '## Boundary Details', '');
  for (const boundary of report.boundaries.filter((entry) => entry.entered)) {
    lines.push(`### ${boundary.boundaryId}`, '');
    if (boundary.source) {
      lines.push(
        `- Source: \`${boundary.source.file}:${boundary.source.line}\` \`${boundary.source.function}\``,
      );
    }
    if (boundary.exception) lines.push(`- Exception: ${boundary.exception}`);
    if (boundary.missingArtifact) lines.push(`- Missing artifact: ${boundary.missingArtifact}`);
    if (Object.keys(boundary.details).length > 0) {
      lines.push('- Details:');
      for (const [key, value] of Object.entries(boundary.details)) {
        lines.push(`  - ${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
      }
    }
    lines.push('');
  }

  if (report.passToken) {
    lines.push(`Pass token: ${report.passToken}`, '');
  }

  return lines.join('\n');
}

export function buildDeliveryTraceValidationMarkdown(
  checks: readonly { name: string; passed: boolean; detail: string }[],
  passToken: string | null,
): string {
  return [
    '# Final Founder Report Delivery Trace Validation',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Pass token: ${passToken ?? 'NONE'}`,
    '',
    '## Checks',
    '',
    ...checks.map((check) => `- [${check.passed ? 'x' : ' '}] **${check.name}** — ${check.detail}`),
  ].join('\n');
}
