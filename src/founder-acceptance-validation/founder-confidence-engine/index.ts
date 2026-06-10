/**
 * Founder Confidence Engine — public exports.
 */

import { resetFounderConfidenceRegistryForTests } from './founder-confidence-registry.js';
import { resetFounderConfidenceCacheForTests } from './founder-confidence-cache.js';
import { resetConfidenceGapCounterForTests } from './confidence-gap-model.js';
import { resetConfidenceContextBuilderForTests } from './confidence-context-builder.js';
import { resetUnderstandingConfidenceValidatorForTests } from './understanding-confidence-validator.js';
import { resetReasoningVisibilityValidatorForTests } from './reasoning-visibility-validator.js';
import { resetProgressTruthValidatorForTests } from './progress-truth-validator.js';
import { resetNextStepConfidenceValidatorForTests } from './next-step-confidence-validator.js';
import { resetDecisionConfidenceValidatorForTests } from './decision-confidence-validator.js';
import { resetUncertaintyHonestyValidatorForTests } from './uncertainty-honesty-validator.js';
import { resetFounderControlConfidenceValidatorForTests } from './founder-control-confidence-validator.js';
import { resetConfidenceGapAnalyzerForTests } from './confidence-gap-analyzer.js';
import { resetConfidenceRoadmapBuilderForTests } from './confidence-roadmap-builder.js';
import { resetFounderConfidenceAuthorityBuilderForTests } from './founder-confidence-authority-builder.js';
import { resetFounderConfidenceEvaluatorForTests } from './founder-confidence-evaluator.js';
import { resetFounderConfidenceHistoryForTests } from './bounded-history.js';
import { resetFounderConfidenceReportBuilderForTests } from './founder-confidence-report-builder.js';
import { resetFounderConfidenceEngineOrchestrationForTests } from './founder-confidence-engine.js';

export {
  FOUNDER_CONFIDENCE_ENGINE_PASS_TOKEN,
  FOUNDER_CONFIDENCE_ENGINE_PASS,
  FOUNDER_CONFIDENCE_OWNER_MODULE,
  DEFAULT_MAX_FOUNDER_CONFIDENCE_HISTORY_SIZE,
  MAX_CONFIDENCE_GAPS,
  CONFIDENCE_CONTEXT_PASS,
  UNDERSTANDING_CONFIDENCE_PASS,
  REASONING_VISIBILITY_PASS,
  PROGRESS_TRUTH_PASS,
  NEXT_STEP_CONFIDENCE_PASS,
  DECISION_CONFIDENCE_PASS,
  UNCERTAINTY_HONESTY_PASS,
  FOUNDER_CONTROL_CONFIDENCE_PASS,
  CONFIDENCE_GAP_ANALYSIS_PASS,
  CONFIDENCE_ROADMAP_PASS,
  FOUNDER_CONFIDENCE_REPORTING_PASS,
  FOUNDER_CONFIDENCE_QUESTION_SIGNALS,
  isFounderConfidenceQuestion,
  resolveFounderConfidenceResult,
  clampScore,
} from './founder-confidence-types.js';

export type {
  FounderConfidenceResult,
  ConfidenceGapSeverity,
  ConfidenceContextId,
  ConfidenceContext,
  ConfidenceGap,
  ConfidenceValidatorResult,
  UnderstandingConfidenceValidation,
  ReasoningVisibilityValidation,
  ProgressTruthValidation,
  NextStepConfidenceValidation,
  DecisionConfidenceValidation,
  UncertaintyHonestyValidation,
  FounderControlConfidenceValidation,
  ConfidenceGapAnalysis,
  FounderConfidenceRoadmap,
  FounderConfidenceAuthority,
  FounderConfidenceScore,
  FounderConfidenceRecord,
  FounderConfidenceEvaluation,
  FounderConfidenceReport,
  FounderConfidenceEngineInput,
  FounderConfidenceResultBundle,
  FounderConfidenceRuntimeReport,
} from './founder-confidence-types.js';

export {
  createConfidenceGap,
  boundGaps,
  mergeBoundedGaps,
  countCriticalGaps,
  MAX_GAPS_PER_VALIDATOR,
  resetConfidenceGapCounterForTests,
} from './confidence-gap-model.js';

export { getFounderConfidenceCacheStats, resetFounderConfidenceCacheForTests } from './founder-confidence-cache.js';

export {
  registerFounderConfidenceRecord,
  getFounderConfidenceRecord,
  lookupFounderConfidenceByProjectId,
  listFounderConfidenceRecords,
  getFounderConfidenceRecordCount,
  resetFounderConfidenceRegistryForTests,
} from './founder-confidence-registry.js';

export {
  buildConfidenceContext,
  buildAllConfidenceContexts,
  listConfidenceContextIds,
  getContextBuildCount,
  resetConfidenceContextBuilderForTests,
} from './confidence-context-builder.js';

export {
  validateUnderstandingConfidence,
  getUnderstandingValidateCount,
  resetUnderstandingConfidenceValidatorForTests,
} from './understanding-confidence-validator.js';
export type { UnderstandingConfidenceUpstream } from './understanding-confidence-validator.js';

export {
  validateReasoningVisibility,
  getReasoningValidateCount,
  resetReasoningVisibilityValidatorForTests,
} from './reasoning-visibility-validator.js';
export type { ReasoningVisibilityUpstream } from './reasoning-visibility-validator.js';

export {
  validateProgressTruth,
  getProgressTruthValidateCount,
  resetProgressTruthValidatorForTests,
} from './progress-truth-validator.js';
export type { ProgressTruthUpstream } from './progress-truth-validator.js';

export {
  validateNextStepConfidence,
  getNextStepValidateCount,
  resetNextStepConfidenceValidatorForTests,
} from './next-step-confidence-validator.js';
export type { NextStepConfidenceUpstream } from './next-step-confidence-validator.js';

export {
  validateDecisionConfidence,
  getDecisionValidateCount,
  resetDecisionConfidenceValidatorForTests,
} from './decision-confidence-validator.js';
export type { DecisionConfidenceUpstream } from './decision-confidence-validator.js';

export {
  validateUncertaintyHonesty,
  getUncertaintyValidateCount,
  resetUncertaintyHonestyValidatorForTests,
} from './uncertainty-honesty-validator.js';
export type { UncertaintyHonestyUpstream } from './uncertainty-honesty-validator.js';

export {
  validateFounderControlConfidence,
  getControlValidateCount,
  resetFounderControlConfidenceValidatorForTests,
} from './founder-control-confidence-validator.js';
export type { FounderControlConfidenceUpstream } from './founder-control-confidence-validator.js';

export {
  analyzeConfidenceGaps,
  getGapAnalysisCount,
  resetConfidenceGapAnalyzerForTests,
} from './confidence-gap-analyzer.js';

export {
  buildFounderConfidenceRoadmap,
  getRoadmapBuildCount,
  resetConfidenceRoadmapBuilderForTests,
} from './confidence-roadmap-builder.js';

export {
  buildFounderConfidenceAuthority,
  getAuthorityBuildCount,
  resetFounderConfidenceAuthorityBuilderForTests,
} from './founder-confidence-authority-builder.js';

export {
  buildFounderConfidenceScore,
  evaluateFounderConfidence,
  getEvaluationCount,
  resetFounderConfidenceEvaluatorForTests,
} from './founder-confidence-evaluator.js';

export {
  recordFounderConfidenceHistory,
  getFounderConfidenceHistory,
  getFounderConfidenceHistorySize,
  clearFounderConfidenceHistory,
  resetFounderConfidenceHistoryForTests,
} from './bounded-history.js';

export {
  generateFounderConfidenceReport,
  getReportCount,
  resetFounderConfidenceReportBuilderForTests,
} from './founder-confidence-report-builder.js';

export {
  getDevPulseV2FounderConfidenceEngine,
  registerFounderConfidenceEngineWithSurface,
  registerFounderConfidenceEngineWithFoundation,
  registerFounderConfidenceEngineWithCapabilityRegistry,
  registerFounderConfidenceEngineWithFindPanel,
  registerFounderConfidenceEngineWithUvl,
  registerFounderConfidenceEngineWithAcceptanceChain,
  evaluateFounderConfidenceEngine,
  getFounderConfidenceEngineRuntimeReport,
} from './founder-confidence-engine.js';

export type { FounderConfidenceSurfaceSnapshot } from './founder-confidence-engine.js';

export function resetFounderConfidenceEngineForTests(): void {
  resetFounderConfidenceRegistryForTests();
  resetFounderConfidenceCacheForTests();
  resetConfidenceGapCounterForTests();
  resetConfidenceContextBuilderForTests();
  resetUnderstandingConfidenceValidatorForTests();
  resetReasoningVisibilityValidatorForTests();
  resetProgressTruthValidatorForTests();
  resetNextStepConfidenceValidatorForTests();
  resetDecisionConfidenceValidatorForTests();
  resetUncertaintyHonestyValidatorForTests();
  resetFounderControlConfidenceValidatorForTests();
  resetConfidenceGapAnalyzerForTests();
  resetConfidenceRoadmapBuilderForTests();
  resetFounderConfidenceAuthorityBuilderForTests();
  resetFounderConfidenceEvaluatorForTests();
  resetFounderConfidenceHistoryForTests();
  resetFounderConfidenceReportBuilderForTests();
  resetFounderConfidenceEngineOrchestrationForTests();
}
