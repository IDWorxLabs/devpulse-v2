/**
 * Founder Guides — modification safety guide analyzer.
 */

import type { FounderGuidesInput, ModificationSafetyGuideAnalysis } from './founder-guides-types.js';
import { getCachedSafetyAnalysis, setCachedSafetyAnalysis } from './founder-guides-cache.js';

export interface ModificationSafetyGuideSnapshot {
  protectedFoundationCount: number;
  governanceControlledCount: number;
}

const PROTECTED_AREAS = [
  'foundation_ownership_registry',
  'execution_authority',
  'governance_stack',
  'trust_engine_chain',
  'product_hardening_chain',
  'checkpoint_validators',
] as const;

let safetyAnalysisCount = 0;

export function analyzeModificationSafetyGuide(
  input: FounderGuidesInput,
  snapshot: ModificationSafetyGuideSnapshot,
): ModificationSafetyGuideAnalysis {
  const cacheKey = [
    snapshot.protectedFoundationCount,
    snapshot.governanceControlledCount,
    input.missingProtectedFoundationGuidance,
    input.missingGovernanceControlledGuidance,
    input.missingCheckpointBeforeModifyGuidance,
    input.missingIsolatedModuleGuidance,
    ...(input.unsafeModificationAreas ?? []),
  ].join('|');

  const cached = getCachedSafetyAnalysis(cacheKey);
  if (cached) return cached;

  safetyAnalysisCount += 1;
  const safetyWarnings: string[] = [];
  const unsafeModificationAreas: string[] = [];
  let penalty = 0;

  if (input.missingProtectedFoundationGuidance === true) {
    safetyWarnings.push('missing_protected_foundation_guidance');
    penalty += 12;
  }
  if (input.missingGovernanceControlledGuidance === true) {
    safetyWarnings.push('missing_governance_controlled_guidance');
    penalty += 10;
  }
  if (input.missingCheckpointBeforeModifyGuidance === true) {
    safetyWarnings.push('missing_checkpoint_before_modify_guidance');
    penalty += 10;
  }
  if (input.missingIsolatedModuleGuidance === true) {
    safetyWarnings.push('missing_isolated_module_guidance');
    penalty += 8;
  }

  for (const area of input.unsafeModificationAreas ?? []) {
    unsafeModificationAreas.push(area);
    penalty += 7;
  }

  const baseScore = Math.round(
    50
      + Math.min(25, snapshot.protectedFoundationCount * 3)
      + Math.min(25, snapshot.governanceControlledCount * 5),
  );
  const safetyCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: ModificationSafetyGuideAnalysis = {
    safetyCoverageScore,
    unsafeModificationAreas,
    safetyWarnings,
  };

  setCachedSafetyAnalysis(cacheKey, result);
  return result;
}

export function getSafetyAnalysisCount(): number {
  return safetyAnalysisCount;
}

export function resetModificationSafetyGuideAnalyzerForTests(): void {
  safetyAnalysisCount = 0;
}

export function listProtectedAreas(): readonly string[] {
  return PROTECTED_AREAS;
}
