/**
 * Universal Business Rule Engine V1 — safe function registry.
 *
 * Rules may only invoke functions registered here. All registered functions are
 * pure, deterministic, typed, bounded, side-effect-free, and serializable by id.
 */

import type { RuleRuntimeValue } from './business-rule-operator-registry.js';
import { RuleTypeError, describeType } from './business-rule-operator-registry.js';

export interface SafeFunctionDefinition {
  readonly functionId: string;
  readonly version: string;
  readonly description: string;
  readonly evaluate: (args: readonly RuleRuntimeValue[]) => RuleRuntimeValue;
}

const SAFE_FUNCTIONS: readonly SafeFunctionDefinition[] = [
  {
    functionId: 'ROUND_HALF_UP',
    version: '1.0.0',
    description: 'Round a number to a fixed number of decimal places, half up',
    evaluate: (args) => {
      const [value, places] = args;
      if (typeof value !== 'number' || typeof places !== 'number') {
        throw new RuleTypeError(`ROUND_HALF_UP requires (number, number), got (${args.map(describeType).join(', ')})`);
      }
      const factor = 10 ** Math.trunc(places);
      return Math.round((value + Number.EPSILON) * factor) / factor;
    },
  },
  {
    functionId: 'ROUND_HALF_EVEN',
    version: '1.0.0',
    description: 'Round a number to fixed decimal places, half to even (banker rounding)',
    evaluate: (args) => {
      const [value, places] = args;
      if (typeof value !== 'number' || typeof places !== 'number') {
        throw new RuleTypeError('ROUND_HALF_EVEN requires (number, number)');
      }
      const factor = 10 ** Math.trunc(places);
      const scaled = value * factor;
      const floor = Math.floor(scaled);
      const diff = scaled - floor;
      let rounded: number;
      if (diff > 0.5) rounded = floor + 1;
      else if (diff < 0.5) rounded = floor;
      else rounded = floor % 2 === 0 ? floor : floor + 1;
      return rounded / factor;
    },
  },
  {
    functionId: 'TRUNCATE',
    version: '1.0.0',
    description: 'Truncate a number to fixed decimal places',
    evaluate: (args) => {
      const [value, places] = args;
      if (typeof value !== 'number' || typeof places !== 'number') {
        throw new RuleTypeError('TRUNCATE requires (number, number)');
      }
      const factor = 10 ** Math.trunc(places);
      return Math.trunc(value * factor) / factor;
    },
  },
  {
    functionId: 'FLOOR',
    version: '1.0.0',
    description: 'Floor of a number',
    evaluate: (args) => {
      if (typeof args[0] !== 'number') throw new RuleTypeError('FLOOR requires number');
      return Math.floor(args[0]);
    },
  },
  {
    functionId: 'CEILING',
    version: '1.0.0',
    description: 'Ceiling of a number',
    evaluate: (args) => {
      if (typeof args[0] !== 'number') throw new RuleTypeError('CEILING requires number');
      return Math.ceil(args[0]);
    },
  },
  {
    functionId: 'PERCENTAGE_OF',
    version: '1.0.0',
    description: 'Compute percent of a base value (percent, base) → percent/100 * base',
    evaluate: (args) => {
      const [percent, base] = args;
      if (typeof percent !== 'number' || typeof base !== 'number') {
        throw new RuleTypeError('PERCENTAGE_OF requires (number, number)');
      }
      return (percent / 100) * base;
    },
  },
  {
    functionId: 'CLAMP',
    version: '1.0.0',
    description: 'Clamp a number into an inclusive range (value, min, max)',
    evaluate: (args) => {
      const [value, min, max] = args;
      if (typeof value !== 'number' || typeof min !== 'number' || typeof max !== 'number') {
        throw new RuleTypeError('CLAMP requires (number, number, number)');
      }
      return Math.min(Math.max(value, min), max);
    },
  },
  {
    functionId: 'IS_BLANK',
    version: '1.0.0',
    description: 'True when a string is null, empty, or whitespace only',
    evaluate: (args) => {
      const value = args[0];
      if (value === null) return true;
      if (typeof value !== 'string') throw new RuleTypeError('IS_BLANK requires string or null');
      return value.trim().length === 0;
    },
  },
  {
    functionId: 'TEXT_LENGTH_BETWEEN',
    version: '1.0.0',
    description: 'True when trimmed string length is within inclusive bounds (text, min, max)',
    evaluate: (args) => {
      const [value, min, max] = args;
      if (typeof value !== 'string' || typeof min !== 'number' || typeof max !== 'number') {
        throw new RuleTypeError('TEXT_LENGTH_BETWEEN requires (string, number, number)');
      }
      const length = value.trim().length;
      return length >= min && length <= max;
    },
  },
  {
    functionId: 'MATCHES_SAFE_PATTERN',
    version: '1.0.0',
    description: 'True when the string contains no control characters (bounded, no dynamic regex)',
    evaluate: (args) => {
      if (typeof args[0] !== 'string') throw new RuleTypeError('MATCHES_SAFE_PATTERN requires string');
      // eslint-disable-next-line no-control-regex
      return !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(args[0]);
    },
  },
];

const REGISTRY = new Map(SAFE_FUNCTIONS.map((fn) => [fn.functionId, fn]));

export function getSafeFunction(functionId: string): SafeFunctionDefinition {
  const fn = REGISTRY.get(functionId);
  if (!fn) throw new RuleTypeError(`Unsafe or unregistered function: ${functionId}`);
  return fn;
}

export function isRegisteredSafeFunction(functionId: string): boolean {
  return REGISTRY.has(functionId);
}

export function listSafeFunctions(): readonly string[] {
  return SAFE_FUNCTIONS.map((fn) => fn.functionId);
}
