/**
 * DevPulse V2 Phase 13.6 — Learning Visibility Engine types.
 * Visibility only — observed patterns and lessons without self-learning or model modification.
 */

export const LEARNING_VISIBILITY_ENGINE_PASS_TOKEN =
  'DEVPULSE_V2_LEARNING_VISIBILITY_ENGINE_FOUNDATION_V1_PASS';
export const LEARNING_VISIBILITY_ENGINE_OWNER_MODULE = 'devpulse_v2_learning_visibility_engine';

export type LearningCategory =
  | 'BLOCKER'
  | 'FAILURE'
  | 'RECOMMENDATION'
  | 'PATTERN'
  | 'MEMORY'
  | 'IMPROVEMENT';
export type LearningConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface LearningObservation {
  observationId: string;
  text: string;
  sourceSystem: string;
  visibilityOnly: true;
}

export interface LearningPattern {
  patternId: string;
  title: string;
  description: string;
  frequency: number;
  visibilityOnly: true;
}

export interface LearningRecommendation {
  recommendationId: string;
  text: string;
  sourceSystem: string;
  frequency: number;
  visibilityOnly: true;
}

export interface LearningRecord {
  learningId: string;
  category: LearningCategory;
  observation: string;
  pattern: string;
  frequency: number;
  confidence: LearningConfidence;
  recommendation: string;
  summary: string;
  visibilityOnly: true;
}

export interface LearningAnalysis {
  query: string;
  records: LearningRecord[];
  patterns: LearningPattern[];
  observations: LearningObservation[];
  recommendations: LearningRecommendation[];
  recurringFailureCount: number;
  recurringBlockerCount: number;
  patternCount: number;
}

export interface LearningVisibilityResult {
  query: string;
  analysis: LearningAnalysis;
  responseText: string;
}

export interface LearningVisibilityDiagnostics {
  learningVisibilityActive: boolean;
  learningCount: number;
  patternCount: number;
  recurringFailureCount: number;
  recurringBlockerCount: number;
  lastLearningQuery: string | null;
}

export const LEARNING_VISIBILITY_QUESTION_SIGNALS = [
  'what did we learn',
  'recurring blockers',
  'recurring failures',
  'recurring recommendations',
  'what should we remember',
  'what should improve',
  'patterns exist',
  'learned',
  'learning',
  'patterns',
  'recurring',
  'remember',
  'improve',
  'observed',
  'lessons',
] as const;

export const FORBIDDEN_LEARNING_VISIBILITY_DUPLICATES = [
  'learning_brain',
  'self_learning_engine',
  'brain_v2',
  'learning_tracker',
  'learning_runtime',
  'learning_memory',
  'second_learning_visibility_engine',
] as const;

export function isLearningVisibilityQuestion(question: string): boolean {
  const lower = question.toLowerCase().trim();

  if (lower.includes('what did we learn')) return true;
  if (lower.includes('recurring blockers')) return true;
  if (lower.includes('recurring failures')) return true;
  if (lower.includes('recurring recommendations')) return true;
  if (lower.includes('what should we remember')) return true;
  if (lower.includes('what should improve')) return true;
  if (lower.includes('what patterns exist') || lower.includes('patterns exist')) return true;

  const matches = LEARNING_VISIBILITY_QUESTION_SIGNALS.some((s) => lower.includes(s));
  if (!matches) return false;

  if (lower.includes('self-learning') || lower.includes('self learning') || lower.includes('self evolution')) return false;
  if (lower.startsWith('why ') || (lower.includes(' why ') && !lower.includes('learn'))) return false;
  if (lower.includes('what failed') || lower.includes('failures exist') || lower.includes('most severe failure')) return false;
  if (lower.includes('how far') || lower.includes('percentage complete')) return false;
  if (lower.includes('recall') && lower.includes('memory')) return false;
  if (lower.includes('shared memory') && lower.includes('remember')) return false;
  if (lower.includes('recommended action') || lower.includes('next action')) return false;

  return true;
}
