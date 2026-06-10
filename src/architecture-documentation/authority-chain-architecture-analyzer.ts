/**
 * Architecture Documentation — authority chain architecture analyzer.
 */

import type {
  ArchitectureDocumentationInput,
  AuthorityChainArchitectureAnalysis,
} from './architecture-documentation-types.js';
import {
  getCachedAuthorityChainAnalysis,
  setCachedAuthorityChainAnalysis,
} from './architecture-documentation-cache.js';

export interface AuthorityChainArchitectureSnapshot {
  hasTrustEngineChain: boolean;
  hasProductHardeningChain: boolean;
  hasDocumentationChain: boolean;
  hasGovernanceChains: boolean;
}

const BASE_AUTHORITY_CHAINS = [
  'trust_engine_chain',
  'product_hardening_chain',
  'documentation_chain',
  'governance_chains',
  'verification_chains',
  'world2_chains',
] as const;

let authorityAnalysisCount = 0;

export function analyzeAuthorityChainArchitecture(
  input: ArchitectureDocumentationInput,
  snapshot: AuthorityChainArchitectureSnapshot,
): AuthorityChainArchitectureAnalysis {
  const cacheKey = [
    snapshot.hasTrustEngineChain,
    snapshot.hasProductHardeningChain,
    input.missingTrustEngineChainGuidance,
    input.missingGovernanceChainGuidance,
    ...(input.undocumentedAuthorityChains ?? []),
  ].join('|');

  const cached = getCachedAuthorityChainAnalysis(cacheKey);
  if (cached) return cached;

  authorityAnalysisCount += 1;
  const authorityWarnings: string[] = [];
  const undocumentedAuthorityChains: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingTrustEngineChainGuidance, 'missing_trust_engine_chain_guidance', 'trust_engine_chain'],
    [input.missingProductHardeningChainGuidance, 'missing_product_hardening_chain_guidance', 'product_hardening_chain'],
    [input.missingDocumentationChainGuidance, 'missing_documentation_chain_guidance', 'documentation_chain'],
    [input.missingGovernanceChainGuidance, 'missing_governance_chain_guidance', 'governance_chains'],
    [input.missingVerificationChainGuidance, 'missing_verification_chain_guidance', 'verification_chains'],
    [input.missingWorld2ChainGuidance, 'missing_world2_chain_guidance', 'world2_chains'],
  ];

  for (const [flag, warning, area] of checks) {
    if (flag === true) {
      authorityWarnings.push(warning);
      undocumentedAuthorityChains.push(area);
      penalty += 9;
    }
  }

  for (const chain of input.undocumentedAuthorityChains ?? []) {
    if (!undocumentedAuthorityChains.includes(chain)) {
      undocumentedAuthorityChains.push(chain);
      penalty += 6;
    }
  }

  if (!snapshot.hasTrustEngineChain) undocumentedAuthorityChains.push('trust_engine_chain');
  if (!snapshot.hasProductHardeningChain) undocumentedAuthorityChains.push('product_hardening_chain');
  if (!snapshot.hasDocumentationChain) undocumentedAuthorityChains.push('documentation_chain');
  if (!snapshot.hasGovernanceChains) undocumentedAuthorityChains.push('governance_chains');

  const uniqueUndocumented = [...new Set(undocumentedAuthorityChains)];
  const systemBonus =
    (snapshot.hasTrustEngineChain ? 10 : 0)
    + (snapshot.hasProductHardeningChain ? 9 : 0)
    + (snapshot.hasDocumentationChain ? 8 : 0)
    + (snapshot.hasGovernanceChains ? 8 : 0);
  const documented = BASE_AUTHORITY_CHAINS.length - uniqueUndocumented.filter(
    (c) => BASE_AUTHORITY_CHAINS.includes(c as typeof BASE_AUTHORITY_CHAINS[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_AUTHORITY_CHAINS.length) * 80 + systemBonus);
  const authorityCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: AuthorityChainArchitectureAnalysis = {
    authorityCoverageScore,
    undocumentedAuthorityChains: uniqueUndocumented,
    authorityWarnings,
  };

  setCachedAuthorityChainAnalysis(cacheKey, result);
  return result;
}

export function getAuthorityAnalysisCount(): number {
  return authorityAnalysisCount;
}

export function resetAuthorityChainArchitectureAnalyzerForTests(): void {
  authorityAnalysisCount = 0;
}

export function listBaseAuthorityChains(): readonly string[] {
  return BASE_AUTHORITY_CHAINS;
}
