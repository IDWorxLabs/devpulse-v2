/**
 * Planning Gate Report Builder — markdown gate report (V1).
 */

import {
  PLANNING_GATE_AUTHORITY_V1_PASS,
  PLANNING_GATE_AUTHORITY_REPORT_TITLE,
} from './planning-gate-registry.js';
import type {
  PlanningGateAnalysis,
  PlanningGateAuthorityReport,
  PlanningGateHistoryEntry,
} from './planning-gate-types.js';

function formatList(items: readonly string[]): string {
  if (items.length === 0) return '- none';
  return items.map((item) => `- ${item}`).join('\n');
}

export function buildPlanningGateAuthorityReport(input: {
  analyses: readonly PlanningGateAnalysis[];
  history: readonly PlanningGateHistoryEntry[];
}): PlanningGateAuthorityReport {
  const latestAnalysis = input.analyses[0] ?? null;
  const scores = input.history.map((e) => e.planningReadinessScore);
  const averageReadinessScore =
    scores.length === 0 ? 0 : Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    totalAnalyses: input.history.length,
    latestAnalysis,
    historySummary: {
      totalAnalyses: input.history.length,
      averageReadinessScore,
      allowFullPlanningCount: input.history.filter((e) => e.planningGateDecision === 'ALLOW_FULL_PLANNING').length,
      safeToPlanCount: input.history.filter((e) => e.safeToPlan).length,
    },
  };
}

export function buildPlanningGateAuthorityReportMarkdown(
  report: PlanningGateAuthorityReport,
  analyses: readonly PlanningGateAnalysis[] = report.latestAnalysis ? [report.latestAnalysis] : [],
): string {
  const lines: string[] = [
    `# ${PLANNING_GATE_AUTHORITY_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total analyses: ${report.historySummary.totalAnalyses}`,
    `- Average readiness score: ${report.historySummary.averageReadinessScore}/100`,
    `- Allow full planning count: ${report.historySummary.allowFullPlanningCount}`,
    `- Safe to plan count: ${report.historySummary.safeToPlanCount}`,
    '',
  ];

  for (const analysis of analyses) {
    lines.push('## Readiness Findings', '');
    lines.push(`- Analysis ID: ${analysis.analysisId}`);
    lines.push(`- Evidence sufficiency score: ${analysis.evidenceSufficiency.evidenceSufficiencyScore}/100`);
    lines.push(`- Planning readiness score: ${analysis.planningReadiness.planningReadinessScore}/100`);
    lines.push(`- Planning readiness category: ${analysis.planningReadiness.planningReadinessCategory}`);
    lines.push(`- Safe to plan: ${analysis.safeToPlan ? 'yes' : 'no'}`);
    lines.push('');

    lines.push('### Evidence Coverage', '');
    for (const dim of analysis.evidenceSufficiency.dimensions) {
      lines.push(`- ${dim.dimension}: ${dim.score}/100 (${dim.covered ? 'covered' : 'not covered'})`);
    }
    lines.push('');

    lines.push('## Risk Findings', '');
    lines.push(`- Overall risk level: ${analysis.planningRiskAnalysis.overallRiskLevel}`);
    lines.push(`- Risk count: ${analysis.planningRiskAnalysis.riskCount}`);
    if (analysis.planningRiskAnalysis.risks.length === 0) {
      lines.push('- none');
    } else {
      for (const risk of analysis.planningRiskAnalysis.risks) {
        lines.push(`- [${risk.severity}] ${risk.riskType}: ${risk.description}`);
      }
    }
    lines.push('');

    lines.push('## Gate Decision', '');
    lines.push(`- Decision: ${analysis.planningGateDecision}`);
    lines.push('');

    lines.push('## Gate Explanation', '');
    lines.push(`- Summary: ${analysis.planningGateExplanation.summary}`);
    lines.push(`- Confidence: ${analysis.planningGateExplanation.confidence}/100`);
    lines.push('- Evidence used:');
    lines.push(formatList(analysis.planningGateExplanation.evidenceUsed));
    lines.push('- Missing information:');
    lines.push(formatList(analysis.planningGateExplanation.missingInformation));
    lines.push('');

    lines.push('## Clarification Requests', '');
    if (analysis.planningGateQuestions.length === 0) {
      lines.push('- none');
    } else {
      for (const q of analysis.planningGateQuestions) {
        lines.push(`- [${q.priority}] (${q.category}) ${q.question}`);
      }
    }
    lines.push('');
  }

  lines.push('---', '', `Pass token: ${PLANNING_GATE_AUTHORITY_V1_PASS}`, '');

  return lines.join('\n');
}
