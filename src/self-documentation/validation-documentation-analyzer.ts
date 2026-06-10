/**
 * Self Documentation — validation documentation analyzer.
 */

import type {
  SelfDocumentationInput,
  ValidationDocumentationAnalysis,
} from './self-documentation-types.js';
import { getCachedValidationAnalysis, setCachedValidationAnalysis } from './self-documentation-cache.js';

export interface ValidationDocumentationSnapshot {
  validationScriptCount: number;
  checkpointCount: number;
  uvlRowCount: number;
}

const BASE_CHECKPOINTS = [
  'trust_engine_verification_checkpoint',
  'product_hardening_verification_checkpoint',
] as const;

let validationAnalysisCount = 0;

export function analyzeValidationDocumentation(
  input: SelfDocumentationInput,
  snapshot: ValidationDocumentationSnapshot,
): ValidationDocumentationAnalysis {
  const cacheKey = [
    snapshot.validationScriptCount,
    snapshot.checkpointCount,
    snapshot.uvlRowCount,
    input.missingPassTokens,
    input.missingCheckpointDocs,
    input.missingUvlRegistrationDocs,
    input.missingStressValidationDocs,
    ...(input.undocumentedValidators ?? []),
  ].join('|');

  const cached = getCachedValidationAnalysis(cacheKey);
  if (cached) return cached;

  validationAnalysisCount += 1;
  const validationWarnings: string[] = [];
  const undocumentedValidators: string[] = [];
  let penalty = 0;

  if (input.missingPassTokens === true) {
    validationWarnings.push('missing_pass_tokens');
    penalty += 12;
  }
  if (input.missingCheckpointDocs === true) {
    validationWarnings.push('missing_checkpoint_docs');
    penalty += 10;
  }
  if (input.missingUvlRegistrationDocs === true) {
    validationWarnings.push('missing_uvl_registration_docs');
    penalty += 10;
  }
  if (input.missingStressValidationDocs === true) {
    validationWarnings.push('missing_stress_validation_docs');
    penalty += 8;
  }

  for (const validator of input.undocumentedValidators ?? []) {
    undocumentedValidators.push(validator);
    penalty += 5;
  }

  if (snapshot.validationScriptCount < 10) {
    validationWarnings.push('low_validation_script_count');
    penalty += 8;
  }
  if (snapshot.uvlRowCount < 50) {
    validationWarnings.push('low_uvl_row_count');
    penalty += 6;
  }

  const checkpointDocumented = snapshot.checkpointCount >= BASE_CHECKPOINTS.length;
  if (!checkpointDocumented) {
    validationWarnings.push('incomplete_checkpoint_documentation');
    penalty += 10;
  }

  const scriptScore = Math.min(40, snapshot.validationScriptCount * 2);
  const uvlScore = Math.min(30, Math.round(snapshot.uvlRowCount / 10));
  const checkpointScore = checkpointDocumented ? 20 : 5;
  const baseScore = scriptScore + uvlScore + checkpointScore;
  const validationCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: ValidationDocumentationAnalysis = {
    validationCoverageScore,
    undocumentedValidators,
    validationWarnings,
  };

  setCachedValidationAnalysis(cacheKey, result);
  return result;
}

export function getValidationAnalysisCount(): number {
  return validationAnalysisCount;
}

export function resetValidationDocumentationAnalyzerForTests(): void {
  validationAnalysisCount = 0;
}
