/**
 * Founder Test Automation Report Builder — markdown report (V1).
 */

import {
  FOUNDER_TEST_AUTOMATION_V1_PASS,
  FOUNDER_TEST_AUTOMATION_REPORT_TITLE,
} from './founder-test-automation-registry.js';
import type {
  FounderTestAutomationAnalysis,
  FounderTestAutomationHistoryEntry,
  FounderTestAutomationReport,
} from './founder-test-automation-types.js';

function formatList(items: readonly string[]): string {
  if (items.length === 0) return '- none';
  return items.map((item) => `- ${item}`).join('\n');
}

export function buildFounderTestAutomationReport(input: {
  analyses: readonly FounderTestAutomationAnalysis[];
  history: readonly FounderTestAutomationHistoryEntry[];
}): FounderTestAutomationReport {
  const latestAnalysis = input.analyses[0] ?? null;
  const scores = input.history.map((e) => e.readinessScore);
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
      readyForExecutionCount: input.history.filter((e) => e.executionReadinessState === 'READY_FOR_EXECUTION')
        .length,
    },
  };
}

export function buildFounderTestAutomationReportMarkdown(
  report: FounderTestAutomationReport,
  analyses: readonly FounderTestAutomationAnalysis[] = report.latestAnalysis ? [report.latestAnalysis] : [],
): string {
  const lines: string[] = [
    `# ${FOUNDER_TEST_AUTOMATION_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total analyses: ${report.historySummary.totalAnalyses}`,
    `- Average readiness score: ${report.historySummary.averageReadinessScore}/100`,
    `- Ready for execution count: ${report.historySummary.readyForExecutionCount}`,
    '',
  ];

  for (const analysis of analyses) {
    lines.push('## Automation Analysis', '');
    lines.push(`- Analysis ID: ${analysis.analysisId}`);
    lines.push(`- Sweep ID: ${analysis.sweepId}`);
    lines.push(`- Founder launch verdict: ${analysis.founderLaunchVerdict}`);
    lines.push(`- Execution readiness: ${analysis.executionReadiness.executionReadinessState}`);
    lines.push(`- Readiness score: ${analysis.executionReadiness.readinessScore}/100`);
    lines.push(`- Confidence score: ${analysis.executionReadiness.confidenceScore}/100`);
    lines.push(`- Safe to proceed: ${analysis.executionReadiness.safeToProceed ? 'yes' : 'no'}`);
    lines.push(`- Summary: ${analysis.executionReadiness.summary}`);
    lines.push('');

    lines.push('## Prioritized Blockers', '');
    if (analysis.prioritizedBlockers.length === 0) {
      lines.push('- none');
    } else {
      for (const blocker of analysis.prioritizedBlockers) {
        lines.push(
          `- [${blocker.priority}] ${blocker.title} — launch ${blocker.launchImpact}, user ${blocker.userImpact}, founder ${blocker.founderImpact}, confidence ${blocker.confidence}%`,
        );
        lines.push(`  - ${blocker.explanation}`);
      }
    }
    lines.push('');

    lines.push('## Recommendations', '');
    if (analysis.recommendations.length === 0) {
      lines.push('- none');
    } else {
      for (const rec of analysis.recommendations) {
        lines.push(`- [${rec.group}] ${rec.title} (${rec.confidence}%)`);
        lines.push(`  - Rationale: ${rec.rationale}`);
        lines.push(`  - Expected impact: ${rec.expectedImpact}`);
      }
    }
    lines.push('');

    lines.push('## Readiness Findings', '');
    lines.push(`- Category: ${analysis.executionReadiness.readinessCategory}`);
    lines.push(`- Launch readiness: ${analysis.executionReadiness.launchReadinessPercent}%`);
    lines.push(
      `- Requirement completeness: ${analysis.executionReadiness.requirementCompletenessScore ?? 'not provided'}`,
    );
    lines.push('');

    lines.push('## Improvement Path', '');
    if (analysis.improvementPath.length === 0) {
      lines.push('- none');
    } else {
      for (const step of analysis.improvementPath) {
        lines.push(`${step.stepNumber}. [${step.priority}] ${step.action}`);
        lines.push(`   - ${step.rationale}`);
      }
    }
    lines.push('');

    lines.push('## Required Information Requests', '');
    if (analysis.requiredInformationRequests.length === 0) {
      lines.push('- none');
    } else {
      for (const req of analysis.requiredInformationRequests) {
        lines.push(`- [${req.priority}] (${req.category}) ${req.question}`);
        lines.push(`  - Blocking reason: ${req.blockingReason}`);
      }
    }
    lines.push('');
  }

  lines.push('---', '', `Pass token: ${FOUNDER_TEST_AUTOMATION_V1_PASS}`, '');

  return lines.join('\n');
}
