/**
 * Verification Intelligence — public exports.
 * Planning only — no validator execution.
 */

import { resetVerificationPlanBuilderForTests } from './verification-plan-builder.js';
import { resetVerificationPlanOptimizerForTests } from './verification-plan-optimizer.js';
import { resetVerificationIntelligenceForTests } from './verification-intelligence.js';

export {
  VERIFICATION_INTELLIGENCE_PASS_TOKEN,
  VERIFICATION_INTELLIGENCE_OWNER_MODULE,
  VERIFICATION_INTELLIGENCE_QUESTION_SIGNALS,
  isVerificationIntelligenceQuestion,
} from './verification-plan-types.js';

export type {
  VerificationPlan,
  VerificationPlanType,
  VerificationPlanInput,
  VerificationRiskAnalysis,
  VerificationCostAnalysis,
  VerificationConfidenceAnalysis,
  VerificationPlanRuntimeReport,
} from './verification-plan-types.js';

export {
  VERIFICATION_PATH_REGISTRY,
  getVerificationPathEntry,
  listVerificationPathEntries,
} from './verification-path-registry.js';
export type { VerificationPathEntry } from './verification-path-registry.js';

export { analyzeVerificationRisk } from './verification-risk-analyzer.js';
export { analyzeVerificationCost } from './verification-cost-analyzer.js';
export { analyzeVerificationConfidence } from './verification-confidence-analyzer.js';
export { pickVerificationPlanType, selectVerificationPlan } from './verification-plan-selector.js';
export {
  optimizeVerificationPlan,
  buildExecutionOrder,
  getOptimizerReductionCount,
  resetVerificationPlanOptimizerForTests,
} from './verification-plan-optimizer.js';
export {
  buildVerificationPlan,
  getVerificationPlanRuntimeReport,
  markPlanBootstrapReused,
  resetVerificationPlanBuilderForTests,
} from './verification-plan-builder.js';

export {
  getDevPulseV2VerificationIntelligence,
  registerVerificationIntelligenceWithCentralBrain,
  registerVerificationIntelligenceWithProjectVault,
  registerVerificationIntelligenceWithTrustEngine,
  registerVerificationIntelligenceWithUvl,
  registerVerificationIntelligenceWithWorld2Coordinator,
  registerVerificationIntelligenceWithBuildStrategyEngine,
  strategyInputToPlanInput,
  generateVerificationPlanFromStrategy,
  getVerificationIntelligenceRuntimeReport,
  resetVerificationIntelligenceForTests,
} from './verification-intelligence.js';

export type { VerificationIntelligenceSnapshot } from './verification-intelligence.js';

export function resetVerificationIntelligenceModuleForTests(): void {
  resetVerificationPlanBuilderForTests();
  resetVerificationPlanOptimizerForTests();
  resetVerificationIntelligenceForTests();
}
