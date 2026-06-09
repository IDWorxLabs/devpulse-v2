/**
 * Unified Decision Layer — orchestrates advisory decision intelligence.
 * Does NOT execute. Explains, recommends, ranks, and warns only.
 */

import { buildDecisionContext } from './decision-context-builder.js';
import { composeDecisionAnswer } from './decision-answer-composer.js';
import { createDecisionOptions } from './decision-option-model.js';
import { generateDecisionRecommendation } from './decision-recommendation-engine.js';
import type { DecisionAnswer, DecisionContext, DecisionRecommendation } from './decision-types.js';

export interface DecisionTrace {
  context: DecisionContext;
  options: ReturnType<typeof createDecisionOptions>;
  recommendation: DecisionRecommendation;
  answer: DecisionAnswer;
  responseText: string;
}

export function reasonOverDecision(query: string): DecisionTrace {
  const context = buildDecisionContext(query);
  const options = createDecisionOptions(context);
  const recommendation = generateDecisionRecommendation(options, context);
  const answer = composeDecisionAnswer(context, recommendation);

  return {
    context,
    options,
    recommendation,
    answer,
    responseText: answer.responseText,
  };
}

export function answerDecisionQuestion(query: string): string {
  return reasonOverDecision(query).responseText;
}
