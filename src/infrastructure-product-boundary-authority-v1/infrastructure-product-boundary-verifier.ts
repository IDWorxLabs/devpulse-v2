/**
 * Infrastructure vs Product Boundary Authority V1 — Phase 5 boundary verification.
 *
 * Given the real set of files a build actually generated (never a guessed/fixed list), classifies
 * every one of them and produces the aggregate audit GPCA's gate consults. Mixed/unknown files are
 * never silently allowed — they are always reported as violating paths, exactly as Phase 5 requires
 * ("Mixed files must be decomposed or rejected... Unknown files must fail").
 */

import { classifyBoundaryFile } from './infrastructure-product-boundary-classifier.js';
import type { BoundaryFileInput, InfrastructureProductBoundaryAudit } from './infrastructure-product-boundary-types.js';

export function runInfrastructureProductBoundaryVerification(
  files: readonly BoundaryFileInput[],
  contractVocabulary: readonly string[],
): InfrastructureProductBoundaryAudit {
  const results = files.map((file) => classifyBoundaryFile(file, contractVocabulary));

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    results,
    infrastructureCount: results.filter((r) => r.classification === 'INFRASTRUCTURE').length,
    productCount: results.filter((r) => r.classification === 'PRODUCT').length,
    mixedCount: results.filter((r) => r.classification === 'MIXED').length,
    unknownCount: results.filter((r) => r.classification === 'UNKNOWN').length,
    safeInfrastructurePaths: results.filter((r) => r.safeAsInfrastructure).map((r) => r.path),
    violatingPaths: results.filter((r) => r.classification === 'MIXED' || r.classification === 'UNKNOWN').map((r) => r.path),
  };
}

/**
 * The single lookup GPCA's gate is allowed to consult: is this exact generated file, by its own
 * real, current content, classified as pure hosting infrastructure? `undefined`/`null` audits (no
 * boundary evidence supplied) always resolve to `false` — the gate falls back to its original,
 * unmodified presence-based strictness whenever this authority has nothing to say.
 */
export function isPathSafeInfrastructure(
  audit: InfrastructureProductBoundaryAudit | null | undefined,
  path: string,
): boolean {
  if (!audit) return false;
  return audit.safeInfrastructurePaths.includes(path);
}
