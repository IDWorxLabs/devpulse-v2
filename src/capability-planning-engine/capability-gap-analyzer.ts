/**
 * Capability Planning Engine Era 3 — capability gap analysis.
 */

import type {
  CapabilityGap,
  CapabilityGapDecision,
  ExistingCapabilitySearchResult,
  RiskLevel,
} from './capability-planning-types.js';

let gapCounter = 0;

export function resetCapabilityGapAnalyzerForTests(): void {
  gapCounter = 0;
}

function riskFor(requiredName: string, matchType: string): RiskLevel {
  if (/payment|medical diagnosis|identity verification|location tracking|database migration/i.test(requiredName)) {
    return 'HIGH';
  }
  if (/ai assistant|sync|cloud|auth/i.test(requiredName)) return 'MEDIUM';
  if (matchType === 'INCOMPATIBLE') return 'HIGH';
  return 'LOW';
}

function decide(search: ExistingCapabilitySearchResult): CapabilityGapDecision {
  const { matchType, matchConfidence, requiredCapability } = search;

  if (/payment processing/i.test(requiredCapability.name)) return 'NEEDS_HUMAN_REVIEW';
  if (/ai assistant/i.test(requiredCapability.name) && !/ai|assistant|ml|gpt/i.test(requiredCapability.description)) {
    return 'BLOCK_BUILD';
  }

  if (matchType === 'VALIDATED' && matchConfidence >= 0.8) return 'REUSE_EXISTING';
  if (matchType === 'INCOMPLETE' && matchConfidence >= 0.65) return 'COMPOSE_FROM_EXISTING';
  if (matchType === 'MISSING' || matchType === 'UNVALIDATED') {
    const risk = riskFor(requiredCapability.name, matchType);
    if (risk === 'HIGH') return 'NEEDS_HUMAN_REVIEW';
    return 'GENERATE_MISSING';
  }
  if (matchType === 'INCOMPATIBLE') return requiredCapability.mandatory ? 'BLOCK_BUILD' : 'NEEDS_HUMAN_REVIEW';
  return 'GENERATE_MISSING';
}

export function analyzeCapabilityGaps(
  searchResults: readonly ExistingCapabilitySearchResult[],
): CapabilityGap[] {
  return searchResults.map((search) => {
    gapCounter += 1;
    const decision = decide(search);
    const missingSubCapabilities: string[] = [];
    if (search.matchType === 'INCOMPLETE' && search.matchedCapability) {
      missingSubCapabilities.push('integration_validation', 'behavior_coverage');
    }
    if (search.matchType === 'MISSING') {
      missingSubCapabilities.push(search.requiredCapability.name);
    }

    return {
      readOnly: true,
      gapId: `gap-${gapCounter}`,
      requiredCapability: search.requiredCapability,
      matchedCapabilityId: search.matchedCapability?.capabilityId ?? null,
      matchConfidence: search.matchConfidence,
      coveragePercentage: search.coveragePercentage,
      missingSubCapabilities,
      risk: riskFor(search.requiredCapability.name, search.matchType),
      decision,
    };
  });
}
