/**
 * Clarifying Question Live Gate — bounded validation helpers.
 */

import { MAX_LIVE_GATE_CATEGORIES } from './clarifying-question-live-gate-categories.js';
import { CLARIFYING_QUESTION_LIVE_GATE_PASS_TOKEN } from './clarifying-question-live-gate-types.js';
import type { ClarifyingLiveGateResult } from './clarifying-question-live-gate-types.js';

export { CLARIFYING_QUESTION_LIVE_GATE_PASS_TOKEN };

export function validateLiveGateCategoryCount(): { passed: boolean; detail: string } {
  return { passed: MAX_LIVE_GATE_CATEGORIES === 20, detail: `count=${MAX_LIVE_GATE_CATEGORIES}` };
}

export function validateLiveGateBlocksPlanning(result: ClarifyingLiveGateResult): {
  passed: boolean;
  detail: string;
} {
  if (!result.planningBlocked) {
    return { passed: true, detail: 'not blocked' };
  }
  return {
    passed: result.gateDecision === 'ASK_QUESTIONS' && result.recommendedQuestions.length > 0,
    detail: `${result.gateDecision}; questions=${result.recommendedQuestions.length}`,
  };
}

export function validateLiveGateQuestionsGenerated(result: ClarifyingLiveGateResult): {
  passed: boolean;
  detail: string;
} {
  if (!result.planningBlocked) {
    return { passed: true, detail: 'planning open' };
  }
  const valid = result.recommendedQuestions.every(
    (item) => item.question.length > 0 && item.whyItMatters.length > 0 && item.consequenceIfAssumed.length > 0,
  );
  return { passed: valid && result.recommendedQuestions.length > 0, detail: String(result.recommendedQuestions.length) };
}

export function validateLiveGateAssumptionPrevention(result: ClarifyingLiveGateResult): {
  passed: boolean;
  detail: string;
} {
  return {
    passed:
      result.assumptionsPreventedEvents.length > 0 &&
      result.assumptionsPreventedEvents.every(
        (event) => event.eventType === 'ASSUMPTION_PREVENTED' && event.resolution === 'ASKED_USER',
      ),
    detail: String(result.assumptionsPreventedEvents.length),
  };
}

export function validateLiveGateDeterministicOutput(
  first: ClarifyingLiveGateResult,
  second: ClarifyingLiveGateResult,
): { passed: boolean; detail: string } {
  return {
    passed:
      first.planningBlocked === second.planningBlocked &&
      first.requirementCompletenessScore === second.requirementCompletenessScore &&
      first.cacheKey === second.cacheKey,
    detail: first.cacheKey,
  };
}

export function validateLiveGateUnblocksAfterAnswers(
  blocked: ClarifyingLiveGateResult,
  resolved: ClarifyingLiveGateResult,
): { passed: boolean; detail: string } {
  return {
    passed: blocked.planningBlocked && !resolved.planningBlocked,
    detail: `${blocked.planningBlocked}/${resolved.planningBlocked}`,
  };
}

export function validateLiveGateNoDuplicateQuestions(result: ClarifyingLiveGateResult): {
  passed: boolean;
  detail: string;
} {
  const categories = result.recommendedQuestions.map((item) => item.category);
  return {
    passed: new Set(categories).size === categories.length,
    detail: String(categories.length),
  };
}

export function validateLiveGateReadOnly(result: ClarifyingLiveGateResult): {
  passed: boolean;
  detail: string;
} {
  return { passed: result.readOnly === true, detail: String(result.readOnly) };
}
