/**
 * Production Validation V1 — manifest integration.
 */

import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { ProductionValidationEvidence, ProductionValidationStageResult } from './production-validation-types.js';

export interface ProductionValidationManifestFields {
  productionValidationStatus: 'PASS' | 'FAIL' | 'PENDING';
  productionValidationProfile: string | null;
  productionValidationStages: ProductionValidationStageResult[];
  previewVerified: boolean;
  previewUrl: string | null;
  previewHtmlStatus: 'PASS' | 'FAIL' | 'PENDING';
  profileSpecificUiVerified: boolean;
  modularRoutesVerified: boolean;
  productionValidationDurationMs: number;
  productionValidationFailureReasons: string[];
}

export function productionValidationFieldsFromEvidence(
  evidence: ProductionValidationEvidence,
): ProductionValidationManifestFields {
  return {
    productionValidationStatus: evidence.productionValidationStatus,
    productionValidationProfile: evidence.profileId,
    productionValidationStages: evidence.stages,
    previewVerified: evidence.previewVerified,
    previewUrl: evidence.previewUrl,
    previewHtmlStatus:
      evidence.previewHtmlStatus === 'PASS'
        ? 'PASS'
        : evidence.previewHtmlStatus === 'FAIL'
          ? 'FAIL'
          : 'PENDING',
    profileSpecificUiVerified: evidence.profileSpecificUiVerified,
    modularRoutesVerified: evidence.modularRoutesVerified,
    productionValidationDurationMs: evidence.durationMs,
    productionValidationFailureReasons: evidence.failureReasons,
  };
}

export function applyProductionValidationToManifest(
  manifest: GeneratedAppManifest,
  evidence: ProductionValidationEvidence,
): GeneratedAppManifest {
  const fields = productionValidationFieldsFromEvidence(evidence);
  return {
    ...manifest,
    ...fields,
    previewUrl: evidence.previewUrl ?? manifest.previewUrl ?? null,
    previewDurationMs: evidence.stages.find((s) => s.stage === 'preview')?.durationMs ?? manifest.previewDurationMs,
    validationStatus: evidence.productionValidationStatus === 'PASS' ? 'PASS' : manifest.validationStatus,
    warnings:
      evidence.productionValidationStatus === 'FAIL'
        ? [...manifest.warnings, ...evidence.failureReasons.slice(0, 5)]
        : manifest.warnings,
    completedAt: manifest.completedAt ?? evidence.validatedAt,
    status: evidence.productionValidationStatus === 'PASS' ? manifest.status : manifest.status,
  };
}
