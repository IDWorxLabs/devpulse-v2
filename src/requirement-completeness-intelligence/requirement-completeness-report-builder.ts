/**
 * Requirement Completeness Report Builder — markdown intelligence report (V1).
 */

import {
  REQUIREMENT_COMPLETENESS_INTELLIGENCE_PASS_TOKEN,
  REQUIREMENT_COMPLETENESS_INTELLIGENCE_REPORT_TITLE,
} from './requirement-completeness-registry.js';
import type {
  RequirementCompletenessAnalysis,
  RequirementCompletenessHistoryEntry,
  RequirementCompletenessIntelligenceReport,
} from './requirement-completeness-types.js';

function formatList(items: readonly string[]): string {
  if (items.length === 0) return '- none';
  return items.map((item) => `- ${item}`).join('\n');
}

export function buildRequirementCompletenessIntelligenceReport(input: {
  analyses: readonly RequirementCompletenessAnalysis[];
  history: readonly RequirementCompletenessHistoryEntry[];
}): RequirementCompletenessIntelligenceReport {
  const latestAnalysis = input.analyses[0] ?? null;
  const completenessScores = input.history.map((e) => e.completenessScore);
  const readinessScores = input.history.map((e) => e.readinessScore);
  const average = (values: number[]) =>
    values.length === 0 ? 0 : Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    totalAnalyses: input.history.length,
    latestAnalysis,
    historySummary: {
      totalAnalyses: input.history.length,
      averageCompletenessScore: average(completenessScores),
      averageReadinessScore: average(readinessScores),
      readyForPlanningCount: input.history.filter((e) => e.projectRequirementReadiness === 'READY_FOR_PLANNING')
        .length,
    },
  };
}

export function buildRequirementCompletenessIntelligenceReportMarkdown(
  report: RequirementCompletenessIntelligenceReport,
  analyses: readonly RequirementCompletenessAnalysis[] = report.latestAnalysis ? [report.latestAnalysis] : [],
): string {
  const lines: string[] = [
    `# ${REQUIREMENT_COMPLETENESS_INTELLIGENCE_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total analyses: ${report.historySummary.totalAnalyses}`,
    `- Average completeness score: ${report.historySummary.averageCompletenessScore}/100`,
    `- Average readiness score: ${report.historySummary.averageReadinessScore}/100`,
    `- Ready for planning count: ${report.historySummary.readyForPlanningCount}`,
    '',
  ];

  for (const analysis of analyses) {
    lines.push('## Completeness Findings', '');
    lines.push(`- Analysis ID: ${analysis.analysisId}`);
    lines.push(`- Completeness score: ${analysis.completenessScore}/100 (${analysis.completenessCategory})`);
    lines.push(`- Readiness score: ${analysis.readinessScore}/100`);
    lines.push(`- Confidence score: ${analysis.confidenceScore}/100`);
    lines.push(`- Risk level: ${analysis.riskLevel}`);
    lines.push(`- Safe to proceed: ${analysis.safeToProceed ? 'yes' : 'no'}`);
    lines.push(`- Evidence sources: ${analysis.evidence.sources.join(', ') || 'none'}`);
    lines.push('');

    lines.push('## Readiness Findings', '');
    lines.push(`- Project requirement readiness: ${analysis.projectRequirementReadiness}`);
    lines.push('');

    lines.push('## Domain Analysis', '');
    for (const domain of analysis.domainResults) {
      lines.push(`### ${domain.domain} (${domain.score}/100)`);
      lines.push('- Covered:');
      lines.push(formatList(domain.covered));
      lines.push('- Gaps:');
      lines.push(formatList(domain.gaps));
      lines.push('');
    }

    lines.push('## Missing Requirement Categories', '');
    if (analysis.missingRequirements.length === 0) {
      lines.push('- none');
    } else {
      for (const gap of analysis.missingRequirements) {
        lines.push(`- [${gap.severity}] ${gap.domain}: ${gap.gapId}`);
      }
    }
    lines.push('');

    lines.push('## Clarifying Questions', '');
    if (analysis.clarifyingQuestions.length === 0) {
      lines.push('- none');
    } else {
      for (const q of analysis.clarifyingQuestions) {
        lines.push(`- [${q.priority}] (${q.category}) ${q.question}`);
      }
    }
    lines.push('');

    lines.push('## Risk Assessment', '');
    lines.push(`- Overall risk: ${analysis.riskLevel}`);
    lines.push(`- Missing requirement count: ${analysis.missingRequirements.length}`);
    lines.push(`- Critical questions: ${analysis.clarifyingQuestions.filter((q) => q.priority === 'CRITICAL').length}`);
    lines.push('');
  }

  lines.push('---', '', `Pass token: ${REQUIREMENT_COMPLETENESS_INTELLIGENCE_PASS_TOKEN}`, '');

  return lines.join('\n');
}
