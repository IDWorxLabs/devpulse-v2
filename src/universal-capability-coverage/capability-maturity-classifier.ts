/**
 * Universal Capability Coverage Intelligence V1 — maturity classification.
 */

import type {
  CapabilityCoverageDimensions,
  CapabilityMilestoneCheck,
  CapabilitySupportClassification,
  CapabilityMaturityLevel,
  UniversalCapabilityDescriptor,
} from './universal-capability-coverage-types.js';

const MATURITY_ORDER: readonly CapabilityMaturityLevel[] = [
  'NOT_PRESENT',
  'DECLARED',
  'STRUCTURALLY_IMPLEMENTED',
  'FUNCTIONALLY_IMPLEMENTED',
  'BEHAVIORALLY_VERIFIED',
  'PRODUCTION_READY',
];

export function maturityIndex(level: CapabilityMaturityLevel): number {
  return MATURITY_ORDER.indexOf(level);
}

export function classifyMaturityFromDimensions(input: {
  requirementDeclared: boolean;
  structuralPresent: boolean;
  runtimePresent: boolean;
  behaviorallyVerified: boolean;
  productionReady: boolean;
}): CapabilityMaturityLevel {
  if (!input.requirementDeclared && !input.structuralPresent) return 'NOT_PRESENT';
  if (input.productionReady && input.behaviorallyVerified && input.runtimePresent) return 'PRODUCTION_READY';
  if (input.behaviorallyVerified) return 'BEHAVIORALLY_VERIFIED';
  if (input.runtimePresent) return 'FUNCTIONALLY_IMPLEMENTED';
  if (input.structuralPresent) return 'STRUCTURALLY_IMPLEMENTED';
  if (input.requirementDeclared) return 'DECLARED';
  return 'NOT_PRESENT';
}

export function classifySupportFromMaturity(input: {
  maturityLevel: CapabilityMaturityLevel;
  packSupportStatus?: string;
  blocked: boolean;
  invalid: boolean;
  deprecated: boolean;
}): CapabilitySupportClassification {
  if (input.invalid) return 'INVALID';
  if (input.deprecated) return 'DEPRECATED';
  if (input.blocked && input.packSupportStatus === 'NOT_IMPLEMENTED') return 'NOT_IMPLEMENTED';
  if (input.blocked && input.packSupportStatus === 'BLOCKED_BY_CONFIGURATION') return 'BLOCKED_BY_CONFIGURATION';
  if (input.blocked) return 'BLOCKED_BY_DEPENDENCY';
  if (input.maturityLevel === 'PRODUCTION_READY') return 'PRODUCTION_READY';
  if (input.packSupportStatus === 'FUNCTIONAL_REFERENCE' && input.maturityLevel === 'BEHAVIORALLY_VERIFIED') {
    return 'FUNCTIONAL_REFERENCE';
  }
  if (input.maturityLevel === 'BEHAVIORALLY_VERIFIED' || input.maturityLevel === 'FUNCTIONALLY_IMPLEMENTED') {
    return 'PARTIALLY_IMPLEMENTED';
  }
  if (input.packSupportStatus === 'EXPERIMENTAL') return 'EXPERIMENTAL';
  if (input.maturityLevel === 'STRUCTURALLY_IMPLEMENTED' || input.maturityLevel === 'DECLARED') {
    return 'PARTIALLY_IMPLEMENTED';
  }
  return 'NOT_IMPLEMENTED';
}

export function computeDimensionScores(checks: readonly CapabilityMilestoneCheck[]): CapabilityCoverageDimensions {
  const byPrefix = (prefix: string) => {
    const relevant = checks.filter((c) => c.milestoneId.startsWith(prefix));
    if (relevant.length === 0) return 0;
    return Math.round((relevant.filter((c) => c.passed).length / relevant.length) * 100);
  };
  const structural = byPrefix('structural');
  const runtime = byPrefix('runtime');
  const behavioral = byPrefix('behavioral');
  const production = byPrefix('production');
  const engineering = Math.round((structural + runtime + behavioral + production) / 4);
  return {
    structuralCoverage: structural,
    runtimeCoverage: runtime,
    behavioralCoverage: behavioral,
    productionCoverage: production,
    engineeringCoverage: engineering,
  };
}

export function deriveEngineeringCoverage(dimensions: CapabilityCoverageDimensions): number {
  return dimensions.engineeringCoverage;
}

export function deriveBehavioralCoverage(dimensions: CapabilityCoverageDimensions): number {
  return dimensions.behavioralCoverage;
}

export function maturityNeverSkipsStages(
  previous: CapabilityMaturityLevel,
  current: CapabilityMaturityLevel,
): boolean {
  return maturityIndex(current) >= maturityIndex(previous) || maturityIndex(current) === 0;
}

export function assertValidCapabilityDescriptor(descriptor: UniversalCapabilityDescriptor): readonly string[] {
  const issues: string[] = [];
  if (descriptor.behavioralCoverage > 0 && descriptor.dimensionScores.behavioralCoverage === 0) {
    issues.push('false_behavioral_coverage');
  }
  if (descriptor.maturityLevel === 'BEHAVIORALLY_VERIFIED' && descriptor.dimensionScores.behavioralCoverage === 0) {
    issues.push('maturity_without_behavior');
  }
  if (descriptor.maturityLevel === 'PRODUCTION_READY' && !descriptor.productionReadiness) {
    issues.push('production_maturity_without_readiness');
  }
  return issues;
}
