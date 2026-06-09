/**
 * Verification Strategy Core — strategy registry metadata.
 */

import type {
  VerificationRiskLevel,
  VerificationStrategy,
  VerificationStrategyRegistryEntry,
} from './verification-strategy-types.js';

export const VERIFICATION_STRATEGY_REGISTRY: readonly VerificationStrategyRegistryEntry[] = [
  {
    strategyId: 'MINIMAL',
    description: 'Light verification for read-only, documentation, planning, and summary work',
    riskLevel: 'LOW',
    expectedValidators: ['UVL'],
    minimumConfidence: 40,
  },
  {
    strategyId: 'STANDARD',
    description: 'Default verification for normal feature, code, and UI changes',
    riskLevel: 'MEDIUM',
    expectedValidators: ['UVL', 'Runtime'],
    minimumConfidence: 70,
  },
  {
    strategyId: 'DEEP',
    description: 'Deep verification for architecture, infrastructure, brain, routing, and data model changes',
    riskLevel: 'HIGH',
    expectedValidators: ['UVL', 'Runtime', 'Intelligence Validation', 'Route Validation'],
    minimumConfidence: 80,
  },
  {
    strategyId: 'RELEASE',
    description: 'Release verification for production packaging and deployment preparation',
    riskLevel: 'HIGH',
    expectedValidators: ['UVL', 'Runtime', 'Release Validation'],
    minimumConfidence: 85,
  },
  {
    strategyId: 'CLOUD',
    description: 'Cloud verification when cloud, worker, remote, or API execution is touched',
    riskLevel: 'HIGH',
    expectedValidators: ['UVL', 'Cloud Validation', 'Runtime'],
    minimumConfidence: 75,
  },
  {
    strategyId: 'WORLD2',
    description: 'World 2 verification when autonomous execution, workspace, or builder is involved',
    riskLevel: 'CRITICAL',
    expectedValidators: ['UVL', 'Execution Validation', 'World2 Validation'],
    minimumConfidence: 80,
  },
  {
    strategyId: 'TRUST_RECOVERY',
    description: 'Escalated verification when trust is low or failures repeat',
    riskLevel: 'CRITICAL',
    expectedValidators: ['UVL', 'Runtime', 'Intelligence Validation', 'Execution Validation', 'Trust Validation'],
    minimumConfidence: 90,
  },
] as const;

export function getVerificationStrategyRegistryEntry(
  strategy: VerificationStrategy,
): VerificationStrategyRegistryEntry | undefined {
  return VERIFICATION_STRATEGY_REGISTRY.find((e) => e.strategyId === strategy);
}

export function listVerificationStrategyRegistryEntries(): VerificationStrategyRegistryEntry[] {
  return [...VERIFICATION_STRATEGY_REGISTRY];
}

export function getMinimumConfidenceForStrategy(strategy: VerificationStrategy): number {
  return getVerificationStrategyRegistryEntry(strategy)?.minimumConfidence ?? 70;
}

export function getExpectedValidatorsForStrategy(strategy: VerificationStrategy): string[] {
  return getVerificationStrategyRegistryEntry(strategy)?.expectedValidators ?? ['UVL'];
}

export function getRiskLevelForStrategy(strategy: VerificationStrategy): VerificationRiskLevel {
  return getVerificationStrategyRegistryEntry(strategy)?.riskLevel ?? 'MEDIUM';
}
