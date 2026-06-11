/**
 * Launch Readiness Authority Report Builder.
 */

import { AUTHORITY_WEIGHTS, LAUNCH_READINESS_REPORT_TITLE } from './launch-readiness-thresholds.js';
import type { LaunchReadinessAuthorityAssessment } from './launch-readiness-types.js';

export function buildLaunchReadinessReportMarkdown(
  assessment: LaunchReadinessAuthorityAssessment,
  generatedAt: number,
): string {
  const date = new Date(generatedAt).toISOString();
  const verdict =
    assessment.recommendation === 'READY_FOR_PUBLIC_LAUNCH'
      ? 'Evidence supports public launch readiness — this is the official launch recommendation synthesis.'
      : assessment.recommendation === 'NOT_READY_FOR_LAUNCH'
        ? 'Launch is not supported by current authority evidence.'
        : `Launch recommendation: ${assessment.recommendation.replaceAll('_', ' ')} based on weighted authority evidence.`;

  const weightingLines = Object.entries(AUTHORITY_WEIGHTS)
    .map(([authorityId, weight]) => `- ${authorityId}: **${Math.round(weight * 1000) / 10}%**`)
    .join('\n');

  const evidenceLines = assessment.evidenceBreakdown.length
    ? assessment.evidenceBreakdown
        .map(
          (entry) =>
            `- **${entry.authorityName}** (${entry.weightPercent}%): ${entry.score}/100 · ${entry.status}` +
            `${entry.launchBlocker ? ' · BLOCKER' : ''}`,
        )
        .join('\n')
    : '- No evidence authorities evaluated.';

  return `# ${LAUNCH_READINESS_REPORT_TITLE}

Generated: ${date}
Final launch synthesis — evidence from all Launch Council authorities

## Launch Readiness Summary

Launch readiness authority score: **${assessment.launchReadinessAuthorityScore}/100**

Recommendation: **${assessment.recommendation.replaceAll('_', ' ')}**

Readiness state: **${assessment.readinessState}**

Blocking authorities: **${assessment.blockingAuthorityCount}**

Supporting authorities: **${assessment.supportingAuthorityCount}**

Core question: **Given everything we know, what is the correct launch recommendation?**

## Recommendation

**${assessment.recommendation.replaceAll('_', ' ')}**

${assessment.rationale}

## Confidence Score

Launch confidence score: **${assessment.launchConfidenceScore}/100**

Evidence authorities consumed: **${assessment.decision.evidenceCount}**

## Supporting Authorities

${assessment.decision.supportingAuthorities.length ? assessment.decision.supportingAuthorities.map((item) => `- ${item}`).join('\n') : '- None recorded.'}

## Blocking Authorities

${assessment.blockers.length ? assessment.blockers.map((item) => `- ${item}`).join('\n') : '- None recorded.'}

## Strengths

${assessment.strengths.length ? assessment.strengths.map((item) => `- ${item}`).join('\n') : '- None recorded.'}

## Risks

${assessment.blockers.length ? assessment.blockers.map((item) => `- ${item}`).join('\n') : '- No blocking risks surfaced from authority outputs.'}

## Recommendations

${assessment.recommendations.length ? assessment.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. A launch decision should be the result of evidence, not hope.'}

## Evidence Breakdown

${evidenceLines}

## Authority Weighting

${weightingLines}

## Launch Readiness Verdict

${verdict}
`;
}
