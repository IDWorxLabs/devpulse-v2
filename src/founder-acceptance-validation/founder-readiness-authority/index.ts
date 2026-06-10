/**
 * Founder Readiness Authority — public exports.
 */

import { resetFounderReadinessRegistryForTests } from './founder-readiness-registry.js';
import { resetFounderReadinessCacheForTests } from './founder-readiness-cache.js';
import { resetReadinessGapCounterForTests } from './readiness-gap-model.js';
import { resetReadinessContextBuilderForTests } from './readiness-context-builder.js';
import { resetWorkflowReadinessAnalyzerForTests } from './workflow-readiness-analyzer.js';
import { resetConfidenceReadinessAnalyzerForTests } from './confidence-readiness-analyzer.js';
import { resetTrustReadinessAnalyzerForTests } from './trust-readiness-analyzer.js';
import { resetProductivityReadinessAnalyzerForTests } from './productivity-readiness-analyzer.js';
import { resetFrictionReadinessAnalyzerForTests } from './friction-readiness-analyzer.js';
import { resetReadinessBlockerAnalyzerForTests } from './readiness-blocker-analyzer.js';
import { resetReadinessGapAnalyzerForTests } from './readiness-gap-analyzer.js';
import { resetReadinessRoadmapBuilderForTests } from './readiness-roadmap-builder.js';
import { resetFounderReadinessAuthorityBuilderForTests } from './founder-readiness-authority-builder.js';
import { resetFounderReadinessEvaluatorForTests } from './founder-readiness-evaluator.js';
import { resetFounderReadinessHistoryForTests } from './bounded-history.js';
import { resetFounderReadinessReportBuilderForTests } from './founder-readiness-report-builder.js';
import { resetFounderReadinessAuthorityOrchestrationForTests } from './founder-readiness-authority.js';

export {
  FOUNDER_READINESS_AUTHORITY_PASS_TOKEN,
  FOUNDER_READINESS_AUTHORITY_PASS,
  FOUNDER_READINESS_OWNER_MODULE,
  DEFAULT_MAX_FOUNDER_READINESS_HISTORY_SIZE,
  MAX_READINESS_GAPS,
  READINESS_CONTEXT_PASS,
  WORKFLOW_READINESS_PASS,
  CONFIDENCE_READINESS_PASS,
  TRUST_READINESS_PASS,
  PRODUCTIVITY_READINESS_PASS,
  FRICTION_READINESS_PASS,
  READINESS_BLOCKERS_PASS,
  READINESS_GAP_ANALYSIS_PASS,
  READINESS_ROADMAP_PASS,
  FOUNDER_READINESS_REPORTING_PASS,
  FOUNDER_READINESS_QUESTION_SIGNALS,
  isFounderReadinessQuestion,
  resolveFounderReadinessResult,
  resolveFounderReadinessStatus,
  clampScore,
} from './founder-readiness-types.js';

export type {
  FounderReadinessResult,
  ReadinessGapSeverity,
  FounderReadinessStatus,
  ReadinessContextId,
  ReadinessContext,
  ReadinessGap,
  ReadinessAnalyzerResult,
  WorkflowReadinessAnalysis,
  ConfidenceReadinessAnalysis,
  TrustReadinessAnalysis,
  ProductivityReadinessAnalysis,
  FrictionReadinessAnalysis,
  ReadinessBlocker,
  ReadinessBlockerAnalysis,
  ReadinessGapAnalysis,
  FounderReadinessRoadmap,
  FounderReadinessAuthority,
  FounderReadinessScore,
  FounderReadinessRecord,
  FounderReadinessEvaluation,
  FounderReadinessReport,
  FounderReadinessAuthorityInput,
  FounderReadinessResultBundle,
  FounderReadinessRuntimeReport,
} from './founder-readiness-types.js';

export {
  createReadinessGap,
  boundGaps,
  mergeBoundedGaps,
  countCriticalGaps,
  MAX_GAPS_PER_ANALYZER,
  resetReadinessGapCounterForTests,
} from './readiness-gap-model.js';

export { getFounderReadinessCacheStats, resetFounderReadinessCacheForTests } from './founder-readiness-cache.js';

export {
  registerFounderReadinessRecord,
  getFounderReadinessRecord,
  lookupFounderReadinessByProjectId,
  listFounderReadinessRecords,
  getFounderReadinessRecordCount,
  resetFounderReadinessRegistryForTests,
} from './founder-readiness-registry.js';

export {
  buildReadinessContext,
  buildAllReadinessContexts,
  listReadinessContextIds,
  getContextBuildCount,
  resetReadinessContextBuilderForTests,
} from './readiness-context-builder.js';

export {
  analyzeWorkflowReadiness,
  getWorkflowReadinessAnalyzeCount,
  resetWorkflowReadinessAnalyzerForTests,
} from './workflow-readiness-analyzer.js';
export type { WorkflowReadinessUpstream } from './workflow-readiness-analyzer.js';

export {
  analyzeConfidenceReadiness,
  getConfidenceReadinessAnalyzeCount,
  resetConfidenceReadinessAnalyzerForTests,
} from './confidence-readiness-analyzer.js';
export type { ConfidenceReadinessUpstream } from './confidence-readiness-analyzer.js';

export {
  analyzeTrustReadiness,
  getTrustReadinessAnalyzeCount,
  resetTrustReadinessAnalyzerForTests,
} from './trust-readiness-analyzer.js';
export type { TrustReadinessUpstream } from './trust-readiness-analyzer.js';

export {
  analyzeProductivityReadiness,
  getProductivityReadinessAnalyzeCount,
  resetProductivityReadinessAnalyzerForTests,
} from './productivity-readiness-analyzer.js';
export type { ProductivityReadinessUpstream } from './productivity-readiness-analyzer.js';

export {
  analyzeFrictionReadiness,
  getFrictionReadinessAnalyzeCount,
  resetFrictionReadinessAnalyzerForTests,
} from './friction-readiness-analyzer.js';
export type { FrictionReadinessUpstream } from './friction-readiness-analyzer.js';

export {
  analyzeReadinessBlockers,
  getBlockerAnalyzeCount,
  resetReadinessBlockerAnalyzerForTests,
} from './readiness-blocker-analyzer.js';
export type { ReadinessBlockerUpstream } from './readiness-blocker-analyzer.js';

export {
  analyzeReadinessGaps,
  getGapAnalysisCount,
  resetReadinessGapAnalyzerForTests,
} from './readiness-gap-analyzer.js';

export {
  buildFounderReadinessRoadmap,
  getRoadmapBuildCount,
  resetReadinessRoadmapBuilderForTests,
} from './readiness-roadmap-builder.js';

export {
  buildFounderReadinessAuthority,
  getAuthorityBuildCount,
  resetFounderReadinessAuthorityBuilderForTests,
} from './founder-readiness-authority-builder.js';

export {
  buildFounderReadinessScore,
  evaluateFounderReadiness,
  getEvaluationCount,
  resetFounderReadinessEvaluatorForTests,
} from './founder-readiness-evaluator.js';

export {
  recordFounderReadinessHistory,
  getFounderReadinessHistory,
  getFounderReadinessHistorySize,
  clearFounderReadinessHistory,
  resetFounderReadinessHistoryForTests,
} from './bounded-history.js';

export {
  generateFounderReadinessReport,
  getReportCount,
  resetFounderReadinessReportBuilderForTests,
} from './founder-readiness-report-builder.js';

export {
  getDevPulseV2FounderReadinessAuthority,
  registerFounderReadinessAuthorityWithSurface,
  registerFounderReadinessAuthorityWithFoundation,
  registerFounderReadinessAuthorityWithCapabilityRegistry,
  registerFounderReadinessAuthorityWithFindPanel,
  registerFounderReadinessAuthorityWithUvl,
  registerFounderReadinessAuthorityWithAcceptanceChain,
  evaluateFounderReadinessAuthority,
  getFounderReadinessAuthorityRuntimeReport,
} from './founder-readiness-authority.js';

export type { FounderReadinessSurfaceSnapshot } from './founder-readiness-authority.js';

export function resetFounderReadinessAuthorityForTests(): void {
  resetFounderReadinessRegistryForTests();
  resetFounderReadinessCacheForTests();
  resetReadinessGapCounterForTests();
  resetReadinessContextBuilderForTests();
  resetWorkflowReadinessAnalyzerForTests();
  resetConfidenceReadinessAnalyzerForTests();
  resetTrustReadinessAnalyzerForTests();
  resetProductivityReadinessAnalyzerForTests();
  resetFrictionReadinessAnalyzerForTests();
  resetReadinessBlockerAnalyzerForTests();
  resetReadinessGapAnalyzerForTests();
  resetReadinessRoadmapBuilderForTests();
  resetFounderReadinessAuthorityBuilderForTests();
  resetFounderReadinessEvaluatorForTests();
  resetFounderReadinessHistoryForTests();
  resetFounderReadinessReportBuilderForTests();
  resetFounderReadinessAuthorityOrchestrationForTests();
}
