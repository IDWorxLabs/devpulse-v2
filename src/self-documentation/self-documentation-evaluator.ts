/**
 * Self Documentation — evaluator.
 */

import type {
  SelfDocumentationEvaluation,
  UnifiedSelfDocumentationAuthority,
} from './self-documentation-types.js';
import {
  getCachedSelfDocumentationEvaluation,
  setCachedSelfDocumentationEvaluation,
} from './self-documentation-cache.js';

let evaluationCount = 0;

const STATE_READINESS: Record<SelfDocumentationEvaluation['state'], number> = {
  DOCUMENTED: 95,
  PARTIALLY_DOCUMENTED: 75,
  NEEDS_DOCUMENTATION: 45,
  UNKNOWN: 10,
};

export function evaluateSelfDocumentation(
  authority: UnifiedSelfDocumentationAuthority,
): SelfDocumentationEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.documentationCoverageScore,
    authority.state,
    authority.completenessLevel,
  ].join('|');

  const cached = getCachedSelfDocumentationEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: SelfDocumentationEvaluation = {
    documentationCoverageScore: authority.documentationCoverageScore,
    capabilityCoverageScore: authority.capabilityCoverageScore,
    moduleCoverageScore: authority.moduleCoverageScore,
    dependencyCoverageScore: authority.dependencyCoverageScore,
    authorityCoverageScore: authority.authorityCoverageScore,
    validationCoverageScore: authority.validationCoverageScore,
    completenessLevel: authority.completenessLevel,
    state: authority.state,
    confidence: authority.confidence,
    documentationReadiness: Math.round(
      (STATE_READINESS[authority.state] + authority.confidence) / 2,
    ),
  };

  setCachedSelfDocumentationEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetSelfDocumentationEvaluatorForTests(): void {
  evaluationCount = 0;
}
