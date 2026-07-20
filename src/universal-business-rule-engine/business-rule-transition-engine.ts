/**
 * Universal Business Rule Engine V1 — state transition rule evaluation.
 *
 * Rejects invalid transitions before any effect executes. Effects remain the
 * responsibility of B3 (workflow) and B5 (runtime state).
 */

import { evaluateRule, type RuleInputBag } from './business-rule-evaluation-engine.js';
import type { UniversalBusinessRuleDescriptor } from './universal-business-rule-types.js';

export interface TransitionEvaluation {
  readonly allowed: boolean;
  readonly ruleId: string | null;
  readonly explanation: string;
}

export function evaluateTransitionRules(
  descriptors: readonly UniversalBusinessRuleDescriptor[],
  inputs: RuleInputBag,
): TransitionEvaluation {
  const transitionRules = descriptors.filter(
    (descriptor) =>
      (descriptor.ruleKind === 'STATE_TRANSITION' || descriptor.ruleKind === 'WORKFLOW_GUARD') &&
      descriptor.supportClassification !== 'NOT_EXECUTABLE_INFORMATIONAL' &&
      descriptor.supportClassification !== 'INVALID_RULE_CONTRACT' &&
      descriptor.inputDefinitions.every((def) => def.optional || def.name in inputs),
  );
  if (transitionRules.length === 0) {
    return { allowed: true, ruleId: null, explanation: 'No transition rule applies to this event' };
  }
  for (const descriptor of transitionRules) {
    const result = evaluateRule(descriptor, inputs);
    // Any non-pass outcome blocks the transition — errors never allow effects.
    if (result.status !== 'PASSED') {
      return { allowed: false, ruleId: descriptor.ruleId, explanation: result.explanation };
    }
  }
  return { allowed: true, ruleId: transitionRules[0]!.ruleId, explanation: 'All transition rules passed' };
}
