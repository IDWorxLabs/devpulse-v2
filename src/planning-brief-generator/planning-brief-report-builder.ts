/**
 * Planning Brief Report Builder — markdown generator report (V1).
 */

import {
  PLANNING_BRIEF_GENERATOR_REPORT_TITLE,
  PLANNING_BRIEF_GENERATOR_V1_PASS,
} from './planning-brief-registry.js';
import type {
  PlanningBrief,
  PlanningBriefGeneratorReport,
  PlanningBriefHistoryEntry,
} from './planning-brief-types.js';

function formatList(items: readonly string[]): string {
  if (items.length === 0) return '- none';
  return items.map((item) => `- ${item}`).join('\n');
}

export function buildPlanningBriefGeneratorReport(input: {
  briefs: readonly PlanningBrief[];
  history: readonly PlanningBriefHistoryEntry[];
}): PlanningBriefGeneratorReport {
  const latestBrief = input.briefs[0] ?? null;
  const confidences = input.history.map((e) => e.planningBriefConfidence);
  const averageConfidence =
    confidences.length === 0 ? 0 : Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    totalBriefs: input.history.length,
    latestBrief,
    historySummary: {
      totalBriefs: input.history.length,
      averageConfidence,
      planningReadyCount: input.history.filter((e) => e.planningBriefReadiness === 'PLANNING_READY').length,
      highConfidenceCount: input.history.filter((e) => e.planningBriefQuality === 'HIGH_CONFIDENCE').length,
    },
  };
}

export function buildPlanningBriefGeneratorReportMarkdown(
  report: PlanningBriefGeneratorReport,
  briefs: readonly PlanningBrief[] = report.latestBrief ? [report.latestBrief] : [],
): string {
  const lines: string[] = [
    `# ${PLANNING_BRIEF_GENERATOR_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total briefs: ${report.historySummary.totalBriefs}`,
    `- Average confidence: ${report.historySummary.averageConfidence}/100`,
    `- Planning ready count: ${report.historySummary.planningReadyCount}`,
    `- High confidence count: ${report.historySummary.highConfidenceCount}`,
    '',
  ];

  for (const brief of briefs) {
    lines.push('## Project Summary', '');
    lines.push(`- Brief ID: ${brief.briefId}`);
    lines.push(`- Product name: ${brief.projectSummary.productName ?? 'unspecified'}`);
    lines.push(`- Product type: ${brief.projectSummary.productType}`);
    lines.push(`- Objective: ${brief.projectSummary.objective}`);
    lines.push('- Target users:');
    lines.push(formatList(brief.projectSummary.targetUsers));
    lines.push('');

    lines.push('## Platform Targets', '');
    lines.push(formatList(brief.platformTargets));
    lines.push('');

    lines.push('## Screen Inventory', '');
    if (brief.screenInventory.length === 0) {
      lines.push('- none');
    } else {
      for (const screen of brief.screenInventory) {
        lines.push(`- ${screen.name}`);
      }
    }
    lines.push('');

    lines.push('## Workflow Inventory', '');
    if (brief.workflowInventory.length === 0) {
      lines.push('- none');
    } else {
      for (const workflow of brief.workflowInventory) {
        lines.push(`- ${workflow.name}`);
      }
    }
    lines.push('');

    lines.push('## User Roles', '');
    lines.push(formatList(brief.userRoles));
    lines.push('');

    lines.push('## Integrations', '');
    lines.push(formatList(brief.integrations));
    lines.push('');

    lines.push('## Business Rules', '');
    lines.push(formatList(brief.businessRules));
    lines.push('');

    lines.push('## Known Gaps', '');
    if (brief.knownGaps.length === 0) {
      lines.push('- none');
    } else {
      for (const gap of brief.knownGaps) {
        lines.push(`- [${gap.category}] ${gap.description}`);
      }
    }
    lines.push('');

    lines.push('## Confidence & Readiness', '');
    lines.push(`- Planning brief confidence: ${brief.planningBriefConfidence}/100`);
    lines.push(`- Planning brief quality: ${brief.planningBriefQuality}`);
    lines.push(`- Planning brief readiness: ${brief.planningBriefReadiness}`);
    lines.push('');
  }

  lines.push('---', '', `Pass token: ${PLANNING_BRIEF_GENERATOR_V1_PASS}`, '');

  return lines.join('\n');
}
