/**
 * Self Documentation — authority builder.
 */

import type {
  AuthorityChainDocumentationAnalysis,
  CapabilityDocumentationAnalysis,
  DependencyDocumentationAnalysis,
  DocumentationCompletenessLevel,
  DocumentationState,
  ModuleDocumentationAnalysis,
  SelfDocumentationInput,
  UnifiedSelfDocumentationAuthority,
  ValidationDocumentationAnalysis,
} from './self-documentation-types.js';
import {
  resolveDocumentationCompletenessLevel,
  resolveDocumentationState,
} from './self-documentation-types.js';
import {
  getCachedSelfDocumentationAuthority,
  setCachedSelfDocumentationAuthority,
} from './self-documentation-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildUnifiedSelfDocumentationAuthority(
  requestId: string,
  capability: CapabilityDocumentationAnalysis,
  module: ModuleDocumentationAnalysis,
  dependency: DependencyDocumentationAnalysis,
  authorityChain: AuthorityChainDocumentationAnalysis,
  validation: ValidationDocumentationAnalysis,
  input: SelfDocumentationInput,
): UnifiedSelfDocumentationAuthority {
  const cacheKey = [
    requestId,
    capability.capabilityCoverageScore,
    module.moduleCoverageScore,
    dependency.dependencyCoverageScore,
    authorityChain.authorityCoverageScore,
    validation.validationCoverageScore,
  ].join('|');

  const cached = getCachedSelfDocumentationAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const documentationCoverageScore = Math.max(0, Math.min(100, Math.round(
    capability.capabilityCoverageScore * 0.2
      + module.moduleCoverageScore * 0.2
      + dependency.dependencyCoverageScore * 0.2
      + authorityChain.authorityCoverageScore * 0.2
      + validation.validationCoverageScore * 0.2,
  )));

  const completenessLevel: DocumentationCompletenessLevel = resolveDocumentationCompletenessLevel(
    documentationCoverageScore,
  );
  const state: DocumentationState = resolveDocumentationState(
    documentationCoverageScore,
    input.governanceBlocked,
  );
  const confidence = Math.min(100, Math.round(
    (documentationCoverageScore
      + capability.capabilityCoverageScore
      + validation.validationCoverageScore) / 3,
  ));

  const authority: UnifiedSelfDocumentationAuthority = {
    authorityId: `self-documentation-authority-${authorityCounter}`,
    documentationCoverageScore,
    capabilityCoverageScore: capability.capabilityCoverageScore,
    moduleCoverageScore: module.moduleCoverageScore,
    dependencyCoverageScore: dependency.dependencyCoverageScore,
    authorityCoverageScore: authorityChain.authorityCoverageScore,
    validationCoverageScore: validation.validationCoverageScore,
    completenessLevel,
    state,
    confidence,
    createdAt: Date.now(),
  };

  setCachedSelfDocumentationAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetSelfDocumentationAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
