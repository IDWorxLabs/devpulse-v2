/**
 * Launch Council Report Builder — founder-facing council report.
 */

import { LAUNCH_COUNCIL_REPORT_TITLE, LAUNCH_COUNCIL_VERSION } from './launch-council-bounds.js';
import type { LaunchCouncilAssessment, LaunchCouncilReport } from './launch-council-types.js';

function listSection(title: string, items: string[]): string {
  if (!items.length) return `## ${title}\n\nNone identified.\n`;
  return `## ${title}\n\n${items.map((item) => `- ${item}`).join('\n')}\n`;
}

export function buildLaunchCouncilReport(
  assessment: LaunchCouncilAssessment,
  generatedAt: number,
): LaunchCouncilReport {
  const launchBlockers = assessment.authorityResults
    .filter((result) => result.launchBlocker)
    .map((result) => `${result.authorityName}: ${result.findings[0] ?? 'Launch blocker active'}`);

  const summary =
    assessment.readinessState === 'BLOCKED'
      ? `Launch Council advisory summary: BLOCKED — ${assessment.launchBlockerCount} authority blocker(s) detected. No final GO / NO GO verdict is issued in Phase 25.1.`
      : assessment.readinessState === 'UNKNOWN'
        ? 'Launch Council advisory summary: UNKNOWN — not all authorities have executed. No final GO / NO GO verdict is issued in Phase 25.1.'
        : assessment.readinessState === 'CAUTION'
          ? 'Launch Council advisory summary: CAUTION — participating authorities report warnings. No final GO / NO GO verdict is issued in Phase 25.1.'
          : 'Launch Council advisory summary: READY — participating authorities report no launch blockers. No final GO / NO GO verdict is issued in Phase 25.1.';

  return {
    generatedAt,
    councilVersion: LAUNCH_COUNCIL_VERSION,
    authorityResults: assessment.authorityResults,
    launchBlockers,
    readinessState: assessment.readinessState,
    confidenceScore: assessment.confidenceScore,
    summary,
  };
}

export function buildLaunchCouncilReportMarkdown(
  assessment: LaunchCouncilAssessment,
  report: LaunchCouncilReport,
): string {
  const date = new Date(report.generatedAt).toISOString();

  return `# ${LAUNCH_COUNCIL_REPORT_TITLE}

Generated: ${date}
Council Version: ${report.councilVersion}
Advisory Only: Yes — Phase 25.1 foundation (no final GO / NO GO verdict)

## Launch Council Summary

${report.summary}

Overall score: **${assessment.overallScore}/100**

## Participating Authorities

${assessment.authorityResults.map((result) => `- **${result.authorityName}** (${result.authorityId}) — ${result.authorityCategory}`).join('\n')}

## Authority Scores

${assessment.authorityResults
  .map(
    (result) =>
      `- **${result.authorityName}**: score ${result.score}/100 | confidence ${result.confidence}/100 | status ${result.status} | launch blocker ${result.launchBlocker ? 'Yes' : 'No'}`,
  )
  .join('\n')}

${listSection('Launch Blockers', report.launchBlockers)}
${listSection('Findings', assessment.findings)}
${listSection('Recommendations', assessment.recommendations)}

## Readiness State

**${assessment.readinessState}**

## Confidence Score

**${assessment.confidenceScore}/100**
`;
}
