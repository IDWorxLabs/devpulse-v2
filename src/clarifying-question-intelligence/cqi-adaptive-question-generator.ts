/**
 * CQI Maturity V1 — adaptive domain-aware question generation.
 */

import { FORBIDDEN_GENERIC_QUESTIONS, MAX_ADAPTIVE_QUESTIONS } from './cqi-maturity-bounds.js';
import { getCqiDomainDefinition } from './cqi-domain-registry.js';
import type { CqiAdaptiveQuestion, CqiProductDomain, RequirementGap } from './cqi-maturity-types.js';
import { REQUIREMENT_GAP_CATEGORY_DEFINITIONS } from './cqi-requirement-gap-detector.js';

function isForbiddenQuestion(question: string): boolean {
  const normalized = question.trim().toLowerCase();
  return FORBIDDEN_GENERIC_QUESTIONS.some((forbidden) => normalized.includes(forbidden));
}

function questionMatchesEvidence(question: string, evidenceText: string): boolean {
  const normalizedQuestion = question.toLowerCase();
  const keywords = normalizedQuestion
    .replace(/[^a-z0-9\s?]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 4);
  return keywords.some((word) => evidenceText.includes(word));
}

export function generateAdaptiveQuestions(input: {
  domain: CqiProductDomain;
  gaps: readonly RequirementGap[];
  evidenceText: string;
}): CqiAdaptiveQuestion[] {
  const domainDef = getCqiDomainDefinition(input.domain);
  const gapCategories = new Set(input.gaps.map((gap) => gap.category));
  const questions: CqiAdaptiveQuestion[] = [];

  if (domainDef) {
    for (const template of domainDef.questions) {
      if (questions.length >= MAX_ADAPTIVE_QUESTIONS) break;
      if (isForbiddenQuestion(template.question)) continue;
      if (questionMatchesEvidence(template.question, input.evidenceText)) continue;
      if (gapCategories.has(template.category) || template.priority === 'CRITICAL') {
        questions.push({ readOnly: true, domain: input.domain, ...template });
      }
    }
  }

  if (questions.length < MAX_ADAPTIVE_QUESTIONS) {
    for (const gap of input.gaps) {
      if (questions.length >= MAX_ADAPTIVE_QUESTIONS) break;
      const categoryDef = REQUIREMENT_GAP_CATEGORY_DEFINITIONS.find((entry) => entry.category === gap.category);
      if (!categoryDef) continue;
      const fallbackQuestion = `What are the requirements for ${gap.category.toLowerCase()} in this product?`;
      if (isForbiddenQuestion(fallbackQuestion)) continue;
      if (questions.some((item) => item.category === gap.category)) continue;
      questions.push({
        readOnly: true,
        domain: input.domain,
        question: fallbackQuestion,
        whyItMatters: categoryDef.gapSummary,
        category: gap.category,
        priority: gap.critical ? 'CRITICAL' : 'IMPORTANT',
      });
    }
  }

  return questions.slice(0, MAX_ADAPTIVE_QUESTIONS);
}

export function validateQuestionQuality(questions: readonly CqiAdaptiveQuestion[]): {
  valid: boolean;
  forbidden: string[];
} {
  const forbidden = questions
    .filter((question) => isForbiddenQuestion(question.question))
    .map((question) => question.question);
  return { valid: forbidden.length === 0, forbidden };
}

export function extractResolvedQuestions(
  evidenceText: string,
  domain: CqiProductDomain,
): string[] {
  const domainDef = getCqiDomainDefinition(domain);
  if (!domainDef) return [];
  return domainDef.questions
    .filter((template) => questionMatchesEvidence(template.question, evidenceText))
    .map((template) => template.question);
}
