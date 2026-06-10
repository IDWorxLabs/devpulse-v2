/**
 * Architecture Documentation — domain architecture analyzer.
 */

import type {
  ArchitectureDocumentationInput,
  DomainArchitectureAnalysis,
} from './architecture-documentation-types.js';
import { getCachedDomainAnalysis, setCachedDomainAnalysis } from './architecture-documentation-cache.js';

export interface DomainArchitectureSnapshot {
  foundationDomainCount: number;
  capabilityDomainCount: number;
  documentationDomainCount: number;
}

const BASE_DOMAIN_AREAS = [
  'foundation_domains',
  'ownership_domains',
  'capability_domains',
  'phase_domains',
  'documentation_domains',
] as const;

let domainAnalysisCount = 0;

export function analyzeDomainArchitecture(
  input: ArchitectureDocumentationInput,
  snapshot: DomainArchitectureSnapshot,
): DomainArchitectureAnalysis {
  const cacheKey = [
    snapshot.foundationDomainCount,
    snapshot.capabilityDomainCount,
    input.missingFoundationDomainGuidance,
    input.missingOwnershipDomainGuidance,
    ...(input.undocumentedDomains ?? []),
  ].join('|');

  const cached = getCachedDomainAnalysis(cacheKey);
  if (cached) return cached;

  domainAnalysisCount += 1;
  const domainWarnings: string[] = [];
  const undocumentedDomains: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingFoundationDomainGuidance, 'missing_foundation_domain_guidance', 'foundation_domains'],
    [input.missingOwnershipDomainGuidance, 'missing_ownership_domain_guidance', 'ownership_domains'],
    [input.missingCapabilityDomainGuidance, 'missing_capability_domain_guidance', 'capability_domains'],
    [input.missingPhaseDomainGuidance, 'missing_phase_domain_guidance', 'phase_domains'],
    [input.missingDocumentationDomainGuidance, 'missing_documentation_domain_guidance', 'documentation_domains'],
  ];

  for (const [flag, warning, area] of checks) {
    if (flag === true) {
      domainWarnings.push(warning);
      undocumentedDomains.push(area);
      penalty += 9;
    }
  }

  for (const domain of input.undocumentedDomains ?? []) {
    if (!undocumentedDomains.includes(domain)) {
      undocumentedDomains.push(domain);
      penalty += 6;
    }
  }

  const systemBonus =
    (snapshot.foundationDomainCount > 0 ? 12 : 0)
    + (snapshot.capabilityDomainCount > 0 ? 10 : 0)
    + (snapshot.documentationDomainCount > 0 ? 8 : 0);
  const documented = BASE_DOMAIN_AREAS.length - undocumentedDomains.filter(
    (d) => BASE_DOMAIN_AREAS.includes(d as typeof BASE_DOMAIN_AREAS[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_DOMAIN_AREAS.length) * 82 + systemBonus);
  const domainCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: DomainArchitectureAnalysis = {
    domainCoverageScore,
    undocumentedDomains,
    domainWarnings,
  };

  setCachedDomainAnalysis(cacheKey, result);
  return result;
}

export function getDomainAnalysisCount(): number {
  return domainAnalysisCount;
}

export function resetDomainArchitectureAnalyzerForTests(): void {
  domainAnalysisCount = 0;
}

export function listBaseDomainAreas(): readonly string[] {
  return BASE_DOMAIN_AREAS;
}
