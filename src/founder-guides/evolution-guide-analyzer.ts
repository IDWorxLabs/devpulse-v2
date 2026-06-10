/**
 * Founder Guides — evolution guide analyzer.
 */

import type { EvolutionGuideAnalysis, FounderGuidesInput } from './founder-guides-types.js';
import { getCachedEvolutionAnalysis, setCachedEvolutionAnalysis } from './founder-guides-cache.js';

export interface EvolutionGuideSnapshot {
  hasSelfEvolutionGovernance: boolean;
  hasMissingCapabilityEscalation: boolean;
  hasWorld2Growth: boolean;
  hasFounderApprovalBoundaries: boolean;
}

const EVOLUTION_AREAS = [
  'self_evolution_governance',
  'missing_capability_escalation',
  'world2_growth',
  'roadmap_progression',
  'future_cloud_evolution',
  'founder_approval_boundaries',
] as const;

let evolutionAnalysisCount = 0;

export function analyzeEvolutionGuide(
  input: FounderGuidesInput,
  snapshot: EvolutionGuideSnapshot,
): EvolutionGuideAnalysis {
  const cacheKey = [
    snapshot.hasSelfEvolutionGovernance,
    snapshot.hasMissingCapabilityEscalation,
    snapshot.hasWorld2Growth,
    snapshot.hasFounderApprovalBoundaries,
    input.missingSelfEvolutionGuidance,
    input.missingEscalationGuidance,
    input.missingWorld2GrowthGuidance,
    input.missingFounderApprovalBoundaryGuidance,
    ...(input.undocumentedEvolutionAreas ?? []),
  ].join('|');

  const cached = getCachedEvolutionAnalysis(cacheKey);
  if (cached) return cached;

  evolutionAnalysisCount += 1;
  const evolutionWarnings: string[] = [];
  const undocumentedEvolutionAreas: string[] = [];
  let penalty = 0;

  if (input.missingSelfEvolutionGuidance === true || !snapshot.hasSelfEvolutionGovernance) {
    if (input.missingSelfEvolutionGuidance === true) {
      evolutionWarnings.push('missing_self_evolution_guidance');
      penalty += 10;
    }
    if (!snapshot.hasSelfEvolutionGovernance) {
      undocumentedEvolutionAreas.push('self_evolution_governance');
    }
  }
  if (input.missingEscalationGuidance === true || !snapshot.hasMissingCapabilityEscalation) {
    if (input.missingEscalationGuidance === true) {
      evolutionWarnings.push('missing_escalation_guidance');
      penalty += 10;
    }
    if (!snapshot.hasMissingCapabilityEscalation) {
      undocumentedEvolutionAreas.push('missing_capability_escalation');
    }
  }
  if (input.missingWorld2GrowthGuidance === true || !snapshot.hasWorld2Growth) {
    if (input.missingWorld2GrowthGuidance === true) {
      evolutionWarnings.push('missing_world2_growth_guidance');
      penalty += 8;
    }
    if (!snapshot.hasWorld2Growth) {
      undocumentedEvolutionAreas.push('world2_growth');
    }
  }
  if (input.missingFounderApprovalBoundaryGuidance === true || !snapshot.hasFounderApprovalBoundaries) {
    if (input.missingFounderApprovalBoundaryGuidance === true) {
      evolutionWarnings.push('missing_founder_approval_boundary_guidance');
      penalty += 8;
    }
    if (!snapshot.hasFounderApprovalBoundaries) {
      undocumentedEvolutionAreas.push('founder_approval_boundaries');
    }
  }

  for (const area of input.undocumentedEvolutionAreas ?? []) {
    if (!undocumentedEvolutionAreas.includes(area)) {
      undocumentedEvolutionAreas.push(area);
      penalty += 6;
    }
  }

  let documented = 0;
  if (snapshot.hasSelfEvolutionGovernance && !undocumentedEvolutionAreas.includes('self_evolution_governance')) {
    documented += 1;
  }
  if (snapshot.hasMissingCapabilityEscalation && !undocumentedEvolutionAreas.includes('missing_capability_escalation')) {
    documented += 1;
  }
  if (snapshot.hasWorld2Growth && !undocumentedEvolutionAreas.includes('world2_growth')) {
    documented += 1;
  }
  if (snapshot.hasFounderApprovalBoundaries && !undocumentedEvolutionAreas.includes('founder_approval_boundaries')) {
    documented += 1;
  }
  documented += 2;

  const baseScore = Math.round((documented / EVOLUTION_AREAS.length) * 90);
  const evolutionCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: EvolutionGuideAnalysis = {
    evolutionCoverageScore,
    undocumentedEvolutionAreas,
    evolutionWarnings,
  };

  setCachedEvolutionAnalysis(cacheKey, result);
  return result;
}

export function getEvolutionAnalysisCount(): number {
  return evolutionAnalysisCount;
}

export function resetEvolutionGuideAnalyzerForTests(): void {
  evolutionAnalysisCount = 0;
}

export function listEvolutionAreas(): readonly string[] {
  return EVOLUTION_AREAS;
}
