/**
 * Autonomous Fixing — public exports.
 */

import { resetFixPlanCounterForTests } from './fix-plan-builder.js';
import { resetFixHistoryForTests } from './fix-history.js';
import { resetFixReportCounterForTests } from './fix-reporting.js';
import { resetAutonomousFixingForTests } from './autonomous-fixing.js';
import { resetAutonomousTestingModuleForTests } from '../autonomous-testing/index.js';

export {
  AUTONOMOUS_FIXING_PASS_TOKEN,
  AUTONOMOUS_FIXING_OWNER_MODULE,
  MAX_FIX_HISTORY_SIZE,
  AUTONOMOUS_FIXING_QUESTION_SIGNALS,
  isAutonomousFixingQuestion,
} from './autonomous-fixing-types.js';

export type {
  FixStrategy,
  FailureCategory,
  FixReadiness,
  FixPlan,
  FixPlanInput,
  RootCauseAnalysis,
  RepairCandidate,
  RollbackPlan,
  FixReport,
  FixHistoryEntry,
  FixRuntimeReport,
} from './autonomous-fixing-types.js';

export {
  FIX_STRATEGY_REGISTRY,
  getFixStrategyEntry,
  listFixStrategyEntries,
} from './fix-registry.js';
export type { FixStrategyEntry } from './fix-registry.js';

export { classifyFailure } from './failure-classifier.js';
export { analyzeRootCause } from './root-cause-analyzer.js';
export { selectFixStrategy } from './fix-strategy-selector.js';
export { buildFixPlan, resetFixPlanCounterForTests } from './fix-plan-builder.js';
export { analyzeFixRisk } from './fix-risk-analyzer.js';
export { analyzeFixConfidence } from './fix-confidence-analyzer.js';
export { evaluateFixReadiness } from './fix-readiness-evaluator.js';
export { buildRollbackPlan } from './rollback-planner.js';
export { generateRepairCandidates } from './repair-candidate-generator.js';
export { generateFixReport, resetFixReportCounterForTests } from './fix-reporting.js';
export {
  recordFixHistory,
  getLatestFixPlans,
  getLatestFailures,
  lookupFixHistoryByStrategy,
  lookupFixHistoryByCategory,
  getFixHistorySize,
  resetFixHistoryForTests,
} from './fix-history.js';

export {
  getDevPulseV2AutonomousFixing,
  registerAutonomousFixingWithCentralBrain,
  registerAutonomousFixingWithProjectVault,
  registerAutonomousFixingWithTrustEngine,
  registerAutonomousFixingWithWorld2Coordinator,
  registerAutonomousFixingWithUvl,
  registerAutonomousFixingWithAutonomousBuilder,
  registerAutonomousFixingWithBuildStrategyEngine,
  strategyInputToFixInput,
  generateFixPlanFromUpstream,
  getAutonomousFixingRuntimeReport,
  getAutonomousFixingPlanCacheStats,
  resetAutonomousFixingForTests,
} from './autonomous-fixing.js';

export type {
  AutonomousFixingSystemSnapshot,
  AutonomousFixingPipelineResult,
} from './autonomous-fixing.js';

export function resetAutonomousFixingModuleForTests(): void {
  resetFixPlanCounterForTests();
  resetFixHistoryForTests();
  resetFixReportCounterForTests();
  resetAutonomousFixingForTests();
  resetAutonomousTestingModuleForTests();
}
