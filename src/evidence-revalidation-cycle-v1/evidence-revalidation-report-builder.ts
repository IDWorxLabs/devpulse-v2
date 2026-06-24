/**
 * Evidence Revalidation Cycle V1 — report builder.
 */

import type { EvidenceRevalidationCycleAssessment } from './evidence-revalidation-cycle-v1-types.js';
import { EVIDENCE_REVALIDATION_CYCLE_V1_PASS_TOKEN } from './evidence-revalidation-cycle-v1-bounds.js';

export function buildEvidenceRevalidationCycleV1ReportMarkdown(
  assessment: EvidenceRevalidationCycleAssessment,
): string {
  const pass = assessment.passToken === EVIDENCE_REVALIDATION_CYCLE_V1_PASS_TOKEN;

  const lines = [
    '# Evidence Revalidation Cycle V1 Report',
    '',
    `**Generated:** ${assessment.generatedAt}`,
    '',
    `**Pass Token:** \`${assessment.passToken}\``,
    '',
    `**Proof Status:** ${assessment.revalidationProofStatus}`,
    '',
    '## Summary',
    '',
    `- OEFA consumed: ${assessment.oefaConsumed ? 'YES' : 'NO'}`,
    `- Governance planner used: ${assessment.governancePlannerUsed ? 'YES' : 'NO'}`,
    `- Expired discovered: ${assessment.expiredDiscovered}`,
    `- Expired refreshed: ${assessment.expiredRefreshed}`,
    `- Revalidation scheduled: ${assessment.revalidationScheduled}`,
    `- Revalidation succeeded: ${assessment.revalidationSucceeded}`,
    `- Confidence recovered: ${assessment.confidenceRecoveryPoints} points`,
    `- Freshness before → after: ${assessment.overallFreshnessBefore} → ${assessment.overallFreshnessAfter}`,
    '',
    '## Confidence Recovery',
    '',
    `- Expired → Refreshed: ${assessment.confidenceRecovery.expiredToRefreshed}`,
    `- Stale → Fresh: ${assessment.confidenceRecovery.staleToFresh}`,
    `- Confidence Recovered: ${assessment.confidenceRecovery.confidenceRecovered}`,
    '',
    '## Audit Impact',
    '',
    `- Expired evidence gap closed: ${assessment.auditImpact.expiredEvidenceGapClosed ? 'YES' : 'NO'}`,
    `- Strategic roadmap updated: ${assessment.auditImpact.strategicRoadmapUpdated ? 'YES' : 'NO'}`,
    `- ${assessment.auditImpact.auditShouldReport}`,
    '',
    '## Revalidation Queue',
    '',
    ...assessment.queue.map(
      (q) =>
        `- **${q.priority}** ${q.capabilityId} (${q.currentStatus}) — ${q.recommendedAction} · ${q.validatorsToRun.length} validator(s)`,
    ),
    '',
    '## Results',
    '',
    ...assessment.results.map(
      (r) =>
        `- ${r.capabilityId}: ${r.priorStatus} → ${r.resultStatus} · proof refreshed: ${r.proofRefreshed ? 'YES' : 'NO'}`,
    ),
    '',
    pass
      ? '**EVIDENCE_REVALIDATION_CYCLE_V1_PASS** — expired evidence refreshed, confidence recovered, freshness score increased.'
      : '**EVIDENCE_REVALIDATION_CYCLE_V1_FAIL** — revalidation cycle incomplete.',
    '',
  ];

  return lines.join('\n');
}
