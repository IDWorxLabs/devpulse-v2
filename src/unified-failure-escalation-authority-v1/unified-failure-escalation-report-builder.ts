/**
 * Unified Failure Escalation Authority V1 — markdown report builder.
 */

import {
  UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_PASS_TOKEN,
  UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_REPORT_TITLE,
} from './unified-failure-escalation-v1-bounds.js';
import type { UnifiedFailureEscalationAssessment } from './unified-failure-escalation-v1-types.js';

export function buildUnifiedFailureEscalationAuthorityV1ReportMarkdown(
  assessment: UnifiedFailureEscalationAssessment,
): string {
  const incidentRows = assessment.registry.incidents
    .slice(0, 12)
    .map(
      (i) =>
        `| ${i.sourceSystem} | ${i.classification} | ${i.severity} | ${i.canonicalOwner} | ${i.recommendedAction} | ${i.status} |`,
    )
    .join('\n');

  return [
    `# ${UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_REPORT_TITLE.replace('.md', '')}`,
    '',
    `Generated: ${assessment.generatedAt}`,
    '',
    '## Executive Summary',
    '',
    'Unified Failure Escalation Authority V1 provides a single authority for failure classification, root cause analysis, canonical ownership resolution, and escalation strategy selection.',
    '',
    `- Source systems consumed: ${assessment.sourceSystemsConsumed}`,
    `- Incidents processed: ${assessment.incidentsProcessed}`,
    `- Three-failure rule proven: ${assessment.threeFailureRuleProven ? 'Yes' : 'No'}`,
    `- World2 escalation proven: ${assessment.world2EscalationProven ? 'Yes' : 'No'}`,
    `- Capability evolution path proven: ${assessment.evolutionEscalationProven ? 'Yes' : 'No'}`,
    `- Single authority proven: ${assessment.singleAuthorityProven ? 'Yes' : 'No'}`,
    `- Escalation proof status: ${assessment.escalationProofStatus}`,
    '',
    '## Incident Registry',
    '',
    '| Source | Classification | Severity | Owner | Action | Status |',
    '| --- | --- | --- | --- | --- | --- |',
    incidentRows,
    '',
    '## Three-Failure Rule',
    '',
    ...assessment.repeatedFailureAnalysis.map(
      (r) =>
        `- **${r.fingerprint}**: #1 ${r.firstStrategy} → #2 ${r.secondStrategy} → #3 ${r.thirdStrategy} (${r.threeFailureRuleEnforced ? 'ENFORCED' : 'OPEN'})`,
    ),
    '',
    '## Effectiveness',
    '',
    `- Resolved rate: ${assessment.effectivenessAssessment.resolvedRate}%`,
    `- Repeat rate: ${assessment.effectivenessAssessment.repeatRate}%`,
    `- Repair success rate: ${assessment.effectivenessAssessment.repairSuccessRate}%`,
    `- Evolution success rate: ${assessment.effectivenessAssessment.evolutionSuccessRate}%`,
    '',
    '## Success Criteria',
    '',
    '| Question | Answer |',
    '| --- | --- |',
    `| What failed? | Known (${assessment.incidentsProcessed} incidents) |`,
    `| Why did it fail? | Root cause analyzed |`,
    `| Who owns the failure? | Canonical owner linked |`,
    `| What should happen next? | Escalation strategy selected |`,
    `| Can repeated failures escalate automatically? | ${assessment.threeFailureRuleProven ? 'Yes' : 'No'} |`,
    `| Can World2 experiments be triggered safely? | ${assessment.world2EscalationProven ? 'Yes' : 'No'} |`,
    `| Can capability evolution be triggered safely? | ${assessment.evolutionEscalationProven ? 'Yes' : 'No'} |`,
    '',
    '## Pass Token',
    '',
    assessment.passToken === UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_PASS_TOKEN
      ? `Pass token: \`${UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_PASS_TOKEN}\``
      : `Status: \`${assessment.passToken}\``,
    '',
  ].join('\n');
}
