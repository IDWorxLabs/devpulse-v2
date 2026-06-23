/**
 * Phase 26.91 — Authority evidence source realignment report builder (V1).
 */

import type { AuthorityEvidenceSourceRealignmentReport } from './authority-evidence-source-realignment-types.js';
import {
  AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_CORE_QUESTION,
  AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_PASS,
  AUTHORITY_SOURCE_REALIGNMENT_RULES,
} from './authority-evidence-source-realignment-registry.js';

export function buildAuthorityEvidenceSourceRealignmentReportMarkdown(
  report: AuthorityEvidenceSourceRealignmentReport,
): string {
  const lines = [
    '# Authority Evidence Source Realignment Report',
    '',
    `**Realignment ID:** ${report.realignmentId}`,
    `**Generated:** ${report.generatedAt}`,
    '',
    '## Core question',
    '',
    report.coreQuestion,
    '',
    '## Canonical rules',
    '',
    ...AUTHORITY_SOURCE_REALIGNMENT_RULES.map((rule) => `- ${rule}`),
    '',
    '## Authoritative sources',
    '',
    `| Signal | Value |`,
    `|--------|-------|`,
    `| authoritativeWorkspace | ${report.authoritative.authoritativeWorkspaceId ?? 'n/a'} |`,
    `| authoritativeRunId | ${report.authoritative.authoritativeRunId ?? 'n/a'} |`,
    `| authoritativeManifest | ${report.authoritative.authoritativeManifestId ?? 'n/a'} |`,
    `| finalApplicationTruth | ${report.authoritative.finalApplicationTruth} |`,
    `| applicationBoots | ${report.authoritative.applicationBoots} |`,
    `| routesReachable | ${report.authoritative.routesReachable} |`,
    `| uiRenders | ${report.authoritative.uiRenders} |`,
    `| founderFlowProven | ${report.authoritative.founderFlowProven} |`,
    '',
    '## Authority audit',
    '',
    ...report.authorityRecords.map(
      (r) =>
        `- **${r.authorityName}** workspace=${r.workspaceId ?? 'n/a'} runId=${r.runId ?? 'n/a'} verdict=${r.verdict} stale=${r.evidenceStale} source=${r.dataSource}`,
    ),
    '',
    '## Stale findings',
    '',
    ...(report.staleFindings.length
      ? report.staleFindings.map((f) => `- ${f.authorityName}: ${f.failureClass} — ${f.detail}`)
      : ['- none']),
    '',
    '## Realignment plan',
    '',
    `- realignmentRequired: ${report.realignmentPlan.realignmentRequired}`,
    `- staleAuthorities: ${report.realignmentPlan.staleAuthorityCount}`,
    `- staleLaunchBlockers reclassified: ${report.staleLaunchBlockersReclassified}`,
    `- genuine product gap blockers: ${report.genuineProductGapBlockers}`,
    `- actions: ${report.realignmentPlan.actions.join(' → ') || 'none'}`,
    '',
  ];

  if (report.passToken === AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_PASS) {
    lines.push('## Result', '', `**PASS:** ${AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_PASS}`, '');
  }

  return lines.join('\n');
}

export function buildAuthorityStaleEvidenceAuditMarkdown(
  report: AuthorityEvidenceSourceRealignmentReport,
): string {
  return [
    '# Authority Stale Evidence Audit',
    '',
    AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_CORE_QUESTION,
    '',
    '## Per-authority checklist',
    '',
    ...report.authorityRecords.map((r) => {
      const checks = [
        `[${r.workspaceId ? 'x' : ' '}] workspace: ${r.workspaceId ?? 'none'}`,
        `[${r.runId ? 'x' : ' '}] runId: ${r.runId ?? 'none'}`,
        `[${r.manifestId ? 'x' : ' '}] manifest: ${r.manifestId ?? 'none'}`,
        `[${!r.evidenceStale ? 'x' : ' '}] evidence fresh`,
        `[${!r.contradictsAuthoritativeRuntime ? 'x' : ' '}] agrees with authoritative truth`,
      ];
      return `### ${r.authorityName}\n\n${checks.map((c) => `- ${c}`).join('\n')}`;
    }),
    '',
    '## Stale findings summary',
    '',
    ...report.staleFindings.map((f) => `- ${f.failureClass}: ${f.detail}`),
    '',
  ].join('\n');
}

export function buildAuthoritySourceAlignmentValidationMarkdown(
  report: AuthorityEvidenceSourceRealignmentReport,
  checks: readonly { name: string; passed: boolean; detail: string }[],
): string {
  return [
    '# Authority Source Alignment Validation',
    '',
    `Result: ${report.passToken ?? 'FAILED'}`,
    '',
    ...checks.map((c) => `- [${c.passed ? 'x' : ' '}] ${c.name}: ${c.detail}`),
    '',
  ].join('\n');
}
