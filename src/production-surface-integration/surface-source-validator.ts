/** Validates every production surface declares exactly one canonical source. */
import { PRODUCTION_SURFACE_REGISTRY } from './surface-registry.js';
import type { ProductionSurfaceDeclaration } from './production-surface-types.js';

export function validateSurfaceSingleCanonicalSource(entry: ProductionSurfaceDeclaration): string[] {
  const errors: string[] = [];
  if (!entry.canonicalSource) errors.push(`${entry.surfaceId}: missing canonicalSource`);
  if (entry.allowedInputs.length === 0) errors.push(`${entry.surfaceId}: no allowedInputs`);
  if (entry.allowedInputs.length > 2) errors.push(`${entry.surfaceId}: multiple canonical sources`);
  const normalize = (value: string) => value.replace(/^(Current|Canonical) /, '').trim();
  const canonicalMatchesAllowed = entry.allowedInputs.some((input) => {
    const normalizedInput = normalize(input);
    const normalizedCanonical = normalize(entry.canonicalSource);
    return (
      normalizedInput === normalizedCanonical ||
      normalizedCanonical.startsWith(`${normalizedInput}.`) ||
      normalizedInput.startsWith(`${normalizedCanonical}.`)
    );
  });
  if (!canonicalMatchesAllowed) {
    errors.push(`${entry.surfaceId}: canonicalSource not in allowedInputs`);
  }
  return errors;
}

export function validateAllProductionSurfaces(): string[] {
  return PRODUCTION_SURFACE_REGISTRY.flatMap((entry) => validateSurfaceSingleCanonicalSource(entry));
}

export function surfaceRegistryOwnsEveryProductionSurface(requiredSurfaceIds: readonly string[]): string[] {
  const registered = new Set(PRODUCTION_SURFACE_REGISTRY.map((entry) => entry.surfaceId));
  return requiredSurfaceIds.filter((surfaceId) => !registered.has(surfaceId));
}
