/**
 * Founder Test Reality Sweep — markdown report builder.
 */

import {
  FOUNDER_LAUNCH_VERDICTS,
  FOUNDER_TEST_REALITY_SWEEP_CORE_QUESTION,
  FOUNDER_TEST_REALITY_SWEEP_PASS_TOKEN,
  FOUNDER_TEST_REALITY_SWEEP_PHASE,
  FOUNDER_TEST_REALITY_SWEEP_REPORT_TITLE,
  LAUNCH_BLOCKER_SEVERITIES,
  LAUNCH_RECOMMENDATIONS,
  ORCHESTRATION_FLOW,
  REALITY_SWEEP_CATEGORIES,
  REALITY_SWEEP_CATEGORY_LABELS,
  REALITY_SWEEP_SAFETY_GUARANTEES,
  REQUIRED_INPUT_AUTHORITIES,
} from './founder-test-reality-sweep-registry.js';
import type { FounderTestRealitySweepAssessment } from './founder-test-reality-sweep-types.js';

export function buildFounderTestRealitySweepReportMarkdown(
  assessment: FounderTestRealitySweepAssessment,
): string {
  const report = assessment.report;

  const lines: string[] = [
    `# ${FOUNDER_TEST_REALITY_SWEEP_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Phase',
    '',
    FOUNDER_TEST_REALITY_SWEEP_PHASE,
    '',
    '## Core Question',
    '',
    FOUNDER_TEST_REALITY_SWEEP_CORE_QUESTION,
    '',
    '## Orchestration Flow',
    '',
    ORCHESTRATION_FLOW.map((step, i) => `${i + 1}. ${step}`).join('\n'),
    '',
    '## Safety Guarantees',
    '',
    ...REALITY_SWEEP_SAFETY_GUARANTEES.map((g) => `- ${g}`),
    '',
    '## Launch Readiness',
    '',
    `**${report.launchReadinessPercent}%**`,
    '',
    '## Launch Recommendation',
    '',
    `**${report.launchRecommendation}**`,
    '',
    '## Founder Launch Verdict',
    '',
    `**${report.founderLaunchVerdict}**`,
    '',
    '## Reality Sweep Categories',
    '',
    '| Category | Honest Score | Summary |',
    '|----------|--------------|---------|',
  ];

  for (const category of report.categoryScores) {
    lines.push(`| ${category.label} | ${category.honestScore}/100 | ${category.summary} |`);
  }

  lines.push('', '## Top 10 Blockers', '');
  if (report.topBlockers.length === 0) {
    lines.push('- None');
  } else {
    for (const blocker of report.topBlockers) {
      lines.push(`- **[${blocker.severity}]** ${blocker.title}: ${blocker.explanation}`);
    }
  }

  lines.push('', '## Top 10 Strengths', '');
  if (report.topStrengths.length === 0) {
    lines.push('- None');
  } else {
    for (const strength of report.topStrengths) {
      lines.push(`- ${strength.explanation}`);
    }
  }

  lines.push('', '## Top Missing Capabilities', '');
  if (report.topMissingCapabilities.length === 0) {
    lines.push('- None');
  } else {
    for (const item of report.topMissingCapabilities) {
      lines.push(`- [${item.launchImpact}] ${item.capability}`);
    }
  }

  lines.push('', '## Most Important Next Build Items', '');
  for (const item of report.mostImportantNextBuildItems) {
    lines.push(`- ${item.action} (${item.sourceAuthority})`);
  }

  lines.push('', '## Competitive Gaps', '');
  if (report.competitiveGaps.length === 0) {
    lines.push('- None');
  } else {
    for (const gap of report.competitiveGaps) {
      lines.push(`- [${gap.severity}] ${gap.gap}`);
    }
  }

  lines.push('', '## Top Launch Risks', '');
  for (const risk of report.topLaunchRisks) {
    lines.push(`- [${risk.severity}] ${risk.risk}`);
  }

  lines.push('', '## Consumed Authorities', '');
  for (const authority of REQUIRED_INPUT_AUTHORITIES) {
    const missing = report.inputSnapshot.missingAuthorities.includes(authority);
    lines.push(`- ${authority}: ${missing ? 'MISSING' : 'consumed'}`);
  }

  lines.push('', '## Launch Verdicts', '');
  for (const verdict of FOUNDER_LAUNCH_VERDICTS) {
    lines.push(`- ${verdict}`);
  }

  lines.push('', '## Launch Recommendations', '');
  for (const recommendation of LAUNCH_RECOMMENDATIONS) {
    lines.push(`- ${recommendation}`);
  }

  lines.push('', '## Blocker Severities', '');
  for (const severity of LAUNCH_BLOCKER_SEVERITIES) {
    lines.push(`- ${severity}`);
  }

  lines.push('', '## Sweep Categories', '');
  for (const category of REALITY_SWEEP_CATEGORIES) {
    lines.push(`- ${REALITY_SWEEP_CATEGORY_LABELS[category]}`);
  }

  lines.push('', '## Pass Token', '', FOUNDER_TEST_REALITY_SWEEP_PASS_TOKEN, '');

  return lines.join('\n');
}
