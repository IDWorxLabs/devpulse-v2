/**
 * Self Documentation — capability documentation analyzer.
 */

import type {
  CapabilityDocumentationAnalysis,
  SelfDocumentationInput,
} from './self-documentation-types.js';
import { getCachedCapabilityAnalysis, setCachedCapabilityAnalysis } from './self-documentation-cache.js';

export interface CapabilityDocumentationSnapshot {
  capabilityCount: number;
  capabilityIds: string[];
  aliasCount: number;
}

let capabilityAnalysisCount = 0;

export function analyzeCapabilityDocumentation(
  input: SelfDocumentationInput,
  snapshot: CapabilityDocumentationSnapshot,
): CapabilityDocumentationAnalysis {
  const cacheKey = [
    snapshot.capabilityCount,
    input.missingCapabilityLabels,
    input.missingCapabilityPhases,
    input.missingCapabilityAliases,
    ...(input.undocumentedCapabilityIds ?? []),
  ].join('|');

  const cached = getCachedCapabilityAnalysis(cacheKey);
  if (cached) return cached;

  capabilityAnalysisCount += 1;
  const capabilityDocumentationWarnings: string[] = [];
  const undocumentedCapabilities: string[] = [];
  let penalty = 0;

  if (input.missingCapabilityLabels === true) {
    capabilityDocumentationWarnings.push('missing_capability_labels');
    penalty += 12;
  }
  if (input.missingCapabilityPhases === true) {
    capabilityDocumentationWarnings.push('missing_capability_phases');
    penalty += 10;
  }
  if (input.missingCapabilityAliases === true) {
    capabilityDocumentationWarnings.push('missing_capability_aliases');
    penalty += 10;
  }

  for (const id of input.undocumentedCapabilityIds ?? []) {
    undocumentedCapabilities.push(id);
    penalty += 5;
  }

  const baseScore = snapshot.capabilityCount > 0 ? 92 : 40;
  const aliasBonus = snapshot.aliasCount > snapshot.capabilityCount ? 4 : 0;
  const capabilityCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore + aliasBonus - penalty)));

  const result: CapabilityDocumentationAnalysis = {
    capabilityCoverageScore,
    undocumentedCapabilities,
    capabilityDocumentationWarnings,
  };

  setCachedCapabilityAnalysis(cacheKey, result);
  return result;
}

export function getCapabilityAnalysisCount(): number {
  return capabilityAnalysisCount;
}

export function resetCapabilityDocumentationAnalyzerForTests(): void {
  capabilityAnalysisCount = 0;
}
