/**
 * Requirement Discovery Operator API — read-only CQI maturity visibility.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessCqiMaturity,
  CLARIFYING_QUESTION_INTELLIGENCE_MATURITY_V1_PASS_TOKEN,
  getLastCqiMaturityAssessment,
  type CqiMaturityAssessment,
} from '../src/clarifying-question-intelligence/index.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = join(__dirname, '..');

export { CLARIFYING_QUESTION_INTELLIGENCE_MATURITY_V1_PASS_TOKEN };

export interface RequirementDiscoveryPayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_clarifying_question_intelligence';
  canonicalOwner: 'Clarifying Question Intelligence';
  confidenceScore: number;
  requirementCoverage: readonly { category: string; status: string; score: number }[];
  openQuestions: readonly { question: string; category: string; priority: string }[];
  resolvedQuestions: readonly string[];
  criticalGaps: readonly string[];
  canProceedToPlanning: boolean;
  productDomain: string;
  gapSummary: readonly string[];
  assessment: CqiMaturityAssessment | null;
}

const DEFAULT_PROMPTS: Record<string, string> = {
  CRM: 'Build me a CRM.',
  MARKETPLACE: 'Build me a marketplace.',
  INVENTORY: 'Build me an inventory system.',
  SCHOOL_MANAGEMENT: 'Build me a school management system.',
  PROJECT_MANAGEMENT: 'Build me a project management system.',
  BOOKING_PLATFORM: 'Build me a booking platform.',
  RESTAURANT_POS: 'Build me a restaurant POS.',
  LEARNING_PLATFORM: 'Build me a learning platform.',
};

export function buildRequirementDiscoveryPayload(input?: {
  prompt?: string | null;
  domain?: string | null;
}): RequirementDiscoveryPayload {
  const prompt =
    input?.prompt ??
    (input?.domain ? DEFAULT_PROMPTS[input.domain] : null) ??
    DEFAULT_PROMPTS.CRM;

  const assessment = assessCqiMaturity({ userPrompt: prompt });

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_clarifying_question_intelligence',
    canonicalOwner: 'Clarifying Question Intelligence',
    confidenceScore: assessment.requirementConfidenceScore,
    requirementCoverage: assessment.coverageMatrix.map((row) => ({
      category: row.category,
      status: row.status,
      score: row.score,
    })),
    openQuestions: assessment.openQuestions.map((question) => ({
      question: question.question,
      category: question.category,
      priority: question.priority,
    })),
    resolvedQuestions: assessment.resolvedQuestions,
    criticalGaps: assessment.gaps.filter((gap) => gap.critical).map((gap) => gap.summary),
    canProceedToPlanning: assessment.canProceedToPlanning,
    productDomain: assessment.productDomain,
    gapSummary: assessment.gapSummary,
    assessment,
  };
}

export function sendRequirementDiscoveryJson(
  res: import('node:http').ServerResponse,
  prompt?: string | null,
  domain?: string | null,
): void {
  const payload = buildRequirementDiscoveryPayload({ prompt, domain });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'requirement-discovery',
    'X-DevPulse-Phase': '27.8',
  });
  res.end(JSON.stringify(payload));
}

export function getCachedRequirementDiscoveryAssessment(): CqiMaturityAssessment | null {
  return getLastCqiMaturityAssessment();
}
