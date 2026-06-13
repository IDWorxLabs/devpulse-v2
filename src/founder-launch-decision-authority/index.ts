/**
 * Founder Launch Decision Authority — public API (Phase 26.14).
 */

export {
  FOUNDER_LAUNCH_DECISION_AUTHORITY_PASS_TOKEN,
  FOUNDER_LAUNCH_DECISION_AUTHORITY_OWNER_MODULE,
  FOUNDER_LAUNCH_DECISION_AUTHORITY_PHASE,
  FOUNDER_LAUNCH_DECISION_AUTHORITY_REPORT_TITLE,
  FOUNDER_LAUNCH_DECISION_AUTHORITY_CACHE_KEY_PREFIX,
  FOUNDER_LAUNCH_DECISION_CORE_QUESTION,
  MAX_FOUNDER_LAUNCH_DECISION_HISTORY,
  LAUNCH_CONFIDENCE_THRESHOLD,
  HIGH_RISK_SCORE_THRESHOLD,
  DECISION_PRIORITY,
  INPUT_SIGNAL_AUTHORITIES,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
} from './founder-launch-decision-authority-registry.js';

export { FOUNDER_LAUNCH_DECISIONS } from './founder-launch-decision-authority-types.js';

export type {
  FounderLaunchDecision,
  ProofChainSignal,
  ProofChainSignalAnalysis,
  LaunchRiskSignalAnalysis,
  BlockerPriorityEntry,
  BlockerPriorityAnalysis,
  FounderDecisionVerdict,
  FounderLaunchDecisionInputSnapshot,
  FounderLaunchDecisionReport,
  FounderLaunchDecisionAssessment,
  AssessFounderLaunchDecisionInput,
  FounderLaunchDecisionHistoryEntry,
  FounderLaunchDecisionHistorySummary,
  FounderLaunchDecisionArtifacts,
} from './founder-launch-decision-authority-types.js';

export {
  resetFounderLaunchDecisionHistoryForTests,
  recordFounderLaunchDecisionAssessment,
  getFounderLaunchDecisionHistorySize,
  buildFounderLaunchDecisionHistorySummary,
} from './founder-launch-decision-history.js';

export {
  assessFounderLaunchDecision,
  buildFounderLaunchDecisionArtifacts,
  resetFounderLaunchDecisionCounterForTests,
  resetFounderLaunchDecisionAuthorityModuleForTests,
} from './founder-launch-decision-authority.js';

export {
  buildFounderLaunchDecisionReportMarkdown,
  formatFounderLaunchDecisionSummary,
} from './founder-launch-decision-report-builder.js';

export { analyzeProofChainSignals } from './proof-chain-signal-analyzer.js';
export { analyzeLaunchRisk } from './launch-risk-analyzer.js';
export { analyzeBlockerPriority } from './blocker-priority-analyzer.js';
export { computeFounderDecisionVerdict } from './founder-decision-verdict-engine.js';
