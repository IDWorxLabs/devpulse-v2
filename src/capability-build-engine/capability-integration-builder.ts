/**
 * Capability Build Engine — integration builder.
 */

import type { CapabilityBuildInput, CapabilityIntegrationPlan } from './capability-build-types.js';
import { getCachedIntegrationPlan, setCachedIntegrationPlan } from './capability-build-cache.js';

let integrationsPlanned = 0;

export function buildCapabilityIntegrations(input: CapabilityBuildInput): CapabilityIntegrationPlan {
  const cacheKey = input.proposedCapability.toLowerCase();
  const cached = getCachedIntegrationPlan(cacheKey);
  if (cached) return cached;

  integrationsPlanned += 1;

  const proposed = input.proposedCapability.toLowerCase();

  const upstreamIntegrations = [
    'missing_capability_escalation',
    'capability_research_engine',
    'capability_planning_engine',
  ];

  const downstreamIntegrations: string[] = [];
  if (proposed.includes('monitor')) downstreamIntegrations.push('multi_project_monitoring');
  if (proposed.includes('verif')) downstreamIntegrations.push('autonomous_verification');
  if (proposed.includes('build') || proposed.includes('builder')) downstreamIntegrations.push('autonomous_builder');
  if (proposed.includes('complet')) downstreamIntegrations.push('autonomous_completion_engine');

  const registryIntegrations = [
    'foundation_ownership_registry',
    'capability_registry',
  ];

  const uvlIntegrations = ['uvl_row_registry', 'uvl_panel_registry'];
  const findPanelIntegrations = ['find_panel_alias_registry'];

  const plan: CapabilityIntegrationPlan = {
    upstreamIntegrations,
    downstreamIntegrations: [...new Set(downstreamIntegrations)],
    registryIntegrations,
    uvlIntegrations,
    findPanelIntegrations,
  };

  if (input.trustImpact) {
    plan.upstreamIntegrations.push('trust_engine');
  }
  if (input.world2Impact) {
    plan.downstreamIntegrations.push('world2_coordinator');
  }

  setCachedIntegrationPlan(cacheKey, plan);
  return plan;
}

export function getIntegrationsPlannedCount(): number {
  return integrationsPlanned;
}

export function resetIntegrationBuilderForTests(): void {
  integrationsPlanned = 0;
}
