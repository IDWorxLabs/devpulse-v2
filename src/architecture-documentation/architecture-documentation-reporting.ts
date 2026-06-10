/**
 * Architecture Documentation — reporting.
 */

import type {
  ArchitectureBoundaryAnalysis,
  ArchitectureDocumentationEvaluation,
  ArchitectureDocumentationRecord,
  ArchitectureDocumentationReport,
  AuthorityChainArchitectureAnalysis,
  DependencyGraphAnalysis,
  DomainArchitectureAnalysis,
  IntegrationPointAnalysis,
} from './architecture-documentation-types.js';
import { getArchitectureDocumentationCacheStats } from './architecture-documentation-cache.js';
import { getArchitectureDocumentationHistorySize } from './architecture-documentation-history.js';

let reportCount = 0;

export function generateArchitectureDocumentationReport(
  record: ArchitectureDocumentationRecord,
  evaluation: ArchitectureDocumentationEvaluation,
  domain: DomainArchitectureAnalysis,
  dependency: DependencyGraphAnalysis,
  integration: IntegrationPointAnalysis,
  boundary: ArchitectureBoundaryAnalysis,
  authorityChain: AuthorityChainArchitectureAnalysis,
  missingSignals: string[],
): ArchitectureDocumentationReport {
  reportCount += 1;
  const cache = getArchitectureDocumentationCacheStats();
  const recommendations: string[] = [];

  if (domain.undocumentedDomains.length > 0) {
    recommendations.push('Document foundation, ownership, capability, and phase domains');
  }
  if (dependency.undocumentedDependencies.length > 0) {
    recommendations.push('Map module, capability, and authority chain dependencies');
  }
  if (integration.undocumentedIntegrations.length > 0) {
    recommendations.push('Document registry, UVL, validation, and governance integration points');
  }
  if (boundary.undocumentedBoundaries.length > 0) {
    recommendations.push('Clarify read-only, execution, trust, and World 2 boundaries');
  }
  if (authorityChain.undocumentedAuthorityChains.length > 0) {
    recommendations.push('Document trust engine, hardening, and verification authority chains');
  }
  if (missingSignals.length > 0) {
    recommendations.push('Collect missing architecture signals before release');
  }
  if (evaluation.state === 'DOCUMENTED' || evaluation.state === 'PARTIALLY_DOCUMENTED') {
    recommendations.push('Continue architecture documentation monitoring');
  } else {
    recommendations.push('Require architecture review before structural changes');
  }

  return {
    architectureCoverageScore: record.architectureCoverageScore,
    dependencyCoverageScore: record.dependencyCoverageScore,
    integrationCoverageScore: record.integrationCoverageScore,
    boundaryCoverageScore: evaluation.boundaryCoverageScore,
    authorityCoverageScore: evaluation.authorityCoverageScore,
    coverageLevel: record.coverageLevel,
    state: record.state,
    confidence: record.confidence,
    domainCoverage: [
      'Foundation domains define ownership boundaries',
      'Phase domains track system introduction order',
      ...domain.domainWarnings,
    ],
    dependencyCoverage: [
      'Module dependencies connect runtime systems',
      'Validation dependencies link checkpoints',
      ...dependency.dependencyWarnings,
    ],
    integrationCoverage: [
      'Registry integrations wire capabilities',
      'UVL integrations expose verification rows',
      ...integration.integrationWarnings,
    ],
    boundaryCoverage: [
      'Read-only boundaries prevent execution',
      'Governance boundaries protect controlled zones',
      ...boundary.boundaryWarnings,
    ],
    authorityCoverage: [
      'Trust Engine chain governs verification authority',
      'Documentation chain links self, founder, and user guides',
      ...authorityChain.authorityWarnings,
    ],
    undocumentedDomains: [...domain.undocumentedDomains],
    undocumentedDependencies: [...dependency.undocumentedDependencies],
    undocumentedIntegrations: [...integration.undocumentedIntegrations],
    undocumentedBoundaries: [...boundary.undocumentedBoundaries],
    undocumentedAuthorityChains: [...authorityChain.undocumentedAuthorityChains],
    missingSignals: [...missingSignals],
    recommendations: [...new Set(recommendations)],
    evaluation,
    historySize: getArchitectureDocumentationHistorySize(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
  };
}

export function getReportCount(): number {
  return reportCount;
}

export function resetArchitectureDocumentationReportingForTests(): void {
  reportCount = 0;
}
