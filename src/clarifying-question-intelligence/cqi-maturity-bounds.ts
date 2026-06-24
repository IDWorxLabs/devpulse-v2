/**
 * Clarifying Question Intelligence Maturity V1 — bounds and pass token.
 */

export const CLARIFYING_QUESTION_INTELLIGENCE_MATURITY_V1_PASS_TOKEN =
  'CLARIFYING_QUESTION_INTELLIGENCE_MATURITY_V1_PASS';

export const REQUIREMENT_CONFIDENCE_THRESHOLD = 75;

export const MAX_CQI_MATURITY_HISTORY = 25;

export const MAX_ADAPTIVE_QUESTIONS = 8;

export const FORBIDDEN_GENERIC_QUESTIONS = [
  'what else would you like',
  'anything more',
  'anything else',
  'what else do you need',
] as const;
