/**
 * Phase 26.94 — Execution Proof Source Unification report builder (V1).
 */

import {
  EXECUTION_PROOF_AUDIT_TARGETS,
  EXECUTION_PROOF_SOURCE_UNIFICATION_CORE_QUESTION,
  EXECUTION_PROOF_UNIFICATION_RULES,
  UNIFICATION_INTEGRATION_TARGETS,
} from './execution-proof-source-unification-registry.js';
import type { ExecutionProofSourceUnificationReport } from './execution-proof-source-unification-types.js';

export function buildExecutionProofSourceUnificationReportMarkdown(
  report: ExecutionProofSourceUnificationReport,
): string {
  const lines: string[] = [
    '# Execution Proof Source Unification Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Unification ID: ${report.unificationId}`,
    '',
    '## Core Question',
    '',
    EXECUTION_PROOF_SOURCE_UNIFICATION_CORE_QUESTION,
    '',
    '## Rules',
    '',
    ...EXECUTION_PROOF_UNIFICATION_RULES.map((r) => `- ${r}`),
    '',
    '## Authoritative Execution Source',
    '',
    `- Workspace: **${report.authoritative.authoritativeWorkspaceId ?? 'n/a'}**`,
    `- RunId: **${report.authoritative.authoritativeRunId ?? 'n/a'}**`,
    `- Manifest: **${report.authoritative.authoritativeManifestId ?? 'n/a'}**`,
    `- Application truth: **${report.authoritative.finalApplicationTruth}**`,
    `- Runtime bridge consumed: **${report.authoritative.runtimeBridgeConsumed ? 'yes' : 'no'}**`,
    '',
    '## Reconciliation',
    '',
    `- Single authoritative chain: **${report.reconciliation.singleAuthoritativeChain ? 'yes' : 'no'}**`,
    `- Stale-only blockers reclassified: **${report.reconciliation.staleOnlyBlockersReclassified}**`,
    `- Genuine product gap blockers: **${report.reconciliation.genuineProductGapBlockers}**`,
    `- Conflicting sources: **${report.reconciliation.conflictingSourceCount}**`,
    '',
    '## Consumer Audit',
    '',
    '| Authority | Workspace | RunId | Classification | Verdict |',
    '|-----------|-----------|-------|----------------|---------|',
  ];

  for (const record of report.consumerRecords) {
    lines.push(
      `| ${record.authorityName} | ${record.workspaceId ?? 'n/a'} | ${record.runId ?? 'n/a'} | ${record.classification} | ${record.verdict} |`,
    );
  }

  lines.push('');
  lines.push('## Stale Findings');
  lines.push('');
  if (report.staleFindings.length) {
    for (const finding of report.staleFindings) {
      lines.push(`- **${finding.classification}** @ ${finding.authorityName}: ${finding.detail}`);
    }
  } else {
    lines.push('- None');
  }

  lines.push('');
  lines.push('## Integration Targets');
  lines.push('');
  for (const target of UNIFICATION_INTEGRATION_TARGETS) {
    lines.push(`- ${target}`);
  }

  lines.push('');
  report.passToken ? lines.push(`Pass token: **${report.passToken}**`) : lines.push('Pass token: not issued');

  return lines.join('\n');
}

export function buildExecutionProofSourceAuditMarkdown(
  report: ExecutionProofSourceUnificationReport,
): string {
  const lines: string[] = [
    '# Execution Proof Source Audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Audit Targets',
    '',
  ];

  for (const target of EXECUTION_PROOF_AUDIT_TARGETS) {
    const record = report.consumerRecords.find((r) => r.authorityId === target);
    lines.push(`### ${record?.authorityName ?? target}`);
    lines.push('');
    lines.push(`- Workspace source: ${record?.workspaceSource ?? 'n/a'}`);
    lines.push(`- RunId source: ${record?.runIdSource ?? 'n/a'}`);
    lines.push(`- Manifest source: ${record?.manifestSource ?? 'n/a'}`);
    lines.push(`- Report source: ${record?.reportSource ?? 'n/a'}`);
    lines.push(`- Classification: **${record?.classification ?? 'SOURCE_NOT_DISCOVERABLE'}**`);
    lines.push('');
  }

  return lines.join('\n');
}

export function buildExecutionProofSourceReconciliationMarkdown(
  report: ExecutionProofSourceUnificationReport,
): string {
  const { reconciliation } = report;
  return [
    '# Execution Proof Source Reconciliation',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Unified Sources',
    '',
    `- Workspace: ${reconciliation.unifiedWorkspaceId ?? 'n/a'}`,
    `- RunId: ${reconciliation.unifiedRunId ?? 'n/a'}`,
    `- Manifest: ${reconciliation.unifiedManifestId ?? 'n/a'}`,
    '',
    '## Actions',
    '',
    ...reconciliation.actions.map((a) => `- ${a}`),
    '',
    `Pre-unification agreement: **${report.preUnificationAgreement ? 'yes' : 'no'}**`,
    `Post-unification agreement: **${report.postUnificationAgreement ? 'yes' : 'no'}**`,
  ].join('\n');
}

export function buildExecutionProofSourceUnificationValidationMarkdown(
  report: ExecutionProofSourceUnificationReport,
): string {
  return [
    '# Execution Proof Source Unification Validation',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `- Authoritative workspace: ${report.authoritative.authoritativeWorkspaceId ?? 'missing'}`,
    `- Authoritative runId: ${report.authoritative.authoritativeRunId ?? 'missing'}`,
    `- Stale findings: ${report.staleFindings.length}`,
    `- Pass token: ${report.passToken ?? 'none'}`,
    '',
    report.passToken ? `**${report.passToken}**` : 'Validation did not pass.',
  ].join('\n');
}
