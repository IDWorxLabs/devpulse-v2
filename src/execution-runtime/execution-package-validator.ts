/**
 * Execution package validator — structural and flag consistency checks.
 */

import { classifyExecutionRequest } from '../execution-authority/execution-classifier.js';
import type { ExecutionClassification } from '../execution-authority/types.js';
import { isKnownRiskLevel, normalizePackage, packageFieldPresent } from './execution-package-schema.js';
import type { ExecutionPackage, PackageValidationResult } from './types.js';
import { mapClassificationToFutureGate } from './types.js';

const VALID_REQUESTED_BY = /^[a-z][a-z0-9_]*$/;

function flagExpectsClassification(
  flag: keyof Pick<
    ExecutionPackage,
    'requiresWrite' | 'requiresCommand' | 'requiresRecovery' | 'requiresAutonomy'
  >,
): ExecutionClassification {
  switch (flag) {
    case 'requiresWrite':
      return 'WRITE_OPERATION';
    case 'requiresCommand':
      return 'COMMAND_EXECUTION';
    case 'requiresRecovery':
      return 'RECOVERY_ACTION';
    case 'requiresAutonomy':
      return 'AUTONOMOUS_ACTION';
  }
}

function checkFlagConsistency(
  pkg: ExecutionPackage,
  classification: ExecutionClassification,
  errors: string[],
): void {
  const flags: Array<{
    enabled: boolean;
    flag: keyof Pick<
      ExecutionPackage,
      'requiresWrite' | 'requiresCommand' | 'requiresRecovery' | 'requiresAutonomy'
    >;
  }> = [
    { enabled: pkg.requiresWrite, flag: 'requiresWrite' },
    { enabled: pkg.requiresCommand, flag: 'requiresCommand' },
    { enabled: pkg.requiresRecovery, flag: 'requiresRecovery' },
    { enabled: pkg.requiresAutonomy, flag: 'requiresAutonomy' },
  ];

  for (const { enabled, flag } of flags) {
    if (!enabled) continue;
    const expected = flagExpectsClassification(flag);
    if (
      flag === 'requiresWrite' &&
      (classification === 'WRITE_OPERATION' || classification === 'PROJECT_MODIFICATION')
    ) {
      continue;
    }
    if (classification !== expected) {
      errors.push(
        `${flag}=true but request classifies as ${classification} — expected ${expected} for future gate ${mapClassificationToFutureGate(expected) ?? 'n/a'}.`,
      );
    }
  }

  if (
    pkg.requiresCommand &&
    classification === 'COMMAND_EXECUTION' &&
    !mapClassificationToFutureGate('COMMAND_EXECUTION')
  ) {
    errors.push('requiresCommand=true without resolvable command execution gate.');
  }
}

export function validateExecutionPackage(pkg: ExecutionPackage): PackageValidationResult {
  const normalized = normalizePackage(pkg);
  const errors: string[] = [];
  const warnings: string[] = [
    'Execution Package Runtime validates structure only — no commands, writes, or recovery executed.',
  ];

  if (!packageFieldPresent(normalized, 'packageId')) {
    errors.push('missing packageId');
  }
  if (!packageFieldPresent(normalized, 'requestText')) {
    errors.push('missing requestText');
  }
  if (!packageFieldPresent(normalized, 'requestedAction')) {
    errors.push('missing requestedAction');
  }
  if (!isKnownRiskLevel(normalized.riskLevel)) {
    errors.push(`unknown riskLevel: ${String(normalized.riskLevel)}`);
  }
  if (!normalized.requestedBy || !VALID_REQUESTED_BY.test(normalized.requestedBy)) {
    errors.push('invalid requestedBy — must be lowercase system id (e.g. test_system)');
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  const classification = classifyExecutionRequest(normalized.requestText);
  checkFlagConsistency(normalized, classification, errors);

  if (
    (normalized.requiresWrite ||
      normalized.requiresCommand ||
      normalized.requiresRecovery ||
      normalized.requiresAutonomy) &&
    classification === 'READ_ONLY'
  ) {
    errors.push('contradictory flags — capability flags set but requestText is read-only.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
