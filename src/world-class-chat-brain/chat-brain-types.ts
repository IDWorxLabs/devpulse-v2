/**
 * Phase 25.38 — World-Class Chat Brain types.
 */

export type ChatBrainIntentCategory =
  | 'SELF'
  | 'CAPABILITY'
  | 'HUMAN_QUALITY'
  | 'PROJECT_REALITY'
  | 'SOFTWARE_CREATION'
  | 'LAUNCH'
  | 'VERIFICATION'
  | 'GENERAL'
  | 'UNKNOWN';

export type ChatBrainReasoningMode =
  | 'DIRECT_ANSWER'
  | 'EVIDENCE_GROUNDED'
  | 'SOFTWARE_PLANNING'
  | 'FOUNDER_CONVERSATIONAL'
  | 'CLARIFICATION';

export type ChatBrainCapabilityLevel =
  | 'PROVEN'
  | 'PARTIAL'
  | 'UNPROVEN'
  | 'CONTRADICTED'
  | 'UNKNOWN';

export interface ChatBrainInput {
  message: string;
  draftResponse?: string;
  timestamp?: number;
  rootDir?: string;
}

export interface ChatBrainIntent {
  readOnly: true;
  category: ChatBrainIntentCategory;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoningMode: ChatBrainReasoningMode;
  matchedSignals: string[];
}

export interface ChatBrainCapabilityClaim {
  readOnly: true;
  name: string;
  level: ChatBrainCapabilityLevel;
  explanation: string;
}

export interface ChatBrainContext {
  readOnly: true;
  projectStatus: string;
  founderTestStatus: string;
  executionProofStatus: string;
  verificationStatus: string;
  livePreviewStatus: string;
  launchReadinessStatus: string;
  repositoryTypecheckStatus: string;
  mobileRuntimeStatus: string;
  launchCouncilStatus: string;
  projectMemoryStatus: string;
  cognitiveArchitectureStatus: string;
  knownBlockers: string[];
  capabilities: ChatBrainCapabilityClaim[];
  limitations: string[];
  evidenceGaps: string[];
  intelligenceSourcesUsed: string[];
}

export interface ChatBrainDraft {
  readOnly: true;
  text: string;
  reasoningMode: ChatBrainReasoningMode;
  intent: ChatBrainIntentCategory;
  usedDraftFromBrain: boolean;
}

export interface ChatBrainJudgementCriterion {
  readOnly: true;
  id: string;
  label: string;
  passed: boolean;
  weight: number;
}

export interface ChatBrainJudgement {
  readOnly: true;
  score: number;
  passed: boolean;
  criteria: ChatBrainJudgementCriterion[];
  failureReasons: string[];
  soundsRobotic: boolean;
  genericOnboardingViolation: boolean;
  overclaimDetected: boolean;
}

export interface ChatBrainFinalResponse {
  readOnly: true;
  finalAnswer: string;
  intent: ChatBrainIntent;
  context: ChatBrainContext;
  draft: ChatBrainDraft;
  judgement: ChatBrainJudgement;
  repaired: boolean;
  usedBrainDraft: boolean;
  sourceConflict?: import('../chat-cognitive-architecture/chat-cognitive-types.js').SourceConflictDiagnostics;
}

export interface ChatBrainScenarioDefinition {
  id: string;
  prompt: string;
  category: ChatBrainIntentCategory;
  critical: boolean;
}

export interface ChatBrainScenarioResult {
  id: string;
  prompt: string;
  category: ChatBrainIntentCategory;
  passed: boolean;
  score: number;
  intentCorrect: boolean;
  responsePreview: string;
  failureReasons: string[];
}

export interface ChatBrainArchitectureAssessment {
  readOnly: true;
  brainScore: number;
  scenariosRun: number;
  scenariosPassed: number;
  genericFallbackViolations: number;
  roboticFailures: number;
  scenarioResults: ChatBrainScenarioResult[];
}
