/**
 * Production Validation V1 — runtime execution proof types.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import type { MaterializationProfile } from '../universal-prompt-to-app-materialization/profile-feature-map.js';

export const PRODUCTION_VALIDATION_V1_PASS_TOKEN = 'PRODUCTION_VALIDATION_V1_PASS';

export const PRODUCTION_VALIDATION_EVIDENCE_FILENAME = '.production-validation-evidence.json';

export type ProductionValidationStageStatus = 'PASS' | 'FAIL' | 'SKIP';

export interface ProductionValidationStageResult {
  readOnly: true;
  stage: string;
  status: ProductionValidationStageStatus;
  detail: string;
  durationMs: number;
}

export interface ProductionValidationEvidence {
  readOnly: true;
  profileId: GeneratedAppProfile | MaterializationProfile;
  prompt: string;
  workspaceDir: string;
  generatedFilesCount: number;
  generatedFeatureModulesCount: number;
  generateStatus: ProductionValidationStageStatus;
  installStatus: ProductionValidationStageStatus;
  buildStatus: ProductionValidationStageStatus;
  previewStatus: ProductionValidationStageStatus;
  previewUrl: string | null;
  previewHtmlStatus: ProductionValidationStageStatus;
  blueprintValidationStatus: ProductionValidationStageStatus;
  featureContractValidationStatus: ProductionValidationStageStatus;
  promptAlignmentStatus: ProductionValidationStageStatus;
  generatedUiValidationStatus: ProductionValidationStageStatus;
  modularRoutesVerified: boolean;
  profileSpecificUiVerified: boolean;
  previewVerified: boolean;
  productionValidationStatus: 'PASS' | 'FAIL';
  durationMs: number;
  failureReasons: string[];
  artifactPaths: string[];
  cleanupStatus: ProductionValidationStageStatus;
  stages: ProductionValidationStageResult[];
  validatedAt: string;
}

export interface ProductionValidationMatrixRow {
  readOnly: true;
  profile: string;
  generate: ProductionValidationStageStatus;
  install: ProductionValidationStageStatus;
  build: ProductionValidationStageStatus;
  preview: ProductionValidationStageStatus;
  blueprint: ProductionValidationStageStatus;
  features: ProductionValidationStageStatus;
  prompt: ProductionValidationStageStatus;
  ui: ProductionValidationStageStatus;
  verdict: 'PASS' | 'FAIL';
}
