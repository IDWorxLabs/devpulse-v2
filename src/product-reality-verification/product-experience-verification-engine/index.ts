/**
 * Product Experience Verification Engine — public exports.
 */

import { resetProductExperienceRegistryForTests } from './product-experience-registry.js';
import { resetProductExperienceCacheForTests } from './product-experience-cache.js';
import { resetExperienceGapCounterForTests } from './experience-gap-model.js';
import { resetExperienceContextBuilderForTests } from './experience-context-builder.js';
import { resetProductCoherenceVerifierForTests } from './product-coherence-verifier.js';
import { resetExperienceContinuityVerifierForTests } from './experience-continuity-verifier.js';
import { resetIntelligenceContinuityVerifierForTests } from './intelligence-continuity-verifier.js';
import { resetWorkflowContinuityVerifierForTests } from './workflow-continuity-verifier.js';
import { resetNavigationContinuityVerifierForTests } from './navigation-continuity-verifier.js';
import { resetVerificationContinuityVerifierForTests } from './verification-continuity-verifier.js';
import { resetFounderExperienceVerifierForTests } from './founder-experience-verifier.js';
import { resetTrustContinuityVerifierForTests } from './trust-continuity-verifier.js';
import { resetProductIdentityContinuityVerifierForTests } from './product-identity-continuity-verifier.js';
import { resetLaunchReadinessContinuityVerifierForTests } from './launch-readiness-continuity-verifier.js';
import { resetExperienceGapAnalyzerForTests } from './experience-gap-analyzer.js';
import { resetExperienceRoadmapBuilderForTests } from './experience-roadmap-builder.js';
import { resetProductExperienceAuthorityBuilderForTests } from './product-experience-authority-builder.js';
import { resetProductExperienceEvaluationForTests } from './product-experience-evaluator.js';
import { resetProductExperienceHistoryForTests } from './bounded-history.js';
import { resetProductExperienceReportBuilderForTests } from './product-experience-report-builder.js';
import { resetProductExperienceEngineOrchestrationForTests } from './product-experience-verification-engine.js';

export {
  PRODUCT_EXPERIENCE_ENGINE_PASS_TOKEN,
  PRODUCT_EXPERIENCE_ENGINE_PASS,
  PRODUCT_EXPERIENCE_OWNER_MODULE,
  DEFAULT_MAX_PRODUCT_EXPERIENCE_HISTORY_SIZE,
  MAX_EXPERIENCE_GAPS,
  EXPERIENCE_CONTEXT_PASS,
  PRODUCT_COHERENCE_PASS,
  EXPERIENCE_CONTINUITY_PASS,
  INTELLIGENCE_CONTINUITY_PASS,
  WORKFLOW_CONTINUITY_PASS,
  NAVIGATION_CONTINUITY_PASS,
  VERIFICATION_CONTINUITY_PASS,
  FOUNDER_EXPERIENCE_PASS,
  TRUST_CONTINUITY_PASS,
  PRODUCT_IDENTITY_CONTINUITY_PASS,
  LAUNCH_READINESS_CONTINUITY_PASS,
  EXPERIENCE_GAP_ANALYSIS_PASS,
  EXPERIENCE_ROADMAP_PASS,
  PRODUCT_EXPERIENCE_REPORTING_PASS,
  PRODUCT_EXPERIENCE_QUESTION_SIGNALS,
  isProductExperienceQuestion,
  resolveProductExperienceResult,
  clampScore,
  severityToRank,
} from './product-experience-types.js';

export type {
  ProductExperienceResult,
  ExperienceSeverity,
  LaunchReadinessLevel,
  ExperienceContextType,
  ExperienceContext,
  ExperienceGap,
  VerifierContinuityResult,
  ProductCoherenceVerification,
  ExperienceContinuityVerification,
  IntelligenceContinuityVerification,
  WorkflowContinuityVerification,
  NavigationContinuityVerification,
  VerificationContinuityVerification,
  FounderExperienceVerification,
  TrustContinuityVerification,
  ProductIdentityContinuityVerification,
  LaunchReadinessContinuityVerification,
  ExperienceGapAnalysis,
  ProductExperienceRoadmap,
  ProductExperienceAuthority,
  ProductExperienceRecord,
  ProductExperienceEvaluation,
  ProductExperienceHistoryEntry,
  ProductExperienceReport,
  ProductExperienceInput,
  ProductExperienceResultBundle,
  ProductExperienceRuntimeReport,
} from './product-experience-types.js';

export {
  createExperienceGap,
  boundGaps,
  mergeBoundedGaps,
  countCriticalGaps,
  MAX_GAPS_PER_VERIFIER,
  resetExperienceGapCounterForTests,
} from './experience-gap-model.js';

export { getProductExperienceCacheStats, resetProductExperienceCacheForTests } from './product-experience-cache.js';

export {
  registerProductExperienceRecord,
  getProductExperienceRecord,
  lookupProductExperienceByProjectId,
  lookupProductExperienceByResult,
  listProductExperienceRecords,
  getProductExperienceRecordCount,
  resetProductExperienceRegistryForTests,
} from './product-experience-registry.js';

export {
  buildExperienceContext,
  listExperienceContextTypes,
  getContextBuildCount,
  resetExperienceContextBuilderForTests,
} from './experience-context-builder.js';

export {
  verifyProductCoherence,
  getProductCoherenceVerifyCount,
  resetProductCoherenceVerifierForTests,
} from './product-coherence-verifier.js';
export type { ProductCoherenceUpstream } from './product-coherence-verifier.js';

export {
  verifyExperienceContinuity,
  getExperienceContinuityVerifyCount,
  resetExperienceContinuityVerifierForTests,
} from './experience-continuity-verifier.js';
export type { ExperienceContinuityUpstream } from './experience-continuity-verifier.js';

export {
  verifyIntelligenceContinuity,
  getIntelligenceContinuityVerifyCount,
  resetIntelligenceContinuityVerifierForTests,
} from './intelligence-continuity-verifier.js';
export type { IntelligenceContinuityUpstream } from './intelligence-continuity-verifier.js';

export {
  verifyWorkflowContinuity,
  getWorkflowContinuityVerifyCount,
  resetWorkflowContinuityVerifierForTests,
} from './workflow-continuity-verifier.js';
export type { WorkflowContinuityUpstream } from './workflow-continuity-verifier.js';

export {
  verifyNavigationContinuity,
  getNavigationContinuityVerifyCount,
  resetNavigationContinuityVerifierForTests,
} from './navigation-continuity-verifier.js';
export type { NavigationContinuityUpstream } from './navigation-continuity-verifier.js';

export {
  verifyVerificationContinuity,
  getVerificationContinuityVerifyCount,
  resetVerificationContinuityVerifierForTests,
} from './verification-continuity-verifier.js';
export type { VerificationContinuityUpstream } from './verification-continuity-verifier.js';

export {
  verifyFounderExperience,
  getFounderExperienceVerifyCount,
  resetFounderExperienceVerifierForTests,
} from './founder-experience-verifier.js';
export type { FounderExperienceUpstream } from './founder-experience-verifier.js';

export {
  verifyTrustContinuity,
  getTrustContinuityVerifyCount,
  resetTrustContinuityVerifierForTests,
} from './trust-continuity-verifier.js';
export type { TrustContinuityUpstream } from './trust-continuity-verifier.js';

export {
  verifyProductIdentityContinuity,
  getProductIdentityVerifyCount,
  resetProductIdentityContinuityVerifierForTests,
} from './product-identity-continuity-verifier.js';
export type { ProductIdentityContinuityUpstream } from './product-identity-continuity-verifier.js';

export {
  verifyLaunchReadinessContinuity,
  getLaunchReadinessVerifyCount,
  resetLaunchReadinessContinuityVerifierForTests,
} from './launch-readiness-continuity-verifier.js';
export type { LaunchReadinessContinuityUpstream } from './launch-readiness-continuity-verifier.js';

export {
  analyzeExperienceGaps,
  getGapAnalysisCount,
  resetExperienceGapAnalyzerForTests,
} from './experience-gap-analyzer.js';

export {
  buildExperienceRoadmap,
  getRoadmapBuildCount,
  resetExperienceRoadmapBuilderForTests,
} from './experience-roadmap-builder.js';

export {
  buildProductExperienceAuthority,
  getAuthorityBuildCount,
  resetProductExperienceAuthorityBuilderForTests,
} from './product-experience-authority-builder.js';

export {
  evaluateProductExperience,
  getEvaluationCount,
  resetProductExperienceEvaluationForTests,
} from './product-experience-evaluator.js';

export {
  recordProductExperienceHistory,
  getProductExperienceHistory,
  getProductExperienceHistorySize,
  clearProductExperienceHistory,
  resetProductExperienceHistoryForTests,
} from './bounded-history.js';

export {
  generateProductExperienceReport,
  getReportCount,
  resetProductExperienceReportBuilderForTests,
} from './product-experience-report-builder.js';

export {
  getDevPulseV2ProductExperienceVerificationEngine,
  registerProductExperienceEngineWithSurface,
  registerProductExperienceEngineWithFoundation,
  registerProductExperienceEngineWithCapabilityRegistry,
  registerProductExperienceEngineWithFindPanel,
  registerProductExperienceEngineWithUvl,
  registerProductExperienceEngineWithProductRealityChain,
  evaluateProductExperienceEngine,
  getProductExperienceEngineRuntimeReport,
} from './product-experience-verification-engine.js';

export type { ProductExperienceSurfaceSnapshot } from './product-experience-verification-engine.js';

export function resetProductExperienceVerificationEngineForTests(): void {
  resetProductExperienceRegistryForTests();
  resetProductExperienceCacheForTests();
  resetExperienceGapCounterForTests();
  resetExperienceContextBuilderForTests();
  resetProductCoherenceVerifierForTests();
  resetExperienceContinuityVerifierForTests();
  resetIntelligenceContinuityVerifierForTests();
  resetWorkflowContinuityVerifierForTests();
  resetNavigationContinuityVerifierForTests();
  resetVerificationContinuityVerifierForTests();
  resetFounderExperienceVerifierForTests();
  resetTrustContinuityVerifierForTests();
  resetProductIdentityContinuityVerifierForTests();
  resetLaunchReadinessContinuityVerifierForTests();
  resetExperienceGapAnalyzerForTests();
  resetExperienceRoadmapBuilderForTests();
  resetProductExperienceAuthorityBuilderForTests();
  resetProductExperienceEvaluationForTests();
  resetProductExperienceHistoryForTests();
  resetProductExperienceReportBuilderForTests();
  resetProductExperienceEngineOrchestrationForTests();
}
