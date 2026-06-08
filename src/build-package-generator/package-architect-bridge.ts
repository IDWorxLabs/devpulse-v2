/**
 * Product Architect bridge — architect remains blueprint owner; generator consumes read-only.
 */

import { getDevPulseV2ProductArchitectAuthority } from '../product-architect/product-architect-authority.js';
import { ARCHITECT_OWNER_MODULE } from '../product-architect/types.js';
import type { ArchitectureBlueprint } from '../product-architect/types.js';
import { generateBuildPackages } from './build-package-engine.js';
import { buildPackageDuplicateContextFromBridges } from './package-vault-bridge.js';
import type { BuildPackageGenerationResult } from './types.js';

export function generatePackagesFromBlueprint(
  blueprint: ArchitectureBlueprint,
): BuildPackageGenerationResult {
  const context = buildPackageDuplicateContextFromBridges(blueprint);
  return generateBuildPackages(blueprint, context);
}

export function getBlueprintSummary(blueprint: ArchitectureBlueprint): string {
  const byType = (type: string) =>
    blueprint.components.filter((c) => c.type === type).map((c) => c.name).join(', ');
  return (
    `Blueprint ${blueprint.blueprintId}: request=${blueprint.requestId} ` +
    `MODULE=[${byType('MODULE')}] INTEGRATION=[${byType('INTEGRATION')}] ` +
    `components=${blueprint.components.length}`
  );
}

export function assertProductArchitectOwnershipUnchanged(): boolean {
  const architect = getDevPulseV2ProductArchitectAuthority();
  return (
    architect.constructor.name === 'DevPulseV2ProductArchitectAuthority' &&
    typeof architect.generateFromRequirements === 'function' &&
    typeof (architect as { generateBuildPackages?: unknown }).generateBuildPackages === 'undefined'
  );
}

export function getProductArchitectOwnerForBridge(): string {
  return ARCHITECT_OWNER_MODULE;
}
