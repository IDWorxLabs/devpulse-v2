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
  runFullProductReadinessSimulation,
  resetProductReadinessSimulationForTests,
  formatProductReadinessSummary,
} from './product-readiness-orchestrator.js';

export {
  PRODUCT_READINESS_SIMULATION_STALL_REPAIR_V1_PASS,
  SIMULATION_SLOW_THRESHOLD_MS,
  SIMULATION_STALLED_THRESHOLD_MS,
  SIMULATION_BUDGET_MS,
  CHAT_STRESS_PER_SCENARIO_TIMEOUT_MS,
  DEFAULT_FOUNDER_TEST_CHAT_STRESS_MAX_SCENARIOS,
  CHAT_STRESS_SCENARIOS_HARD_CAP,
  resolveEffectiveChatStressMaxScenarios,
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

export { buildProductReadinessReportMarkdown } from './product-readiness-report-builder.js';
