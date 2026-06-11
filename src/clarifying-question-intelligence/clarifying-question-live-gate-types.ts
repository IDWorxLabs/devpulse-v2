/**
 * Clarifying Question Live Gate — conversation and pipeline gate types.
 */

import type { ClarifyingQuestionPriority } from './clarifying-question-types.js';

export interface LiveGateQuestionDefinition {
  category: LiveGateCategoryId;
  priority: ClarifyingQuestionPriority;
  question: string;
  whyItMatters: string;
  consequenceIfAssumed: string;
}

export const CLARIFYING_QUESTION_LIVE_GATE_PASS_TOKEN = 'CLARIFYING_QUESTION_LIVE_GATE_PASS';

export type ProjectArchetype =
  | 'FOOD_DELIVERY'
  | 'PORTFOLIO_WEBSITE'
  | 'ACCOUNTING_PLATFORM'
  | 'TASK_MANAGEMENT'
  | 'EXPENSE_TRACKER'
  | 'MARKETPLACE'
  | 'GENERIC_APPLICATION';

export type LiveGateCategoryId =
  | 'AUTHENTICATION'
  | 'USER_ROLES'
  | 'PERMISSIONS'
  | 'PLATFORM_TARGETS'
  | 'PAYMENTS'
  | 'BRANDING'
  | 'UI_STYLE'
  | 'COLOR_SCHEME'
  | 'NOTIFICATIONS'
  | 'DATA_STORAGE'
  | 'INTEGRATIONS'
  | 'THIRD_PARTY_SERVICES'
  | 'OFFLINE_REQUIREMENTS'
  | 'SECURITY_REQUIREMENTS'
  | 'PRIVACY_REQUIREMENTS'
  | 'REPORTING_ANALYTICS'
  | 'ADMIN_REQUIREMENTS'
  | 'DEPLOYMENT_TARGETS'
  | 'FAILURE_HANDLING'
  | 'SUCCESS_CRITERIA';

export type LiveGateDecision = 'PROCEED' | 'ASK_QUESTIONS' | 'WAIT_FOR_ANSWERS';

export interface LiveGateCategoryDefinition {
  id: LiveGateCategoryId;
  label: string;
  priority: ClarifyingQuestionPriority;
  blocksPlanning: boolean;
  detectionPatterns: readonly RegExp[];
  skipArchetypes: readonly ProjectArchetype[];
  assumptionIfGuessed: string;
  question: string;
  whyItMatters: string;
  consequenceIfAssumed: string;
}

export interface ClarifyingAnswerRecord {
  categoryId: LiveGateCategoryId;
  answer: string;
  recordedAt: number;
  source: 'USER' | 'VAULT';
}

export interface AssumptionPreventedEvent {
  eventType: 'ASSUMPTION_PREVENTED';
  category: LiveGateCategoryId;
  assumption: string;
  resolution: 'ASKED_USER';
}

export interface ClarifyingLiveGateInput {
  userPrompt: string;
  requestId?: string;
  projectId?: string;
  conversationAnswers?: readonly ClarifyingAnswerRecord[];
  supplementalEvidence?: string;
  requiresBuildIntent?: boolean;
}

export interface ClarifyingLiveGateResult {
  readOnly: true;
  planningBlocked: boolean;
  buildBlocked: boolean;
  gateDecision: LiveGateDecision;
  projectArchetype: ProjectArchetype;
  applicableCategoryCount: number;
  detectedCategoryCount: number;
  missingCategoryCount: number;
  criticalMissingCount: number;
  requirementCompletenessScore: number;
  confidenceToProceed: number;
  answeredCategories: LiveGateCategoryId[];
  detectedCategories: LiveGateCategoryId[];
  missingCategories: LiveGateCategoryId[];
  missingCriticalCategories: LiveGateCategoryId[];
  recommendedQuestions: LiveGateQuestionDefinition[];
  assumptionsPreventedEvents: AssumptionPreventedEvent[];
  clarificationMessage: string;
  cacheKey: string;
}

export interface ClarifyingLiveGateScenario {
  id: string;
  prompt: string;
  expectedMissingCategories: LiveGateCategoryId[];
  expectedBlocked: boolean;
  answerPatch?: Partial<Record<LiveGateCategoryId, string>>;
}
