/**
 * Architecture Documentation — authority builder.
 */

import type {
  ArchitectureBoundaryAnalysis,
  ArchitectureCoverageLevel,
  ArchitectureDocumentationInput,
  ArchitectureDocumentationState,
  AuthorityChainArchitectureAnalysis,
  DependencyGraphAnalysis,
  DomainArchitectureAnalysis,
  IntegrationPointAnalysis,
  UnifiedArchitectureDocumentationAuthority,
} from './architecture-documentation-types.js';
import {
  resolveArchitectureCoverageLevel,
  resolveArchitectureDocumentationState,
} from './architecture-documentation-types.js';
import {
  getCachedArchitectureDocumentationAuthority,
  setCachedArchitectureDocumentationAuthority,
} from './architecture-documentation-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildUnifiedArchitectureDocumentationAuthority(
  requestId: string,
  domain: DomainArchitectureAnalysis,
  dependency: DependencyGraphAnalysis,
  integration: IntegrationPointAnalysis,
  boundary: ArchitectureBoundaryAnalysis,
  authorityChain: AuthorityChainArchitectureAnalysis,
  input: ArchitectureDocumentationInput,
): UnifiedArchitectureDocumentationAuthority {
  const cacheKey = [
    requestId,
    domain.domainCoverageScore,
    dependency.dependencyCoverageScore,
    integration.integrationCoverageScore,
    boundary.boundaryCoverageScore,
    authorityChain.authorityCoverageScore,
  ].join('|');

  const cached = getCachedArchitectureDocumentationAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const architectureCoverageScore = Math.max(0, Math.min(100, Math.round(
    domain.domainCoverageScore * 0.2
      + dependency.dependencyCoverageScore * 0.2
      + integration.integrationCoverageScore * 0.2
      + boundary.boundaryCoverageScore * 0.2
      + authorityChain.authorityCoverageScore * 0.2,
  )));

  const coverageLevel: ArchitectureCoverageLevel = resolveArchitectureCoverageLevel(
    architectureCoverageScore,
  );
  const state: ArchitectureDocumentationState = resolveArchitectureDocumentationState(
    architectureCoverageScore,
    input.governanceBlocked,
  );
  const confidence = Math.min(100, Math.round(
    (architectureCoverageScore + domain.domainCoverageScore + integration.integrationCoverageScore) / 3,
  ));

  const authority: UnifiedArchitectureDocumentationAuthority = {
    authorityId: `architecture-documentation-authority-${authorityCounter}`,
    architectureCoverageScore,
    dependencyCoverageScore: dependency.dependencyCoverageScore,
    integrationCoverageScore: integration.integrationCoverageScore,
    boundaryCoverageScore: boundary.boundaryCoverageScore,
    authorityCoverageScore: authorityChain.authorityCoverageScore,
    coverageLevel,
    state,
    confidence,
    createdAt: Date.now(),
  };

  setCachedArchitectureDocumentationAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetArchitectureDocumentationAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
