/**
 * Self Evolution Governance — public exports.
 */

import { resetGovernanceRegistryForTests } from './self-evolution-governance-registry.js';
import { resetGovernanceCacheForTests } from './governance-cache.js';
import { resetBoundaryValidatorForTests } from './governance-boundary-validator.js';
import { resetRiskEvaluatorForTests } from './governance-risk-evaluator.js';
import { resetTrustEvaluatorForTests } from './governance-trust-evaluator.js';
import { resetApprovalEvaluatorForTests } from './governance-approval-evaluator.js';
import { resetRollbackValidatorForTests } from './governance-rollback-validator.js';
import { resetReadinessEvaluatorForTests } from './governance-readiness-evaluator.js';
import { resetGovernanceDecisionEngineForTests } from './governance-decision-engine.js';
import { resetGovernanceHistoryForTests } from './governance-history.js';
import { resetGovernanceReportCounterForTests } from './governance-reporting.js';
import { resetSelfEvolutionGovernanceForTests } from './self-evolution-governance.js';
import { resetCapabilityVerificationEngineModuleForTests } from '../capability-verification-engine/index.js';

export {
  SELF_EVOLUTION_GOVERNANCE_PASS_TOKEN,
  SELF_EVOLUTION_GOVERNANCE_OWNER_MODULE,
  DEFAULT_MAX_GOVERNANCE_HISTORY_SIZE,
  GOVERNANCE_QUESTION_SIGNALS,
  isSelfEvolutionGovernanceQuestion,
} from './self-evolution-governance-types.js';

export type {
  SelfEvolutionGovernanceDecision,
  GovernanceRiskLevel,
  GovernanceReadinessState,
  SelfModificationState,
  SelfEvolutionGovernanceRecord,
  SelfEvolutionGovernanceInput,
  GovernanceBoundaryValidation,
  GovernanceRiskEvaluation,
  GovernanceTrustEvaluation,
  GovernanceApprovalEvaluation,
  GovernanceRollbackValidation,
  GovernanceSelfModificationValidation,
  GovernanceStallValidation,
  GovernanceReadinessEvaluation,
  SelfEvolutionGovernanceReport,
  GovernanceHistoryEntry,
  SelfEvolutionGovernanceRuntimeReport,
  SelfEvolutionGovernanceResult,
} from './self-evolution-governance-types.js';

export {
  registerGovernanceRecord,
  getGovernanceRecord,
  listGovernanceRecords,
  listGovernanceRecordsByDecision,
  getGovernanceRecordCount,
  resetGovernanceRegistryForTests,
} from './self-evolution-governance-registry.js';

export { validateGovernanceBoundaries, getBoundaryValidationCount, resetBoundaryValidatorForTests } from './governance-boundary-validator.js';
export { evaluateGovernanceRisk, getRiskReviewCount, resetRiskEvaluatorForTests } from './governance-risk-evaluator.js';
export { evaluateGovernanceTrust, getTrustReviewCount, resetTrustEvaluatorForTests } from './governance-trust-evaluator.js';
export { evaluateGovernanceApproval, getApprovalReviewCount, resetApprovalEvaluatorForTests } from './governance-approval-evaluator.js';
export { validateGovernanceRollback, getRollbackReviewCount, resetRollbackValidatorForTests } from './governance-rollback-validator.js';
export { validateSelfModification } from './governance-self-modification-validator.js';
export {
  validateGovernanceStallProtection,
  evaluateGovernanceReadiness,
  getReadinessEvaluationCount,
  resetReadinessEvaluatorForTests,
} from './governance-readiness-evaluator.js';
export { buildGovernanceDecision, resetGovernanceDecisionEngineForTests } from './governance-decision-engine.js';
export {
  recordGovernanceHistory,
  getGovernanceHistory,
  getGovernanceHistorySize,
  resetGovernanceHistoryForTests,
} from './governance-history.js';
export { generateGovernanceReport, resetGovernanceReportCounterForTests } from './governance-reporting.js';
export { getGovernanceCacheStats, resetGovernanceCacheForTests } from './governance-cache.js';

export {
  getDevPulseV2SelfEvolutionGovernance,
  registerSelfEvolutionGovernanceWithCentralBrain,
  registerSelfEvolutionGovernanceWithProjectVault,
  registerSelfEvolutionGovernanceWithTrustEngine,
  registerSelfEvolutionGovernanceWithMissingCapabilityEscalation,
  registerSelfEvolutionGovernanceWithCapabilityResearchEngine,
  registerSelfEvolutionGovernanceWithCapabilityPlanningEngine,
  registerSelfEvolutionGovernanceWithCapabilityBuildEngine,
  registerSelfEvolutionGovernanceWithCapabilityVerificationEngine,
  registerSelfEvolutionGovernanceWithAutonomousVerification,
  registerSelfEvolutionGovernanceWithCompletionEngine,
  registerSelfEvolutionGovernanceWithMultiProjectMonitoring,
  registerSelfEvolutionGovernanceWithUvl,
  evaluateSelfEvolutionGovernance,
  getSelfEvolutionGovernanceRuntimeReport,
  resetSelfEvolutionGovernanceForTests,
} from './self-evolution-governance.js';

export type { SelfEvolutionGovernanceSystemSnapshot } from './self-evolution-governance.js';

export function resetSelfEvolutionGovernanceModuleForTests(): void {
  resetGovernanceRegistryForTests();
  resetGovernanceCacheForTests();
  resetBoundaryValidatorForTests();
  resetRiskEvaluatorForTests();
  resetTrustEvaluatorForTests();
  resetApprovalEvaluatorForTests();
  resetRollbackValidatorForTests();
  resetReadinessEvaluatorForTests();
  resetGovernanceDecisionEngineForTests();
  resetGovernanceHistoryForTests();
  resetGovernanceReportCounterForTests();
  resetSelfEvolutionGovernanceForTests();
  resetCapabilityVerificationEngineModuleForTests();
}
