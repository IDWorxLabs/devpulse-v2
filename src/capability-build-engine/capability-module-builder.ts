/**
 * Capability Build Engine — module builder.
 * New capability = new module. No monolith growth.
 */

import type { CapabilityBuildInput, CapabilityBuildType, CapabilityModulePlan } from './capability-build-types.js';
import { getCachedModulePlan, setCachedModulePlan } from './capability-build-cache.js';

let modulesPlanned = 0;

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

export function buildCapabilityModules(
  input: CapabilityBuildInput,
  buildType: CapabilityBuildType,
): CapabilityModulePlan {
  const cacheKey = [input.proposedCapability, buildType].join('|');
  const cached = getCachedModulePlan(cacheKey);
  if (cached) return cached;

  modulesPlanned += 1;

  const slug = slugify(input.proposedCapability);
  const moduleName = `src/${slug}/`;
  const ownerModule = `devpulse_v2_${slug}`;

  const isExtension = buildType === 'MODULE_EXTENSION' || buildType === 'OPTIMIZATION' || buildType === 'DIAGNOSTIC';

  const plan: CapabilityModulePlan = {
    modulesToCreate: isExtension ? [] : [moduleName],
    modulesToExtend: isExtension ? [moduleName] : [],
    ownershipBoundaries: [ownerModule, 'single_owner_per_domain', 'extension_only_when_applicable'],
    requiredExports: [
      'index.ts',
      `${slug}.ts`,
      `${slug}-types.ts`,
      'reset*ModuleForTests',
    ],
    monolithAvoidance: true,
  };

  if (buildType === 'INTEGRATION') {
    plan.modulesToExtend = ['src/foundation/', 'src/intelligence-console/'];
    plan.modulesToCreate = [];
  }

  setCachedModulePlan(cacheKey, plan);
  return plan;
}

export function getModulesPlannedCount(): number {
  return modulesPlanned;
}

export function resetModuleBuilderForTests(): void {
  modulesPlanned = 0;
}
