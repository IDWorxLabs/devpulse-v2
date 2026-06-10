/**
 * API Documentation — API surface analyzer.
 */

import type { ApiDocumentationInput, ApiSurfaceAnalysis } from './api-documentation-types.js';
import { getCachedApiSurfaceAnalysis, setCachedApiSurfaceAnalysis } from './api-documentation-cache.js';

export interface ApiSurfaceSnapshot {
  publicApiCount: number;
  serviceApiCount: number;
  validationApiCount: number;
}

const BASE_APIS = [
  'public_apis',
  'internal_apis',
  'service_apis',
  'orchestration_apis',
  'verification_apis',
  'governance_apis',
  'documentation_apis',
] as const;

let apiSurfaceAnalysisCount = 0;

export function analyzeApiSurface(
  input: ApiDocumentationInput,
  snapshot: ApiSurfaceSnapshot,
): ApiSurfaceAnalysis {
  const cacheKey = [
    snapshot.publicApiCount,
    snapshot.serviceApiCount,
    input.missingPublicApiGuidance,
    input.missingServiceApiGuidance,
    ...(input.undocumentedApis ?? []),
  ].join('|');

  const cached = getCachedApiSurfaceAnalysis(cacheKey);
  if (cached) return cached;

  apiSurfaceAnalysisCount += 1;
  const apiWarnings: string[] = [];
  const undocumentedApis: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingPublicApiGuidance, 'missing_public_api_guidance', 'public_apis'],
    [input.missingInternalApiGuidance, 'missing_internal_api_guidance', 'internal_apis'],
    [input.missingServiceApiGuidance, 'missing_service_api_guidance', 'service_apis'],
    [input.missingOrchestrationApiGuidance, 'missing_orchestration_api_guidance', 'orchestration_apis'],
    [input.missingVerificationApiGuidance, 'missing_verification_api_guidance', 'verification_apis'],
    [input.missingGovernanceApiGuidance, 'missing_governance_api_guidance', 'governance_apis'],
    [input.missingDocumentationApiGuidance, 'missing_documentation_api_guidance', 'documentation_apis'],
  ];

  for (const [flag, warning, area] of checks) {
    if (flag === true) {
      apiWarnings.push(warning);
      undocumentedApis.push(area);
      penalty += 9;
    }
  }

  for (const api of input.undocumentedApis ?? []) {
    if (!undocumentedApis.includes(api)) {
      undocumentedApis.push(api);
      penalty += 6;
    }
  }

  const systemBonus =
    (snapshot.publicApiCount > 0 ? 10 : 0)
    + (snapshot.serviceApiCount > 0 ? 8 : 0)
    + (snapshot.validationApiCount > 0 ? 7 : 0);
  const documented = BASE_APIS.length - undocumentedApis.filter(
    (a) => BASE_APIS.includes(a as typeof BASE_APIS[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_APIS.length) * 82 + systemBonus);
  const apiCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: ApiSurfaceAnalysis = { apiCoverageScore, undocumentedApis, apiWarnings };
  setCachedApiSurfaceAnalysis(cacheKey, result);
  return result;
}

export function getApiSurfaceAnalysisCount(): number {
  return apiSurfaceAnalysisCount;
}

export function resetApiSurfaceAnalyzerForTests(): void {
  apiSurfaceAnalysisCount = 0;
}

export function listBaseApis(): readonly string[] {
  return BASE_APIS;
}
