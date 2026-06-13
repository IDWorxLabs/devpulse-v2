/**
 * Founder Simulation Engine — public API (V1).
 */

export {
  FOUNDER_SIMULATION_ENGINE_V1_PASS,
  FOUNDER_SIMULATION_ENGINE_OWNER_MODULE,
  FOUNDER_SIMULATION_ENGINE_PHASE,
  FOUNDER_SIMULATION_ENGINE_REPORT_TITLE,
  MAX_FOUNDER_SIMULATION_HISTORY,
  MAX_SIMULATION_RUNTIME_MS,
  SIMULATION_STAGE_ORDER,
  FOUNDER_SIMULATION_SCENARIO_TYPES,
  SAFETY_GUARANTEES,
} from './founder-simulation-registry.js';

export type {
  FounderSimulationScenarioType,
  FounderSimulationStageId,
  FounderSimulationStageStatus,
  FounderSimulationFinalVerdict,
  FounderReadinessCategory,
  FounderSimulationStageResult,
  SimulationFailureItem,
  SystemIntegrationProof,
  FounderSimulationResult,
  FounderSimulationScenario,
  FounderSimulationHistoryEntry,
  FounderSimulationEngineReport,
  RunFounderSimulationInput,
  FounderSimulationRun,
  FounderSimulationChainContext,
} from './founder-simulation-types.js';

export {
  resetFounderSimulationHistoryForTests,
  recordFounderSimulationResult,
  getFounderSimulationHistorySize,
  getFounderSimulationHistory,
  getFounderSimulationResults,
  getLatestFounderSimulationResult,
} from './founder-simulation-history.js';

export {
  runFounderSimulation,
  runFounderTestButtonSimulation,
  buildFounderSimulationEngineArtifacts,
  resetFounderSimulationEngineModuleForTests,
  getFounderSimulationProgressLog,
} from './founder-simulation-engine.js';

export {
  buildFounderSimulationEngineReport,
  buildFounderSimulationEngineReportMarkdown,
} from './founder-simulation-report-builder.js';

export {
  FOUNDER_SIMULATION_SCENARIOS,
  getFounderSimulationScenarios,
  getFounderSimulationScenarioByType,
  buildTranscriptWav,
  buildUiMockPng,
} from './simulation-scenario-library.js';

export { simulateFounderJourney, resetFounderJourneyCounterForTests } from './founder-journey-simulator.js';
export { simulateIntakeChain } from './intake-chain-simulator.js';
export { simulatePlanningChain } from './planning-chain-simulator.js';
export { simulateArchitectureChain } from './architecture-chain-simulator.js';
export { simulateBuildPlanChain } from './build-plan-chain-simulator.js';
export { buildSystemIntegrationProof, mergeSystemIntegrationProofs } from './cross-system-proof-analyzer.js';
export { analyzeSimulationFailures } from './simulation-failure-analyzer.js';
