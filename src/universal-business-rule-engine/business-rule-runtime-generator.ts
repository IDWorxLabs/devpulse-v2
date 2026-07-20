/**
 * Universal Business Rule Engine V1 — shared app-side rule runtime generation.
 *
 * Emits src/universal-business-rule-runtime/ once per generated workspace.
 * The runtime mirrors the engine's deterministic evaluation core: closed
 * operator registry, safe function registry, serializable expression AST,
 * typed results, policy handling, and dependency-aware memoization.
 * There is no eval, no Function constructor, and no arbitrary code path.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';

const RULE_RUNTIME_ROOT = 'src/universal-business-rule-runtime';

export function buildUniversalBusinessRuleSharedRuntimeFiles(): GeneratedWorkspaceFile[] {
  return [
    { relativePath: `${RULE_RUNTIME_ROOT}/expression-model.ts`, content: EXPRESSION_MODEL_SOURCE },
    { relativePath: `${RULE_RUNTIME_ROOT}/operator-registry.ts`, content: OPERATOR_REGISTRY_SOURCE },
    { relativePath: `${RULE_RUNTIME_ROOT}/safe-function-registry.ts`, content: SAFE_FUNCTION_SOURCE },
    { relativePath: `${RULE_RUNTIME_ROOT}/result-model.ts`, content: RESULT_MODEL_SOURCE },
    { relativePath: `${RULE_RUNTIME_ROOT}/evaluator.ts`, content: EVALUATOR_SOURCE },
    { relativePath: `${RULE_RUNTIME_ROOT}/memoization.ts`, content: MEMOIZATION_SOURCE },
    { relativePath: `${RULE_RUNTIME_ROOT}/enforcement.ts`, content: ENFORCEMENT_SOURCE },
    {
      relativePath: `${RULE_RUNTIME_ROOT}/index.ts`,
      content: `export * from './expression-model';
export * from './operator-registry';
export * from './safe-function-registry';
export * from './result-model';
export * from './evaluator';
export * from './memoization';
export * from './enforcement';
`,
    },
  ];
}

const EXPRESSION_MODEL_SOURCE = `/** Universal business rule runtime — serializable expression model (no code execution) */
export type RuleLiteralValue = string | number | boolean | null;

export type RuleExpression =
  | { kind: 'literal'; value: RuleLiteralValue }
  | { kind: 'input'; name: string }
  | { kind: 'collection-input'; name: string }
  | { kind: 'op'; op: string; args: RuleExpression[] }
  | { kind: 'aggregate'; op: string; collection: RuleExpression; projection?: string }
  | { kind: 'conditional'; condition: RuleExpression; whenTrue: RuleExpression; whenFalse: RuleExpression }
  | { kind: 'safe-function'; functionId: string; args: RuleExpression[] };

export interface RuleInputDefinition {
  name: string;
  type: string;
  optional: boolean;
}

export interface BusinessRuleDescriptor {
  ruleId: string;
  label: string;
  ruleKind: string;
  moduleId: string;
  fieldId: string | null;
  inputDefinitions: RuleInputDefinition[];
  outputType: string;
  expression: RuleExpression;
  dependencies: string[];
  nullPolicy: string;
  precisionPolicy: string;
  roundingPolicy: string;
  divisionByZeroPolicy: string;
  enforcementPoints: string[];
  severity: 'ERROR' | 'WARNING';
  errorCode: string;
  userFeedback: string;
  provenance: string[];
  supportClassification: string;
  blockedReason?: string;
  version: string;
}
`;

const OPERATOR_REGISTRY_SOURCE = `/** Universal business rule runtime — closed operator registry */
export type RuleRuntimeValue = string | number | boolean | null | RuleRuntimeValue[];

export class RuleTypeError extends Error {}
export class RuleDivisionByZeroError extends Error {}

function num(v: RuleRuntimeValue, op: string): number {
  if (typeof v !== 'number' || Number.isNaN(v)) throw new RuleTypeError(op + ' requires numeric operand');
  return v;
}
function bool(v: RuleRuntimeValue, op: string): boolean {
  if (typeof v !== 'boolean') throw new RuleTypeError(op + ' requires boolean operand');
  return v;
}
function text(v: RuleRuntimeValue, op: string): string {
  if (typeof v !== 'string') throw new RuleTypeError(op + ' requires string operand');
  return v;
}
function coll(v: RuleRuntimeValue, op: string): RuleRuntimeValue[] {
  if (!Array.isArray(v)) throw new RuleTypeError(op + ' requires collection operand');
  return v;
}

const OPERATORS: Record<string, (args: RuleRuntimeValue[]) => RuleRuntimeValue> = {
  ADD: (a) => num(a[0], 'ADD') + num(a[1], 'ADD'),
  SUBTRACT: (a) => num(a[0], 'SUBTRACT') - num(a[1], 'SUBTRACT'),
  MULTIPLY: (a) => num(a[0], 'MULTIPLY') * num(a[1], 'MULTIPLY'),
  DIVIDE: (a) => {
    const d = num(a[1], 'DIVIDE');
    if (d === 0) throw new RuleDivisionByZeroError('Division by zero');
    return num(a[0], 'DIVIDE') / d;
  },
  MODULO: (a) => {
    const d = num(a[1], 'MODULO');
    if (d === 0) throw new RuleDivisionByZeroError('Modulo by zero');
    return num(a[0], 'MODULO') % d;
  },
  ABSOLUTE: (a) => Math.abs(num(a[0], 'ABSOLUTE')),
  MINIMUM: (a) => Math.min(num(a[0], 'MINIMUM'), num(a[1], 'MINIMUM')),
  MAXIMUM: (a) => Math.max(num(a[0], 'MAXIMUM'), num(a[1], 'MAXIMUM')),
  EQUAL: (a) => a[0] === a[1],
  NOT_EQUAL: (a) => a[0] !== a[1],
  GREATER_THAN: (a) => num(a[0], 'GREATER_THAN') > num(a[1], 'GREATER_THAN'),
  GREATER_THAN_OR_EQUAL: (a) => num(a[0], 'GREATER_THAN_OR_EQUAL') >= num(a[1], 'GREATER_THAN_OR_EQUAL'),
  LESS_THAN: (a) => num(a[0], 'LESS_THAN') < num(a[1], 'LESS_THAN'),
  LESS_THAN_OR_EQUAL: (a) => num(a[0], 'LESS_THAN_OR_EQUAL') <= num(a[1], 'LESS_THAN_OR_EQUAL'),
  AND: (a) => a.every((v) => bool(v, 'AND')),
  OR: (a) => a.some((v) => bool(v, 'OR')),
  NOT: (a) => !bool(a[0], 'NOT'),
  SUM: (a) => coll(a[0], 'SUM').reduce((s: number, v) => s + num(v, 'SUM'), 0),
  COUNT: (a) => coll(a[0], 'COUNT').length,
  AVERAGE: (a) => {
    const items = coll(a[0], 'AVERAGE');
    if (items.length === 0) throw new RuleDivisionByZeroError('Average of empty collection');
    return items.reduce((s: number, v) => s + num(v, 'AVERAGE'), 0) / items.length;
  },
  MIN: (a) => Math.min(...coll(a[0], 'MIN').map((v) => num(v, 'MIN'))),
  MAX: (a) => Math.max(...coll(a[0], 'MAX').map((v) => num(v, 'MAX'))),
  ANY: (a) => coll(a[0], 'ANY').some((v) => bool(v, 'ANY')),
  ALL: (a) => coll(a[0], 'ALL').every((v) => bool(v, 'ALL')),
  NONE: (a) => !coll(a[0], 'NONE').some((v) => bool(v, 'NONE')),
  CONTAINS: (a) => coll(a[0], 'CONTAINS').includes(a[1]),
  UNIQUE: (a) => Array.from(new Set(coll(a[0], 'UNIQUE'))),
  CONCAT: (a) => a.map((v) => text(v, 'CONCAT')).join(''),
  TRIM: (a) => text(a[0], 'TRIM').trim(),
  LOWERCASE: (a) => text(a[0], 'LOWERCASE').toLowerCase(),
  UPPERCASE: (a) => text(a[0], 'UPPERCASE').toUpperCase(),
  LENGTH: (a) => (Array.isArray(a[0]) ? a[0].length : text(a[0], 'LENGTH').length),
  COALESCE: (a) => a.find((v) => v !== null) ?? null,
  BEFORE: (a) => Date.parse(text(a[0], 'BEFORE')) < Date.parse(text(a[1], 'BEFORE')),
  AFTER: (a) => Date.parse(text(a[0], 'AFTER')) > Date.parse(text(a[1], 'AFTER')),
  SAME_DATE: (a) => text(a[0], 'SAME_DATE').slice(0, 10) === text(a[1], 'SAME_DATE').slice(0, 10),
  DATE_DIFFERENCE: (a) => Date.parse(text(a[0], 'DATE_DIFFERENCE')) - Date.parse(text(a[1], 'DATE_DIFFERENCE')),
};

export function applyOperator(operatorId: string, args: RuleRuntimeValue[]): RuleRuntimeValue {
  const op = OPERATORS[operatorId];
  if (!op) throw new RuleTypeError('Unsupported operator: ' + operatorId);
  return op(args);
}

export function isRegisteredOperator(operatorId: string): boolean {
  return operatorId in OPERATORS;
}
`;

const SAFE_FUNCTION_SOURCE = `/** Universal business rule runtime — safe pure function registry */
import { RuleTypeError, type RuleRuntimeValue } from './operator-registry';

const SAFE_FUNCTIONS: Record<string, (args: RuleRuntimeValue[]) => RuleRuntimeValue> = {
  ROUND_HALF_UP: (a) => {
    const [v, p] = a;
    if (typeof v !== 'number' || typeof p !== 'number') throw new RuleTypeError('ROUND_HALF_UP requires (number, number)');
    const f = 10 ** Math.trunc(p);
    return Math.round((v + Number.EPSILON) * f) / f;
  },
  ROUND_HALF_EVEN: (a) => {
    const [v, p] = a;
    if (typeof v !== 'number' || typeof p !== 'number') throw new RuleTypeError('ROUND_HALF_EVEN requires (number, number)');
    const f = 10 ** Math.trunc(p);
    const scaled = v * f;
    const floor = Math.floor(scaled);
    const diff = scaled - floor;
    const rounded = diff > 0.5 ? floor + 1 : diff < 0.5 ? floor : floor % 2 === 0 ? floor : floor + 1;
    return rounded / f;
  },
  TRUNCATE: (a) => {
    const [v, p] = a;
    if (typeof v !== 'number' || typeof p !== 'number') throw new RuleTypeError('TRUNCATE requires (number, number)');
    const f = 10 ** Math.trunc(p);
    return Math.trunc(v * f) / f;
  },
  FLOOR: (a) => {
    if (typeof a[0] !== 'number') throw new RuleTypeError('FLOOR requires number');
    return Math.floor(a[0]);
  },
  CEILING: (a) => {
    if (typeof a[0] !== 'number') throw new RuleTypeError('CEILING requires number');
    return Math.ceil(a[0]);
  },
  PERCENTAGE_OF: (a) => {
    const [pct, base] = a;
    if (typeof pct !== 'number' || typeof base !== 'number') throw new RuleTypeError('PERCENTAGE_OF requires (number, number)');
    return (pct / 100) * base;
  },
  CLAMP: (a) => {
    const [v, lo, hi] = a;
    if (typeof v !== 'number' || typeof lo !== 'number' || typeof hi !== 'number') throw new RuleTypeError('CLAMP requires (number, number, number)');
    return Math.min(Math.max(v, lo), hi);
  },
  IS_BLANK: (a) => {
    const v = a[0];
    if (v === null) return true;
    if (typeof v !== 'string') throw new RuleTypeError('IS_BLANK requires string or null');
    return v.trim().length === 0;
  },
  TEXT_LENGTH_BETWEEN: (a) => {
    const [v, lo, hi] = a;
    if (typeof v !== 'string' || typeof lo !== 'number' || typeof hi !== 'number') throw new RuleTypeError('TEXT_LENGTH_BETWEEN requires (string, number, number)');
    const len = v.trim().length;
    return len >= lo && len <= hi;
  },
  MATCHES_SAFE_PATTERN: (a) => {
    if (typeof a[0] !== 'string') throw new RuleTypeError('MATCHES_SAFE_PATTERN requires string');
    // eslint-disable-next-line no-control-regex
    return !/[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]/.test(a[0]);
  },
};

export function applySafeFunction(functionId: string, args: RuleRuntimeValue[]): RuleRuntimeValue {
  const fn = SAFE_FUNCTIONS[functionId];
  if (!fn) throw new RuleTypeError('Unsafe or unregistered function: ' + functionId);
  return fn(args);
}

export function isRegisteredSafeFunction(functionId: string): boolean {
  return functionId in SAFE_FUNCTIONS;
}
`;

const RESULT_MODEL_SOURCE = `/** Universal business rule runtime — typed result model */
import type { RuleRuntimeValue } from './operator-registry';

export type RuleResultStatus = 'PASSED' | 'FAILED' | 'VALUE' | 'BLOCKED' | 'INVALID' | 'NOT_EVALUATED' | 'ERROR';

export interface RuleViolation {
  target: string;
  code: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
  ruleId: string;
}

export interface BusinessRuleResult {
  ruleId: string;
  status: RuleResultStatus;
  value: RuleRuntimeValue;
  violations: RuleViolation[];
  explanation: string;
  version: string;
}

export function ruleResultIsSuccess(result: BusinessRuleResult): boolean {
  return result.status === 'PASSED' || result.status === 'VALUE';
}
`;

const EVALUATOR_SOURCE = `/** Universal business rule runtime — deterministic pure evaluator (no side effects) */
import type { BusinessRuleDescriptor, RuleExpression } from './expression-model';
import { applyOperator, RuleDivisionByZeroError, type RuleRuntimeValue } from './operator-registry';
import { applySafeFunction } from './safe-function-registry';
import type { BusinessRuleResult, RuleViolation } from './result-model';

export type RuleInputBag = Record<string, RuleRuntimeValue>;

const MAX_DEPTH = 64;

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

export function isExecutableRule(descriptor: BusinessRuleDescriptor): boolean {
  return EXECUTABLE_CLASSIFICATIONS.has(descriptor.supportClassification);
}

export function evaluateExpression(expr: RuleExpression, inputs: RuleInputBag, depth = 0): RuleRuntimeValue {
  if (depth > MAX_DEPTH) throw new Error('Expression exceeds maximum safe depth');
  switch (expr.kind) {
    case 'literal':
      return expr.value;
    case 'input':
    case 'collection-input':
      if (!(expr.name in inputs)) throw new Error("Missing input '" + expr.name + "'");
      return inputs[expr.name];
    case 'op':
      return applyOperator(expr.op, expr.args.map((a) => evaluateExpression(a, inputs, depth + 1)));
    case 'aggregate':
      return applyOperator(expr.op, [evaluateExpression(expr.collection, inputs, depth + 1)]);
    case 'conditional': {
      const c = evaluateExpression(expr.condition, inputs, depth + 1);
      if (typeof c !== 'boolean') throw new Error('Conditional requires boolean condition');
      return c ? evaluateExpression(expr.whenTrue, inputs, depth + 1) : evaluateExpression(expr.whenFalse, inputs, depth + 1);
    }
    case 'safe-function':
      return applySafeFunction(expr.functionId, expr.args.map((a) => evaluateExpression(a, inputs, depth + 1)));
    default:
      throw new Error('Unknown expression node');
  }
}

function applyPrecision(descriptor: BusinessRuleDescriptor, value: RuleRuntimeValue): RuleRuntimeValue {
  if (typeof value !== 'number') return value;
  const places = descriptor.precisionPolicy === 'INTEGER' ? 0 : descriptor.precisionPolicy === 'FIXED_2' ? 2 : descriptor.precisionPolicy === 'FIXED_4' ? 4 : null;
  if (places === null) return value;
  const f = 10 ** places;
  switch (descriptor.roundingPolicy) {
    case 'ROUND_HALF_UP':
      return Math.round((value + Number.EPSILON) * f) / f;
    case 'ROUND_HALF_EVEN': {
      const scaled = value * f;
      const floor = Math.floor(scaled);
      const diff = scaled - floor;
      const r = diff > 0.5 ? floor + 1 : diff < 0.5 ? floor : floor % 2 === 0 ? floor : floor + 1;
      return r / f;
    }
    case 'TRUNCATE':
      return Math.trunc(value * f) / f;
    case 'FLOOR':
      return Math.floor(value * f) / f;
    case 'CEILING':
      return Math.ceil(value * f) / f;
    default:
      return value;
  }
}

function violation(descriptor: BusinessRuleDescriptor, message: string): RuleViolation {
  return {
    target: descriptor.fieldId ?? descriptor.moduleId,
    code: descriptor.errorCode,
    message,
    severity: descriptor.severity,
    ruleId: descriptor.ruleId,
  };
}

function result(
  descriptor: BusinessRuleDescriptor,
  status: BusinessRuleResult['status'],
  value: RuleRuntimeValue,
  violations: RuleViolation[],
  explanation: string,
): BusinessRuleResult {
  return { ruleId: descriptor.ruleId, status, value, violations, explanation, version: descriptor.version };
}

export function evaluateRuleDescriptor(descriptor: BusinessRuleDescriptor, inputs: RuleInputBag): BusinessRuleResult {
  if (descriptor.supportClassification === 'BLOCKED_BY_FUTURE_CAPABILITY' || descriptor.supportClassification === 'EXTENSION_POINT_REQUIRED') {
    return result(descriptor, 'BLOCKED', null, [], descriptor.blockedReason ?? 'Blocked by missing capability');
  }
  if (descriptor.supportClassification === 'INVALID_RULE_CONTRACT') {
    return result(descriptor, 'INVALID', null, [], descriptor.blockedReason ?? 'Invalid rule contract');
  }
  if (descriptor.supportClassification === 'NOT_EXECUTABLE_INFORMATIONAL') {
    return result(descriptor, 'NOT_EVALUATED', null, [], 'Informational rule');
  }

  const missing = descriptor.inputDefinitions.filter((d) => !d.optional && (!(d.name in inputs) || inputs[d.name] === null));
  if (missing.length > 0) {
    if (descriptor.nullPolicy === 'TREAT_AS_ZERO') {
      const patched: RuleInputBag = { ...inputs };
      for (const d of missing) patched[d.name] = d.type === 'collection' ? [] : d.type === 'string' ? '' : 0;
      return evaluateWithInputs(descriptor, patched);
    }
    if (descriptor.nullPolicy === 'SKIP' || descriptor.nullPolicy === 'RETURN_NULL') {
      return result(descriptor, 'NOT_EVALUATED', null, [], 'Skipped: missing inputs under ' + descriptor.nullPolicy + ' policy');
    }
    if (descriptor.nullPolicy === 'BLOCK_EVALUATION') {
      return result(descriptor, 'BLOCKED', null, [], 'Blocked: required inputs missing');
    }
    // FAIL policy: missing inputs are an explicit error, never a silent pass.
    return result(descriptor, 'ERROR', null, [violation(descriptor, 'Missing required inputs: ' + missing.map((d) => d.name).join(', '))], 'Missing required inputs');
  }
  return evaluateWithInputs(descriptor, inputs);
}

function evaluateWithInputs(descriptor: BusinessRuleDescriptor, inputs: RuleInputBag): BusinessRuleResult {
  let raw: RuleRuntimeValue;
  try {
    raw = evaluateExpression(descriptor.expression, inputs);
  } catch (error) {
    if (error instanceof RuleDivisionByZeroError) {
      if (descriptor.divisionByZeroPolicy === 'RETURN_NULL') return result(descriptor, 'VALUE', null, [], 'Division by zero → null per policy');
      if (descriptor.divisionByZeroPolicy === 'RETURN_ZERO') return result(descriptor, 'VALUE', 0, [], 'Division by zero → 0 per policy');
      return result(descriptor, 'ERROR', null, [violation(descriptor, 'Division by zero')], 'Division by zero under FAIL policy');
    }
    const message = error instanceof Error ? error.message : 'Rule evaluation error';
    // Errors never default to success.
    return result(descriptor, 'ERROR', null, [violation(descriptor, message)], 'Evaluation error: ' + message);
  }

  const value = applyPrecision(descriptor, raw);
  if (descriptor.outputType === 'boolean') {
    if (typeof value !== 'boolean') {
      return result(descriptor, 'ERROR', null, [violation(descriptor, 'Predicate produced non-boolean result')], 'Type error');
    }
    return value
      ? result(descriptor, 'PASSED', true, [], descriptor.label + ': condition satisfied')
      : result(descriptor, 'FAILED', false, [violation(descriptor, descriptor.userFeedback)], descriptor.label + ': condition not satisfied');
  }
  return result(descriptor, 'VALUE', value, [], descriptor.label + ': computed deterministic value');
}
`;

const MEMOIZATION_SOURCE = `/** Universal business rule runtime — memoization with dependency invalidation */
import type { BusinessRuleDescriptor } from './expression-model';
import type { BusinessRuleResult } from './result-model';
import type { RuleInputBag } from './evaluator';

const memo = new Map<string, BusinessRuleResult>();
const keysByRule = new Map<string, Set<string>>();

export function ruleMemoKey(descriptor: BusinessRuleDescriptor, inputs: RuleInputBag): string {
  const inputKey = Object.keys(inputs).sort().map((k) => k + '=' + JSON.stringify(inputs[k])).join('&');
  return descriptor.ruleId + '@' + descriptor.version + '::' + inputKey;
}

export function getMemoizedRuleResult(descriptor: BusinessRuleDescriptor, inputs: RuleInputBag): BusinessRuleResult | undefined {
  return memo.get(ruleMemoKey(descriptor, inputs));
}

export function memoizeRuleResult(descriptor: BusinessRuleDescriptor, inputs: RuleInputBag, result: BusinessRuleResult): void {
  const key = ruleMemoKey(descriptor, inputs);
  memo.set(key, result);
  if (!keysByRule.has(descriptor.ruleId)) keysByRule.set(descriptor.ruleId, new Set());
  keysByRule.get(descriptor.ruleId)!.add(key);
}

export function invalidateRuleResults(ruleId: string): number {
  const bucket = keysByRule.get(ruleId);
  if (!bucket) return 0;
  let removed = 0;
  for (const key of bucket) {
    if (memo.delete(key)) removed += 1;
  }
  keysByRule.delete(ruleId);
  return removed;
}

export function invalidateDependentRules(changedRuleId: string, descriptors: BusinessRuleDescriptor[]): string[] {
  const invalidated = new Set<string>([changedRuleId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const d of descriptors) {
      if (invalidated.has(d.ruleId)) continue;
      if (d.dependencies.some((dep) => invalidated.has(dep))) {
        invalidated.add(d.ruleId);
        grew = true;
      }
    }
  }
  for (const id of invalidated) invalidateRuleResults(id);
  return Array.from(invalidated);
}

export function ruleMemoSize(): number {
  return memo.size;
}
`;

const ENFORCEMENT_SOURCE = `/** Universal business rule runtime — service-boundary enforcement */
import type { BusinessRuleDescriptor } from './expression-model';
import { evaluateRuleDescriptor, isExecutableRule, type RuleInputBag } from './evaluator';
import type { BusinessRuleResult, RuleViolation } from './result-model';

export class BusinessRuleViolationError extends Error {
  readonly violations: RuleViolation[];
  readonly ruleResults: BusinessRuleResult[];
  constructor(violations: RuleViolation[], ruleResults: BusinessRuleResult[]) {
    super(violations.map((v) => v.message).join('; ') || 'Business rule violation');
    this.violations = violations;
    this.ruleResults = ruleResults;
  }
}

export interface EnforcementOutcome {
  valid: boolean;
  violations: RuleViolation[];
  results: BusinessRuleResult[];
}

/**
 * Evaluates every executable rule bound to the enforcement point whose inputs
 * are resolvable. FAILED, ERROR, and INVALID results all block the operation —
 * evaluation errors can never default to success.
 */
export function evaluateEnforcementPoint(
  descriptors: BusinessRuleDescriptor[],
  enforcementPoint: string,
  inputs: RuleInputBag,
): EnforcementOutcome {
  const applicable = descriptors.filter(
    (d) =>
      isExecutableRule(d) &&
      d.enforcementPoints.includes(enforcementPoint) &&
      d.inputDefinitions.every((def) => def.optional || def.name in inputs),
  );
  const results = applicable.map((d) => evaluateRuleDescriptor(d, inputs));
  const violations = results.flatMap((r) =>
    r.status === 'FAILED' || r.status === 'ERROR' || r.status === 'INVALID' ? r.violations : [],
  );
  return { valid: violations.filter((v) => v.severity === 'ERROR').length === 0, violations, results };
}

/** Throws when any ERROR-severity rule violation occurs at this enforcement point. */
export function enforceBusinessRules(
  descriptors: BusinessRuleDescriptor[],
  enforcementPoint: string,
  inputs: RuleInputBag,
): EnforcementOutcome {
  const outcome = evaluateEnforcementPoint(descriptors, enforcementPoint, inputs);
  if (!outcome.valid) {
    throw new BusinessRuleViolationError(outcome.violations, outcome.results);
  }
  return outcome;
}
`;
