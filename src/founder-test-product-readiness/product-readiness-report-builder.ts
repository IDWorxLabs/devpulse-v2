/**
 * Phase 26.5 — Full product readiness simulation report builder.
 */

import type { ProductReadinessReport } from './product-readiness-types.js';

export function buildProductReadinessReportMarkdown(report: ProductReadinessReport): string {
  const lines: string[] = [
    '## FULL PRODUCT READINESS SIMULATION',
    '',
    report.coreQuestion,
    '',
    `**Readiness score:** ${report.readinessScore}/100`,
    `**Verdict:** ${report.verdict.replace(/_/g, ' ')}`,
    `**Launch blocked:** ${report.launchBlocked ? 'YES' : 'NO'}`,
    '',
    '| Simulation | Score | Verdict | Top failure | Recommended fix |',
    '|------------|-------|---------|-------------|-----------------|',
  ];

  for (const sim of report.simulations) {
    lines.push(
      `| ${sim.label} | ${sim.score} | ${sim.verdict.replace(/_/g, ' ')} | ${(sim.topFailures[0] ?? '—').replace(/\|/g, '/')} | ${(sim.recommendedFixes[0] ?? '—').replace(/\|/g, '/')} |`,
    );
  }

  lines.push('');

  if (report.automaticBlockers.length) {
    lines.push('### Automatic launch blockers', '');
    for (const blocker of report.automaticBlockers) {
      lines.push(`- **${blocker.id}:** ${blocker.explanation} → ${blocker.recommendedAction}`);
    }
    lines.push('');
  }

  lines.push('### Self-evolution output', '');
  lines.push('**TOP PRODUCT RISKS**', '');
  for (const risk of report.selfEvolution.topProductRisks) lines.push(`- ${risk}`);
  lines.push('', '**TOP MISSING CAPABILITIES**', '');
  for (const item of report.selfEvolution.topMissingCapabilities) lines.push(`- ${item}`);
  lines.push('', '**TOP USER FRUSTRATIONS**', '');
  for (const item of report.selfEvolution.topUserFrustrations) lines.push(`- ${item}`);
  lines.push('', '**TOP LAUNCH BLOCKERS**', '');
  for (const item of report.selfEvolution.topLaunchBlockers) lines.push(`- ${item}`);
  lines.push('', '**WHAT SHOULD WE BUILD NEXT**', '');
  for (const item of report.selfEvolution.whatShouldWeBuildNext) lines.push(`- ${item}`);
  lines.push('');

  return lines.join('\n');
}
