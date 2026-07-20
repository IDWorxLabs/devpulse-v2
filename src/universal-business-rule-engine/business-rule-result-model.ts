/**
 * Universal Business Rule Engine V1 — typed rule result model.
 */

import type { RuleRuntimeValue } from './business-rule-operator-registry.js';

export type RuleResultStatus = 'PASSED' | 'FAILED' | 'VALUE' | 'BLOCKED' | 'INVALID' | 'NOT_EVALUATED' | 'ERROR';

export interface RuleViolation {
  readonly target: string;
  readonly code: string;
  readonly message: string;
  readonly severity: 'ERROR' | 'WARNING';
  readonly ruleId: string;
  readonly provenance: readonly string[];
}

export interface RuleEvaluationResult {
  readonly ruleId: string;
  readonly status: RuleResultStatus;
  readonly value: RuleRuntimeValue;
  readonly expectedType: string;
  readonly actualType: string;
  readonly violations: readonly RuleViolation[];
  readonly explanation: string;
  readonly dependencyResults: readonly string[];
  readonly provenance: readonly string[];
  readonly version: string;
}

export function ruleResultIsSuccess(result: RuleEvaluationResult): boolean {
  return result.status === 'PASSED' || result.status === 'VALUE';
}

/** Errors, blocked, invalid, and not-evaluated results must never count as success. */
export function ruleResultIsFailure(result: RuleEvaluationResult): boolean {
  return !ruleResultIsSuccess(result);
}
