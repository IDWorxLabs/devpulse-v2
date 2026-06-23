/**
 * Phase 27.00 — Authority Reality Convergence report builder (V1).
 */

import {
  AUTHORITY_REALITY_CONVERGENCE_CORE_QUESTION,
  CONVERGENCE_INTEGRATION_TARGETS,
  CONVERGENCE_RULES,
  LAUNCH_CRITICAL_AUTHORITY_TARGETS,
} from './authority-reality-convergence-registry.js';
import type { AuthorityRealityConvergenceReport } from './authority-reality-convergence-types.js';

export function buildAuthorityRealityConvergenceReportMarkdown(
  report: AuthorityRealityConvergenceReport,
): string {
  const lines: string[] = [
    '# Authority Reality Convergence Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Convergence ID: ${report.convergenceId}`,
    '',
    '## Core Question',
    '',
    AUTHORITY_REALITY_CONVERGENCE_CORE_QUESTION,
    '',
    '## Rules',
    '',
    ...CONVERGENCE_RULES.map((r) => `- ${r}`),
    '',
    '## Authoritative Reality Source',
    '',
    `- Workspace: **${report.authoritative.authoritativeWorkspaceId ?? 'n/a'}**`,
    `- RunId: **${report.authoritative.authoritativeRunId ?? 'n/a'}**`,
    `- Manifest: **${report.authoritative.authoritativeManifestId ?? 'n/a'}**`,
    `- Proof timestamp: **${report.authoritative.authoritativeProofTimestamp ?? 'n/a'}**`,
    `- Application truth: **${report.authoritative.finalApplicationTruth}**`,
    `- Disk missingArtifacts: **${report.authoritative.diskMissingArtifacts}**`,
    `- Disk existingArtifacts: **${report.authoritative.diskExistingArtifacts}**`,
    '',
    '## Launch-Critical Authority Traces',
    '',
    '| Authority | Workspace | RunId | Manifest | Aligned | Verdict |',
    '|-----------|-----------|-------|----------|---------|---------|',
  ];

  for (const trace of report.launchCriticalTraces) {
    lines.push(
      `| ${trace.authorityName} | ${trace.workspaceId ?? 'n/a'} | ${trace.runId ?? 'n/a'} | ${trace.manifestId ?? 'n/a'} | ${trace.alignedWithAuthoritative ? 'yes' : 'no'} | ${trace.verdict} |`,
    );
  }

  lines.push('');
  lines.push('## Divergences');
  lines.push('');
  if (report.divergences.length) {
    for (const divergence of report.divergences) {
      lines.push(
        `- **${divergence.divergenceReason}** (${divergence.launchImpact}): ${divergence.consumingSource}`,
      );
      lines.push(`  - Authoritative: ${divergence.authoritativeSource}`);
      lines.push(`  - Detail: ${divergence.detail}`);
    }
  } else {
    lines.push('- None');
  }

  lines.push('');
  lines.push('## Reconciliation');
  lines.push('');
  lines.push(`- All launch-critical aligned: **${report.reconciliation.allLaunchCriticalAligned ? 'yes' : 'no'}**`);
  lines.push(`- Stale proof consumers repaired: **${report.reconciliation.staleConsumersRepaired}**`);
  lines.push(`- Cached verdict consumers repaired: **${report.reconciliation.cachedVerdictConsumersRepaired}**`);
  lines.push(`- Stale report consumers repaired: **${report.reconciliation.staleReportConsumersRepaired}**`);
  lines.push(`- Artifacts misreport reclassified: **${report.reconciliation.artifactsMisreportReclassified}**`);
  lines.push(`- Chat capability propagation aligned: **${report.chatCapabilityPropagationAligned ? 'yes' : 'no'}**`);

  lines.push('');
  lines.push('## Integration Targets');
  lines.push('');
  for (const target of CONVERGENCE_INTEGRATION_TARGETS) {
    lines.push(`- ${target}`);
  }

  lines.push('');
  report.passToken
    ? lines.push(`Pass token: **${report.passToken}**`)
    : lines.push('Pass token: not issued');

  return lines.join('\n');
}

export function buildAuthorityRealityConvergenceAuditMarkdown(
  report: AuthorityRealityConvergenceReport,
): string {
  const lines: string[] = [
    '# Authority Reality Convergence Audit',
    '',
    `Targets audited: ${LAUNCH_CRITICAL_AUTHORITY_TARGETS.join(', ')}`,
    '',
    '## Audit Findings',
    '',
    '| Authority | Audit | Aligned | Kind | Detail |',
    '|-----------|-------|---------|------|--------|',
  ];

  for (const finding of report.auditFindings) {
    lines.push(
      `| ${finding.authorityName} | ${finding.auditKind} | ${finding.aligned ? 'yes' : 'no'} | ${finding.consumerKind ?? 'none'} | ${finding.detail.slice(0, 80)} |`,
    );
  }

  return lines.join('\n');
}

export function buildAuthorityRealityConvergenceValidationMarkdown(
  passed: boolean,
  checkCount: number,
  failedCount: number,
): string {
  return [
    '# Authority Reality Convergence Validation',
    '',
    `- Checks: ${checkCount}`,
    `- Failed: ${failedCount}`,
    `- Result: **${passed ? 'PASS' : 'FAIL'}**`,
    passed ? `- Pass token: **AUTHORITY_REALITY_CONVERGENCE_PASS**` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
