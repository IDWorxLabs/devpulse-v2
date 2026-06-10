/**
 * Founder Acceptance Orchestrator — public exports.
 */

import { resetFounderAcceptanceRegistryForTests } from './founder-acceptance-registry.js';
import { resetFounderAcceptanceCacheForTests } from './founder-acceptance-cache.js';
import { resetAcceptanceGapCounterForTests } from './acceptance-gap-model.js';
import { resetAcceptanceAggregationBuilderForTests } from './acceptance-aggregation-builder.js';
import { resetAuthorityConflictDetectorForTests } from './authority-conflict-detector.js';
import { resetAcceptanceBlockerAnalyzerForTests } from './acceptance-blocker-analyzer.js';
import { resetFounderAcceptanceAnalyzerForTests } from './founder-acceptance-analyzer.js';
import { resetReadinessAcceptanceAnalyzerForTests } from './readiness-acceptance-analyzer.js';
import { resetFrictionImpactAnalyzerForTests } from './friction-impact-analyzer.js';
import { resetAcceptanceGapAnalyzerForTests } from './acceptance-gap-analyzer.js';
import { resetAcceptanceRoadmapBuilderForTests } from './acceptance-roadmap-builder.js';
import { resetFounderAcceptanceAuthorityBuilderForTests } from './founder-acceptance-authority-builder.js';
import { resetFounderAcceptanceEvaluatorForTests } from './founder-acceptance-evaluator.js';
import { resetFounderAcceptanceHistoryForTests } from './bounded-history.js';
import { resetFounderAcceptanceReportBuilderForTests } from './founder-acceptance-report-builder.js';
import { resetFounderAcceptanceOrchestrationForTests } from './founder-acceptance-orchestrator.js';

export {
  FOUNDER_ACCEPTANCE_ORCHESTRATOR_PASS_TOKEN,
  FOUNDER_ACCEPTANCE_ORCHESTRATOR_PASS,
  FOUNDER_ACCEPTANCE_ORCHESTRATOR_OWNER_MODULE,
  DEFAULT_MAX_FOUNDER_ACCEPTANCE_HISTORY_SIZE,
  MAX_ACCEPTANCE_GAPS,
  ACCEPTANCE_AGGREGATION_PASS,
  AUTHORITY_CONFLICT_PASS,
  ACCEPTANCE_BLOCKER_PASS,
  FOUNDER_ACCEPTANCE_PASS,
  READINESS_ACCEPTANCE_PASS,
  FRICTION_ACCEPTANCE_PASS,
  ACCEPTANCE_GAP_ANALYSIS_PASS,
  FINAL_VERDICT_PASS,
  ACCEPTANCE_ROADMAP_PASS,
  FOUNDER_ACCEPTANCE_REPORTING_PASS,
  FOUNDER_ACCEPTANCE_QUESTION_SIGNALS,
  isFounderAcceptanceQuestion,
  resolveFounderAcceptanceResult,
  resolveFounderAcceptanceVerdict,
  clampScore,
} from './founder-acceptance-orchestrator-types.js';

export type {
  FounderAcceptanceResult,
  AcceptanceGapSeverity,
  ConflictSeverity,
  FounderAcceptanceVerdict,
  AcceptanceGap,
  FounderAcceptanceAggregate,
  AuthorityConflict,
  AuthorityConflictAnalysis,
  AcceptanceBlocker,
  AcceptanceBlockerAnalysis,
  AcceptanceAnalyzerResult,
  FounderAcceptanceAnalysis,
  ReadinessAcceptanceAnalysis,
  FrictionAcceptanceImpactAnalysis,
  AcceptanceGapAnalysis,
  FounderAcceptanceRoadmap,
  FinalVerdict,
  FounderAcceptanceAuthority,
  FounderAcceptanceScore,
  FounderAcceptanceRecord,
  FounderAcceptanceEvaluation,
  FounderAcceptanceReport,
  FounderAcceptanceOrchestratorInput,
  FounderAcceptanceResultBundle,
  FounderAcceptanceRuntimeReport,
} from './founder-acceptance-orchestrator-types.js';

export {
  createAcceptanceGap,
  boundGaps,
  mergeBoundedGaps,
  countCriticalGaps,
  MAX_GAPS_PER_ANALYZER,
  resetAcceptanceGapCounterForTests,
} from './acceptance-gap-model.js';

export { getFounderAcceptanceCacheStats, resetFounderAcceptanceCacheForTests } from './founder-acceptance-cache.js';

export {
  registerFounderAcceptanceRecord,
  getFounderAcceptanceRecord,
  lookupFounderAcceptanceByProjectId,
  listFounderAcceptanceRecords,
  getFounderAcceptanceRecordCount,
  resetFounderAcceptanceRegistryForTests,
} from './founder-acceptance-registry.js';

export {
  buildFounderAcceptanceAggregate,
  getAggregateBuildCount,
  resetAcceptanceAggregationBuilderForTests,
} from './acceptance-aggregation-builder.js';
export type { AcceptanceAggregationUpstream } from './acceptance-aggregation-builder.js';

export {
  detectAuthorityConflicts,
  getConflictDetectCount,
  resetAuthorityConflictDetectorForTests,
} from './authority-conflict-detector.js';
export type { AuthorityConflictUpstream } from './authority-conflict-detector.js';

export {
  analyzeAcceptanceBlockers,
  getAcceptanceBlockerAnalyzeCount,
  resetAcceptanceBlockerAnalyzerForTests,
} from './acceptance-blocker-analyzer.js';
export type { AcceptanceBlockerUpstream } from './acceptance-blocker-analyzer.js';

export {
  analyzeFounderAcceptance,
  getFounderAcceptanceAnalyzeCount,
  resetFounderAcceptanceAnalyzerForTests,
} from './founder-acceptance-analyzer.js';
export type { FounderAcceptanceUpstream } from './founder-acceptance-analyzer.js';

export {
  analyzeReadinessAcceptance,
  getReadinessAcceptanceAnalyzeCount,
  resetReadinessAcceptanceAnalyzerForTests,
} from './readiness-acceptance-analyzer.js';
export type { ReadinessAcceptanceUpstream } from './readiness-acceptance-analyzer.js';

export {
  analyzeFrictionAcceptanceImpact,
  getFrictionImpactAnalyzeCount,
  resetFrictionImpactAnalyzerForTests,
} from './friction-impact-analyzer.js';
export type { FrictionImpactUpstream } from './friction-impact-analyzer.js';

export {
  analyzeAcceptanceGaps,
  getGapAnalysisCount,
  resetAcceptanceGapAnalyzerForTests,
} from './acceptance-gap-analyzer.js';

export {
  buildFounderAcceptanceRoadmap,
  getRoadmapBuildCount,
  resetAcceptanceRoadmapBuilderForTests,
} from './acceptance-roadmap-builder.js';

export {
  buildFounderAcceptanceAuthority,
  buildFinalVerdict,
  getAuthorityBuildCount,
  resetFounderAcceptanceAuthorityBuilderForTests,
} from './founder-acceptance-authority-builder.js';

export {
  buildFounderAcceptanceScore,
  evaluateFounderAcceptance,
  getEvaluationCount,
  resetFounderAcceptanceEvaluatorForTests,
} from './founder-acceptance-evaluator.js';

export {
  recordFounderAcceptanceHistory,
  getFounderAcceptanceHistory,
  getFounderAcceptanceHistorySize,
  clearFounderAcceptanceHistory,
  resetFounderAcceptanceHistoryForTests,
} from './bounded-history.js';

export {
  generateFounderAcceptanceReport,
  getReportCount,
  resetFounderAcceptanceReportBuilderForTests,
} from './founder-acceptance-report-builder.js';

export {
  getDevPulseV2FounderAcceptanceOrchestrator,
  registerFounderAcceptanceOrchestratorWithSurface,
  registerFounderAcceptanceOrchestratorWithFoundation,
  registerFounderAcceptanceOrchestratorWithCapabilityRegistry,
  registerFounderAcceptanceOrchestratorWithFindPanel,
  registerFounderAcceptanceOrchestratorWithUvl,
  registerFounderAcceptanceOrchestratorWithAcceptanceChain,
  evaluateFounderAcceptanceOrchestrator,
  getFounderAcceptanceOrchestratorRuntimeReport,
} from './founder-acceptance-orchestrator.js';

export type { FounderAcceptanceSurfaceSnapshot } from './founder-acceptance-orchestrator.js';

export function resetFounderAcceptanceOrchestratorForTests(): void {
  resetFounderAcceptanceRegistryForTests();
  resetFounderAcceptanceCacheForTests();
  resetAcceptanceGapCounterForTests();
  resetAcceptanceAggregationBuilderForTests();
  resetAuthorityConflictDetectorForTests();
  resetAcceptanceBlockerAnalyzerForTests();
  resetFounderAcceptanceAnalyzerForTests();
  resetReadinessAcceptanceAnalyzerForTests();
  resetFrictionImpactAnalyzerForTests();
  resetAcceptanceGapAnalyzerForTests();
  resetAcceptanceRoadmapBuilderForTests();
  resetFounderAcceptanceAuthorityBuilderForTests();
  resetFounderAcceptanceEvaluatorForTests();
  resetFounderAcceptanceHistoryForTests();
  resetFounderAcceptanceReportBuilderForTests();
  resetFounderAcceptanceOrchestrationForTests();
}
