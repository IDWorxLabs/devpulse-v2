/**
 * Universal Business Rule Engine V1 — deterministic evaluation engine.
 *
 * Pure: given the same descriptor, inputs, dependency values, and engine
 * version, the result is identical. No side effects, no repository access,
 * no current-time dependence, no arbitrary code execution.
 */

import type { RuleExpression } from './business-rule-expression-model.js';
import {
  getOperator,
  RuleDivisionByZeroError,
  RuleTypeError,
  describeType,
  type RuleRuntimeValue,
} from './business-rule-operator-registry.js';
import { getSafeFunction } from './business-rule-safe-function-registry.js';
import { validateRuleInputs, validateRuleOutput } from './business-rule-type-system.js';
import type { RuleEvaluationResult, RuleViolation } from './business-rule-result-model.js';
import type { UniversalBusinessRuleDescriptor } from './universal-business-rule-types.js';
import { resolveRuleDependencies } from './business-rule-dependency-resolver.js';

export type RuleInputBag = Readonly<Record<string, RuleRuntimeValue>>;

const MAX_EXPRESSION_DEPTH = 64;

export function evaluateExpression(expression: RuleExpression, inputs: RuleInputBag, depth = 0): RuleRuntimeValue {
  if (depth > MAX_EXPRESSION_DEPTH) {
    throw new RuleTypeError('Expression exceeds maximum safe depth');
  }
  switch (expression.kind) {
    case 'literal':
      return expression.value;
    case 'input':
    case 'collection-input': {
      if (!(expression.name in inputs)) {
        throw new RuleTypeError(`Missing input '${expression.name}'`);
      }
      return inputs[expression.name]!;
    }
    case 'op': {
      const op = getOperator(expression.op);
      const args = expression.args.map((arg) => evaluateExpression(arg, inputs, depth + 1));
      return op.evaluate(args);
    }
    case 'aggregate': {
      const op = getOperator(expression.op);
      const source = evaluateExpression(expression.collection, inputs, depth + 1);
      return op.evaluate([source]);
    }
    case 'conditional': {
      const condition = evaluateExpression(expression.condition, inputs, depth + 1);
      if (typeof condition !== 'boolean') {
        throw new RuleTypeError(`Conditional requires boolean condition, got ${describeType(condition)}`);
      }
      return condition
        ? evaluateExpression(expression.whenTrue, inputs, depth + 1)
        : evaluateExpression(expression.whenFalse, inputs, depth + 1);
    }
    case 'safe-function': {
      const fn = getSafeFunction(expression.functionId);
      const args = expression.args.map((arg) => evaluateExpression(arg, inputs, depth + 1));
      return fn.evaluate(args);
    }
  }
}

function applyNullPolicy(
  descriptor: UniversalBusinessRuleDescriptor,
  inputs: RuleInputBag,
): { inputs: RuleInputBag; block?: RuleEvaluationResult } {
  const nulled = descriptor.inputDefinitions.filter(
    (def) => !(def.name in inputs) || inputs[def.name] === null,
  );
  if (nulled.length === 0) return { inputs };

  switch (descriptor.nullPolicy) {
    case 'TREAT_AS_ZERO': {
      const patched: Record<string, RuleRuntimeValue> = { ...inputs };
      for (const def of nulled) {
        patched[def.name] = def.type === 'collection' ? [] : def.type === 'string' ? '' : 0;
      }
      return { inputs: patched };
    }
    case 'SKIP':
    case 'RETURN_NULL':
      return {
        inputs,
        block: buildResult(descriptor, 'NOT_EVALUATED', null, [], `Skipped: missing inputs (${nulled.map((d) => d.name).join(', ')}) under ${descriptor.nullPolicy} policy`),
      };
    case 'BLOCK_EVALUATION':
      return {
        inputs,
        block: buildResult(descriptor, 'BLOCKED', null, [], `Blocked: required inputs missing (${nulled.map((d) => d.name).join(', ')})`),
      };
    case 'FAIL':
    default:
      return { inputs };
  }
}

function buildResult(
  descriptor: UniversalBusinessRuleDescriptor,
  status: RuleEvaluationResult['status'],
  value: RuleRuntimeValue,
  violations: readonly RuleViolation[],
  explanation: string,
  dependencyResults: readonly string[] = [],
): RuleEvaluationResult {
  return {
    ruleId: descriptor.ruleId,
    status,
    value,
    expectedType: descriptor.outputType,
    actualType: describeType(value),
    violations,
    explanation,
    dependencyResults,
    provenance: descriptor.provenance,
    version: descriptor.version,
  };
}

function violation(descriptor: UniversalBusinessRuleDescriptor, message: string): RuleViolation {
  return {
    target: descriptor.fieldId ?? descriptor.entityId,
    code: descriptor.errorCode,
    message,
    severity: descriptor.severity,
    ruleId: descriptor.ruleId,
    provenance: descriptor.provenance,
  };
}

export function evaluateRule(descriptor: UniversalBusinessRuleDescriptor, inputs: RuleInputBag): RuleEvaluationResult {
  if (
    descriptor.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY' ||
    descriptor.supportClassification === 'EXTENSION_POINT_REQUIRED'
  ) {
    return buildResult(descriptor, 'BLOCKED', null, [], descriptor.blockedReason ?? 'Rule blocked by missing capability');
  }
  if (descriptor.supportClassification === 'INVALID_RULE_CONTRACT') {
    return buildResult(descriptor, 'INVALID', null, [], descriptor.blockedReason ?? 'Invalid rule contract');
  }
  if (descriptor.supportClassification === 'NOT_EXECUTABLE_INFORMATIONAL') {
    return buildResult(descriptor, 'NOT_EVALUATED', null, [], 'Informational rule — not executable');
  }

  const policyResult = applyNullPolicy(descriptor, inputs);
  if (policyResult.block) return policyResult.block;
  const effectiveInputs = policyResult.inputs;

  const inputIssues = validateRuleInputs(descriptor.inputDefinitions, effectiveInputs);
  if (inputIssues.length > 0) {
    return buildResult(
      descriptor,
      'ERROR',
      null,
      inputIssues.map((issue) => violation(descriptor, issue.detail)),
      `Input validation failed: ${inputIssues.map((issue) => issue.detail).join('; ')}`,
    );
  }

  let raw: RuleRuntimeValue;
  try {
    raw = evaluateExpression(descriptor.expression, effectiveInputs);
  } catch (error) {
    if (error instanceof RuleDivisionByZeroError) {
      switch (descriptor.divisionByZeroPolicy) {
        case 'RETURN_NULL':
          return buildResult(descriptor, 'VALUE', null, [], 'Division by zero → null per policy');
        case 'RETURN_ZERO':
          return buildResult(descriptor, 'VALUE', 0, [], 'Division by zero → 0 per policy');
        case 'FAIL':
        default:
          return buildResult(descriptor, 'ERROR', null, [violation(descriptor, 'Division by zero')], 'Division by zero under FAIL policy');
      }
    }
    const message = error instanceof Error ? error.message : 'Rule evaluation error';
    // Evaluation errors never default to success.
    return buildResult(descriptor, 'ERROR', null, [violation(descriptor, message)], `Evaluation error: ${message}`);
  }

  const value = applyPrecision(descriptor, raw);

  if (descriptor.outputType === 'boolean') {
    if (typeof value !== 'boolean') {
      return buildResult(descriptor, 'ERROR', null, [violation(descriptor, 'Predicate produced non-boolean result')], 'Type error: predicate output is not boolean');
    }
    return value
      ? buildResult(descriptor, 'PASSED', true, [], `${descriptor.label}: condition satisfied`)
      : buildResult(descriptor, 'FAILED', false, [violation(descriptor, descriptor.userFeedback)], `${descriptor.label}: condition not satisfied`);
  }

  const outputIssues = validateRuleOutput(value, descriptor.outputType);
  if (outputIssues.length > 0) {
    return buildResult(
      descriptor,
      'ERROR',
      null,
      outputIssues.map((issue) => violation(descriptor, issue.detail)),
      `Output validation failed: ${outputIssues.map((issue) => issue.detail).join('; ')}`,
    );
  }

  return buildResult(descriptor, 'VALUE', value, [], `${descriptor.label}: computed deterministic value`);
}

function applyPrecision(descriptor: UniversalBusinessRuleDescriptor, value: RuleRuntimeValue): RuleRuntimeValue {
  if (typeof value !== 'number') return value;
  const places =
    descriptor.precisionPolicy === 'INTEGER'
      ? 0
      : descriptor.precisionPolicy === 'FIXED_2'
        ? 2
        : descriptor.precisionPolicy === 'FIXED_4'
          ? 4
          : null;
  if (places === null) return value;
  const factor = 10 ** places;
  switch (descriptor.roundingPolicy) {
    case 'ROUND_HALF_UP':
      return Math.round((value + Number.EPSILON) * factor) / factor;
    case 'ROUND_HALF_EVEN': {
      const scaled = value * factor;
      const floor = Math.floor(scaled);
      const diff = scaled - floor;
      const rounded = diff > 0.5 ? floor + 1 : diff < 0.5 ? floor : floor % 2 === 0 ? floor : floor + 1;
      return rounded / factor;
    }
    case 'TRUNCATE':
      return Math.trunc(value * factor) / factor;
    case 'FLOOR':
      return Math.floor(value * factor) / factor;
    case 'CEILING':
      return Math.ceil(value * factor) / factor;
    case 'NONE':
    default:
      return value;
  }
}

export function evaluatePredicate(descriptor: UniversalBusinessRuleDescriptor, inputs: RuleInputBag): boolean {
  const result = evaluateRule(descriptor, inputs);
  return result.status === 'PASSED';
}

export function evaluateCalculation(descriptor: UniversalBusinessRuleDescriptor, inputs: RuleInputBag): RuleRuntimeValue {
  const result = evaluateRule(descriptor, inputs);
  if (result.status !== 'VALUE') return null;
  return result.value;
}

export function evaluateAggregation(descriptor: UniversalBusinessRuleDescriptor, inputs: RuleInputBag): RuleEvaluationResult {
  return evaluateRule(descriptor, inputs);
}

export function evaluateDerivedValue(descriptor: UniversalBusinessRuleDescriptor, inputs: RuleInputBag): RuleEvaluationResult {
  return evaluateRule(descriptor, inputs);
}

/** Evaluates a rule set in deterministic dependency order, feeding rule outputs forward. */
export function evaluateRuleSet(
  descriptors: readonly UniversalBusinessRuleDescriptor[],
  inputs: RuleInputBag,
): RuleEvaluationResult[] {
  const resolution = resolveRuleDependencies(descriptors);
  if (resolution.issues.some((issue) => issue.code === 'circular_dependency')) {
    return descriptors.map((descriptor) =>
      buildResult(descriptor, 'INVALID', null, [violation(descriptor, 'Circular rule dependency')], 'Rule set contains circular dependencies'),
    );
  }
  const byId = new Map(descriptors.map((d) => [d.ruleId, d]));
  const results = new Map<string, RuleEvaluationResult>();
  const bag: Record<string, RuleRuntimeValue> = { ...inputs };

  for (const ruleId of resolution.evaluationOrder) {
    const descriptor = byId.get(ruleId)!;
    const ruleDeps = descriptor.dependencies.filter((dep) => dep.startsWith('rule-'));
    const failedDep = ruleDeps.find((dep) => {
      const depResult = results.get(dep);
      return !depResult || depResult.status === 'ERROR' || depResult.status === 'INVALID' || depResult.status === 'BLOCKED';
    });
    if (failedDep) {
      // Missing dependencies never default to pass.
      results.set(
        ruleId,
        buildResult(descriptor, 'NOT_EVALUATED', null, [], `Dependency '${failedDep}' did not produce a usable result`, ruleDeps),
      );
      continue;
    }
    const result = evaluateRule(descriptor, bag);
    results.set(ruleId, { ...result, dependencyResults: ruleDeps });
    if (result.status === 'VALUE' || result.status === 'PASSED' || result.status === 'FAILED') {
      bag[ruleId] = result.value;
    }
  }

  return descriptors.map((descriptor) => results.get(descriptor.ruleId)!).filter(Boolean);
}
