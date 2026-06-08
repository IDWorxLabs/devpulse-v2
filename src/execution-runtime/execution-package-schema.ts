/**
 * Execution package schema — structural field definitions and defaults.
 */

import type { ExecutionPackage, PackageRiskLevel } from './types.js';
import { VALID_RISK_LEVELS } from './types.js';

export const REQUIRED_PACKAGE_FIELDS: (keyof ExecutionPackage)[] = [
  'packageId',
  'requestedBy',
  'requestText',
  'executionIntent',
  'targetDomain',
  'requestedAction',
  'riskLevel',
];

export function isKnownRiskLevel(value: string): value is PackageRiskLevel {
  return (VALID_RISK_LEVELS as readonly string[]).includes(value);
}

export function createEmptyPackage(): ExecutionPackage {
  return {
    packageId: '',
    requestedBy: '',
    requestText: '',
    executionIntent: '',
    targetDomain: '',
    requestedAction: '',
    riskLevel: 'LOW',
    requiresWrite: false,
    requiresCommand: false,
    requiresRecovery: false,
    requiresAutonomy: false,
    metadata: {},
  };
}

export function normalizePackage(pkg: ExecutionPackage): ExecutionPackage {
  return {
    ...pkg,
    packageId: pkg.packageId.trim(),
    requestedBy: pkg.requestedBy.trim(),
    requestText: pkg.requestText.trim(),
    executionIntent: pkg.executionIntent.trim(),
    targetDomain: pkg.targetDomain.trim(),
    requestedAction: pkg.requestedAction.trim(),
    metadata: { ...pkg.metadata },
  };
}

export function packageFieldPresent(pkg: ExecutionPackage, field: keyof ExecutionPackage): boolean {
  const value = pkg[field];
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== undefined && value !== null;
}
