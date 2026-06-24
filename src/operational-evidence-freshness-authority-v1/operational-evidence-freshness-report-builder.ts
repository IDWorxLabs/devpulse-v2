/**
 * Operational Evidence Freshness Authority V1 — markdown report builder.
 */

import {
  OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_PASS_TOKEN,
  OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_REPORT_TITLE,
} from './operational-evidence-freshness-v1-bounds.js';
import type { OperationalEvidenceFreshnessAssessment } from './operational-evidence-freshness-v1-types.js';

export function buildOperationalEvidenceFreshnessAuthorityV1ReportMarkdown(
  assessment: OperationalEvidenceFreshnessAssessment,
): string {
  const capRows = assessment.capabilityFreshness
    .slice(0, 16)
    .map(
      (c) =>
        `| ${c.capability} | ${c.status} | ${c.proofAgeDays}d | ${c.freshnessScore} | ${c.confidenceAdjustment}% | ${c.recommendedAction} |`,
    )
    .join('\n');

  const monitorRows = assessment.criticalProofMonitoring
    .map((m) => `| ${m.monitor} | ${m.status} | ${m.freshnessScore} | ${m.lastValidatedAt} |`)
    .join('\n');

  return [
    `# ${OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_REPORT_TITLE.replace('.md', '')}`,
    '',
    `Generated: ${assessment.generatedAt}`,
    '',
    '## Executive Summary',
    '',
    'Operational Evidence Freshness Authority V1 continuously assesses whether operational proof remains trustworthy. Proof has a lifespan — evidence generated today should not be treated as equally reliable months later without reassessment.',
    '',
    `- Evidence sources consumed: ${assessment.evidenceSourcesConsumed}`,
    `- Capabilities assessed: ${assessment.capabilitiesAssessed}`,
    `- Overall freshness score: ${assessment.overallFreshnessScore}/100`,
    `- Fresh: ${assessment.registry.freshCount} · Aging: ${assessment.registry.agingCount} · Stale: ${assessment.registry.staleCount} · Expired: ${assessment.registry.expiredCount}`,
    `- Freshness proof status: ${assessment.freshnessProofStatus}`,
    '',
    '## Capability Freshness',
    '',
    '| Capability | Status | Age | Score | Confidence | Action |',
    '| --- | --- | --- | --- | --- | --- |',
    capRows,
    '',
    '## Critical Proof Monitoring',
    '',
    '| Monitor | Status | Score | Last Validated |',
    '| --- | --- | --- | --- |',
    monitorRows,
    '',
    '## Confidence Decay Model',
    '',
    `- FRESH → ${assessment.confidenceDecay.decayByStatus.FRESH}%`,
    `- AGING → ${assessment.confidenceDecay.decayByStatus.AGING}%`,
    `- STALE → ${assessment.confidenceDecay.decayByStatus.STALE}%`,
    `- EXPIRED → ${assessment.confidenceDecay.decayByStatus.EXPIRED}%`,
    '',
    '## Revalidation Recommendations',
    '',
    ...assessment.revalidationRecommendations.slice(0, 8).map(
      (r) =>
        `- **${r.capability}**: ${r.action} (${r.tier}) — ${r.rationale.slice(0, 120)}`,
    ),
    '',
    '## Evidence Drift',
    '',
    `- Drift detected: ${assessment.evidenceDrift.driftDetected ? 'Yes' : 'No'}`,
    `- Drift entries: ${assessment.evidenceDrift.entries.length}`,
    '',
    '## Freshness Incidents (Unified Failure Escalation eligible)',
    '',
    `- Incidents: ${assessment.freshnessIncidents.length}`,
    ...assessment.freshnessIncidents.slice(0, 5).map(
      (i) => `- ${i.sourceCapability} (${i.severity}): ${i.detail.slice(0, 100)}`,
    ),
    '',
    '## Success Criteria',
    '',
    '| Question | Answer |',
    '| --- | --- |',
    `| Is the evidence still fresh? | ${assessment.registry.freshCount + assessment.registry.agingCount > 0 ? 'Yes' : 'Partial'} |`,
    `| Which proofs are aging? | ${assessment.registry.agingCount} tracked |`,
    `| Which proofs are stale? | ${assessment.registry.staleCount} tracked |`,
    `| Which proofs require revalidation? | ${assessment.registry.staleCount + assessment.registry.expiredCount} |`,
    `| Can confidence decay be measured? | ${assessment.confidenceDecayProven ? 'Yes' : 'No'} |`,
    `| Can stale proof trigger escalation? | ${assessment.staleEscalationProven ? 'Yes' : 'No'} |`,
    '',
    '## Pass Token',
    '',
    assessment.passToken === OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_PASS_TOKEN
      ? `Pass token: \`${OPERATIONAL_EVIDENCE_FRESHNESS_AUTHORITY_V1_PASS_TOKEN}\``
      : `Status: \`${assessment.passToken}\``,
    '',
  ].join('\n');
}
