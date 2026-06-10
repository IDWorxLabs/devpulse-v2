/**
 * Capability Build Engine — build risk analyzer.
 */

import type {
  CapabilityBuildInput,
  CapabilityBuildRiskAnalysis,
  CapabilityIntegrationPlan,
  CapabilityModulePlan,
} from './capability-build-types.js';

export function analyzeCapabilityBuildRisk(
  input: CapabilityBuildInput,
  modules: CapabilityModulePlan,
  integrations: CapabilityIntegrationPlan,
): CapabilityBuildRiskAnalysis {
  const factors: string[] = [];
  let riskScore = 10;

  const integrationCount = integrations.upstreamIntegrations.length
    + integrations.downstreamIntegrations.length
    + integrations.registryIntegrations.length
    + integrations.uvlIntegrations.length
    + integrations.findPanelIntegrations.length;

  riskScore += integrationCount * 4;
  if (integrationCount >= 8) factors.push('high_integration_count');

  if (modules.modulesToCreate.length > 0) {
    riskScore += 15;
    factors.push('new_module_surface');
  }

  if (input.trustImpact) {
    riskScore += 20;
    factors.push('trust_impact');
  }
  if (input.world2Impact) {
    riskScore += 20;
    factors.push('world2_impact');
  }

  riskScore += integrations.downstreamIntegrations.length * 5;
  if (integrations.downstreamIntegrations.length >= 2) factors.push('blast_radius');

  if (modules.modulesToCreate.length === 0 && modules.modulesToExtend.length > 0) {
    riskScore = Math.max(10, riskScore - 20);
  }

  riskScore = Math.min(100, Math.round(riskScore));

  let riskLevel: CapabilityBuildRiskAnalysis['riskLevel'] = 'LOW';
  if (riskScore >= 65) riskLevel = 'HIGH';
  else if (riskScore >= 35) riskLevel = 'MEDIUM';

  return { riskScore, riskLevel, factors: [...new Set(factors)] };
}

export function resetBuildRiskAnalyzerForTests(): void {
  // stateless
}
