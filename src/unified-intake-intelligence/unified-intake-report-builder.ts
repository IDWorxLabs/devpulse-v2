/**
 * Unified Intake Report Builder — markdown intelligence report (V1).
 */

import {
  UNIFIED_INTAKE_INTELLIGENCE_V1_PASS,
  UNIFIED_INTAKE_INTELLIGENCE_REPORT_TITLE,
} from './unified-intake-registry.js';
import type {
  UnifiedIntakeAnalysis,
  UnifiedIntakeHistoryEntry,
  UnifiedIntakeIntelligenceReport,
} from './unified-intake-types.js';

function formatList(items: readonly string[]): string {
  if (items.length === 0) return '- none';
  return items.map((item) => `- ${item}`).join('\n');
}

export function buildUnifiedIntakeIntelligenceReport(input: {
  analyses: readonly UnifiedIntakeAnalysis[];
  history: readonly UnifiedIntakeHistoryEntry[];
}): UnifiedIntakeIntelligenceReport {
  const latestAnalysis = input.analyses[0] ?? null;
  const confidences = input.history.map((e) => e.unifiedIntakeConfidence);
  const averageConfidence =
    confidences.length === 0 ? 0 : Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    totalAnalyses: input.history.length,
    latestAnalysis,
    historySummary: {
      totalAnalyses: input.history.length,
      averageConfidence,
      averageReadinessScore: latestAnalysis?.intakeReadinessScore ?? 0,
      readyForPlanningCount: input.history.filter((e) => e.intakeReadiness === 'READY_FOR_PLANNING').length,
    },
  };
}

export function buildUnifiedIntakeIntelligenceReportMarkdown(
  report: UnifiedIntakeIntelligenceReport,
  analyses: readonly UnifiedIntakeAnalysis[] = report.latestAnalysis ? [report.latestAnalysis] : [],
): string {
  const lines: string[] = [
    `# ${UNIFIED_INTAKE_INTELLIGENCE_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total analyses: ${report.historySummary.totalAnalyses}`,
    `- Average confidence: ${report.historySummary.averageConfidence}/100`,
    `- Ready for planning count: ${report.historySummary.readyForPlanningCount}`,
    '',
  ];

  for (const analysis of analyses) {
    lines.push('## Project Intent', '');
    lines.push(`- Analysis ID: ${analysis.analysisId}`);
    lines.push(`- Application type: ${analysis.projectIntent.applicationType}`);
    lines.push(`- Primary purpose: ${analysis.projectIntent.primaryPurpose}`);
    lines.push(`- Business objective: ${analysis.projectIntent.businessObjective}`);
    lines.push(`- Platform targets: ${analysis.projectIntent.platformTargets.join(', ') || 'none'}`);
    lines.push(`- Target users: ${analysis.projectIntent.targetUsers.join(', ')}`);
    lines.push('');

    lines.push('## Unified Project Understanding', '');
    lines.push(`- Product type: ${analysis.projectUnderstanding.productType}`);
    lines.push(`- Confidence: ${analysis.projectUnderstanding.confidence}/100`);
    lines.push(`- Evidence sources: ${analysis.projectUnderstanding.evidenceSources.join(', ')}`);
    lines.push('- Screens:');
    lines.push(formatList(analysis.projectUnderstanding.screens));
    lines.push('- Workflows:');
    lines.push(formatList(analysis.projectUnderstanding.workflows));
    lines.push('- User roles:');
    lines.push(formatList(analysis.projectUnderstanding.userRoles));
    lines.push('- Entities:');
    lines.push(formatList(analysis.projectUnderstanding.entities));
    lines.push('- Integrations:');
    lines.push(formatList(analysis.projectUnderstanding.integrations));
    lines.push('- Business rules:');
    lines.push(formatList(analysis.projectUnderstanding.businessRules));
    lines.push('');

    lines.push('## Confidence Analysis', '');
    lines.push(`- Unified intake confidence: ${analysis.unifiedIntakeConfidence}/100`);
    lines.push(`- Intake readiness score: ${analysis.intakeReadinessScore}/100`);
    lines.push(`- Intake readiness: ${analysis.intakeReadiness} (${analysis.intakeReadinessCategory})`);
    lines.push(`- Active sources: ${analysis.evidence.activeSources.join(', ')}`);
    lines.push('');

    lines.push('## Conflict Findings', '');
    if (analysis.evidenceConflicts.length === 0) {
      lines.push('- none');
    } else {
      for (const conflict of analysis.evidenceConflicts) {
        lines.push(`- **${conflict.conflictType}** (${conflict.confidence}%): ${conflict.description}`);
        lines.push(`  - Clarification: ${conflict.recommendedClarification}`);
        lines.push(`  - Evidence: ${conflict.conflictingEvidence.join('; ')}`);
      }
    }
    lines.push('');

    lines.push('## Intake Gaps', '');
    if (analysis.intakeGaps.length === 0) {
      lines.push('- none');
    } else {
      for (const gap of analysis.intakeGaps) {
        lines.push(`- [${gap.category}] ${gap.description}`);
      }
    }
    lines.push('');

    lines.push('## Readiness Findings', '');
    lines.push(`- Category: ${analysis.intakeReadinessCategory}`);
    lines.push(`- Score: ${analysis.intakeReadinessScore}/100`);
    lines.push('');

    lines.push('## Recommendations', '');
    if (analysis.intakeRecommendations.length === 0) {
      lines.push('- none');
    } else {
      for (const rec of analysis.intakeRecommendations) {
        lines.push(`- [${rec.priority}] ${rec.title}`);
        lines.push(`  - ${rec.rationale}`);
      }
    }
    lines.push('');
  }

  lines.push('---', '', `Pass token: ${UNIFIED_INTAKE_INTELLIGENCE_V1_PASS}`, '');

  return lines.join('\n');
}
