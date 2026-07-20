/**
 * Universal Business Rule Engine V1 — rule input/output type system.
 */

import type { RuleExpression } from './business-rule-expression-model.js';
import { isRegisteredOperator, type RuleRuntimeValue } from './business-rule-operator-registry.js';
import { isRegisteredSafeFunction } from './business-rule-safe-function-registry.js';
import type { RuleInputDefinition, RuleValueType } from './universal-business-rule-types.js';

export interface RuleTypeCheckIssue {
  readonly code:
    | 'missing_input'
    | 'unsupported_operator'
    | 'unsafe_function'
    | 'type_mismatch'
    | 'nullability_violation'
    | 'invalid_expression';
  readonly detail: string;
}

export function runtimeValueMatchesType(value: RuleRuntimeValue, type: RuleValueType, optional: boolean): boolean {
  if (value === null) return optional || type === 'null';
  switch (type) {
    case 'string':
    case 'identifier':
    case 'date':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !Number.isNaN(value);
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'collection':
      return Array.isArray(value);
    case 'null':
      return value === null;
  }
}

/**
 * Static structural type check of an expression against declared inputs.
 * Rejects unknown inputs, unregistered operators, and unsafe function calls.
 */
export function typeCheckRuleExpression(
  expression: RuleExpression,
  inputDefinitions: readonly RuleInputDefinition[],
): RuleTypeCheckIssue[] {
  const issues: RuleTypeCheckIssue[] = [];
  const inputNames = new Map(inputDefinitions.map((def) => [def.name, def]));

  const walk = (node: RuleExpression): void => {
    switch (node.kind) {
      case 'literal':
        return;
      case 'input': {
        if (!inputNames.has(node.name)) {
          issues.push({ code: 'missing_input', detail: `Expression references undeclared input '${node.name}'` });
        }
        return;
      }
      case 'collection-input': {
        const def = inputNames.get(node.name);
        if (!def) {
          issues.push({ code: 'missing_input', detail: `Expression references undeclared collection input '${node.name}'` });
        } else if (def.type !== 'collection') {
          issues.push({ code: 'type_mismatch', detail: `Input '${node.name}' used as collection but declared as ${def.type}` });
        }
        return;
      }
      case 'op': {
        if (!isRegisteredOperator(node.op)) {
          issues.push({ code: 'unsupported_operator', detail: `Operator '${node.op}' is not in the closed registry` });
        }
        node.args.forEach(walk);
        return;
      }
      case 'aggregate': {
        if (!isRegisteredOperator(node.op)) {
          issues.push({ code: 'unsupported_operator', detail: `Aggregate operator '${node.op}' is not registered` });
        }
        walk(node.collection);
        return;
      }
      case 'conditional':
        walk(node.condition);
        walk(node.whenTrue);
        walk(node.whenFalse);
        return;
      case 'safe-function': {
        if (!isRegisteredSafeFunction(node.functionId)) {
          issues.push({ code: 'unsafe_function', detail: `Function '${node.functionId}' is not a registered safe function` });
        }
        node.args.forEach(walk);
        return;
      }
      default:
        issues.push({ code: 'invalid_expression', detail: 'Unknown expression node kind' });
    }
  };

  walk(expression);
  return issues;
}

export function validateRuleInputs(
  inputDefinitions: readonly RuleInputDefinition[],
  inputs: Readonly<Record<string, RuleRuntimeValue>>,
): RuleTypeCheckIssue[] {
  const issues: RuleTypeCheckIssue[] = [];
  for (const def of inputDefinitions) {
    if (!(def.name in inputs)) {
      if (!def.optional) {
        issues.push({ code: 'missing_input', detail: `Required input '${def.name}' was not supplied` });
      }
      continue;
    }
    const value = inputs[def.name]!;
    if (!runtimeValueMatchesType(value, def.type, def.optional)) {
      if (value === null && !def.optional) {
        issues.push({ code: 'nullability_violation', detail: `Input '${def.name}' is null but declared non-optional` });
      } else {
        issues.push({
          code: 'type_mismatch',
          detail: `Input '${def.name}' expected ${def.type} but received incompatible value`,
        });
      }
    }
  }
  return issues;
}

export function validateRuleOutput(value: RuleRuntimeValue, outputType: RuleValueType): RuleTypeCheckIssue[] {
  if (runtimeValueMatchesType(value, outputType, outputType === 'null')) return [];
  if (value === null) {
    return [{ code: 'nullability_violation', detail: `Output is null but declared as ${outputType}` }];
  }
  return [{ code: 'type_mismatch', detail: `Output expected ${outputType} but evaluation produced incompatible value` }];
}
