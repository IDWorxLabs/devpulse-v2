/**
 * Execution Report Builder — markdown execution gate report (V1).
 */

import {
  EXECUTION_READINESS_GATE_REPORT_TITLE,
  EXECUTION_READINESS_GATE_V1_PASS,
} from './execution-readiness-registry.js';
import type {
  ExecutionReadinessAnalysis,
  ExecutionReadinessGateReport,
  ExecutionReadinessHistoryEntry,
} from './execution-readiness-types.js';

function formatList(items: readonly string[]): string {
  if (items.length === 0) return '- none';
  return items.map((item) => `- ${item}`).join('\n');
}

export function buildExecutionReadinessGateReport(input: {
  analyses: readonly ExecutionReadinessAnalysis[];
  history: readonly ExecutionReadinessHistoryEntry[];
}): ExecutionReadinessGateReport {
  const latestAnalysis = input.analyses[0] ?? null;
  const scores = input.history.map((entry) => entry.executionReadinessScore);
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
      allowExecutionCount: input.history.filter((entry) => entry.executionGateDecision === 'ALLOW_EXECUTION').length,
      safeToProceedCount: input.history.filter((entry) => entry.safeToProceed).length,
    },
  };
}

export function buildExecutionReadinessGateReportMarkdown(
  report: ExecutionReadinessGateReport,
  analyses: readonly ExecutionReadinessAnalysis[] = report.latestAnalysis ? [report.latestAnalysis] : [],
): string {
  const lines: string[] = [
    `# ${EXECUTION_READINESS_GATE_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total assessments: ${report.historySummary.totalAnalyses}`,
    `- Average readiness score: ${report.historySummary.averageReadinessScore}/100`,
    `- Allow execution count: ${report.historySummary.allowExecutionCount}`,
    `- Safe to proceed count: ${report.historySummary.safeToProceedCount}`,
    '',
  ];

  for (const analysis of analyses) {
    lines.push('## Readiness Score', '');
    lines.push(`- Analysis ID: ${analysis.analysisId}`);
    lines.push(`- Execution readiness score: ${analysis.readinessScore.executionReadinessScore}/100`);
    lines.push(`- Execution readiness category: ${analysis.readinessScore.executionReadinessCategory}`);
    lines.push(`- Safe to proceed: ${analysis.safeToProceed ? 'yes' : 'no'}`);
    lines.push('');

    lines.push('## Decision', '');
    lines.push(`- Execution gate decision: ${analysis.executionGateDecision}`);
    lines.push(`- Permission permitted: ${analysis.executionPermission.permitted ? 'yes' : 'no'}`);
    lines.push(`- Permission reason: ${analysis.executionPermission.permissionReason}`);
    lines.push(`- Summary: ${analysis.executionGateExplanation.summary}`);
    lines.push('');

    lines.push('## Blockers', '');
    if (analysis.blockerSummary.blockers.length === 0) {
      lines.push('- none');
    } else {
      for (const blocker of analysis.blockerSummary.blockers.slice(0, 8)) {
        lines.push(`- [${blocker.priority}] ${blocker.title} (${blocker.sourceAuthority})`);
      }
    }
    lines.push('');

    lines.push('## Risks', '');
    lines.push(`- Overall risk level: ${analysis.riskAnalysis.overallRiskLevel}`);
    lines.push(`- Risk count: ${analysis.riskAnalysis.riskCount}`);
    if (analysis.riskAnalysis.risks.length === 0) {
      lines.push('- none');
    } else {
      for (const risk of analysis.riskAnalysis.risks.slice(0, 6)) {
        lines.push(`- [${risk.severity}] ${risk.description}`);
      }
    }
    lines.push('');

    lines.push('## Proof Findings', '');
    lines.push(formatList(analysis.executionGateExplanation.proofFindings));
    lines.push('');

    lines.push('## Recommendations', '');
    if (analysis.executionRecommendations.length === 0) {
      lines.push('- none');
    } else {
      for (const rec of analysis.executionRecommendations) {
        lines.push(`- [${rec.priority}] ${rec.title}: ${rec.rationale}`);
      }
    }
    lines.push('');

    lines.push('## Next Actions', '');
    lines.push(formatList(analysis.nextActions));
    lines.push('');
  }

  lines.push('---', '', `Pass token: ${EXECUTION_READINESS_GATE_V1_PASS}`, '');
  return lines.join('\n');
}
