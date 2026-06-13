/**
 * Voice Notes Report Builder — markdown intelligence report (V1).
 */

import {
  VOICE_NOTES_INTELLIGENCE_PASS_TOKEN,
  VOICE_NOTES_INTELLIGENCE_REPORT_TITLE,
} from './voice-notes-registry.js';
import type {
  VoiceNotesAnalysis,
  VoiceNotesHistoryEntry,
  VoiceNotesIntelligenceReport,
} from './voice-notes-types.js';

function formatList(items: readonly string[]): string {
  if (items.length === 0) return '- none';
  return items.map((item) => `- ${item}`).join('\n');
}

export function buildVoiceNotesIntelligenceReport(input: {
  analyses: readonly VoiceNotesAnalysis[];
  history: readonly VoiceNotesHistoryEntry[];
}): VoiceNotesIntelligenceReport {
  const latestAnalysis = input.analyses[0] ?? null;
  const byIntent = {
    BUILD_REQUEST: 0,
    FEATURE_REQUEST: 0,
    BUG_REPORT: 0,
    ROADMAP_REQUEST: 0,
    DESIGN_REQUEST: 0,
    PLANNING_REQUEST: 0,
  };

  for (const entry of input.history) {
    byIntent[entry.primaryIntent] += 1;
  }

  const confidenceScores = input.history.map((e) => e.confidenceScore);
  const averageConfidenceScore =
    confidenceScores.length === 0
      ? 0
      : Math.round(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length);

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    totalAnalyses: input.history.length,
    latestAnalysis,
    historySummary: {
      totalAnalyses: input.history.length,
      byIntent,
      averageConfidenceScore,
    },
  };
}

export function buildVoiceNotesIntelligenceReportMarkdown(
  report: VoiceNotesIntelligenceReport,
  analyses: readonly VoiceNotesAnalysis[] = report.latestAnalysis ? [report.latestAnalysis] : [],
): string {
  const lines: string[] = [
    `# ${VOICE_NOTES_INTELLIGENCE_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Total analyses: ${report.historySummary.totalAnalyses}`,
    `- Average confidence score: ${report.historySummary.averageConfidenceScore}/100`,
    `- Intent distribution: BUILD=${report.historySummary.byIntent.BUILD_REQUEST}, FEATURE=${report.historySummary.byIntent.FEATURE_REQUEST}, BUG=${report.historySummary.byIntent.BUG_REPORT}, ROADMAP=${report.historySummary.byIntent.ROADMAP_REQUEST}, DESIGN=${report.historySummary.byIntent.DESIGN_REQUEST}, PLANNING=${report.historySummary.byIntent.PLANNING_REQUEST}`,
    '',
  ];

  for (const analysis of analyses) {
    lines.push('## Voice Transcript', '');
    lines.push(`- Analysis ID: ${analysis.analysisId}`);
    lines.push(`- Filename: ${analysis.filename}`);
    lines.push(`- Duration: ${analysis.transcript.durationSeconds.toFixed(2)}s`);
    lines.push(`- Transcript confidence: ${analysis.transcript.confidence}/100`);
    lines.push(`- Word count: ${analysis.transcript.wordCount}`);
    lines.push('');
    lines.push('```');
    lines.push(analysis.transcript.transcriptText);
    lines.push('```');
    lines.push('');

    lines.push('## Intent Detection', '');
    lines.push(`- Primary intent: ${analysis.intents.primaryIntent}`);
    for (const intent of analysis.intents.detectedIntents) {
      lines.push(`- ${intent.intent} (${intent.confidence}%): ${intent.evidence.join(', ')}`);
    }
    lines.push('');

    lines.push('## Extracted Requirements', '');
    lines.push('### Screens');
    lines.push(formatList(analysis.requirements.screens));
    lines.push('### User Roles');
    lines.push(formatList(analysis.requirements.userRoles));
    lines.push('### Workflows');
    lines.push(formatList(analysis.requirements.workflows));
    lines.push('### Business Rules');
    lines.push(formatList(analysis.requirements.businessRules));
    lines.push('### Integrations');
    lines.push(formatList(analysis.requirements.integrations));
    lines.push('### Notifications');
    lines.push(formatList(analysis.requirements.notifications));
    lines.push('### Authentication');
    lines.push(formatList(analysis.requirements.authentication));
    lines.push('### Data Entities');
    lines.push(formatList(analysis.requirements.dataEntities));
    lines.push('');

    lines.push('## Project Understanding Summary', '');
    lines.push(`- Product type: ${analysis.projectUnderstanding.productType}`);
    lines.push(`- Platform targets: ${analysis.projectUnderstanding.platformTargets.join(', ')}`);
    lines.push(`- Confidence score: ${analysis.projectUnderstanding.confidenceScore}/100`);
    lines.push('- Key workflows:');
    lines.push(formatList(analysis.projectUnderstanding.keyWorkflows));
    lines.push('- Feature inventory:');
    lines.push(formatList(analysis.projectUnderstanding.featureInventory));
    lines.push('');

    lines.push('## Missing Requirements', '');
    lines.push('- Missing screens:');
    lines.push(formatList(analysis.missingRequirements.missingScreens));
    lines.push('- Missing flows:');
    lines.push(formatList(analysis.missingRequirements.missingFlows));
    lines.push('- Missing business logic:');
    lines.push(formatList(analysis.missingRequirements.missingBusinessLogic));
    lines.push('- Unclear requirements:');
    lines.push(formatList(analysis.missingRequirements.unclearRequirements));
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
  }

  lines.push('---', '', `Pass token: ${VOICE_NOTES_INTELLIGENCE_PASS_TOKEN}`, '');

  return lines.join('\n');
}
