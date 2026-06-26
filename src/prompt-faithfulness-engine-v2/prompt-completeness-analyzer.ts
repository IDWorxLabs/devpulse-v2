/**
 * Prompt Faithfulness Engine V2 — completeness analysis.
 */

import type { CompletenessAnalysis, CompletenessGap, PromptEvidenceContract } from './prompt-faithfulness-v2-types.js';

const COMPLETENESS_CATEGORIES: Array<{
  category: string;
  patterns: RegExp[];
  question: string;
  severity: CompletenessGap['severity'];
}> = [
  { category: 'Users', patterns: [/user|persona|caregiver|patient|customer/i], question: 'Who are the primary and secondary users?', severity: 'HIGH' },
  { category: 'Authentication', patterns: [/auth|login|sign[\s-]?in|account/i], question: 'Is user authentication required?', severity: 'MEDIUM' },
  { category: 'Navigation', patterns: [/navigat|sidebar|tab|drawer|menu/i], question: 'What navigation pattern should the app use?', severity: 'MEDIUM' },
  { category: 'Data', patterns: [/data|entity|record|model/i], question: 'What data entities does the application manage?', severity: 'HIGH' },
  { category: 'Storage', patterns: [/storage|persist|database|local/i], question: 'How should data be stored?', severity: 'MEDIUM' },
  { category: 'APIs', patterns: [/api|endpoint|rest|graphql/i], question: 'Are external APIs required?', severity: 'LOW' },
  { category: 'Integrations', patterns: [/integrat|webhook|third[\s-]?party/i], question: 'What integrations are needed?', severity: 'LOW' },
  { category: 'Accessibility', patterns: [/accessib|wcag|contrast|screen reader/i], question: 'What accessibility requirements apply?', severity: 'MEDIUM' },
  { category: 'Security', patterns: [/security|encrypt|privacy|gdpr/i], question: 'What security requirements apply?', severity: 'MEDIUM' },
  { category: 'Performance', patterns: [/performance|latency|fast|offline/i], question: 'What performance expectations exist?', severity: 'LOW' },
  { category: 'Error Handling', patterns: [/error|fallback|retry/i], question: 'How should errors be handled?', severity: 'LOW' },
  { category: 'Platform', patterns: [/platform|android|ios|web|mobile|desktop/i], question: 'What platforms must be supported?', severity: 'HIGH' },
  { category: 'Permissions', patterns: [/permission|role|admin|authorization/i], question: 'What permission model is required?', severity: 'MEDIUM' },
  { category: 'Validation', patterns: [/validat|verify|test/i], question: 'What validation rules apply?', severity: 'LOW' },
];

let analysisCounter = 0;
let gapCounter = 0;

export function resetPromptCompletenessAnalyzerForTests(): void {
  analysisCounter = 0;
  gapCounter = 0;
}

export function analyzePromptCompleteness(contract: PromptEvidenceContract): CompletenessAnalysis {
  analysisCounter += 1;
  const gaps: CompletenessGap[] = [];
  const fullText = contract.rawPrompt;
  const categoriesEvaluated: string[] = [];

  for (const entry of COMPLETENESS_CATEGORIES) {
    categoriesEvaluated.push(entry.category);
    const covered = entry.patterns.some((p) => p.test(fullText)) ||
      contract.requirements.some((r) => entry.patterns.some((p) => p.test(r.originalSentence)));

    if (!covered && contract.requirements.length < 5) {
      gapCounter += 1;
      gaps.push({
        readOnly: true,
        gapId: `gap-${gapCounter}`,
        category: entry.category,
        description: `No explicit ${entry.category.toLowerCase()} information in prompt`,
        clarificationQuestion: entry.question,
        severity: entry.severity,
      });
    }
  }

  const coveredCount = COMPLETENESS_CATEGORIES.length - gaps.filter((g) => g.severity === 'HIGH').length;
  const completenessScore = Math.round((coveredCount / COMPLETENESS_CATEGORIES.length) * 100) / 100;
  const highSeverityGaps = gaps.filter((g) => g.severity === 'HIGH').length;

  return {
    readOnly: true,
    analysisId: `completeness-${analysisCounter}`,
    categoriesEvaluated,
    gaps,
    completenessScore,
    safeToGenerate: highSeverityGaps === 0 && contract.mandatoryRequirements.length > 0,
  };
}
