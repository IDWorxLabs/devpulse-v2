/**
 * Founder Friction Detector — public exports.
 */

import { resetFounderFrictionRegistryForTests } from './founder-friction-registry.js';
import { resetFounderFrictionCacheForTests } from './founder-friction-cache.js';
import { resetFrictionGapCounterForTests } from './friction-gap-model.js';
import { resetFrictionContextBuilderForTests } from './friction-context-builder.js';
import { resetConfusionFrictionDetectorForTests } from './confusion-friction-detector.js';
import { resetWorkflowFrictionDetectorForTests } from './workflow-friction-detector.js';
import { resetDecisionFatigueDetectorForTests } from './decision-fatigue-detector.js';
import { resetContextSwitchingDetectorForTests } from './context-switching-detector.js';
import { resetHiddenCapabilityDetectorForTests } from './hidden-capability-detector.js';
import { resetTrustBreakdownDetectorForTests } from './trust-breakdown-detector.js';
import { resetConfidenceBreakdownDetectorForTests } from './confidence-breakdown-detector.js';
import { resetProductivityBlockerDetectorForTests } from './productivity-blocker-detector.js';
import { resetVerificationFrictionDetectorForTests } from './verification-friction-detector.js';
import { resetLaunchBlockerFrictionDetectorForTests } from './launch-blocker-friction-detector.js';
import { resetFrictionGapAnalyzerForTests } from './friction-gap-analyzer.js';
import { resetFrictionRoadmapBuilderForTests } from './friction-roadmap-builder.js';
import { resetFounderFrictionAuthorityBuilderForTests } from './founder-friction-authority-builder.js';
import { resetFounderFrictionEvaluatorForTests } from './founder-friction-evaluator.js';
import { resetFounderFrictionHistoryForTests } from './bounded-history.js';
import { resetFounderFrictionReportBuilderForTests } from './founder-friction-report-builder.js';
import { resetFounderFrictionDetectorOrchestrationForTests } from './founder-friction-detector.js';

export {
  FOUNDER_FRICTION_DETECTOR_PASS_TOKEN,
  FOUNDER_FRICTION_DETECTOR_PASS,
  FOUNDER_FRICTION_OWNER_MODULE,
  DEFAULT_MAX_FOUNDER_FRICTION_HISTORY_SIZE,
  MAX_FRICTION_GAPS,
  FRICTION_CONTEXT_PASS,
  CONFUSION_FRICTION_PASS,
  WORKFLOW_FRICTION_PASS,
  DECISION_FATIGUE_PASS,
  CONTEXT_SWITCHING_PASS,
  DISCOVERABILITY_FRICTION_PASS,
  TRUST_BREAKDOWN_PASS,
  CONFIDENCE_BREAKDOWN_PASS,
  PRODUCTIVITY_FRICTION_PASS,
  VERIFICATION_FRICTION_PASS,
  LAUNCH_FRICTION_PASS,
  FRICTION_GAP_ANALYSIS_PASS,
  FRICTION_ROADMAP_PASS,
  FOUNDER_FRICTION_REPORTING_PASS,
  FOUNDER_FRICTION_QUESTION_SIGNALS,
  isFounderFrictionQuestion,
  resolveFounderFrictionResult,
  clampScore,
} from './founder-friction-types.js';

export type {
  FounderFrictionResult,
  FrictionGapSeverity,
  FrictionContextId,
  FrictionContext,
  FrictionGap,
  FrictionDetectorResult,
  ConfusionFrictionDetection,
  WorkflowFrictionDetection,
  DecisionFatigueDetection,
  ContextSwitchingFrictionDetection,
  DiscoverabilityFrictionDetection,
  TrustBreakdownDetection,
  ConfidenceBreakdownDetection,
  ProductivityFrictionDetection,
  VerificationFrictionDetection,
  LaunchFrictionDetection,
  FrictionGapAnalysis,
  FounderFrictionRoadmap,
  FounderFrictionAuthority,
  FounderFrictionScore,
  FounderFrictionRecord,
  FounderFrictionEvaluation,
  FounderFrictionReport,
  FounderFrictionDetectorInput,
  FounderFrictionResultBundle,
  FounderFrictionRuntimeReport,
} from './founder-friction-types.js';

export {
  createFrictionGap,
  boundGaps,
  mergeBoundedGaps,
  countCriticalGaps,
  MAX_GAPS_PER_DETECTOR,
  resetFrictionGapCounterForTests,
} from './friction-gap-model.js';

export { getFounderFrictionCacheStats, resetFounderFrictionCacheForTests } from './founder-friction-cache.js';

export {
  registerFounderFrictionRecord,
  getFounderFrictionRecord,
  lookupFounderFrictionByProjectId,
  listFounderFrictionRecords,
  getFounderFrictionRecordCount,
  resetFounderFrictionRegistryForTests,
} from './founder-friction-registry.js';

export {
  buildFrictionContext,
  buildAllFrictionContexts,
  listFrictionContextIds,
  getContextBuildCount,
  resetFrictionContextBuilderForTests,
} from './friction-context-builder.js';

export {
  detectConfusionFriction,
  getConfusionDetectCount,
  resetConfusionFrictionDetectorForTests,
} from './confusion-friction-detector.js';
export type { ConfusionFrictionUpstream } from './confusion-friction-detector.js';

export {
  detectWorkflowFriction,
  getWorkflowFrictionDetectCount,
  resetWorkflowFrictionDetectorForTests,
} from './workflow-friction-detector.js';
export type { WorkflowFrictionUpstream } from './workflow-friction-detector.js';

export {
  detectDecisionFatigue,
  getDecisionFatigueDetectCount,
  resetDecisionFatigueDetectorForTests,
} from './decision-fatigue-detector.js';
export type { DecisionFatigueUpstream } from './decision-fatigue-detector.js';

export {
  detectContextSwitchingFriction,
  getContextSwitchDetectCount,
  resetContextSwitchingDetectorForTests,
} from './context-switching-detector.js';
export type { ContextSwitchingUpstream } from './context-switching-detector.js';

export {
  detectDiscoverabilityFriction,
  getDiscoverabilityDetectCount,
  resetHiddenCapabilityDetectorForTests,
} from './hidden-capability-detector.js';
export type { DiscoverabilityFrictionUpstream } from './hidden-capability-detector.js';

export {
  detectTrustBreakdown,
  getTrustBreakdownDetectCount,
  resetTrustBreakdownDetectorForTests,
} from './trust-breakdown-detector.js';
export type { TrustBreakdownUpstream } from './trust-breakdown-detector.js';

export {
  detectConfidenceBreakdown,
  getConfidenceBreakdownDetectCount,
  resetConfidenceBreakdownDetectorForTests,
} from './confidence-breakdown-detector.js';
export type { ConfidenceBreakdownUpstream } from './confidence-breakdown-detector.js';

export {
  detectProductivityFriction,
  getProductivityBlockerDetectCount,
  resetProductivityBlockerDetectorForTests,
} from './productivity-blocker-detector.js';
export type { ProductivityBlockerUpstream } from './productivity-blocker-detector.js';

export {
  detectVerificationFriction,
  getVerificationFrictionDetectCount,
  resetVerificationFrictionDetectorForTests,
} from './verification-friction-detector.js';
export type { VerificationFrictionUpstream } from './verification-friction-detector.js';

export {
  detectLaunchFriction,
  getLaunchFrictionDetectCount,
  resetLaunchBlockerFrictionDetectorForTests,
} from './launch-blocker-friction-detector.js';
export type { LaunchFrictionUpstream } from './launch-blocker-friction-detector.js';

export {
  analyzeFrictionGaps,
  getGapAnalysisCount,
  resetFrictionGapAnalyzerForTests,
} from './friction-gap-analyzer.js';

export {
  buildFounderFrictionRoadmap,
  getRoadmapBuildCount,
  resetFrictionRoadmapBuilderForTests,
} from './friction-roadmap-builder.js';

export {
  buildFounderFrictionAuthority,
  getAuthorityBuildCount,
  resetFounderFrictionAuthorityBuilderForTests,
} from './founder-friction-authority-builder.js';

export {
  buildFounderFrictionScore,
  evaluateFounderFriction,
  getEvaluationCount,
  resetFounderFrictionEvaluatorForTests,
} from './founder-friction-evaluator.js';

export {
  recordFounderFrictionHistory,
  getFounderFrictionHistory,
  getFounderFrictionHistorySize,
  clearFounderFrictionHistory,
  resetFounderFrictionHistoryForTests,
} from './bounded-history.js';

export {
  generateFounderFrictionReport,
  getReportCount,
  resetFounderFrictionReportBuilderForTests,
} from './founder-friction-report-builder.js';

export {
  getDevPulseV2FounderFrictionDetector,
  registerFounderFrictionDetectorWithSurface,
  registerFounderFrictionDetectorWithFoundation,
  registerFounderFrictionDetectorWithCapabilityRegistry,
  registerFounderFrictionDetectorWithFindPanel,
  registerFounderFrictionDetectorWithUvl,
  registerFounderFrictionDetectorWithAcceptanceChain,
  evaluateFounderFrictionDetector,
  getFounderFrictionDetectorRuntimeReport,
} from './founder-friction-detector.js';

export type { FounderFrictionSurfaceSnapshot } from './founder-friction-detector.js';

export function resetFounderFrictionDetectorForTests(): void {
  resetFounderFrictionRegistryForTests();
  resetFounderFrictionCacheForTests();
  resetFrictionGapCounterForTests();
  resetFrictionContextBuilderForTests();
  resetConfusionFrictionDetectorForTests();
  resetWorkflowFrictionDetectorForTests();
  resetDecisionFatigueDetectorForTests();
  resetContextSwitchingDetectorForTests();
  resetHiddenCapabilityDetectorForTests();
  resetTrustBreakdownDetectorForTests();
  resetConfidenceBreakdownDetectorForTests();
  resetProductivityBlockerDetectorForTests();
  resetVerificationFrictionDetectorForTests();
  resetLaunchBlockerFrictionDetectorForTests();
  resetFrictionGapAnalyzerForTests();
  resetFrictionRoadmapBuilderForTests();
  resetFounderFrictionAuthorityBuilderForTests();
  resetFounderFrictionEvaluatorForTests();
  resetFounderFrictionHistoryForTests();
  resetFounderFrictionReportBuilderForTests();
  resetFounderFrictionDetectorOrchestrationForTests();
}
