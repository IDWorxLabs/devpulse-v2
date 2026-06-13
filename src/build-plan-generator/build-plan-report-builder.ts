/**
 * Build Plan Report Builder — markdown generator report (V1).
 */

import {
  BUILD_PLAN_GENERATOR_REPORT_TITLE,
  BUILD_PLAN_GENERATOR_V1_PASS,
} from './build-plan-registry.js';
import type { BuildPlan, BuildPlanGeneratorReport, BuildPlanHistoryEntry } from './build-plan-types.js';

function formatList(items: readonly string[]): string {
  if (items.length === 0) return '- none';
  return items.map((item) => `- ${item}`).join('\n');
}

export function buildBuildPlanGeneratorReport(input: {
  plans: readonly BuildPlan[];
  history: readonly BuildPlanHistoryEntry[];
}): BuildPlanGeneratorReport {
  const latestPlan = input.plans[0] ?? null;
  const confidences = input.history.map((e) => e.buildPlanConfidence);
  const averageConfidence =
    confidences.length === 0 ? 0 : Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    totalPlans: input.history.length,
    latestPlan,
    historySummary: {
      totalPlans: input.history.length,
      averageConfidence,
      executionReadyCount: input.history.filter((e) => e.buildPlanReadiness === 'READY_FOR_EXECUTION_PLANNING').length,
      highComplexityCount: input.history.filter((e) => e.buildComplexityCategory === 'HIGH' || e.buildComplexityCategory === 'EXTREME').length,
    },
  };
}

export function buildBuildPlanGeneratorReportMarkdown(
  report: BuildPlanGeneratorReport,
  plans: readonly BuildPlan[] = report.latestPlan ? [report.latestPlan] : [],
): string {
  const lines: string[] = [
    `# ${BUILD_PLAN_GENERATOR_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total plans: ${report.historySummary.totalPlans}`,
    `- Average confidence: ${report.historySummary.averageConfidence}/100`,
    `- Execution ready count: ${report.historySummary.executionReadyCount}`,
    `- High complexity count: ${report.historySummary.highComplexityCount}`,
    '',
  ];

  for (const plan of plans) {
    lines.push('## Project Summary', '');
    lines.push(`- Plan ID: ${plan.planId}`);
    lines.push(`- Architecture brief ID: ${plan.architectureBriefId}`);
    lines.push(`- Product: ${plan.projectSummary.product}`);
    lines.push('- Platforms:');
    lines.push(formatList(plan.projectSummary.platforms));
    lines.push(`- Scope: ${plan.projectSummary.scope}`);
    lines.push(`- Complexity: ${plan.projectSummary.complexity}`);
    lines.push('');

    lines.push('## Milestones', '');
    for (const milestone of plan.milestones) {
      lines.push(`- ${milestone.name}: ${milestone.description}`);
    }
    lines.push('');

    lines.push('## Phases', '');
    for (const phase of plan.phases) {
      lines.push(`- Phase ${phase.phaseNumber}: ${phase.name}`);
    }
    lines.push('');

    lines.push('## Dependencies', '');
    lines.push(`- Blocked phases: ${plan.dependencyMap.blockedPhases.length}`);
    lines.push(`- Critical dependencies: ${plan.dependencyMap.criticalDependencies.length}`);
    if (plan.dependencyMap.dependencies.length === 0) {
      lines.push('- none');
    } else {
      for (const dep of plan.dependencyMap.dependencies) {
        lines.push(`- [${dep.dependencyType}] ${dep.fromPhaseId} → ${dep.toPhaseId}: ${dep.description}`);
      }
    }
    lines.push('');

    lines.push('## Build Priority Order', '');
    for (const item of plan.buildPriorityOrder) {
      lines.push(`- #${item.priorityRank} [${item.riskLevel}] ${item.label}: ${item.reason}`);
    }
    lines.push('');

    lines.push('## Risks', '');
    if (plan.buildPlanRisks.length === 0) {
      lines.push('- none');
    } else {
      for (const risk of plan.buildPlanRisks) {
        lines.push(`- [${risk.category}] ${risk.description}`);
      }
    }
    lines.push('');

    lines.push('## Complexity & Readiness', '');
    lines.push(`- Build complexity score: ${plan.buildComplexityScore}/100`);
    lines.push(`- Build complexity category: ${plan.buildComplexityCategory}`);
    lines.push(`- Build plan readiness: ${plan.buildPlanReadiness}`);
    lines.push(`- Build plan confidence: ${plan.buildPlanConfidence}/100`);
    lines.push('');
  }

  lines.push('---', '', `Pass token: ${BUILD_PLAN_GENERATOR_V1_PASS}`, '');

  return lines.join('\n');
}
