/**
 * Universal Business Rule Engine V1 — validation rule evaluation facade.
 */

import { evaluateRule, type RuleInputBag } from './business-rule-evaluation-engine.js';
import type { RuleViolation } from './business-rule-result-model.js';
import type { UniversalBusinessRuleDescriptor } from './universal-business-rule-types.js';
import { isExecutableRuleClassification } from './business-rule-graph-validator.js';

export interface BusinessRuleValidationOutcome {
  readonly valid: boolean;
  readonly violations: readonly RuleViolation[];
  readonly evaluatedRuleIds: readonly string[];
  readonly blockedRuleIds: readonly string[];
}

/**
 * Evaluates every validation-class rule bound to the given enforcement point.
 * Failure, error, and blocked results all prevent a valid outcome — an
 * evaluation error can never default to success.
 */
export function runValidationRules(
  descriptors: readonly UniversalBusinessRuleDescriptor[],
  enforcementPoint: string,
  inputs: RuleInputBag,
): BusinessRuleValidationOutcome {
  const violations: RuleViolation[] = [];
  const evaluatedRuleIds: string[] = [];
  const blockedRuleIds: string[] = [];

  const applicable = descriptors.filter(
    (descriptor) =>
      isExecutableRuleClassification(descriptor.supportClassification) &&
      (descriptor.enforcementPoints as readonly string[]).includes(enforcementPoint) &&
      descriptor.inputDefinitions.every((def) => def.optional || def.name in inputs),
  );

  for (const descriptor of applicable) {
    const result = evaluateRule(descriptor, inputs);
    evaluatedRuleIds.push(descriptor.ruleId);
    if (result.status === 'BLOCKED') {
      blockedRuleIds.push(descriptor.ruleId);
      continue;
    }
    if (result.status === 'FAILED' || result.status === 'ERROR' || result.status === 'INVALID') {
      violations.push(...result.violations);
      if (result.violations.length === 0) {
        violations.push({
          target: descriptor.fieldId ?? descriptor.entityId,
          code: descriptor.errorCode,
          message: descriptor.userFeedback,
          severity: descriptor.severity,
          ruleId: descriptor.ruleId,
          provenance: descriptor.provenance,
        });
      }
    }
  }

  return {
    valid: violations.filter((v) => v.severity === 'ERROR').length === 0,
    violations,
    evaluatedRuleIds,
    blockedRuleIds,
  };
}
