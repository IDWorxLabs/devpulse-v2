/**
 * Requirement Extractor bridge — requirements remain owned by extractor; architect consumes read-only.
 */

import { getDevPulseV2RequirementExtractorAuthority } from '../requirement-extractor/requirement-extractor-authority.js';
import { EXTRACTOR_OWNER_MODULE } from '../requirement-extractor/types.js';
import type { RequirementExtractionResult } from '../requirement-extractor/types.js';
import { generateArchitectureBlueprint } from './product-architecture-engine.js';
import { buildDuplicateContextFromBridges } from './product-vault-bridge.js';
import type { ArchitectureBlueprint } from './types.js';

export function buildArchitectureFromRequirements(
  extraction: RequirementExtractionResult,
): ArchitectureBlueprint {
  const duplicateContext = buildDuplicateContextFromBridges();
  return generateArchitectureBlueprint(
    {
      requestId: extraction.requestId,
      requirements: extraction.requirements.map((r) => ({
        requirementId: r.requirementId,
        category: r.category,
        value: r.value,
      })),
    },
    duplicateContext,
  );
}

export function getRequirementSummary(extraction: RequirementExtractionResult): string {
  const byCategory = (cat: string) =>
    extraction.requirements.filter((r) => r.category === cat).map((r) => r.value).join(', ');
  return (
    `Requirements for ${extraction.requestId}: ` +
    `FEATURE=[${byCategory('FEATURE')}] PLATFORM=[${byCategory('PLATFORM')}] ` +
    `USER_TYPE=[${byCategory('USER_TYPE')}] count=${extraction.requirements.length}`
  );
}

export function assertRequirementExtractorOwnershipUnchanged(): boolean {
  const extractor = getDevPulseV2RequirementExtractorAuthority();
  return (
    extractor.constructor.name === 'DevPulseV2RequirementExtractorAuthority' &&
    typeof extractor.extractAndStore === 'function' &&
    typeof (extractor as { generateArchitectureBlueprint?: unknown }).generateArchitectureBlueprint ===
      'undefined'
  );
}

export function getRequirementExtractorOwnerForBridge(): string {
  return EXTRACTOR_OWNER_MODULE;
}
