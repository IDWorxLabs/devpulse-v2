/**
 * Reality Verification Expansion — public exports.
 */

import { resetRealitySourceRegistryForTests } from './reality-source-registry.js';
import { resetRealityRecordRegistryForTests } from './reality-record-registry.js';
import { resetRealityVerificationCacheForTests } from './reality-verification-cache.js';
import { resetClaimValidatorForTests } from './claim-validator.js';
import { resetEvidenceRealityMatcherForTests } from './evidence-reality-matcher.js';
import { resetRealityConsistencyAnalyzerForTests } from './reality-consistency-analyzer.js';
import { resetRealityConflictDetectorForTests } from './reality-conflict-detector.js';
import { resetRealityGapAnalyzerForTests } from './reality-gap-analyzer.js';
import { resetRealityAuthorityBuilderForTests } from './reality-authority-builder.js';
import { resetRealityVerificationEvaluatorForTests } from './reality-verification-evaluator.js';
import { resetRealityVerificationHistoryForTests } from './reality-verification-history.js';
import { resetRealityVerificationReportingForTests } from './reality-verification-reporting.js';
import { resetRealityVerificationExpansionForTests } from './reality-verification-expansion.js';
import { resetEvidenceIntelligenceModuleForTests } from '../evidence-intelligence/index.js';

export {
  REALITY_VERIFICATION_EXPANSION_PASS_TOKEN,
  REALITY_VERIFICATION_EXPANSION_OWNER_MODULE,
  DEFAULT_MAX_REALITY_VERIFICATION_HISTORY_SIZE,
  REALITY_VERIFICATION_QUESTION_SIGNALS,
  isRealityVerificationExpansionQuestion,
} from './reality-verification-types.js';

export type {
  RealitySourceId,
  RealityClaimType,
  ClaimSupportStatus,
  RealityCategory,
  RealityVerificationState,
  RealityRecordStatus,
  RealitySourceRegistration,
  RawRealityClaimInput,
  RawRealityEvidenceInput,
  RealityRecord,
  ClaimValidation,
  RealityConsistencyScores,
  RealityConflict,
  RealityGap,
  UnifiedRealityAuthority,
  RealityVerificationEvaluation,
  RealityVerificationRecord,
  RealityVerificationHistoryEntry,
  RealityVerificationReport,
  RealityVerificationInput,
  RealityVerificationResult,
  RealityVerificationRuntimeReport,
} from './reality-verification-types.js';

export {
  registerRealitySource,
  getRealitySource,
  listRealitySources,
  getRealitySourceCount,
  isKnownRealitySource,
  listKnownRealitySourceIds,
  resetRealitySourceRegistryForTests,
} from './reality-source-registry.js';

export {
  registerRealityRecord,
  registerRealityRecords,
  getRealityRecord,
  listRealityRecords,
  getRealityRecordCount,
  lookupRealityBySource,
  lookupRealityByProject,
  lookupRealityByWorkspace,
  lookupRealityByCategory,
  lookupRealityByStatus,
  lookupRealityByVerificationState,
  resetRealityRecordRegistryForTests,
} from './reality-record-registry.js';

export {
  validateClaim,
  validateClaims,
  validateClaimsFromRecords,
  getClaimValidationCount,
  resetClaimValidatorForTests,
} from './claim-validator.js';

export {
  matchEvidenceToReality,
  matchRecordsToEvidence,
  getMatchingCount,
  resetEvidenceRealityMatcherForTests,
} from './evidence-reality-matcher.js';
export type { RealityMatchResult } from './evidence-reality-matcher.js';

export {
  analyzeRealityConsistency,
  getConsistencyAnalysisCount,
  resetRealityConsistencyAnalyzerForTests,
} from './reality-consistency-analyzer.js';

export {
  detectRealityConflicts,
  getConflictDetectionCount,
  resetRealityConflictDetectorForTests,
} from './reality-conflict-detector.js';

export {
  analyzeRealityGaps,
  getGapAnalysisCount,
  resetRealityGapAnalyzerForTests,
} from './reality-gap-analyzer.js';

export {
  buildUnifiedRealityAuthority,
  getAuthorityBuildCount,
  resetRealityAuthorityBuilderForTests,
} from './reality-authority-builder.js';

export {
  evaluateRealityVerification,
  getEvaluationCount,
  resetRealityVerificationEvaluatorForTests,
} from './reality-verification-evaluator.js';

export {
  recordRealityVerificationHistory,
  getRealityVerificationHistory,
  getRealityVerificationHistorySize,
  clearRealityVerificationHistory,
  resetRealityVerificationHistoryForTests,
} from './reality-verification-history.js';

export {
  generateRealityVerificationReport,
  getReportCount,
  resetRealityVerificationReportingForTests,
} from './reality-verification-reporting.js';

export { getRealityVerificationCacheStats, resetRealityVerificationCacheForTests } from './reality-verification-cache.js';

export {
  getDevPulseV2RealityVerificationExpansion,
  registerRealityVerificationExpansionWithCentralBrain,
  registerRealityVerificationExpansionWithEvidenceIntelligence,
  registerRealityVerificationExpansionWithUnifiedTrustRuntime,
  registerRealityVerificationExpansionWithTrustEngine,
  registerRealityVerificationExpansionWithAutonomousVerification,
  registerRealityVerificationExpansionWithCompletionEngine,
  registerRealityVerificationExpansionWithMultiProjectVerification,
  registerRealityVerificationExpansionWithMultiProjectMonitoring,
  registerRealityVerificationExpansionWithSelfEvolutionGovernance,
  registerRealityVerificationExpansionWithWorld2,
  registerRealityVerificationExpansionWithUvl,
  getRealityVerificationRecord,
  listRealityVerificationRecords,
  getRealityVerificationRecordCount,
  runRealityVerificationExpansion,
  getRealityVerificationExpansionRuntimeReport,
  resetRealityVerificationExpansionForTests,
} from './reality-verification-expansion.js';

export type { RealityVerificationExpansionSystemSnapshot } from './reality-verification-expansion.js';

export function resetRealityVerificationExpansionModuleForTests(): void {
  resetRealityRecordRegistryForTests();
  resetRealityVerificationCacheForTests();
  resetRealitySourceRegistryForTests();
  resetClaimValidatorForTests();
  resetEvidenceRealityMatcherForTests();
  resetRealityConsistencyAnalyzerForTests();
  resetRealityConflictDetectorForTests();
  resetRealityGapAnalyzerForTests();
  resetRealityAuthorityBuilderForTests();
  resetRealityVerificationEvaluatorForTests();
  resetRealityVerificationHistoryForTests();
  resetRealityVerificationReportingForTests();
  resetRealityVerificationExpansionForTests();
  resetEvidenceIntelligenceModuleForTests();
}
