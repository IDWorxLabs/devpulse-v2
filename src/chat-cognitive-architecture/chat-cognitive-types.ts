/**
 * Phase 25.37 — Chat Cognitive Architecture core models.
 */

export type ChatCognitiveIntent =
  | 'SELF_AWARENESS'
  | 'IDENTITY'
  | 'CREATOR_OR_ORIGIN'
  | 'CAPABILITY'
  | 'LIMITATION'
  | 'TRUST'
  | 'PROJECT_STATUS'
  | 'SOFTWARE_CREATION'
  | 'ARCHITECTURE_REVIEW'
  | 'VERIFICATION'
  | 'LAUNCH_READINESS'
  | 'NEXT_ACTION'
  | 'SELF_IMPROVEMENT'
  | 'HUMAN_QUALITY'
  | 'GENERAL_CONVERSATION'
  | 'NEW_PROJECT_REQUEST'
  | 'UNKNOWN';

export type ChatCognitiveFrame =
  | 'SELF_MODEL'
  | 'PROJECT_REALITY'
  | 'SOFTWARE_REASONING'
  | 'OPERATIONAL_DIAGNOSIS'
  | 'NEXT_ACTION'
  | 'GENERAL_HELP'
  | 'CLARIFICATION';

export type CapabilityProofLevel =
  | 'PROVEN'
  | 'PARTIALLY_PROVEN'
  | 'UNPROVEN'
  | 'CONTRADICTED'
  | 'UNKNOWN';

export type TrackedChatCapability =
  | 'planning'
  | 'requirements'
  | 'architecture_review'
  | 'project_memory'
  | 'autonomous_build_execution'
  | 'live_preview'
  | 'verification'
  | 'launch_readiness'
  | 'mobile_runtime'
  | 'self_awareness'
  | 'chat_reasoning';

export interface ChatSelfModel {
  readOnly: true;
  productName: string;
  whatItIs: string;
  creatorOrigin: string;
  systemsPresent: string[];
  systemsIncomplete: string[];
  canHelpWithToday: string[];
  cannotClaimYet: string[];
  evidenceSources: string[];
  boundedSelfAwareness: string;
  boundedLaunchReadiness: string;
  notHumanConsciousness: string;
}

export interface ChatProjectRealitySignal {
  readOnly: true;
  label: string;
  value: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  source: string;
}

export interface ChatProjectRealityContext {
  readOnly: true;
  signals: ChatProjectRealitySignal[];
  knownBlockers: string[];
  currentPhase: string | null;
  evidenceGaps: string[];
}

export interface ChatCapabilityBoundary {
  readOnly: true;
  capability: TrackedChatCapability;
  level: CapabilityProofLevel;
  explanation: string;
  evidenceUsed: string[];
}

export interface ChatReasoningPlan {
  readOnly: true;
  intent: ChatCognitiveIntent;
  frame: ChatCognitiveFrame;
  directAnswerFirst: boolean;
  includeLimitations: boolean;
  includeProjectState: boolean;
  includeNextAction: boolean;
  askClarifyingQuestion: boolean;
  clarifyingQuestion: string | null;
  sections: string[];
}

export interface ChatAnswerDraft {
  readOnly: true;
  text: string;
  intent: ChatCognitiveIntent;
  frame: ChatCognitiveFrame;
  usedProjectContext: boolean;
  usedSelfModel: boolean;
  repairedFromDraft: boolean;
}

export interface ChatAnswerQualityCriterion {
  readOnly: true;
  id: string;
  label: string;
  passed: boolean;
  weight: number;
}

export interface ChatAnswerQualityAssessment {
  readOnly: true;
  score: number;
  passed: boolean;
  criteria: ChatAnswerQualityCriterion[];
  genericFallbackViolation: boolean;
  overclaimDetected: boolean;
  failureReasons: string[];
}

export interface ChatSelfDiagnosisResult {
  readOnly: true;
  knows: string[];
  doesNotKnow: string[];
  evidenceUsed: string[];
  missingCapability: string | null;
  overclaiming: boolean;
  answeredActualQuestion: boolean;
  useful: boolean;
  shouldAskClarifyingQuestion: boolean;
  shouldAdmitLimitation: boolean;
  clarifyingQuestion: string | null;
}

export interface ChatCognitiveResponse {
  readOnly: true;
  finalAnswer: string;
  intent: ChatCognitiveIntent;
  intentConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  frame: ChatCognitiveFrame;
  selfDiagnosis: ChatSelfDiagnosisResult;
  quality: ChatAnswerQualityAssessment;
  reasoningPlan: ChatReasoningPlan;
  usedExistingBrainDraft: boolean;
  repaired: boolean;
  blockedGenericFallback: boolean;
  selfEvolutionRequired: boolean;
  selfEvolutionReason: string | null;
  sourceConflict?: SourceConflictDiagnostics;
}

export interface SourceConflictDiagnostics {
  readOnly: true;
  selectedSource: 'self-model' | 'project-context' | 'brain-draft' | 'composed';
  rejectedSource: string | null;
  conflictReason: string | null;
  winningReason: string;
  intentSource: 'local-classifier' | 'world-class-preserved' | 'local-refined';
}

export interface ChatCognitiveInput {
  message: string;
  draftResponse?: string;
  timestamp?: number;
  rootDir?: string;
  resolvedIntentOverride?: import('./chat-intent-reconciliation.js').ResolvedIntentOverride;
}

export interface ChatCognitiveScenarioDefinition {
  id: string;
  prompt: string;
  expectedIntent: ChatCognitiveIntent;
  critical: boolean;
}

export interface ChatCognitiveScenarioResult {
  id: string;
  prompt: string;
  expectedIntent: ChatCognitiveIntent;
  actualIntent: ChatCognitiveIntent;
  intentCorrect: boolean;
  passed: boolean;
  score: number;
  genericFallbackViolation: boolean;
  responsePreview: string;
  failureReasons: string[];
}

export interface ChatCognitiveArchitectureAssessment {
  readOnly: true;
  cognitiveScore: number;
  reviewerReliability: 'RELIABLE' | 'NOT_RELIABLE_YET';
  genericFallbackViolations: number;
  selfAwarenessFailures: number;
  capabilityOverclaimFailures: number;
  softwareReasoningFailures: number;
  missingKnowledgeCategories: string[];
  selfEvolutionRequired: boolean;
  selfEvolutionReason: string | null;
  scenarioResults: ChatCognitiveScenarioResult[];
  scenariosPassed: number;
  scenariosRun: number;
  founderTestingMessage: string | null;
}
