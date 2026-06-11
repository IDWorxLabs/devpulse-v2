/**
 * Launch Verdict Governance — markdown report builder.
 */

import type { FounderTestV4ReportWithLaunchCouncilFinalization } from '../founder-testing-mode/founder-testing-v4-types.js';
import { LAUNCH_VERDICT_GOVERNANCE_REPORT_TITLE } from './launch-verdict-governance-bounds.js';
import type { LaunchVerdictGovernanceAssessment } from './launch-verdict-governance-types.js';

function listSection(title: string, items: string[]): string {
  if (items.length === 0) return `### ${title}\n\nNone recorded.`;
  return `### ${title}\n\n${items.map((item) => `- ${item}`).join('\n')}`;
}

export function buildLaunchVerdictGovernanceReportMarkdown(
  assessment: LaunchVerdictGovernanceAssessment,
  report: FounderTestV4ReportWithLaunchCouncilFinalization,
): string {
  const ruleEvaluationLines = assessment.ruleEvaluations
    .map(
      (entry) =>
        `- **${entry.ruleId}** [${entry.group}] ${entry.description} — **${entry.outcome}** (${entry.detail})`,
    )
    .join('\n');

  return `# ${LAUNCH_VERDICT_GOVERNANCE_REPORT_TITLE}

## Governance Summary

Final launch verdict: **${assessment.finalLaunchVerdict.replaceAll('_', ' ')}**

Verdict eligibility (earned level): **${assessment.verdictEligibility.replaceAll('_', ' ')}**

Governance score: **${assessment.governanceScore}/100**

Governance confidence: **${assessment.governanceConfidence}/100**

Satisfied rules: **${assessment.satisfiedRuleCount}** | Failed rules: **${assessment.failedRuleCount}** | Blocking rules: **${assessment.blockingRuleCount}**

Only Launch Verdict Governance may produce a final launch verdict. Launch Readiness recommendation remains advisory: **${report.launchReadinessAuthority.recommendation.replaceAll('_', ' ')}**.

## Final Launch Verdict

**${assessment.finalLaunchVerdict.replaceAll('_', ' ')}**

Can this launch publicly? ${assessment.finalLaunchVerdict === 'READY_FOR_PUBLIC_LAUNCH' ? 'Governance permission granted for public launch.' : 'Public launch has not been earned.'}

## Governance Confidence

Governance confidence is separate from the verdict. A READY_FOR_PRIVATE_BETA verdict with low confidence is possible.

Confidence inputs: council confidence (${report.launchCouncilFinalization.councilConfidence}/100), reality proof (${report.realityProofAuthority.realityProofScore}/100), adoption evidence confidence (${report.adoptionPredictionAuthority.evidenceConfidenceScore}/100), real user evidence (${report.realUserRealityAuthority.realUserEvidenceCount} signals).

## Rule Evaluation

${ruleEvaluationLines || 'No rules evaluated.'}

## Satisfied Rules

${listSection('Satisfied', assessment.satisfiedRules)}

## Failed Rules

${listSection('Failed', assessment.failedRules)}

## Missing Evidence

${listSection('Required Evidence Missing', assessment.requiredEvidenceMissing)}

## Blocking Authorities

${listSection('Blocking Authorities', assessment.blockingAuthorities)}

## Governance Recommendations

${assessment.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. No authority may declare a launch without governance permission.'}

## Governance Verdict Reasoning

${assessment.governanceReasoning.map((line) => `- ${line}`).join('\n') || '- Governance reasoning unavailable.'}

What verdict has actually been earned? **${assessment.finalLaunchVerdict.replaceAll('_', ' ')}** (eligibility cap: **${assessment.verdictEligibility.replaceAll('_', ' ')}**).
`;
}
