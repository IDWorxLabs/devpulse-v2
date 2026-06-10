/**
 * Self Documentation — authority chain documentation analyzer.
 */

import type {
  AuthorityChainDocumentationAnalysis,
  SelfDocumentationInput,
} from './self-documentation-types.js';
import { getCachedAuthorityChainAnalysis, setCachedAuthorityChainAnalysis } from './self-documentation-cache.js';

export interface AuthorityChainDocumentationSnapshot {
  documentedChains: string[];
}

const BASE_AUTHORITY_CHAINS = [
  'trust_engine_chain',
  'product_hardening_chain',
  'verification_chain',
  'governance_chain',
  'world2_chain',
] as const;

let authorityAnalysisCount = 0;

export function analyzeAuthorityChainDocumentation(
  input: SelfDocumentationInput,
  snapshot: AuthorityChainDocumentationSnapshot,
): AuthorityChainDocumentationAnalysis {
  const cacheKey = [
    snapshot.documentedChains.length,
    ...(input.undocumentedAuthorityChains ?? []),
  ].join('|');

  const cached = getCachedAuthorityChainAnalysis(cacheKey);
  if (cached) return cached;

  authorityAnalysisCount += 1;
  const authorityWarnings: string[] = [];
  const undocumentedAuthorityChains: string[] = [];

  for (const chain of BASE_AUTHORITY_CHAINS) {
    const explicitlyMissing = (input.undocumentedAuthorityChains ?? []).includes(chain);
    const notInSnapshot = !snapshot.documentedChains.includes(chain);
    if (explicitlyMissing || notInSnapshot) {
      undocumentedAuthorityChains.push(chain);
      authorityWarnings.push(`undocumented_${chain}`);
    }
  }

  const documented = BASE_AUTHORITY_CHAINS.length - undocumentedAuthorityChains.length;
  const authorityCoverageScore = Math.max(
    0,
    Math.min(100, Math.round((documented / BASE_AUTHORITY_CHAINS.length) * 100)),
  );

  const result: AuthorityChainDocumentationAnalysis = {
    authorityCoverageScore,
    undocumentedAuthorityChains,
    authorityWarnings,
  };

  setCachedAuthorityChainAnalysis(cacheKey, result);
  return result;
}

export function getAuthorityAnalysisCount(): number {
  return authorityAnalysisCount;
}

export function resetAuthorityChainDocumentationAnalyzerForTests(): void {
  authorityAnalysisCount = 0;
}

export function listBaseAuthorityChains(): readonly string[] {
  return BASE_AUTHORITY_CHAINS;
}
