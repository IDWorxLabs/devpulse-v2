/**
 * Self Documentation — dependency documentation analyzer.
 */

import type {
  DependencyDocumentationAnalysis,
  SelfDocumentationInput,
} from './self-documentation-types.js';
import { getCachedDependencyAnalysis, setCachedDependencyAnalysis } from './self-documentation-cache.js';

export interface DependencyDocumentationSnapshot {
  knownDependencies: string[];
}

const BASE_DEPENDENCIES = [
  'foundation_ownership_registry',
  'capability_registry',
  'find_panel_aliases',
  'uvl_row_registry',
  'package_validation_scripts',
  'trust_engine_checkpoint',
  'product_hardening_checkpoint',
  'unified_trust_score',
  'reliability_hardening',
  'performance_hardening',
  'security_hardening',
  'privacy_hardening',
  'recovery_hardening',
  'scale_hardening',
  'project_vault',
  'world2_workspace',
  'self_evolution_governance',
] as const;

let dependencyAnalysisCount = 0;

export function analyzeDependencyDocumentation(
  input: SelfDocumentationInput,
  snapshot: DependencyDocumentationSnapshot,
): DependencyDocumentationAnalysis {
  const cacheKey = [
    snapshot.knownDependencies.length,
    input.missingAuthorityChainMapping,
    ...(input.undocumentedDependencies ?? []),
  ].join('|');

  const cached = getCachedDependencyAnalysis(cacheKey);
  if (cached) return cached;

  dependencyAnalysisCount += 1;
  const dependencyWarnings: string[] = [];
  const undocumentedDependencies: string[] = [];
  let penalty = 0;

  if (input.missingAuthorityChainMapping === true) {
    dependencyWarnings.push('missing_authority_chain_mapping');
    penalty += 14;
  }

  for (const dep of input.undocumentedDependencies ?? []) {
    undocumentedDependencies.push(dep);
    penalty += 6;
  }

  const documentedCount = BASE_DEPENDENCIES.filter(
    (dep) => snapshot.knownDependencies.includes(dep) && !undocumentedDependencies.includes(dep),
  ).length;
  const coverageRatio = documentedCount / BASE_DEPENDENCIES.length;
  const baseScore = Math.round(70 + coverageRatio * 25);
  const dependencyCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: DependencyDocumentationAnalysis = {
    dependencyCoverageScore,
    undocumentedDependencies,
    dependencyWarnings,
  };

  setCachedDependencyAnalysis(cacheKey, result);
  return result;
}

export function getDependencyAnalysisCount(): number {
  return dependencyAnalysisCount;
}

export function resetDependencyDocumentationAnalyzerForTests(): void {
  dependencyAnalysisCount = 0;
}

export function listBaseDependencies(): readonly string[] {
  return BASE_DEPENDENCIES;
}
