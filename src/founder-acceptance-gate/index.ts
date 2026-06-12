/**
 * Founder Acceptance Gate — public API.
 */

export {
  FOUNDER_ACCEPTANCE_GATE_PASS_TOKEN,
  FOUNDER_ACCEPTANCE_GATE_OWNER_MODULE,
  FOUNDER_ACCEPTANCE_GATE_PHASE,
  FOUNDER_ACCEPTANCE_GATE_REPORT_TITLE,
  FOUNDER_ACCEPTANCE_CACHE_KEY_PREFIX,
  FOUNDER_ACCEPTANCE_CORE_QUESTION,
  MAX_FOUNDER_ACCEPTANCE_HISTORY,
  MAX_ACCEPTANCE_REASONS,
  MAX_REQUIRED_NEXT_ACTIONS,
  ACCEPTED_MIN_FOUNDER_TEST_SCORE,
  ACCEPTED_WITH_WARNINGS_MIN_FOUNDER_TEST_SCORE,
  REQUIREMENT_REALITY_ACCEPTANCE_MIN_SCORE,
  CONFIDENCE_WEIGHT_AUTHORITY_COVERAGE,
  CONFIDENCE_WEIGHT_PROOF_QUALITY,
  CONFIDENCE_WEIGHT_SIMULATION_QUALITY,
  CONFIDENCE_WEIGHT_REQUIREMENT_COMPLETENESS,
  CONFIDENCE_WEIGHT_FOUNDER_READINESS,
  FOUNDER_ACCEPTANCE_STATES,
  REQUIRED_ACCEPTANCE_AUTHORITY_IDS,
  REQUIRED_ACCEPTANCE_AUTHORITY_LABELS,
  isFounderAcceptanceState,
  clampConfidence,
} from './founder-acceptance-gate-registry.js';

export type {
  FounderAcceptanceState,
  FounderAcceptanceRequiredAuthorityId,
  FounderAcceptanceAuthoritySnapshot,
  FounderAcceptanceInputSnapshot,
  FounderAcceptanceReasons,
  FounderAcceptanceConfidenceBreakdown,
  FounderAcceptanceAssessment,
  FounderAcceptanceReport,
  AssessFounderAcceptanceGateInput,
  FounderAcceptanceHistorySummary,
} from './founder-acceptance-gate-types.js';

export {
  resetFounderAcceptanceGateHistoryForTests,
  recordFounderAcceptanceAssessment,
  getFounderAcceptanceHistorySize,
  getLatestFounderAcceptanceAssessment,
  getFounderAcceptanceHistory,
  buildFounderAcceptanceHistorySummary,
  countFounderAcceptanceState,
} from './founder-acceptance-gate-history.js';

export {
  assessFounderAcceptanceGate,
  deriveFounderAcceptanceState,
  buildFounderAcceptanceGateReport,
  buildFounderAcceptanceGateArtifacts,
  resetFounderAcceptanceGateModuleForTests,
} from './founder-acceptance-gate-authority.js';

export type { FounderAcceptanceDerivationContext } from './founder-acceptance-gate-authority.js';

export { buildFounderAcceptanceGateReportMarkdown } from './founder-acceptance-gate-report-builder.js';
