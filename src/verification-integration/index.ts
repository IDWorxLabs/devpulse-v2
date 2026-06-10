/**
 * Verification Integration — public exports.
 * Integration only — no validator execution.
 */

import { resetVerificationIntegrationForTests } from './verification-integration.js';
import { resetVerificationPlanRegistrationForTests } from './verification-plan-registration.js';
import { resetVerificationReadinessForTests } from './verification-plan-readiness.js';
import { resetVerificationHistoryForTests } from './verification-plan-history.js';
import { resetVerificationSnapshotForTests } from './verification-plan-snapshot.js';
import { resetVerificationIntelligenceModuleForTests } from '../verification-intelligence/index.js';
import { resetVerificationStrategyCoreModuleForTests } from '../verification-strategy-core/index.js';

export {
  VERIFICATION_INTEGRATION_PASS_TOKEN,
  VERIFICATION_INTEGRATION_OWNER_MODULE,
  MAX_VERIFICATION_HISTORY_SIZE,
  VERIFICATION_INTEGRATION_QUESTION_SIGNALS,
  isVerificationIntegrationQuestion,
} from './verification-integration-types.js';

export type {
  VerificationIntegrationRecord,
  VerificationIntegrationSnapshot,
  VerificationPlanReport,
  VerificationVisibilityModel,
  VerificationReadinessModel,
  VerificationReadinessState,
  VerificationHistoryEntry,
  VerificationIntegrationRuntimeReport,
} from './verification-integration-types.js';

export {
  registerVerificationPlan,
  getVerificationPlanById,
  listVerificationPlansByStrategy,
  listVerificationPlansByPlanType,
  listAllVerificationPlans,
  getVerificationRegistrySize,
  resetVerificationPlanRegistrationForTests,
} from './verification-plan-registration.js';

export { generateVerificationPlanReport } from './verification-plan-reporting.js';
export {
  evaluateVerificationReadiness,
  getReadinessEvaluationCount,
  resetVerificationReadinessForTests,
} from './verification-plan-readiness.js';
export { getVerificationVisibilityModel } from './verification-plan-visibility.js';
export {
  recordVerificationHistory,
  getLatestVerificationHistory,
  getVerificationHistoryById,
  getVerificationHistoryByPlanType,
  getVerificationHistorySize,
  listVerificationHistory,
  resetVerificationHistoryForTests,
} from './verification-plan-history.js';

export {
  createVerificationSnapshot,
  createVerificationIntegrationSnapshot,
  getVerificationSnapshotCount,
  resetVerificationSnapshotForTests,
} from './verification-plan-snapshot.js';
export type { VerificationFullSnapshot } from './verification-plan-snapshot.js';

export {
  coordinateVerificationPlan,
} from './verification-plan-coordinator.js';
export type { VerificationCoordinationResult } from './verification-plan-coordinator.js';

export {
  getDevPulseV2VerificationIntegration,
  registerVerificationIntegrationWithCentralBrain,
  registerVerificationIntegrationWithProjectVault,
  registerVerificationIntegrationWithTrustEngine,
  registerVerificationIntegrationWithWorld2Coordinator,
  registerVerificationIntegrationWithUvl,
  registerVerificationIntegrationWithBuildStrategyEngine,
  registerVerificationIntegrationWithStrategyCore,
  registerVerificationIntegrationWithIntelligence,
  getCurrentVerificationVisibilityForConsumers,
  getVerificationIntegrationRuntimeReport,
  resetVerificationIntegrationForTests,
} from './verification-integration.js';

export type { VerificationIntegrationSystemSnapshot } from './verification-integration.js';

export function resetVerificationIntegrationModuleForTests(): void {
  resetVerificationPlanRegistrationForTests();
  resetVerificationReadinessForTests();
  resetVerificationHistoryForTests();
  resetVerificationSnapshotForTests();
  resetVerificationIntegrationForTests();
  resetVerificationIntelligenceModuleForTests();
  resetVerificationStrategyCoreModuleForTests();
}
