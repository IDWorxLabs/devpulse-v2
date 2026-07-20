/**
 * Universal Feature Contract Completeness V1 — canonical capability retention scoring.
 */

import type {
  FeatureContractCompletenessItem,
  FeatureContractCompletenessReport,
  UniversalFeatureContract,
} from './universal-feature-contract-types.js';

export interface CanonicalFeatureContractEvidence {
  readonly coreEntities: readonly string[];
  readonly primaryWorkflows: readonly string[];
  readonly majorFeatureGroups: readonly string[];
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function tokens(value: string): string[] {
  return normalize(value).split('-').filter(Boolean);
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function capabilityClassification(
  capability: string,
  canonical: CanonicalFeatureContractEvidence,
): FeatureContractCompletenessItem['classification'] {
  if (canonical.coreEntities.includes(capability)) return 'ENTITY';
  if (canonical.primaryWorkflows.includes(capability)) return 'WORKFLOW';
  return 'CAPABILITY';
}

function topLevelFeatureSurfaces(contract: UniversalFeatureContract): string[] {
  return unique([
    ...contract.entities.flatMap((entry) => [entry.label, entry.id, entry.slug]),
    ...(contract.modules ?? []),
  ]);
}

export function computeFeatureContractCompleteness(input: {
  canonical: CanonicalFeatureContractEvidence;
  featureContract: UniversalFeatureContract;
}): FeatureContractCompletenessReport {
  const requestedCapabilities = unique([
    ...input.canonical.coreEntities,
    ...input.canonical.primaryWorkflows,
    ...input.canonical.majorFeatureGroups,
  ]);
  const featureSurfaces = topLevelFeatureSurfaces(input.featureContract);
  const surfaceByNormalized = new Map(
    featureSurfaces.map((surface) => [normalize(surface), surface] as const),
  );
  const consumedSurface = new Map<string, string>();

  const capabilities: FeatureContractCompletenessItem[] = requestedCapabilities.map((capability) => {
    const capabilityId = normalize(capability);
    const exact = surfaceByNormalized.get(capabilityId);
    if (exact) {
      const priorCapability = consumedSurface.get(capabilityId);
      if (priorCapability && priorCapability !== capability) {
        return {
          capability,
          classification: capabilityClassification(capability, input.canonical),
          outcome: 'MERGED',
          matchedFeature: exact,
          reason: `Normalized feature identity is already owned by "${priorCapability}".`,
        };
      }
      consumedSurface.set(capabilityId, capability);
      return {
        capability,
        classification: capabilityClassification(capability, input.canonical),
        outcome: 'RETAINED',
        matchedFeature: exact,
        reason: 'Canonical capability has an exact top-level feature-contract surface.',
      };
    }

    const capabilityTokens = tokens(capability);
    const aggregate = featureSurfaces.find((surface) => {
      const surfaceTokens = new Set(tokens(surface));
      return capabilityTokens.length > 0 && capabilityTokens.every((token) => surfaceTokens.has(token));
    });
    if (aggregate) {
      return {
        capability,
        classification: capabilityClassification(capability, input.canonical),
        outcome: 'MERGED',
        matchedFeature: aggregate,
        reason: 'Canonical capability is represented inside a broader top-level feature.',
      };
    }

    return {
      capability,
      classification: capabilityClassification(capability, input.canonical),
      outcome: 'DISCARDED',
      matchedFeature: null,
      reason: 'No entity or approved module in the Universal Feature Contract preserves this capability.',
    };
  });

  const representedFeatureIds = new Set(
    capabilities
      .filter((entry) => entry.matchedFeature)
      .map((entry) => normalize(entry.matchedFeature!)),
  );
  const shellIds = new Set(['auth', 'authentication', 'dashboard', 'settings', 'persistence', 'navigation-router']);
  const hallucinatedCapabilities = unique(
    featureSurfaces.filter((surface) => {
      const id = normalize(surface);
      return !shellIds.has(id) && !representedFeatureIds.has(id);
    }),
  );
  const genericSubstitutions = hallucinatedCapabilities.filter((surface) => tokens(surface).length <= 1);
  const retainedCount = capabilities.filter((entry) => entry.outcome === 'RETAINED').length;
  const mergedCount = capabilities.filter((entry) => entry.outcome === 'MERGED').length;
  const discardedCount = capabilities.filter((entry) => entry.outcome === 'DISCARDED').length;
  const requestedCount = capabilities.length;
  const score =
    requestedCount === 0 ? 100 : Math.round(((retainedCount + mergedCount) / requestedCount) * 10_000) / 100;

  return {
    contractVersion: 'FEATURE_CONTRACT_COMPLETENESS_V1',
    score,
    requestedCount,
    retainedCount,
    discardedCount,
    mergedCount,
    hallucinatedCount: hallucinatedCapabilities.length,
    genericSubstitutionCount: genericSubstitutions.length,
    capabilities,
    hallucinatedCapabilities,
    genericSubstitutions,
  };
}
