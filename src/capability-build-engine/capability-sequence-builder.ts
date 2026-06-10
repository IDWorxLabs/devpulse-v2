/**
 * Capability Build Engine — build sequence builder.
 */

import type { CapabilityBuildInput, CapabilityIntegrationPlan, CapabilityModulePlan, CapabilitySequencePlan } from './capability-build-types.js';
import { getCachedSequencePlan, setCachedSequencePlan } from './capability-build-cache.js';

const BASE_SEQUENCE: string[] = [
  'foundations',
  'registries',
  'core_engine',
  'integrations',
  'validation',
  'reporting',
];

export function buildCapabilitySequence(
  input: CapabilityBuildInput,
  modules: CapabilityModulePlan,
  integrations: CapabilityIntegrationPlan,
): CapabilitySequencePlan {
  const cacheKey = [
    input.proposedCapability,
    modules.modulesToCreate.length,
    modules.modulesToExtend.length,
    integrations.registryIntegrations.length,
  ].join('|');

  const cached = getCachedSequencePlan(cacheKey);
  if (cached) return cached;

  const orderedSequence = [...BASE_SEQUENCE];

  if (modules.modulesToCreate.length > 0) {
    orderedSequence.splice(2, 0, 'module_scaffold');
  }
  if (integrations.uvlIntegrations.length > 0) {
    const idx = orderedSequence.indexOf('integrations');
    if (idx >= 0) orderedSequence.splice(idx + 1, 0, 'uvl_registration');
  }
  if (integrations.findPanelIntegrations.length > 0) {
    const idx = orderedSequence.indexOf('integrations');
    if (idx >= 0) orderedSequence.splice(idx + 1, 0, 'find_panel_registration');
  }

  const plan: CapabilitySequencePlan = { orderedSequence: [...new Set(orderedSequence)] };
  setCachedSequencePlan(cacheKey, plan);
  return plan;
}

export function resetSequenceBuilderForTests(): void {
  // stateless
}
