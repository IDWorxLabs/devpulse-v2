/**
 * Self Documentation — reporting.
 */

import type {
  SelfDocumentationEvaluation,
  SelfDocumentationRecord,
  SelfDocumentationReport,
} from './self-documentation-types.js';
import { getSelfDocumentationCacheStats } from './self-documentation-cache.js';
import { getSelfDocumentationHistorySize } from './self-documentation-history.js';

let reportCount = 0;

export function generateSelfDocumentationReport(
  record: SelfDocumentationRecord,
  evaluation: SelfDocumentationEvaluation,
  undocumentedCapabilities: string[],
  undocumentedModules: string[],
  undocumentedDependencies: string[],
  undocumentedAuthorityChains: string[],
  undocumentedValidators: string[],
  missingSignals: string[],
): SelfDocumentationReport {
  reportCount += 1;
  const cache = getSelfDocumentationCacheStats();
  const recommendations: string[] = [];

  if (undocumentedCapabilities.length > 0) {
    recommendations.push('Document undocumented capabilities in capability registry and find panel');
  }
  if (undocumentedModules.length > 0) {
    recommendations.push('Add module purpose and ownership documentation for undocumented modules');
  }
  if (undocumentedDependencies.length > 0) {
    recommendations.push('Map undocumented dependencies across authority and validation chains');
  }
  if (undocumentedAuthorityChains.length > 0) {
    recommendations.push('Document authority chain composition for trust, hardening, and governance');
  }
  if (undocumentedValidators.length > 0) {
    recommendations.push('Register pass tokens and checkpoint documentation for validators');
  }
  if (missingSignals.length > 0) {
    recommendations.push('Collect missing documentation signals before launch preparation');
  }
  if (evaluation.state === 'DOCUMENTED' || evaluation.state === 'PARTIALLY_DOCUMENTED') {
    recommendations.push('Continue self-documentation coverage monitoring');
  } else {
    recommendations.push('Require documentation review before user-facing guides');
  }

  return {
    documentationCoverageScore: record.documentationCoverageScore,
    capabilityCoverageScore: record.capabilityCoverageScore,
    moduleCoverageScore: evaluation.moduleCoverageScore,
    dependencyCoverageScore: record.dependencyCoverageScore,
    authorityCoverageScore: evaluation.authorityCoverageScore,
    validationCoverageScore: evaluation.validationCoverageScore,
    completenessLevel: record.completenessLevel,
    state: record.state,
    confidence: record.confidence,
    undocumentedCapabilities: [...undocumentedCapabilities],
    undocumentedModules: [...undocumentedModules],
    undocumentedDependencies: [...undocumentedDependencies],
    undocumentedAuthorityChains: [...undocumentedAuthorityChains],
    undocumentedValidators: [...undocumentedValidators],
    missingSignals: [...missingSignals],
    recommendations: [...new Set(recommendations)],
    evaluation,
    historySize: getSelfDocumentationHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetSelfDocumentationReportingForTests(): void {
  reportCount = 0;
}
