/**
 * Strategic Capability Audit V4 — markdown report builder.
 */

import {
  STRATEGIC_CAPABILITY_AUDIT_V4_PASS_TOKEN,
  STRATEGIC_CAPABILITY_AUDIT_V4_REPORT_TITLE,
} from './strategic-capability-audit-v4-bounds.js';
import type { StrategicCapabilityAuditV4Assessment } from './strategic-capability-audit-v4-types.js';

export function buildStrategicCapabilityAuditV4ReportMarkdown(
  assessment: StrategicCapabilityAuditV4Assessment,
): string {
  const questionRows = assessment.capabilityQuestions
    .map((q) => `| ${q.question} | ${q.answer} | ${q.score}/100 | ${q.evidence.slice(0, 80)}… |`)
    .join('\n');

  const gapRows = assessment.remainingGaps
    .slice(0, 12)
    .map(
      (g) =>
        `| ${g.category} | ${g.capability} | ${g.severity} | ${g.strategicValueScore} | ${g.detail.slice(0, 60)}… |`,
    )
    .join('\n');

  const roadmapRows = assessment.roadmapV4
    .map(
      (r) =>
        `| ${r.rank} | ${r.phase} | ${r.action} | ${r.impact} | ${r.rationale.slice(0, 70)}… |`,
    )
    .join('\n');

  return [
    `# ${STRATEGIC_CAPABILITY_AUDIT_V4_REPORT_TITLE.replace('.md', '')}`,
    '',
    `Generated: ${assessment.generatedAt}`,
    '',
    '## Executive Summary',
    '',
    'Strategic Capability Audit V4 is a **fresh, evidence-driven** assessment. It does not inherit the Capability Audit V3 roadmap or assume prior phase priorities. All conclusions derive from current artifact evidence across proven authorities.',
    '',
    `- Evidence sources consumed: ${assessment.evidenceSourcesConsumed}`,
    `- Strategic dimensions assessed: ${assessment.strategicDimensionsAssessed}`,
    `- Factory readiness: ${assessment.factoryReadiness.overallScore}/100 (${assessment.factoryReadiness.softwareFactoryReady ? 'READY' : 'PARTIAL'})`,
    `- Autonomy readiness: ${assessment.autonomyReadiness.overallScore}/100`,
    `- Commercialization readiness: ${assessment.commercializationReadiness.overallScore}/100`,
    `- No major factory capability gaps: ${assessment.noMajorGapsConclusion ? '**Yes**' : 'No'}`,
    '',
    '## Capability Questions',
    '',
    '| Question | Answer | Score | Evidence |',
    '| --- | --- | --- | --- |',
    questionRows,
    '',
    '## Highest-Value Next Capability',
    '',
    assessment.highestValueNextCapability,
    '',
    '## Remaining Gaps (Evidence-Driven)',
    '',
    '| Category | Capability | Severity | Value | Detail |',
    '| --- | --- | --- | --- | --- |',
    gapRows,
    '',
    '## Recommended Roadmap V4',
    '',
    '| Rank | Phase | Action | Impact | Rationale |',
    '| --- | --- | --- | --- | --- |',
    roadmapRows,
    '',
    '## Factory Readiness',
    '',
    ...assessment.factoryReadiness.dimensions.map(
      (d) => `- **${d.dimension}**: ${d.score}/100 (${d.status}) — ${d.evidence}`,
    ),
    '',
    '## Autonomy Readiness',
    '',
    ...assessment.autonomyReadiness.dimensions.map(
      (d) => `- **${d.dimension}**: ${d.score}/100 (${d.status})`,
    ),
    '',
    '## Commercialization Readiness',
    '',
    ...assessment.commercializationReadiness.dimensions.map(
      (d) => `- **${d.dimension}**: ${d.score}/100 (${d.status})`,
    ),
    '',
    '## Prior Phases Complete',
    '',
    ...assessment.priorPhasesComplete.map((p) => `- ${p}`),
    '',
    '## Pass Token',
    '',
    assessment.passToken === STRATEGIC_CAPABILITY_AUDIT_V4_PASS_TOKEN
      ? `\`${STRATEGIC_CAPABILITY_AUDIT_V4_PASS_TOKEN}\``
      : assessment.passToken,
    '',
  ].join('\n');
}
