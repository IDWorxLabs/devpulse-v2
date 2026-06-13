/**
 * Post-Launch Reality Authority — public API (Phase 26.15).
 */

export {
  POST_LAUNCH_REALITY_AUTHORITY_PASS_TOKEN,
  POST_LAUNCH_REALITY_AUTHORITY_OWNER_MODULE,
  POST_LAUNCH_REALITY_AUTHORITY_PHASE,
  POST_LAUNCH_REALITY_AUTHORITY_REPORT_TITLE,
  POST_LAUNCH_REALITY_AUTHORITY_CACHE_KEY_PREFIX,
  POST_LAUNCH_REALITY_CORE_QUESTION,
  MAX_POST_LAUNCH_REALITY_HISTORY,
  EVIDENCE_SOURCES,
  UPSTREAM_AUTHORITIES,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
  FABRICATED_EVIDENCE_SOURCES,
  STATE_ORDER,
  ACTIVE_USAGE_THRESHOLD,
  GROWING_PRODUCT_THRESHOLD,
  ESTABLISHED_PRODUCT_THRESHOLD,
} from './post-launch-reality-registry.js';

export { POST_LAUNCH_REALITY_STATES } from './post-launch-reality-types.js';

export type {
  PostLaunchRealityState,
  EvidenceConfidence,
  TrafficTrend,
  ObservedEvidenceBase,
  PostLaunchTrafficEvidence,
  PostLaunchEngagementEvidence,
  PostLaunchRetentionEvidence,
  PostLaunchErrorEvidence,
  PostLaunchBusinessEvidence,
  PostLaunchEvidenceBundle,
  TrafficEvidenceAnalysis,
  EngagementEvidenceAnalysis,
  RetentionEvidenceAnalysis,
  ErrorRealityAnalysis,
  BusinessOutcomeAnalysis,
  PostLaunchVerdict,
  PostLaunchInputSnapshot,
  PostLaunchRealityReport,
  PostLaunchRealityAssessment,
  AssessPostLaunchRealityInput,
  PostLaunchRealityHistoryEntry,
  PostLaunchRealityHistorySummary,
  PostLaunchRealityArtifacts,
} from './post-launch-reality-types.js';

export {
  resetPostLaunchRealityHistoryForTests,
  recordPostLaunchRealityAssessment,
  getPostLaunchRealityHistorySize,
  buildPostLaunchRealityHistorySummary,
} from './post-launch-reality-history.js';

export {
  assessPostLaunchReality,
  buildPostLaunchRealityArtifacts,
  resetPostLaunchRealityCounterForTests,
  resetPostLaunchRealityAuthorityModuleForTests,
} from './post-launch-reality-authority.js';

export {
  buildPostLaunchRealityReportMarkdown,
  formatPostLaunchRealitySummary,
} from './post-launch-reality-report-builder.js';

export { analyzeTrafficEvidence } from './traffic-evidence-analyzer.js';
export { analyzeEngagementEvidence } from './engagement-evidence-analyzer.js';
export { analyzeRetentionEvidence } from './retention-evidence-analyzer.js';
export { analyzeErrorReality } from './error-reality-analyzer.js';
export { analyzeBusinessOutcome } from './business-outcome-analyzer.js';
export { computePostLaunchVerdict } from './post-launch-verdict-engine.js';
