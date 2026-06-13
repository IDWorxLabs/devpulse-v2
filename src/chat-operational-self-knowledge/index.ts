/**
 * Chat Operational Self-Knowledge — public API (Phase 26.73).
 */

export {
  CHAT_OPERATIONAL_SELF_KNOWLEDGE_V1_PASS,
  OPERATIONAL_SELF_AWARENESS_STANDARD,
  CONSCIOUSNESS_CLAIM_PATTERNS,
  CORE_CAPABILITY_DEFINITIONS,
} from './chat-operational-self-knowledge-registry.js';

export type {
  CapabilityTruthLevel,
  UncertaintyLevel,
  OperationalQuestionKind,
  CapabilityTruthEntry,
  CapabilityTruthRegistry,
  UncertaintyAssessment,
  OperationalLaunchBlocker,
  OperationalEvidenceSnapshot,
  OperationalSelfKnowledgeAssessment,
  EnhanceChatWithOperationalSelfKnowledgeInput,
  EnhanceChatWithOperationalSelfKnowledgeResult,
  BuildOperationalEvidenceSnapshotInput,
} from './chat-operational-self-knowledge-types.js';

export {
  resetOperationalEvidenceSnapshotCacheForTests,
  getOperationalEvidenceSnapshot,
  resolveOperationalSelfKnowledgeChatResponse,
  enhanceChatWithOperationalSelfKnowledge,
  buildOperationalEvidenceSnapshot,
  buildCapabilityTruthRegistry,
  classifyOperationalQuestion,
  isOperationalSelfKnowledgeQuestion,
  composeOperationalSelfKnowledgeResponse,
  buildOperationalSelfKnowledgeAssessment,
} from './chat-operational-self-knowledge-authority.js';

export { deriveUncertaintyLevel } from './uncertainty-model.js';
export {
  listCapabilitiesByTruthLevel,
  highestImpactWeakness,
} from './capability-truth-registry.js';
