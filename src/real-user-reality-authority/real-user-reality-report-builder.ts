/**
 * Real User Reality Authority Report Builder.
 */

import { REAL_USER_REALITY_REPORT_TITLE } from './real-user-reality-bounds.js';
import type { RealUserEvidenceItem, RealUserRealityAssessment, RealUserRealityCategory } from './real-user-reality-types.js';

function sectionForCategory(
  assessment: RealUserRealityAssessment,
  category: RealUserRealityCategory,
): string {
  const items = assessment.evidenceItems.filter((item) => item.category === category);
  if (!items.length) return 'None evaluated.\n';
  return items
    .map(
      (item) =>
        `- **${item.summary}** [${item.evidenceType}]\n` +
        `  Source: ${item.source}`,
    )
    .join('\n');
}

function evidenceSummary(items: RealUserEvidenceItem[]): string {
  if (!items.length) return '- None recorded.\n';
  return items
    .map((item) => `- **${item.summary}** — ${item.evidenceType} (${item.source})`)
    .join('\n');
}

export function buildRealUserRealityReportMarkdown(
  assessment: RealUserRealityAssessment,
  generatedAt: number,
): string {
  const date = new Date(generatedAt).toISOString();
  const verdict = assessment.noRealUserEvidence
    ? 'NO_REAL_USER_EVIDENCE — the system must not claim that real users have proven success.'
    : assessment.readinessState === 'USERS_PROVE_SUCCESS'
      ? 'Real users have demonstrated success with supporting evidence.'
      : assessment.readinessState === 'BLOCKED'
        ? 'User outcome evidence blocks expanded launch exposure.'
        : 'Real user outcomes are mixed or incomplete — founder evidence is not real-user proof.';

  return `# ${REAL_USER_REALITY_REPORT_TITLE}

Generated: ${date}
Actual user outcome evaluation — real users versus founder proxies

## Real User Reality Summary

Real user reality score: **${assessment.realUserRealityScore}/100**

User evidence score: **${assessment.userEvidenceScore}/100**

User success score: **${assessment.userSuccessScore}/100**

User confusion score: **${assessment.userConfusionScore}/100**

User trust score: **${assessment.userTrustScore}/100**

User retention score: **${assessment.userRetentionScore}/100**

Real user evidence count: **${assessment.realUserEvidenceCount}**

Founder evidence count: **${assessment.founderOnlyEvidenceCount}**

No real user evidence: **${assessment.noRealUserEvidence ? 'Yes' : 'No'}**

Readiness state: **${assessment.readinessState}**

Blocks launch readiness: **${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}**

Core question: **What happened when real users actually used the product?**

## User Evidence

${evidenceSummary(assessment.evidenceItems)}

## User Understanding

${sectionForCategory(assessment, 'USER_UNDERSTANDING')}

## User Success

${sectionForCategory(assessment, 'USER_SUCCESS')}

## User Confusion

${sectionForCategory(assessment, 'USER_CONFUSION')}

## User Trust

${sectionForCategory(assessment, 'USER_TRUST')}

## User Retention

${sectionForCategory(assessment, 'USER_RETENTION')}

## Missing User Evidence

${assessment.noRealUserEvidence ? '- **NO_REAL_USER_EVIDENCE** — public launch requires real-user proof.\n' : '- Real-user evidence is present.\n'}
${assessment.findings.filter((finding) => finding.includes('NO_REAL_USER') || finding.includes('none')).map((finding) => `- ${finding}`).join('\n') || '- None beyond summary.'}

## Recommendations

${assessment.recommendations.length ? assessment.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. If real users have not proven success, the system must not claim that real users have proven success.'}

## Real User Reality Verdict

${verdict}
`;
}
