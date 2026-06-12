/**
 * Founder Test Integration — markdown report builder.
 */

import {
  FOUNDER_TEST_AUTHORITY_REGISTRATIONS,
  FOUNDER_TEST_INTEGRATION_PASS_TOKEN,
  FOUNDER_TEST_INTEGRATION_PHASE,
  FOUNDER_TEST_INTEGRATION_REPORT_TITLE,
} from './founder-test-integration-registry.js';
import type { FounderTestReport } from './founder-test-integration-types.js';

export function buildFounderTestIntegrationReportMarkdown(report: FounderTestReport): string {
  const { assessment } = report;
  const lines: string[] = [
    `# ${FOUNDER_TEST_INTEGRATION_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Phase',
    '',
    report.phaseName,
    '',
    '## Purpose',
    '',
    report.purpose,
    '',
    '## Participating Authorities',
    '',
    '| Authority | Source Module | Weight |',
    '|-----------|---------------|--------|',
  ];

  for (const entry of FOUNDER_TEST_AUTHORITY_REGISTRATIONS) {
    lines.push(`| ${entry.displayName} | ${entry.sourceModule} | ${entry.weight} |`);
  }

  lines.push('');
  lines.push('## Authority Scores');
  lines.push('');
  lines.push('| Authority | Score | Weighted |');
  lines.push('|-----------|-------|----------|');

  for (const result of assessment.run.authorityResults) {
    lines.push(
      `| ${result.displayName} | ${result.normalizedScore}/100 | ${result.weightedContribution}/${result.weight} |`,
    );
  }

  lines.push('');
  lines.push('## Unified Founder Score');
  lines.push('');
  lines.push(`**${assessment.score.overall}/100**`);
  lines.push('');
  lines.push('## Unified Verdict');
  lines.push('');
  lines.push(`**${assessment.verdict}**`);
  lines.push('');

  lines.push('## Blockers');
  lines.push('');
  if (assessment.blockers.length === 0) {
    lines.push('- None');
  } else {
    for (const blocker of assessment.blockers.slice(0, 12)) {
      lines.push(`- ${blocker}`);
    }
  }
  lines.push('');

  lines.push('## Warnings');
  lines.push('');
  if (assessment.warnings.length === 0) {
    lines.push('- None');
  } else {
    for (const warning of assessment.warnings.slice(0, 12)) {
      lines.push(`- ${warning}`);
    }
  }
  lines.push('');

  lines.push('## Recommendations');
  lines.push('');
  for (const recommendation of assessment.recommendations.slice(0, 12)) {
    lines.push(`- ${recommendation}`);
  }
  lines.push('');

  lines.push('## Sample Founder Scenarios');
  lines.push('');
  lines.push('| Scenario | Expected Verdict |');
  lines.push('|----------|------------------|');
  lines.push('| All authorities strong, simulation passes, no regression | FOUNDER_READY |');
  lines.push('| Score 70–84, no critical blockers | FOUNDER_READY_WITH_WARNINGS |');
  lines.push('| Score below 70 | NOT_FOUNDER_READY |');
  lines.push('| Critical blocker present | BLOCKED |');
  lines.push('| Missing major authority outputs | INSUFFICIENT_EVIDENCE |');
  lines.push('');

  lines.push('## Pass Token');
  lines.push('');
  lines.push(FOUNDER_TEST_INTEGRATION_PASS_TOKEN);
  lines.push('');

  return lines.join('\n');
}

export function buildFounderTestIntegrationPhaseReportMarkdown(
  report: FounderTestReport,
): string {
  return buildFounderTestIntegrationReportMarkdown(report);
}
