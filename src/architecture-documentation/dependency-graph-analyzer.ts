/**
 * Architecture Documentation — dependency graph analyzer.
 */

import type {
  ArchitectureDocumentationInput,
  DependencyGraphAnalysis,
} from './architecture-documentation-types.js';
import { getCachedDependencyAnalysis, setCachedDependencyAnalysis } from './architecture-documentation-cache.js';

export interface DependencyGraphSnapshot {
  moduleDependencyCount: number;
  capabilityDependencyCount: number;
  validationDependencyCount: number;
}

const BASE_DEPENDENCIES = [
  'module_dependencies',
  'capability_dependencies',
  'authority_chain_dependencies',
  'validation_dependencies',
  'checkpoint_dependencies',
] as const;

let dependencyAnalysisCount = 0;

export function analyzeDependencyGraph(
  input: ArchitectureDocumentationInput,
  snapshot: DependencyGraphSnapshot,
): DependencyGraphAnalysis {
  const cacheKey = [
    snapshot.moduleDependencyCount,
    snapshot.capabilityDependencyCount,
    input.missingModuleDependencyGuidance,
    input.missingAuthorityChainDependencyGuidance,
    ...(input.undocumentedDependencies ?? []),
  ].join('|');

  const cached = getCachedDependencyAnalysis(cacheKey);
  if (cached) return cached;

  dependencyAnalysisCount += 1;
  const dependencyWarnings: string[] = [];
  const undocumentedDependencies: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingModuleDependencyGuidance, 'missing_module_dependency_guidance', 'module_dependencies'],
    [input.missingCapabilityDependencyGuidance, 'missing_capability_dependency_guidance', 'capability_dependencies'],
    [input.missingAuthorityChainDependencyGuidance, 'missing_authority_chain_dependency_guidance', 'authority_chain_dependencies'],
    [input.missingValidationDependencyGuidance, 'missing_validation_dependency_guidance', 'validation_dependencies'],
    [input.missingCheckpointDependencyGuidance, 'missing_checkpoint_dependency_guidance', 'checkpoint_dependencies'],
  ];

  for (const [flag, warning, area] of checks) {
    if (flag === true) {
      dependencyWarnings.push(warning);
      undocumentedDependencies.push(area);
      penalty += 9;
    }
  }

  for (const dep of input.undocumentedDependencies ?? []) {
    if (!undocumentedDependencies.includes(dep)) {
      undocumentedDependencies.push(dep);
      penalty += 6;
    }
  }

  const systemBonus =
    (snapshot.moduleDependencyCount > 0 ? 10 : 0)
    + (snapshot.capabilityDependencyCount > 0 ? 8 : 0)
    + (snapshot.validationDependencyCount > 0 ? 7 : 0);
  const documented = BASE_DEPENDENCIES.length - undocumentedDependencies.filter(
    (d) => BASE_DEPENDENCIES.includes(d as typeof BASE_DEPENDENCIES[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_DEPENDENCIES.length) * 80 + systemBonus);
  const dependencyCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: DependencyGraphAnalysis = {
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

export function resetDependencyGraphAnalyzerForTests(): void {
  dependencyAnalysisCount = 0;
}

export function listBaseDependencies(): readonly string[] {
  return BASE_DEPENDENCIES;
}
