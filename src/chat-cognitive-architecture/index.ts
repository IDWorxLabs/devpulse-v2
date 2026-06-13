/**
 * Phase 25.37 — Chat Cognitive Architecture public API.
 */

export {
  CHAT_COGNITIVE_ARCHITECTURE_PASS_TOKEN,
  CHAT_COGNITIVE_QUALITY_PASS_THRESHOLD,
  CHAT_COGNITIVE_LAUNCH_RELIABILITY_THRESHOLD,
  GENERIC_ONBOARDING_SIGNATURE,
} from './chat-cognitive-registry.js';

export type {
  ChatCognitiveIntent,
  ChatCognitiveFrame,
  ChatSelfModel,
  ChatProjectRealityContext,
  ChatCapabilityBoundary,
  ChatReasoningPlan,
  ChatAnswerDraft,
  ChatAnswerQualityAssessment,
  ChatSelfDiagnosisResult,
  ChatCognitiveResponse,
  ChatCognitiveInput,
  ChatCognitiveArchitectureAssessment,
  ChatCognitiveScenarioResult,
  SourceConflictDiagnostics,
} from './chat-cognitive-types.js';

export {
  reconcileIntentClassification,
  mapWorldClassToCognitiveIntent,
  hasSelfDirectedSignals,
  looksLikeProjectStatusAnswer,
  isSelfImprovementMessage,
  isSelfWeaknessMessage,
  type ResolvedIntentOverride,
  type WorldClassIntentCategory,
  type IntentSource,
} from './chat-intent-reconciliation.js';

export { classifyChatCognitiveIntent } from './chat-cognitive-intent-understanding.js';
export { buildChatSelfModel } from './chat-self-model.js';
export { buildChatProjectRealityContext } from './chat-project-reality-context.js';
export { assessChatCapabilityBoundaries } from './chat-capability-boundary-checker.js';
export { reasonAboutSoftwareCreation } from './software-creation-reasoner.js';
export { runOperationalSelfDiagnosis } from './operational-self-diagnosis-engine.js';
export { buildChatReasoningPlan, composeResponseFromPlan } from './chat-response-planner.js';
export { reviewChatAnswerQuality, repairChatAnswer } from './chat-answer-quality-reviewer.js';
export {
  containsGenericOnboarding,
  isGenericOnboardingBlocked,
  isGenericOnboardingAllowed,
} from './generic-fallback-guard.js';
export {
  assessChatCognitiveResponse,
  generateChatCognitiveResponse,
  assessChatCognitiveArchitecture,
} from './chat-cognitive-orchestrator.js';
export { CHAT_COGNITIVE_SCENARIOS } from './chat-cognitive-scenarios.js';
export {
  resetChatCognitiveSelfEvolutionForTests,
} from './chat-cognitive-self-evolution.js';
