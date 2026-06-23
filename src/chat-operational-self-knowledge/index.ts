/**
 * Chat Operational Self-Knowledge — public API (Phase 26.73 / 26.82 / 26.83 / 26.84).
 */

export {
  CHAT_OPERATIONAL_SELF_KNOWLEDGE_V1_PASS,
  CHAT_OPERATIONAL_TRUTH_SOURCE_SYNCHRONIZATION_V1_PASS,
  LIVE_CHAT_OPERATIONAL_PATH_BYPASS_REPAIR_V1_PASS,
  CHAT_ROUTING_CONSISTENCY_AND_TRUTH_UNIFICATION_V1_PASS,
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
  OperationalTruthSourceContradiction,
  ChatOperationalContradiction,
  ExecutionStageInventoryEntry,
  OperationalTruthContext,
  OperationalEvidenceSnapshot,
  OperationalSelfKnowledgeAssessment,
  EnhanceChatWithOperationalSelfKnowledgeInput,
  EnhanceChatWithOperationalSelfKnowledgeResult,
  BuildOperationalEvidenceSnapshotInput,
  OperationalTruthPath,
  LiveOperationalTruthBypass,
  LiveOperationalTruthDiagnostics,
} from './chat-operational-self-knowledge-types.js';

export {
  OPERATIONAL_TRUTH_SOURCE_CONTRADICTION,
  CHAT_OPERATIONAL_CONTRADICTION,
  LIVE_OPERATIONAL_TRUTH_BYPASS,
} from './chat-operational-self-knowledge-types.js';

export {
  detectOperationalTruthSourceContradictions,
  responseContradictsExecutionTruth,
} from './operational-truth-source-contradiction-detector.js';

export {
  detectChatOperationalContradictions,
  detectResponseContradictions,
} from './chat-operational-contradiction-detector.js';

export {
  OPERATIONAL_TRUTH_CONTEXT_VERSION,
  buildOperationalTruthContext,
  buildStageInventoryFromChainTruth,
  stageStatusLabel,
} from './operational-truth-context.js';

export {
  buildExecutionTruthSummary,
  buildExecutionTruthSummaryLines,
  buildExecutionStageInventoryAnswer,
  buildTruthSourceAnswer,
  buildEvidenceBasisAnswer,
  buildRuntimeCapabilityAnswer,
  buildPreviewCapabilityAnswer,
  buildFirstBrokenStageAnswer,
  buildLaunchNotProvenAnswerFromContext,
  buildFirstLaunchBlockerAnswer,
  buildLaunchFixRequiredAnswer,
} from './operational-status-builder.js';

export {
  EXECUTION_STAGE_OPERATIONAL_KINDS,
  inferExecutionStageQuestionKind,
  isExecutionStageOperationalQuestion,
  resolveOperationalTruthPath,
  detectLiveOperationalTruthBypass,
  buildLiveOperationalTruthDiagnostics,
} from './live-operational-truth-path.js';

export {
  resetOperationalEvidenceSnapshotCacheForTests,
  getOperationalEvidenceSnapshot,
  getLiveOperationalTruthDiagnostics,
  resolveOperationalSelfKnowledgeChatResponse,
  tryResolveLiveOperationalTruthAnswer,
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
  getCapabilityTruthEntry,
} from './capability-truth-registry.js';
