/**
 * Skeptical Founder Simulator — public API.
 */

export {
  SKEPTICAL_FOUNDER_SIMULATOR_PASS_TOKEN,
  SKEPTICAL_FOUNDER_SIMULATOR_OWNER_MODULE,
  MAX_SKEPTICAL_SCENARIOS,
  MAX_SKEPTICAL_OBJECTIONS,
  MAX_SKEPTICAL_RECOMMENDATIONS,
  MAX_SKEPTICAL_HISTORY,
  SKEPTICAL_FOUNDER_CACHE_KEY_PREFIX,
  SKEPTICAL_FOUNDER_REPORT_TITLE,
  SKEPTICAL_LAUNCH_BLOCK_SCORE,
  SKEPTICAL_LAUNCH_RISK_BLOCK_THRESHOLD,
} from './skeptical-founder-bounds.js';

export type {
  SkepticalFounderScenarioCategory,
  SkepticalFounderReadinessState,
  SkepticalFounderScenarioDefinition,
  SkepticalFounderScenarioResult,
  SkepticalFounderAssessment,
} from './skeptical-founder-types.js';

export { SKEPTICAL_FOUNDER_SCENARIOS } from './skeptical-founder-scenarios.js';

export {
  resetSkepticalFounderHistoryForTests,
  recordSkepticalFounderAssessment,
  getSkepticalFounderHistorySize,
  getLatestSkepticalFounderAssessment,
} from './skeptical-founder-history.js';

export { buildSkepticalFounderReportMarkdown } from './skeptical-founder-report-builder.js';

export {
  validateSkepticalScenarioCount,
  validateSkepticalDeterministicScoring,
  validateSkepticalLaunchBlocking,
} from './skeptical-founder-validator.js';

export {
  assessSkepticalFounderSimulator,
  buildSkepticalFounderSimulatorArtifacts,
} from './skeptical-founder-authority.js';
