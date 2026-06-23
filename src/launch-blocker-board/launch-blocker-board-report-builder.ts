/**
 * Launch Blocker Board V1 — founder-facing markdown report builder.
 */

import {
  FOUNDER_TEST_REPAIR_PHASE_TRIGGERS,
  LAUNCH_BLOCKER_BOARD_CORE_QUESTION,
  LAUNCH_BLOCKER_BOARD_REPORT_TITLE,
  LAUNCH_BLOCKER_BUCKETS,
  STRATEGY_RESET_RULE,
} from './launch-blocker-board-registry.js';
import type { LaunchBlockerBoardEntry, LaunchBlockerBoardReport } from './launch-blocker-board-types.js';

function formatEntry(entry: LaunchBlockerBoardEntry, index: number): string[] {
  return [
    `### ${index + 1}. ${entry.blockerName}`,
    '',
    `- **Bucket:** ${entry.bucket}`,
    `- **Severity:** ${entry.severity}`,
    `- **User impact:** ${entry.userImpact}`,
    `- **Fix required:** ${entry.fixRequired}`,
    `- **Launch impact:** ${entry.launchImpact}`,
    `- **Keep / Defer / Ignore:** ${entry.disposition}`,
    `- **Source:** ${entry.sourceAuthority}`,
    '',
  ];
}

export function buildLaunchBlockerBoardReportMarkdown(report: LaunchBlockerBoardReport): string {
  const lines: string[] = [
    `# ${LAUNCH_BLOCKER_BOARD_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    `Run: ${report.runId}`,
    '',
    '## Core Question',
    '',
    LAUNCH_BLOCKER_BOARD_CORE_QUESTION,
    '',
    '## Strategy Reset',
    '',
    STRATEGY_RESET_RULE,
    '',
    'Repair phases are only allowed when:',
    ...FOUNDER_TEST_REPAIR_PHASE_TRIGGERS.map((rule) => `- ${rule}`),
    '',
    '## Launch Readiness Snapshot',
    '',
    `- Verdict: **${report.launchReadinessVerdict}**`,
    `- Founder readiness score: **${report.founderReadinessScore}/100**`,
    `- Product gaps on board: **${report.productGapCount}**`,
    `- Testing noise on board: **${report.testingNoiseCount}**`,
    '',
    '## Bucket Summary',
    '',
    ...LAUNCH_BLOCKER_BUCKETS.map(
      (bucket) => `- **${bucket}:** ${report.bucketCounts[bucket]}`,
    ),
    '',
    '## Top Launch Blockers',
    '',
  ];

  if (report.topLaunchBlockers.length === 0) {
    lines.push('No launch blockers classified — AiDevEngine may be ready for founder review.');
    lines.push('');
  } else {
    report.topLaunchBlockers.forEach((entry, index) => {
      lines.push(...formatEntry(entry, index));
    });
  }

  const deferred = report.allBlockers.filter((entry) => entry.disposition === 'DEFER');
  if (deferred.length > 0) {
    lines.push('## Deferred Items', '');
    deferred.slice(0, 5).forEach((entry, index) => {
      lines.push(`- ${entry.blockerName} (${entry.bucket})`);
    });
    lines.push('');
  }

  const ignored = report.allBlockers.filter((entry) => entry.disposition === 'IGNORE');
  if (ignored.length > 0) {
    lines.push('## Ignore (Founder Test Noise)', '');
    ignored.slice(0, 5).forEach((entry) => {
      lines.push(`- ${entry.blockerName}: ${entry.userImpact}`);
    });
    lines.push('');
  }

  if (report.passToken) {
    lines.push(`Pass token: ${report.passToken}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function buildLaunchBlockerBoardValidationMarkdown(
  checks: readonly { name: string; passed: boolean; detail: string }[],
  passToken: string | null,
): string {
  return [
    '# Launch Blocker Board Validation',
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
