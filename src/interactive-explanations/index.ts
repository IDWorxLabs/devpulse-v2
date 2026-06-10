/**
 * Interactive Explanations — public exports.
 */

import { resetInteractiveExplanationsRegistryForTests } from './interactive-explanations-registry.js';
import { resetInteractiveExplanationsCacheForTests } from './interactive-explanations-cache.js';
import { resetSystemExplanationAnalyzerForTests } from './system-explanation-analyzer.js';
import { resetWorkflowExplanationAnalyzerForTests } from './workflow-explanation-analyzer.js';
import { resetReasoningExplanationAnalyzerForTests } from './reasoning-explanation-analyzer.js';
import { resetReportInterpretationAnalyzerForTests } from './report-interpretation-analyzer.js';
import { resetNextStepGuidanceAnalyzerForTests } from './next-step-guidance-analyzer.js';
import { resetInteractiveExplanationsAuthorityBuilderForTests } from './interactive-explanations-authority-builder.js';
import { resetInteractiveExplanationsEvaluatorForTests } from './interactive-explanations-evaluator.js';
import { resetInteractiveExplanationsHistoryForTests } from './interactive-explanations-history.js';
import { resetInteractiveExplanationsReportingForTests } from './interactive-explanations-reporting.js';
import { resetInteractiveExplanationsOrchestrationForTests } from './interactive-explanations.js';

export {
  INTERACTIVE_EXPLANATIONS_PASS_TOKEN,
  INTERACTIVE_EXPLANATIONS_OWNER_MODULE,
  DEFAULT_MAX_INTERACTIVE_EXPLANATIONS_HISTORY_SIZE,
  INTERACTIVE_EXPLANATIONS_QUESTION_SIGNALS,
  isInteractiveExplanationsQuestion,
  resolveExplanationCoverageLevel,
  resolveExplanationState,
} from './interactive-explanations-types.js';

export type {
  ExplanationCoverageLevel,
  ExplanationState,
  InteractiveExplanationRecord,
  SystemExplanationAnalysis,
  WorkflowExplanationAnalysis,
  ReasoningExplanationAnalysis,
  ReportInterpretationAnalysis,
  NextStepGuidanceAnalysis,
  UnifiedInteractiveExplanationsAuthority,
  InteractiveExplanationsEvaluation,
  InteractiveExplanationsHistoryEntry,
  InteractiveExplanationsReport,
  InteractiveExplanationsInput,
  InteractiveExplanationsResult,
  InteractiveExplanationsRuntimeReport,
} from './interactive-explanations-types.js';

export {
  getInteractiveExplanationsCacheStats,
  resetInteractiveExplanationsCacheForTests,
} from './interactive-explanations-cache.js';

export {
  registerInteractiveExplanationRecord,
  getInteractiveExplanationRecord,
  lookupInteractiveExplanationByProjectId,
  lookupInteractiveExplanationByWorkspaceId,
  lookupInteractiveExplanationByCoverageLevel,
  lookupInteractiveExplanationByState,
  listInteractiveExplanationRecords,
  getInteractiveExplanationRecordCount,
  resetInteractiveExplanationsRegistryForTests,
} from './interactive-explanations-registry.js';

export {
  analyzeSystemExplanation,
  getSystemAnalysisCount,
  listBaseSystemAreas,
  resetSystemExplanationAnalyzerForTests,
} from './system-explanation-analyzer.js';

export type { SystemExplanationSnapshot } from './system-explanation-analyzer.js';

export {
  analyzeWorkflowExplanation,
  getWorkflowAnalysisCount,
  listBaseWorkflowAreas,
  resetWorkflowExplanationAnalyzerForTests,
} from './workflow-explanation-analyzer.js';

export type { WorkflowExplanationSnapshot } from './workflow-explanation-analyzer.js';

export {
  analyzeReasoningExplanation,
  getReasoningAnalysisCount,
  listBaseReasoningAreas,
  resetReasoningExplanationAnalyzerForTests,
} from './reasoning-explanation-analyzer.js';

export type { ReasoningExplanationSnapshot } from './reasoning-explanation-analyzer.js';

export {
  analyzeReportInterpretation,
  getReportAnalysisCount,
  listBaseReportAreas,
  resetReportInterpretationAnalyzerForTests,
} from './report-interpretation-analyzer.js';

export type { ReportInterpretationSnapshot } from './report-interpretation-analyzer.js';

export {
  analyzeNextStepGuidance,
  getGuidanceAnalysisCount,
  listBaseGuidanceAreas,
  resetNextStepGuidanceAnalyzerForTests,
} from './next-step-guidance-analyzer.js';

export type { NextStepGuidanceSnapshot } from './next-step-guidance-analyzer.js';

export {
  buildUnifiedInteractiveExplanationsAuthority,
  getAuthorityBuildCount,
  resetInteractiveExplanationsAuthorityBuilderForTests,
} from './interactive-explanations-authority-builder.js';

export {
  evaluateInteractiveExplanations,
  getEvaluationCount,
  resetInteractiveExplanationsEvaluatorForTests,
} from './interactive-explanations-evaluator.js';

export {
  recordInteractiveExplanationsHistory,
  getInteractiveExplanationsHistory,
  getInteractiveExplanationsHistorySize,
  clearInteractiveExplanationsHistory,
  resetInteractiveExplanationsHistoryForTests,
} from './interactive-explanations-history.js';

export {
  generateInteractiveExplanationsReport,
  getReportCount,
  resetInteractiveExplanationsReportingForTests,
} from './interactive-explanations-reporting.js';

export {
  getDevPulseV2InteractiveExplanations,
  registerInteractiveExplanationsWithCentralBrain,
  registerInteractiveExplanationsWithSelfDocumentation,
  registerInteractiveExplanationsWithFounderGuides,
  registerInteractiveExplanationsWithUserGuides,
  registerInteractiveExplanationsWithArchitectureDocumentation,
  registerInteractiveExplanationsWithApiDocumentation,
  registerInteractiveExplanationsWithFoundation,
  registerInteractiveExplanationsWithCapabilityRegistry,
  registerInteractiveExplanationsWithFindPanel,
  registerInteractiveExplanationsWithUvl,
  registerInteractiveExplanationsWithUnifiedTrustScore,
  registerInteractiveExplanationsWithTrustEngineCheckpoint,
  registerInteractiveExplanationsWithProductHardeningCheckpoint,
  registerInteractiveExplanationsWithWorld2,
  registerInteractiveExplanationsWithMobileCommand,
  registerInteractiveExplanationsWithCloudWorkerRuntime,
  registerInteractiveExplanationsWithSelfEvolutionGovernance,
  registerInteractiveExplanationsWithMissingCapabilityEscalation,
  registerInteractiveExplanationsWithProjectVault,
  evaluateInteractiveExplanationsEngine,
  getInteractiveExplanationsRuntimeReport,
} from './interactive-explanations.js';

export type { InteractiveExplanationsSystemSnapshot } from './interactive-explanations.js';

export function resetInteractiveExplanationsForTests(): void {
  resetInteractiveExplanationsRegistryForTests();
  resetInteractiveExplanationsCacheForTests();
  resetSystemExplanationAnalyzerForTests();
  resetWorkflowExplanationAnalyzerForTests();
  resetReasoningExplanationAnalyzerForTests();
  resetReportInterpretationAnalyzerForTests();
  resetNextStepGuidanceAnalyzerForTests();
  resetInteractiveExplanationsAuthorityBuilderForTests();
  resetInteractiveExplanationsEvaluatorForTests();
  resetInteractiveExplanationsHistoryForTests();
  resetInteractiveExplanationsReportingForTests();
  resetInteractiveExplanationsOrchestrationForTests();
}
