/**
 * Completion Truth Engine — public exports.
 */

import { resetCompletionTruthRegistryForTests } from './completion-truth-registry.js';
import { resetCompletionTruthCacheForTests } from './completion-truth-cache.js';
import { resetCompletionClaimAnalyzerForTests } from './completion-claim-analyzer.js';
import { resetCompletionEvidenceValidatorForTests } from './completion-evidence-validator.js';
import { resetCompletionRealityValidatorForTests } from './completion-reality-validator.js';
import { resetFalseCompletionDetectorForTests } from './false-completion-detector.js';
import { resetCompletionConsistencyAnalyzerForTests } from './completion-consistency-analyzer.js';
import { resetCompletionGapAnalyzerForTests } from './completion-gap-analyzer.js';
import { resetCompletionTruthAuthorityBuilderForTests } from './completion-truth-authority-builder.js';
import { resetCompletionTruthEvaluatorForTests } from './completion-truth-evaluator.js';
import { resetCompletionTruthHistoryForTests } from './completion-truth-history.js';
import { resetCompletionTruthReportingForTests } from './completion-truth-reporting.js';
import { resetCompletionTruthEngineForTests } from './completion-truth-engine.js';
import { resetRealityVerificationExpansionModuleForTests } from '../reality-verification-expansion/index.js';

export {
  COMPLETION_TRUTH_ENGINE_PASS_TOKEN,
  COMPLETION_TRUTH_ENGINE_OWNER_MODULE,
  DEFAULT_MAX_COMPLETION_TRUTH_HISTORY_SIZE,
  COMPLETION_TRUTH_QUESTION_SIGNALS,
  isCompletionTruthEngineQuestion,
} from './completion-truth-types.js';

export type {
  CompletionTruthState,
  CompletionTruthDecision,
  CompletionClaimType,
  FalseCompletionState,
  RawCompletionClaimInput,
  RawCompletionEvidenceInput,
  RawCompletionRealityInput,
  CompletionClaimAnalysis,
  CompletionEvidenceValidation,
  CompletionRealityValidation,
  FalseCompletionDetection,
  CompletionConsistencyScores,
  CompletionGap,
  UnifiedCompletionTruthAuthority,
  CompletionTruthEvaluation,
  CompletionTruthRecord,
  CompletionTruthHistoryEntry,
  CompletionTruthReport,
  CompletionTruthInput,
  CompletionTruthResult,
  CompletionTruthRuntimeReport,
} from './completion-truth-types.js';

export { getCompletionTruthCacheStats, resetCompletionTruthCacheForTests } from './completion-truth-cache.js';

export {
  registerCompletionTruthRecord,
  getCompletionTruthRecord,
  getCompletionTruthByAuthorityId,
  lookupCompletionTruthByProjectId,
  lookupCompletionTruthByWorkspaceId,
  lookupCompletionTruthByStatus,
  listCompletionTruthRecords,
  getCompletionTruthRecordCount,
  resetCompletionTruthRegistryForTests,
} from './completion-truth-registry.js';

export {
  analyzeCompletionClaim,
  analyzeCompletionClaims,
  getClaimAnalysisCount,
  resetCompletionClaimAnalyzerForTests,
} from './completion-claim-analyzer.js';

export {
  validateCompletionEvidence,
  getEvidenceValidationCount,
  resetCompletionEvidenceValidatorForTests,
} from './completion-evidence-validator.js';

export {
  validateCompletionReality,
  getRealityValidationCount,
  resetCompletionRealityValidatorForTests,
} from './completion-reality-validator.js';

export {
  detectFalseCompletion,
  getFalseCompletionDetectionCount,
  resetFalseCompletionDetectorForTests,
} from './false-completion-detector.js';

export {
  analyzeCompletionConsistency,
  getConsistencyAnalysisCount,
  resetCompletionConsistencyAnalyzerForTests,
} from './completion-consistency-analyzer.js';

export {
  analyzeCompletionGaps,
  getGapAnalysisCount,
  resetCompletionGapAnalyzerForTests,
} from './completion-gap-analyzer.js';

export {
  buildUnifiedCompletionTruthAuthority,
  getAuthorityBuildCount,
  resetCompletionTruthAuthorityBuilderForTests,
} from './completion-truth-authority-builder.js';

export {
  evaluateCompletionTruth,
  getEvaluationCount,
  resetCompletionTruthEvaluatorForTests,
} from './completion-truth-evaluator.js';

export {
  recordCompletionTruthHistory,
  getCompletionTruthHistory,
  getCompletionTruthHistorySize,
  clearCompletionTruthHistory,
  resetCompletionTruthHistoryForTests,
} from './completion-truth-history.js';

export {
  generateCompletionTruthReport,
  getReportCount,
  resetCompletionTruthReportingForTests,
} from './completion-truth-reporting.js';

export {
  getDevPulseV2CompletionTruthEngine,
  registerCompletionTruthEngineWithCentralBrain,
  registerCompletionTruthEngineWithUnifiedTrustRuntime,
  registerCompletionTruthEngineWithEvidenceIntelligence,
  registerCompletionTruthEngineWithRealityVerification,
  registerCompletionTruthEngineWithTrustEngine,
  registerCompletionTruthEngineWithAutonomousVerification,
  registerCompletionTruthEngineWithCompletionEngine,
  registerCompletionTruthEngineWithMultiProjectVerification,
  registerCompletionTruthEngineWithMultiProjectMonitoring,
  registerCompletionTruthEngineWithSelfEvolutionGovernance,
  registerCompletionTruthEngineWithWorld2,
  registerCompletionTruthEngineWithUvl,
  evaluateCompletionTruthEngine,
  getCompletionTruthEngineRuntimeReport,
  resetCompletionTruthEngineForTests,
} from './completion-truth-engine.js';

export type { CompletionTruthEngineSystemSnapshot } from './completion-truth-engine.js';

export function resetCompletionTruthEngineModuleForTests(): void {
  resetCompletionTruthRegistryForTests();
  resetCompletionTruthCacheForTests();
  resetCompletionClaimAnalyzerForTests();
  resetCompletionEvidenceValidatorForTests();
  resetCompletionRealityValidatorForTests();
  resetFalseCompletionDetectorForTests();
  resetCompletionConsistencyAnalyzerForTests();
  resetCompletionGapAnalyzerForTests();
  resetCompletionTruthAuthorityBuilderForTests();
  resetCompletionTruthEvaluatorForTests();
  resetCompletionTruthHistoryForTests();
  resetCompletionTruthReportingForTests();
  resetCompletionTruthEngineForTests();
  resetRealityVerificationExpansionModuleForTests();
}
