/**
 * Autonomous Testing — public exports.
 */

import { resetAutonomousTestPlannerForTests } from './autonomous-test-planner.js';
import { resetAutonomousTestHistoryForTests } from './autonomous-test-history.js';
import { resetAutonomousTestSuiteBuilderForTests } from './autonomous-test-suite-builder.js';
import { resetAutonomousTestingForTests } from './autonomous-testing.js';
import { resetVerificationIntegrationModuleForTests } from '../verification-integration/index.js';

export {
  AUTONOMOUS_TESTING_PASS_TOKEN,
  AUTONOMOUS_TESTING_OWNER_MODULE,
  MAX_AUTONOMOUS_TEST_HISTORY_SIZE,
  AUTONOMOUS_TESTING_QUESTION_SIGNALS,
  isAutonomousTestingQuestion,
} from './autonomous-testing-types.js';

export type {
  AutonomousTestDepth,
  AutonomousTestCategory,
  AutonomousTestReadiness,
  AutonomousTestPlan,
  AutonomousTestResult,
  AutonomousTestResultStatus,
  AutonomousTestPlanInput,
  AutonomousTestCoverageModel,
  AutonomousTestReport,
  AutonomousTestHistoryEntry,
  AutonomousTestRuntimeReport,
} from './autonomous-testing-types.js';

export {
  AUTONOMOUS_TEST_DEPTH_REGISTRY,
  getAutonomousTestDepthEntry,
  listAutonomousTestDepthEntries,
} from './autonomous-test-registry.js';
export type { AutonomousTestDepthEntry } from './autonomous-test-registry.js';

export { selectAutonomousTestDepth, selectAutonomousTestCategories } from './autonomous-test-selector.js';
export { buildAutonomousTestPlan, evaluateAutonomousTestReadiness, getAutonomousTestPlanCacheStats, resetAutonomousTestPlannerForTests } from './autonomous-test-planner.js';
export { buildAutonomousTestSuites, getAutonomousTestOptimizerReductions, resetAutonomousTestSuiteBuilderForTests } from './autonomous-test-suite-builder.js';
export { analyzeAutonomousTestRisk } from './autonomous-test-risk-analyzer.js';
export { analyzeAutonomousTestConfidence } from './autonomous-test-confidence-analyzer.js';
export { analyzeAutonomousTestCost } from './autonomous-test-cost-analyzer.js';
export { buildAutonomousTestCoverageModel } from './autonomous-test-coverage-model.js';
export { createAutonomousTestResultModel, isSimulatedResult } from './autonomous-test-result-model.js';
export { generateAutonomousTestReport } from './autonomous-test-reporting.js';
export {
  recordAutonomousTestHistory,
  getLatestAutonomousTestPlan,
  getLatestAutonomousTestResult,
  getAutonomousTestHistoryById,
  getAutonomousTestHistoryByDepth,
  getAutonomousTestHistoryByReadiness,
  getAutonomousTestHistorySize,
  resetAutonomousTestHistoryForTests,
} from './autonomous-test-history.js';

export {
  getDevPulseV2AutonomousTesting,
  registerAutonomousTestingWithCentralBrain,
  registerAutonomousTestingWithProjectVault,
  registerAutonomousTestingWithTrustEngine,
  registerAutonomousTestingWithWorld2Coordinator,
  registerAutonomousTestingWithUvl,
  strategyInputToTestInput,
  generateAutonomousTestPlanFromUpstream,
  getAutonomousTestingRuntimeReport,
  resetAutonomousTestingForTests,
} from './autonomous-testing.js';

export type {
  AutonomousTestingSystemSnapshot,
  AutonomousTestingPipelineResult,
} from './autonomous-testing.js';

export function resetAutonomousTestingModuleForTests(): void {
  resetAutonomousTestPlannerForTests();
  resetAutonomousTestHistoryForTests();
  resetAutonomousTestSuiteBuilderForTests();
  resetAutonomousTestingForTests();
  resetVerificationIntegrationModuleForTests();
}
