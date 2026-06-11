/**
 * Repository Typecheck Reality — founder-facing report sections.
 */

import type { RepositoryTypecheckAssessment } from './repository-typecheck-reality-types.js';

export function buildRepositoryTypecheckReportMarkdown(assessment: RepositoryTypecheckAssessment): string {
  return `# Repository Typecheck Reality

Readiness state: **${assessment.readinessState}**

Typecheck clean: **${assessment.typecheckClean ? 'Yes' : 'No'}**

Blocks launch readiness: **${assessment.blocksLaunchReadiness ? 'Yes' : 'No'}**

Checked command: \`${assessment.checkedCommand}\`

Errors: ${assessment.errorCount} | Warnings: ${assessment.warningCount}

${assessment.founderProofNotes.map((note) => `- ${note}`).join('\n')}

## Findings

${assessment.findings.length
  ? assessment.findings
      .map(
        (finding) =>
          `- **${finding.file}:${finding.line}:${finding.column}** [${finding.code}] ${finding.message} — ${finding.recommendedAction}`,
      )
      .join('\n')
  : 'No compile findings recorded.'}

## Recommendations

${assessment.recommendations.length
  ? assessment.recommendations.map((item, index) => `${index + 1}. ${item}`).join('\n')
  : 'Repository typecheck baseline is clean.'}
`;
}
