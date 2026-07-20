/**
 * Universal Business Rule Engine V1 — rule graph validation before generation.
 */

import { resolveRuleDependencies } from './business-rule-dependency-resolver.js';
import { typeCheckRuleExpression } from './business-rule-type-system.js';
import type { UniversalBusinessRuleDescriptor } from './universal-business-rule-types.js';

export interface RuleGraphIssue {
  readonly code:
    | 'duplicate_rule_id'
    | 'missing_input'
    | 'invalid_expression'
    | 'unsupported_operator'
    | 'unsafe_function'
    | 'type_mismatch'
    | 'circular_dependency'
    | 'missing_dependency'
    | 'conflicting_rules'
    | 'ambiguous_enforcement_point'
    | 'invalid_precision_policy';
  readonly ruleId: string;
  readonly detail: string;
}

export interface RuleGraphValidationResult {
  readonly valid: boolean;
  readonly issues: readonly RuleGraphIssue[];
  readonly evaluationOrder: readonly string[];
}

const EXECUTABLE_CLASSIFICATIONS = new Set([
  'FULLY_SUPPORTED',
  'VALIDATION_SUPPORTED',
  'PREDICATE_SUPPORTED',
  'CALCULATION_SUPPORTED',
  'AGGREGATION_SUPPORTED',
  'DERIVED_VALUE_SUPPORTED',
  'WORKFLOW_GUARD_SUPPORTED',
  'ACTION_ELIGIBILITY_SUPPORTED',
  'RELATIONSHIP_RULE_SUPPORTED',
  'STATE_TRANSITION_SUPPORTED',
  'PERSISTENCE_CONSTRAINT_SUPPORTED',
  'PARTIALLY_SUPPORTED',
]);

export function isExecutableRuleClassification(classification: string): boolean {
  return EXECUTABLE_CLASSIFICATIONS.has(classification);
}

export function validateBusinessRuleGraph(
  descriptors: readonly UniversalBusinessRuleDescriptor[],
): RuleGraphValidationResult {
  const issues: RuleGraphIssue[] = [];

  const idCounts = new Map<string, number>();
  for (const descriptor of descriptors) {
    idCounts.set(descriptor.ruleId, (idCounts.get(descriptor.ruleId) ?? 0) + 1);
  }
  for (const [ruleId, count] of idCounts) {
    if (count > 1) {
      issues.push({ code: 'duplicate_rule_id', ruleId, detail: `Rule ID appears ${count} times` });
    }
  }

  const executable = descriptors.filter((d) => isExecutableRuleClassification(d.supportClassification));

  for (const descriptor of executable) {
    const typeIssues = typeCheckRuleExpression(descriptor.expression, descriptor.inputDefinitions);
    for (const issue of typeIssues) {
      issues.push({
        code:
          issue.code === 'missing_input'
            ? 'missing_input'
            : issue.code === 'unsupported_operator'
              ? 'unsupported_operator'
              : issue.code === 'unsafe_function'
                ? 'unsafe_function'
                : issue.code === 'type_mismatch'
                  ? 'type_mismatch'
                  : 'invalid_expression',
        ruleId: descriptor.ruleId,
        detail: issue.detail,
      });
    }
    if (descriptor.enforcementPoints.length === 0) {
      issues.push({
        code: 'ambiguous_enforcement_point',
        ruleId: descriptor.ruleId,
        detail: 'Executable rule declares no enforcement point',
      });
    }
    if ((descriptor.outputType === 'number' || descriptor.outputType === 'integer') && descriptor.roundingPolicy === 'NONE' && descriptor.precisionPolicy !== 'PRESERVE') {
      issues.push({
        code: 'invalid_precision_policy',
        ruleId: descriptor.ruleId,
        detail: 'Numeric output declares fixed precision without a rounding policy',
      });
    }
  }

  // Conflict detection: two executable rules targeting the same field with
  // the same error code but different expressions, or duplicate derived targets.
  const byTarget = new Map<string, UniversalBusinessRuleDescriptor[]>();
  for (const descriptor of executable) {
    if (descriptor.ruleKind === 'DERIVED_VALUE' || descriptor.ruleKind === 'CALCULATION') {
      const target = `${descriptor.moduleId}:${descriptor.fieldId ?? descriptor.errorCode}`;
      byTarget.set(target, [...(byTarget.get(target) ?? []), descriptor]);
    }
  }
  for (const [target, group] of byTarget) {
    if (group.length > 1) {
      const expressions = new Set(group.map((d) => JSON.stringify(d.expression)));
      if (expressions.size > 1) {
        issues.push({
          code: 'conflicting_rules',
          ruleId: group[0]!.ruleId,
          detail: `Multiple differing formulas target '${target}': ${group.map((d) => d.ruleId).join(', ')}`,
        });
      }
    }
  }

  const dependencyResolution = resolveRuleDependencies(executable);
  for (const issue of dependencyResolution.issues) {
    issues.push({
      code: issue.code === 'circular_dependency' ? 'circular_dependency' : 'missing_dependency',
      ruleId: issue.ruleId,
      detail: issue.detail,
    });
  }

  return {
    valid: issues.length === 0,
    issues,
    evaluationOrder: dependencyResolution.evaluationOrder,
  };
}
