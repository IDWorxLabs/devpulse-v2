/**
 * Capability Verification Engine — public exports.
 */

import { resetCapabilityVerificationRegistryForTests } from './capability-verification-registry.js';
import { resetCapabilityVerificationCacheForTests } from './capability-verification-cache.js';
import { resetRequirementValidatorForTests } from './capability-requirement-validator.js';
import { resetDuplicateValidatorForTests } from './capability-duplicate-validator.js';
import { resetRiskValidatorForTests } from './capability-risk-validator.js';
import { resetRolloutValidatorForTests } from './capability-rollout-validator.js';
import { resetTrustValidatorForTests } from './capability-trust-validator.js';
import { resetReadinessEvaluatorForTests } from './capability-readiness-evaluator.js';
import { resetVerificationDecisionEngineForTests } from './capability-verification-decision-engine.js';
import { resetCapabilityVerificationHistoryForTests } from './capability-verification-history.js';
import { resetCapabilityVerificationReportCounterForTests } from './capability-verification-reporting.js';
import { resetCapabilityVerificationEngineForTests } from './capability-verification-engine.js';
import { resetCapabilityBuildEngineModuleForTests } from '../capability-build-engine/index.js';

export {
  CAPABILITY_VERIFICATION_ENGINE_PASS_TOKEN,
  CAPABILITY_VERIFICATION_ENGINE_OWNER_MODULE,
  DEFAULT_MAX_VERIFICATION_HISTORY_SIZE,
  VERIFICATION_QUESTION_SIGNALS,
  isCapabilityVerificationQuestion,
} from './capability-verification-types.js';

export type {
  CapabilityVerificationDecision,
  CapabilityRiskLevel,
  CapabilityReadinessState,
  CapabilityVerificationRecord,
  CapabilityVerificationInput,
  CapabilityRequirementValidation,
  CapabilityDuplicateValidation,
  CapabilityRiskValidation,
  CapabilityRolloutValidation,
  CapabilityTrustValidation,
  CapabilityStallProtectionValidation,
  CapabilityReadinessEvaluation,
  CapabilityVerificationReport,
  CapabilityVerificationHistoryEntry,
  CapabilityVerificationRuntimeReport,
  CapabilityVerificationResult,
} from './capability-verification-types.js';

export {
  registerCapabilityVerification,
  getCapabilityVerification,
  listCapabilityVerifications,
  listCapabilityVerificationsByDecision,
  getCapabilityVerificationCount,
  resetCapabilityVerificationRegistryForTests,
} from './capability-verification-registry.js';

export { validateCapabilityRequirements, getRequirementValidationCount, resetRequirementValidatorForTests } from './capability-requirement-validator.js';
export { validateCapabilityDuplicates, getDuplicateCheckCount, resetDuplicateValidatorForTests } from './capability-duplicate-validator.js';
export { validateCapabilityRisk, getRiskValidationCount, resetRiskValidatorForTests } from './capability-risk-validator.js';
export { validateCapabilityRollout, getRolloutValidationCount, resetRolloutValidatorForTests } from './capability-rollout-validator.js';
export { validateCapabilityTrust, getTrustValidationCount, resetTrustValidatorForTests } from './capability-trust-validator.js';
export {
  validateCapabilityStallProtection,
  evaluateCapabilityReadiness,
  getReadinessEvaluationCount,
  resetReadinessEvaluatorForTests,
} from './capability-readiness-evaluator.js';
export { buildCapabilityVerificationDecision, getVerificationDecisionCount, resetVerificationDecisionEngineForTests } from './capability-verification-decision-engine.js';
export {
  recordCapabilityVerificationHistory,
  getCapabilityVerificationHistory,
  getCapabilityVerificationHistorySize,
  resetCapabilityVerificationHistoryForTests,
} from './capability-verification-history.js';
export { generateCapabilityVerificationReport, resetCapabilityVerificationReportCounterForTests } from './capability-verification-reporting.js';
export { getCapabilityVerificationCacheStats, resetCapabilityVerificationCacheForTests } from './capability-verification-cache.js';

export {
  getDevPulseV2CapabilityVerificationEngine,
  registerCapabilityVerificationEngineWithCentralBrain,
  registerCapabilityVerificationEngineWithProjectVault,
  registerCapabilityVerificationEngineWithTrustEngine,
  registerCapabilityVerificationEngineWithMissingCapabilityEscalation,
  registerCapabilityVerificationEngineWithCapabilityResearchEngine,
  registerCapabilityVerificationEngineWithCapabilityPlanningEngine,
  registerCapabilityVerificationEngineWithCapabilityBuildEngine,
  registerCapabilityVerificationEngineWithAutonomousVerification,
  registerCapabilityVerificationEngineWithCompletionEngine,
  registerCapabilityVerificationEngineWithMultiProjectMonitoring,
  registerCapabilityVerificationEngineWithUvl,
  evaluateCapabilityVerification,
  getCapabilityVerificationEngineRuntimeReport,
  resetCapabilityVerificationEngineForTests,
} from './capability-verification-engine.js';

export type { CapabilityVerificationEngineSystemSnapshot } from './capability-verification-engine.js';

export function resetCapabilityVerificationEngineModuleForTests(): void {
  resetCapabilityVerificationRegistryForTests();
  resetCapabilityVerificationCacheForTests();
  resetRequirementValidatorForTests();
  resetDuplicateValidatorForTests();
  resetRiskValidatorForTests();
  resetRolloutValidatorForTests();
  resetTrustValidatorForTests();
  resetReadinessEvaluatorForTests();
  resetVerificationDecisionEngineForTests();
  resetCapabilityVerificationHistoryForTests();
  resetCapabilityVerificationReportCounterForTests();
  resetCapabilityVerificationEngineForTests();
  resetCapabilityBuildEngineModuleForTests();
}
