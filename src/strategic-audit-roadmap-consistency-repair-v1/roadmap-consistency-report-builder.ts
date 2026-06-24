/**
 * Strategic Audit Roadmap Consistency Repair V1 — markdown report builder.
 */

import {
  STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_PASS_TOKEN,
  STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_REPORT_TITLE,
} from './strategic-audit-roadmap-consistency-repair-v1-bounds.js';
import type { StrategicAuditRoadmapConsistencyRepairAssessment } from './strategic-audit-roadmap-consistency-repair-v1-types.js';

export function buildStrategicAuditRoadmapConsistencyRepairV1ReportMarkdown(
  assessment: StrategicAuditRoadmapConsistencyRepairAssessment,
): string {
  const rows = assessment.consistencyAnalysis
    .map(
      (i) =>
        `| ${i.capability} | ${i.passToken ? 'PASS' : '—'} | ${i.roadmapAction} | ${i.capabilityAuditAction} | ${i.consistencyStatus} |`,
    )
    .join('\n');

  return [
    `# ${STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_REPORT_TITLE.replace('.md', '')}`,
    '',
    `Generated: ${assessment.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Audits agree: **${assessment.auditsAgree ? 'YES' : 'NO'}**`,
    `- GP V1 COMPLETE in roadmap: **${assessment.generalPurposeV1CompleteInRoadmap ? 'YES' : 'NO'}**`,
    `- GP V1 not top gap: **${assessment.generalPurposeV1NotTopGap ? 'YES' : 'NO'}**`,
    `- Evidence-driven roadmap: **${assessment.evidenceDrivenRoadmapProven ? 'YES' : 'NO'}**`,
    `- Conflicts: ${assessment.conflictingItems} · Stale: ${assessment.staleItems} · Duplicate: ${assessment.duplicateItems} · Consistent: ${assessment.consistentItems}`,
    '',
    '## Roadmap Consistency Assessment',
    '',
    '| Capability | Pass Token | Strategic Action | Capability Audit | Status |',
    '| --- | --- | --- | --- | --- |',
    rows,
    '',
    '## Resolved Priorities',
    '',
    ...assessment.resolvedPriorities.map(
      (p) => `- **${p.rank}. ${p.phase}** (${p.action}) — ${p.evidenceBasis.slice(0, 80)}`,
    ),
    '',
    '## Success Criteria',
    '',
    '| Question | Answer |',
    '| --- | --- |',
    `| Which roadmap items are complete? | ${assessment.resolvedPriorities.filter((p) => p.action === 'COMPLETE').map((p) => p.phase).join(', ') || 'None'} |`,
    `| Which roadmap items are genuine gaps? | ${assessment.resolvedPriorities.filter((p) => p.action !== 'COMPLETE').map((p) => p.phase).join(', ') || 'None'} |`,
    `| Do audits agree? | ${assessment.auditsAgree ? 'Yes' : 'No'} |`,
    `| Can completed capabilities reappear as top priorities? | ${assessment.completedCapabilitiesCannotReappear ? 'No' : 'Yes'} |`,
    '',
    '## Pass Token',
    '',
    assessment.passToken === STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_PASS_TOKEN
      ? `\`${STRATEGIC_AUDIT_ROADMAP_CONSISTENCY_REPAIR_V1_PASS_TOKEN}\``
      : assessment.passToken,
    '',
  ].join('\n');
}
