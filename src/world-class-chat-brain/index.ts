/**
 * Phase 25.38 — World-Class Chat Brain public API.
 */

export {
  WORLD_CLASS_CHAT_BRAIN_PASS_TOKEN,
  CHAT_BRAIN_JUDGEMENT_PASS_THRESHOLD,
  GENERIC_ONBOARDING_SIGNATURE,
} from './chat-brain-registry.js';

export type {
  ChatBrainInput,
  ChatBrainContext,
  ChatBrainIntent,
  ChatBrainIntentCategory,
  ChatBrainReasoningMode,
  ChatBrainDraft,
  ChatBrainJudgement,
  ChatBrainFinalResponse,
  ChatBrainCapabilityClaim,
  ChatBrainCapabilityLevel,
  ChatBrainArchitectureAssessment,
  ChatBrainScenarioResult,
} from './chat-brain-types.js';

export { retrieveDevPulseIntelligenceSnapshot } from './devpulse-intelligence-adapter.js';
export type { DevPulseIntelligenceSnapshot } from './devpulse-intelligence-adapter.js';
export { buildChatBrainContext } from './chat-brain-context-builder.js';
export { buildChatBrainCapabilityModel, summarizeCapabilityHonesty } from './chat-brain-capability-model.js';
export { judgeChatBrainAnswer, detectRoboticTone, detectOverclaim } from './chat-brain-answer-judge.js';
export { repairChatBrainResponse } from './chat-brain-response-repair.js';
export {
  classifyChatBrainIntent,
  generateWorldClassChatResponse,
  assessWorldClassChatBrain,
} from './chat-brain-orchestrator.js';
export { CHAT_BRAIN_SCENARIOS } from './chat-brain-scenarios.js';
