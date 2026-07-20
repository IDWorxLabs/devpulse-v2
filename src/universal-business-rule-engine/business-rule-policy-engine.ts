/**
 * Universal Business Rule Engine V1 — domain-neutral policy decisions.
 */

import { evaluateRule, type RuleInputBag } from './business-rule-evaluation-engine.js';
import type { UniversalBusinessRuleDescriptor } from './universal-business-rule-types.js';

export type PolicyDecision =
  | 'ALLOW'
  | 'DENY'
  | 'REQUIRE_CONFIRMATION'
  | 'REQUIRE_INPUT'
  | 'REQUIRE_VALIDATION'
  | 'REQUIRE_FUTURE_CAPABILITY';

export interface PolicyDecisionResult {
  readonly decision: PolicyDecision;
  readonly ruleId: string;
  readonly explanation: string;
  readonly provenance: readonly string[];
}

export function decidePolicy(
  descriptor: UniversalBusinessRuleDescriptor,
  inputs: RuleInputBag,
): PolicyDecisionResult {
  if (descriptor.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY') {
    return {
      decision: 'REQUIRE_FUTURE_CAPABILITY',
      ruleId: descriptor.ruleId,
      explanation: descriptor.blockedReason ?? 'Blocked by future capability',
      provenance: descriptor.provenance,
    };
  }

  const result = evaluateRule(descriptor, inputs);
  switch (result.status) {
    case 'PASSED':
      return { decision: 'ALLOW', ruleId: descriptor.ruleId, explanation: result.explanation, provenance: descriptor.provenance };
    case 'FAILED':
      return { decision: 'DENY', ruleId: descriptor.ruleId, explanation: result.explanation, provenance: descriptor.provenance };
    case 'BLOCKED':
      return { decision: 'REQUIRE_FUTURE_CAPABILITY', ruleId: descriptor.ruleId, explanation: result.explanation, provenance: descriptor.provenance };
    case 'ERROR':
    case 'INVALID':
      return { decision: 'REQUIRE_VALIDATION', ruleId: descriptor.ruleId, explanation: result.explanation, provenance: descriptor.provenance };
    case 'NOT_EVALUATED':
    default:
      return { decision: 'REQUIRE_INPUT', ruleId: descriptor.ruleId, explanation: result.explanation, provenance: descriptor.provenance };
  }
}
