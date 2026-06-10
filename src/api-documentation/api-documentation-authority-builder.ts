/**
 * API Documentation — authority builder.
 */

import type {
  ApiCoverageLevel,
  ApiDocumentationInput,
  ApiDocumentationState,
  ApiSurfaceAnalysis,
  CommandSurfaceAnalysis,
  ContractDocumentationAnalysis,
  IntegrationApiAnalysis,
  InterfaceDocumentationAnalysis,
  UnifiedApiDocumentationAuthority,
} from './api-documentation-types.js';
import { resolveApiCoverageLevel, resolveApiDocumentationState } from './api-documentation-types.js';
import {
  getCachedApiDocumentationAuthority,
  setCachedApiDocumentationAuthority,
} from './api-documentation-cache.js';

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildUnifiedApiDocumentationAuthority(
  requestId: string,
  apiSurface: ApiSurfaceAnalysis,
  interfaces: InterfaceDocumentationAnalysis,
  contracts: ContractDocumentationAnalysis,
  integration: IntegrationApiAnalysis,
  commands: CommandSurfaceAnalysis,
  input: ApiDocumentationInput,
): UnifiedApiDocumentationAuthority {
  const cacheKey = [
    requestId,
    apiSurface.apiCoverageScore,
    interfaces.interfaceCoverageScore,
    contracts.contractCoverageScore,
    integration.integrationCoverageScore,
    commands.commandCoverageScore,
  ].join('|');

  const cached = getCachedApiDocumentationAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const apiCoverageScore = Math.max(0, Math.min(100, Math.round(
    apiSurface.apiCoverageScore * 0.2
      + interfaces.interfaceCoverageScore * 0.2
      + contracts.contractCoverageScore * 0.2
      + integration.integrationCoverageScore * 0.2
      + commands.commandCoverageScore * 0.2,
  )));

  const coverageLevel: ApiCoverageLevel = resolveApiCoverageLevel(apiCoverageScore);
  const state: ApiDocumentationState = resolveApiDocumentationState(
    apiCoverageScore,
    input.governanceBlocked,
  );
  const confidence = Math.min(100, Math.round(
    (apiCoverageScore + apiSurface.apiCoverageScore + interfaces.interfaceCoverageScore) / 3,
  ));

  const authority: UnifiedApiDocumentationAuthority = {
    authorityId: `api-documentation-authority-${authorityCounter}`,
    apiCoverageScore,
    interfaceCoverageScore: interfaces.interfaceCoverageScore,
    contractCoverageScore: contracts.contractCoverageScore,
    integrationCoverageScore: integration.integrationCoverageScore,
    commandCoverageScore: commands.commandCoverageScore,
    coverageLevel,
    state,
    confidence,
    createdAt: Date.now(),
  };

  setCachedApiDocumentationAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetApiDocumentationAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
