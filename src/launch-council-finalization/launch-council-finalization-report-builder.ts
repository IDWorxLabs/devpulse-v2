/**
 * Launch Council Finalization — markdown report builder.
 */

import type { FounderTestV4ReportWithLaunchCouncil } from '../founder-testing-mode/founder-testing-v4-types.js';
import { LAUNCH_COUNCIL_FINALIZATION_REPORT_TITLE } from './launch-council-finalization-bounds.js';
import type { LaunchCouncilFinalizationAssessment } from './launch-council-finalization-types.js';

function listSection(title: string, items: string[]): string {
  if (items.length === 0) return `### ${title}\n\nNone recorded.`;
  return `### ${title}\n\n${items.map((item) => `- ${item}`).join('\n')}`;
}

export function buildLaunchCouncilFinalizationReportMarkdown(
  assessment: LaunchCouncilFinalizationAssessment,
  report: FounderTestV4ReportWithLaunchCouncil,
): string {
  const gateAuthorities = assessment.authorityClassifications.filter((entry) => entry.role === 'LAUNCH_GATE');
  const advisoryAuthorities = assessment.authorityClassifications.filter((entry) => entry.role === 'ADVISORY');

  const authorityBreakdown = report.launchCouncil.authorityResults
    .map(
      (result) =>
        `- **${result.authorityName}** — score ${result.score}/100, status ${result.status}, blocker ${result.launchBlocker ? 'yes' : 'no'}`,
    )
    .join('\n');

  return `# ${LAUNCH_COUNCIL_FINALIZATION_REPORT_TITLE}

## Council Summary

Council position: **${assessment.councilPosition}**

Council score: **${assessment.councilScore}/100**

Council confidence: **${assessment.councilConfidence}/100**

Authority count: **${assessment.authorityCount}**

Blocking authorities: **${assessment.blockingAuthorityCount}**

Advisory authorities: **${assessment.advisoryAuthorityCount}**

Launch gates: **${assessment.launchGateAuthorityCount}**

## Council Position

${assessment.councilReasoning.map((line) => `- ${line}`).join('\n') || '- No council reasoning recorded.'}

## Council Confidence

Council confidence is separate from council position. A READY_WITH_CAUTION position with low confidence is possible.

Confidence inputs: Reality Proof (${report.realityProofAuthority.realityProofScore}/100), Real User evidence (${report.realUserRealityAuthority.realUserEvidenceCount} signals), Adoption evidence confidence (${report.adoptionPredictionAuthority.evidenceConfidenceScore}/100), authority agreement (${assessment.agreementScore}/100).

## Authority Breakdown

${authorityBreakdown || 'No authority results recorded.'}

## Launch Gates

${gateAuthorities.map((entry) => `- ${entry.authorityName}`).join('\n') || 'None classified.'}

## Advisory Authorities

${advisoryAuthorities.map((entry) => `- ${entry.authorityName}`).join('\n') || 'None classified.'}

## Authority Agreement Analysis

Agreement score: **${assessment.agreementScore}/100**

Contradiction count: **${assessment.contradictionCount}**

${listSection('Conflicting Authorities', assessment.conflictingAuthorities)}

## Strongest Authorities

${listSection('Strongest Areas', assessment.strongestAuthorities)}

## Highest Risk Authorities

${listSection('Highest Risks', assessment.highestRiskAuthorities)}

## Launch Blockers

${listSection('Launch Blockers', assessment.launchBlockers)}

## Council Recommendations

${assessment.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n') || '1. Authorities provide evidence. Launch Council provides understanding.'}

## Council Conclusion

This is the council's unified position — not a final launch verdict. Authorities provide evidence; Launch Council provides understanding.

Position: **${assessment.councilPosition}** | Confidence: **${assessment.councilConfidence}/100** | Agreement: **${assessment.agreementScore}/100**
`;
}
