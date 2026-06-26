/**
 * Intent Understanding Engine V1 — public API.
 */

import { resetIntentHistoryForTests } from './intent-history.js';
import {
  resetIntentUnderstandingEngineForTests,
} from './intent-understanding-engine.js';
import { resetProductModelBuilderForTests } from './product-model-builder.js';

export {
  INTENT_UNDERSTANDING_ENGINE_PASS_TOKEN,
  INTENT_UNDERSTANDING_ENGINE_OWNER_MODULE,
  DEFAULT_INTENT_CONFIDENCE_THRESHOLD,
  DEFAULT_CATEGORY_CONFIDENCE_THRESHOLD,
  DEFAULT_MAX_INTENT_HISTORY_SIZE,
} from './intent-understanding-types.js';

export type {
  ProductType,
  FeaturePriority,
  InteractionMode,
  PlatformTarget,
  NavigationPattern,
  VisualStyle,
  UnderstandingEvidence,
  ProductIdentityUnderstanding,
  UserPersona,
  UserGoalsUnderstanding,
  WorkflowStep,
  UserWorkflowUnderstanding,
  FeatureRequirementUnderstanding,
  InteractionModelUnderstanding,
  PlatformUnderstanding,
  NavigationUnderstanding,
  AccessibilityUnderstanding,
  DataEntityUnderstanding,
  DataModelUnderstanding,
  BehaviorStep,
  BehaviorModelUnderstanding,
  VisualDesignUnderstanding,
  SafetyUnderstanding,
  PerformanceUnderstanding,
  SuccessCriteriaUnderstanding,
  ArchitectureHintUnderstanding,
  CategoryConfidence,
  IntentConfidenceReport,
  ProductIntelligenceModel,
  IntentUnderstandingInput,
  IntentUnderstandingResult,
  IntentHistoryEntry,
  IntentUnderstandingRuntimeReport,
} from './intent-understanding-types.js';

export { extractDomainUnderstanding } from './domain-understanding.js';
export { extractUserPersonas } from './user-persona-extractor.js';
export { extractUserGoals, extractFeatureRequirements } from './requirement-understanding.js';
export { extractWorkflows } from './workflow-extractor.js';
export { buildInteractionModel } from './interaction-model-builder.js';
export { extractPlatformUnderstanding } from './platform-understanding.js';
export { extractNavigationUnderstanding } from './navigation-understanding.js';
export { extractAccessibilityUnderstanding } from './accessibility-understanding.js';
export { buildBehaviorModel } from './behavior-understanding.js';
export { buildProductIntelligenceModel, resetProductModelBuilderForTests } from './product-model-builder.js';
export { calculateIntentConfidence } from './intent-confidence.js';
export { buildIntentUnderstandingReportMarkdown } from './intent-report-builder.js';
export {
  recordIntentUnderstandingHistory,
  getIntentHistory,
  getIntentHistorySize,
  getLastIntentHistoryEntry,
  resetIntentHistoryForTests,
} from './intent-history.js';
export { buildIntentUnderstandingTraceEvents } from './intent-trace-events.js';

export {
  getDevPulseV2IntentUnderstandingEngine,
  runIntentUnderstandingEngine,
  requireProductIntelligenceModelForGeneration,
  getActiveProductIntelligenceModel,
  getLastIntentUnderstandingResult,
  assertGenerationUsesProductIntelligenceModel,
  getIntentUnderstandingRuntimeReport,
  resetIntentUnderstandingEngineForTests,
  registerIntentUnderstandingWithAiDevEngine,
  registerIntentUnderstandingWithRequirementsToPlan,
  registerIntentUnderstandingWithCapabilityPlanning,
  registerIntentUnderstandingWithPromptFaithfulness,
  registerIntentUnderstandingWithFeatureContracts,
  registerIntentUnderstandingWithFounderTest,
  registerIntentUnderstandingWithExecutionTrace,
  registerIntentUnderstandingWithLaunchAuthority,
  registerIntentUnderstandingWithUniversalProductionProof,
  registerIntentUnderstandingWithMaterializationQuality,
  registerIntentUnderstandingWithWorkspaceReality,
  registerIntentUnderstandingWithUvl,
  registerIntentUnderstandingWithAutoFix,
  registerIntentUnderstandingWithBlueprintGeneration,
  registerIntentUnderstandingWithArchitecturePlanning,
  registerIntentUnderstandingWithUniversalPromptToApp,
} from './intent-understanding-engine.js';

export function resetIntentUnderstandingEngineModuleForTests(): void {
  resetIntentUnderstandingEngineForTests();
  resetProductModelBuilderForTests();
  resetIntentHistoryForTests();
}
