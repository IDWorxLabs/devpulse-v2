/**
 * Intake Alignment Report Builder — markdown alignment report (V1).
 */

import {
  INTAKE_ALIGNMENT_REPORT_TITLE,
  MULTI_SOURCE_INTAKE_ALIGNMENT_REPAIR_V1_PASS,
} from './intake-alignment-registry.js';
import type {
  IntakeAlignmentAnalysis,
  IntakeAlignmentHistoryEntry,
  IntakeAlignmentReport,
} from './intake-alignment-types.js';

export function buildIntakeAlignmentReport(input: {
  analyses: readonly IntakeAlignmentAnalysis[];
  history: readonly IntakeAlignmentHistoryEntry[];
}): IntakeAlignmentReport {
  const latestAnalysis = input.analyses[0] ?? null;
  const scores = input.history.map((e) => e.alignmentScore);
  const confidences = input.history.map((e) => e.alignedConfidence);
  const averageAlignmentScore =
    scores.length === 0 ? 0 : Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const averageAlignedConfidence =
    confidences.length === 0 ? 0 : Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    totalAnalyses: input.history.length,
    latestAnalysis,
    historySummary: {
      totalAnalyses: input.history.length,
      averageAlignmentScore,
      averageAlignedConfidence,
      strongAlignmentCount: input.history.filter((e) => e.alignmentCategory === 'STRONG_ALIGNMENT').length,
    },
  };
}

export function buildIntakeAlignmentReportMarkdown(
  report: IntakeAlignmentReport,
  analyses: readonly IntakeAlignmentAnalysis[] = report.latestAnalysis ? [report.latestAnalysis] : [],
): string {
  const lines: string[] = [
    `# ${INTAKE_ALIGNMENT_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total analyses: ${report.historySummary.totalAnalyses}`,
    `- Average alignment score: ${report.historySummary.averageAlignmentScore}/100`,
    `- Average aligned confidence: ${report.historySummary.averageAlignedConfidence}/100`,
    `- Strong alignment count: ${report.historySummary.strongAlignmentCount}`,
    '',
  ];

  for (const analysis of analyses) {
    lines.push('## Alignment Findings', '');
    lines.push(`- Analysis ID: ${analysis.analysisId}`);
    lines.push(`- Alignment score: ${analysis.alignmentScore}/100`);
    lines.push(`- Alignment category: ${analysis.alignmentCategory}`);
    lines.push(`- Aligned confidence: ${analysis.alignedConfidence}/100`);
    lines.push(`- Real conflicts: ${analysis.realConflictCount}`);
    lines.push(`- False conflicts repaired: ${analysis.falseConflictCount}`);
    lines.push('');

    lines.push('### Platform Alignment', '');
    lines.push(`- Platforms: ${analysis.platformAlignment.platforms.join(', ')}`);
    lines.push(`- True platform conflict: ${analysis.platformAlignment.truePlatformConflict ? 'yes' : 'no'}`);
    lines.push('');

    lines.push('### Role Alignment', '');
    lines.push(`- Normalized roles: ${analysis.roleAlignment.normalizedRoles.join(', ') || 'none'}`);
    lines.push(`- High role alignment: ${analysis.roleAlignment.highRoleAlignment ? 'yes' : 'no'}`);
    lines.push('');

    lines.push('### Semantic Agreements', '');
    for (const agreement of analysis.semanticAgreements) {
      lines.push(`- [${agreement.dimension}] ${agreement.description}`);
    }
    lines.push('');

    lines.push('### Conflict Classification', '');
    if (analysis.classifiedConflicts.length === 0) {
      lines.push('- none');
    } else {
      for (const conflict of analysis.classifiedConflicts) {
        lines.push(`- [${conflict.classification}] ${conflict.originalConflict.conflictType}: ${conflict.reason}`);
      }
    }
    lines.push('');

    lines.push('### Recommendations', '');
    for (const rec of analysis.alignmentRecommendations) {
      lines.push(`- [${rec.priority}] ${rec.action}: ${rec.rationale}`);
    }
    lines.push('');
  }

  lines.push('---', '', `Pass token: ${MULTI_SOURCE_INTAKE_ALIGNMENT_REPAIR_V1_PASS}`, '');

  return lines.join('\n');
}
