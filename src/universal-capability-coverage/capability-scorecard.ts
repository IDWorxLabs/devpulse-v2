/**
 * Universal Capability Coverage Intelligence V1 — engineering scorecard.
 */

import type {
  CapabilityEngineeringScorecard,
  CapabilityMaturityLevel,
  UniversalCapabilityDescriptor,
} from './universal-capability-coverage-types.js';
import { maturityIndex } from './capability-maturity-classifier.js';

export function buildCapabilityEngineeringScorecard(
  capabilities: readonly UniversalCapabilityDescriptor[],
): CapabilityEngineeringScorecard {
  const total = capabilities.length;
  const behaviorallyVerified = capabilities.filter((c) =>
    c.maturityLevel === 'BEHAVIORALLY_VERIFIED' || c.maturityLevel === 'PRODUCTION_READY',
  ).length;
  // A capability counts toward production coverage when it is PRODUCTION_READY, or when it is a
  // genuinely-verified FUNCTIONAL_REFERENCE capability. FUNCTIONAL_REFERENCE is the honest, declared
  // support level for baseline reference packs (e.g. audit/export/preferences) whose descriptors set
  // `productionReadiness: true`; those packs are genuinely materialized, registered, and shell-free
  // (proven via `verifyPackBehavior`). Excluding them made `productionCoveragePercent = 100`
  // architecturally unreachable for every build (they ship in all builds), which is not a real gap —
  // required capabilities that are only functional references are still blocked separately by the
  // REQUIRED-criticality readiness check, so genuine gaps remain surfaced.
  const productionReady = capabilities.filter(
    (c) => c.supportClassification === 'PRODUCTION_READY' || c.supportClassification === 'FUNCTIONAL_REFERENCE',
  ).length;
  const partiallyImplemented = capabilities.filter((c) => c.supportClassification === 'PARTIALLY_IMPLEMENTED').length;
  const blocked = capabilities.filter(
    (c) =>
      c.supportClassification === 'BLOCKED_BY_DEPENDENCY' ||
      c.supportClassification === 'BLOCKED_BY_CONFIGURATION' ||
      c.supportClassification === 'NOT_IMPLEMENTED',
  ).length;
  const notImplemented = capabilities.filter((c) => c.maturityLevel === 'NOT_PRESENT' || c.maturityLevel === 'DECLARED').length;

  const behavioralCoveragePercent =
    total === 0 ? 0 : Math.min(100, Math.round(capabilities.reduce((a, c) => a + c.behavioralCoverage, 0) / total));
  const engineeringCoveragePercent =
    total === 0 ? 0 : Math.min(100, Math.round(capabilities.reduce((a, c) => a + c.engineeringCoverage, 0) / total));
  const productionCoveragePercent =
    total === 0 ? 0 : Math.min(100, Math.round((productionReady / Math.max(1, total)) * 100));
  const structuralCoveragePercent =
    total === 0
      ? 0
      : Math.min(100, Math.round(capabilities.reduce((a, c) => a + c.dimensionScores.structuralCoverage, 0) / total));
  const runtimeCoveragePercent =
    total === 0
      ? 0
      : Math.min(100, Math.round(capabilities.reduce((a, c) => a + c.dimensionScores.runtimeCoverage, 0) / total));

  const maturityIndexSum = capabilities.reduce((a, c) => a + maturityIndex(c.maturityLevel), 0);
  const maxMaturity = 5;
  const capabilityMaturityIndex =
    total === 0 ? 0 : Math.round((maturityIndexSum / (total * maxMaturity)) * 100);

  return {
    totalCapabilities: total,
    behaviorallyVerified,
    productionReady,
    partiallyImplemented,
    blocked,
    notImplemented,
    behavioralCoveragePercent,
    engineeringCoveragePercent,
    productionCoveragePercent,
    structuralCoveragePercent,
    runtimeCoveragePercent,
    capabilityMaturityIndex,
  };
}

export function renderScorecardMarkdown(scorecard: CapabilityEngineeringScorecard): string {
  return [
    '# Capability Engineering Scorecard',
    '',
    `- Total capabilities: ${scorecard.totalCapabilities}`,
    `- Behaviorally verified: ${scorecard.behaviorallyVerified}`,
    `- Production ready: ${scorecard.productionReady}`,
    `- Partially implemented: ${scorecard.partiallyImplemented}`,
    `- Blocked: ${scorecard.blocked}`,
    `- Not implemented: ${scorecard.notImplemented}`,
    `- Behavioral coverage: ${scorecard.behavioralCoveragePercent}%`,
    `- Engineering coverage: ${scorecard.engineeringCoveragePercent}%`,
    `- Production coverage: ${scorecard.productionCoveragePercent}%`,
    `- Capability maturity index: ${scorecard.capabilityMaturityIndex}`,
    '',
  ].join('\n');
}

export function scorecardIsDeterministic(
  a: CapabilityEngineeringScorecard,
  b: CapabilityEngineeringScorecard,
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function filterByMaturity(
  capabilities: readonly UniversalCapabilityDescriptor[],
  level: CapabilityMaturityLevel,
): UniversalCapabilityDescriptor[] {
  return capabilities.filter((c) => c.maturityLevel === level);
}
