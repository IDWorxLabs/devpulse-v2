/**
 * Phase 26.4 — Founder Test chat stress simulation types.
 */

export const CHAT_STRESS_LAUNCH_BLOCK_THRESHOLD = 85;

export type ChatStressCategory =
  | 'IDENTITY'
  | 'CAPABILITY'
  | 'WEAKNESS_HONESTY'
  | 'PRODUCT_UNDERSTANDING'
  | 'FOUNDER_GUIDANCE'
  | 'SOFTWARE_CREATION'
  | 'VERIFICATION_LAUNCH'
  | 'SKEPTICAL_USER'
  | 'HUMAN_QUALITY'
  | 'EDGE_CASE';

export type ChatStressAnswerBand =
  | 'STRONG_FOUNDER_FACING'
  | 'GOOD_NEEDS_POLISH'
  | 'USABLE_NOT_LAUNCH_READY'
  | 'CHAT_BLOCKS_LAUNCH';

export interface ChatStressScenarioDefinition {
  readOnly: true;
  id: string;
  category: ChatStressCategory;
  prompt: string;
  paraphraseOf?: string;
  tags: string[];
}

export interface ChatStressScenarioRun {
  readOnly: true;
  scenarioId: string;
  category: ChatStressCategory;
  prompt: string;
  draftResponse: string;
  finalAnswer: string;
  brainPath: 'command-center-brain+llm-chat-brain';
  usedLlm: boolean;
  fallbackUsed: boolean;
  contextIncluded: boolean;
  judgeScore: number | null;
  durationMs: number;
}

export interface ChatStressEvaluation {
  readOnly: true;
  scenarioId: string;
  category: ChatStressCategory;
  prompt: string;
  actualAnswer: string;
  score: number;
  passed: boolean;
  weak: boolean;
  band: ChatStressAnswerBand;
  failureReasons: string[];
  missingCapability: string | null;
  recommendedFix: string | null;
  answeredActualQuestion: boolean;
  identityCorrect: boolean;
  founderIdentityCorrect: boolean;
  companyIdentityCorrect: boolean;
  legacyDevPulseHandled: boolean;
  avoidedLegacyMisuse: boolean;
  usedProjectContext: boolean;
  admittedUncertainty: boolean;
  avoidedOverclaim: boolean;
  naturalFounderFacing: boolean;
  usefulNextAction: boolean;
  avoidedGenericOnboarding: boolean;
  avoidedInternalJargon: boolean;
}

export interface ChatStressFailurePattern {
  readOnly: true;
  pattern: string;
  count: number;
  categories: ChatStressCategory[];
  examplePrompt: string;
  recommendedFix: string;
}

export interface ChatStressSimulationReport {
  readOnly: true;
  advisoryOnly: true;
  runId: string;
  generatedAt: string;
  totalScenarios: number;
  passedCount: number;
  failedCount: number;
  weakCount: number;
  overallScore: number;
  chatBlocksLaunchReadiness: boolean;
  selfEvolutionRequired: boolean;
  strongestAnswers: ChatStressEvaluation[];
  worstAnswers: ChatStressEvaluation[];
  weakAnswers: ChatStressEvaluation[];
  failedAnswers: ChatStressEvaluation[];
  repeatedFailurePatterns: ChatStressFailurePattern[];
  missingCapabilities: string[];
  recommendedNextChatImprovements: string[];
  categoryScores: Record<ChatStressCategory, number>;
  evaluations: ChatStressEvaluation[];
  scenarioRuns: ChatStressScenarioRun[];
}

export interface ChatStressSimulationAssessment {
  readOnly: true;
  advisoryOnly: true;
  report: ChatStressSimulationReport;
}

export interface RunChatStressSimulationInput {
  rootDir?: string;
  providerOverride?: import('../llm-chat-brain/llm-provider-types.js').LlmProvider;
  maxScenarios?: number;
  concurrency?: number;
}
