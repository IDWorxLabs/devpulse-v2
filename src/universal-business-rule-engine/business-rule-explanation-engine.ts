/**
 * Universal Business Rule Engine V1 — explanation engine.
 *
 * Produces user- and developer-facing explanations without exposing the raw AST.
 */

import type { RuleEvaluationResult } from './business-rule-result-model.js';
import type { UniversalBusinessRuleDescriptor } from './universal-business-rule-types.js';

export interface RuleExplanation {
  readonly ruleId: string;
  readonly summary: string;
  readonly userMessage: string;
  readonly developerDetail: string;
  readonly provenance: readonly string[];
}

export function explainResult(
  descriptor: UniversalBusinessRuleDescriptor,
  result: RuleEvaluationResult,
): RuleExplanation {
  const userMessage =
    result.status === 'FAILED'
      ? descriptor.userFeedback
      : result.status === 'BLOCKED'
        ? `This capability is not available yet (${descriptor.blockedReason ?? 'missing capability'})`
        : result.status === 'VALUE'
          ? `${descriptor.label}: ${String(result.value)}`
          : result.status === 'PASSED'
            ? `${descriptor.label}: satisfied`
            : 'This rule could not be evaluated';

  return {
    ruleId: descriptor.ruleId,
    summary: `${descriptor.label} → ${result.status}`,
    userMessage,
    developerDetail: `[${descriptor.ruleKind}] ${result.explanation} (inputs: ${descriptor.inputDefinitions
      .map((def) => `${def.name}:${def.type}`)
      .join(', ')}; enforcement: ${descriptor.enforcementPoints.join(', ') || 'none'})`,
    provenance: descriptor.provenance,
  };
}
