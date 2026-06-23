/**
 * Phase 26.93 — Authority Recursion Guard (V1).
 */

export {
  AUTHORITY_RECURSION_GUARD_PASS,
  AUTHORITY_RECURSION_GUARD_CORE_QUESTION,
  DEFAULT_AUTHORITY_MAX_DEPTH,
  GUARDED_AUTHORITIES,
  HEAVY_ORCHESTRATION_AUTHORITIES,
  FORBIDDEN_AUTHORITY_CHAINS,
  RECURSION_GUARD_SAFETY_GUARANTEES,
  TESTING_INFRASTRUCTURE_DEFECT,
  AUTHORITY_RECURSION_RECOMMENDED_FIX,
} from './authority-recursion-guard-registry.js';

export type {
  AuthorityGuardName,
  AuthorityRecursionRuleId,
  AuthorityExecutionContextFrame,
  AuthorityExecutionGuardOptions,
  AuthorityRecursionDetection,
  AuthoritySafeFallbackEvidence,
  AuthorityRecursionGuardReport,
  AuthorityRecursionGuardAssessment,
  AssessAuthorityRecursionGuardInput,
  RunWithAuthorityGuardInput,
} from './authority-recursion-guard-types.js';

export {
  runWithAuthorityGuard,
  guardHeavyOrchestrationCall,
  assessAuthorityRecursionGuard,
  detectAuthorityRecursion,
  shouldBlockHeavyOrchestration,
  enterAuthorityValidatorMode,
  exitAuthorityValidatorMode,
  isAuthorityValidatorMode,
  getAuthorityCallerStack,
  getCurrentAuthorityExecutionContext,
  resetAuthorityRecursionGuardModuleForTests,
} from './authority-recursion-guard-authority.js';

export {
  buildAuthoritySafeFallbackEvidence,
  buildFounderExecutionProofBundleRecursionFallback,
  buildFounderTestIntegrationRecursionFallback,
  buildAutonomousRepairLoopRecursionFallback,
} from './authority-safe-fallback-builder.js';

export {
  buildAuthorityRecursionGuardReportMarkdown,
  buildAuthorityRecursionGuardValidationMarkdown,
  buildAuthorityRecursionGuardFallbackReportMarkdown,
} from './authority-recursion-report-builder.js';

export {
  recordAuthorityRecursionGuardReport,
  resetAuthorityRecursionGuardHistoryForTests,
  getAuthorityRecursionGuardHistorySize,
  getAuthorityRecursionGuardHistory,
} from './authority-recursion-guard-history.js';

export {
  resetAuthorityExecutionContextForTests,
  pushAuthorityExecutionContext,
  popAuthorityExecutionContext,
} from './authority-execution-context.js';

export {
  resetAuthorityRecursionDetectionsForTests,
  getAuthorityRecursionDetections,
} from './authority-recursion-detector.js';
