/**
 * Self Documentation — module documentation analyzer.
 */

import type {
  ModuleDocumentationAnalysis,
  SelfDocumentationInput,
} from './self-documentation-types.js';
import { getCachedModuleAnalysis, setCachedModuleAnalysis } from './self-documentation-cache.js';

export interface ModuleDocumentationSnapshot {
  moduleCount: number;
  moduleDomains: string[];
}

let moduleAnalysisCount = 0;

export function analyzeModuleDocumentation(
  input: SelfDocumentationInput,
  snapshot: ModuleDocumentationSnapshot,
): ModuleDocumentationAnalysis {
  const cacheKey = [
    snapshot.moduleCount,
    input.missingModuleExports,
    input.missingModulePurpose,
    input.missingModuleOwnership,
    ...(input.undocumentedModuleDomains ?? []),
  ].join('|');

  const cached = getCachedModuleAnalysis(cacheKey);
  if (cached) return cached;

  moduleAnalysisCount += 1;
  const moduleDocumentationWarnings: string[] = [];
  const undocumentedModules: string[] = [];
  let penalty = 0;

  if (input.missingModuleExports === true) {
    moduleDocumentationWarnings.push('missing_module_exports');
    penalty += 12;
  }
  if (input.missingModulePurpose === true) {
    moduleDocumentationWarnings.push('missing_module_purpose');
    penalty += 10;
  }
  if (input.missingModuleOwnership === true) {
    moduleDocumentationWarnings.push('missing_module_ownership');
    penalty += 10;
  }

  for (const domain of input.undocumentedModuleDomains ?? []) {
    undocumentedModules.push(domain);
    penalty += 6;
  }

  const baseScore = snapshot.moduleCount > 0 ? 90 : 35;
  const moduleCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: ModuleDocumentationAnalysis = {
    moduleCoverageScore,
    undocumentedModules,
    moduleDocumentationWarnings,
  };

  setCachedModuleAnalysis(cacheKey, result);
  return result;
}

export function getModuleAnalysisCount(): number {
  return moduleAnalysisCount;
}

export function resetModuleDocumentationAnalyzerForTests(): void {
  moduleAnalysisCount = 0;
}
