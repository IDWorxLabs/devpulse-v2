/**
 * Evidence Propagation Reconciliation — report builder (Phase 26.88).
 */

import {
  EVIDENCE_PROPAGATION_RECONCILIATION_CORE_QUESTION,
  EVIDENCE_PROPAGATION_RECONCILIATION_PASS,
} from './evidence-propagation-reconciliation-registry.js';
import type {
  EvidencePropagationReconciliation,
  EvidencePropagationReconciliationReport,
} from './evidence-propagation-reconciliation-types.js';

export function buildEvidencePropagationReconciliationReportMarkdown(
  report: EvidencePropagationReconciliationReport,
): string {
  const rec = report.reconciliation;
  const auth = rec.authoritativeRuntimeTruth;
  return [
    '# Evidence Propagation Reconciliation Report',
    '',
    `Generated: ${report.generatedAt}`,
    `Reconciliation ID: ${report.reconciliationId}`,
    '',
    '## Core Question',
    '',
    report.coreQuestion,
    '',
    '## Runtime Truth',
    '',
    `- finalApplicationTruth (before): **${rec.preReconciliationApplicationTruth}**`,
    `- finalApplicationTruth (after): **${rec.postReconciliationApplicationTruth}**`,
    `- filesExistOnDisk: ${auth.filesExistOnDisk}`,
    `- dependenciesReady: ${auth.dependenciesReady}`,
    `- applicationBoots: ${auth.applicationBoots}`,
    `- routesReachable: ${auth.routesReachable}`,
    `- uiRenders: ${auth.uiRenders}`,
    `- founderFlowProven: ${auth.founderFlowProven}`,
    `- finalReportDelivered: ${auth.finalReportDelivered}`,
    `- authoritativeWorkspaceId: ${auth.authoritativeWorkspaceId ?? 'n/a'}`,
    `- authoritativeRunId: ${auth.authoritativeRunId ?? 'n/a'}`,
    '',
    '## Authority Evidence Sources',
    '',
    '| Authority | Workspace | RunId | Verdict | Runtime Bridge |',
    '| --- | --- | --- | --- | --- |',
    ...rec.authorityEvidenceSources.map(
      (s) =>
        `| ${s.displayName} | ${s.workspaceId ?? 'n/a'} | ${s.runId ?? 'n/a'} | ${s.applicationVerdict} | ${s.consumesRuntimeBridge} |`,
    ),
    '',
    '## Stale Evidence',
    '',
    ...(rec.staleEvidence.length
      ? rec.staleEvidence.map(
          (s) => `- **${s.kind}** (${s.authorityId}): ${s.staleValue} → authoritative ${s.authoritativeValue ?? 'n/a'} — ${s.detail}`,
        )
      : ['- None detected']),
    '',
    '## Contradictions',
    '',
    ...(rec.contradictions.length
      ? rec.contradictions.map(
          (c) =>
            `- **${c.displayName}**: ${c.authorityVerdict} vs ${c.authoritativeVerdict} (${c.rootCause}) — ${c.detail}`,
        )
      : ['- None detected']),
    '',
    '## Reconciliation',
    '',
    `- rootCause: **${rec.rootCause}**`,
    `- authorityAgreement (before): ${rec.preAuthorityAgreement}`,
    `- authorityAgreement (after): ${rec.postAuthorityAgreement}`,
    `- launchVerdict (before): ${rec.preLaunchVerdict ?? 'n/a'}`,
    `- launchVerdict (after): ${rec.postLaunchVerdict ?? 'n/a'}`,
    `- rulesApplied: ${rec.rulesApplied.length}`,
    ...rec.rulesApplied.map((r) => `  - ${r}`),
    '',
    '## Final Truth',
    '',
    `- **${rec.postReconciliationApplicationTruth}**`,
    `- authorityAgreement=${rec.authorityAgreement}`,
    `- recommendedFix: ${rec.recommendedFix}`,
    '',
    `Pass token: ${EVIDENCE_PROPAGATION_RECONCILIATION_PASS}`,
    '',
  ].join('\n');
}

export function buildEvidencePropagationAuditReportMarkdown(
  reconciliation: EvidencePropagationReconciliation,
): string {
  return [
    '# Evidence Propagation Audit Report',
    '',
    `Generated: ${reconciliation.generatedAt}`,
    '',
    '## Consumer Audit',
    '',
    `- runtimeBridgeConsumed: ${reconciliation.authoritativeRuntimeTruth.runtimeBridgeConsumed}`,
    `- staleFindings: ${reconciliation.staleEvidence.length}`,
    `- contradictions: ${reconciliation.contradictions.length}`,
    '',
    '## Authority → Workspace → RunId → Verdict',
    '',
    ...reconciliation.authorityEvidenceSources.map(
      (s) =>
        `- ${s.displayName} → ${s.workspaceId ?? 'n/a'} → ${s.runId ?? 'n/a'} → ${s.applicationVerdict}${s.evidenceStale ? ' (STALE)' : ''}`,
    ),
    '',
  ].join('\n');
}

export function buildAuthorityVerdictAlignmentReportMarkdown(
  reconciliation: EvidencePropagationReconciliation,
): string {
  return [
    '# Authority Verdict Alignment Report',
    '',
    `Generated: ${reconciliation.generatedAt}`,
    '',
    '## Before vs After',
    '',
    `| Field | Before | After |`,
    `| --- | --- | --- |`,
    `| applicationTruth | ${reconciliation.preReconciliationApplicationTruth} | ${reconciliation.postReconciliationApplicationTruth} |`,
    `| authorityAgreement | ${reconciliation.preAuthorityAgreement} | ${reconciliation.postAuthorityAgreement} |`,
    `| launchVerdict | ${reconciliation.preLaunchVerdict ?? 'n/a'} | ${reconciliation.postLaunchVerdict ?? 'n/a'} |`,
    `| rootCause | — | ${reconciliation.rootCause} |`,
    '',
    '## Reconciled Contradictions',
    '',
    ...(reconciliation.contradictions.length
      ? reconciliation.contradictions.map((c) => `- ${c.displayName}: ${c.detail}`)
      : ['- All authorities aligned']),
    '',
  ].join('\n');
}
