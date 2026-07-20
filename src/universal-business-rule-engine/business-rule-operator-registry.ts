/**
 * Universal Business Rule Engine V1 — closed generic operator registry.
 *
 * Only operators registered here may appear in rule expressions.
 */

export type RuleRuntimeValue = string | number | boolean | null | readonly RuleRuntimeValue[];

export interface OperatorDefinition {
  readonly operatorId: string;
  readonly category: 'arithmetic' | 'comparison' | 'boolean' | 'collection' | 'text' | 'conditional' | 'date';
  readonly arity: number | 'variadic';
  readonly evaluate: (args: readonly RuleRuntimeValue[]) => RuleRuntimeValue;
}

function num(value: RuleRuntimeValue, op: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new RuleTypeError(`Operator ${op} requires numeric operand, got ${describeType(value)}`);
  }
  return value;
}

function bool(value: RuleRuntimeValue, op: string): boolean {
  if (typeof value !== 'boolean') {
    throw new RuleTypeError(`Operator ${op} requires boolean operand, got ${describeType(value)}`);
  }
  return value;
}

function text(value: RuleRuntimeValue, op: string): string {
  if (typeof value !== 'string') {
    throw new RuleTypeError(`Operator ${op} requires string operand, got ${describeType(value)}`);
  }
  return value;
}

function collection(value: RuleRuntimeValue, op: string): readonly RuleRuntimeValue[] {
  if (!Array.isArray(value)) {
    throw new RuleTypeError(`Operator ${op} requires collection operand, got ${describeType(value)}`);
  }
  return value;
}

export function describeType(value: RuleRuntimeValue): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'collection';
  return typeof value;
}

export class RuleTypeError extends Error {
  readonly ruleTypeError = true;
}

export class RuleDivisionByZeroError extends Error {
  readonly ruleDivisionByZero = true;
}

const OPERATORS: readonly OperatorDefinition[] = [
  // Arithmetic
  { operatorId: 'ADD', category: 'arithmetic', arity: 2, evaluate: (a) => num(a[0]!, 'ADD') + num(a[1]!, 'ADD') },
  { operatorId: 'SUBTRACT', category: 'arithmetic', arity: 2, evaluate: (a) => num(a[0]!, 'SUBTRACT') - num(a[1]!, 'SUBTRACT') },
  { operatorId: 'MULTIPLY', category: 'arithmetic', arity: 2, evaluate: (a) => num(a[0]!, 'MULTIPLY') * num(a[1]!, 'MULTIPLY') },
  {
    operatorId: 'DIVIDE',
    category: 'arithmetic',
    arity: 2,
    evaluate: (a) => {
      const divisor = num(a[1]!, 'DIVIDE');
      if (divisor === 0) throw new RuleDivisionByZeroError('Division by zero');
      return num(a[0]!, 'DIVIDE') / divisor;
    },
  },
  {
    operatorId: 'MODULO',
    category: 'arithmetic',
    arity: 2,
    evaluate: (a) => {
      const divisor = num(a[1]!, 'MODULO');
      if (divisor === 0) throw new RuleDivisionByZeroError('Modulo by zero');
      return num(a[0]!, 'MODULO') % divisor;
    },
  },
  { operatorId: 'ABSOLUTE', category: 'arithmetic', arity: 1, evaluate: (a) => Math.abs(num(a[0]!, 'ABSOLUTE')) },
  { operatorId: 'MINIMUM', category: 'arithmetic', arity: 2, evaluate: (a) => Math.min(num(a[0]!, 'MINIMUM'), num(a[1]!, 'MINIMUM')) },
  { operatorId: 'MAXIMUM', category: 'arithmetic', arity: 2, evaluate: (a) => Math.max(num(a[0]!, 'MAXIMUM'), num(a[1]!, 'MAXIMUM')) },
  // Comparison
  { operatorId: 'EQUAL', category: 'comparison', arity: 2, evaluate: (a) => a[0] === a[1] },
  { operatorId: 'NOT_EQUAL', category: 'comparison', arity: 2, evaluate: (a) => a[0] !== a[1] },
  { operatorId: 'GREATER_THAN', category: 'comparison', arity: 2, evaluate: (a) => num(a[0]!, 'GREATER_THAN') > num(a[1]!, 'GREATER_THAN') },
  { operatorId: 'GREATER_THAN_OR_EQUAL', category: 'comparison', arity: 2, evaluate: (a) => num(a[0]!, 'GREATER_THAN_OR_EQUAL') >= num(a[1]!, 'GREATER_THAN_OR_EQUAL') },
  { operatorId: 'LESS_THAN', category: 'comparison', arity: 2, evaluate: (a) => num(a[0]!, 'LESS_THAN') < num(a[1]!, 'LESS_THAN') },
  { operatorId: 'LESS_THAN_OR_EQUAL', category: 'comparison', arity: 2, evaluate: (a) => num(a[0]!, 'LESS_THAN_OR_EQUAL') <= num(a[1]!, 'LESS_THAN_OR_EQUAL') },
  // Boolean
  { operatorId: 'AND', category: 'boolean', arity: 'variadic', evaluate: (a) => a.every((v) => bool(v, 'AND')) },
  { operatorId: 'OR', category: 'boolean', arity: 'variadic', evaluate: (a) => a.some((v) => bool(v, 'OR')) },
  { operatorId: 'NOT', category: 'boolean', arity: 1, evaluate: (a) => !bool(a[0]!, 'NOT') },
  // Collections
  { operatorId: 'SUM', category: 'collection', arity: 1, evaluate: (a) => collection(a[0]!, 'SUM').reduce((s: number, v) => s + num(v, 'SUM'), 0) },
  { operatorId: 'COUNT', category: 'collection', arity: 1, evaluate: (a) => collection(a[0]!, 'COUNT').length },
  {
    operatorId: 'AVERAGE',
    category: 'collection',
    arity: 1,
    evaluate: (a) => {
      const items = collection(a[0]!, 'AVERAGE');
      if (items.length === 0) throw new RuleDivisionByZeroError('Average of empty collection');
      return items.reduce((s: number, v) => s + num(v, 'AVERAGE'), 0) / items.length;
    },
  },
  { operatorId: 'MIN', category: 'collection', arity: 1, evaluate: (a) => Math.min(...collection(a[0]!, 'MIN').map((v) => num(v, 'MIN'))) },
  { operatorId: 'MAX', category: 'collection', arity: 1, evaluate: (a) => Math.max(...collection(a[0]!, 'MAX').map((v) => num(v, 'MAX'))) },
  { operatorId: 'ANY', category: 'collection', arity: 1, evaluate: (a) => collection(a[0]!, 'ANY').some((v) => bool(v, 'ANY')) },
  { operatorId: 'ALL', category: 'collection', arity: 1, evaluate: (a) => collection(a[0]!, 'ALL').every((v) => bool(v, 'ALL')) },
  { operatorId: 'NONE', category: 'collection', arity: 1, evaluate: (a) => !collection(a[0]!, 'NONE').some((v) => bool(v, 'NONE')) },
  { operatorId: 'CONTAINS', category: 'collection', arity: 2, evaluate: (a) => collection(a[0]!, 'CONTAINS').includes(a[1]!) },
  { operatorId: 'UNIQUE', category: 'collection', arity: 1, evaluate: (a) => [...new Set(collection(a[0]!, 'UNIQUE'))] as RuleRuntimeValue },
  // Text
  { operatorId: 'CONCAT', category: 'text', arity: 'variadic', evaluate: (a) => a.map((v) => text(v, 'CONCAT')).join('') },
  { operatorId: 'TRIM', category: 'text', arity: 1, evaluate: (a) => text(a[0]!, 'TRIM').trim() },
  { operatorId: 'LOWERCASE', category: 'text', arity: 1, evaluate: (a) => text(a[0]!, 'LOWERCASE').toLowerCase() },
  { operatorId: 'UPPERCASE', category: 'text', arity: 1, evaluate: (a) => text(a[0]!, 'UPPERCASE').toUpperCase() },
  { operatorId: 'LENGTH', category: 'text', arity: 1, evaluate: (a) => (Array.isArray(a[0]) ? a[0].length : text(a[0]!, 'LENGTH').length) },
  // Conditional
  { operatorId: 'COALESCE', category: 'conditional', arity: 'variadic', evaluate: (a) => a.find((v) => v !== null) ?? null },
  // Date (deterministic — approved ISO string inputs only, no current-time dependence)
  { operatorId: 'BEFORE', category: 'date', arity: 2, evaluate: (a) => Date.parse(text(a[0]!, 'BEFORE')) < Date.parse(text(a[1]!, 'BEFORE')) },
  { operatorId: 'AFTER', category: 'date', arity: 2, evaluate: (a) => Date.parse(text(a[0]!, 'AFTER')) > Date.parse(text(a[1]!, 'AFTER')) },
  { operatorId: 'SAME_DATE', category: 'date', arity: 2, evaluate: (a) => text(a[0]!, 'SAME_DATE').slice(0, 10) === text(a[1]!, 'SAME_DATE').slice(0, 10) },
  { operatorId: 'DATE_DIFFERENCE', category: 'date', arity: 2, evaluate: (a) => Date.parse(text(a[0]!, 'DATE_DIFFERENCE')) - Date.parse(text(a[1]!, 'DATE_DIFFERENCE')) },
];

const REGISTRY = new Map(OPERATORS.map((op) => [op.operatorId, op]));

export function getOperator(operatorId: string): OperatorDefinition {
  const op = REGISTRY.get(operatorId);
  if (!op) throw new RuleTypeError(`Unsupported operator: ${operatorId}`);
  return op;
}

export function isRegisteredOperator(operatorId: string): boolean {
  return REGISTRY.has(operatorId);
}

export function listRegisteredOperators(): readonly string[] {
  return OPERATORS.map((op) => op.operatorId);
}
