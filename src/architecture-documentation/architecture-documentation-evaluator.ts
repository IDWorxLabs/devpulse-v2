/**
 * Architecture Documentation — evaluator.
 */

import type {
  ArchitectureDocumentationEvaluation,
  UnifiedArchitectureDocumentationAuthority,
} from './architecture-documentation-types.js';
import {
  getCachedArchitectureDocumentationEvaluation,
  setCachedArchitectureDocumentationEvaluation,
} from './architecture-documentation-cache.js';

let evaluationCount = 0;

const STATE_READINESS: Record<ArchitectureDocumentationEvaluation['state'], number> = {
  DOCUMENTED: 95,
  PARTIALLY_DOCUMENTED: 70,
  NEEDS_DOCUMENTATION: 40,
  UNKNOWN: 10,
};

export function evaluateArchitectureDocumentation(
  authority: UnifiedArchitectureDocumentationAuthority,
): ArchitectureDocumentationEvaluation {
  const cacheKey = [
    authority.authorityId,
    authority.architectureCoverageScore,
    authority.state,
    authority.coverageLevel,
  ].join('|');

  const cached = getCachedArchitectureDocumentationEvaluation(cacheKey);
  if (cached) return cached;

  evaluationCount += 1;

  const result: ArchitectureDocumentationEvaluation = {
    architectureCoverageScore: authority.architectureCoverageScore,
    dependencyCoverageScore: authority.dependencyCoverageScore,
    integrationCoverageScore: authority.integrationCoverageScore,
    boundaryCoverageScore: authority.boundaryCoverageScore,
    authorityCoverageScore: authority.authorityCoverageScore,
    coverageLevel: authority.coverageLevel,
    state: authority.state,
    confidence: authority.confidence,
    documentationReadiness: Math.round(
      (STATE_READINESS[authority.state] + authority.confidence) / 2,
    ),
  };

  setCachedArchitectureDocumentationEvaluation(cacheKey, result);
  return result;
}

export function getEvaluationCount(): number {
  return evaluationCount;
}

export function resetArchitectureDocumentationEvaluatorForTests(): void {
  evaluationCount = 0;
}
