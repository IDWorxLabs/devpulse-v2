/**
 * Launch Readiness Authority V2 — public exports.
 */

import { resetLaunchReadinessAuthorityForTests } from './launch-authority.js';
import { resetLaunchDecisionAuditForTests } from './launch-decision-audit.js';
import { resetLaunchBlockerDetectorForTests } from './launch-blocker-detector.js';
import { resetLaunchEvidenceCollectorForTests } from './launch-evidence-collector.js';
import { resetLaunchReadinessHistoryForTests } from './launch-readiness-history.js';
import { resetLaunchRiskAnalyzerForTests } from './launch-risk-analyzer.js';

export {
  LAUNCH_READINESS_AUTHORITY_V2_PASS_TOKEN,
  LAUNCH_READINESS_AUTHORITY_V2_OWNER_MODULE,
  DEFAULT_MAX_LAUNCH_READINESS_HISTORY,
  EVIDENCE_MAX_AGE_MS,
  EVIDENCE_SCHEMA_VERSION,
  REQUIRED_LAUNCH_EVIDENCE_SOURCES,
} from './launch-readiness-types.js';

export type {
  LaunchReadinessVerdict,
  LaunchEvidenceStatus,
  LaunchEvidenceSourceId,
  LaunchBlockerKind,
  LaunchRiskCategory,
  LaunchReadinessCategory,
  LaunchRoutingTarget,
  LaunchEvidenceSourceRecord,
  LaunchEvidenceCollectionResult,
  LaunchEvidenceValidationIssue,
  LaunchEvidenceValidationResult,
  LaunchBlockerRecord,
  LaunchRiskRecord,
  LaunchConfidenceResult,
  LaunchReadinessCategoryScore,
  LaunchReadinessScoreResult,
  LaunchVerdictResult,
  LaunchDecisionAuditRecord,
  LaunchDecisionExplanation,
  LaunchEvidenceDashboard,
  LaunchReadinessPipelineInput,
  LaunchReadinessPipelineResult,
  LivePreviewLaunchReadinessGateResult,
} from './launch-readiness-types.js';

export {
  getDevPulseV2LaunchReadinessAuthorityV2,
  registerLaunchReadinessAuthorityV2WithFounderTest,
  registerLaunchReadinessAuthorityV2WithUvl,
  registerLaunchReadinessAuthorityV2WithLivePreviewGate,
  registerLaunchReadinessAuthorityV2WithContinuousImprovement,
} from './launch-readiness-registry.js';

export { collectLaunchEvidence, resetLaunchEvidenceCollectorForTests } from './launch-evidence-collector.js';
export { validateLaunchEvidence } from './launch-evidence-validator.js';
export { detectLaunchBlockers, resetLaunchBlockerDetectorForTests } from './launch-blocker-detector.js';
export { analyzeLaunchRisk, hasResidualHighRisk, resetLaunchRiskAnalyzerForTests } from './launch-risk-analyzer.js';
export { calculateLaunchConfidence } from './launch-confidence-engine.js';
export { scoreLaunchReadiness } from './launch-readiness-scorer.js';
export { resolveLaunchVerdict } from './launch-verdict-engine.js';
export {
  buildLaunchDecisionAudit,
  resetLaunchDecisionAuditForTests,
} from './launch-decision-audit.js';
export {
  explainLaunchDecision,
  formatLaunchDecisionExplanation,
  routeUnresolvedIssue,
} from './launch-decision-explainer.js';
export {
  recordLaunchReadinessDecision,
  getLaunchReadinessHistory,
  getLatestLaunchReadinessDecision,
  resetLaunchReadinessHistoryForTests,
} from './launch-readiness-history.js';
export {
  buildLaunchReadinessReport,
  buildLaunchReadinessPipelineReport,
} from './launch-readiness-report-builder.js';
export {
  runLaunchReadinessAuthorityPipeline,
  getLastLaunchReadinessPipelineResult,
  isLaunchReady,
  buildLaunchReadinessAuthorityEvidence,
  getLaunchReadinessPassToken,
  resetLaunchReadinessAuthorityForTests,
} from './launch-authority.js';
export {
  evaluateLivePreviewLaunchReadinessGate,
  isLivePreviewUnlockedByLaunchAuthority,
} from './launch-live-preview-gate.js';

export function resetLaunchReadinessAuthorityV2ModuleForTests(): void {
  resetLaunchReadinessAuthorityForTests();
  resetLaunchEvidenceCollectorForTests();
  resetLaunchBlockerDetectorForTests();
  resetLaunchRiskAnalyzerForTests();
  resetLaunchDecisionAuditForTests();
  resetLaunchReadinessHistoryForTests();
}
