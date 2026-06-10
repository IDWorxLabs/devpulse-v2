/**
 * Capability Planning Engine — risk analyzer.
 */

import type {
  CapabilityImpactAnalysis,
  CapabilityPlanningInput,
  CapabilityRiskAnalysis,
  CapabilityScopePlan,
} from './capability-planning-types.js';
import { getCachedRisk, setCachedRisk } from './capability-planning-cache.js';

let riskAnalysisCount = 0;

export function analyzeCapabilityPlanRisk(
  input: CapabilityPlanningInput,
  scope: CapabilityScopePlan,
  impact: CapabilityImpactAnalysis,
): CapabilityRiskAnalysis {
  const cacheKey = [
    input.proposedCapability,
    scope.moduleType,
    impact.impactScore,
    input.trustImpact,
    input.world2Impact,
  ].join('|');

  const cached = getCachedRisk(cacheKey);
  if (cached) return cached;

  riskAnalysisCount += 1;

  const factors: string[] = [];
  let riskScore = 10;

  riskScore += impact.impactScore * 0.4;
  if (impact.impactScore >= 50) factors.push('high_blast_radius');

  riskScore += scope.integrationPoints.length * 5;
  if (scope.integrationPoints.length >= 4) factors.push('dependency_count');

  if (impact.affectedSystems.includes('Trust')) {
    riskScore += 20;
    factors.push('trust_impact');
  }
  if (impact.affectedSystems.includes('World2')) {
    riskScore += 20;
    factors.push('world2_impact');
  }
  if (impact.affectedSystems.includes('Orchestration')) {
    riskScore += 10;
    factors.push('orchestration_impact');
  }
  if (impact.affectedSystems.some((s) => ['Builder', 'Verification', 'Trust'].includes(s))) {
    factors.push('critical_systems');
    riskScore += 10;
  }
  if (scope.moduleType === 'new_module') {
    riskScore += 10;
    factors.push('new_module_surface');
  }

  riskScore = Math.min(100, Math.round(riskScore));

  let riskLevel: CapabilityRiskAnalysis['riskLevel'] = 'LOW';
  if (riskScore >= 65) riskLevel = 'HIGH';
  else if (riskScore >= 35) riskLevel = 'MEDIUM';

  const analysis: CapabilityRiskAnalysis = { riskScore, riskLevel, factors: [...new Set(factors)] };
  setCachedRisk(cacheKey, analysis);
  return analysis;
}

export function getRiskAnalysisCount(): number {
  return riskAnalysisCount;
}

export function resetRiskAnalyzerForTests(): void {
  riskAnalysisCount = 0;
}
