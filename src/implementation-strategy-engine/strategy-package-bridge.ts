/**
 * Build Package Generator bridge — generator remains package owner; strategy engine consumes read-only.
 */

import { getDevPulseV2BuildPackageGeneratorAuthority } from '../build-package-generator/build-package-generator-authority.js';
import { GENERATOR_OWNER_MODULE } from '../build-package-generator/types.js';
import type { BuildPackageGenerationResult } from '../build-package-generator/types.js';
import { generateImplementationStrategy } from './implementation-strategy-engine.js';
import { buildStrategyDuplicateContextFromBridges } from './strategy-vault-bridge.js';
import type { ImplementationStrategy } from './types.js';

export function generateStrategyFromPackages(
  generation: BuildPackageGenerationResult,
): ImplementationStrategy {
  const context = buildStrategyDuplicateContextFromBridges(generation);
  return generateImplementationStrategy(generation, context);
}

export function getPackageSummary(generation: BuildPackageGenerationResult): string {
  const modules = generation.packages.flatMap((p) => p.modules).join(', ');
  return (
    `Packages ${generation.generationId}: count=${generation.packageCount} ` +
    `modules=[${modules}]`
  );
}

export function assertBuildPackageGeneratorOwnershipUnchanged(): boolean {
  const generator = getDevPulseV2BuildPackageGeneratorAuthority();
  return (
    generator.constructor.name === 'DevPulseV2BuildPackageGeneratorAuthority' &&
    typeof generator.generateAndStore === 'function' &&
    typeof (generator as { generateImplementationStrategy?: unknown }).generateImplementationStrategy ===
      'undefined'
  );
}

export function getBuildPackageGeneratorOwnerForBridge(): string {
  return GENERATOR_OWNER_MODULE;
}
