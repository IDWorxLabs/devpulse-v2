/**
 * User Guides — public exports.
 */

import { resetUserGuidesRegistryForTests } from './user-guides-registry.js';
import { resetUserGuidesCacheForTests } from './user-guides-cache.js';
import { resetOnboardingGuideAnalyzerForTests } from './onboarding-guide-analyzer.js';
import { resetWorkflowGuideAnalyzerForTests } from './workflow-guide-analyzer.js';
import { resetFeatureDiscoveryGuideAnalyzerForTests } from './feature-discovery-guide-analyzer.js';
import { resetSafetyGuideAnalyzerForTests } from './safety-guide-analyzer.js';
import { resetResultsInterpretationGuideAnalyzerForTests } from './results-interpretation-guide-analyzer.js';
import { resetUserGuidesAuthorityBuilderForTests } from './user-guides-authority-builder.js';
import { resetUserGuidesEvaluatorForTests } from './user-guides-evaluator.js';
import { resetUserGuidesHistoryForTests } from './user-guides-history.js';
import { resetUserGuidesReportingForTests } from './user-guides-reporting.js';
import { resetUserGuidesOrchestrationForTests } from './user-guides.js';

export {
  USER_GUIDES_PASS_TOKEN,
  USER_GUIDES_OWNER_MODULE,
  DEFAULT_MAX_USER_GUIDES_HISTORY_SIZE,
  USER_GUIDES_QUESTION_SIGNALS,
  isUserGuidesQuestion,
  resolveUserGuideCompletenessLevel,
  resolveUserGuideState,
} from './user-guides-types.js';

export type {
  UserGuideCompletenessLevel,
  UserGuideState,
  UserGuideRecord,
  OnboardingGuideAnalysis,
  WorkflowGuideAnalysis,
  FeatureDiscoveryGuideAnalysis,
  SafetyGuideAnalysis,
  ResultsInterpretationGuideAnalysis,
  UnifiedUserGuidesAuthority,
  UserGuidesEvaluation,
  UserGuidesHistoryEntry,
  UserGuidesReport,
  UserGuidesInput,
  UserGuidesResult,
  UserGuidesRuntimeReport,
} from './user-guides-types.js';

export { getUserGuidesCacheStats, resetUserGuidesCacheForTests } from './user-guides-cache.js';

export {
  registerUserGuideRecord,
  getUserGuideRecord,
  lookupUserGuideByProjectId,
  lookupUserGuideByWorkspaceId,
  lookupUserGuideByCompletenessLevel,
  lookupUserGuideByState,
  listUserGuideRecords,
  getUserGuideRecordCount,
  resetUserGuidesRegistryForTests,
} from './user-guides-registry.js';

export {
  analyzeOnboardingGuide,
  getOnboardingAnalysisCount,
  listBaseOnboardingAreas,
  resetOnboardingGuideAnalyzerForTests,
} from './onboarding-guide-analyzer.js';

export type { OnboardingGuideSnapshot } from './onboarding-guide-analyzer.js';

export {
  analyzeWorkflowGuide,
  getWorkflowAnalysisCount,
  listBaseWorkflows,
  resetWorkflowGuideAnalyzerForTests,
} from './workflow-guide-analyzer.js';

export type { WorkflowGuideSnapshot } from './workflow-guide-analyzer.js';

export {
  analyzeFeatureDiscoveryGuide,
  getFeatureAnalysisCount,
  resetFeatureDiscoveryGuideAnalyzerForTests,
} from './feature-discovery-guide-analyzer.js';

export type { FeatureDiscoveryGuideSnapshot } from './feature-discovery-guide-analyzer.js';

export {
  analyzeSafetyGuide,
  getSafetyAnalysisCount,
  listBaseSafetyAreas,
  resetSafetyGuideAnalyzerForTests,
} from './safety-guide-analyzer.js';

export type { SafetyGuideSnapshot } from './safety-guide-analyzer.js';

export {
  analyzeResultsInterpretationGuide,
  getInterpretationAnalysisCount,
  listBaseResultAreas,
  resetResultsInterpretationGuideAnalyzerForTests,
} from './results-interpretation-guide-analyzer.js';

export type { ResultsInterpretationGuideSnapshot } from './results-interpretation-guide-analyzer.js';

export {
  buildUnifiedUserGuidesAuthority,
  getAuthorityBuildCount,
  resetUserGuidesAuthorityBuilderForTests,
} from './user-guides-authority-builder.js';

export {
  evaluateUserGuides,
  getEvaluationCount,
  resetUserGuidesEvaluatorForTests,
} from './user-guides-evaluator.js';

export {
  recordUserGuidesHistory,
  getUserGuidesHistory,
  getUserGuidesHistorySize,
  clearUserGuidesHistory,
  resetUserGuidesHistoryForTests,
} from './user-guides-history.js';

export {
  generateUserGuidesReport,
  getReportCount,
  resetUserGuidesReportingForTests,
} from './user-guides-reporting.js';

export {
  getDevPulseV2UserGuides,
  registerUserGuidesWithCentralBrain,
  registerUserGuidesWithSelfDocumentation,
  registerUserGuidesWithFounderGuides,
  registerUserGuidesWithFoundation,
  registerUserGuidesWithCapabilityRegistry,
  registerUserGuidesWithFindPanel,
  registerUserGuidesWithUvl,
  registerUserGuidesWithUnifiedTrustScore,
  registerUserGuidesWithTrustEngineCheckpoint,
  registerUserGuidesWithProductHardeningCheckpoint,
  registerUserGuidesWithWorld2,
  registerUserGuidesWithMobileCommand,
  registerUserGuidesWithNotificationVault,
  registerUserGuidesWithOperatorFeed,
  registerUserGuidesWithSelfEvolutionGovernance,
  registerUserGuidesWithMissingCapabilityEscalation,
  evaluateUserGuidesEngine,
  getUserGuidesRuntimeReport,
} from './user-guides.js';

export type { UserGuidesSystemSnapshot } from './user-guides.js';

export function resetUserGuidesForTests(): void {
  resetUserGuidesRegistryForTests();
  resetUserGuidesCacheForTests();
  resetOnboardingGuideAnalyzerForTests();
  resetWorkflowGuideAnalyzerForTests();
  resetFeatureDiscoveryGuideAnalyzerForTests();
  resetSafetyGuideAnalyzerForTests();
  resetResultsInterpretationGuideAnalyzerForTests();
  resetUserGuidesAuthorityBuilderForTests();
  resetUserGuidesEvaluatorForTests();
  resetUserGuidesHistoryForTests();
  resetUserGuidesReportingForTests();
  resetUserGuidesOrchestrationForTests();
}
