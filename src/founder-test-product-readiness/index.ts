export {
  FULL_PRODUCT_READINESS_SIMULATION_PASS_TOKEN,
  type ProductReadinessSimulationId,
  type ProductReadinessVerdict,
  type ProductReadinessSimulationResult,
  type ProductReadinessAutomaticBlocker,
  type ProductReadinessSelfEvolution,
  type ProductReadinessReport,
  type ProductReadinessAssessment,
  type RunProductReadinessSimulationInput,
  type ProductReadinessHistoryEntry,
} from './product-readiness-types.js';

export {
  PRODUCT_READINESS_WEIGHTS,
  CHAT_INTELLIGENCE_LAUNCH_GATE,
  verdictFromScore,
  simulationVerdictFromScore,
  buildWeightedReadinessScore,
  attachWeights,
} from './product-readiness-score-builder.js';

export {
  resetProductReadinessHistoryForTests,
  recordProductReadinessAssessment,
  getProductReadinessHistory,
  getProductReadinessHistorySize,
  getLatestProductReadinessHistoryEntry,
} from './product-readiness-history.js';

export {
  PRODUCT_READINESS_PROPAGATION_PASS,
  PRODUCT_READINESS_PROPAGATION_START,
  PRODUCT_READINESS_PROPAGATION_STEP,
  PRODUCT_READINESS_PROPAGATION_COMPLETE,
  PRODUCT_READINESS_PROPAGATION_FAILURE,
  propagateProductReadinessAfterCompletionBoundary,
  waitForProductReadinessCompletionBoundary,
  isProductReadinessCompletionBoundarySatisfied,
} from './product-readiness-propagation.js';

export type { ProductReadinessPropagationResult } from './product-readiness-propagation.js';

export {
  PRODUCT_READINESS_REAL_FOUNDER_PATH_PASS,
  REAL_FOUNDER_PRODUCT_READINESS_PATH_SELECTED,
  REAL_FOUNDER_COMPLETION_CHECK_OBSERVED,
  REAL_FOUNDER_COMPLETION_TAIL_INVOKED,
  REAL_FOUNDER_COMPLETION_TAIL_COMPLETED,
  REAL_FOUNDER_STAGE2_EXIT_CONFIRMED,
  PRODUCT_READINESS_PROPAGATION_PATH_MISMATCH,
  resetProductReadinessRealFounderPathForTests,
  selectProductReadinessRuntimePath,
  getSelectedProductReadinessRuntimePath,
  isProductReadinessCompletionCheckSatisfied,
  observeRealFounderCompletionCheck,
  hasProductReadinessCompletionTailInvoked,
} from './product-readiness-real-founder-path.js';

export {
  runFullProductReadinessSimulation,
  resetProductReadinessSimulationForTests,
  formatProductReadinessSummary,
  forceCompleteProductReadiness,
  invokeProductReadinessCompletionTail,
} from './product-readiness-orchestrator.js';

export {
  PRODUCT_READINESS_SIMULATION_STALL_REPAIR_V1_PASS,
  CHAT_STRESS_DEADLINE_STALL_ALIGNMENT_V1_PASS,
  SIMULATION_SLOW_THRESHOLD_MS,
  SIMULATION_STALLED_THRESHOLD_MS,
  SIMULATION_BUDGET_MS,
  CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
  CHAT_STRESS_SCENARIO_HARD_TIMEOUT_GRACE_MS,
  CHAT_STRESS_BATCH_DEADLINE_OVERHEAD_MS,
  CHAT_STRESS_DEFAULT_CONCURRENCY,
  CHAT_STRESS_WORST_CASE_BATCH_DEADLINE_MS,
  DEFAULT_FOUNDER_TEST_CHAT_STRESS_MAX_SCENARIOS,
  CHAT_STRESS_SCENARIOS_HARD_CAP,
  resolveEffectiveChatStressMaxScenarios,
  resolveChatStressWorstCaseBatchDeadlineMs,
  resolveChatStressSimulationStalledThresholdMs,
  createSimulationBudgetTracker,
  withScenarioTimeout,
  type SimulationRuntimeHealth,
  type SimulationBudgetSnapshot,
} from './product-readiness-simulation-budget.js';

export {
  resetProductReadinessFixtureCacheForTests,
  loadProductReadinessShellCached,
  loadProductMemoryFoundationsCached,
} from './product-readiness-fixture-cache.js';

export {
  PRODUCT_READINESS_COMPLETION_BOUNDARY_V1_PASS,
  PRODUCT_READINESS_COMPLETION_CHECK,
  PRODUCT_READINESS_COMPLETED,
  PRODUCT_READINESS_FORCED_COMPLETION,
  CHAT_STRESS_SETTLEMENT_DRAIN_GRACE_MS,
  resolveProductReadinessCompletionEligibility,
  reconcileProductReadinessCompletionCheck,
  shouldForceCompleteProductReadiness,
  waitForProductReadinessChatStressSettlement,
  resetProductReadinessCompletionCheckEmissionForTests,
  CHAT_STRESS_TERMINAL_STATUSES,
} from './product-readiness-completion-boundary.js';

export { buildProductReadinessReportMarkdown } from './product-readiness-report-builder.js';
