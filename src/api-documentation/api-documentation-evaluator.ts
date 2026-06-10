/**
 * API Documentation — evaluator.
 */

import type {
  ApiDocumentationEvaluation,
  UnifiedApiDocumentationAuthority,
} from './api-documentation-types.js';
import {
  getCachedApiDocumentationEvaluation,
  setCachedApiDocumentationEvaluation,
} from './api-documentation-cache.js';

let evaluationCount = 0;

const STATE_READINESS: Record<ApiDocumentationEvaluation['state'], number> = {
  DOCUMENTED: 95,
  PARTIALLY_DOCUMENTED: 70,
  NEEDS_DOCUMENTATION: 40,
  UNKNOWN: 10,
};

export function evaluateApiDocumentation(
  authority: UnifiedApiDocumentationAuthority,
): ApiDocumentationEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.apiCoverageScore,
    authority.state,
    authority.coverageLevel,
  ].join('|');

  const cached = getCachedApiDocumentationEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: ApiDocumentationEvaluation = {
    apiCoverageScore: authority.apiCoverageScore,
    interfaceCoverageScore: authority.interfaceCoverageScore,
    contractCoverageScore: authority.contractCoverageScore,
    integrationCoverageScore: authority.integrationCoverageScore,
    commandCoverageScore: authority.commandCoverageScore,
    coverageLevel: authority.coverageLevel,
    state: authority.state,
    confidence: authority.confidence,
    documentationReadiness: Math.round(
      (STATE_READINESS[authority.state] + authority.confidence) / 2,
    ),
  };

  setCachedApiDocumentationEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetApiDocumentationEvaluatorForTests(): void {
  evaluationCount = 0;
}
