/**
 * Founder Trust Validation — public exports.
 */

import { resetFounderTrustRegistryForTests } from './founder-trust-registry.js';
import { resetFounderTrustCacheForTests } from './founder-trust-cache.js';
import { resetTrustGapCounterForTests } from './trust-gap-model.js';
import { resetTrustContextBuilderForTests } from './trust-context-builder.js';
import { resetTruthfulnessValidatorForTests } from './truthfulness-validator.js';
import { resetTransparencyValidatorForTests } from './transparency-validator.js';
import { resetVerificationIntegrityValidatorForTests } from './verification-integrity-validator.js';
import { resetGovernanceComplianceValidatorForTests } from './governance-compliance-validator.js';
import { resetExecutionPredictabilityValidatorForTests } from './execution-predictability-validator.js';
import { resetEvidenceVisibilityValidatorForTests } from './evidence-visibility-validator.js';
import { resetRollbackConfidenceValidatorForTests } from './rollback-confidence-validator.js';
import { resetSafetyBoundaryValidatorForTests } from './safety-boundary-validator.js';
import { resetTrustGapAnalyzerForTests } from './trust-gap-analyzer.js';
import { resetTrustRoadmapBuilderForTests } from './trust-roadmap-builder.js';
import { resetFounderTrustAuthorityBuilderForTests } from './founder-trust-authority-builder.js';
import { resetFounderTrustEvaluatorForTests } from './founder-trust-evaluator.js';
import { resetFounderTrustHistoryForTests } from './bounded-history.js';
import { resetFounderTrustReportBuilderForTests } from './founder-trust-report-builder.js';
import { resetFounderTrustValidationOrchestrationForTests } from './founder-trust-validation.js';

export {
  FOUNDER_TRUST_VALIDATION_PASS_TOKEN,
  FOUNDER_TRUST_VALIDATION_PASS,
  FOUNDER_TRUST_OWNER_MODULE,
  DEFAULT_MAX_FOUNDER_TRUST_HISTORY_SIZE,
  MAX_TRUST_GAPS,
  TRUST_CONTEXT_PASS,
  TRUTHFULNESS_TRUST_PASS,
  TRANSPARENCY_TRUST_PASS,
  VERIFICATION_TRUST_PASS,
  GOVERNANCE_TRUST_PASS,
  EXECUTION_TRUST_PASS,
  EVIDENCE_TRUST_PASS,
  ROLLBACK_TRUST_PASS,
  SAFETY_TRUST_PASS,
  TRUST_GAP_ANALYSIS_PASS,
  TRUST_ROADMAP_PASS,
  FOUNDER_TRUST_REPORTING_PASS,
  FOUNDER_TRUST_QUESTION_SIGNALS,
  isFounderTrustQuestion,
  resolveFounderTrustResult,
  clampScore,
} from './founder-trust-types.js';

export type {
  FounderTrustResult,
  TrustGapSeverity,
  TrustContextId,
  TrustContext,
  TrustGap,
  TrustValidatorResult,
  TruthfulnessValidation,
  TransparencyValidation,
  VerificationIntegrityValidation,
  GovernanceComplianceValidation,
  ExecutionPredictabilityValidation,
  EvidenceVisibilityValidation,
  RollbackConfidenceValidation,
  SafetyBoundaryValidation,
  TrustGapAnalysis,
  FounderTrustRoadmap,
  FounderTrustAuthority,
  FounderTrustScore,
  FounderTrustRecord,
  FounderTrustEvaluation,
  FounderTrustReport,
  FounderTrustValidationInput,
  FounderTrustResultBundle,
  FounderTrustRuntimeReport,
} from './founder-trust-types.js';

export {
  createTrustGap,
  boundGaps,
  mergeBoundedGaps,
  countCriticalGaps,
  MAX_GAPS_PER_VALIDATOR,
  resetTrustGapCounterForTests,
} from './trust-gap-model.js';

export { getFounderTrustCacheStats, resetFounderTrustCacheForTests } from './founder-trust-cache.js';

export {
  registerFounderTrustRecord,
  getFounderTrustRecord,
  lookupFounderTrustByProjectId,
  listFounderTrustRecords,
  getFounderTrustRecordCount,
  resetFounderTrustRegistryForTests,
} from './founder-trust-registry.js';

export {
  buildTrustContext,
  buildAllTrustContexts,
  listTrustContextIds,
  getContextBuildCount,
  resetTrustContextBuilderForTests,
} from './trust-context-builder.js';

export {
  validateTruthfulness,
  getTruthfulnessValidateCount,
  resetTruthfulnessValidatorForTests,
} from './truthfulness-validator.js';
export type { TruthfulnessUpstream } from './truthfulness-validator.js';

export {
  validateTransparency,
  getTransparencyValidateCount,
  resetTransparencyValidatorForTests,
} from './transparency-validator.js';
export type { TransparencyUpstream } from './transparency-validator.js';

export {
  validateVerificationIntegrity,
  getVerificationValidateCount,
  resetVerificationIntegrityValidatorForTests,
} from './verification-integrity-validator.js';
export type { VerificationIntegrityUpstream } from './verification-integrity-validator.js';

export {
  validateGovernanceCompliance,
  getGovernanceValidateCount,
  resetGovernanceComplianceValidatorForTests,
} from './governance-compliance-validator.js';
export type { GovernanceComplianceUpstream } from './governance-compliance-validator.js';

export {
  validateExecutionPredictability,
  getExecutionValidateCount,
  resetExecutionPredictabilityValidatorForTests,
} from './execution-predictability-validator.js';
export type { ExecutionPredictabilityUpstream } from './execution-predictability-validator.js';

export {
  validateEvidenceVisibility,
  getEvidenceValidateCount,
  resetEvidenceVisibilityValidatorForTests,
} from './evidence-visibility-validator.js';
export type { EvidenceVisibilityUpstream } from './evidence-visibility-validator.js';

export {
  validateRollbackConfidence,
  getRollbackValidateCount,
  resetRollbackConfidenceValidatorForTests,
} from './rollback-confidence-validator.js';
export type { RollbackConfidenceUpstream } from './rollback-confidence-validator.js';

export {
  validateSafetyBoundaries,
  getSafetyValidateCount,
  resetSafetyBoundaryValidatorForTests,
} from './safety-boundary-validator.js';
export type { SafetyBoundaryUpstream } from './safety-boundary-validator.js';

export {
  analyzeTrustGaps,
  getGapAnalysisCount,
  resetTrustGapAnalyzerForTests,
} from './trust-gap-analyzer.js';

export {
  buildFounderTrustRoadmap,
  getRoadmapBuildCount,
  resetTrustRoadmapBuilderForTests,
} from './trust-roadmap-builder.js';

export {
  buildFounderTrustAuthority,
  getAuthorityBuildCount,
  resetFounderTrustAuthorityBuilderForTests,
} from './founder-trust-authority-builder.js';

export {
  buildFounderTrustScore,
  evaluateFounderTrust,
  getEvaluationCount,
  resetFounderTrustEvaluatorForTests,
} from './founder-trust-evaluator.js';

export {
  recordFounderTrustHistory,
  getFounderTrustHistory,
  getFounderTrustHistorySize,
  clearFounderTrustHistory,
  resetFounderTrustHistoryForTests,
} from './bounded-history.js';

export {
  generateFounderTrustReport,
  getReportCount,
  resetFounderTrustReportBuilderForTests,
} from './founder-trust-report-builder.js';

export {
  getDevPulseV2FounderTrustValidation,
  registerFounderTrustValidationWithSurface,
  registerFounderTrustValidationWithFoundation,
  registerFounderTrustValidationWithCapabilityRegistry,
  registerFounderTrustValidationWithFindPanel,
  registerFounderTrustValidationWithUvl,
  registerFounderTrustValidationWithAcceptanceChain,
  evaluateFounderTrustValidation,
  getFounderTrustValidationRuntimeReport,
} from './founder-trust-validation.js';

export type { FounderTrustSurfaceSnapshot } from './founder-trust-validation.js';

export function resetFounderTrustValidationForTests(): void {
  resetFounderTrustRegistryForTests();
  resetFounderTrustCacheForTests();
  resetTrustGapCounterForTests();
  resetTrustContextBuilderForTests();
  resetTruthfulnessValidatorForTests();
  resetTransparencyValidatorForTests();
  resetVerificationIntegrityValidatorForTests();
  resetGovernanceComplianceValidatorForTests();
  resetExecutionPredictabilityValidatorForTests();
  resetEvidenceVisibilityValidatorForTests();
  resetRollbackConfidenceValidatorForTests();
  resetSafetyBoundaryValidatorForTests();
  resetTrustGapAnalyzerForTests();
  resetTrustRoadmapBuilderForTests();
  resetFounderTrustAuthorityBuilderForTests();
  resetFounderTrustEvaluatorForTests();
  resetFounderTrustHistoryForTests();
  resetFounderTrustReportBuilderForTests();
  resetFounderTrustValidationOrchestrationForTests();
}
