/**
 * Production Validation V1 — public API.
 */

export {
  PRODUCTION_VALIDATION_V1_PASS_TOKEN,
  PRODUCTION_VALIDATION_EVIDENCE_FILENAME,
  type ProductionValidationEvidence,
  type ProductionValidationMatrixRow,
  type ProductionValidationStageResult,
  type ProductionValidationStageStatus,
} from './production-validation-types.js';

export {
  applyProductionValidationToManifest,
  productionValidationFieldsFromEvidence,
  type ProductionValidationManifestFields,
} from './production-validation-manifest.js';

export {
  buildProductionValidationTraceEvents,
  productionValidationTraceTitles,
} from './production-validation-trace-events.js';

export {
  runProductionValidation,
  buildProductionValidationMatrixRow,
  formatProductionValidationMatrix,
  assertProductionValidationAntiRegression,
  type RunProductionValidationInput,
} from './production-validation-runner.js';
