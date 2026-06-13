/**
 * Founder Test Automation — public API (V1).
 */

export {
  FOUNDER_TEST_AUTOMATION_V1_PASS,
  FOUNDER_TEST_AUTOMATION_OWNER_MODULE,
  FOUNDER_TEST_AUTOMATION_PHASE,
  FOUNDER_TEST_AUTOMATION_REPORT_TITLE,
  MAX_FOUNDER_TEST_AUTOMATION_HISTORY,
  BLOCKER_PRIORITIES,
  EXECUTION_READINESS_STATES,
  RECOMMENDATION_GROUPS,
  SAFETY_GUARANTEES,
  CATEGORY_TO_RECOMMENDATION_GROUP,
} from './founder-test-automation-registry.js';

export type {
  BlockerPriority,
  ExecutionReadinessState,
  ReadinessCategory,
  RecommendationGroup,
  PrioritizedBlocker,
  ImprovementRecommendation,
  ImprovementPathStep,
  RequiredInformationRequest,
  ExecutionReadinessAnalysis,
  UpstreamChainConfidenceContext,
  ConfidenceAdjustmentReason,
  ConfidenceAdjustmentExplanation,
  FounderTestAutomationAnalysis,
  FounderTestAutomationHistoryEntry,
  FounderTestAutomationReport,
  RunFounderTestAutomationInput,
  FounderTestAutomationAssessment,
} from './founder-test-automation-types.js';

export {
  resetFounderTestAutomationHistoryForTests,
  recordFounderTestAutomationAnalysis,
  getFounderTestAutomationHistorySize,
  getFounderTestAutomationHistory,
  getFounderTestAutomationAnalyses,
  getLatestFounderTestAutomationAnalysis,
} from './founder-test-automation-history.js';

export {
  runFounderTestAutomation,
  assessFounderTestAutomation,
  buildFounderTestAutomationArtifacts,
  resetFounderTestAutomationCounterForTests,
  resetFounderTestAutomationModuleForTests,
} from './founder-test-automation-authority.js';

export {
  buildFounderTestAutomationReport,
  buildFounderTestAutomationReportMarkdown,
} from './founder-test-automation-report-builder.js';

export { prioritizeLaunchBlockers } from './launch-blocker-prioritizer.js';
export { generateImprovementRecommendations } from './recommendation-generator.js';
export { buildImprovementPath } from './improvement-path-builder.js';
export {
  analyzeExecutionReadiness,
  detectRequiredInformationRequests,
  mapReadinessCategory,
} from './execution-readiness-analyzer.js';
export {
  buildUpstreamChainConfidenceFromSimulationContext,
  computeUpstreamConfidenceAnchor,
  computeUpstreamReadinessAnchor,
  computeJustifiedConfidenceAdjustments,
  computePropagatedReadinessScore,
  detectUnjustifiedReadinessDrop,
  hasUpstreamChainContext,
  computeLegacySweepConfidenceAnchor,
  applyGateReadinessCap,
} from './confidence-propagation-repair.js';
