/**
 * Verification Strategy Core — public exports.
 * Decision-making only — no validator execution.
 */

import { resetVerificationStrategyBuilderForTests } from './verification-strategy-builder.js';
import { resetVerificationStrategyCoreForTests } from './verification-strategy-core.js';

export {
  VERIFICATION_STRATEGY_CORE_PASS_TOKEN,
  VERIFICATION_STRATEGY_CORE_OWNER_MODULE,
  VERIFICATION_STRATEGY_QUESTION_SIGNALS,
  isVerificationStrategyCoreQuestion,
} from './verification-strategy-types.js';

export type {
  VerificationStrategy,
  VerificationStrategyDecision,
  VerificationStrategyInput,
  VerificationRequirementResult,
  VerificationStrategyRegistryEntry,
  VerificationStrategyRuntimeReport,
  VerificationTaskType,
  VerificationRiskLevel,
  VerificationChangeScope,
  VerificationExecutionMode,
} from './verification-strategy-types.js';

export {
  VERIFICATION_STRATEGY_REGISTRY,
  getVerificationStrategyRegistryEntry,
  listVerificationStrategyRegistryEntries,
  getMinimumConfidenceForStrategy,
  getExpectedValidatorsForStrategy,
  getRiskLevelForStrategy,
} from './verification-strategy-registry.js';

export { evaluateVerificationRequirements } from './verification-requirement-evaluator.js';
export { calculateVerificationConfidence } from './verification-confidence-policy.js';
export { shouldEscalateVerification } from './verification-escalation-policy.js';
export { pickVerificationStrategy, selectVerificationStrategy } from './verification-strategy-selector.js';

export {
  buildVerificationStrategy,
  getVerificationStrategyRuntimeReport,
  markBootstrapReused,
  resetVerificationStrategyBuilderForTests,
} from './verification-strategy-builder.js';

export {
  getDevPulseV2VerificationStrategyCore,
  registerVerificationStrategyWithCentralBrain,
  registerVerificationStrategyWithProjectVault,
  registerVerificationStrategyWithTrustEngine,
  registerVerificationStrategyWithWorld2Coordinator,
  registerVerificationStrategyWithUvl,
  decideVerificationStrategy,
  getVerificationStrategyCoreRuntimeReport,
  resetVerificationStrategyCoreForTests,
} from './verification-strategy-core.js';

export type { VerificationStrategyIntegrationSnapshot } from './verification-strategy-core.js';

export function resetVerificationStrategyCoreModuleForTests(): void {
  resetVerificationStrategyBuilderForTests();
  resetVerificationStrategyCoreForTests();
}
