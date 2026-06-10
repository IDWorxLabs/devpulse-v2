/**
 * Capability Planning Engine — dependency planner.
 */

import type { CapabilityDependencyPlan, CapabilityPlanningInput, CapabilityScopePlan } from './capability-planning-types.js';
import { getCachedDependency, setCachedDependency } from './capability-planning-cache.js';

let dependencyAnalysisCount = 0;

const KNOWN_SYSTEMS = [
  'foundation',
  'capability_registry',
  'find_panel',
  'uvl',
  'missing_capability_escalation',
  'capability_research_engine',
  'autonomous_builder',
  'autonomous_verification',
  'autonomous_completion_engine',
  'multi_project_monitoring',
  'trust_engine',
  'world2_coordinator',
];

export function planCapabilityDependencies(
  input: CapabilityPlanningInput,
  scope: CapabilityScopePlan,
): CapabilityDependencyPlan {
  const cacheKey = [input.proposedCapability, scope.moduleType, ...scope.integrationPoints].join('|');

  const cached = getCachedDependency(cacheKey);
  if (cached) return cached;

  dependencyAnalysisCount += 1;

  const requiredSystems = ['foundation', 'capability_registry', 'uvl', 'find_panel'];
  const requiredIntegrations = [...scope.integrationPoints];

  if (input.researchDecision === 'NEW_CAPABILITY_REQUIRED' || scope.moduleType === 'new_module') {
    requiredSystems.push('missing_capability_escalation', 'capability_research_engine');
  }
  if (scope.integrationPoints.includes('autonomous_builder')) {
    requiredSystems.push('autonomous_builder');
  }
  if (scope.integrationPoints.includes('unified_verification_lab')) {
    requiredSystems.push('autonomous_verification');
  }
  if (scope.integrationPoints.includes('multi_project_monitoring')) {
    requiredSystems.push('multi_project_monitoring');
  }
  if (input.trustImpact) requiredSystems.push('trust_engine');
  if (input.world2Impact) requiredSystems.push('world2_coordinator');

  const extraRequired = (input.signals ?? [])
    .filter((s) => s.startsWith('requires:'))
    .map((s) => s.slice('requires:'.length));
  for (const sys of extraRequired) {
    requiredSystems.push(sys);
  }

  const uniqueRequired = [...new Set(requiredSystems)];
  const missingDependencies = uniqueRequired.filter((s) => !KNOWN_SYSTEMS.includes(s));

  const dependencyOrder = [
    'foundation',
    'capability_registry',
    'missing_capability_escalation',
    'capability_research_engine',
    ...uniqueRequired.filter((s) => !['foundation', 'capability_registry', 'missing_capability_escalation', 'capability_research_engine'].includes(s)),
    'uvl',
    'find_panel',
  ].filter((s, i, arr) => arr.indexOf(s) === i && uniqueRequired.includes(s) || ['uvl', 'find_panel'].includes(s));

  const cycleDetected = input.signals?.includes('cycle:research->planning->research') ?? false;
  const unsafeDependency = cycleDetected
    || (input.world2Impact === true && input.researchDecision === 'RESEARCH_INCONCLUSIVE');

  const plan: CapabilityDependencyPlan = {
    requiredSystems: uniqueRequired,
    requiredIntegrations,
    missingDependencies,
    dependencyOrder,
    cycleDetected,
    unsafeDependency,
  };

  setCachedDependency(cacheKey, plan);
  return plan;
}

export function getDependencyAnalysisCount(): number {
  return dependencyAnalysisCount;
}

export function resetDependencyPlannerForTests(): void {
  dependencyAnalysisCount = 0;
}
