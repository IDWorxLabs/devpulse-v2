/**
 * Chat Intelligence Reality — public API.
 */

export {
  CHAT_INTELLIGENCE_REALITY_PASS_TOKEN,
  CHAT_INTELLIGENCE_REALITY_OWNER_MODULE,
  MAX_CHAT_INTELLIGENCE_SCENARIOS,
  MAX_CHAT_FAILURE_HISTORY,
  CHAT_SELF_EVOLUTION_FAILURE_THRESHOLD,
  CHAT_INTELLIGENCE_LAUNCH_PASS_SCORE,
  CHAT_INTELLIGENCE_LAUNCH_BLOCK_SCORE,
  CHAT_INTELLIGENCE_PROOF_NOTES,
  CHAT_INTELLIGENCE_CACHE_KEY_PREFIX,
} from './chat-intelligence-reality-bounds.js';

export type {
  ChatIntelligenceFailureCategory,
  ChatIntelligenceMissingCapability,
  ChatLaunchVerdict,
  ChatIntelligenceCriteria,
  ChatIntelligenceScenarioDefinition,
  ChatIntelligenceScenarioResult,
  ChatSelfEvolutionImprovementStep,
  ChatSelfEvolutionTriggerResult,
  ChatIntelligenceRealityAssessment,
  AssessChatIntelligenceRealityInput,
  ChatIntelligenceVisibilityScore,
} from './chat-intelligence-reality-types.js';

export { CHAT_INTELLIGENCE_SCENARIOS } from './chat-intelligence-scenarios.js';
export { detectGenericOnboarding, evaluateChatIntelligenceScenario } from './chat-intelligence-analyzers.js';
export { evaluateChatSelfEvolutionTrigger, resetChatSelfEvolutionForTests } from './chat-self-evolution-trigger.js';
export {
  assessChatIntelligenceReality,
  evaluateChatIntelligenceVisibility,
} from './chat-intelligence-reality-authority.js';
