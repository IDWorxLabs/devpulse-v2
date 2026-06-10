/**
 * Capability Planning Engine — impact analyzer.
 */

import type { CapabilityImpactAnalysis, CapabilityPlanningInput, CapabilityScopePlan } from './capability-planning-types.js';
import { getCachedImpact, setCachedImpact } from './capability-planning-cache.js';

let impactAnalysisCount = 0;

const SYSTEM_SIGNALS: Record<string, string[]> = {
  Builder: ['build', 'builder', 'construction'],
  Verification: ['verification', 'uvl', 'verify'],
  Trust: ['trust', 'authority', 'confidence'],
  Monitoring: ['monitor', 'feed', 'alert'],
  World2: ['world2', 'world 2', 'simulation'],
  Orchestration: ['orchestrat', 'schedule', 'pipeline'],
};

export function analyzeCapabilityImpact(
  input: CapabilityPlanningInput,
  scope: CapabilityScopePlan,
): CapabilityImpactAnalysis {
  const cacheKey = [input.proposedCapability, scope.moduleType, input.trustImpact, input.world2Impact].join('|');

  const cached = getCachedImpact(cacheKey);
  if (cached) return cached;

  impactAnalysisCount += 1;

  const haystack = [
    input.proposedCapability,
    input.subsystem ?? '',
    ...(input.signals ?? []),
    ...scope.integrationPoints,
  ].join(' ').toLowerCase();

  const affectedSystems: string[] = [];
  for (const [system, signals] of Object.entries(SYSTEM_SIGNALS)) {
    if (signals.some((s) => haystack.includes(s))) {
      affectedSystems.push(system);
    }
  }
  if (input.trustImpact && !affectedSystems.includes('Trust')) affectedSystems.push('Trust');
  if (input.world2Impact && !affectedSystems.includes('World2')) affectedSystems.push('World2');

  let impactScore = affectedSystems.length * 15;
  if (scope.moduleType === 'new_module') impactScore += 20;
  if (scope.integrationPoints.length > 3) impactScore += 15;
  impactScore = Math.min(100, impactScore);

  let impactLevel: CapabilityImpactAnalysis['impactLevel'] = 'LOW';
  if (impactScore >= 60) impactLevel = 'HIGH';
  else if (impactScore >= 30) impactLevel = 'MEDIUM';

  const analysis: CapabilityImpactAnalysis = {
    impactScore,
    impactLevel,
    affectedSystems: [...new Set(affectedSystems)],
  };

  setCachedImpact(cacheKey, analysis);
  return analysis;
}

export function getImpactAnalysisCount(): number {
  return impactAnalysisCount;
}

export function resetImpactAnalyzerForTests(): void {
  impactAnalysisCount = 0;
}
